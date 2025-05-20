/**
 * Modular Arithmetic Types
 * ======================
 * 
 * Type definitions for the modular arithmetic module, providing
 * Python-compatible modular operations.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState,
  ModelLifecycleState
} from '../../../os/model';

/**
 * Options for modular arithmetic operations
 */
export interface ModularOptions extends ModelOptions {
  /**
   * Whether to use Python-compatible modulo semantics for negative numbers
   * When true: mod(-5, 3) = 1 (like Python)
   * When false: mod(-5, 3) = -2 (standard JavaScript)
   */
  pythonCompatible?: boolean;
  
  /**
   * Whether to cache intermediate results for repeated operations
   */
  useCache?: boolean;
  
  /**
   * Whether to use optimized algorithms where available
   */
  useOptimized?: boolean;
  
  /**
   * Maximum size (in bits) to use native operations before switching to specialized algorithms
   */
  nativeThreshold?: number;
  
  /**
   * Whether to perform strict validation and throw detailed errors
   * When true, provides additional validation and more precise error messages
   */
  strict?: boolean;
  
  /**
   * Enable debug logging for detailed operation information
   */
  debug?: boolean;
}

/**
 * Extended state for Modular module
 */
export interface ModularState extends ModelState {
  /**
   * Configuration settings
   */
  config: ModularOptions;
  
  /**
   * Cache statistics (if caching is enabled)
   */
  cache?: {
    inverseSize: number;
    inverseHits: number;
    inverseMisses: number;
    gcdSize: number;
    gcdHits: number;
    gcdMisses: number;
  };
}

/**
 * Input types for Modular module processing
 */
export interface ModularProcessInput {
  operation: 'mod' | 'modPow' | 'modInverse' | 'modMul' | 
             'gcd' | 'lcm' | 'extendedGcd' | 'clearCache';
  params: any[];
}

/**
 * Function signature for basic modulo operation
 * 
 * @remarks
 * This function always returns a bigint value regardless of input types.
 * For number inputs, the result is converted to bigint.
 */
export type ModFunction = (a: bigint | number, b: bigint | number) => bigint;

/**
 * Function signature for modular exponentiation
 * 
 * @remarks
 * This function always returns a bigint value regardless of input types.
 * For number inputs, the result is converted to bigint.
 */
export type ModPowFunction = (base: bigint | number, exponent: bigint | number, modulus: bigint | number) => bigint;

/**
 * Function signature for modular multiplicative inverse
 * 
 * @remarks
 * This function always returns a bigint value regardless of input types.
 * For number inputs, the result is converted to bigint.
 */
export type ModInverseFunction = (a: bigint | number, m: bigint | number) => bigint;

/**
 * Function signature for modular multiplication with overflow protection
 */
export type ModMulFunction = (a: bigint | number, b: bigint | number, m: bigint | number) => bigint;

/**
 * Interface for modular arithmetic operations
 */
export interface ModularOperations {
  /**
   * Python-compatible modulo operation
   */
  mod: ModFunction;
  
  /**
   * Modular exponentiation (a^b mod m)
   */
  modPow: ModPowFunction;
  
  /**
   * Modular multiplicative inverse (a^-1 mod m)
   */
  modInverse: ModInverseFunction;
  
  /**
   * Extended Euclidean algorithm to find Bézout coefficients
   * Returns [gcd, x, y] such that ax + by = gcd(a, b)
   */
  extendedGcd: (a: bigint, b: bigint) => [bigint, bigint, bigint];
  
  /**
   * Greatest common divisor of two numbers
   */
  gcd: (a: bigint, b: bigint) => bigint;
  
  /**
   * Least common multiple of two numbers
   */
  lcm: (a: bigint, b: bigint) => bigint;
  
  /**
   * Modular multiplication with overflow protection
   */
  modMul: ModMulFunction;
  
  /**
   * Clear all caches used by the module
   * Useful for freeing memory when done with a set of operations
   */
  clearCache: () => void;
  
  /**
   * Karatsuba multiplication for large integers
   */
  karatsubaMultiply: (a: bigint, b: bigint) => bigint;
  
  /**
   * Modular multiplication using Karatsuba algorithm
   */
  karatsubaModMul: (a: bigint | number, b: bigint | number, m: bigint | number) => bigint;
  
  /**
   * Binary GCD algorithm (Stein's algorithm)
   */
  binaryGcd: (a: bigint, b: bigint) => bigint;
  
  /**
   * Sliding window modular exponentiation
   */
  slidingWindowModPow: (
    base: bigint | number, 
    exponent: bigint | number, 
    modulus: bigint | number, 
    windowSize?: number
  ) => bigint;
}

/**
 * Interface extending ModelInterface for Modular module
 */
export interface ModularModelInterface extends ModularOperations, ModelInterface {
  /**
   * Get the module state including cache statistics
   */
  getState(): ModularState;
}

// Import constants from separate file
import { MODULAR_CONSTANTS } from './constants';

// Re-export constants for backward compatibility
export { MODULAR_CONSTANTS };
