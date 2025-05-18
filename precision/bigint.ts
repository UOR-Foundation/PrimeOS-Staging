/**
 * Precision Module - BigInt Utilities
 * =================================
 *
 * Extended utilities for working with BigInt values more effectively,
 * providing precise mathematical operations for large numbers that exceed
 * the range of JavaScript's native Number type.
 */

import { toByteArray, fromByteArray } from './utils';
import { mod } from './modular';

/**
 * Provides precision-enhanced operations for very large integers
 * This is especially useful for numbers that exceed BigInt's reasonable performance range
 */
export class PrecisionBigInt {
  private value: bigint;
  
  constructor(value: number | bigint | string) {
    if (typeof value === 'number') {
      this.value = BigInt(Math.floor(value));
    } else if (typeof value === 'string') {
      this.value = BigInt(value);
    } else {
      this.value = value;
    }
  }
  
  /**
   * Get the raw BigInt value
   */
  getValue(): bigint {
    return this.value;
  }
  
  /**
   * Convert to a byte array representation
   */
  toBytes(): Uint8Array {
    return toByteArray(this.value);
  }
  
  /**
   * Create from a byte array
   */
  static fromBytes(bytes: Uint8Array): PrecisionBigInt {
    return new PrecisionBigInt(fromByteArray(bytes));
  }
  
  /**
   * Add another BigInt
   */
  add(other: PrecisionBigInt | bigint | number): PrecisionBigInt {
    const otherValue = this.extractValue(other);
    return new PrecisionBigInt(this.value + otherValue);
  }
  
  /**
   * Subtract another BigInt
   */
  subtract(other: PrecisionBigInt | bigint | number): PrecisionBigInt {
    const otherValue = this.extractValue(other);
    return new PrecisionBigInt(this.value - otherValue);
  }
  
  /**
   * Multiply by another BigInt
   */
  multiply(other: PrecisionBigInt | bigint | number): PrecisionBigInt {
    const otherValue = this.extractValue(other);
    return new PrecisionBigInt(this.value * otherValue);
  }
  
  /**
   * Divide by another BigInt
   */
  divide(other: PrecisionBigInt | bigint | number): PrecisionBigInt {
    const otherValue = this.extractValue(other);
    if (otherValue === 0n) {
      throw new Error("Division by zero");
    }
    return new PrecisionBigInt(this.value / otherValue);
  }
  
  /**
   * Calculate modulo of this BigInt
   */
  modulo(modulus: PrecisionBigInt | bigint | number): PrecisionBigInt {
    const modulusValue = this.extractValue(modulus);
    // Use our precision-enhanced mod function
    const result = mod(this.value, modulusValue);
    return new PrecisionBigInt(result as bigint);
  }
  
  /**
   * Calculate this BigInt raised to a power
   */
  pow(exponent: number): PrecisionBigInt {
    if (exponent < 0) {
      throw new Error("Negative exponents not supported for direct pow operation");
    }
    
    let result = 1n;
    let base = this.value;
    let exp = exponent;
    
    while (exp > 0) {
      if (exp % 2 === 1) {
        result *= base;
      }
      base *= base;
      exp = Math.floor(exp / 2);
    }
    
    return new PrecisionBigInt(result);
  }
  
  /**
   * Check if this BigInt equals another value
   */
  equals(other: PrecisionBigInt | bigint | number): boolean {
    const otherValue = this.extractValue(other);
    return this.value === otherValue;
  }
  
  /**
   * Check if this BigInt is greater than another value
   */
  greaterThan(other: PrecisionBigInt | bigint | number): boolean {
    const otherValue = this.extractValue(other);
    return this.value > otherValue;
  }
  
  /**
   * Check if this BigInt is less than another value
   */
  lessThan(other: PrecisionBigInt | bigint | number): boolean {
    const otherValue = this.extractValue(other);
    return this.value < otherValue;
  }
  
  /**
   * Convert to string
   */
  toString(): string {
    return this.value.toString();
  }
  
  /**
   * Return absolute value
   */
  abs(): PrecisionBigInt {
    return new PrecisionBigInt(this.value < 0n ? -this.value : this.value);
  }
  
  /**
   * Calculate greatest common divisor
   */
  gcd(other: PrecisionBigInt | bigint | number): PrecisionBigInt {
    let a = this.value < 0n ? -this.value : this.value;
    let b = this.extractValue(other);
    b = b < 0n ? -b : b;
    
    while (b !== 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    
    return new PrecisionBigInt(a);
  }
  
  /**
   * Helper to extract a raw bigint value from various input types
   */
  private extractValue(value: PrecisionBigInt | bigint | number): bigint {
    if (value instanceof PrecisionBigInt) {
      return value.getValue();
    } else if (typeof value === 'bigint') {
      return value;
    } else {
      return BigInt(Math.floor(value));
    }
  }
}

/**
 * Function to create a PrecisionBigInt from any compatible value
 */
export function createPrecisionBigInt(value: number | bigint | string): PrecisionBigInt {
  return new PrecisionBigInt(value);
}

/**
 * Convert a standard number to a BigInt
 */
export function toBigInt(value: number): bigint {
  return BigInt(Math.floor(value));
}

/**
 * Safely convert a BigInt to a number if within safe range
 */
export function toNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error("BigInt value exceeds safe integer range");
  }
  return Number(value);
}

/**
 * Check if a BigInt is a probable prime
 */
export function isProbablePrime(value: bigint, iterations: number = 10): boolean {
  // Simple primality test for demonstration
  if (value <= 1n) return false;
  if (value <= 3n) return true;
  if (value % 2n === 0n) return false;
  
  // Check small prime divisors for optimization
  const smallPrimes = [3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];
  for (const p of smallPrimes) {
    if (value === p) return true;
    if (value % p === 0n) return false;
  }
  
  // Miller-Rabin primality test would be implemented here for a full solution
  // For now, we just use a simple check
  
  return true; // Placeholder - a real implementation would use Miller-Rabin
}
