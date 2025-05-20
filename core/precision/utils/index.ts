/**
 * Utility Functions
 * ===============
 * 
 * Common mathematical utility functions for precision operations.
 * Implements the PrimeOS Model interface pattern for consistent lifecycle management.
 */

import { 
  UtilityOptions, 
  MathUtilsInterface,
  BitLengthFunction,
  ExactEqualsFunction,
  ByteArrayFunction,
  GcdFunction,
  LcmFunction,
  ExtendedGcdFunction,
  IntegerSqrtFunction,
  CeilDivFunction,
  FloorDivFunction,
  CountSetBitsFunction,
  LeadingZerosFunction,
  TrailingZerosFunction,
  UTILITY_CONSTANTS,
  MathUtilsModelOptions,
  MathUtilsModelInterface,
  MathUtilsModelState,
  MathUtilsProcessInput
} from './types';

import {
  ModelResult,
  ModelLifecycleState,
  ModelInterface,
  ModelState
} from '../../../os/model/types';
import { LoggingInterface, LogLevel } from '../../../os/logging/types';
import { createLogging } from '../../../os/logging';

// Import the cache module
import { 
  createLRUCache, 
  memoize, 
  CacheModelInterface 
} from '../cache';

// Import algorithms
import { createMathUtilsAlgorithms } from './algorithms';

// Import error handling
import {
  createValidationError,
  createOverflowError,
  createDivisionByZeroError,
  createNegativeInputError
} from './errors';

// Import cache utilities
import {
  createUtilsCache,
  clearAllCaches,
  terminateAllCaches
} from './cache';

// Import constants
import { UTILS_CONSTANTS } from './constants';

/**
 * Create a MathUtils instance with the specified options
 */
function createMathUtils(options: UtilityOptions = {}): MathUtilsInterface {
  // Process options with defaults
  const config = {
    enableCache: options.enableCache ?? true,
    useOptimized: options.useOptimized ?? true,
    strict: options.strict ?? false
  };
  
  // Cache for bit length calculations using precision/cache module
  let bitLengthCache: CacheModelInterface<string, number> | null = null;
  
  // Initialize cache if enabled
  if (config.enableCache) {
    bitLengthCache = createLRUCache<string, number>(1000, {
      name: 'bitLength-cache',
      metrics: true
    });
    
    // Initialize the cache
    bitLengthCache.initialize().catch(err => {
      console.error('Failed to initialize bitLength cache:', err);
    });
  }
  
  /**
   * Calculate the bit length of a number
   */
  const bitLength: BitLengthFunction = (value): number => {
    // Validate input type
    if (typeof value !== 'number' && typeof value !== 'bigint') {
      if (config.strict) {
        throw new Error(`Invalid input type: ${typeof value}. Expected number or bigint.`);
      }
      return 0; // Default fallback when not in strict mode
    }
    
    // Handle different number types
    if (typeof value === 'number') {
      // For regular numbers, convert to BigInt for consistent handling
      if (!Number.isFinite(value)) {
        if (config.strict) {
          throw new Error(`Cannot calculate bit length of ${value}`);
        }
        return 0;
      }
      
      const absValue = Math.abs(value);
      const floorValue = Math.floor(absValue);
      return calculateBitLength(BigInt(floorValue));
    }
    
    return calculateBitLength(value);
  };
  
  /**
   * Helper function to calculate bit length of a BigInt
   */
  function calculateBitLength(value: bigint): number {
    // Handle negative BigInts by taking absolute value
    const absValue = value < 0n ? -value : value;
    
    // Special case for zero
    if (absValue === 0n) {
      return 1;
    }
    
    // Use cache if enabled
    if (config.enableCache && bitLengthCache) {
      const key = absValue.toString();
      const cachedValue = bitLengthCache.get(key);
      if (cachedValue !== undefined) {
        return cachedValue;
      }
    }
    
    // Calculate bit length using binary representation
    let length: number;
    
    if (config.useOptimized && absValue <= BigInt(Number.MAX_SAFE_INTEGER)) {
      // Optimized implementation for smaller numbers
      length = Math.floor(Math.log2(Number(absValue))) + 1;
    } else {
      // Standard implementation for larger numbers
      length = absValue.toString(2).length;
    }
    
    // Cache result if enabled
    if (config.enableCache && bitLengthCache) {
      const key = absValue.toString();
      bitLengthCache.set(key, length);
    }
    
    return length;
  }
  
  /**
   * Convert a number to a byte array (little-endian)
   */
  const toByteArray = (value: bigint | number): Uint8Array => {
    // Convert number to BigInt if needed
    const bigValue = typeof value === 'number' ? BigInt(Math.floor(value)) : value;
    
    // Handle negative values
    const isNegative = bigValue < 0n;
    let absValue = isNegative ? -bigValue : bigValue;
    
    // Calculate byte length needed
    const byteLength = Math.ceil(bitLength(absValue) / 8);
    
    // Create result array with space for sign byte if negative
    const result = new Uint8Array(byteLength + (isNegative ? 1 : 0));
    
    // Extract bytes
    for (let i = 0; i < byteLength; i++) {
      result[i] = Number(absValue & 0xFFn);
      absValue >>= 8n;
    }
    
    // Add sign byte for negative numbers
    if (isNegative) {
      result[byteLength] = 0xFF;
    }
    
    // Special case: if all bytes are 0xFF and it's not negative, add a 0x00 byte
    // to distinguish from negative values
    if (!isNegative) {
      let allFF = true;
      for (let i = 0; i < result.length; i++) {
        if (result[i] !== 0xFF) {
          allFF = false;
          break;
        }
      }
      
      if (allFF) {
        const newResult = new Uint8Array(result.length + 1);
        newResult.set(result);
        newResult[result.length] = 0x00;
        return newResult;
      }
    }
    
    return result;
  };
  
  /**
   * Convert a byte array to a BigInt (little-endian)
   */
  const fromByteArray = (bytes: Uint8Array): bigint => {
    if (bytes.length === 0) {
      return 0n;
    }
    
    // Special case for single byte with value 0
    if (bytes.length === 1 && bytes[0] === 0) {
      return 0n;
    }
    
    // Check if this is a negative value (has an extra 0xFF byte at the end)
    const isNegative = bytes.length >= 2 && bytes[bytes.length - 1] === 0xFF;
    
    // Calculate the value (skip sign byte if negative)
    const valueBytes = isNegative ? bytes.subarray(0, bytes.length - 1) : bytes;
    
    // Convert bytes to BigInt (little-endian)
    let result = 0n;
    for (let i = 0; i < valueBytes.length; i++) {
      result += BigInt(valueBytes[i]) << BigInt(8 * i);
    }
    
    return isNegative ? -result : result;
  };
  
  /**
   * Check if two values are exactly equal
   */
  const exactlyEquals: ExactEqualsFunction = (a, b): boolean => {
    // Same type comparison
    if (typeof a === typeof b) {
      return a === b;
    }
    
    // Handle number to BigInt comparison
    if (typeof a === 'number' && typeof b === 'bigint') {
      return Number.isInteger(a) && BigInt(a) === b;
    }
    
    // Handle BigInt to number comparison
    if (typeof a === 'bigint' && typeof b === 'number') {
      return Number.isInteger(b) && a === BigInt(b);
    }
    
    // Different types that can't be compared
    return false;
  };
  
  /**
   * Check if a value is within the safe integer range
   */
  const isSafeInteger = (value: bigint | number): boolean => {
    if (typeof value === 'number') {
      return Number.isSafeInteger(value);
    }
    
    return value >= UTILITY_CONSTANTS.MIN_SAFE_BIGINT && 
           value <= UTILITY_CONSTANTS.MAX_SAFE_BIGINT;
  };
  
  /**
   * Get the sign of a number (-1, 0, or 1)
   */
  const sign = (value: bigint | number): number => {
    if (typeof value === 'number') {
      return Math.sign(value);
    }
    
    if (value < 0n) return -1;
    if (value > 0n) return 1;
    return 0;
  };
  
  /**
   * Get the absolute value of a number
   */
  const abs = (value: bigint | number): bigint | number => {
    if (typeof value === 'number') {
      return Math.abs(value);
    }
    
    return value < 0n ? -value : value;
  };
  
  /**
   * Check if a number is a power of 2
   */
  const isPowerOfTwo = (value: bigint | number): boolean => {
    if (typeof value === 'number') {
      // Handle JavaScript number type
      return Number.isInteger(value) && 
             value > 0 && 
             (value & (value - 1)) === 0;
    }
    
    // Handle BigInt
    return value > 0n && (value & (value - 1n)) === 0n;
  };
  
  // Create algorithms with appropriate options
  const algorithms = createMathUtilsAlgorithms({
    strict: config.strict,
    useOptimized: config.useOptimized
  });
  
  // Return the public interface
  return {
    // Core utility functions
    bitLength,
    exactlyEquals,
    toByteArray,
    fromByteArray,
    isSafeInteger,
    sign,
    abs,
    isPowerOfTwo,
    
    // New functions from algorithms
    ...algorithms
  };
}

/**
 * Default utility instance with standard options
 */
class MathUtils implements MathUtilsInterface {
  private utils: MathUtilsInterface;
  bitLength: BitLengthFunction;
  exactlyEquals: ExactEqualsFunction;
  toByteArray: (value: bigint | number) => Uint8Array;
  fromByteArray: (bytes: Uint8Array) => bigint;
  isSafeInteger: (value: bigint | number) => boolean;
  sign: (value: bigint | number) => number;
  abs: (value: bigint | number) => bigint | number;
  isPowerOfTwo: (value: bigint | number) => boolean;
  
  // New functions
  gcd: GcdFunction;
  lcm: LcmFunction;
  extendedGcd: ExtendedGcdFunction;
  integerSqrt: IntegerSqrtFunction;
  ceilDiv: CeilDivFunction;
  floorDiv: FloorDivFunction;
  countSetBits: CountSetBitsFunction;
  leadingZeros: LeadingZerosFunction;
  trailingZeros: TrailingZerosFunction;
  
  constructor() {
    // First initialize the utils property
    this.utils = createMathUtils();
    
    // Then assign the method properties
    this.bitLength = this.utils.bitLength;
    this.exactlyEquals = this.utils.exactlyEquals;
    this.toByteArray = this.utils.toByteArray;
    this.fromByteArray = this.utils.fromByteArray;
    this.isSafeInteger = this.utils.isSafeInteger;
    this.sign = this.utils.sign;
    this.abs = this.utils.abs;
    this.isPowerOfTwo = this.utils.isPowerOfTwo;
    
    // Assign new methods
    this.gcd = this.utils.gcd;
    this.lcm = this.utils.lcm;
    this.extendedGcd = this.utils.extendedGcd;
    this.integerSqrt = this.utils.integerSqrt;
    this.ceilDiv = this.utils.ceilDiv;
    this.floorDiv = this.utils.floorDiv;
    this.countSetBits = this.utils.countSetBits;
    this.leadingZeros = this.utils.leadingZeros;
    this.trailingZeros = this.utils.trailingZeros;
  }
}

// Create and export a default instance
const defaultUtils = new MathUtils();

// Export individual functions from the default instance
export const {
  bitLength,
  exactlyEquals,
  toByteArray,
  fromByteArray,
  isSafeInteger,
  sign,
  abs,
  isPowerOfTwo,
  gcd,
  lcm,
  extendedGcd,
  integerSqrt,
  ceilDiv,
  floorDiv,
  countSetBits,
  leadingZeros,
  trailingZeros
} = defaultUtils;

// Export the MathUtils class and factory function
export { MathUtils, createMathUtils };

// Export utility constants
export { UTILITY_CONSTANTS };

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
  private bitLengthCache: CacheModelInterface<string, number>;
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
    this.bitLengthCache = createLRUCache<string, number>(1000, {
      name: 'bitLength-cache',
      metrics: true
    });
    
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
      this.bitLengthCache.clear();
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
      this.bitLengthCache.clear();
      
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
    
    // Get cache metrics
    const cacheMetrics = this.bitLengthCache.getMetrics ? this.bitLengthCache.getMetrics() : { currentSize: 0 };
    
    // Update cache statistics
    if (this.state.custom) {
      this.state.custom.cache = {
        bitLengthCacheSize: cacheMetrics.currentSize,
        bitLengthCacheHits: this.bitLengthCacheHits,
        bitLengthCacheMisses: this.bitLengthCacheMisses
      };
    }
    
    return {
      ...this.state,
      config: this.config,
      cache: {
        bitLengthCacheSize: cacheMetrics.currentSize,
        bitLengthCacheHits: this.bitLengthCacheHits,
        bitLengthCacheMisses: this.bitLengthCacheMisses
      }
    } as MathUtilsModelState;
  }
  
  /**
   * Calculate the bit length of a number
   */
  bitLength: BitLengthFunction = (value): number => {
    // If caching is disabled, just use the utils implementation
    if (!this.config.enableCache) {
      return this.utils.bitLength(value);
    }
    
    // For caching, we need to handle the cache statistics
    // Convert to string for cache key
    const valueStr = String(value);
    
    // Check cache
    if (this.bitLengthCache.has(valueStr)) {
      this.bitLengthCacheHits++;
      return this.bitLengthCache.get(valueStr)!;
    }
    
    // Cache miss
    this.bitLengthCacheMisses++;
    
    // Calculate result
    const result = this.utils.bitLength(value);
    
    // Cache result
    const cacheMetrics = this.bitLengthCache.getMetrics ? this.bitLengthCache.getMetrics() : { currentSize: 0 };
    
    // Only cache if we haven't reached the limit
    if (cacheMetrics.currentSize < 1000) {
      this.bitLengthCache.set(valueStr, result);
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
   * Calculate the integer square root of a number
   */
  integerSqrt = (value: bigint | number): bigint | number => {
    return this.utils.integerSqrt(value);
  };
  
  /**
   * Ceiling division (rounds up the result of a/b)
   */
  ceilDiv = (a: bigint | number, b: bigint | number): bigint | number => {
    return this.utils.ceilDiv(a, b);
  };
  
  /**
   * Floor division (rounds down the result of a/b)
   */
  floorDiv = (a: bigint | number, b: bigint | number): bigint | number => {
    return this.utils.floorDiv(a, b);
  };
  
  /**
   * Count the number of set bits (1s) in a number
   */
  countSetBits = (value: bigint | number): number => {
    return this.utils.countSetBits(value);
  };
  
  /**
   * Count the number of leading zeros in the binary representation
   */
  leadingZeros = (value: bigint | number): number => {
    return this.utils.leadingZeros(value);
  };
  
  /**
   * Count the number of trailing zeros in the binary representation
   */
  trailingZeros = (value: bigint | number): number => {
    return this.utils.trailingZeros(value);
  };
}

/**
 * Create a MathUtils model instance with the specified options
 */
export function createMathUtilsModel(options: MathUtilsModelOptions = {}): MathUtilsModelInterface {
  return new MathUtilsImpl(options);
}

/**
 * Create and initialize a MathUtils model in a single step
 */
export async function createAndInitializeMathUtilsModel(
  options: MathUtilsModelOptions = {}
): Promise<MathUtilsModelInterface> {
  const instance = createMathUtilsModel(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize MathUtils model: ${result.error}`);
  }
  
  return instance;
}
