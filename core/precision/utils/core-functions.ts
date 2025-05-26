/**
 * Core Utility Functions
 * =====================
 * 
 * Core mathematical utility functions for precision operations.
 * This file contains the fundamental utility implementations.
 */

import { 
  UtilityOptions, 
  MathUtilsInterface,
  BitLengthFunction,
  ExactEqualsFunction,
  UTILITY_CONSTANTS
} from './types';

import { 
  createLRUCache, 
  CacheModelInterface 
} from '../cache';

import { createMathUtilsAlgorithms } from './algorithms';
import { UTILS_CONSTANTS } from './constants';

/**
 * Create a MathUtils instance with the specified options
 */
export function createMathUtils(options: UtilityOptions = {}): MathUtilsInterface {
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
    if (bitLengthCache && bitLengthCache.initialize) {
      bitLengthCache.initialize().catch(err => {
        console.error('Failed to initialize bitLength cache:', err);
      });
    }
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
    const absValue = value < BigInt(0) ? -value : value;
    
    // Special case for zero
    if (absValue === BigInt(0)) {
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
    const isNegative = bigValue < BigInt(0);
    let absValue = isNegative ? -bigValue : bigValue;
    
    // Calculate byte length needed
    const byteLength = Math.ceil(bitLength(absValue) / 8);
    
    // Create result array with space for sign byte if negative
    const result = new Uint8Array(byteLength + (isNegative ? 1 : 0));
    
    // Extract bytes
    for (let i = 0; i < byteLength; i++) {
      result[i] = Number(absValue & BigInt(0xFF));
      absValue >>= BigInt(8);
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
      return BigInt(0);
    }
    
    // Special case for single byte with value 0
    if (bytes.length === 1 && bytes[0] === 0) {
      return BigInt(0);
    }
    
    // Check if this is a negative value (has an extra 0xFF byte at the end)
    const isNegative = bytes.length >= 2 && bytes[bytes.length - 1] === 0xFF;
    
    // Calculate the value (skip sign byte if negative)
    const valueBytes = isNegative ? bytes.subarray(0, bytes.length - 1) : bytes;
    
    // Convert bytes to BigInt (little-endian)
    let result = BigInt(0);
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
    
    if (value < BigInt(0)) return -1;
    if (value > BigInt(0)) return 1;
    return 0;
  };
  
  /**
   * Get the absolute value of a number
   */
  const abs = (value: bigint | number): bigint | number => {
    if (typeof value === 'number') {
      return Math.abs(value);
    }
    
    return value < BigInt(0) ? -value : value;
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
    return value > BigInt(0) && (value & (value - BigInt(1))) === BigInt(0);
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
