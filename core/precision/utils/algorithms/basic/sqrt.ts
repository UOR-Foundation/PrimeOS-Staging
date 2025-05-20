/**
 * Integer Square Root Implementation
 * ================================
 * 
 * Implementation of integer square root calculation.
 */

import { UtilityOptions } from '../../types';
import { createNegativeInputError } from '../../errors';

/**
 * Create integer square root function with the specified options
 */
export function createSqrtFunctions(options: UtilityOptions = {}) {
  // Process options with defaults
  const config = {
    strict: options.strict ?? false
  };
  
  /**
   * Calculate the integer square root of a number
   * Returns the largest integer r such that r*r <= n
   */
  const integerSqrt = (value: bigint | number): bigint | number => {
    // Convert to BigInt for consistent handling
    const n = typeof value === 'number' ? BigInt(Math.floor(value)) : value;
    
    // Handle negative inputs
    if (n < 0n) {
      if (config.strict) {
        throw createNegativeInputError('integerSqrt', n);
      }
      return 0n;
    }
    
    // Special cases
    if (n === 0n) return 0n;
    if (n === 1n) return 1n;
    
    // Binary search for the integer square root
    let x = n;
    let y = (x + 1n) / 2n;
    
    while (y < x) {
      x = y;
      y = (x + n / x) / 2n;
    }
    
    return x;
  };
  
  return {
    integerSqrt
  };
}
