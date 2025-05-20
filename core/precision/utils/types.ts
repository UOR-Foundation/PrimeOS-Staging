/**
 * Utility Types
 * ============
 * 
 * Type definitions for utility functions in the precision module.
 * Implements the PrimeOS Model interface pattern for consistent lifecycle management.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState,
  ModelLifecycleState
} from '../../../os/model';

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
  
  /**
   * Calculate the greatest common divisor of two numbers
   */
  gcd: GcdFunction;
  
  /**
   * Calculate the least common multiple of two numbers
   */
  lcm: LcmFunction;
  
  /**
   * Extended Euclidean algorithm to find Bézout coefficients
   */
  extendedGcd: ExtendedGcdFunction;
  
  /**
   * Calculate the integer square root of a number
   */
  integerSqrt: IntegerSqrtFunction;
  
  /**
   * Ceiling division (rounds up the result of a/b)
   */
  ceilDiv: CeilDivFunction;
  
  /**
   * Floor division (rounds down the result of a/b)
   */
  floorDiv: FloorDivFunction;
  
  /**
   * Count the number of set bits (1s) in a number
   */
  countSetBits: CountSetBitsFunction;
  
  /**
   * Count the number of leading zeros in the binary representation
   */
  leadingZeros: LeadingZerosFunction;
  
  /**
   * Count the number of trailing zeros in the binary representation
   */
  trailingZeros: TrailingZerosFunction;
}

/**
 * Function signature for GCD calculation
 */
export type GcdFunction = (a: bigint | number, b: bigint | number) => bigint | number;

/**
 * Function signature for LCM calculation
 */
export type LcmFunction = (a: bigint | number, b: bigint | number) => bigint | number;

/**
 * Function signature for extended GCD calculation
 */
export type ExtendedGcdFunction = (a: bigint | number, b: bigint | number) => [bigint, bigint, bigint];

/**
 * Function signature for integer square root
 */
export type IntegerSqrtFunction = (value: bigint | number) => bigint | number;

/**
 * Function signature for ceiling division
 */
export type CeilDivFunction = (a: bigint | number, b: bigint | number) => bigint | number;

/**
 * Function signature for floor division
 */
export type FloorDivFunction = (a: bigint | number, b: bigint | number) => bigint | number;

/**
 * Function signature for counting set bits
 */
export type CountSetBitsFunction = (value: bigint | number) => number;

/**
 * Function signature for counting leading zeros
 */
export type LeadingZerosFunction = (value: bigint | number) => number;

/**
 * Function signature for counting trailing zeros
 */
export type TrailingZerosFunction = (value: bigint | number) => number;

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

/**
 * Combined options for MathUtils with ModelOptions
 */
export interface MathUtilsModelOptions extends ModelOptions, UtilityOptions {
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
 * Extended state for MathUtils module
 */
export interface MathUtilsModelState extends ModelState {
  /**
   * Configuration settings
   */
  config: MathUtilsModelOptions;
  
  /**
   * Cache statistics (if caching is enabled)
   */
  cache?: {
    bitLengthCacheSize: number;
    bitLengthCacheHits: number;
    bitLengthCacheMisses: number;
  };
}

/**
 * Input types for MathUtils module processing
 */
export interface MathUtilsProcessInput {
  operation: 'bitLength' | 'exactlyEquals' | 'toByteArray' | 'fromByteArray' | 
             'isSafeInteger' | 'sign' | 'abs' | 'isPowerOfTwo' |
             'gcd' | 'lcm' | 'extendedGcd' | 'integerSqrt' |
             'ceilDiv' | 'floorDiv' | 'countSetBits' | 'leadingZeros' | 'trailingZeros';
  params: any[];
}

/**
 * Interface extending ModelInterface for MathUtils module
 */
export interface MathUtilsModelInterface extends MathUtilsInterface, ModelInterface {
  /**
   * Get the module state including cache statistics
   */
  getState(): MathUtilsModelState;
}
