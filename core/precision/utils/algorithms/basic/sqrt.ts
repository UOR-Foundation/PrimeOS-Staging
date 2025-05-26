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
    if (n < BigInt(0)) {
      if (config.strict) {
        throw createNegativeInputError('integerSqrt', n);
      }
      return BigInt(0);
    }
    
    // Special cases
    if (n === BigInt(0)) return BigInt(0);
    if (n === BigInt(1)) return BigInt(1);
    
    // Binary search for the integer square root
    let x = n;
    let y = (x + BigInt(1)) / BigInt(2);
    
    while (y < x) {
      x = y;
      y = (x + n / x) / BigInt(2);
    }
    
    return x;
  };
  
  return {
    integerSqrt
  };
}
