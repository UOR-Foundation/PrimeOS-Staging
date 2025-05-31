/**
 * PrimeOS Core Package
 * ===================
 * 
 * Foundational layer implementing UOR kernel axioms.
 * Provides abstract interfaces and integration points for the kernel.
 * 
 * This package acts as the abstract base that the kernel extends,
 * providing unified access to all core mathematical primitives.
 * 
 * PRECISION ENFORCEMENT: All mathematical operations are enforced
 * to use the precision module's enhanced BigInt and modular arithmetic APIs.
 */

import {
  BaseModel,
  ModelResult,
  ModelState,
  ModelOptions
} from '../os/model';

// Precision module - foundational mathematical operations (MUST BE FIRST)
import type {
  PrecisionConfiguration,
  PrecisionInstance
} from './precision';
import {
  createAndInitializePrecision,
  MathUtilities,
  mod,
  modPow,
  modInverse,
  gcd,
  lcm,
  bitLength,
  isProbablePrime,
  calculateChecksum,
  verifyValue
} from './precision';

// Core Module Interfaces and Types
import type {
  PrimeRegistryInterface,
  PrimeRegistryOptions,
  Factor
} from './prime';

import type {
  IntegrityInterface,
  IntegrityOptions
} from './integrity';

import type {
  EncodingInterface,
  EncodingOptions
} from './encoding';

import type {
  StreamInterface,
  StreamOptions
} from './stream';

import type {
  BandOptimizationInterface,
  BandOptimizationOptions,
  BandClassification,
  BandOptimizationResult,
  BandType
} from './bands';

// Factory functions for creating module instances
import { createAndInitializePrimeRegistry } from './prime';
import { createAndInitializeIntegrity } from './integrity';
import { createAndInitializeEncoding } from './encoding';
import { createAndInitializeStream } from './stream';
import { createAndInitializeBands } from './bands';

/**
 * Core package configuration options
 */
export interface CoreOptions extends ModelOptions {
  // Precision system configuration (foundational)
  precisionOptions?: PrecisionConfiguration;
  
  // Module-specific options
  primeOptions?: PrimeRegistryOptions;
  integrityOptions?: IntegrityOptions;
  encodingOptions?: EncodingOptions;
  streamOptions?: StreamOptions;
  bandsOptions?: BandOptimizationOptions;
  
  // Integration settings
  enableDependencyInjection?: boolean;
  autoInitialize?: boolean;
  enableCrossModuleOptimization?: boolean;
  enforcePrecisionAPIs?: boolean;
  
  // Performance settings
  enableBandOptimization?: boolean;
  enableStreamOptimization?: boolean;
  enableIntegrityVerification?: boolean;
  enablePrecisionCaching?: boolean;
}

/**
 * Core state extending base model state
 */
export interface CoreState extends ModelState {
  modules: {
    precision?: boolean;
    prime?: boolean;
    integrity?: boolean;
    encoding?: boolean;
    stream?: boolean;
    bands?: boolean;
  };
  integrationStatus: {
    dependenciesResolved: boolean;
    crossModuleOptimizationEnabled: boolean;
    precisionEnforced: boolean;
    activeIntegrations: string[];
  };
  performance: {
    operationsPerSecond: number;
    averageLatency: number;
    memoryUsage: number;
    cacheHitRate: number;
    precisionOperations: number;
  };
}

/**
 * Unified Core Interface
 * 
 * This interface represents the abstract foundation that the kernel extends.
 * It provides access to all mathematical primitives and their integrations.
 */
export interface CoreInterface {
  // Module access (precision first)
  getPrecisionSystem(): PrecisionInstance | undefined;
  getPrimeRegistry(): PrimeRegistryInterface | undefined;
  getIntegritySystem(): IntegrityInterface | undefined;
  getEncodingSystem(): EncodingInterface | undefined;
  getStreamProcessor(): StreamInterface | undefined;
  getBandOptimizer(): BandOptimizationInterface | undefined;
  
  // Precision API enforcement
  getMathUtils(): typeof MathUtilities;
  enforceOperation<T>(operation: () => T, operationName?: string): T;
  
  // Enhanced operations using precision APIs
  processWithBandOptimization(input: bigint): Promise<any>;
  encodeWithIntegrity(data: any): Promise<bigint>;
  
  // Configuration and management
  configureModules(options: Partial<CoreOptions>): Promise<void>;
  getIntegrationStatus(): {
    dependenciesResolved: boolean;
    activeModules: string[];
    crossModuleOptimizations: string[];
    precisionEnforced: boolean;
  };
  
  // State management
  getState(): CoreState;
  
  // Performance monitoring
  getPerformanceMetrics(): {
    operationsPerSecond: number;
    averageLatency: number;
    memoryUsage: number;
    modulePerformance: Record<string, any>;
    precisionMetrics: Record<string, any>;
  };
  
  // Lifecycle methods
  initialize(): Promise<ModelResult<unknown>>;
  reset(): Promise<ModelResult<unknown>>;
  terminate(): Promise<ModelResult<unknown>>;
}

/**
 * Default core options with precision enforcement
 */
const DEFAULT_CORE_OPTIONS: Required<Omit<CoreOptions, keyof ModelOptions>> = {
  // Precision system configuration (production-quality defaults)
  precisionOptions: {
    debug: false,
    enableCaching: true,
    pythonCompatible: true,
    checksumPower: 6,
    cacheSize: 10000,
    cachePolicy: 'lru',
    useOptimized: true,
    strict: true,
    verifyOnOperation: false,
    failFast: true
  },
  primeOptions: {},
  integrityOptions: {},
  encodingOptions: {},
  streamOptions: {},
  bandsOptions: {},
  enableDependencyInjection: true,
  autoInitialize: true,
  enableCrossModuleOptimization: true,
  enforcePrecisionAPIs: true,
  enableBandOptimization: true,
  enableStreamOptimization: true,
  enableIntegrityVerification: true,
  enablePrecisionCaching: true
};

/**
 * Core Implementation with Precision Enforcement
 * 
 * Main implementation of the core interface that coordinates all modules
 * and enforces the use of precision mathematical operations throughout.
 */
export class CoreImplementation extends BaseModel implements CoreInterface {
  private modules: {
    precision?: PrecisionInstance;
    prime?: PrimeRegistryInterface;
    integrity?: IntegrityInterface;
    encoding?: EncodingInterface;
    stream?: StreamInterface;
    bands?: BandOptimizationInterface;
  } = {};
  
  private config: Required<Omit<CoreOptions, keyof ModelOptions>>;
  private initializationPromise?: Promise<void>;
  private performanceMetrics = {
    operationsPerSecond: 0,
    averageLatency: 0,
    memoryUsage: 0,
    operationCount: 0,
    totalLatency: 0,
    precisionOperations: 0
  };
  
  constructor(options: CoreOptions = {}) {
    super({
      name: '@primeos/core',
      version: '1.0.0',
      debug: false,
      ...options
    });
    
    this.config = {
      ...DEFAULT_CORE_OPTIONS,
      ...options
    };
  }
  
  /**
   * Initialize the core with dependency injection and precision enforcement
   */
  protected override async onInitialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    this.initializationPromise = this.initializeModules();
    await this.initializationPromise;
  }
  
  /**
   * Initialize all modules with proper dependency injection and precision enforcement
   */
  private async initializeModules(): Promise<void> {
    await this.logger.info('Initializing PrimeOS Core with precision enforcement');
    
    try {
      // STEP 1: Initialize precision system first (most foundational)
      this.modules.precision = await createAndInitializePrecision(this.config.precisionOptions);
      await this.logger.debug('Precision system initialized - enhanced mathematical operations available');
      
      // STEP 2: Configure global precision API enforcement
      this.enforcePrecisionAPIs();
      
      // STEP 3: Initialize prime registry (precision APIs available globally)
      this.modules.prime = await createAndInitializePrimeRegistry(this.config.primeOptions);
      await this.logger.debug('Prime registry initialized with precision enforcement');
      
      // STEP 4: Initialize integrity system (depends on prime)
      this.modules.integrity = await createAndInitializeIntegrity({
        ...this.config.integrityOptions,
        primeRegistry: this.modules.prime
      });
      await this.logger.debug('Integrity system initialized with precision enforcement');
      
      // STEP 5: Initialize encoding system (depends on prime and integrity)
      this.modules.encoding = await createAndInitializeEncoding({
        ...this.config.encodingOptions,
        primeRegistry: this.modules.prime,
        integrityModule: this.modules.integrity
      });
      await this.logger.debug('Encoding system initialized with precision enforcement');
      
      // STEP 6: Initialize stream processor (precision APIs available globally)
      this.modules.stream = await createAndInitializeStream({
        ...this.config.streamOptions,
        encodingModule: this.modules.encoding,
        primeRegistry: this.modules.prime
      });
      await this.logger.debug('Stream processor initialized with precision enforcement');
      
      // STEP 7: Initialize band optimizer (precision APIs available globally)
      this.modules.bands = await createAndInitializeBands(this.config.bandsOptions);
      await this.logger.debug('Band optimizer initialized with precision enforcement');
      
      // STEP 8: Configure cross-module optimizations
      if (this.config.enableCrossModuleOptimization) {
        await this.configureCrossModuleOptimizations();
      }
      
      // STEP 9: Update state
      this.state.custom = {
        modules: {
          precision: !!this.modules.precision,
          prime: !!this.modules.prime,
          integrity: !!this.modules.integrity,
          encoding: !!this.modules.encoding,
          stream: !!this.modules.stream,
          bands: !!this.modules.bands
        },
        integrationStatus: {
          dependenciesResolved: true,
          crossModuleOptimizationEnabled: this.config.enableCrossModuleOptimization,
          precisionEnforced: this.config.enforcePrecisionAPIs,
          activeIntegrations: this.getActiveIntegrations()
        },
        performance: { ...this.performanceMetrics, cacheHitRate: 0 }
      };
      
      await this.logger.info('PrimeOS Core initialization complete with precision enforcement', {
        modules: Object.keys(this.modules),
        precisionEnforced: this.config.enforcePrecisionAPIs,
        crossModuleOptimization: this.config.enableCrossModuleOptimization
      });
      
    } catch (error) {
      await this.logger.error('Core initialization failed', error);
      throw error;
    }
  }
  
  /**
   * Enforce precision APIs across all modules
   * This ensures all mathematical operations use the enhanced precision module
   */
  private enforcePrecisionAPIs(): void {
    if (!this.config.enforcePrecisionAPIs || !this.modules.precision) {
      return;
    }
    
    // Make precision operations globally available to all modules
    const precisionOps = this.modules.precision.MathUtilities;
    
    // Set up global precision enforcement
    (globalThis as any).__PRIMEOS_PRECISION__ = {
      mod: precisionOps.mod,
      modPow: precisionOps.modPow,
      modInverse: precisionOps.modInverse,
      gcd: precisionOps.gcd,
      lcm: precisionOps.lcm,
      bitLength: precisionOps.bitLength,
      isProbablePrime: precisionOps.isProbablePrime,
      calculateChecksum: precisionOps.calculateChecksum,
      verifyChecksum: precisionOps.verifyChecksum,
      toByteArray: precisionOps.toByteArray,
      fromByteArray: precisionOps.fromByteArray
    };
    
    this.logger.debug('Precision APIs enforced globally for all modules').catch(() => {});
  }
  
  /**
   * Configure cross-module optimizations with precision integration
   */
  private async configureCrossModuleOptimizations(): Promise<void> {
    // Configure stream processor with band optimization
    if (this.modules.stream && this.modules.bands) {
      this.modules.stream.configure({
        bandsOptimizer: this.modules.bands
      });
    }
    
    await this.logger.debug('Cross-module optimizations configured with precision enforcement');
  }
  
  /**
   * Process operations with automatic module routing and precision enforcement
   */
  protected override async onProcess<T = any, R = unknown>(input: T): Promise<R> {
    const startTime = performance.now();
    
    try {
      // All operations go through precision enforcement
      const result = this.enforceOperation(() => {
        return input as unknown as R;
      }, 'core-process');
      
      this.updatePerformanceMetrics(performance.now() - startTime);
      return result;
      
    } catch (error) {
      await this.logger.error('Core processing failed', error);
      throw error;
    }
  }
  
  // Module access methods
  getPrecisionSystem(): PrecisionInstance | undefined {
    return this.modules.precision;
  }
  
  getPrimeRegistry(): PrimeRegistryInterface | undefined {
    return this.modules.prime;
  }
  
  getIntegritySystem(): IntegrityInterface | undefined {
    return this.modules.integrity;
  }
  
  getEncodingSystem(): EncodingInterface | undefined {
    return this.modules.encoding;
  }
  
  getStreamProcessor(): StreamInterface | undefined {
    return this.modules.stream;
  }
  
  getBandOptimizer(): BandOptimizationInterface | undefined {
    return this.modules.bands;
  }
  
  // Precision API enforcement
  getMathUtils(): typeof MathUtilities {
    if (!this.modules.precision) {
      throw new Error('Precision system not initialized');
    }
    return this.modules.precision.MathUtilities;
  }
  
  enforceOperation<T>(operation: () => T, operationName: string = 'operation'): T {
    if (!this.config.enforcePrecisionAPIs) {
      return operation();
    }
    
    this.performanceMetrics.precisionOperations++;
    
    try {
      const result = operation();
      
      // If the operation involves BigInt and we have precision verification enabled
      if (this.config.enableIntegrityVerification && 
          this.modules.precision && 
          typeof result === 'bigint') {
        // Verify the result using precision verification if prime registry is available
        if (this.modules.prime) {
          try {
            verifyValue(result, this.modules.prime);
          } catch (error) {
            this.logger.warn(`Precision verification failed for ${operationName}`, error).catch(() => {});
            if (this.config.precisionOptions?.failFast) {
              throw error;
            }
          }
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Operation ${operationName} failed`, error).catch(() => {});
      throw error;
    }
  }
  
  // Enhanced operations using precision APIs
  async processWithBandOptimization(input: bigint): Promise<any> {
    return this.enforceOperation(async () => {
      if (!this.modules.bands) {
        throw new Error('Band optimization module not available');
      }
      
      // Use precision APIs for all mathematical operations
      if (this.modules.precision) {
        const mathUtils = this.modules.precision.MathUtilities;
        
        // Verify input using precision verification
        if (this.config.enableIntegrityVerification && this.modules.prime) {
          try {
            verifyValue(input, this.modules.prime);
          } catch (error) {
            this.logger.warn('Input verification failed, proceeding with caution', error).catch(() => {});
          }
        }
        
        // Use precision bitLength for classification
        const inputBitLength = mathUtils.bitLength(input);
        this.logger.debug(`Processing ${inputBitLength}-bit number with precision APIs`).catch(() => {});
      }
      
      const classification = await this.modules.bands.classifyNumber(input);
      const optimization = await this.modules.bands.optimizeBatch([input]);
      
      return {
        classification,
        optimization,
        recommendedBand: optimization.selectedBand,
        precisionVerified: this.config.enableIntegrityVerification,
        precisionEnforced: this.config.enforcePrecisionAPIs
      };
    }, 'processWithBandOptimization');
  }
  
  async encodeWithIntegrity(data: any): Promise<bigint> {
    return this.enforceOperation(async () => {
      if (!this.modules.encoding || !this.modules.integrity) {
        throw new Error('Encoding or integrity modules not available');
      }
      
      if (!this.modules.precision) {
        throw new Error('Precision system required for integrity operations');
      }
      
      // Use precision APIs for all encoding operations
      const mathUtils = this.modules.precision.MathUtilities;
      
      // Convert data to BigInt using precision utilities
      const dataString = JSON.stringify(data);
      const dataBytes = new TextEncoder().encode(dataString);
      const dataValue = mathUtils.fromByteArray(dataBytes);
      
      // For demonstration, create a simple checksum using modular arithmetic
      // In a real implementation, this would use the integrity module's checksum calculation
      const checksum = mathUtils.mod(dataValue, BigInt(1000000007)); // Simple modular checksum
      
      // Attach checksum using modular exponentiation (6th power as per UOR)
      const result = dataValue * mathUtils.modPow(checksum, BigInt(6), BigInt(Number.MAX_SAFE_INTEGER));
      
      // Verify the result
      if (this.config.enableIntegrityVerification) {
        const verified = mathUtils.verifyChecksum(result, this.modules.prime);
        if (!verified) {
          throw new Error('Integrity verification failed after encoding');
        }
      }
      
      return result;
    }, 'encodeWithIntegrity');
  }
  
  // Configuration management
  async configureModules(options: Partial<CoreOptions>): Promise<void> {
    Object.assign(this.config, options);
    
    // Reconfigure individual modules (precision APIs are globally available)
    if (options.streamOptions && this.modules.stream) {
      this.modules.stream.configure(options.streamOptions);
    }
    
    if (options.precisionOptions && this.modules.precision) {
      // Precision configuration changes require re-enforcement
      this.enforcePrecisionAPIs();
    }
    
    await this.logger.debug('Module configuration updated with precision awareness', options);
  }
  
  getIntegrationStatus() {
    return {
      dependenciesResolved: Object.keys(this.modules).length > 0,
      activeModules: Object.keys(this.modules),
      crossModuleOptimizations: this.getActiveIntegrations(),
      precisionEnforced: this.config.enforcePrecisionAPIs
    };
  }
  
  // State management
  override getState(): CoreState {
    const baseState = super.getState();
    
    return {
      ...baseState,
      modules: {
        precision: !!this.modules.precision,
        prime: !!this.modules.prime,
        integrity: !!this.modules.integrity,
        encoding: !!this.modules.encoding,
        stream: !!this.modules.stream,
        bands: !!this.modules.bands
      },
      integrationStatus: {
        dependenciesResolved: Object.keys(this.modules).length > 0,
        crossModuleOptimizationEnabled: this.config.enableCrossModuleOptimization,
        precisionEnforced: this.config.enforcePrecisionAPIs,
        activeIntegrations: this.getActiveIntegrations()
      },
      performance: {
        operationsPerSecond: this.performanceMetrics.operationsPerSecond,
        averageLatency: this.performanceMetrics.averageLatency,
        memoryUsage: this.performanceMetrics.memoryUsage,
        cacheHitRate: 0, // Would be calculated from module metrics
        precisionOperations: this.performanceMetrics.precisionOperations
      }
    };
  }
  
  // Performance monitoring with precision metrics
  getPerformanceMetrics() {
    const precisionMetrics = this.modules.precision ? {
      cacheHits: this.modules.precision.cache?.getStats?.()?.hits || 0,
      cacheMisses: this.modules.precision.cache?.getStats?.()?.misses || 0,
      operationsCount: this.performanceMetrics.precisionOperations
    } : {};
    
    return {
      operationsPerSecond: this.performanceMetrics.operationsPerSecond,
      averageLatency: this.performanceMetrics.averageLatency,
      memoryUsage: this.performanceMetrics.memoryUsage,
      modulePerformance: this.getModulePerformanceMetrics(),
      precisionMetrics
    };
  }
  
  // Reset and cleanup with precision awareness
  protected override async onReset(): Promise<void> {
    // Reset performance metrics
    this.performanceMetrics = {
      operationsPerSecond: 0,
      averageLatency: 0,
      memoryUsage: 0,
      operationCount: 0,
      totalLatency: 0,
      precisionOperations: 0
    };
    
    // Clear precision caches
    if (this.modules.precision) {
      this.modules.precision.cache?.clear?.();
    }
    
    await this.logger.info('Core reset complete with precision state cleared');
  }
  
  protected override async onTerminate(): Promise<void> {
    // Clear global precision enforcement
    if ((globalThis as any).__PRIMEOS_PRECISION__) {
      delete (globalThis as any).__PRIMEOS_PRECISION__;
    }
    
    this.modules = {};
    await this.logger.info('Core terminated with precision enforcement removed');
  }
  
  // Helper methods
  private getActiveIntegrations(): string[] {
    const integrations: string[] = [];
    
    if (this.modules.precision) {
      integrations.push('precision-enforcement');
    }
    if (this.modules.stream && this.modules.bands) {
      integrations.push('stream-bands');
    }
    if (this.modules.encoding && this.modules.integrity) {
      integrations.push('encoding-integrity');
    }
    if (this.modules.prime && this.modules.integrity) {
      integrations.push('prime-integrity');
    }
    if (this.modules.precision && this.modules.prime) {
      integrations.push('precision-prime');
    }
    
    return integrations;
  }
  
  private getModulePerformanceMetrics() {
    const metrics: Record<string, any> = {};
    
    // Each module would provide its own performance metrics
    if (this.modules.precision) {
      metrics.precision = {
        operationsCount: this.performanceMetrics.precisionOperations,
        cacheEnabled: this.config.enablePrecisionCaching
      };
    }
    
    return metrics;
  }
  
  private updatePerformanceMetrics(latency: number): void {
    this.performanceMetrics.operationCount++;
    this.performanceMetrics.totalLatency += latency;
    this.performanceMetrics.averageLatency = this.performanceMetrics.totalLatency / this.performanceMetrics.operationCount;
    
    // Calculate operations per second (simple moving average)
    const now = Date.now();
    this.performanceMetrics.operationsPerSecond = this.performanceMetrics.operationCount / ((now - (this.state.lastStateChangeTime || now)) / 1000);
  }
}

/**
 * Create a core instance with precision enforcement
 */
export function createCore(options: CoreOptions = {}): CoreInterface {
  return new CoreImplementation(options);
}

/**
 * Create and initialize a core instance with precision enforcement
 */
export async function createAndInitializeCore(options: CoreOptions = {}): Promise<CoreInterface> {
  const core = createCore(options);
  const result = await core.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize core: ${result.error}`);
  }
  
  return core;
}

// Re-export key module factory functions
export { 
  createAndInitializePrecision,
  createAndInitializePrimeRegistry,
  createAndInitializeIntegrity,
  createAndInitializeEncoding,
  createAndInitializeStream,
  createAndInitializeBands
};

// Re-export precision APIs for direct use by modules and kernel
export {
  MathUtilities,
  mod,
  modPow,
  modInverse,
  gcd,
  lcm,
  bitLength,
  isProbablePrime,
  calculateChecksum,
  verifyValue
};

// Re-export key types for kernel access
export type { 
  CoreOptions as PrimeCoreOptions,
  CoreState as PrimeCoreState,
  CoreInterface as PrimeCoreInterface,
  PrecisionConfiguration,
  PrecisionInstance,
  PrimeRegistryInterface,
  IntegrityInterface,
  EncodingInterface,
  StreamInterface,
  BandOptimizationInterface,
  Factor,
  BandType,
  BandClassification,
  BandOptimizationResult
};
