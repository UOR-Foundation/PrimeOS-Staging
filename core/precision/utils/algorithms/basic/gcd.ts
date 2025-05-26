/**
 * GCD and LCM Implementations
 * ==========================
 * 
 * Implementations of greatest common divisor and least common multiple.
 */

import { UtilityOptions } from '../../types';
import { createValidationError, createDivisionByZeroError } from '../../errors';

/**
 * Create GCD and LCM functions with the specified options
 */
export function createGcdFunctions(options: UtilityOptions = {}) {
  // Process options with defaults
  const config = {
    strict: options.strict ?? false
  };
  
  /**
   * Calculate the greatest common divisor of two numbers
   * Uses an iterative implementation to avoid stack overflow for large numbers
   */
  const gcd = (a: bigint | number, b: bigint | number): bigint | number => {
    // Convert to BigInt for consistent handling
    let aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
    let bBig = typeof b === 'number' ? BigInt(Math.floor(b)) : b;
    
    // Handle negative numbers by taking absolute values
    aBig = aBig < BigInt(0) ? -aBig : aBig;
    bBig = bBig < BigInt(0) ? -bBig : bBig;
    
    // Iterative Euclidean algorithm
    while (bBig !== BigInt(0)) {
      const temp = bBig;
      bBig = aBig % bBig;
      aBig = temp;
    }
    
    return aBig;
  };
  
  /**
   * Calculate the least common multiple of two numbers
   */
  const lcm = (a: bigint | number, b: bigint | number): bigint | number => {
    // Convert to BigInt for consistent handling
    const aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
    const bBig = typeof b === 'number' ? BigInt(Math.floor(b)) : b;
    
    // Handle zero inputs
    if (aBig === BigInt(0) || bBig === BigInt(0)) return BigInt(0);
    
    // Handle negative numbers by taking absolute values
    const aAbs = aBig < BigInt(0) ? -aBig : aBig;
    const bAbs = bBig < BigInt(0) ? -bBig : bBig;
    
    // LCM formula: |a*b| / gcd(a,b)
    const gcdVal = gcd(aAbs, bAbs);
    return (aAbs / (gcdVal as bigint)) * bAbs;
  };
  
  /**
   * Extended Euclidean algorithm to find Bézout coefficients
   * Returns [gcd, x, y] such that ax + by = gcd(a, b)
   * Uses an iterative implementation to avoid stack overflow for large numbers
   */
  const extendedGcd = (a: bigint | number, b: bigint | number): [bigint, bigint, bigint] => {
    // Convert to BigInt for consistent handling
    let aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
    let bBig = typeof b === 'number' ? BigInt(Math.floor(b)) : b;
    
    // Handle zero inputs
    if (aBig === BigInt(0)) return [bBig, BigInt(0), BigInt(1)];
    if (bBig === BigInt(0)) return [aBig, BigInt(1), BigInt(0)];
    
    // Initialize coefficients
    let s = BigInt(0);
    let oldS = BigInt(1);
    let t = BigInt(1);
    let oldT = BigInt(0);
    let r = bBig;
    let oldR = aBig;
    
    // Iterative Extended Euclidean algorithm
    while (r !== BigInt(0)) {
      const quotient = oldR / (r as bigint);
      
      // Update remainders
      const tempR = r;
      r = oldR - quotient * r;
      oldR = tempR;
      
      // Update s coefficients
      const tempS = s;
      s = oldS - quotient * s;
      oldS = tempS;
      
      // Update t coefficients
      const tempT = t;
      t = oldT - quotient * t;
      oldT = tempT;
    }
    
    // Ensure the GCD is positive
    if (oldR < BigInt(0)) {
      oldR = -oldR;
      oldS = -oldS;
      oldT = -oldT;
    }
    
    return [oldR, oldS, oldT];
  };
  
  return {
    gcd,
    lcm,
    extendedGcd
  };
}
