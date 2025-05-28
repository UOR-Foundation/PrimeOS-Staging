/**
 * NTT Utility Functions
 * ====================
 * 
 * Mathematical utility functions for Number Theoretic Transform operations.
 * Uses the precision module for enhanced modular arithmetic.
 */

// Import modular arithmetic functions from the precision module
import { 
  mod as precisionMod, 
  modPow as precisionModPow,
  modInverse as precisionModInverse
} from '../../precision/modular';

/**
 * Modular arithmetic for BigInt values
 * Uses the precision module's enhanced implementation
 */
export function mod(a: bigint, m: bigint): bigint {
  return precisionMod(a, m);
}

/**
 * Modular exponentiation for BigInt values
 * Uses the precision module's optimized implementation
 */
export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  return precisionModPow(base, exponent, modulus);
}

/**
 * Modular multiplicative inverse using extended Euclidean algorithm
 * Uses the precision module's implementation
 */
export function modularInverse(a: bigint, m: bigint): bigint {
  return precisionModInverse(a, m);
}

/**
 * Greatest Common Divisor using Euclidean algorithm
 */
export function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Check if a number is a primitive root modulo p
 */
export function isPrimitiveRoot(g: bigint, p: bigint): boolean {
  if (gcd(g, p) !== 1n) {
    return false;
  }
  
  // For prime p, g is a primitive root if g^((p-1)/q) ≠ 1 (mod p)
  // for all prime factors q of (p-1)
  const phi = p - 1n;
  
  // Simple check for small cases
  const order = findOrder(g, p);
  return order === phi;
}

/**
 * Find the multiplicative order of g modulo p
 */
export function findOrder(g: bigint, p: bigint): bigint {
  let order = 1n;
  let current = g % p;
  
  while (current !== 1n && order < p) {
    current = mod(current * g, p);
    order++;
  }
  
  return order;
}

/**
 * Fast power-of-two check
 */
export function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Find the next power of 2 greater than or equal to n
 */
export function nextPowerOfTwo(n: number): number {
  if (isPowerOfTwo(n)) return n;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Bit reversal for FFT algorithms
 */
export function bitReverse(num: number, bits: number): number {
  let result = 0;
  for (let i = 0; i < bits; i++) {
    result = (result << 1) | (num & 1);
    num >>= 1;
  }
  return result;
}

/**
 * Generate bit-reversed indices for an array of given size
 */
export function generateBitReversedIndices(size: number): number[] {
  const bits = Math.log2(size);
  const indices = new Array(size);
  
  for (let i = 0; i < size; i++) {
    indices[i] = bitReverse(i, bits);
  }
  
  return indices;
}

/**
 * Validate NTT parameters
 */
export function validateNTTParameters(modulus: bigint, primitiveRoot: bigint, size: number): void {
  if (modulus <= 1n) {
    throw new Error('Modulus must be greater than 1');
  }
  
  if (primitiveRoot <= 0n || primitiveRoot >= modulus) {
    throw new Error('Primitive root must be in range (0, modulus)');
  }
  
  if (!isPowerOfTwo(size)) {
    throw new Error('Size must be a power of 2');
  }
  
  if (gcd(primitiveRoot, modulus) !== 1n) {
    throw new Error('Primitive root must be coprime to modulus');
  }
}

/**
 * Find a primitive root modulo p (for prime p)
 */
export function findPrimitiveRoot(p: bigint): bigint {
  for (let g = 2n; g < p; g++) {
    if (isPrimitiveRoot(g, p)) {
      return g;
    }
  }
  throw new Error(`No primitive root found for ${p}`);
}

/**
 * Miller-Rabin primality test (basic implementation)
 */
export function isProbablyPrime(n: bigint, k: number = 5): boolean {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n) return false;
  
  // Write n-1 as d * 2^r
  let d = n - 1n;
  let r = 0;
  while (d % 2n === 0n) {
    d /= 2n;
    r++;
  }
  
  // Witness loop
  for (let i = 0; i < k; i++) {
    const a = 2n + BigInt(Math.floor(Math.random() * Number(n - 4n)));
    let x = modPow(a, d, n);
    
    if (x === 1n || x === n - 1n) continue;
    
    let composite = true;
    for (let j = 0; j < r - 1; j++) {
      x = modPow(x, 2n, n);
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }
    
    if (composite) return false;
  }
  
  return true;
}
