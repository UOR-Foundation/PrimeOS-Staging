/**
 * Division Operations Implementation
 * ===============================
 * 
 * Implementation of ceiling and floor division operations.
 */

import { UtilityOptions } from '../../types';
import { createDivisionByZeroError } from '../../errors';

/**
 * Create division functions with the specified options
 */
export function createDivisionFunctions(options: UtilityOptions = {}) {
  // Process options with defaults
  const config = {
    strict: options.strict ?? false
  };
  
  /**
   * Ceiling division (rounds up the result of a/b)
   * Returns the smallest integer n such that n >= a/b
   */
  const ceilDiv = (a: bigint | number, b: bigint | number): bigint | number => {
    // Convert to BigInt for consistent handling
    const aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
    const bBig = typeof b === 'number' ? BigInt(Math.floor(b)) : b;
    
    // Handle division by zero
    if (bBig === 0n) {
      throw createDivisionByZeroError();
    }
    
    // Handle negative numbers
    if (bBig < 0n) {
      return ceilDiv(-aBig, -bBig);
    }
    
    // Ceiling division formula: (a + b - 1) / b for positive b
    // For negative a, we need to handle differently
    if (aBig < 0n) {
      return aBig / bBig;
    } else {
      return (aBig + bBig - 1n) / bBig;
    }
  };
  
  /**
   * Floor division (rounds down the result of a/b)
   * Returns the largest integer n such that n <= a/b
   */
  const floorDiv = (a: bigint | number, b: bigint | number): bigint | number => {
    // Convert to BigInt for consistent handling
    const aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
    const bBig = typeof b === 'number' ? BigInt(Math.floor(b)) : b;
    
    // Handle division by zero
    if (bBig === 0n) {
      throw createDivisionByZeroError();
    }
    
    // Handle negative numbers
    if (bBig < 0n) {
      return floorDiv(-aBig, -bBig);
    }
    
    // Floor division is just integer division for BigInt
    // For negative a, we need to handle differently
    if (aBig < 0n) {
      return (aBig - bBig + 1n) / bBig;
    } else {
      return aBig / bBig;
    }
  };
  
  return {
    ceilDiv,
    floorDiv
  };
}
