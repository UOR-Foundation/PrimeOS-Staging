/**
 * Precision Model Implementation
 * =============================
 * 
 * This implements the precision module as a proper os/model with lifecycle management.
 */

import {
  BaseModel,
  ModelResult,
  ModelLifecycleState,
  ModelOptions
} from '../../os/model';

import { createLogging } from '../../os/logging';

import {
  Factor
} from './types';

// Import configuration types from index
import type {
  PrecisionConfiguration,
  PrecisionInstance
} from './index';

// Import submodule factories
import { createAndInitializeBigInt } from './bigint';
import { createAndInitializeModularOperations } from './modular';
import { createAndInitializeChecksums } from './checksums';
import { createAndInitializeVerification } from './verification';
import { createAndInitializeMathUtilsModel } from './utils';
import { createAndInitializeCache, CacheModelInterface } from './cache';
import { registerCache, clearAllRegisteredCaches } from './cache-registry';

// Import module references for static exports
import * as bigintModule from './bigint';
import * as modularModule from './modular';
import * as checksumsModule from './checksums';
import * as verificationModule from './verification';
import * as utilsModule from './utils';
import * as cacheModule from './cache';

/**
 * Process input for precision operations
 */
export interface PrecisionProcessInput {
  operation: string;
  module?: 'bigint' | 'modular' | 'checksums' | 'verification' | 'utils' | 'cache';
  params?: any[];
}

/**
 * Extended state for Precision module
 */
export interface PrecisionState {
  lifecycle: ModelLifecycleState;
  lastStateChangeTime: number;
  uptime: number;
  operationCount: {
    total: number;
    success: number;
    failed: number;
  };
  custom: {
    config: PrecisionConfiguration;
    moduleStates: {
      bigint?: any;
      modular?: any;
      checksums?: any;
      verification?: any;
      utils?: any;
      cache?: any;
    };
    metrics: {
      operationsByModule: Record<string, number>;
      cacheHitRate?: number;
      averageOperationTime?: number;
    };
  };
}

/**
 * Precision Model class that extends BaseModel
 */
export class PrecisionModel extends BaseModel implements PrecisionInstance {
  private _config: PrecisionConfiguration;
  private _sharedCache?: CacheModelInterface;
  private _modules: {
    [key: string]: any;
    bigint?: any;
    modular?: any;
    checksums?: any;
    verification?: any;
    utils?: any;
    cache?: any;
  } = {};
  
  private _operationTimes: number[] = [];
  private _operationsByModule: Record<string, number> = {};
  
  // Static module references for compatibility
  public readonly bigint = bigintModule;
  public readonly modular = modularModule;
  public readonly checksums = checksumsModule;
  public readonly verification = verificationModule;
  public readonly utils = utilsModule;
  public readonly cache = cacheModule;
  
  constructor(config: PrecisionConfiguration = {}) {
    const options: ModelOptions = {
      name: 'precision',
      version: '1.0.0',
      id: `precision-${Date.now()}`,
      debug: config.debug
    };
    
    super(options);
    this._config = config;
  }
  
  /**
   * Get configuration
   */
  get config(): PrecisionConfiguration {
    return this._config;
  }
  
  /**
   * Get shared cache
   */
  get sharedCache(): CacheModelInterface | undefined {
    return this._sharedCache;
  }
  
  /**
   * Get MathUtilities interface
   * For synchronous compatibility, we use the static module references
   */
  get MathUtilities() {
    return {
      // BigInt operations
      bitLength: bigintModule.bitLength,
      exactlyEquals: bigintModule.exactlyEquals,
      toByteArray: bigintModule.toByteArray,
      fromByteArray: bigintModule.fromByteArray,
      getRandomBigInt: bigintModule.getRandomBigInt,
      isProbablePrime: bigintModule.isProbablePrime,
      
      // Modular arithmetic
      mod: modularModule.mod,
      modPow: modularModule.modPow,
      modInverse: modularModule.modInverse,
      gcd: modularModule.gcd,
      lcm: modularModule.lcm,
      extendedGcd: modularModule.extendedGcd,
      
      // Checksum operations
      calculateChecksum: checksumsModule.calculateChecksum,
      attachChecksum: checksumsModule.attachChecksum,
      verifyChecksum: (value: bigint, primeRegistry: any) => {
        try {
          verificationModule.verifyValue(value, primeRegistry);
          return true;
        } catch (e) {
          return false;
        }
      },
      
      // Cache operations
      createCache: (options: any) => {
        return verificationModule.createCacheFactory().createCache(options);
      },
      memoize: <T extends (...args: any[]) => any>(fn: T, options?: any) => {
        return verificationModule.createCacheFactory().memoize(fn, options);
      },
      memoizeAsync: <T extends (...args: any[]) => Promise<any>>(fn: T, options?: any) => {
        return verificationModule.createCacheFactory().memoizeAsync(fn, options);
      },
      
      // Utility operations
      utilBitLength: utilsModule.bitLength,
      utilExactlyEquals: utilsModule.exactlyEquals,
      utilToByteArray: utilsModule.toByteArray,
      utilFromByteArray: utilsModule.fromByteArray,
      isSafeInteger: utilsModule.isSafeInteger,
      sign: utilsModule.sign,
      abs: utilsModule.abs,
      isPowerOfTwo: utilsModule.isPowerOfTwo
    };
  }
  
  /**
   * Initialize the precision module
   */
  protected async onInitialize(): Promise<void> {
    await this.logger.info('Initializing precision module', { config: this._config });
    
    try {
      // Create shared cache if enabled
      if (this._config.enableCaching !== false) {
        const cacheOptions: any = {
          maxSize: this._config.cacheSize || 1000,
          strategy: this._config.cachePolicy === 'fifo' ? 'lru' : (this._config.cachePolicy || 'lru'),
          maxAge: this._config.cacheTTL,
          metrics: true,
          debug: this._config.debug,
          name: 'precision-shared-cache',
          version: '1.0.0'
        };
        
        this._sharedCache = await createAndInitializeCache(cacheOptions);
        
        // Register the shared cache
        registerCache(
          `precision-shared-cache-${this.options.id}`,
          this._sharedCache,
          'precision',
          'shared-cache'
        );
        
        await this.logger.debug('Created shared cache', { options: cacheOptions });
      }
      
      // Initialize submodules with configuration
      const moduleConfig = {
        debug: this._config.debug,
        enableCache: this._config.enableCaching !== false,
        useOptimized: this._config.useOptimized !== false,
        strict: this._config.strict || false,
        pythonCompatible: this._config.pythonCompatible !== false,
        checksumPower: this._config.checksumPower,
        verifyOnOperation: this._config.verifyOnOperation,
        failFast: this._config.failFast,
        enableRetry: this._config.enableRetry,
        retryOptions: this._config.retryOptions,
        cacheSize: this._config.cacheSize,
        sharedCache: this._sharedCache
      };
      
      // Initialize each submodule
      await this.logger.debug('Initializing submodules');
      
      this._modules.bigint = await createAndInitializeBigInt({
        ...moduleConfig,
        name: 'precision-bigint',
        version: '1.0.0'
      });
      
      this._modules.modular = await createAndInitializeModularOperations({
        ...moduleConfig,
        name: 'precision-modular',
        version: '1.0.0'
      });
      
      this._modules.checksums = await createAndInitializeChecksums({
        ...moduleConfig,
        name: 'precision-checksums',
        version: '1.0.0'
      });
      
      this._modules.verification = await createAndInitializeVerification({
        ...moduleConfig,
        name: 'precision-verification',
        version: '1.0.0'
      });
      
      this._modules.utils = await createAndInitializeMathUtilsModel({
        ...moduleConfig,
        name: 'precision-utils',
        version: '1.0.0'
      });
      
      this._modules.cache = this._sharedCache || await createAndInitializeCache({
        ...moduleConfig,
        name: 'precision-cache',
        version: '1.0.0'
      });
      
      // Initialize metrics
      this._operationsByModule = {
        bigint: 0,
        modular: 0,
        checksums: 0,
        verification: 0,
        utils: 0,
        cache: 0
      };
      
      // Update state
      this.state.custom = {
        config: this._config,
        moduleStates: this._getModuleStates(),
        metrics: this._getMetrics()
      };
      
      await this.logger.info('Precision module initialized successfully');
      
    } catch (error) {
      await this.logger.error('Failed to initialize precision module', error);
      throw error;
    }
  }
  
  /**
   * Process operations
   */
  protected async onProcess<T = PrecisionProcessInput, R = any>(input: T): Promise<R> {
    const startTime = performance.now();
    
    try {
      if (!input || typeof input !== 'object') {
        throw new Error('Invalid input: expected PrecisionProcessInput');
      }
      
      const processInput = input as unknown as PrecisionProcessInput;
      
      // Route to appropriate module
      if (processInput.module && processInput.operation) {
        const result = await this._callModule(
          processInput.module,
          processInput.operation,
          processInput.params || []
        );
        
        // Track metrics
        const duration = performance.now() - startTime;
        this._trackOperation(processInput.module, duration);
        
        return result as R;
      }
      
      // Handle direct operation calls
      switch (processInput.operation) {
        case 'getVersion':
          return this.getVersion() as unknown as R;
          
        case 'clearAllCaches':
          await this.clearAllCaches();
          return undefined as unknown as R;
          
        case 'getMetrics':
          return this._getMetrics() as unknown as R;
          
        default:
          throw new Error(`Unknown operation: ${processInput.operation}`);
      }
      
    } catch (error) {
      await this.logger.error('Process operation failed', { input, error });
      throw error;
    }
  }
  
  /**
   * Reset the module
   */
  protected async onReset(): Promise<void> {
    await this.logger.info('Resetting precision module');
    
    // Reset all submodules
    for (const [name, module] of Object.entries(this._modules)) {
      if (module && module.reset) {
        await module.reset();
      }
    }
    
    // Clear metrics
    this._operationTimes = [];
    this._operationsByModule = {
      bigint: 0,
      modular: 0,
      checksums: 0,
      verification: 0,
      utils: 0,
      cache: 0
    };
    
    // Update state
    this.state.custom = {
      config: this._config,
      moduleStates: this._getModuleStates(),
      metrics: this._getMetrics()
    };
    
    await this.logger.info('Precision module reset complete');
  }
  
  /**
   * Terminate the module
   */
  protected async onTerminate(): Promise<void> {
    await this.logger.info('Terminating precision module');
    
    // Terminate all submodules
    for (const [name, module] of Object.entries(this._modules)) {
      if (module && module.terminate) {
        await module.terminate();
      }
    }
    
    // Clear references
    this._modules = {};
    this._sharedCache = undefined;
    
    await this.logger.info('Precision module terminated');
  }
  
  /**
   * Get module state
   */
  getState(): PrecisionState {
    const baseState = super.getState();
    
    return {
      ...baseState,
      custom: {
        config: this._config,
        moduleStates: this._getModuleStates(),
        metrics: this._getMetrics()
      }
    } as PrecisionState;
  }
  
  /**
   * Get version
   */
  getVersion(): string {
    return this.options.version || '1.0.0';
  }
  
  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    await this.logger.debug('Clearing all caches');
    
    // Use the cache registry to clear all registered caches
    await clearAllRegisteredCaches();
    
    // Also clear module-specific caches that might not be registered
    try {
      // Clear shared cache
      if (this._sharedCache && this._sharedCache.clear) {
        await this._sharedCache.clear();
      }
      
      // Clear module-specific caches
      for (const [name, module] of Object.entries(this._modules)) {
        if (module && typeof module.clearCache === 'function') {
          await module.clearCache();
        }
      }
    } catch (error) {
      await this.logger.error('Error clearing module caches', error);
    }
    
    await this.logger.debug('All caches cleared');
  }
  
  /**
   * Call a module operation
   */
  private async _callModule(module: string, operation: string, params: any[]): Promise<any> {
    const moduleInstance = this._modules[module];
    
    if (!moduleInstance) {
      throw new Error(`Module ${module} not initialized`);
    }
    
    // For model-based modules, use process method
    if (moduleInstance.process) {
      return await moduleInstance.process({
        operation,
        params
      });
    }
    
    // For direct function modules
    if (typeof moduleInstance[operation] === 'function') {
      return moduleInstance[operation](...params);
    }
    
    throw new Error(`Operation ${operation} not found in module ${module}`);
  }
  
  /**
   * Track operation metrics
   */
  private _trackOperation(module: string, duration: number): void {
    this._operationsByModule[module] = (this._operationsByModule[module] || 0) + 1;
    
    this._operationTimes.push(duration);
    if (this._operationTimes.length > 1000) {
      this._operationTimes.shift();
    }
  }
  
  /**
   * Get module states
   */
  private _getModuleStates(): Record<string, any> {
    const states: Record<string, any> = {};
    
    for (const [name, module] of Object.entries(this._modules)) {
      if (module && module.getState) {
        states[name] = module.getState();
      }
    }
    
    return states;
  }
  
  /**
   * Get metrics
   */
  private _getMetrics(): any {
    const avgTime = this._operationTimes.length > 0
      ? this._operationTimes.reduce((a, b) => a + b, 0) / this._operationTimes.length
      : 0;
    
    let cacheHitRate = 0;
    if (this._sharedCache && this._sharedCache.getState) {
      const cacheState = this._sharedCache.getState();
      if (cacheState && cacheState.custom && typeof cacheState.custom === 'object') {
        const customState = cacheState.custom as any;
        if (customState.metrics && typeof customState.metrics === 'object') {
          cacheHitRate = customState.metrics.hitRate || 0;
        }
      }
    }
    
    return {
      operationsByModule: { ...this._operationsByModule },
      cacheHitRate,
      averageOperationTime: avgTime
    };
  }
}

/**
 * Create and initialize a precision model
 */
export async function createAndInitializePrecisionModel(
  config: PrecisionConfiguration = {}
): Promise<PrecisionModel> {
  const model = new PrecisionModel(config);
  const result = await model.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize precision model: ${result.error}`);
  }
  
  return model;
}
