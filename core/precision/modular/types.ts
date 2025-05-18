/**
 * Modular Arithmetic Types
 * ======================
 * 
 * Type definitions for the modular arithmetic module, providing
 * Python-compatible modular operations.
 */

/**
 * Options for modular arithmetic operations
 */
export interface ModularOptions {
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
 * Function signature for basic modulo operation
 */
export type ModFunction = (a: bigint | number, b: bigint | number) => bigint | number;

/**
 * Function signature for modular exponentiation
 */
export type ModPowFunction = (base: bigint | number, exponent: bigint | number, modulus: bigint | number) => bigint | number;

/**
 * Function signature for modular multiplicative inverse
 */
export type ModInverseFunction = (a: bigint | number, m: bigint | number) => bigint | number;

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
}

/**
 * Constants used in modular arithmetic operations
 */
export const MODULAR_CONSTANTS = {
  /**
   * Maximum bit size for using native implementation without overflow concerns
   */
  MAX_NATIVE_BITS: 50,
  
  /**
   * Default cache size for modular operations
   */
  DEFAULT_CACHE_SIZE: 1000,
  
  /**
   * Maximum supported bit length for modular operations
   * Operations beyond this size may cause performance issues
   */
  MAX_SUPPORTED_BITS: 4096
};
