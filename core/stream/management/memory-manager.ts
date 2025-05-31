/**
 * Memory Manager Implementation
 * ============================
 * 
 * Production implementation of memory management for stream processing.
 * Provides buffer management, garbage collection control, and memory optimization.
 */

import { getMemoryStats, isMemoryPressure } from '../utils/memory-utils';

export interface MemoryManagerConfig {
  enabled?: boolean;
  strategy?: MemoryStrategy;
  maxMemoryUsage?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  monitorInterval?: number;
  enableAutoGC?: boolean;
  gcThreshold?: number;
  enableLeakDetection?: boolean;
  adaptiveResizing?: boolean;
  maxBufferGrowth?: number;
}

export enum MemoryStrategy {
  CONSERVATIVE = 'CONSERVATIVE',
  BALANCED = 'BALANCED',
  AGGRESSIVE = 'AGGRESSIVE',
  ADAPTIVE = 'ADAPTIVE'
}

export interface MemoryStats {
  used: number;
  available: number;
  total: number;
  bufferSize: number;
  gcCollections: number;
}

export interface BufferStats {
  totalAllocated: number;
  totalReleased: number;
  activeBuffers: number;
  peakUsage: number;
  averageBufferSize: number;
  totalBufferMemory: number;
}

export interface ManagementStats {
  strategy: MemoryStrategy | string;
  gcTriggers: number;
  pressureEvents: number;
  totalPressureTime: number;
  averagePressureTime: number;
  leaksDetected: number;
  bufferAdjustments: number;
  peakMemoryUsage: number;
  averageMemoryUsage: number;
}

export interface MemoryEvent {
  type: 'BUFFER_REGISTER' | 'BUFFER_UPDATE' | 'BUFFER_RELEASE' | 'GC_TRIGGER' | 'PRESSURE_START' | 'PRESSURE_END' | 'LEAK_DETECTED';
  timestamp: number;
  bufferId?: string;
  size?: number;
  memoryUsage: number;
  details?: string;
}

interface BufferInfo {
  id: string;
  currentSize: number;
  maxSize?: number;
  allocatedTime: number;
  lastAccessTime: number;
  adjustmentCount: number;
}

export class MemoryManager {
  private config: Required<MemoryManagerConfig>;
  private strategy: MemoryStrategy;
  private buffers = new Map<string, BufferInfo>();
  private logger?: any;
  
  // Statistics tracking
  private totalAllocated = 0;
  private totalReleased = 0;
  private peakUsage = 0;
  private gcTriggers = 0;
  private pressureEvents = 0;
  private totalPressureTime = 0;
  private leaksDetected = 0;
  private bufferAdjustments = 0;
  private peakMemoryUsage = 0;
  private averageMemoryUsage = 0;
  
  // Event tracking
  private eventHistory: MemoryEvent[] = [];
  private pressureCallbacks: (() => void)[] = [];
  private gcCallbacks: (() => void)[] = [];
  
  // Monitoring
  private monitoringTimer?: NodeJS.Timeout;
  private pressureStartTime?: number;
  private lastGCTime = 0;
  private GC_RATE_LIMIT = 1000; // 1 second
  
  // Memory usage tracking for leak detection
  private memoryUsageHistory: number[] = [];
  private memoryUsageSum = 0;
  private memoryUsageCount = 0;
  
  constructor(config: MemoryManagerConfig = {}, options: any = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      strategy: config.strategy ?? MemoryStrategy.BALANCED,
      maxMemoryUsage: config.maxMemoryUsage ?? 500 * 1024 * 1024, // 500MB default
      warningThreshold: config.warningThreshold ?? 0.7,
      criticalThreshold: config.criticalThreshold ?? 0.9,
      monitorInterval: config.monitorInterval ?? 1000,
      enableAutoGC: config.enableAutoGC ?? true,
      gcThreshold: config.gcThreshold ?? 0.8,
      enableLeakDetection: config.enableLeakDetection ?? true,
      adaptiveResizing: config.adaptiveResizing ?? false,
      maxBufferGrowth: config.maxBufferGrowth ?? 2.0
    };
    
    this.strategy = this.config.strategy;
    this.logger = options.logger;
    
    // Start monitoring if enabled
    if (this.config.enabled && this.config.monitorInterval > 0) {
      this.startMonitoring();
    }
  }
  
  registerBuffer(id: string, size: number, maxSize?: number): void {
    if (!id || size < 0) return;
    
    const bufferInfo: BufferInfo = {
      id,
      currentSize: size,
      maxSize,
      allocatedTime: Date.now(),
      lastAccessTime: Date.now(),
      adjustmentCount: 0
    };
    
    this.buffers.set(id, bufferInfo);
    this.totalAllocated += size;
    this.updatePeakUsage();
    
    this.addEvent({
      type: 'BUFFER_REGISTER',
      timestamp: Date.now(),
      bufferId: id,
      size,
      memoryUsage: this.getCurrentMemoryUsage(),
      details: `Registered buffer: ${id}, size: ${size}`
    });
    
    if (this.logger) {
      this.logger.debug('Buffer registered', { id, size, maxSize }).catch(() => {});
    }
  }
  
  updateBufferSize(id: string, newSize: number): boolean {
    const buffer = this.buffers.get(id);
    if (!buffer || newSize < 0) return false;
    
    const oldSize = buffer.currentSize;
    const growthRatio = newSize / oldSize;
    
    // Check growth limits
    if (growthRatio > this.config.maxBufferGrowth) {
      if (this.logger) {
        this.logger.warn('Buffer growth limit exceeded', { 
          id, 
          oldSize, 
          newSize, 
          growthRatio, 
          limit: this.config.maxBufferGrowth 
        }).catch(() => {});
      }
      return false;
    }
    
    // Check memory limits
    const memoryIncrease = newSize - oldSize;
    const currentMemory = this.getCurrentMemoryUsage();
    if (currentMemory + memoryIncrease > this.config.maxMemoryUsage) {
      if (this.logger) {
        this.logger.warn('Memory limit would be exceeded', { 
          id, 
          currentMemory, 
          memoryIncrease, 
          limit: this.config.maxMemoryUsage 
        }).catch(() => {});
      }
      return false;
    }
    
    // Update buffer
    buffer.currentSize = newSize;
    buffer.lastAccessTime = Date.now();
    buffer.adjustmentCount++;
    
    this.totalAllocated += memoryIncrease;
    this.bufferAdjustments++;
    this.updatePeakUsage();
    
    this.addEvent({
      type: 'BUFFER_UPDATE',
      timestamp: Date.now(),
      bufferId: id,
      size: newSize,
      memoryUsage: this.getCurrentMemoryUsage(),
      details: `Updated buffer: ${id}, ${oldSize} -> ${newSize}`
    });
    
    if (this.logger) {
      this.logger.debug('Buffer updated', { id, oldSize, newSize }).catch(() => {});
    }
    
    return true;
  }
  
  releaseBuffer(id: string): boolean {
    const buffer = this.buffers.get(id);
    if (!buffer) return false;
    
    this.buffers.delete(id);
    this.totalReleased += buffer.currentSize;
    
    this.addEvent({
      type: 'BUFFER_RELEASE',
      timestamp: Date.now(),
      bufferId: id,
      size: buffer.currentSize,
      memoryUsage: this.getCurrentMemoryUsage(),
      details: `Released buffer: ${id}, size: ${buffer.currentSize}`
    });
    
    if (this.logger) {
      this.logger.debug('Buffer released', { id, size: buffer.currentSize }).catch(() => {});
    }
    
    return true;
  }
  
  getOptimalBufferSize(currentSize: number, usage?: number): number {
    const memoryStats = this.getMemoryStats();
    const memoryRatio = memoryStats ? memoryStats.used / memoryStats.total : 0.5;
    const usageRatio = usage || 0.8;
    
    let multiplier = 1.0;
    
    switch (this.strategy) {
      case MemoryStrategy.CONSERVATIVE:
        // Reduce buffer size under pressure
        if (memoryRatio > 0.6) {
          multiplier = 0.75;
        } else if (usageRatio > 0.9) {
          multiplier = 1.1;
        }
        break;
        
      case MemoryStrategy.AGGRESSIVE:
        // Increase buffer size when memory allows
        if (memoryRatio < 0.5 && usageRatio > 0.8) {
          multiplier = 1.5;
        } else if (memoryRatio > 0.8) {
          multiplier = 0.8;
        }
        break;
        
      case MemoryStrategy.BALANCED:
        // Moderate adjustments
        if (memoryRatio > 0.7) {
          multiplier = 0.9;
        } else if (memoryRatio <= 0.5 && usageRatio > 0.9) {
          multiplier = 1.2;
        }
        break;
        
      case MemoryStrategy.ADAPTIVE:
        // Dynamic adjustment based on current conditions
        const pressureWeight = Math.min(memoryRatio * 2, 1);
        const usageWeight = Math.min(usageRatio, 1);
        multiplier = 1.0 + (usageWeight - pressureWeight) * 0.3;
        break;
    }
    
    const newSize = Math.floor(currentSize * multiplier);
    return Math.max(256, Math.min(newSize, 64 * 1024)); // Bounds: 256B to 64KB
  }
  
  triggerGC(): void {
    const now = Date.now();
    
    // Rate limit GC triggers
    if (now - this.lastGCTime < this.GC_RATE_LIMIT) {
      return;
    }
    
    this.lastGCTime = now;
    this.gcTriggers++;
    
    // Try to trigger garbage collection
    if (typeof global !== 'undefined' && global.gc) {
      try {
        global.gc();
      } catch (error) {
        if (this.logger) {
          this.logger.warn('Failed to trigger GC', error).catch(() => {});
        }
      }
    }
    
    this.addEvent({
      type: 'GC_TRIGGER',
      timestamp: now,
      memoryUsage: this.getCurrentMemoryUsage(),
      details: 'Manual GC trigger'
    });
    
    // Notify GC callbacks
    this.notifyGCCallbacks();
    
    if (this.logger) {
      this.logger.debug('Garbage collection triggered').catch(() => {});
    }
  }
  
  getMemoryStats(): MemoryStats | undefined {
    try {
      return getMemoryStats();
    } catch (error) {
      if (this.logger) {
        this.logger.warn('Failed to get memory stats', error).catch(() => {});
      }
      return undefined;
    }
  }
  
  getBufferStats(): BufferStats {
    let totalBufferMemory = 0;
    let maxSize = 0;
    
    for (const buffer of this.buffers.values()) {
      totalBufferMemory += buffer.currentSize;
      maxSize = Math.max(maxSize, buffer.currentSize);
    }
    
    return {
      totalAllocated: this.totalAllocated,
      totalReleased: this.totalReleased,
      activeBuffers: this.buffers.size,
      peakUsage: this.peakUsage,
      averageBufferSize: this.buffers.size > 0 ? totalBufferMemory / this.buffers.size : 0,
      totalBufferMemory
    };
  }
  
  getManagementStats(): ManagementStats {
    return {
      strategy: this.strategy,
      gcTriggers: this.gcTriggers,
      pressureEvents: this.pressureEvents,
      totalPressureTime: this.totalPressureTime,
      averagePressureTime: this.pressureEvents > 0 ? this.totalPressureTime / this.pressureEvents : 0,
      leaksDetected: this.leaksDetected,
      bufferAdjustments: this.bufferAdjustments,
      peakMemoryUsage: this.peakMemoryUsage,
      averageMemoryUsage: this.averageMemoryUsage
    };
  }
  
  onMemoryPressure(callback: () => void): void {
    this.pressureCallbacks.push(callback);
  }
  
  onGC(callback: () => void): void {
    this.gcCallbacks.push(callback);
  }
  
  getEventHistory(limit?: number): MemoryEvent[] {
    const events = [...this.eventHistory];
    return limit ? events.slice(-limit) : events;
  }
  
  setStrategy(strategy: MemoryStrategy): void {
    const oldStrategy = this.strategy;
    this.strategy = strategy;
    
    if (this.logger) {
      this.logger.info('Memory strategy changed', { from: oldStrategy, to: strategy }).catch(() => {});
    }
  }
  
  stop(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
    
    if (this.logger) {
      this.logger.debug('Memory manager stopped').catch(() => {});
    }
  }
  
  /**
   * Start monitoring memory usage and pressure
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.checkMemoryPressure();
      this.updateMemoryStatistics();
      
      if (this.config.enableLeakDetection) {
        this.checkForMemoryLeaks();
      }
      
      if (this.config.adaptiveResizing) {
        this.performAdaptiveResizing();
      }
    }, this.config.monitorInterval);
  }
  
  /**
   * Check for memory pressure and trigger callbacks
   */
  private checkMemoryPressure(): void {
    try {
      const memoryStats = this.getMemoryStats();
      if (!memoryStats) return;
      
      const memoryRatio = memoryStats.used / memoryStats.total;
      const isUnderPressure = memoryRatio > this.config.warningThreshold;
      
      if (isUnderPressure && !this.pressureStartTime) {
        // Pressure started
        this.pressureStartTime = Date.now();
        this.pressureEvents++;
        
        this.addEvent({
          type: 'PRESSURE_START',
          timestamp: Date.now(),
          memoryUsage: memoryStats.used,
          details: `Memory pressure started: ${(memoryRatio * 100).toFixed(1)}%`
        });
        
        // Auto GC if enabled and critical threshold reached
        if (this.config.enableAutoGC && memoryRatio > this.config.gcThreshold) {
          this.triggerGC();
        }
        
        this.notifyPressureCallbacks();
        
      } else if (!isUnderPressure && this.pressureStartTime) {
        // Pressure ended
        this.totalPressureTime += Date.now() - this.pressureStartTime;
        this.pressureStartTime = undefined;
        
        this.addEvent({
          type: 'PRESSURE_END',
          timestamp: Date.now(),
          memoryUsage: memoryStats.used,
          details: `Memory pressure ended: ${(memoryRatio * 100).toFixed(1)}%`
        });
      }
    } catch (error) {
      if (this.logger) {
        this.logger.warn('Error checking memory pressure', error).catch(() => {});
      }
    }
  }
  
  /**
   * Update memory usage statistics
   */
  private updateMemoryStatistics(): void {
    const memoryStats = this.getMemoryStats();
    if (!memoryStats) return;
    
    this.memoryUsageSum += memoryStats.used;
    this.memoryUsageCount++;
    this.averageMemoryUsage = this.memoryUsageSum / this.memoryUsageCount;
    this.peakMemoryUsage = Math.max(this.peakMemoryUsage, memoryStats.used);
    
    // Keep limited history for leak detection
    this.memoryUsageHistory.push(memoryStats.used);
    if (this.memoryUsageHistory.length > 10) {
      this.memoryUsageHistory.shift();
    }
  }
  
  /**
   * Check for potential memory leaks
   */
  private checkForMemoryLeaks(): void {
    if (this.memoryUsageHistory.length < 5) return;
    
    // Check if memory usage is consistently high
    const recentUsage = this.memoryUsageHistory.slice(-5);
    const isConsistentlyHigh = recentUsage.every(usage => 
      usage / this.config.maxMemoryUsage > this.config.criticalThreshold
    );
    
    if (isConsistentlyHigh) {
      this.leaksDetected++;
      
      this.addEvent({
        type: 'LEAK_DETECTED',
        timestamp: Date.now(),
        memoryUsage: recentUsage[recentUsage.length - 1],
        details: 'Potential memory leak detected: consistently high usage'
      });
      
      if (this.logger) {
        this.logger.warn('Potential memory leak detected', {
          recentUsage,
          threshold: this.config.criticalThreshold
        }).catch(() => {});
      }
    }
  }
  
  /**
   * Perform adaptive buffer resizing based on current conditions
   */
  private performAdaptiveResizing(): void {
    if (this.buffers.size === 0) return;
    
    const memoryStats = this.getMemoryStats();
    if (!memoryStats) return;
    
    const memoryRatio = memoryStats.used / memoryStats.total;
    
    // Only resize if memory pressure is significant
    if (memoryRatio < this.config.warningThreshold) return;
    
    let resizedCount = 0;
    const maxResizePerCycle = Math.ceil(this.buffers.size / 4); // Max 25% per cycle
    
    for (const [id, buffer] of this.buffers.entries()) {
      if (resizedCount >= maxResizePerCycle) break;
      
      const newSize = this.getOptimalBufferSize(buffer.currentSize, 0.8);
      
      if (newSize !== buffer.currentSize && newSize < buffer.currentSize) {
        // Only shrink buffers during adaptive resizing to reduce pressure
        if (this.updateBufferSize(id, newSize)) {
          resizedCount++;
        }
      }
    }
    
    if (resizedCount > 0 && this.logger) {
      this.logger.debug('Adaptive buffer resizing completed', {
        resizedCount,
        memoryRatio: (memoryRatio * 100).toFixed(1) + '%'
      }).catch(() => {});
    }
  }
  
  /**
   * Get current memory usage from buffers
   */
  private getCurrentMemoryUsage(): number {
    let totalMemory = 0;
    for (const buffer of this.buffers.values()) {
      totalMemory += buffer.currentSize;
    }
    return totalMemory;
  }
  
  /**
   * Update peak usage tracking
   */
  private updatePeakUsage(): void {
    const currentUsage = this.getCurrentMemoryUsage();
    this.peakUsage = Math.max(this.peakUsage, currentUsage);
  }
  
  /**
   * Add event to history with size limiting
   */
  private addEvent(event: MemoryEvent): void {
    this.eventHistory.push(event);
    
    // Limit history size
    if (this.eventHistory.length > 200) {
      this.eventHistory = this.eventHistory.slice(-200);
    }
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
  
  /**
   * Notify GC callbacks
   */
  private notifyGCCallbacks(): void {
    for (const callback of this.gcCallbacks) {
      try {
        callback();
      } catch (error) {
        if (this.logger) {
          this.logger.warn('GC callback error', error).catch(() => {});
        }
      }
    }
  }
}

export function createMemoryManager(
  config: MemoryManagerConfig = {},
  options: any = {}
): MemoryManager {
  return new MemoryManager(config, options);
}

export function createOptimizedMemoryManager(
  strategy: MemoryStrategy,
  options: {
    maxMemory?: number;
    logger?: any;
  } = {}
): MemoryManager {
  const config: MemoryManagerConfig = {
    strategy,
    maxMemoryUsage: options.maxMemory || 200 * 1024 * 1024,
    enableAutoGC: true,
    enableLeakDetection: true,
    adaptiveResizing: strategy === MemoryStrategy.ADAPTIVE,
    monitorInterval: strategy === MemoryStrategy.AGGRESSIVE ? 500 : 1000
  };
  
  return new MemoryManager(config, { logger: options.logger });
}
