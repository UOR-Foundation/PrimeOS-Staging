/**
 * BigInt Module Types
 * ==================
 * 
 * Type definitions for the BigInt precision module, providing enhanced operations
 * for working with large integers beyond JavaScript's native number limits.
 * Implements the PrimeOS Model interface pattern.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState,
  ModelLifecycleState
} from '../../../os/model/types';

/**
 * Constants for BigInt operations
 */
export const BigIntConstants = {
  // JavaScript's safe integer range
  MAX_SAFE_INTEGER: BigInt(Number.MAX_SAFE_INTEGER),
  MIN_SAFE_INTEGER: BigInt(Number.MIN_SAFE_INTEGER),
  
  // Common mathematical constants as BigInt
  ZERO: 0n,
  ONE: 1n,
  TWO: 2n,
  NEGATIVE_ONE: -1n,
  
  // Common bit masks
  MASK_32BIT: (1n << 32n) - 1n,
  MASK_64BIT: (1n << 64n) - 1n,
  
  // Maximum number of bits for efficient operations in this implementation
  MAX_BITS: 4096
};

/**
 * Options for BigInt operations
 */
export interface BigIntOptions extends ModelOptions {
  /**
   * Throw error on overflow instead of wrapping
   */
  strict?: boolean;
  
  /**
   * Enable caching for bit operations
   */
  enableCache?: boolean;
  
  /**
   * Specify a custom radix for string conversions
   */
  radix?: number;
  
  /**
   * Use optimized algorithm variants where available
   */
  useOptimized?: boolean;
  
  /**
   * Maximum size of the LRU cache for bit length calculations
   */
  cacheSize?: number;
}

/**
 * Extended state for BigInt module
 */
export interface BigIntState extends ModelState {
  /**
   * Configuration settings
   */
  config: {
    strict: boolean;
    enableCache: boolean;
    radix: number;
    useOptimized: boolean;
    cacheSize: number;
  };
  
  /**
   * Cache statistics
   */
  cache: {
    size: number;
    hits: number;
    misses: number;
  };
}

/**
 * Function for calculating bit length of a BigInt
 */
export type BitLengthFunction = (value: bigint) => number;

/**
 * Function for converting BigInt to byte array
 */
export type ToBytesFunction = (value: bigint) => Uint8Array;

/**
 * Function for converting byte array to BigInt
 */
export type FromBytesFunction = (bytes: Uint8Array) => bigint;

/**
 * Function to check if two values are exactly equal
 */
export type ExactlyEqualsFunction = (a: bigint | number, b: bigint | number) => boolean;

/**
 * Function to generate random BigInt of specific bit length
 */
export type RandomBigIntFunction = (bits: number) => bigint;

/**
 * Function for primality testing
 */
export type PrimalityTestFunction = (value: bigint, iterations?: number) => boolean;

/**
 * Function for modular exponentiation
 */
export type ModPowFunction = (base: bigint, exponent: bigint, modulus: bigint) => bigint;

/**
 * Input types for BigInt module processing
 */
export type BigIntProcessInput = {
  operation: 'bitLength' | 'exactlyEquals' | 'toByteArray' | 'fromByteArray' | 
             'getRandomBigInt' | 'isProbablePrime' | 'countLeadingZeros' | 
             'countTrailingZeros' | 'getBit' | 'setBit' | 'modPow';
  params: any[];
};

/**
 * Interface for core BigInt operations
 */
export interface BigIntOperations {
  /**
   * Calculate the bit length of a BigInt
   */
  bitLength: BitLengthFunction;
  
  /**
   * Check if two values are exactly equal, handling type conversions
   */
  exactlyEquals: ExactlyEqualsFunction;
  
  /**
   * Convert a BigInt to a byte array
   */
  toByteArray: ToBytesFunction;
  
  /**
   * Convert a byte array to a BigInt
   */
  fromByteArray: FromBytesFunction;
  
  /**
   * Generate a cryptographically secure random BigInt
   */
  getRandomBigInt: RandomBigIntFunction;
  
  /**
   * Test if a BigInt is probably prime
   */
  isProbablePrime: PrimalityTestFunction;
  
  /**
   * Count the number of leading zero bits
   */
  countLeadingZeros: (value: bigint) => number;
  
  /**
   * Count the number of trailing zero bits
   */
  countTrailingZeros: (value: bigint) => number;
  
  /**
   * Get a specific bit from a BigInt
   */
  getBit: (value: bigint, position: number) => 0 | 1;
  
  /**
   * Set a specific bit in a BigInt
   */
  setBit: (value: bigint, position: number, bitValue: 0 | 1) => bigint;
  
  /**
   * Perform modular exponentiation
   */
  modPow: ModPowFunction;
  
  /**
   * Clear the bit length calculation cache
   */
  clearCache?: () => void;
}

/**
 * Interface extending ModelInterface for BigInt module
 */
export interface BigIntInterface extends ModelInterface, BigIntOperations {
  /**
   * Get the module state including cache statistics
   */
  getState(): BigIntState;
}

// Re-export for convenient access
export { BigIntConstants as BIGINT_CONSTANTS };
