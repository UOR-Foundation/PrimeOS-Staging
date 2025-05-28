/**
 * Memory Manager Implementation
 * ============================
 * 
 * Advanced memory management for stream processing operations,
 * including garbage collection hints, memory pressure detection,
 * and adaptive buffer management.
 */

import { MemoryStats } from '../types';
import { getMemoryStats, isMemoryPressure } from '../utils/memory-utils';

/**
 * Memory management strategy enumeration
 */
export enum MemoryStrategy {
  CONSERVATIVE = 'conservative',
  BALANCED = 'balanced',
  AGGRESSIVE = 'aggressive',
  ADAPTIVE = 'adaptive'
}

/**
 * Memory event types
 */
export interface MemoryEvent {
  type: 'pressure_start' | 'pressure_end' | 'gc_triggered' | 'buffer_adjusted' | 'leak_detected';
  timestamp: number;
  memoryUsage: MemoryStats;
  details?: Record<string, any>;
}

/**
 * Memory management configuration
 */
export interface MemoryManagerConfig {
  strategy: MemoryStrategy;
  maxMemoryUsage: number;          // Maximum memory usage (bytes)
  warningThreshold: number;        // Warning threshold (0.0-1.0)
  criticalThreshold: number;       // Critical threshold (0.0-1.0)
  gcThreshold: number;             // GC trigger threshold (0.0-1.0)
  monitorInterval: number;         // Monitoring interval (ms)
  enableAutoGC: boolean;           // Enable automatic garbage collection
  enableLeakDetection: boolean;    // Enable memory leak detection
  bufferGrowthLimit: number;       // Maximum buffer growth rate
  adaptiveResizing: boolean;       // Enable adaptive buffer resizing
}

/**
 * Default memory manager configuration
 */
const DEFAULT_CONFIG: MemoryManagerConfig = {
  strategy: MemoryStrategy.BALANCED,
  maxMemoryUsage: 500 * 1024 * 1024, // 500MB
  warningThreshold: 0.7,
  criticalThreshold: 0.9,
  gcThreshold: 0.8,
  monitorInterval: 1000,
  enableAutoGC: true,
  enableLeakDetection: true,
  bufferGrowthLimit: 2.0, // 200% growth max
  adaptiveResizing: true
};

/**
 * Buffer management information
 */
interface BufferInfo {
  id: string;
  size: number;
  lastUsed: number;
  growthRate: number;
  maxSize: number;
}

/**
 * Memory manager implementation
 */
export class MemoryManager {
  private config: MemoryManagerConfig;
  private logger?: any;
  
  // Monitoring state
  private monitorTimer?: NodeJS.Timeout;
  private eventHistory: MemoryEvent[] = [];
  private lastGC = 0;
  private pressureStartTime = 0;
  
  // Buffer tracking
  private buffers = new Map<string, BufferInfo>();
  private bufferStats = {
    totalAllocated: 0,
    totalReleased: 0,
    activeBuffers: 0,
    peakUsage: 0
  };
  
  // Memory statistics
  private stats = {
    gcTriggers: 0,
    pressureEvents: 0,
    totalPressureTime: 0,
    leaksDetected: 0,
    bufferAdjustments: 0,
    peakMemoryUsage: 0,
    averageMemoryUsage: 0,
    memoryReadings: [] as number[]
  };
  
  // Callbacks
  private pressureCallbacks: ((stats: MemoryStats) => void)[] = [];
  private gcCallbacks: (() => void)[] = [];
  
  constructor(config: Partial<MemoryManagerConfig> = {}, dependencies: {
    logger?: any;
  } = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = dependencies.logger;
    
    this.startMonitoring();
  }
  
  /**
   * Register a new buffer for tracking
   */
  registerBuffer(id: string, initialSize: number, maxSize?: number): void {
    this.buffers.set(id, {
      id,
      size: initialSize,
      lastUsed: Date.now(),
      growthRate: 1.0,
      maxSize: maxSize || this.config.maxMemoryUsage / 4
    });
    
    this.bufferStats.totalAllocated += initialSize;
    this.bufferStats.activeBuffers++;
    
    if (this.logger) {
      this.logger.debug('Buffer registered', {
        id,
        initialSize,
        maxSize,
        activeBuffers: this.bufferStats.activeBuffers
      }).catch(() => {});
    }
  }
  
  /**
   * Update buffer size
   */
  updateBufferSize(id: string, newSize: number): boolean {
    const buffer = this.buffers.get(id);
    if (!buffer) {
      if (this.logger) {
        this.logger.warn('Attempted to update unknown buffer', { id }).catch(() => {});
      }
      return false;
    }
    
    const oldSize = buffer.size;
    const growthFactor = newSize / oldSize;
    
    // Check growth limits
    if (growthFactor > this.config.bufferGrowthLimit) {
      if (this.logger) {
        this.logger.warn('Buffer growth exceeds limit', {
          id,
          growthFactor,
          limit: this.config.bufferGrowthLimit
        }).catch(() => {});
      }
      return false;
    }
    
    // Check memory constraints
    const memoryStats = getMemoryStats();
    // Handle case where memory stats are unavailable (e.g., in test environment)
    if (!memoryStats) {
      if (this.logger) {
        this.logger.debug('Memory stats unavailable, allowing buffer resize', { id, newSize }).catch(() => {});
      }
      // Update buffer without memory constraint check
      buffer.size = newSize;
      buffer.lastUsed = Date.now();
      buffer.growthRate = growthFactor;
      this.bufferStats.totalAllocated += (newSize - oldSize);
      this.stats.bufferAdjustments++;
      return true;
    }
    
    const projectedUsage = memoryStats.used + (newSize - oldSize);
    
    if (projectedUsage > this.config.maxMemoryUsage) {
      if (this.logger) {
        this.logger.warn('Buffer resize would exceed memory limit', {
          id,
          currentUsage: memoryStats.used,
          projectedUsage,
          limit: this.config.maxMemoryUsage
        }).catch(() => {});
      }
      return false;
    }
    
    // Update buffer
    buffer.size = newSize;
    buffer.lastUsed = Date.now();
    buffer.growthRate = growthFactor;
    
    this.bufferStats.totalAllocated += (newSize - oldSize);
    this.stats.bufferAdjustments++;
    
    this.emitEvent('buffer_adjusted', {
      bufferId: id,
      oldSize,
      newSize,
      growthFactor
    });
    
    return true;
  }
  
  /**
   * Release a buffer
   */
  releaseBuffer(id: string): boolean {
    const buffer = this.buffers.get(id);
    if (!buffer) {
      return false;
    }
    
    this.bufferStats.totalReleased += buffer.size;
    this.bufferStats.activeBuffers--;
    this.buffers.delete(id);
    
    if (this.logger) {
      this.logger.debug('Buffer released', {
        id,
        size: buffer.size,
        activeBuffers: this.bufferStats.activeBuffers
      }).catch(() => {});
    }
    
    return true;
  }
  
  /**
   * Get optimal buffer size based on current conditions
   */
  getOptimalBufferSize(currentSize: number, usage: number): number {
    const memoryStats = getMemoryStats();
    // Handle case where memory stats are unavailable (e.g., in test environment)
    if (!memoryStats) {
      return currentSize; // Return current size when memory stats unavailable
    }
    
    const memoryPressure = memoryStats.used / memoryStats.total;
    
    let targetSize = currentSize;
    
    switch (this.config.strategy) {
      case MemoryStrategy.CONSERVATIVE:
        // Reduce buffers under any pressure
        if (memoryPressure > 0.6) {
          targetSize = Math.max(currentSize * 0.8, 1024);
        }
        break;
        
      case MemoryStrategy.AGGRESSIVE:
        // Grow buffers aggressively when memory allows
        if (memoryPressure < 0.5 && usage > 0.8) {
          targetSize = Math.min(currentSize * 1.5, this.config.maxMemoryUsage / 10);
        } else if (memoryPressure > 0.8) {
          targetSize = Math.max(currentSize * 0.5, 512);
        }
        break;
        
      case MemoryStrategy.BALANCED:
        // Balanced approach
        if (memoryPressure < 0.6 && usage > 0.9) {
          targetSize = Math.min(currentSize * 1.2, this.config.maxMemoryUsage / 8);
        } else if (memoryPressure > 0.8) {
          targetSize = Math.max(currentSize * 0.7, 1024);
        }
        break;
        
      case MemoryStrategy.ADAPTIVE:
        // Adaptive based on recent performance
        const averageUsage = this.stats.memoryReadings.length > 0 
          ? this.stats.memoryReadings.reduce((a, b) => a + b, 0) / this.stats.memoryReadings.length
          : memoryPressure;
        
        if (averageUsage < 0.5 && usage > 0.85) {
          targetSize = Math.min(currentSize * 1.3, this.config.maxMemoryUsage / 6);
        } else if (averageUsage > 0.8) {
          targetSize = Math.max(currentSize * 0.6, 512);
        }
        break;
    }
    
    return Math.round(targetSize);
  }
  
  /**
   * Trigger garbage collection
   */
  triggerGC(): void {
    if (!this.config.enableAutoGC) {
      return;
    }
    
    const now = Date.now();
    
    // Rate limit GC triggers
    if (now - this.lastGC < 5000) {
      return;
    }
    
    this.lastGC = now;
    this.stats.gcTriggers++;
    
    // Trigger garbage collection
    if (global.gc) {
      global.gc();
    }
    
    this.emitEvent('gc_triggered', {
      trigger: 'manual',
      lastGC: this.lastGC
    });
    
    // Notify callbacks
    this.gcCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        if (this.logger) {
          this.logger.warn('GC callback error', error).catch(() => {});
        }
      }
    });
    
    if (this.logger) {
      this.logger.debug('Garbage collection triggered').catch(() => {});
    }
  }
  
  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats | undefined {
    return getMemoryStats();
  }
  
  /**
   * Get buffer statistics
   */
  getBufferStats(): {
    totalAllocated: number;
    totalReleased: number;
    activeBuffers: number;
    peakUsage: number;
    averageBufferSize: number;
    totalBufferMemory: number;
  } {
    const totalBufferMemory = Array.from(this.buffers.values())
      .reduce((sum, buffer) => sum + buffer.size, 0);
    
    return {
      ...this.bufferStats,
      averageBufferSize: this.bufferStats.activeBuffers > 0 
        ? totalBufferMemory / this.bufferStats.activeBuffers 
        : 0,
      totalBufferMemory
    };
  }
  
  /**
   * Get management statistics
   */
  getManagementStats(): {
    gcTriggers: number;
    pressureEvents: number;
    totalPressureTime: number;
    averagePressureTime: number;
    leaksDetected: number;
    bufferAdjustments: number;
    peakMemoryUsage: number;
    averageMemoryUsage: number;
    strategy: MemoryStrategy;
  } {
    return {
      ...this.stats,
      averagePressureTime: this.stats.pressureEvents > 0 
        ? this.stats.totalPressureTime / this.stats.pressureEvents 
        : 0,
      strategy: this.config.strategy
    };
  }
  
  /**
   * Register callback for memory pressure events
   */
  onMemoryPressure(callback: (stats: MemoryStats) => void): void {
    this.pressureCallbacks.push(callback);
  }
  
  /**
   * Register callback for GC events
   */
  onGC(callback: () => void): void {
    this.gcCallbacks.push(callback);
  }
  
  /**
   * Get recent memory events
   */
  getEventHistory(limit: number = 20): MemoryEvent[] {
    return this.eventHistory.slice(-limit);
  }
  
  /**
   * Update memory strategy
   */
  setStrategy(strategy: MemoryStrategy): void {
    const oldStrategy = this.config.strategy;
    this.config.strategy = strategy;
    
    if (this.logger) {
      this.logger.info('Memory strategy changed', {
        from: oldStrategy,
        to: strategy
      }).catch(() => {});
    }
  }
  
  /**
   * Stop monitoring and cleanup
   */
  stop(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = undefined;
    }
    
    this.pressureCallbacks = [];
    this.gcCallbacks = [];
    this.eventHistory = [];
    this.buffers.clear();
    
    if (this.logger) {
      this.logger.debug('Memory manager stopped').catch(() => {});
    }
  }
  
  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    this.monitorTimer = setInterval(() => {
      this.checkMemoryStatus();
    }, this.config.monitorInterval);
    
    if (this.logger) {
      this.logger.debug('Memory monitoring started', {
        interval: this.config.monitorInterval,
        strategy: this.config.strategy
      }).catch(() => {});
    }
  }
  
  /**
   * Check current memory status and take actions
   */
  private checkMemoryStatus(): void {
    const memoryStats = getMemoryStats();
    // Handle case where memory stats are unavailable (e.g., in test environment)
    if (!memoryStats) {
      return; // Skip monitoring when memory stats unavailable
    }
    
    const memoryPressure = memoryStats.used / memoryStats.total;
    
    // Update statistics
    this.stats.memoryReadings.push(memoryPressure);
    if (this.stats.memoryReadings.length > 100) {
      this.stats.memoryReadings.shift();
    }
    
    this.stats.peakMemoryUsage = Math.max(this.stats.peakMemoryUsage, memoryStats.used);
    this.stats.averageMemoryUsage = this.stats.memoryReadings.reduce((a, b) => a + b, 0) / this.stats.memoryReadings.length;
    
    // Check for memory pressure
    this.checkMemoryPressure(memoryStats, memoryPressure);
    
    // Check for automatic GC
    if (this.config.enableAutoGC && memoryPressure > this.config.gcThreshold) {
      this.triggerGC();
    }
    
    // Check for memory leaks
    if (this.config.enableLeakDetection) {
      this.checkMemoryLeaks(memoryStats);
    }
    
    // Adaptive buffer management
    if (this.config.adaptiveResizing) {
      this.adjustBuffers(memoryPressure);
    }
  }
  
  /**
   * Check for memory pressure conditions
   */
  private checkMemoryPressure(memoryStats: MemoryStats, memoryPressure: number): void {
    const inPressure = memoryPressure > this.config.warningThreshold;
    const wasInPressure = this.pressureStartTime > 0;
    
    if (inPressure && !wasInPressure) {
      // Pressure started
      this.pressureStartTime = Date.now();
      this.stats.pressureEvents++;
      
      this.emitEvent('pressure_start', {
        memoryPressure,
        threshold: this.config.warningThreshold
      });
      
      // Notify callbacks
      this.pressureCallbacks.forEach(callback => {
        try {
          callback(memoryStats);
        } catch (error) {
          if (this.logger) {
            this.logger.warn('Memory pressure callback error', error).catch(() => {});
          }
        }
      });
      
    } else if (!inPressure && wasInPressure) {
      // Pressure ended
      const pressureDuration = Date.now() - this.pressureStartTime;
      this.stats.totalPressureTime += pressureDuration;
      this.pressureStartTime = 0;
      
      this.emitEvent('pressure_end', {
        memoryPressure,
        pressureDuration
      });
    }
  }
  
  /**
   * Check for potential memory leaks
   */
  private checkMemoryLeaks(memoryStats: MemoryStats): void {
    // Simple leak detection: sustained high memory usage
    if (this.stats.memoryReadings.length >= 10) {
      const recentReadings = this.stats.memoryReadings.slice(-10);
      const averageRecent = recentReadings.reduce((a, b) => a + b, 0) / recentReadings.length;
      
      if (averageRecent > 0.9 && recentReadings.every(r => r > 0.85)) {
        this.stats.leaksDetected++;
        
        this.emitEvent('leak_detected', {
          averageUsage: averageRecent,
          sustainedPeriod: this.config.monitorInterval * 10,
          totalDetected: this.stats.leaksDetected
        });
        
        if (this.logger) {
          this.logger.warn('Potential memory leak detected', {
            averageUsage: averageRecent,
            currentUsage: memoryStats.used,
            threshold: 0.9
          }).catch(() => {});
        }
      }
    }
  }
  
  /**
   * Adaptively adjust buffer sizes based on memory pressure
   */
  private adjustBuffers(memoryPressure: number): void {
    if (memoryPressure < this.config.warningThreshold) {
      return; // No adjustment needed
    }
    
    const reductionFactor = Math.max(0.5, 1 - (memoryPressure - this.config.warningThreshold));
    
    for (const [id, buffer] of this.buffers) {
      const newSize = Math.max(1024, Math.round(buffer.size * reductionFactor));
      
      if (newSize < buffer.size) {
        this.updateBufferSize(id, newSize);
      }
    }
  }
  
  /**
   * Emit a memory management event
   */
  private emitEvent(type: MemoryEvent['type'], details?: Record<string, any>): void {
    const memoryStats = getMemoryStats();
    const event: MemoryEvent = {
      type,
      timestamp: Date.now(),
      memoryUsage: memoryStats || {
        used: 0,
        total: 500 * 1024 * 1024, // 500MB default
        available: 500 * 1024 * 1024,
        bufferSize: 8192,
        gcCollections: 0
      },
      details
    };
    
    this.eventHistory.push(event);
    
    // Keep only recent events
    if (this.eventHistory.length > 200) {
      this.eventHistory = this.eventHistory.slice(-100);
    }
  }
}

/**
 * Create a memory manager
 */
export function createMemoryManager(
  config: Partial<MemoryManagerConfig> = {},
  dependencies: { logger?: any } = {}
): MemoryManager {
  return new MemoryManager(config, dependencies);
}

/**
 * Create a memory manager with strategy-specific optimizations
 */
export function createOptimizedMemoryManager(
  strategy: MemoryStrategy,
  dependencies: { logger?: any; maxMemory?: number } = {}
): MemoryManager {
  const strategyConfigs: Record<MemoryStrategy, Partial<MemoryManagerConfig>> = {
    [MemoryStrategy.CONSERVATIVE]: {
      strategy,
      warningThreshold: 0.6,
      criticalThreshold: 0.8,
      gcThreshold: 0.7,
      bufferGrowthLimit: 1.5
    },
    [MemoryStrategy.BALANCED]: {
      strategy,
      warningThreshold: 0.7,
      criticalThreshold: 0.9,
      gcThreshold: 0.8,
      bufferGrowthLimit: 2.0
    },
    [MemoryStrategy.AGGRESSIVE]: {
      strategy,
      warningThreshold: 0.8,
      criticalThreshold: 0.95,
      gcThreshold: 0.9,
      bufferGrowthLimit: 3.0
    },
    [MemoryStrategy.ADAPTIVE]: {
      strategy,
      warningThreshold: 0.7,
      criticalThreshold: 0.9,
      gcThreshold: 0.8,
      bufferGrowthLimit: 2.5,
      adaptiveResizing: true
    }
  };
  
  const config = {
    ...strategyConfigs[strategy],
    maxMemoryUsage: dependencies.maxMemory || DEFAULT_CONFIG.maxMemoryUsage
  };
  
  return new MemoryManager(config, dependencies);
}
