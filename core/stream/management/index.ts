/**
 * Enhanced Stream Management Components
 * ====================================
 * 
 * Management implementations for backpressure control, memory management,
 * and performance optimization in stream processing with integrated
 * management suite capabilities.
 */

// Export individual components
export * from './backpressure-controller';
export * from './memory-manager';
export * from './performance-optimizer';

// Import for suite creation
import { 
  BackpressureControllerImpl, 
  createBackpressureController, 
  createEnhancedBackpressureController,
  BackpressureConfig,
  BackpressureState
} from './backpressure-controller';

import { 
  MemoryManager, 
  createMemoryManager, 
  createOptimizedMemoryManager,
  MemoryManagerConfig,
  MemoryStrategy
} from './memory-manager';

import { 
  PerformanceOptimizerImpl, 
  createPerformanceOptimizer, 
  createStrategyOptimizer,
  PerformanceOptimizerConfig,
  OptimizationStrategy
} from './performance-optimizer';

import { StreamOptimizer, BackpressureController } from '../types';

/**
 * Configuration for complete management suite
 */
export interface ManagementSuiteConfig {
  // Backpressure configuration
  backpressure?: Partial<BackpressureConfig> & {
    enabled?: boolean;
  };
  
  // Memory management configuration
  memory?: Partial<MemoryManagerConfig> & {
    enabled?: boolean;
  };
  
  // Performance optimization configuration
  performance?: Partial<PerformanceOptimizerConfig> & {
    enabled?: boolean;
  };
  
  // Global settings
  enableDetailedLogging?: boolean;
  coordinatedOptimization?: boolean;
  maxMemoryUsage?: number;
  logger?: any;
}

/**
 * Management suite statistics
 */
export interface ManagementSuiteStats {
  backpressure: {
    currentState: BackpressureState | string;
    pressureEvents: number;
    totalPressureTime: number;
    isPaused: boolean;
  };
  memory: {
    strategy: MemoryStrategy | string;
    currentUsage: number;
    peakUsage: number;
    gcTriggers: number;
    activeBuffers: number;
  };
  performance: {
    strategy: OptimizationStrategy | string;
    currentThroughput: number;
    averageLatency: number;
    optimizationCount: number;
  };
  system: {
    uptime: number;
    coordinatedOptimizations: number;
    totalMemoryManaged: number;
  };
}

/**
 * Complete stream management suite
 */
export interface StreamManagementSuite {
  backpressureController: BackpressureController;
  memoryManager: MemoryManager;
  performanceOptimizer: StreamOptimizer;
  
  // Unified interface methods
  getOverallStats(): ManagementSuiteStats;
  enableCoordinatedOptimization(): void;
  disableCoordinatedOptimization(): void;
  setGlobalStrategy(strategy: 'conservative' | 'balanced' | 'aggressive' | 'adaptive'): void;
  optimizeForWorkload(workloadType: 'batch' | 'streaming' | 'interactive' | 'background'): void;
  
  // Lifecycle management
  start(): Promise<void>;
  stop(): Promise<void>;
  reset(): void;
}

/**
 * Implementation of the stream management suite
 */
class StreamManagementSuiteImpl implements StreamManagementSuite {
  public backpressureController: BackpressureController;
  public memoryManager: MemoryManager;
  public performanceOptimizer: StreamOptimizer;
  
  private config: ManagementSuiteConfig;
  private logger?: any;
  private coordinatedOptimizationEnabled = false;
  private optimizationTimer?: NodeJS.Timeout;
  private startTime = Date.now();
  private stats = {
    coordinatedOptimizations: 0,
    totalMemoryManaged: 0
  };
  
  constructor(config: ManagementSuiteConfig) {
    this.config = config;
    this.logger = config.logger;
    
    // Create components
    this.backpressureController = this.createBackpressureController();
    this.memoryManager = this.createMemoryManager();
    this.performanceOptimizer = this.createPerformanceOptimizer();
    
    // Enable coordinated optimization if requested
    if (config.coordinatedOptimization) {
      this.enableCoordinatedOptimization();
    }
  }
  
  /**
   * Get comprehensive statistics from all components
   */
  getOverallStats(): ManagementSuiteStats {
    // Safely get backpressure stats with fallback
    const backpressureStats = (this.backpressureController as any)?.getStatistics ? 
      (this.backpressureController as BackpressureControllerImpl).getStatistics() : 
      {
        currentState: BackpressureState?.NORMAL || 'normal',
        pressureEvents: 0,
        totalPressureTime: 0,
        isPaused: false
      };
    
    const memoryStats = this.memoryManager?.getManagementStats() || {
      strategy: 'balanced' as any,
      gcTriggers: 0,
      pressureEvents: 0,
      totalPressureTime: 0,
      averagePressureTime: 0,
      leaksDetected: 0,
      bufferAdjustments: 0,
      peakMemoryUsage: 0,
      averageMemoryUsage: 0
    };
    const bufferStats = this.memoryManager?.getBufferStats() || {
      totalAllocated: 0,
      totalReleased: 0,
      activeBuffers: 0,
      peakUsage: 0,
      averageBufferSize: 0,
      totalBufferMemory: 0
    };
    
    return {
      backpressure: {
        currentState: backpressureStats.currentState,
        pressureEvents: backpressureStats.pressureEvents,
        totalPressureTime: backpressureStats.totalPressureTime,
        isPaused: backpressureStats.isPaused
      },
      memory: {
        strategy: memoryStats.strategy,
        currentUsage: this.memoryManager?.getMemoryStats()?.used || 0,
        peakUsage: memoryStats.peakMemoryUsage,
        gcTriggers: memoryStats.gcTriggers,
        activeBuffers: bufferStats.activeBuffers
      },
      performance: {
        strategy: this.performanceOptimizer?.getOptimizationStrategy() || 'balanced',
        currentThroughput: 0, // Would be updated from actual metrics
        averageLatency: 0, // Would be updated from actual metrics
        optimizationCount: 0 // Would track optimizations
      },
      system: {
        uptime: Date.now() - this.startTime,
        coordinatedOptimizations: this.stats.coordinatedOptimizations,
        totalMemoryManaged: this.stats.totalMemoryManaged
      }
    };
  }
  
  /**
   * Enable coordinated optimization across all components
   */
  enableCoordinatedOptimization(): void {
    if (this.coordinatedOptimizationEnabled) {
      return;
    }
    
    this.coordinatedOptimizationEnabled = true;
    
    // Start coordination timer
    this.optimizationTimer = setInterval(() => {
      this.performCoordinatedOptimization();
    }, 30000); // Every 30 seconds
    
    if (this.logger) {
      this.logger.info('Coordinated optimization enabled').catch(() => {});
    }
  }
  
  /**
   * Disable coordinated optimization
   */
  disableCoordinatedOptimization(): void {
    if (!this.coordinatedOptimizationEnabled) {
      return;
    }
    
    this.coordinatedOptimizationEnabled = false;
    
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = undefined;
    }
    
    if (this.logger) {
      this.logger.info('Coordinated optimization disabled').catch(() => {});
    }
  }
  
  /**
   * Set global strategy across all components
   */
  setGlobalStrategy(strategy: 'conservative' | 'balanced' | 'aggressive' | 'adaptive'): void {
    try {
      // Map global strategy to component-specific strategies using string values
      const strategyMapping = {
        conservative: {
          memory: 'conservative',
          performance: 'memory'
        },
        balanced: {
          memory: 'balanced',
          performance: 'balanced'
        },
        aggressive: {
          memory: 'aggressive',
          performance: 'throughput'
        },
        adaptive: {
          memory: 'adaptive',
          performance: 'balanced'
        }
      };
      
      const mapping = strategyMapping[strategy];
      if (!mapping) {
        if (this.logger) {
          this.logger.warn(`Unknown strategy: ${strategy}, using balanced instead`).catch(() => {});
        }
        this.setGlobalStrategy('balanced');
        return;
      }
      
      // Use string values to avoid enum issues
      if ((this.memoryManager as any).setStrategy) {
        (this.memoryManager as any).setStrategy(mapping.memory);
      }
      if ((this.performanceOptimizer as any).setOptimizationStrategy) {
        (this.performanceOptimizer as any).setOptimizationStrategy(mapping.performance);
      }
      
      if (this.logger) {
        this.logger.info('Global strategy updated', { strategy }).catch(() => {});
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to set global strategy', { strategy, error }).catch(() => {});
      }
    }
  }
  
  /**
   * Optimize for specific workload characteristics
   */
  optimizeForWorkload(workloadType: 'batch' | 'streaming' | 'interactive' | 'background'): void {
    try {
      const workloadConfigs = {
        batch: {
          memory: 'aggressive',
          performance: 'throughput',
          backpressureThreshold: 0.95
        },
        streaming: {
          memory: 'balanced',
          performance: 'balanced',
          backpressureThreshold: 0.8
        },
        interactive: {
          memory: 'conservative',
          performance: 'latency',
          backpressureThreshold: 0.7
        },
        background: {
          memory: 'conservative',
          performance: 'memory',
          backpressureThreshold: 0.9
        }
      };
      
      const config = workloadConfigs[workloadType];
      if (!config) {
        if (this.logger) {
          this.logger.warn(`Unknown workload type: ${workloadType}`).catch(() => {});
        }
        return;
      }
      
      // Use string values to avoid enum issues
      if ((this.memoryManager as any).setStrategy) {
        (this.memoryManager as any).setStrategy(config.memory);
      }
      if ((this.performanceOptimizer as any).setOptimizationStrategy) {
        (this.performanceOptimizer as any).setOptimizationStrategy(config.performance);
      }
      this.backpressureController.setThreshold(config.backpressureThreshold);
      
      if (this.logger) {
        this.logger.info('Workload optimization applied', { workloadType }).catch(() => {});
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to optimize for workload', { workloadType, error }).catch(() => {});
      }
    }
  }
  
  /**
   * Start all management components
   */
  async start(): Promise<void> {
    if (this.logger) {
      this.logger.info('Starting stream management suite').catch(() => {});
    }
    
    // Components start automatically in their constructors
    // This method is for any additional initialization
    
    this.startTime = Date.now();
  }
  
  /**
   * Stop all management components
   */
  async stop(): Promise<void> {
    if (this.logger) {
      this.logger.info('Stopping stream management suite').catch(() => {});
    }
    
    this.disableCoordinatedOptimization();
    
    // Stop individual components that have stop methods
    if (this.memoryManager && this.memoryManager.stop) {
      this.memoryManager.stop();
    }
    
    // Stop backpressure controller if it has a stop method
    if (this.backpressureController && (this.backpressureController as any).stop) {
      (this.backpressureController as any).stop();
    }
    
    // Stop performance optimizer if it has a stop method
    if (this.performanceOptimizer && (this.performanceOptimizer as any).stop) {
      (this.performanceOptimizer as any).stop();
    }
  }
  
  /**
   * Reset all components to initial state
   */
  reset(): void {
    if (this.logger) {
      this.logger.info('Resetting stream management suite').catch(() => {});
    }
    
    // Reset statistics
    this.stats = {
      coordinatedOptimizations: 0,
      totalMemoryManaged: 0
    };
    
    this.startTime = Date.now();
    
    // Components would reset themselves as needed
  }
  
  /**
   * Create backpressure controller based on configuration
   */
  private createBackpressureController(): BackpressureController {
    if (this.config.backpressure?.enabled === false) {
      // Return a no-op implementation
      return {
        pause: () => {},
        resume: () => {},
        drain: () => Promise.resolve(),
        getBufferLevel: () => 0,
        getMemoryUsage: () => ({ used: 0, available: 0, total: 0, bufferSize: 0, gcCollections: 0 }),
        onPressure: () => {},
        setThreshold: () => {},
        getThreshold: () => 0.8
      };
    }
    
    try {
      // Try enhanced controller first
      return createEnhancedBackpressureController(
        this.config.backpressure || {},
        {
          logger: this.logger,
          enableDetailedLogging: this.config.enableDetailedLogging,
          maxBufferSize: 10000
        }
      );
    } catch (error) {
      // Fallback to basic controller if enhanced fails
      if (this.logger) {
        this.logger.warn('Enhanced backpressure controller failed, using basic controller', error).catch(() => {});
      }
      return createBackpressureController(
        this.config.backpressure || {},
        {
          logger: this.logger,
          maxBufferSize: 10000
        }
      );
    }
  }
  
  /**
   * Create memory manager based on configuration
   */
  private createMemoryManager(): MemoryManager {
    if (this.config.memory?.enabled === false) {
      // Return a minimal memory manager
      return createMemoryManager({
        strategy: 'conservative' as any,
        enableAutoGC: false,
        enableLeakDetection: false
      }, { logger: this.logger });
    }
    
    const memoryConfig = {
      ...this.config.memory,
      maxMemoryUsage: this.config.maxMemoryUsage || this.config.memory?.maxMemoryUsage
    };
    
    return createMemoryManager(memoryConfig, { logger: this.logger });
  }
  
  /**
   * Create performance optimizer based on configuration
   */
  private createPerformanceOptimizer(): StreamOptimizer {
    if (this.config.performance?.enabled === false) {
      // Return a no-op optimizer
      return {
        adaptChunkSize: (metrics) => 1024,
        optimizeConcurrency: (metrics) => 4,
        adjustBufferSizes: (metrics) => ({
          inputBufferSize: 8192,
          outputBufferSize: 8192,
          intermediateBufferSize: 4096,
          backpressureThreshold: 0.8
        }),
        enableProfiling: () => {},
        disableProfiling: () => {},
        getPerformanceReport: () => ({
          summary: {
            averageThroughput: 0,
            peakThroughput: 0,
            averageLatency: 0,
            errorRate: 0
          },
          bottlenecks: [],
          recommendations: [],
          historicalTrends: []
        }),
        suggestOptimizations: () => [],
        setOptimizationStrategy: () => {},
        getOptimizationStrategy: () => 'balanced' as any,
      };
    }
    
    const performanceConfig = {
      enableDetailedLogging: this.config.enableDetailedLogging,
      ...this.config.performance
    };
    
    return createPerformanceOptimizer(performanceConfig, { logger: this.logger });
  }
  
  /**
   * Perform coordinated optimization across all components
   */
  private performCoordinatedOptimization(): void {
    try {
      this.stats.coordinatedOptimizations++;
      
      // Get current state from all components
      const backpressureStats = (this.backpressureController as any).getStatistics ? 
        (this.backpressureController as BackpressureControllerImpl).getStatistics() :
        { isPaused: false, currentState: BackpressureState?.NORMAL || 'normal' };
        
      const memoryStats = this.memoryManager.getMemoryStats();
      const bufferStats = this.memoryManager.getBufferStats();
      
      // Update total memory managed
      this.stats.totalMemoryManaged = bufferStats.totalBufferMemory;
      
      // Coordinate optimizations based on system state
      if (backpressureStats.isPaused && memoryStats && memoryStats.used > memoryStats.total * 0.9) {
        // High memory pressure - trigger aggressive memory management
        this.memoryManager.triggerGC();
        
        // Suggest performance optimizer to reduce memory usage
        const suggestions = this.performanceOptimizer.suggestOptimizations();
        const memoryOptimizations = suggestions.filter(s => s.type === 'resource');
        
        if (this.logger && memoryOptimizations.length > 0) {
          this.logger.info('Coordinated memory optimization triggered', {
            suggestions: memoryOptimizations.length,
            memoryUsage: memoryStats?.used || 0,
            backpressurePaused: true
          }).catch(() => {});
        }
      }
      
      if (this.logger && this.config.enableDetailedLogging) {
        this.logger.debug('Coordinated optimization completed', {
          optimizationCount: this.stats.coordinatedOptimizations,
          memoryUsage: memoryStats?.used || 0,
          backpressureState: backpressureStats.currentState
        }).catch(() => {});
      }
      
    } catch (error) {
      if (this.logger) {
        this.logger.error('Coordinated optimization failed', error).catch(() => {});
      }
    }
  }
}

/**
 * Create a complete stream management suite
 */
export function createStreamManagementSuite(config: ManagementSuiteConfig = {}): StreamManagementSuite {
  return new StreamManagementSuiteImpl(config);
}

/**
 * Create a management suite optimized for specific workload types
 */
export function createWorkloadOptimizedSuite(
  workloadType: 'batch' | 'streaming' | 'interactive' | 'background',
  options: {
    maxMemoryUsage?: number;
    enableDetailedLogging?: boolean;
    logger?: any;
  } = {}
): StreamManagementSuite {
  const workloadConfigs = {
    batch: {
      coordinatedOptimization: true,
      backpressure: { 
        enabled: true,
        warningThreshold: 0.8,
        criticalThreshold: 0.95,
        blockingThreshold: 0.98
      },
      memory: { 
        enabled: true,
        strategy: 'aggressive' as any,
        enableAutoGC: true,
        gcThreshold: 0.9
      },
      performance: { 
        enabled: true,
        strategy: 'throughput' as any,
        enableAutoTuning: true,
        profilingInterval: 2000
      }
    },
    streaming: {
      coordinatedOptimization: true,
      backpressure: { 
        enabled: true,
        warningThreshold: 0.7,
        criticalThreshold: 0.9,
        blockingThreshold: 0.95
      },
      memory: { 
        enabled: true,
        strategy: 'balanced' as any,
        enableAutoGC: true,
        adaptiveResizing: true
      },
      performance: { 
        enabled: true,
        strategy: 'balanced' as any,
        enableAutoTuning: true,
        profilingInterval: 3000
      }
    },
    interactive: {
      coordinatedOptimization: true,
      backpressure: { 
        enabled: true,
        warningThreshold: 0.6,
        criticalThreshold: 0.8,
        blockingThreshold: 0.9
      },
      memory: { 
        enabled: true,
        strategy: 'conservative' as any,
        enableAutoGC: true,
        gcThreshold: 0.7
      },
      performance: { 
        enabled: true,
        strategy: 'latency' as any,
        enableAutoTuning: true,
        profilingInterval: 1000
      }
    },
    background: {
      coordinatedOptimization: false,
      backpressure: { 
        enabled: true,
        warningThreshold: 0.8,
        criticalThreshold: 0.95,
        blockingThreshold: 0.98
      },
      memory: { 
        enabled: true,
        strategy: 'conservative' as any,
        enableAutoGC: true,
        gcThreshold: 0.6
      },
      performance: { 
        enabled: true,
        strategy: 'memory' as any,
        enableAutoTuning: false,
        profilingInterval: 10000
      }
    }
  };
  
  const config: ManagementSuiteConfig = {
    ...workloadConfigs[workloadType],
    ...options
  };
  
  const suite = createStreamManagementSuite(config);
  
  // Apply workload-specific optimizations
  suite.optimizeForWorkload(workloadType);
  
  return suite;
}

/**
 * Create a lightweight management suite with minimal overhead
 */
export function createLightweightManagementSuite(options: {
  enableBackpressure?: boolean;
  enableMemoryManagement?: boolean;
  enablePerformanceOptimization?: boolean;
  logger?: any;
} = {}): StreamManagementSuite {
  return createStreamManagementSuite({
    backpressure: {
      enabled: options.enableBackpressure ?? true,
      warningThreshold: 0.8,
      criticalThreshold: 0.9,
      checkInterval: 1000
    },
    memory: {
      enabled: options.enableMemoryManagement ?? true,
      strategy: 'balanced' as any,
      enableAutoGC: false,
      enableLeakDetection: false
    },
    performance: {
      enabled: options.enablePerformanceOptimization ?? false,
      enableProfiling: false,
      enableAutoTuning: false
    },
    coordinatedOptimization: false,
    enableDetailedLogging: false,
    logger: options.logger
  });
}
