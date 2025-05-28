/**
 * Backpressure Controller Implementation
 * =====================================
 * 
 * Manages flow control in streaming operations to prevent memory overflow
 * and ensure stable performance under high throughput conditions.
 */

import { BackpressureController, MemoryStats } from '../types';
import { getMemoryStats } from '../utils/memory-utils';

/**
 * Backpressure state enumeration
 */
export enum BackpressureState {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical',
  BLOCKED = 'blocked'
}

/**
 * Backpressure event types
 */
export interface BackpressureEvent {
  type: 'pressure_start' | 'pressure_end' | 'buffer_full' | 'memory_critical';
  timestamp: number;
  state: BackpressureState;
  bufferLevel: number;
  memoryUsage: number;
  details?: Record<string, any>;
}

/**
 * Configuration for backpressure controller
 */
export interface BackpressureConfig {
  warningThreshold: number;     // 0.7 = 70% buffer utilization
  criticalThreshold: number;    // 0.9 = 90% buffer utilization
  blockingThreshold: number;    // 0.95 = 95% buffer utilization
  memoryThreshold: number;      // Memory usage threshold
  releaseThreshold: number;     // 0.5 = Release pressure at 50%
  checkInterval: number;        // Milliseconds between checks
  enableLogging: boolean;       // Enable debug logging
}

/**
 * Default backpressure configuration
 */
const DEFAULT_CONFIG: BackpressureConfig = {
  warningThreshold: 0.7,
  criticalThreshold: 0.9,
  blockingThreshold: 0.95,
  memoryThreshold: 0.8,
  releaseThreshold: 0.5,
  checkInterval: 100,
  enableLogging: false
};

/**
 * Implementation of backpressure controller
 */
export class BackpressureControllerImpl implements BackpressureController {
  private config: BackpressureConfig;
  private logger?: any;
  
  // State management
  private currentState: BackpressureState = BackpressureState.NORMAL;
  private isPaused = false;
  private bufferLevel = 0;
  private maxBufferSize = 1000;
  private manuallyPaused = false; // Track if manually paused
  
  // Event handling
  private pressureCallbacks: (() => void)[] = [];
  private eventHistory: BackpressureEvent[] = [];
  
  // Monitoring
  private checkTimer?: NodeJS.Timeout;
  private lastCheck = 0;
  private pressureStartTime = 0;
  private totalPressureTime = 0;
  
  // Statistics
  private stats = {
    pressureEvents: 0,
    totalPressureTime: 0,
    longestPressureEvent: 0,
    bufferOverflows: 0,
    memoryWarnings: 0
  };
  
  constructor(config: Partial<BackpressureConfig> = {}, dependencies: {
    logger?: any;
    maxBufferSize?: number;
  } = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = dependencies.logger;
    this.maxBufferSize = dependencies.maxBufferSize || 1000;
    
    this.startMonitoring();
  }
  
  /**
   * Pause stream processing
   */
  pause(): void {
    if (!this.isPaused) {
      this.isPaused = true;
      this.manuallyPaused = true;
      this.updateState(BackpressureState.BLOCKED);
      this.emitEvent('pressure_start');
      
      if (this.logger && this.config.enableLogging) {
        this.logger.warn('Stream paused due to backpressure').catch(() => {});
      }
    }
  }
  
  /**
   * Resume stream processing
   */
  resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      this.manuallyPaused = false;
      // Calculate state based on current conditions when resuming
      const calculatedState = this.calculateState();
      this.updateState(calculatedState);
      this.emitEvent('pressure_end');
      
      if (this.logger && this.config.enableLogging) {
        this.logger.info('Stream resumed after backpressure release').catch(() => {});
      }
    }
  }
  
  /**
   * Wait for pressure to be relieved
   */
  async drain(): Promise<void> {
    if (!this.isPaused) {
      return; // Already drained
    }
    
    return new Promise<void>((resolve) => {
      const checkDrained = () => {
        if (!this.isPaused) {
          resolve();
        } else {
          setTimeout(checkDrained, this.config.checkInterval);
        }
      };
      
      checkDrained();
    });
  }
  
  /**
   * Get current buffer level (0.0 to 1.0)
   */
  getBufferLevel(): number {
    return Math.max(0, Math.min(this.bufferLevel / this.maxBufferSize, 1.0));
  }
  
  /**
   * Get current memory usage
   */
  getMemoryUsage(): MemoryStats | undefined {
    return getMemoryStats();
  }
  
  /**
   * Register callback for pressure events
   */
  onPressure(callback: () => void): void {
    this.pressureCallbacks.push(callback);
  }
  
  /**
   * Set backpressure threshold
   */
  setThreshold(threshold: number): void {
    this.config.criticalThreshold = Math.max(0, Math.min(1, threshold));
    
    if (this.logger && this.config.enableLogging) {
      this.logger.debug('Backpressure threshold updated', { 
        threshold: this.config.criticalThreshold 
      }).catch(() => {});
    }
  }
  
  /**
   * Get current threshold
   */
  getThreshold(): number {
    return this.config.criticalThreshold;
  }
  
  /**
   * Update buffer level (called by stream processors)
   */
  updateBufferLevel(level: number): void {
    // Ensure buffer level is not negative
    this.bufferLevel = Math.max(0, level);
    this.checkPressure();
  }
  
  /**
   * Get current backpressure state
   */
  getCurrentState(): BackpressureState {
    return this.currentState;
  }
  
  /**
   * Get pressure statistics
   */
  getStatistics(): {
    pressureEvents: number;
    totalPressureTime: number;
    averagePressureTime: number;
    longestPressureEvent: number;
    bufferOverflows: number;
    memoryWarnings: number;
    currentState: BackpressureState;
    isPaused: boolean;
  } {
    const currentPressureTime = this.pressureStartTime > 0 
      ? Date.now() - this.pressureStartTime 
      : 0;
    
    const totalTime = this.stats.totalPressureTime + currentPressureTime;
    
    return {
      pressureEvents: this.stats.pressureEvents,
      totalPressureTime: totalTime,
      averagePressureTime: this.stats.pressureEvents > 0 
        ? totalTime / this.stats.pressureEvents 
        : 0,
      longestPressureEvent: Math.max(this.stats.longestPressureEvent, currentPressureTime),
      bufferOverflows: this.stats.bufferOverflows,
      memoryWarnings: this.stats.memoryWarnings,
      currentState: this.currentState,
      isPaused: this.isPaused
    };
  }
  
  /**
   * Get recent events
   */
  getEventHistory(limit: number = 10): BackpressureEvent[] {
    return this.eventHistory.slice(-limit);
  }
  
  /**
   * Stop monitoring and cleanup
   */
  stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }
    
    this.pressureCallbacks = [];
    this.eventHistory = [];
    
    if (this.logger && this.config.enableLogging) {
      this.logger.debug('Backpressure controller stopped').catch(() => {});
    }
  }
  
  /**
   * Start monitoring for backpressure conditions
   */
  private startMonitoring(): void {
    this.checkTimer = setInterval(() => {
      this.checkPressure();
    }, this.config.checkInterval);
    
    if (this.logger && this.config.enableLogging) {
      this.logger.debug('Backpressure monitoring started', { 
        interval: this.config.checkInterval 
      }).catch(() => {});
    }
  }
  
  /**
   * Check for backpressure conditions
   */
  private checkPressure(): void {
    const now = Date.now();
    this.lastCheck = now;
    
    const bufferUtilization = this.getBufferLevel();
    const memoryStats = getMemoryStats();
    // Handle case where memory stats are unavailable (e.g., in test environment)
    if (!memoryStats) {
      // Use buffer-only pressure detection
      this.applyPressureControls(bufferUtilization, 0);
      const newState = this.calculateState(bufferUtilization, 0);
      if (newState !== this.currentState) {
        this.updateState(newState);
      }
      return;
    }
    
    const memoryUtilization = memoryStats.used / memoryStats.total;
    
    // Apply backpressure controls first
    this.applyPressureControls(bufferUtilization, memoryUtilization);
    
    // Then determine appropriate state based on current conditions
    const newState = this.calculateState(bufferUtilization, memoryUtilization);
    
    // Update state to reflect current conditions
    if (newState !== this.currentState) {
      this.updateState(newState);
    }
    
    // Log periodic status if enabled
    if (this.logger && this.config.enableLogging && now % 10000 < this.config.checkInterval) {
      this.logger.debug('Backpressure status', {
        state: this.currentState,
        bufferLevel: bufferUtilization.toFixed(3),
        memoryUsage: memoryUtilization.toFixed(3),
        isPaused: this.isPaused
      }).catch(() => {});
    }
  }
  
  /**
   * Calculate appropriate backpressure state based purely on current conditions
   */
  private calculateState(
    bufferUtilization?: number, 
    memoryUtilization?: number
  ): BackpressureState {
    const bufferLevel = bufferUtilization ?? this.getBufferLevel();
    let memoryLevel = memoryUtilization;
    
    // Handle case where memory stats are unavailable
    if (memoryLevel === undefined) {
      const memoryStats = getMemoryStats();
      memoryLevel = memoryStats ? (memoryStats.used / memoryStats.total) : 0;
    }
    
    // Calculate state purely based on current levels (ignore pause state)
    if (bufferLevel >= this.config.blockingThreshold || memoryLevel >= this.config.memoryThreshold) {
      return BackpressureState.BLOCKED;
    } else if (bufferLevel >= this.config.criticalThreshold || memoryLevel >= this.config.memoryThreshold * 0.9) {
      return BackpressureState.CRITICAL;
    } else if (bufferLevel >= this.config.warningThreshold || memoryLevel >= this.config.memoryThreshold * 0.8) {
      return BackpressureState.WARNING;
    } else {
      return BackpressureState.NORMAL;
    }
  }
  
  /**
   * Update backpressure state and handle transitions
   */
  private updateState(newState: BackpressureState): void {
    const previousState = this.currentState;
    this.currentState = newState;
    
    // Handle pressure start/end events
    if (previousState === BackpressureState.NORMAL && newState !== BackpressureState.NORMAL) {
      this.pressureStartTime = Date.now();
      this.stats.pressureEvents++;
    } else if (previousState !== BackpressureState.NORMAL && newState === BackpressureState.NORMAL) {
      if (this.pressureStartTime > 0) {
        const pressureDuration = Date.now() - this.pressureStartTime;
        this.stats.totalPressureTime += pressureDuration;
        this.stats.longestPressureEvent = Math.max(this.stats.longestPressureEvent, pressureDuration);
        this.pressureStartTime = 0;
      }
    }
    
    if (this.logger && this.config.enableLogging && previousState !== newState) {
      const memoryStats = getMemoryStats();
      this.logger.info('Backpressure state changed', {
        from: previousState,
        to: newState,
        bufferLevel: this.getBufferLevel(),
        memoryUsage: memoryStats ? (memoryStats.used / memoryStats.total) : 0
      }).catch(() => {});
    }
  }
  
  /**
   * Apply backpressure controls based on current conditions
   */
  private applyPressureControls(bufferUtilization: number, memoryUtilization: number): void {
    // Determine if conditions warrant pausing
    const shouldBePaused = bufferUtilization >= this.config.blockingThreshold || 
                          memoryUtilization >= this.config.memoryThreshold;
    
    // Determine if conditions allow resuming (use release threshold for hysteresis)
    const shouldBeResumed = bufferUtilization <= this.config.releaseThreshold && 
                           memoryUtilization <= this.config.memoryThreshold * 0.7;
    
    // Handle automatic pausing - only auto-pause if not manually paused
    if (shouldBePaused && !this.isPaused && !this.manuallyPaused) {
      this.isPaused = true;
      if (bufferUtilization >= this.config.blockingThreshold) {
        this.stats.bufferOverflows++;
        this.emitEvent('buffer_full', { bufferLevel: bufferUtilization });
      }
      if (memoryUtilization >= this.config.memoryThreshold) {
        this.stats.memoryWarnings++;
        this.emitEvent('memory_critical', { memoryUsage: memoryUtilization });
      }
    }
    
    // Handle automatic resuming - only auto-resume if auto-paused (not manually paused)
    if (shouldBeResumed && this.isPaused && !this.manuallyPaused) {
      this.isPaused = false;
    }
  }
  
  /**
   * Emit backpressure event
   */
  private emitEvent(type: BackpressureEvent['type'], details?: Record<string, any>): void {
    const memoryStats = getMemoryStats();
    const event: BackpressureEvent = {
      type,
      timestamp: Date.now(),
      state: this.currentState,
      bufferLevel: this.getBufferLevel(),
      memoryUsage: memoryStats ? (memoryStats.used / memoryStats.total) : 0,
      details
    };
    
    this.eventHistory.push(event);
    
    // Keep only recent events
    if (this.eventHistory.length > 100) {
      this.eventHistory = this.eventHistory.slice(-50);
    }
    
    // Notify callbacks
    this.pressureCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        if (this.logger) {
          this.logger.warn('Backpressure callback error', error).catch(() => {});
        }
      }
    });
  }
}

/**
 * Create a backpressure controller
 */
export function createBackpressureController(
  config: Partial<BackpressureConfig> = {},
  dependencies: { logger?: any; maxBufferSize?: number } = {}
): BackpressureController {
  return new BackpressureControllerImpl(config, dependencies);
}

/**
 * Create a backpressure controller with enhanced monitoring
 */
export function createEnhancedBackpressureController(
  config: Partial<BackpressureConfig> = {},
  dependencies: { 
    logger?: any; 
    maxBufferSize?: number;
    enableDetailedLogging?: boolean;
    metricsCallback?: (stats: any) => void;
  } = {}
): BackpressureController {
  const enhancedConfig = {
    ...config,
    enableLogging: dependencies.enableDetailedLogging ?? config.enableLogging ?? false
  };
  
  const controller = new BackpressureControllerImpl(enhancedConfig, dependencies);
  
  // Add metrics reporting if callback provided
  if (dependencies.metricsCallback) {
    setInterval(() => {
      const stats = (controller as BackpressureControllerImpl).getStatistics();
      dependencies.metricsCallback!(stats);
    }, 5000);
  }
  
  return controller;
}
