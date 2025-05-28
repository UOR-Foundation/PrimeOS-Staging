/**
 * Modular Arithmetic Module
 * ========================
 * 
 * Implementation of Python-compatible modular arithmetic operations.
 * Implements the PrimeOS Model interface pattern for consistent lifecycle management.
 */

import { 
  ModularOptions,
  ModularOperations,
  ModularModelInterface,
  ModularState,
  ModularProcessInput,
  ModFunction,
  ModPowFunction,
  ModInverseFunction,
  ModMulFunction,
  MODULAR_CONSTANTS
} from './types';

import { PRECISION_CONSTANTS } from '../types';
import { bitLength } from '../bigint';
import { createCache, CacheModelInterface } from '../cache';
import {
  BaseModel,
  ModelResult,
  ModelLifecycleState
} from '../../../os/model';
import { createLogging, LoggingInterface } from '../../../os/logging';

// Import algorithms
import {
  createModularAlgorithms,
  ModularAlgorithmOptions
} from './algorithms';

// Import error handling
import {
  createDivisionByZeroError,
  createBitSizeError,
  createNoInverseError,
  createOverflowError
} from './errors';

// Import cache utilities
import {
  createModularCache,
  clearAllCaches,
  clearFunctionCache,
  terminateAllCaches
} from './cache';

/**
 * Default options for modular operations
 */
const DEFAULT_OPTIONS: ModularOptions = {
  pythonCompatible: true,
  useCache: true,
  useOptimized: true,
  nativeThreshold: MODULAR_CONSTANTS.MAX_NATIVE_BITS,
  strict: false,
  debug: false,
  name: 'precision-modular',
  version: '1.0.0'
};

/**
 * ModularImpl provides methods for modular arithmetic operations.
 * Extends BaseModel to implement the PrimeOS Model interface pattern.
 */
export class ModularImpl extends BaseModel implements ModularModelInterface {
  private config: ModularOptions;
  protected logger: LoggingInterface;
  private algorithms: ReturnType<typeof createModularAlgorithms>;
  
  /**
   * Create a new modular arithmetic implementation
   */
  constructor(options: ModularOptions = {}) {
    // Initialize BaseModel with options
    super({ ...DEFAULT_OPTIONS, ...options });
    
    // Store modular-specific options
    this.config = { ...DEFAULT_OPTIONS, ...options };
    
    // Create logger
    this.logger = createLogging({
      name: this.config.name || 'precision-modular',
      debug: this.config.debug || false
    });
    
    // Create algorithms with appropriate options
    this.algorithms = createModularAlgorithms({
      pythonCompatible: this.config.pythonCompatible,
      useCache: this.config.useCache,
      useOptimized: this.config.useOptimized,
      nativeThreshold: this.config.nativeThreshold,
      strict: this.config.strict,
      debug: this.config.debug,
      logger: this.logger
    });
    
    if (this.config.debug) {
      // Will use logger after initialization
      console.log('Created ModularImpl with options:', this.config);
    }
  }
  
  /**
   * Initialize the module
   */
  protected async onInitialize(): Promise<void> {
    // Add custom state tracking
    this.state.custom = {
      config: this.config,
      cache: {
        inverseSize: 0,
        inverseHits: 0,
        inverseMisses: 0,
        gcdSize: 0,
        gcdHits: 0,
        gcdMisses: 0
      }
    };
    
    await this.logger.debug('Modular arithmetic module initialized with configuration', this.config);
  }
  
  /**
   * Process operation request
   */
  protected async onProcess<T = ModularProcessInput, R = unknown>(input: T): Promise<R> {
    if (!input) {
      throw new Error('Input cannot be undefined or null');
    }
    
    await this.logger.debug('Processing input', input);
    
    // Process based on input type
    if (typeof input === 'object' && input !== null && 'operation' in input && 'params' in input) {
      const request = input as unknown as ModularProcessInput;
      
      switch (request.operation) {
        case 'mod':
          return this.mod(
            request.params[0],
            request.params[1]
          ) as unknown as R;
          
        case 'modPow':
          return this.modPow(
            request.params[0],
            request.params[1],
            request.params[2]
          ) as unknown as R;
          
        case 'modInverse':
          return this.modInverse(
            request.params[0],
            request.params[1]
          ) as unknown as R;
          
        case 'modMul':
          return this.modMul(
            request.params[0],
            request.params[1],
            request.params[2]
          ) as unknown as R;
          
        case 'gcd':
          return this.gcd(
            request.params[0],
            request.params[1]
          ) as unknown as R;
          
        case 'lcm':
          return this.lcm(
            request.params[0],
            request.params[1]
          ) as unknown as R;
          
        case 'extendedGcd':
          return this.extendedGcd(
            request.params[0],
            request.params[1]
          ) as unknown as R;
          
        case 'clearCache':
          this.clearCache();
          return undefined as unknown as R;
          
        default:
          throw new Error(`Unknown operation: ${(request as any).operation}`);
      }
    } else {
      // For direct function calls without the operation wrapper
      return input as unknown as R;
    }
  }
  
  /**
   * Reset the module state
   */
  protected async onReset(): Promise<void> {
    // Clear caches
    clearAllCaches();
    
    // Update state
    this.state.custom = {
      config: this.config,
      cache: {
        inverseSize: 0,
        inverseHits: 0,
        inverseMisses: 0,
        gcdSize: 0,
        gcdHits: 0,
        gcdMisses: 0
      }
    };
    
    await this.logger.debug('Modular arithmetic module reset');
  }
  
  /**
   * Clean up resources when module is terminated
   */
  protected async onTerminate(): Promise<void> {
    // Terminate caches
    await terminateAllCaches();
    
    await this.logger.debug('Modular arithmetic module terminated');
  }
  
  /**
   * Get the module state including cache statistics
   */
  getState(): ModularState {
    const baseState = super.getState();
    
    return {
      ...baseState,
      config: this.config,
      cache: {
        inverseSize: 0,
        inverseHits: 0,
        inverseMisses: 0,
        gcdSize: 0,
        gcdHits: 0,
        gcdMisses: 0
      }
    } as ModularState;
  }
  
  /**
   * Python-compatible modulo operation
   */
  mod: ModFunction = (a, b) => {
    return this.algorithms.mod(a, b);
  };
  
  /**
   * Modular multiplication with overflow protection
   */
  modMul: ModMulFunction = (a, b, m) => {
    return this.algorithms.modMul(a, b, m);
  };
  
  /**
   * Clear all caches used for memoization
   */
  clearCache(): void {
    if (this.config.debug) {
      this.logger.debug('Clearing modular arithmetic caches').catch(() => {});
    }
    
    clearAllCaches();
    
    if (this.config.debug) {
      this.logger.debug('Caches cleared').catch(() => {});
    }
  }
  
  /**
   * Greatest common divisor of two numbers
   */
  gcd = (a: bigint, b: bigint): bigint => {
    return this.algorithms.gcd(a, b);
  };
  
  /**
   * Least common multiple of two numbers
   */
  lcm = (a: bigint, b: bigint): bigint => {
    return this.algorithms.lcm(a, b);
  };
  
  /**
   * Extended Euclidean algorithm to find Bézout coefficients
   */
  extendedGcd = (a: bigint, b: bigint): [bigint, bigint, bigint] => {
    return this.algorithms.extendedGcd(a, b);
  };
  
  /**
   * Modular exponentiation (a^b mod m)
   */
  modPow: ModPowFunction = (base, exponent, modulus) => {
    return this.algorithms.modPow(base, exponent, modulus);
  };
  
  /**
   * Modular multiplicative inverse (a^-1 mod m)
   */
  modInverse: ModInverseFunction = (a, m) => {
    return this.algorithms.modInverse(a, m);
  };
  
  /**
   * Karatsuba multiplication for large integers
   */
  karatsubaMultiply = (a: bigint, b: bigint): bigint => {
    return this.algorithms.karatsubaMultiply(a, b);
  };
  
  /**
   * Modular multiplication using Karatsuba algorithm
   */
  karatsubaModMul = (a: bigint | number, b: bigint | number, m: bigint | number): bigint => {
    return this.algorithms.karatsubaModMul(a, b, m);
  };
  
  /**
   * Binary GCD algorithm (Stein's algorithm)
   */
  binaryGcd = (a: bigint, b: bigint): bigint => {
    return this.algorithms.binaryGcd(a, b);
  };
  
  /**
   * Sliding window modular exponentiation
   */
  slidingWindowModPow = (
    base: bigint | number, 
    exponent: bigint | number, 
    modulus: bigint | number, 
    windowSize: number = 4
  ): bigint => {
    return this.algorithms.slidingWindowModPow(base, exponent, modulus, windowSize);
  };
}

/**
 * Create a modular arithmetic operations instance with the specified options
 */
export function createModularOperations(options: ModularOptions = {}): ModularModelInterface {
  return new ModularImpl(options);
}

/**
 * Create and initialize a modular operations module in a single step
 */
export async function createAndInitializeModularOperations(
  options: ModularOptions = {}
): Promise<ModularModelInterface> {
  const instance = createModularOperations(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize modular operations: ${result.error}`);
  }
  
  return instance;
}

// Create default instance with standard options
const defaultOperations = createModularOperations();

// Export individual functions from the default instance
export const {
  mod,
  modPow,
  modInverse,
  extendedGcd,
  gcd,
  lcm,
  modMul,
  karatsubaMultiply,
  karatsubaModMul,
  binaryGcd,
  slidingWindowModPow
} = defaultOperations;

// Export clearCache as a standalone function to avoid 'this' binding issues
export function clearCache(): void {
  defaultOperations.clearCache();
}

// Export types and interfaces
export type { ModularOperations, ModularModelInterface, ModFunction, ModPowFunction, ModInverseFunction, ModMulFunction };

// Export constants
export { MODULAR_CONSTANTS };

// Export error handling
export * from './errors';

// Export algorithms
export * from './algorithms';

// Export cache utilities
export * from './cache';
