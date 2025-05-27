/**
 * Prime Module Utilities
 * ======================
 * 
 * Utility functions for the prime module implementation.
 * Uses the precision module for enhanced mathematical operations.
 */

import { Stream, Factor } from './types';

// Import enhanced mathematical functions from the precision module
import { 
  mod as precisionMod, 
  modPow as precisionModPow, 
  integerSqrt as precisionIntegerSqrt,
} from '../precision';

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
 * Uses the precision module's enhanced implementation with Python-compatible semantics.
 */
export function mod(a: bigint, m: bigint): bigint {
  return precisionMod(a, m);
}

/**
 * Modular exponentiation for BigInt values
 * 
 * Uses the precision module's optimized implementation with overflow protection.
 */
export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  return precisionModPow(base, exponent, modulus);
}

/**
 * Compute integer square root for BigInt
 * 
 * Uses the precision module's enhanced implementation with better convergence.
 */
export function integerSqrt(n: bigint): bigint {
  if (n < 0n) {
    throw new Error('Square root of negative number is not defined');
  }
  const result = precisionIntegerSqrt(n);
  return typeof result === 'bigint' ? result : BigInt(result);
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
    (acc, { prime, exponent }) => acc * (prime ** BigInt(exponent)),
    1n
  );
}
