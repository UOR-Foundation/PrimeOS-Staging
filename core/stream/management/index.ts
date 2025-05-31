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
  PerformanceOptimizerConfig
} from './performance-optimizer';

import { StreamOptimizer, BackpressureController, OptimizationStrategy } from '../types';
import { PrimeRegistryAdapter, createPrimeRegistryAdapter } from '../adapters/prime-registry-adapter';
import { IntegrityAdapter, createIntegrityAdapter } from '../adapters/integrity-registry-adapter';
import { EncodingStreamAdapter, createEncodingStreamAdapter } from '../adapters/encoding-adapter';
import { EncodingStreamBridge } from '../types';

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
  
  // Optional core module integrations
  primeRegistry?: any;
  integrityModule?: any;
  encodingModule?: any;
  
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
  
  // Optional core module adapters
  primeAdapter?: PrimeRegistryAdapter;
  integrityAdapter?: IntegrityAdapter;
  encodingAdapter?: EncodingStreamBridge;
  
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
  
  // Optional core module adapters
  public primeAdapter?: PrimeRegistryAdapter;
  public integrityAdapter?: IntegrityAdapter;
  public encodingAdapter?: EncodingStreamBridge;
  
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
    
    // Create components - let failures propagate following core module pattern
    this.backpressureController = this.createBackpressureController();
    this.memoryManager = this.createMemoryManager();
    this.performanceOptimizer = this.createPerformanceOptimizer();
    
    // Create core module adapters if modules are provided
    this.initializeCoreAdapters();
    
    // Enable coordinated optimization if requested
    if (config.coordinatedOptimization) {
      this.enableCoordinatedOptimization();
    }
  }
  
  /**
   * Get comprehensive statistics from all components
   */
  getOverallStats(): ManagementSuiteStats {
    // Get backpressure stats - require proper implementation
    const backpressureStats = (this.backpressureController as BackpressureControllerImpl).getStatistics();
    
    const memoryStats = this.memoryManager.getManagementStats();
    const bufferStats = this.memoryManager.getBufferStats();
    
    return {
      backpressure: {
        currentState: backpressureStats.currentState,
        pressureEvents: backpressureStats.pressureEvents,
        totalPressureTime: backpressureStats.totalPressureTime,
        isPaused: backpressureStats.isPaused
      },
      memory: {
        strategy: memoryStats.strategy,
        currentUsage: this.memoryManager.getMemoryStats()?.used || 0,
        peakUsage: memoryStats.peakMemoryUsage,
        gcTriggers: memoryStats.gcTriggers,
        activeBuffers: bufferStats.activeBuffers
      },
      performance: {
        strategy: this.performanceOptimizer.getOptimizationStrategy(),
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
      // Map global strategy to component-specific strategies
      const strategyMapping = {
        conservative: {
          memory: MemoryStrategy.CONSERVATIVE,
          performance: OptimizationStrategy.MEMORY
        },
        balanced: {
          memory: MemoryStrategy.BALANCED,
          performance: OptimizationStrategy.BALANCED
        },
        aggressive: {
          memory: MemoryStrategy.AGGRESSIVE,
          performance: OptimizationStrategy.THROUGHPUT
        },
        adaptive: {
          memory: MemoryStrategy.ADAPTIVE,
          performance: OptimizationStrategy.BALANCED
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
      
      // Apply strategies to components
      this.memoryManager.setStrategy(mapping.memory);
      this.performanceOptimizer.setOptimizationStrategy(mapping.performance);
      
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
          memory: MemoryStrategy.AGGRESSIVE,
          performance: OptimizationStrategy.THROUGHPUT,
          backpressureThreshold: 0.95
        },
        streaming: {
          memory: MemoryStrategy.BALANCED,
          performance: OptimizationStrategy.BALANCED,
          backpressureThreshold: 0.8
        },
        interactive: {
          memory: MemoryStrategy.CONSERVATIVE,
          performance: OptimizationStrategy.LATENCY,
          backpressureThreshold: 0.7
        },
        background: {
          memory: MemoryStrategy.CONSERVATIVE,
          performance: OptimizationStrategy.MEMORY,
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
      
      // Apply workload-specific strategies
      this.memoryManager.setStrategy(config.memory);
      this.performanceOptimizer.setOptimizationStrategy(config.performance);
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
    
    // Initialize core adapters if available
    await this.initializeAdapters();
    
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
    
    // Terminate core adapters
    await this.terminateAdapters();
    
    // Stop individual components
    this.memoryManager.stop();
    
    // Stop backpressure controller
    (this.backpressureController as any).stop();
    
    // Stop performance optimizer
    (this.performanceOptimizer as any).stop();
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
   * Initialize core module adapters
   */
  private initializeCoreAdapters(): void {
    try {
      // Create prime registry adapter if module provided
      if (this.config.primeRegistry) {
        this.primeAdapter = createPrimeRegistryAdapter(this.config.primeRegistry, {
          logger: this.logger
        });
      }
      
      // Create integrity adapter if module provided
      if (this.config.integrityModule) {
        this.integrityAdapter = createIntegrityAdapter(this.config.integrityModule, {
          logger: this.logger
        });
      }
      
      // Create encoding adapter if module provided
      if (this.config.encodingModule) {
        this.encodingAdapter = createEncodingStreamAdapter({
          encodingModule: this.config.encodingModule,
          logger: this.logger
        });
      }
      
      if (this.logger && (this.primeAdapter || this.integrityAdapter || this.encodingAdapter)) {
        this.logger.debug('Core module adapters initialized', {
          primeAdapter: !!this.primeAdapter,
          integrityAdapter: !!this.integrityAdapter,
          encodingAdapter: !!this.encodingAdapter
        }).catch(() => {});
      }
    } catch (error) {
      if (this.logger) {
        this.logger.warn('Failed to initialize some core adapters', error).catch(() => {});
      }
    }
  }
  
  /**
   * Initialize core adapters asynchronously
   */
  private async initializeAdapters(): Promise<void> {
    try {
      // Initialize prime adapter
      if (this.primeAdapter) {
        await this.primeAdapter.ensureInitialized();
      }
      
      // Initialize integrity adapter
      if (this.integrityAdapter) {
        await this.integrityAdapter.ensureInitialized();
      }
      
      // Note: EncodingStreamAdapter doesn't have ensureInitialized method
      // It's initialized during creation
      
      if (this.logger) {
        this.logger.debug('Core adapters initialization complete').catch(() => {});
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to initialize core adapters', error).catch(() => {});
      }
    }
  }
  
  /**
   * Terminate core adapters
   */
  private async terminateAdapters(): Promise<void> {
    try {
      // Terminate adapters
      if (this.primeAdapter) {
        await this.primeAdapter.terminate();
      }
      
      if (this.integrityAdapter) {
        await this.integrityAdapter.terminate();
      }
      
      // Note: EncodingStreamAdapter doesn't have terminate method
      // It doesn't require explicit termination
      if (this.encodingAdapter) {
        // Clear reference
        this.encodingAdapter = undefined;
      }
      
      if (this.logger) {
        this.logger.debug('Core adapters terminated').catch(() => {});
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to terminate core adapters', error).catch(() => {});
      }
    }
  }
  

  
  /**
   * Create backpressure controller based on configuration
   */
  private createBackpressureController(): BackpressureController {
    if (this.config.backpressure?.enabled === false) {
      throw new Error('Backpressure controller is required - cannot be disabled');
    }
    
    // Try enhanced controller first, fall back to basic if needed
    try {
      const controller = createEnhancedBackpressureController(
        this.config.backpressure || {},
        {
          logger: this.logger,
          enableDetailedLogging: this.config.enableDetailedLogging,
          maxBufferSize: 10000
        }
      );
      if (!controller) {
        throw new Error('Enhanced backpressure controller returned undefined');
      }
      return controller;
    } catch (error) {
      if (this.logger) {
        this.logger.warn('Enhanced backpressure controller failed, using basic controller', error).catch(() => {});
      }
      try {
        const basicController = createBackpressureController(
          this.config.backpressure || {},
          {
            logger: this.logger,
            maxBufferSize: 10000
          }
        );
        if (!basicController) {
          throw new Error('Basic backpressure controller returned undefined');
        }
        return basicController;
      } catch (basicError) {
        // Backpressure controller is required - throw error
        if (this.logger) {
          this.logger.error('All backpressure controller creation failed', basicError).catch(() => {});
        }
        throw new Error(`Failed to create backpressure controller: ${basicError instanceof Error ? basicError.message : 'Unknown error'}`);
      }
    }
  }
  
  /**
   * Create memory manager based on configuration
   */
  private createMemoryManager(): MemoryManager {
    if (this.config.memory?.enabled === false) {
      throw new Error('Memory manager is required - cannot be disabled in production');
    }
    
    const memoryConfig = {
      // Apply user config
      ...this.config.memory,
      // Set memory limit
      maxMemoryUsage: this.config.maxMemoryUsage || this.config.memory?.maxMemoryUsage
    };
    
    const manager = createMemoryManager(memoryConfig, { logger: this.logger });
    if (!manager) {
      throw new Error('Memory manager creation returned undefined');
    }
    return manager;
  }
  
  /**
   * Create performance optimizer based on configuration
   */
  private createPerformanceOptimizer(): StreamOptimizer {
    const performanceConfig = {
      // Default config when performance optimization is disabled
      ...(this.config.performance?.enabled === false ? {
        enableProfiling: false,
        enableAutoTuning: false
      } : {}),
      // Apply global settings
      enableDetailedLogging: this.config.enableDetailedLogging,
      // Apply user config
      ...this.config.performance
    };
    
    try {
      const optimizer = createPerformanceOptimizer(performanceConfig, { logger: this.logger });
      if (!optimizer) {
        throw new Error('Performance optimizer creation returned undefined');
      }
      return optimizer;
    } catch (error) {
      if (this.logger) {
        this.logger.error('Performance optimizer creation failed', error).catch(() => {});
      }
      
      throw new Error(`Failed to create performance optimizer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
        strategy: MemoryStrategy.AGGRESSIVE,
        enableAutoGC: true,
        gcThreshold: 0.9
      },
      performance: { 
        enabled: true,
        strategy: OptimizationStrategy.THROUGHPUT,
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
        strategy: MemoryStrategy.BALANCED,
        enableAutoGC: true,
        adaptiveResizing: true
      },
      performance: { 
        enabled: true,
        strategy: OptimizationStrategy.BALANCED,
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
        strategy: MemoryStrategy.CONSERVATIVE,
        enableAutoGC: true,
        gcThreshold: 0.7
      },
      performance: { 
        enabled: true,
        strategy: OptimizationStrategy.LATENCY,
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
        strategy: MemoryStrategy.CONSERVATIVE,
        enableAutoGC: true,
        gcThreshold: 0.6
      },
      performance: { 
        enabled: true,
        strategy: OptimizationStrategy.MEMORY,
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
      strategy: MemoryStrategy.BALANCED,
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
