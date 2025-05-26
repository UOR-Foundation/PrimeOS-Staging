/**
 * MathUtils Model Implementation
 * =============================
 * 
 * PrimeOS Model interface implementation for the MathUtils module.
 * This file contains the full model lifecycle management and caching.
 */

import {
  MathUtilsModelOptions,
  MathUtilsModelInterface,
  MathUtilsModelState,
  MathUtilsProcessInput,
  MathUtilsInterface,
  BitLengthFunction,
  ExactEqualsFunction
} from './types';

import {
  ModelResult,
  ModelLifecycleState,
  ModelState
} from '../../../os/model/types';
import { LoggingInterface, LogLevel } from '../../../os/logging/types';
import { createLogging } from '../../../os/logging';

import { 
  createLRUCache, 
  CacheModelInterface 
} from '../cache';

import { createMathUtils } from './core-functions';

/**
 * Default options for MathUtils model
 */
const DEFAULT_MODEL_OPTIONS: MathUtilsModelOptions = {
  enableCache: true,
  useOptimized: true,
  strict: false,
  debug: false,
  name: 'precision-utils',
  version: '1.0.0'
};

/**
 * MathUtilsImpl provides methods for mathematical utility operations.
 * Implements the PrimeOS Model interface pattern.
 */
export class MathUtilsImpl implements MathUtilsModelInterface {
  private config: MathUtilsModelOptions;
  private utils: MathUtilsInterface;
  private bitLengthCache: CacheModelInterface<string, number> | null = null;
  private bitLengthCacheHits: number = 0;
  private bitLengthCacheMisses: number = 0;
  private state: ModelState;
  private logger: LoggingInterface;
  private startTime: number;
  
  /**
   * Create a new MathUtils implementation
   */
  constructor(options: MathUtilsModelOptions = {}) {
    // Store utils-specific options
    this.config = { 
      ...DEFAULT_MODEL_OPTIONS, 
      ...options 
    };
    
    // Initialize state
    this.startTime = Date.now();
    this.state = {
      lifecycle: ModelLifecycleState.Uninitialized,
      lastStateChangeTime: this.startTime,
      uptime: 0,
      operationCount: {
        total: 0,
        success: 0,
        failed: 0
      },
      custom: {
        config: this.config,
        cache: {
          bitLengthCacheSize: 0,
          bitLengthCacheHits: 0,
          bitLengthCacheMisses: 0
        }
      }
    };
    
    // Initialize cache using precision/cache module
    try {
      this.bitLengthCache = createLRUCache<string, number>(1000, {
        name: 'bitLength-cache',
        metrics: true
      });
    } catch (error) {
      // Fallback to null cache if creation fails
      console.warn('Failed to create cache, disabling caching:', error);
      this.bitLengthCache = null;
      this.config.enableCache = false;
    }
    
    // Create utils instance
    this.utils = createMathUtils({
      enableCache: this.config.enableCache,
      useOptimized: this.config.useOptimized,
      strict: this.config.strict
    });
    
    // Initialize logger
    this.logger = createLogging({
      name: this.config.name || DEFAULT_MODEL_OPTIONS.name,
      debug: this.config.debug,
      minLevel: this.config.debug ? LogLevel.TRACE : LogLevel.INFO
    });
    
    if (this.config.debug) {
      console.log(`[${this.getModuleIdentifier()}] Created MathUtilsImpl with options:`, this.config);
    }
  }
  
  /**
   * Get module identifier
   */
  private getModuleIdentifier(): string {
    return this.config.id || 
           `${this.config.name}@${this.config.version}`;
  }
  
  /**
   * Update the module lifecycle state
   */
  private updateLifecycle(newState: ModelLifecycleState): void {
    const prevState = this.state.lifecycle;
    this.state.lifecycle = newState;
    this.state.lastStateChangeTime = Date.now();
    
    // Only log if the logger is initialized
    if (this.logger) {
      // Don't await this to avoid blocking the state transition
      this.logger.debug('State transition', { from: prevState, to: newState }).catch(() => {});
    }
    
    if (this.config.debug) {
      console.log(`[${this.getModuleIdentifier()}] State transition: ${prevState} -> ${newState}`);
    }
  }
  
  /**
   * Create a standardized result object
   */
  createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T> {
    return {
      success,
      data,
      error,
      timestamp: Date.now(),
      source: this.getModuleIdentifier()
    };
  }
  
  /**
   * Initialize the module
   */
  async initialize(): Promise<ModelResult> {
    const startTime = Date.now();
    this.updateLifecycle(ModelLifecycleState.Initializing);
    
    try {
      // Initialize logger first
      await this.logger.initialize();
      await this.logger.info('Initializing module', this.config);
      
      this.updateLifecycle(ModelLifecycleState.Ready);
      await this.logger.info('Module initialized successfully');
      
      return this.createResult(
        true, 
        { initialized: true },
        undefined
      );
    } catch (error) {
      this.updateLifecycle(ModelLifecycleState.Error);
      
      await this.logger.error('Initialization failed', error);
      
      if (this.config.debug) {
        console.error(`[${this.getModuleIdentifier()}] Initialization error:`, error);
      }
      
      return this.createResult(
        false,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  
  /**
   * Process input data and return results
   */
  async process<T = MathUtilsProcessInput, R = unknown>(input: T): Promise<R> {
    const startTime = Date.now();
    this.state.operationCount.total++;
    
    if (this.state.lifecycle !== ModelLifecycleState.Ready) {
      this.state.operationCount.failed++;
      const errorMessage = `Cannot process in ${this.state.lifecycle} state. Module must be in Ready state.`;
      await this.logger.warn(errorMessage);
      throw new Error(errorMessage);
    }
    
    this.updateLifecycle(ModelLifecycleState.Processing);
    
    await this.logger.debug('Processing input', input);
    if (this.config.debug) {
      console.log(`[${this.getModuleIdentifier()}] Processing input:`, input);
    }
    
    try {
      let result: R;
      
      // Process based on input type
      if (typeof input === 'object' && input !== null && 'operation' in input && 'params' in input) {
        const request = input as unknown as MathUtilsProcessInput;
        
        switch (request.operation) {
          case 'bitLength':
            result = this.bitLength(request.params[0]) as unknown as R;
            break;
            
          case 'exactlyEquals':
            result = this.exactlyEquals(
              request.params[0],
              request.params[1]
            ) as unknown as R;
            break;
            
          case 'toByteArray':
            result = this.toByteArray(request.params[0]) as unknown as R;
            break;
            
          case 'fromByteArray':
            result = this.fromByteArray(request.params[0]) as unknown as R;
            break;
            
          case 'isSafeInteger':
            result = this.isSafeInteger(request.params[0]) as unknown as R;
            break;
            
          case 'sign':
            result = this.sign(request.params[0]) as unknown as R;
            break;
            
          case 'abs':
            result = this.abs(request.params[0]) as unknown as R;
            break;
            
          case 'isPowerOfTwo':
            result = this.isPowerOfTwo(request.params[0]) as unknown as R;
            break;
            
          case 'gcd':
            result = this.gcd(
              request.params[0],
              request.params[1]
            ) as unknown as R;
            break;
            
          case 'lcm':
            result = this.lcm(
              request.params[0],
              request.params[1]
            ) as unknown as R;
            break;
            
          case 'extendedGcd':
            result = this.extendedGcd(
              request.params[0],
              request.params[1]
            ) as unknown as R;
            break;
            
          case 'integerSqrt':
            result = this.integerSqrt(request.params[0]) as unknown as R;
            break;
            
          case 'ceilDiv':
            result = this.ceilDiv(
              request.params[0],
              request.params[1]
            ) as unknown as R;
            break;
            
          case 'floorDiv':
            result = this.floorDiv(
              request.params[0],
              request.params[1]
            ) as unknown as R;
            break;
            
          case 'countSetBits':
            result = this.countSetBits(request.params[0]) as unknown as R;
            break;
            
          case 'leadingZeros':
            result = this.leadingZeros(request.params[0]) as unknown as R;
            break;
            
          case 'trailingZeros':
            result = this.trailingZeros(request.params[0]) as unknown as R;
            break;
            
          default:
            throw new Error(`Unknown operation: ${(request as any).operation}`);
        }
      } else {
        // For direct function calls without the operation wrapper
        result = input as unknown as R;
      }
      
      this.updateLifecycle(ModelLifecycleState.Ready);
      this.state.operationCount.success++;
      
      await this.logger.debug('Processing completed successfully', { resultSummary: typeof result });
      return result;
    } catch (error) {
      this.updateLifecycle(ModelLifecycleState.Error);
      this.state.operationCount.failed++;
      
      await this.logger.error('Processing error', error);
      
      if (this.config.debug) {
        console.error(`[${this.getModuleIdentifier()}] Processing error:`, error);
      }
      
      throw error;
    }
  }
  
  /**
   * Reset module to initial state
   */
  async reset(): Promise<ModelResult> {
    const startTime = Date.now();
    
    await this.logger.info('Resetting module');
    
    try {
      // Clear caches
      if (this.bitLengthCache && this.bitLengthCache.clear) {
        this.bitLengthCache.clear();
      }
      this.bitLengthCacheHits = 0;
      this.bitLengthCacheMisses = 0;
      
      // Update state
      if (this.state.custom) {
        this.state.custom.cache = {
          bitLengthCacheSize: 0,
          bitLengthCacheHits: 0,
          bitLengthCacheMisses: 0
        };
      }
      
      // Reset state counters
      this.state.operationCount = {
        total: 0,
        success: 0,
        failed: 0
      };
      
      this.updateLifecycle(ModelLifecycleState.Ready);
      
      await this.logger.info('Module reset completed');
      return this.createResult(true, { reset: true }, undefined);
    } catch (error) {
      this.updateLifecycle(ModelLifecycleState.Error);
      
      await this.logger.error('Reset failed', error);
      
      if (this.config.debug) {
        console.error(`[${this.getModuleIdentifier()}] Reset error:`, error);
      }
      
      return this.createResult(
        false,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  
  /**
   * Terminate the module, releasing resources
   */
  async terminate(): Promise<ModelResult> {
    const startTime = Date.now();
    this.updateLifecycle(ModelLifecycleState.Terminating);
    
    await this.logger.info('Terminating module');
    
    try {
      // Clear caches
      if (this.bitLengthCache && this.bitLengthCache.clear) {
        this.bitLengthCache.clear();
      }
      
      this.updateLifecycle(ModelLifecycleState.Terminated);
      
      // Log termination before logger terminates
      await this.logger.info('Module terminated successfully');
      
      // Terminate the logger last
      await this.logger.terminate();
      
      return this.createResult(true, { terminated: true }, undefined);
    } catch (error) {
      this.updateLifecycle(ModelLifecycleState.Error);
      
      await this.logger.error('Termination failed', error);
      
      if (this.config.debug) {
        console.error(`[${this.getModuleIdentifier()}] Termination error:`, error);
      }
      
      // Still try to terminate the logger
      await this.logger.terminate().catch(() => {});
      
      return this.createResult(
        false,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  
  /**
   * Get the module state including cache statistics
   */
  getState(): MathUtilsModelState {
    // Update uptime when state is requested
    this.state.uptime = Date.now() - this.startTime;
    
    // Get cache metrics safely
    let cacheMetrics = { currentSize: 0 };
    if (this.bitLengthCache && this.bitLengthCache.getMetrics) {
      try {
        cacheMetrics = this.bitLengthCache.getMetrics();
      } catch (error) {
        // Fallback to default metrics if getMetrics fails
        cacheMetrics = { currentSize: 0 };
      }
    }
    
    // Update cache statistics
    if (this.state.custom) {
      this.state.custom.cache = {
        bitLengthCacheSize: cacheMetrics.currentSize || 0,
        bitLengthCacheHits: this.bitLengthCacheHits,
        bitLengthCacheMisses: this.bitLengthCacheMisses
      };
    }
    
    return {
      ...this.state,
      config: this.config,
      cache: {
        bitLengthCacheSize: cacheMetrics.currentSize || 0,
        bitLengthCacheHits: this.bitLengthCacheHits,
        bitLengthCacheMisses: this.bitLengthCacheMisses
      }
    } as MathUtilsModelState;
  }
  
  /**
   * Calculate the bit length of a number
   */
  bitLength: BitLengthFunction = (value): number => {
    // If caching is disabled or cache is not available, just use the utils implementation
    if (!this.config.enableCache || !this.bitLengthCache) {
      return this.utils.bitLength(value);
    }
    
    // For caching, we need to handle the cache statistics
    // Convert to string for cache key
    const valueStr = String(value);
    
    // Check cache safely
    try {
      if (this.bitLengthCache.has && this.bitLengthCache.has(valueStr)) {
        this.bitLengthCacheHits++;
        const cachedResult = this.bitLengthCache.get ? this.bitLengthCache.get(valueStr) : undefined;
        if (cachedResult !== undefined) {
          return cachedResult;
        }
      }
    } catch (error) {
      // If cache operations fail, fall back to direct calculation
      return this.utils.bitLength(value);
    }
    
    // Cache miss
    this.bitLengthCacheMisses++;
    
    // Calculate result
    const result = this.utils.bitLength(value);
    
    // Cache result safely
    try {
      if (this.bitLengthCache.getMetrics && this.bitLengthCache.set) {
        const cacheMetrics = this.bitLengthCache.getMetrics();
        
        // Only cache if we haven't reached the limit
        if ((cacheMetrics.currentSize || 0) < 1000) {
          this.bitLengthCache.set(valueStr, result);
        }
      }
    } catch (error) {
      // If caching fails, just continue without caching
    }
    
    return result;
  };
  
  /**
   * Check if two values are exactly equal
   */
  exactlyEquals: ExactEqualsFunction = (a, b): boolean => {
    return this.utils.exactlyEquals(a, b);
  };
  
  /**
   * Convert a number to a byte array
   */
  toByteArray = (value: bigint | number): Uint8Array => {
    return this.utils.toByteArray(value);
  };
  
  /**
   * Convert a byte array to a number
   */
  fromByteArray = (bytes: Uint8Array): bigint => {
    return this.utils.fromByteArray(bytes);
  };
  
  /**
   * Check if a value is a safe integer
   */
  isSafeInteger = (value: bigint | number): boolean => {
    return this.utils.isSafeInteger(value);
  };
  
  /**
   * Get the sign of a number
   */
  sign = (value: bigint | number): number => {
    return this.utils.sign(value);
  };
  
  /**
   * Get the absolute value of a number
   */
  abs = (value: bigint | number): bigint | number => {
    return this.utils.abs(value);
  };
  
  /**
   * Check if a number is a power of 2
   */
  isPowerOfTwo = (value: bigint | number): boolean => {
    return this.utils.isPowerOfTwo(value);
  };
  
  /**
   * Calculate the greatest common divisor of two numbers
   */
  gcd = (a: bigint | number, b: bigint | number): bigint | number => {
    return this.utils.gcd(a, b);
  };
  
  /**
   * Calculate the least common multiple of two numbers
   */
  lcm = (a: bigint | number, b: bigint | number): bigint | number => {
    return this.utils.lcm(a, b);
  };
  
  /**
   * Extended Euclidean algorithm to find Bézout coefficients
   */
  extendedGcd = (a: bigint | number, b: bigint | number): [bigint, bigint, bigint] => {
    return this.utils.extendedGcd(a, b);
  };
  
  /**
   * Calculate the integer square root
   */
  integerSqrt = (value: bigint | number): bigint => {
    const result = this.utils.integerSqrt(value);
    return typeof result === 'bigint' ? result : BigInt(result);
  };
  
  /**
   * Ceiling division
   */
  ceilDiv = (a: bigint | number, b: bigint | number): bigint => {
    const result = this.utils.ceilDiv(a, b);
    return typeof result === 'bigint' ? result : BigInt(result);
  };
  
  /**
   * Floor division
   */
  floorDiv = (a: bigint | number, b: bigint | number): bigint => {
    const result = this.utils.floorDiv(a, b);
    return typeof result === 'bigint' ? result : BigInt(result);
  };
  
  /**
   * Count set bits
   */
  countSetBits = (value: bigint | number): number => {
    return this.utils.countSetBits(value);
  };
  
  /**
   * Count leading zeros
   */
  leadingZeros = (value: bigint | number): number => {
    return this.utils.leadingZeros(value);
  };
  
  /**
   * Count trailing zeros
   */
  trailingZeros = (value: bigint | number): number => {
    return this.utils.trailingZeros(value);
  };
}

/**
 * Create a MathUtils model instance
 */
export function createMathUtilsModel(options: MathUtilsModelOptions = {}): MathUtilsImpl {
  return new MathUtilsImpl(options);
}

/**
 * Create and initialize a MathUtils model instance
 */
export async function createAndInitializeMathUtilsModel(
  options: MathUtilsModelOptions = {}
): Promise<MathUtilsImpl> {
  const model = new MathUtilsImpl(options);
  const result = await model.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize MathUtils model: ${result.error}`);
  }
  
  return model;
}
