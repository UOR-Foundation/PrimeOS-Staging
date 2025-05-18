/**
 * Utility Types
 * ============
 * 
 * Type definitions for utility functions in the precision module.
 */

/**
 * Options for mathematical utility operations
 */
export interface UtilityOptions {
  /**
   * Enable caching for expensive operations
   */
  enableCache?: boolean;
  
  /**
   * Whether to use optimized implementations
   */
  useOptimized?: boolean;
  
  /**
   * Throw on overflow/underflow instead of silent wrapping
   */
  strict?: boolean;
}

/**
 * Function signature for bit length calculations
 */
export type BitLengthFunction = (value: bigint | number) => number;

/**
 * Function signature for exact equality checking
 */
export type ExactEqualsFunction = (a: any, b: any) => boolean;

/**
 * Function signature for byte array conversion
 */
export type ByteArrayFunction = (value: bigint | number | Uint8Array) => Uint8Array | bigint;

/**
 * Function signature for safe integer checking
 */
export type SafeIntegerFunction = (value: bigint | number) => boolean;

/**
 * Function signature for sign determination
 */
export type SignFunction = (value: bigint | number) => number;

/**
 * Function signature for absolute value calculation
 */
export type AbsFunction = (value: bigint | number) => bigint | number;

/**
 * Function signature for power of two checking
 */
export type PowerOfTwoFunction = (value: bigint | number) => boolean;

/**
 * Interface for math utility functions
 */
export interface MathUtilsInterface {
  /**
   * Calculate the bit length of a number
   */
  bitLength: BitLengthFunction;
  
  /**
   * Check if two values are exactly equal
   */
  exactlyEquals: ExactEqualsFunction;
  
  /**
   * Convert a number to a byte array
   */
  toByteArray: (value: bigint | number) => Uint8Array;
  
  /**
   * Convert a byte array to a number
   */
  fromByteArray: (bytes: Uint8Array) => bigint;
  
  /**
   * Check if a value is a safe integer
   */
  isSafeInteger: SafeIntegerFunction;
  
  /**
   * Get the sign of a number
   */
  sign: SignFunction;
  
  /**
   * Get the absolute value
   */
  abs: AbsFunction;
  
  /**
   * Check if a number is a power of 2
   */
  isPowerOfTwo: PowerOfTwoFunction;
}

/**
 * Constants for utility functions
 */
export const UTILITY_CONSTANTS = {
  /**
   * Maximum safe integer in JavaScript
   */
  MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
  
  /**
   * Minimum safe integer in JavaScript
   */
  MIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
  
  /**
   * Maximum safe integer as BigInt
   */
  MAX_SAFE_BIGINT: BigInt(Number.MAX_SAFE_INTEGER),
  
  /**
   * Minimum safe integer as BigInt
   */
  MIN_SAFE_BIGINT: BigInt(Number.MIN_SAFE_INTEGER)
};

/**
 * Function to create a MathUtils instance with custom options
 */
export type MathUtilsFactory = (options?: UtilityOptions) => MathUtilsInterface;
