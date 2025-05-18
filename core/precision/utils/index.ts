/**
 * Utility Functions
 * ===============
 * 
 * Common mathematical utility functions for precision operations.
 */

import { 
  UtilityOptions, 
  MathUtilsInterface,
  BitLengthFunction,
  ExactEqualsFunction,
  ByteArrayFunction,
  UTILITY_CONSTANTS
} from './types';

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
  
  // Cache for bit length calculations
  const bitLengthCache = new Map<string, number>();
  
  /**
   * Calculate the bit length of a number
   */
  const bitLength: BitLengthFunction = (value): number => {
    // Handle different number types
    if (typeof value === 'number') {
      // For regular numbers, convert to BigInt for consistent handling
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
    if (config.enableCache) {
      const key = absValue.toString();
      if (bitLengthCache.has(key)) {
        return bitLengthCache.get(key)!;
      }
    }
    
    // Calculate bit length using binary representation
    const length = absValue.toString(2).length;
    
    // Cache result if enabled
    if (config.enableCache) {
      const key = absValue.toString();
      if (bitLengthCache.size < 1000) { // Limit cache size
        bitLengthCache.set(key, length);
      }
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
    
    return result;
  };
  
  /**
   * Convert a byte array to a BigInt (little-endian)
   */
  const fromByteArray = (bytes: Uint8Array): bigint => {
    // Detect negative values (last byte is 0xFF marker)
    const isNegative = bytes.length > 0 && bytes[bytes.length - 1] === 0xFF;
    
    // Calculate the value (skip sign byte if negative)
    const valueBytes = isNegative ? bytes.subarray(0, bytes.length - 1) : bytes;
    
    let result = 0n;
    for (let i = valueBytes.length - 1; i >= 0; i--) {
      result = (result << 8n) | BigInt(valueBytes[i]);
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
    isPowerOfTwo
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
  isPowerOfTwo
} = defaultUtils;

// Export the MathUtils class and factory function
export { MathUtils, createMathUtils };

// Export utility constants
export { UTILITY_CONSTANTS };
