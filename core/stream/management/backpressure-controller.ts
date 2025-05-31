/**
 * Backpressure Controller Implementation
 * =====================================
 * 
 * Production implementation of backpressure management for stream processing.
 * Provides flow control, buffer level monitoring, and pressure detection.
 */

import { BackpressureController, MemoryStats } from '../types';
import { getMemoryStats } from '../utils/memory-utils';

export interface BackpressureConfig {
  enabled?: boolean;
  warningThreshold?: number;
  criticalThreshold?: number;
  blockingThreshold?: number;
  checkInterval?: number;
  enableLogging?: boolean;
}

export enum BackpressureState {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING', 
  CRITICAL = 'CRITICAL',
  BLOCKED = 'BLOCKED'
}

export interface BackpressureEvent {
  type: 'PRESSURE_START' | 'PRESSURE_END' | 'STATE_CHANGE' | 'OVERFLOW';
  timestamp: number;
  state: BackpressureState;
  bufferLevel: number;
  memoryUsage?: number;
  details?: string;
}

export interface BackpressureStatistics {
  currentState: BackpressureState | string;
  pressureEvents: number;
  totalPressureTime: number;
  averagePressureTime: number;
  isPaused: boolean;
  bufferOverflows: number;
  memoryWarnings: number;
}

export class BackpressureControllerImpl implements BackpressureController {
  private config: Required<BackpressureConfig>;
  private currentState: BackpressureState = BackpressureState.NORMAL;
  private isPaused = false;
  private bufferLevel = 0;
  private maxBufferSize: number;
  private threshold: number;
  
  private pressureCallbacks: (() => void)[] = [];
  private eventHistory: BackpressureEvent[] = [];
  private statistics: BackpressureStatistics;
  private monitoringTimer?: NodeJS.Timeout;
  private logger?: any;
  
  // Pressure tracking
  private pressureStartTime?: number;
  private totalPressureTime = 0;
  private pressureEvents = 0;
  private bufferOverflows = 0;
  private memoryWarnings = 0;
  
  // Rate limiting for GC
  private lastGCTime = 0;
  private GC_RATE_LIMIT = 1000; // 1 second
  
  constructor(config: BackpressureConfig = {}, options: any = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      warningThreshold: config.warningThreshold ?? 0.7,
      criticalThreshold: config.criticalThreshold ?? 0.9, 
      blockingThreshold: config.blockingThreshold ?? 0.95,
      checkInterval: config.checkInterval ?? 1000,
      enableLogging: config.enableLogging ?? false
    };
    
    this.maxBufferSize = options.maxBufferSize || 10000;
    this.threshold = this.config.criticalThreshold;
    this.logger = options.logger;
    
    this.statistics = {
      currentState: this.currentState,
      pressureEvents: 0,
      totalPressureTime: 0,
      averagePressureTime: 0,
      isPaused: false,
      bufferOverflows: 0,
      memoryWarnings: 0
    };
    
    // Start monitoring if enabled
    if (this.config.enabled && this.config.checkInterval > 0) {
      this.startMonitoring();
    }
  }
  
  pause(): void {
    if (this.isPaused) return;
    
    this.isPaused = true;
    this.currentState = BackpressureState.BLOCKED;
    this.pressureStartTime = Date.now();
    
    this.addEvent({
      type: 'STATE_CHANGE',
      timestamp: Date.now(),
      state: this.currentState,
      bufferLevel: this.bufferLevel,
      details: 'Manual pause'
    });
    
    this.updateStatistics();
    
    if (this.logger && this.config.enableLogging) {
      this.logger.debug('Backpressure controller paused').catch(() => {});
    }
  }
  
  resume(): void {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    
    // Track pressure duration
    if (this.pressureStartTime) {
      this.totalPressureTime += Date.now() - this.pressureStartTime;
      this.pressureStartTime = undefined;
    }
    
    // Determine new state based on buffer level
    this.updateStateFromBufferLevel();
    
    this.addEvent({
      type: 'STATE_CHANGE',
      timestamp: Date.now(),
      state: this.currentState,
      bufferLevel: this.bufferLevel,
      details: 'Manual resume'
    });
    
    this.updateStatistics();
    
    if (this.logger && this.config.enableLogging) {
      this.logger.debug('Backpressure controller resumed').catch(() => {});
    }
  }
  
  async drain(): Promise<void> {
    while (this.isPaused) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  getBufferLevel(): number {
    return this.maxBufferSize > 0 ? Math.min(this.bufferLevel / this.maxBufferSize, 1.0) : 0;
  }
  
  getMemoryUsage(): MemoryStats | undefined {
    try {
      return getMemoryStats();
    } catch (error) {
      if (this.logger) {
        this.logger.warn('Failed to get memory stats', error).catch(() => {});
      }
      return undefined;
    }
  }
  
  onPressure(callback: () => void): void {
    this.pressureCallbacks.push(callback);
  }
  
  setThreshold(threshold: number): void {
    this.threshold = Math.max(0, Math.min(1, threshold));
  }
  
  getThreshold(): number {
    return this.threshold;
  }
  
  /**
   * Update current buffer level (used by management suite)
   */
  updateBufferLevel(currentLevel: number): void {
    const previousLevel = this.bufferLevel;
    this.bufferLevel = Math.max(0, currentLevel);
    
    const levelRatio = this.getBufferLevel();
    const previousState = this.currentState;
    
    // Check for overflow (when buffer level exceeds blocking threshold)
    if (levelRatio >= this.config.blockingThreshold) {
      this.bufferOverflows++;
      this.addEvent({
        type: 'OVERFLOW',
        timestamp: Date.now(),
        state: this.currentState,
        bufferLevel: levelRatio,
        details: `Buffer overflow: ${(levelRatio * 100).toFixed(1)}% >= ${(this.config.blockingThreshold * 100).toFixed(1)}%`
      });
    }
    
    // Update state based on new level
    this.updateStateFromBufferLevel();
    
    // Auto-pause if above blocking threshold
    if (levelRatio >= this.config.blockingThreshold && !this.isPaused) {
      this.pause();
      this.pressureEvents++;
      this.notifyPressureCallbacks();
    }
    // Auto-resume if below warning threshold and currently paused
    else if (levelRatio < this.config.warningThreshold && this.isPaused) {
      this.resume();
    }
    
    // Track state changes
    if (previousState !== this.currentState) {
      this.addEvent({
        type: 'STATE_CHANGE',
        timestamp: Date.now(),
        state: this.currentState,
        bufferLevel: levelRatio,
        details: `State change from ${previousState} to ${this.currentState}`
      });
    }
    
    this.updateStatistics();
  }
  
  /**
   * Get current state
   */
  getCurrentState(): BackpressureState | string {
    return this.currentState;
  }
  
  /**
   * Get detailed statistics
   */
  getStatistics(): BackpressureStatistics {
    return { ...this.statistics };
  }
  
  /**
   * Get event history
   */
  getEventHistory(limit?: number): BackpressureEvent[] {
    const events = [...this.eventHistory];
    return limit ? events.slice(-limit) : events;
  }
  
  /**
   * Stop monitoring and cleanup
   */
  stop(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
    
    if (this.logger && this.config.enableLogging) {
      this.logger.debug('Backpressure controller stopped').catch(() => {});
    }
  }
  
  /**
   * Start monitoring memory and buffer levels
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.checkMemoryPressure();
    }, this.config.checkInterval);
  }
  
  /**
   * Check for memory pressure and adjust state accordingly
   */
  private checkMemoryPressure(): void {
    try {
      const memoryStats = this.getMemoryUsage();
      if (!memoryStats) return;
      
      const memoryRatio = memoryStats.used / memoryStats.total;
      
      // Memory-based backpressure
      if (memoryRatio > 0.9) {
        this.memoryWarnings++;
        
        if (!this.isPaused) {
          this.addEvent({
            type: 'PRESSURE_START',
            timestamp: Date.now(),
            state: this.currentState,
            bufferLevel: this.getBufferLevel(),
            memoryUsage: memoryRatio,
            details: 'Memory pressure detected'
          });
          
          this.pause();
          this.pressureEvents++;
          this.notifyPressureCallbacks();
        }
      }
    } catch (error) {
      if (this.logger) {
        this.logger.warn('Error checking memory pressure', error).catch(() => {});
      }
    }
  }
  
  /**
   * Update state based on current buffer level
   */
  private updateStateFromBufferLevel(): void {
    const levelRatio = this.getBufferLevel();
    
    if (this.isPaused) {
      this.currentState = BackpressureState.BLOCKED;
    } else if (levelRatio >= this.config.criticalThreshold) {
      this.currentState = BackpressureState.CRITICAL;
    } else if (levelRatio >= this.config.warningThreshold) {
      this.currentState = BackpressureState.WARNING;
    } else {
      this.currentState = BackpressureState.NORMAL;
    }
  }
  
  /**
   * Add event to history with size limiting
   */
  private addEvent(event: BackpressureEvent): void {
    this.eventHistory.push(event);
    
    // Limit history size
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(-100);
    }
  }
  
  /**
   * Update statistics
   */
  private updateStatistics(): void {
    this.statistics = {
      currentState: this.currentState,
      pressureEvents: this.pressureEvents,
      totalPressureTime: this.totalPressureTime,
      averagePressureTime: this.pressureEvents > 0 ? this.totalPressureTime / this.pressureEvents : 0,
      isPaused: this.isPaused,
      bufferOverflows: this.bufferOverflows,
      memoryWarnings: this.memoryWarnings
    };
  }
  
  /**
   * Notify pressure callbacks
   */
  private notifyPressureCallbacks(): void {
    for (const callback of this.pressureCallbacks) {
      try {
        callback();
      } catch (error) {
        if (this.logger) {
          this.logger.warn('Pressure callback error', error).catch(() => {});
        }
      }
    }
  }
}

export function createBackpressureController(
  config: BackpressureConfig = {},
  options: any = {}
): BackpressureController {
  try {
    const controller = new BackpressureControllerImpl(config, options);
    return controller;
  } catch (error) {
    console.error('Failed to create BackpressureController:', error);
    throw error;
  }
}

export function createEnhancedBackpressureController(
  config: BackpressureConfig = {},
  options: any = {}
): BackpressureController {
  try {
    // Enhanced version with additional features
    const enhancedConfig = {
      ...config,
      enableLogging: true,
      checkInterval: config.checkInterval || 500 // More frequent monitoring
    };
    
    const controller = new BackpressureControllerImpl(enhancedConfig, {
      ...options,
      enableDetailedLogging: true
    });
    
    return controller;
  } catch (error) {
    console.error('Failed to create Enhanced BackpressureController:', error);
    // Fall back to basic controller
    return createBackpressureController(config, options);
  }
}
