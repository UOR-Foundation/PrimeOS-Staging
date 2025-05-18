/**
 * Prime Module Utilities
 * ======================
 * 
 * Utility functions for the prime module implementation.
 */

import { Stream, Factor } from './types';

/**
 * Create a basic stream from an array of values
 */
export function createBasicStream<T>(values: T[]): Stream<T> {
  let position = 0;
  const buffer = [...values];
  
  return {
    // Iterator protocol implementation
    [Symbol.iterator](): Iterator<T> {
      let iterPosition = 0;
      
      return {
        next(): IteratorResult<T> {
          if (iterPosition < buffer.length) {
            return {
              value: buffer[iterPosition++],
              done: false
            };
          }
          
          return { done: true, value: undefined as any };
        }
      };
    },
    
    // Get next item in stream
    next(): IteratorResult<T> {
      if (position < buffer.length) {
        return {
          value: buffer[position++],
          done: false
        };
      }
      
      return { done: true, value: undefined as any };
    },
    
    // Stream transformation methods
    map<U>(fn: (value: T) => U): Stream<U> {
      return createBasicStream(buffer.map(fn));
    },
    
    filter(fn: (value: T) => boolean): Stream<T> {
      return createBasicStream(buffer.filter(fn));
    },
    
    take(n: number): Stream<T> {
      return createBasicStream(buffer.slice(0, n));
    },
    
    skip(n: number): Stream<T> {
      return createBasicStream(buffer.slice(n));
    },
    
    // Stream consumption methods
    async reduce<U>(fn: (acc: U, value: T) => U, initial: U): Promise<U> {
      return buffer.reduce(fn, initial);
    },
    
    async forEach(fn: (value: T) => void): Promise<void> {
      buffer.forEach(fn);
    },
    
    async toArray(): Promise<T[]> {
      return [...buffer];
    },
    
    // Buffer management
    getBuffer(): T[] {
      return [...buffer];
    },
    
    // Stream composition
    concat(other: Stream<T>): Stream<T> {
      const otherBuffer = other.getBuffer ? other.getBuffer() : [];
      return createBasicStream([...buffer, ...otherBuffer]);
    },
    
    // Stream branching
    branch(): Stream<T> {
      return createBasicStream([...buffer]);
    }
  };
}

/**
 * Modular arithmetic for BigInt values
 * 
 * Returns a positive value between 0 and |m| - 1, matching
 * Python's modular semantics.
 */
export function mod(a: bigint, m: bigint): bigint {
  return ((a % m) + m) % m;
}

/**
 * Modular exponentiation for BigInt values
 * 
 * Efficiently computes (base ** exponent) % modulus
 * without overflowing for large values.
 */
export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  if (exponent < 0n) {
    throw new Error("Negative exponents not supported");
  }
  
  // Handle the base case
  base = mod(base, modulus);
  
  let result = 1n;
  while (exponent > 0n) {
    // If the current bit of the exponent is 1, multiply result by base
    if (exponent & 1n) {
      result = (result * base) % modulus;
    }
    
    // Square the base for the next bit
    base = (base * base) % modulus;
    
    // Move to the next bit in the exponent
    exponent >>= 1n;
  }
  
  return result;
}

/**
 * Compute integer square root for BigInt
 * 
 * Returns the largest integer r such that r^2 <= n
 */
export function integerSqrt(n: bigint): bigint {
  if (n < 0n) {
    throw new Error("Square root of negative number is not defined");
  }
  
  if (n === 0n) return 0n;
  if (n <= 3n) return 1n;
  
  // Use Newton's method to find the integer square root
  // r_{n+1} = floor((r_n + floor(n/r_n))/2)
  let x0 = n;
  let x1 = (x0 + n / x0) >> 1n;
  
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + n / x0) >> 1n;
  }
  
  return x0;
}

/**
 * Check if a number is a perfect square
 */
export function isPerfectSquare(n: bigint): boolean {
  if (n < 0n) return false;
  if (n === 0n) return true;
  
  const root = integerSqrt(n);
  return root * root === n;
}

/**
 * Reconstruct a number from its prime factorization
 */
export function reconstructFromFactors(factors: Factor[]): bigint {
  return factors.reduce(
    (acc, { prime, exponent }) => acc * prime ** BigInt(exponent),
    1n
  );
}
