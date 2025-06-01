/**
 * Enhanced Bands Implementation
 * ============================
 * 
 * Complete band optimization system integrating all enhanced components:
 * - Enhanced utils with core module integration
 * - Spectral processing with NTT transforms
 * - Registry with intelligent caching
 * - Advanced processors with multiple strategies
 * - Enhanced adapters with real algorithms
 * 
 * Production-quality implementation following PrimeOS model pattern.
 */

import {
  BaseModel,
  ModelResult,
  ModelLifecycleState,
  createAndInitializeModel
} from '../../os/model';

import {
  BandOptimizationOptions,
  BandOptimizationInterface,
  BandOptimizationState,
  BandOptimizationProcessInput,
  BandType,
  BandClassification,
  BandOptimizationResult,
  BandConfig,
  BandPerformanceMetrics
} from './types';

// Import enhanced components
import { 
  initializeEnhancedUtils,
  validateEnhancedUtilsIntegration,
  analyzeNumberCharacteristics,
  createEnhancedBandMetrics,
  calculateClassificationConfidence,
  generateBandAlternatives,
  estimateRealProcessingTime,
  calculateEnhancedMemoryRequirements,
  compareBandPerformance
} from './utils/index-enhanced';

import { 
  createSpectralModuleWithCoreModules,
  SpectralModule,
  BandType as SpectralBandType
} from './spectral';

import {
  createBandRegistry,
  BandRegistryInterface
} from './registry';

import {
  createStrategyProcessor,
  StrategyProcessorInterface,
  ProcessingStrategy
} from './processors';

import {
  createEnhancedPrimeAdapter,
  createEnhancedEncodingAdapter,
  createEnhancedPrecisionAdapter,
  createEnhancedStreamAdapter
} from './integration';

/**
 * Enhanced options for bands with core module integration
 */
export interface EnhancedBandOptimizationOptions extends BandOptimizationOptions {
  // Core module dependencies
  primeRegistry?: any;
  encodingModule?: any;
  precisionModule?: any;
  streamProcessor?: any;
  integrityModule?: any;
  
  // Enhanced configuration
  enableSpectralAnalysis?: boolean;
  enableRegistryOptimization?: boolean;
  enableAdvancedProcessors?: boolean;
  enableRealTimeMetrics?: boolean;
  enableCoreModuleIntegration?: boolean;
  
  // Performance settings
  maxConcurrency?: number;
  memoryLimit?: number;
  cachingStrategy?: 'aggressive' | 'balanced' | 'conservative';
  optimizationLevel?: 'basic' | 'enhanced' | 'maximum';
}

/**
 * Enhanced state including all component states
 */
export interface EnhancedBandOptimizationState extends BandOptimizationState {
  spectralModule?: any;
  registry?: any;
  processors?: any;
  adapters?: any;
  coreModuleHealth?: any;
  performanceMetrics?: any;
}

/**
 * Default enhanced options
 */
const DEFAULT_ENHANCED_OPTIONS: Required<Omit<EnhancedBandOptimizationOptions, keyof import('../../os/model/types').ModelOptions | 'primeRegistry' | 'encodingModule' | 'precisionModule' | 'streamProcessor' | 'integrityModule'>> = {
  enableAdaptiveThresholds: true,
  enablePerformanceMonitoring: true,
  enableSpectralProcessing: true,
  enableCrossoverOptimization: true,
  enableSpectralAnalysis: true,
  enableRegistryOptimization: true,
  enableAdvancedProcessors: true,
  enableRealTimeMetrics: true,
  enableCoreModuleIntegration: true,
  maxConcurrency: 8,
  memoryLimit: 500 * 1024 * 1024, // 500MB
  cachingStrategy: 'balanced',
  optimizationLevel: 'enhanced'
};

/**
 * Enhanced bands implementation with full component integration
 */
export class EnhancedBandsImplementation extends BaseModel implements BandOptimizationInterface {
  private config: Required<EnhancedBandOptimizationOptions>;
  private spectralModule?: SpectralModule;
  private registry?: BandRegistryInterface;
  private processors?: StrategyProcessorInterface;
  private adapters: any = {};
  
  private bandMetrics: Map<BandType, any> = new Map();
  private transitionHistory: any[] = [];
  private optimizationLevel: number = 0;
  private currentBand?: BandType;
  
  private stats = {
    classificationsPerformed: 0,
    optimizationsExecuted: 0,
    spectralAnalysisCount: 0,
    registryHits: 0,
    processorInvocations: 0,
    averageProcessingTime: 0
  };

  constructor(options: EnhancedBandOptimizationOptions = {}) {
    super({
      debug: false,
      name: 'bands-enhanced',
      version: '2.0.0',
      ...options
    });
    
    this.config = {
      ...DEFAULT_ENHANCED_OPTIONS,
      ...options,
      debug: options.debug ?? false,
      name: options.name ?? 'bands-enhanced',
      version: options.version ?? '2.0.0'
    };
  }
  
  /**
   * Enhanced initialization with all components
   */
  protected async onInitialize(): Promise<void> {
    await this.logger.info('Initializing Enhanced Bands module');
    
    try {
      // Initialize core module integration if enabled
      if (this.config.enableCoreModuleIntegration) {
        await this.initializeCoreModuleIntegration();
      }
      
      // Initialize spectral analysis if enabled
      if (this.config.enableSpectralAnalysis) {
        await this.initializeSpectralModule();
      }
      
      // Initialize registry if enabled
      if (this.config.enableRegistryOptimization) {
        await this.initializeRegistry();
      }
      
      // Initialize processors if enabled
      if (this.config.enableAdvancedProcessors) {
        await this.initializeProcessors();
      }
      
      // Initialize enhanced adapters
      await this.initializeAdapters();
      
      // Initialize band metrics with enhanced calculations
      await this.initializeBandMetrics();
      
      // Update state with all components
      this.state.custom = {
        currentBand: this.currentBand,
        bandMetrics: this.bandMetrics,
        transitionHistory: this.transitionHistory,
        optimizationLevel: this.optimizationLevel,
        spectralModule: this.spectralModule ? 'initialized' : 'disabled',
        registry: this.registry ? 'initialized' : 'disabled',
        processors: this.processors ? 'initialized' : 'disabled',
        adapters: Object.keys(this.adapters),
        stats: this.stats
      };
      
      await this.logger.info('Enhanced Bands module initialized successfully', {
        spectralAnalysis: this.config.enableSpectralAnalysis,
        registryOptimization: this.config.enableRegistryOptimization,
        advancedProcessors: this.config.enableAdvancedProcessors,
        coreModuleIntegration: this.config.enableCoreModuleIntegration
      });
      
    } catch (error) {
      await this.logger.error('Failed to initialize Enhanced Bands module', error);
      throw error;
    }
  }
  
  /**
   * Enhanced processing with all component integration
   */
  protected async onProcess<T = BandOptimizationProcessInput, R = unknown>(input: T): Promise<R> {
    if (!input || typeof input !== 'object') {
      throw new Error('Invalid input: expected BandOptimizationProcessInput object');
    }
    
    const request = input as unknown as BandOptimizationProcessInput;
    
    await this.logger.debug('Processing enhanced bands operation', { operation: request.operation });
    
    switch (request.operation) {
      case 'classify':
        if (!request.numbers || request.numbers.length === 0) {
          throw new Error('Missing numbers for classification');
        }
        return await this.enhancedClassifyNumber(request.numbers[0]) as unknown as R;
        
      case 'optimize':
        if (!request.numbers) {
          throw new Error('Missing numbers for optimization');
        }
        return await this.enhancedOptimizeBatch(request.numbers) as unknown as R;
        
      case 'configure':
        if (!request.band || !request.config) {
          throw new Error('Missing band or config for configuration');
        }
        await this.enhancedUpdateConfiguration(request.band, request.config);
        return undefined as unknown as R;
        
      case 'analyze':
        return await this.enhancedGetPerformanceMetrics() as unknown as R;
        
      case 'spectral_analyze':
        if (!request.audioData) {
          throw new Error('Missing audio data for spectral analysis');
        }
        return await this.performSpectralAnalysis(request.audioData, request.band) as unknown as R;
        
      case 'process_strategy':
        if (!request.numbers || !request.strategy) {
          throw new Error('Missing numbers or strategy for processing');
        }
        return await this.executeProcessingStrategy(request.numbers, request.strategy) as unknown as R;
        
      case 'registry_lookup':
        if (!request.numbers) {
          throw new Error('Missing numbers for registry lookup');
        }
        return await this.performRegistryLookup(request.numbers) as unknown as R;
        
      case 'health_check':
        return await this.performHealthCheck() as unknown as R;
        
      case 'reset':
        await this.enhancedResetOptimization();
        return undefined as unknown as R;
        
      default:
        throw new Error(`Unknown operation: ${(request as any).operation}`);
    }
  }
  
  /**
   * Enhanced classification using all components
   */
  async enhancedClassifyNumber(n: bigint): Promise<BandClassification> {
    this.stats.classificationsPerformed++;
    const startTime = performance.now();
    
    try {
      // Use enhanced utils for real mathematical analysis
      const characteristics = await analyzeNumberCharacteristics(n);
      
      // Use spectral analysis if available and number is suitable
      let spectralInfo: any = undefined;
      if (this.spectralModule && characteristics.bitSize > 64) {
        try {
          // Convert number to audio-like data for spectral analysis
          const audioData = this.numberToAudioData(n);
          spectralInfo = await this.spectralModule.analyze(audioData, characteristics.bitSize as any);
        } catch (error) {
          await this.logger.debug('Spectral analysis failed, continuing without', error);
        }
      }
      
      // Check registry for cached results
      let registryResult: any = undefined;
      if (this.registry) {
        try {
          registryResult = await this.registry.lookup(n);
          if (registryResult) {
            this.stats.registryHits++;
          }
        } catch (error) {
          await this.logger.debug('Registry lookup failed, continuing without', error);
        }
      }
      
      // Determine optimal band using enhanced analysis
      const band = this.determineOptimalBand(characteristics, spectralInfo, registryResult);
      
      // Calculate confidence using real mathematical analysis
      const confidence = await calculateClassificationConfidence(n, band, characteristics);
      
      // Generate alternatives using enhanced logic
      const alternatives = await generateBandAlternatives(band, characteristics, ['classification']);
      
      const endTime = performance.now();
      this.updateAverageProcessingTime(endTime - startTime);
      
      const classification: BandClassification = {
        band,
        bitSize: characteristics.bitSize,
        confidence,
        alternatives,
        characteristics,
        spectralInfo,
        registryResult
      };
      
      // Cache result in registry if available
      if (this.registry && confidence > 0.8) {
        try {
          await this.registry.cache(n, classification);
        } catch (error) {
          await this.logger.debug('Failed to cache classification result', error);
        }
      }
      
      await this.logger.debug('Enhanced classification complete', {
        band,
        confidence: confidence.toFixed(3),
        bitSize: characteristics.bitSize,
        spectralAnalysis: !!spectralInfo,
        registryHit: !!registryResult
      });
      
      return classification;
      
    } catch (error) {
      await this.logger.error('Enhanced classification failed', error);
      throw error;
    }
  }
  
  /**
   * Enhanced batch optimization
   */
  async enhancedOptimizeBatch(numbers: bigint[]): Promise<BandOptimizationResult> {
    this.stats.optimizationsExecuted++;
    
    try {
      // Classify all numbers using enhanced classification
      const classifications = await Promise.all(
        numbers.map(n => this.enhancedClassifyNumber(n))
      );
      
      // Analyze band distribution
      const bandCounts = new Map<BandType, number>();
      const confidenceSum = new Map<BandType, number>();
      
      classifications.forEach(c => {
        bandCounts.set(c.band, (bandCounts.get(c.band) || 0) + 1);
        confidenceSum.set(c.band, (confidenceSum.get(c.band) || 0) + c.confidence);
      });
      
      // Select optimal band using weighted confidence
      let selectedBand = BandType.MIDRANGE;
      let maxScore = 0;
      
      for (const [band, count] of bandCounts) {
        const avgConfidence = (confidenceSum.get(band) || 0) / count;
        const score = count * avgConfidence;
        if (score > maxScore) {
          maxScore = score;
          selectedBand = band;
        }
      }
      
      // Get enhanced performance metrics for selected band
      const expectedPerformance = await createEnhancedBandMetrics(selectedBand, numbers);
      
      // Calculate overall confidence
      const confidence = maxScore / numbers.length;
      
      // Generate processing alternatives using enhanced logic
      const alternatives = await generateBandAlternatives(
        selectedBand, 
        classifications[0].characteristics,
        ['batch_processing', 'parallel_processing']
      );
      
      // Estimate processing time using real performance data
      const estimatedTime = await estimateRealProcessingTime(selectedBand, numbers.length, numbers);
      
      // Calculate memory requirements
      const memoryRequired = calculateEnhancedMemoryRequirements(
        selectedBand,
        numbers.length,
        ['prime_test', 'factorization', 'parallel_processing']
      );
      
      // Generate enhanced recommendations
      const recommendations = [
        `Optimal band: ${selectedBand} (${(confidence * 100).toFixed(1)}% confidence)`,
        `Expected throughput: ${expectedPerformance.throughput.toFixed(0)} ops/sec`,
        `Estimated processing time: ${estimatedTime.toFixed(2)}s`,
        `Memory required: ${(memoryRequired / 1024).toFixed(1)} KB`,
        `Parallelization potential: ${(classifications[0].characteristics.parallelizationPotential * 100).toFixed(1)}%`
      ];
      
      // Execute processing strategy if processors available
      let processingResult: any = undefined;
      if (this.processors && this.config.enableAdvancedProcessors) {
        try {
          const strategy = this.selectOptimalStrategy(selectedBand, numbers.length);
          processingResult = await this.processors.process(numbers, strategy, selectedBand);
        } catch (error) {
          await this.logger.debug('Strategy processing failed, continuing without', error);
        }
      }
      
      const result: BandOptimizationResult = {
        selectedBand,
        expectedPerformance,
        confidence,
        alternatives,
        recommendations,
        processingResult,
        estimatedTime,
        memoryRequired,
        bandDistribution: Object.fromEntries(bandCounts)
      };
      
      await this.logger.info('Enhanced batch optimization complete', {
        selectedBand,
        confidence: confidence.toFixed(3),
        numbersProcessed: numbers.length,
        estimatedTime: estimatedTime.toFixed(2) + 's',
        memoryRequired: (memoryRequired / 1024).toFixed(1) + 'KB'
      });
      
      return result;
      
    } catch (error) {
      await this.logger.error('Enhanced batch optimization failed', error);
      throw error;
    }
  }
  
  /**
   * Enhanced configuration update
   */
  async enhancedUpdateConfiguration(band: BandType, config: BandConfig): Promise<void> {
    await this.logger.debug(`Updating enhanced configuration for band ${band}`, config);
    
    try {
      // Update band configuration
      const currentMetrics = this.bandMetrics.get(band) || await createEnhancedBandMetrics(band);
      
      // Apply configuration changes
      if (config.accelerationFactor !== undefined) {
        currentMetrics.accelerationFactor = config.accelerationFactor;
        currentMetrics.throughput = 1000 * config.accelerationFactor;
        currentMetrics.latency = 1 / config.accelerationFactor;
      }
      
      this.bandMetrics.set(band, currentMetrics);
      
      // Update spectral module configuration if available
      if (this.spectralModule && config.spectralConfig) {
        this.spectralModule.configure(config.spectralConfig);
      }
      
      // Update registry configuration if available
      if (this.registry && config.registryConfig) {
        await this.registry.updateConfiguration(config.registryConfig);
      }
      
      // Update processor configuration if available
      if (this.processors && config.processorConfig) {
        await this.processors.updateConfiguration(config.processorConfig);
      }
      
      await this.logger.info(`Enhanced configuration updated for band ${band}`);
      
    } catch (error) {
      await this.logger.error(`Failed to update enhanced configuration for band ${band}`, error);
      throw error;
    }
  }
  
  /**
   * Enhanced performance metrics
   */
  async enhancedGetPerformanceMetrics(): Promise<BandPerformanceMetrics> {
    try {
      const bandUtilization = new Map<BandType, number>();
      
      // Calculate real utilization based on actual usage
      for (const band of Object.values(BandType)) {
        const metrics = this.bandMetrics.get(band);
        if (metrics) {
          // Use real throughput data to calculate utilization
          const utilization = Math.min(0.95, metrics.throughput / (metrics.throughput + 1000));
          bandUtilization.set(band, utilization);
        } else {
          bandUtilization.set(band, 0.1); // Default low utilization
        }
      }
      
      // Calculate overall metrics
      const overallErrorRate = Array.from(this.bandMetrics.values())
        .reduce((acc, metrics) => acc + metrics.errorRate, 0) / this.bandMetrics.size;
      
      // Get component health metrics
      const componentHealth = await this.getComponentHealth();
      
      const performanceMetrics: BandPerformanceMetrics = {
        bandUtilization,
        overallErrorRate,
        transitionOverhead: this.calculateTransitionOverhead(),
        optimalBandSelection: this.calculateOptimalBandSelection(),
        averageAccuracy: this.calculateAverageAccuracy(),
        componentHealth,
        stats: this.stats,
        averageProcessingTime: this.stats.averageProcessingTime
      };
      
      await this.logger.debug('Enhanced performance metrics calculated', {
        overallErrorRate: overallErrorRate.toFixed(4),
        averageProcessingTime: this.stats.averageProcessingTime.toFixed(2) + 'ms',
        componentHealth: componentHealth.overallHealth.toFixed(2)
      });
      
      return performanceMetrics;
      
    } catch (error) {
      await this.logger.error('Failed to get enhanced performance metrics', error);
      throw error;
    }
  }
  
  /**
   * Perform spectral analysis
   */
  private async performSpectralAnalysis(audioData: number[], band?: BandType): Promise<any> {
    if (!this.spectralModule) {
      throw new Error('Spectral module not initialized');
    }
    
    this.stats.spectralAnalysisCount++;
    
    try {
      if (band) {
        return await this.spectralModule.analyze(audioData, band as any);
      } else {
        return await this.spectralModule.analyzeMultiBand(audioData);
      }
    } catch (error) {
      await this.logger.error('Spectral analysis failed', error);
      throw error;
    }
  }
  
  /**
   * Execute processing strategy
   */
  private async executeProcessingStrategy(numbers: bigint[], strategy: ProcessingStrategy): Promise<any> {
    if (!this.processors) {
      throw new Error('Processors not initialized');
    }
    
    this.stats.processorInvocations++;
    
    try {
      return await this.processors.process(numbers, strategy);
    } catch (error) {
      await this.logger.error('Processing strategy execution failed', error);
      throw error;
    }
  }
  
  /**
   * Perform registry lookup
   */
  private async performRegistryLookup(numbers: bigint[]): Promise<any> {
    if (!this.registry) {
      throw new Error('Registry not initialized');
    }
    
    try {
      const results = await Promise.all(
        numbers.map(n => this.registry!.lookup(n))
      );
      
      const hits = results.filter(r => r !== null).length;
      this.stats.registryHits += hits;
      
      return {
        results,
        hitRate: hits / numbers.length,
        totalLookups: numbers.length,
        hits
      };
    } catch (error) {
      await this.logger.error('Registry lookup failed', error);
      throw error;
    }
  }
  
  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<any> {
    try {
      const health = {
        coreModules: validateEnhancedUtilsIntegration(),
        spectralModule: this.spectralModule ? await this.checkSpectralModuleHealth() : { status: 'disabled' },
        registry: this.registry ? await this.checkRegistryHealth() : { status: 'disabled' },
        processors: this.processors ? await this.checkProcessorsHealth() : { status: 'disabled' },
        adapters: await this.checkAdaptersHealth(),
        overall: 0
      };
      
      // Calculate overall health
      const components = [
        health.coreModules.overallHealth,
        health.spectralModule.status === 'disabled' ? 1 : (health.spectralModule.health || 0),
        health.registry.status === 'disabled' ? 1 : (health.registry.health || 0),
        health.processors.status === 'disabled' ? 1 : (health.processors.health || 0),
        health.adapters.overallHealth || 0
      ];
      
      health.overall = components.reduce((sum, h) => sum + h, 0) / components.length;
      
      return health;
    } catch (error) {
      await this.logger.error('Health check failed', error);
      return { error: error.message, overall: 0 };
    }
  }
  
  /**
   * Enhanced reset
   */
  async enhancedResetOptimization(): Promise<void> {
    await this.logger.info('Performing enhanced reset');
    
    try {
      // Reset base state
      await this.reset();
      
      // Reset component-specific state
      if (this.spectralModule) {
        this.spectralModule.clearCache();
      }
      
      if (this.registry) {
        await this.registry.clearCache();
      }
      
      if (this.processors) {
        await this.processors.reset();
      }
      
      // Reset stats
      this.stats = {
        classificationsPerformed: 0,
        optimizationsExecuted: 0,
        spectralAnalysisCount: 0,
        registryHits: 0,
        processorInvocations: 0,
        averageProcessingTime: 0
      };
      
      await this.logger.info('Enhanced reset complete');
      
    } catch (error) {
      await this.logger.error('Enhanced reset failed', error);
      throw error;
    }
  }
  
  // Initialization methods
  
  private async initializeCoreModuleIntegration(): Promise<void> {
    await this.logger.debug('Initializing core module integration');
    
    const modules = {
      primeRegistry: this.config.primeRegistry,
      precisionModule: this.config.precisionModule,
      encodingModule: this.config.encodingModule,
      streamProcessor: this.config.streamProcessor
    };
    
    await initializeEnhancedUtils(modules);
    
    const health = validateEnhancedUtilsIntegration();
    if (health.overallHealth < 0.5) {
      await this.logger.warn('Core module integration health is low', health);
    }
  }
  
  private async initializeSpectralModule(): Promise<void> {
    await this.logger.debug('Initializing spectral module');
    
    try {
      if (this.config.primeRegistry && this.config.encodingModule && this.config.precisionModule) {
        this.spectralModule = await createSpectralModuleWithCoreModules({
          enableNTT: true,
          enableBandOptimization: true,
          enableCaching: true,
          nttSize: 4096,
          windowFunction: 'hann'
        });
      } else {
        await this.logger.warn('Spectral module disabled due to missing core modules');
      }
    } catch (error) {
      await this.logger.error('Failed to initialize spectral module', error);
    }
  }
  
  private async initializeRegistry(): Promise<void> {
    await this.logger.debug('Initializing registry');
    
    try {
      this.registry = await createBandRegistry({
        enableCaching: true,
        cacheSize: 10000,
        enablePersistence: false,
        enableAnalytics: true
      });
    } catch (error) {
      await this.logger.error('Failed to initialize registry', error);
    }
  }
  
  private async initializeProcessors(): Promise<void> {
    await this.logger.debug('Initializing processors');
    
    try {
      this.processors = await createStrategyProcessor({
        enableCaching: true,
        enableParallelProcessing: true,
        maxConcurrency: this.config.maxConcurrency,
        memoryLimit: this.config.memoryLimit
      });
    } catch (error) {
      await this.logger.error('Failed to initialize processors', error);
    }
  }
  
  private async initializeAdapters(): Promise<void> {
    await this.logger.debug('Initializing enhanced adapters');
    
    try {
      if (this.config.primeRegistry) {
        this.adapters.prime = createEnhancedPrimeAdapter({
          primeRegistryOptions: {
            preloadCount: 2000,
            useStreaming: true,
            enableLogs: false
          }
        });
      }
      
      if (this.config.encodingModule) {
        this.adapters.encoding = createEnhancedEncodingAdapter({
          enableNTT: true,
          enableSpectralTransforms: true,
          chunkIdLength: 16
        });
      }
      
      if (this.config.precisionModule) {
        this.adapters.precision = createEnhancedPrecisionAdapter({
          precisionModuleOptions: {
            enableCaching: true,
            cacheSize: 15000,
            useOptimized: true
          }
        });
      }
      
      if (this.config.streamProcessor) {
        this.adapters.stream = createEnhancedStreamAdapter({
          defaultChunkSize: 4096,
          maxConcurrency: this.config.maxConcurrency,
          enableBackpressure: true
        });
      }
    } catch (error) {
      await this.logger.error('Failed to initialize adapters', error);
    }
  }
  
  private async initializeBandMetrics(): Promise<void> {
    await this.logger.debug('Initializing enhanced band metrics');
    
    for (const band of Object.values(BandType)) {
      try {
        const metrics = await createEnhancedBandMetrics(band);
        this.bandMetrics.set(band, metrics);
      } catch (error) {
        await this.logger.error(`Failed to initialize metrics for band ${band}`, error);
        // Use fallback metrics
        this.bandMetrics.set(band, this.createFallbackBandMetrics(band));
      }
    }
  }
  
  // Helper methods
  
  private determineOptimalBand(
    characteristics: any, 
    spectralInfo?: any, 
    registryResult?: any
  ): BandType {
    // Use registry result if available and confident
    if (registryResult && registryResult.confidence > 0.9) {
      return registryResult.band;
    }
    
    // Use spectral analysis if available
    if (spectralInfo && spectralInfo.dominantBand) {
      return spectralInfo.dominantBand;
    }
    
    // Use enhanced bit size classification
    return this.enhancedClassifyByBitSize(characteristics.bitSize);
  }
  
  private enhancedClassifyByBitSize(bitSize: number): BandType {
    //
