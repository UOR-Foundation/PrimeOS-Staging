/**
 * Advanced Modular Arithmetic Algorithms
 * ===================================
 * 
 * Implementation of advanced algorithms for modular arithmetic operations.
 */

import { MODULAR_CONSTANTS } from '../../constants';
import { bitLength } from '../../../bigint';
import { memoizeModular } from '../../cache';
import { 
  createBitSizeError,
  createOverflowError
} from '../../errors';
import { mod } from '../basic';

/**
 * Options for advanced modular operations
 */
export interface AdvancedModularOptions {
  /**
   * Whether to perform strict validation and throw detailed errors
   */
  strict?: boolean;
  
  /**
   * Whether to enable caching
   */
  useCache?: boolean;
  
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
  
  /**
   * Logger instance for debug information
   */
  logger?: any;
}

/**
 * Default options for advanced modular operations
 */
const DEFAULT_OPTIONS: AdvancedModularOptions = {
  strict: false,
  useCache: true,
  debug: false
};

/**
 * Karatsuba multiplication algorithm for large integers
 * More efficient than the standard multiplication for large numbers
 * 
 * The algorithm splits the numbers into two parts and uses the formula:
 * a*b = (a_high * 10^n + a_low) * (b_high * 10^n + b_low)
 *     = a_high * b_high * 10^(BigInt(2)) + (a_high * b_low + a_low * b_high) * 10^n + a_low * b_low
 * 
 * This reduces the number of multiplications from O(n^2) to O(n^1.585)
 */
export function karatsubaMultiply(
  a: bigint, 
  b: bigint,
  options: Partial<AdvancedModularOptions> = {}
): bigint {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`karatsubaMultiply: ${a} * ${b}`).catch(() => {});
  }
  
  // Base case: use native multiplication for small numbers
  const KARATSUBA_THRESHOLD = 64; // Threshold in bits
  
  if (a === BigInt(0) || b === BigInt(0)) return BigInt(0);
  
  const aBits = bitLength(a < BigInt(0) ? -a : a);
  const bBits = bitLength(b < BigInt(0) ? -b : b);
  
  if (aBits <= KARATSUBA_THRESHOLD || bBits <= KARATSUBA_THRESHOLD) {
    if (opts.debug && opts.logger) {
      opts.logger.debug(`Using native multiplication for small numbers: ${a} * ${b}`).catch(() => {});
    }
    return a * b;
  }
  
  // Check operation size in strict mode
  if (opts.strict && (aBits > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS || bBits > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS)) {
    const error = createBitSizeError(
      `karatsubaMultiply(${aBits} bits, ${bBits} bits)`,
      MODULAR_CONSTANTS.MAX_SUPPORTED_BITS,
      Math.max(aBits, bBits)
    );
    if (opts.debug && opts.logger) {
      opts.logger.error('Error in karatsubaMultiply (strict mode):', error).catch(() => {});
    }
    throw error;
  }
  
  // Determine the split point (half the maximum bit length)
  const m = Math.max(aBits, bBits);
  const m2 = Math.floor(m / 2);
  
  // Split the numbers
  const mask = (BigInt(1) << BigInt(m2)) - BigInt(1);
  const aHigh = a >> BigInt(m2);
  const aLow = a & mask;
  const bHigh = b >> BigInt(m2);
  const bLow = b & mask;
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`Split point: ${m2} bits`).catch(() => {});
    opts.logger.debug(`a_high: ${aHigh}, a_low: ${aLow}`).catch(() => {});
    opts.logger.debug(`b_high: ${bHigh}, b_low: ${bLow}`).catch(() => {});
  }
  
  // Recursive steps
  const z0 = karatsubaMultiply(aLow, bLow, opts);
  const z2 = karatsubaMultiply(aHigh, bHigh, opts);
  const z1 = karatsubaMultiply(aLow + aHigh, bLow + bHigh, opts) - z0 - z2;
  
  // Combine results
  const result = (z2 << (BigInt(2) * BigInt(m2))) + (z1 << BigInt(m2)) + z0;
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`karatsubaMultiply result: ${result}`).catch(() => {});
  }
  
  return result;
}

/**
 * Modular multiplication using Karatsuba algorithm
 * Calculates (a * b) % m efficiently for large numbers
 */
export function karatsubaModMul(
  a: bigint | number, 
  b: bigint | number, 
  m: bigint | number,
  options: Partial<AdvancedModularOptions> = {}
): bigint {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`karatsubaModMul: (${a} * ${b}) % ${m}`).catch(() => {});
  }
  
  // Convert to BigInt for consistent handling
  const aBig = BigInt(a);
  const bBig = BigInt(b);
  const mBig = BigInt(m);
  
  // Ensure inputs are within the modulus
  const aMod = mod(aBig, mBig);
  const bMod = mod(bBig, mBig);
  
  // Use Karatsuba multiplication
  const product = karatsubaMultiply(aMod, bMod, opts);
  
  // Apply modulus
  const result = mod(product, mBig);
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`karatsubaModMul result: ${result}`).catch(() => {});
  }
  
  return result;
}

/**
 * Montgomery reduction for efficient modular multiplication
 * This algorithm avoids expensive division operations
 */
export function montgomeryReduction(
  a: bigint, 
  m: bigint,
  options: Partial<AdvancedModularOptions> = {}
): bigint {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`montgomeryReduction: ${a} mod ${m}`).catch(() => {});
  }
  
  // Check if m is odd (required for Montgomery reduction)
  if (m % BigInt(2) === BigInt(0)) {
    if (opts.debug && opts.logger) {
      opts.logger.debug(`Montgomery reduction requires odd modulus, using standard mod`).catch(() => {});
    }
    return mod(a, m);
  }
  
  // Calculate parameters
  const n = bitLength(m);
  const r = BigInt(1) << BigInt(n); // r = 2^n
  const rInverse = modInversePowerOfTwo(m, r);
  const mPrime = (r * rInverse - BigInt(1)) / m;
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`Montgomery parameters: n=${n}, r=${r}, r_inverse=${rInverse}, m_prime=${mPrime}`).catch(() => {});
  }
  
  // Convert to Montgomery form
  const aBar = (a * r) % m;
  
  // Reduction
  let t = aBar;
  const mask = r - BigInt(1);
  
  for (let i = 0; i < n; i++) {
    const ui = (t & BigInt(1)) * mPrime;
    t = (t + ui * m) >> BigInt(1);
  }
  
  if (t >= m) {
    t -= m;
  }
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`montgomeryReduction result: ${t}`).catch(() => {});
  }
  
  return t;
}

/**
 * Calculate modular inverse for a power of two modulus
 * Used in Montgomery reduction
 */
function modInversePowerOfTwo(a: bigint, m: bigint): bigint {
  // m must be a power of 2
  if ((m & (m - BigInt(1))) !== BigInt(0)) {
    throw new Error('Modulus must be a power of 2');
  }
  
  let x = BigInt(1);
  
  // Newton's method for finding modular inverse
  for (let i = 0; i < 5; i++) { // Usually converges in a few iterations
    x = x * (BigInt(2) - a * x); // x = x * (2 - a*x)
    x = x % m;
  }
  
  return x;
}

/**
 * Number-Theoretic Transform (NTT) for efficient large integer multiplication
 * This is a specialized version of the Fast Fourier Transform (FFT) for modular arithmetic
 * 
 * Note: This is a simplified implementation and requires that:
 * 1. The modulus is a prime of the form p = k*2^n + 1 (for some k and n)
 * 2. The primitive root of unity exists for the given modulus
 */
export function numberTheoreticTransform(
  a: bigint[], 
  modulus: bigint,
  inverse: boolean = false,
  options: Partial<AdvancedModularOptions> = {}
): bigint[] {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`numberTheoreticTransform: ${inverse ? 'inverse ' : ''}NTT of array length ${a.length}`).catch(() => {});
  }
  
  // Ensure the array length is a power of 2
  const n = a.length;
  if ((n & (n - 1)) !== 0) {
    throw new Error('Array length must be a power of 2');
  }
  
  // Find a primitive root of unity
  const order = BigInt(n);
  const primitiveRoot = findPrimitiveRoot(modulus, order);
  
  if (primitiveRoot === null) {
    throw new Error(`Could not find primitive ${order}-th root of unity modulo ${modulus}`);
  }
  
  // Calculate the root of unity
  let omega = modPow(primitiveRoot, (modulus - BigInt(1)) / order, modulus);
  
  if (inverse) {
    // For inverse NTT, use the inverse of omega
    omega = modPow(omega, modulus - BigInt(2), modulus); // omega^-1 = omega^(p-2) mod p
  }
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`NTT parameters: n=${n}, primitive_root=${primitiveRoot}, omega=${omega}`).catch(() => {});
  }
  
  // Perform the NTT
  const result = nttRecursive(a, omega, modulus, opts);
  
  // For inverse NTT, multiply by n^-1 mod p
  if (inverse) {
    const nInverse = modPow(BigInt(n), modulus - BigInt(2), modulus);
    for (let i = 0; i < n; i++) {
      result[i] = (result[i] * nInverse) % modulus;
    }
  }
  
  return result;
}

/**
 * Recursive implementation of the Number-Theoretic Transform
 */
function nttRecursive(
  a: bigint[], 
  omega: bigint, 
  modulus: bigint,
  options: Partial<AdvancedModularOptions> = {}
): bigint[] {
  const n = a.length;
  
  // Base case
  if (n === 1) {
    return [a[0]];
  }
  
  // Split into even and odd indices
  const aEven = new Array(n / 2);
  const aOdd = new Array(n / 2);
  
  for (let i = 0; i < n / 2; i++) {
    aEven[i] = a[2 * i];
    aOdd[i] = a[2 * i + 1];
  }
  
  // Recursive calls
  const yEven = nttRecursive(aEven, (omega * omega) % modulus, modulus, options);
  const yOdd = nttRecursive(aOdd, (omega * omega) % modulus, modulus, options);
  
  // Combine results
  const y = new Array(n);
  let omegaPow = BigInt(1);
  
  for (let k = 0; k < n / 2; k++) {
    const t = (omegaPow * yOdd[k]) % modulus;
    y[k] = (yEven[k] + t) % modulus;
    y[k + n / 2] = (yEven[k] - t + modulus) % modulus;
    omegaPow = (omegaPow * omega) % modulus;
  }
  
  return y;
}

/**
 * Find a primitive root of unity of the given order
 */
function findPrimitiveRoot(
  p: bigint, 
  order: bigint
): bigint | null {
  // Check if p is prime (simplified check)
  for (let i = BigInt(2); i * i <= p; i++) {
    if (p % i === BigInt(0)) {
      return null; // p is not prime
    }
  }
  
  // Check if order divides p-1
  if ((p - BigInt(1)) % order !== BigInt(0)) {
    return null;
  }
  
  // Find a primitive root
  const k = (p - BigInt(1)) / order;
  
  for (let g = BigInt(2); g < p; g++) {
    const root = modPow(g, k, p);
    
    // Check if root has the correct order
    if (modPow(root, order, p) === BigInt(1)) {
      let isValid = true;
      
      // Check if root^(order/q) != 1 for all prime factors q of order
      // (simplified: just check if root^(order/2) != 1 if order is even)
      if (order % BigInt(2) === BigInt(0) && modPow(root, order / BigInt(2), p) === BigInt(1)) {
        isValid = false;
      }
      
      if (isValid) {
        return root;
      }
    }
  }
  
  return null;
}

/**
 * Modular exponentiation helper for NTT
 */
function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (exponent === BigInt(0)) return BigInt(1);
  
  let result = BigInt(1);
  let b = base % modulus;
  let e = exponent;
  
  while (e > BigInt(0)) {
    if (e % BigInt(2) === BigInt(1)) {
      result = (result * b) % modulus;
    }
    e >>= BigInt(1);
    b = (b * b) % modulus;
  }
  
  return result;
}

/**
 * Create memoized versions of the advanced modular operations
 */
export function createMemoizedAdvancedOperations(
  options: Partial<AdvancedModularOptions> = {}
): { 
  karatsubaMultiply: (a: bigint, b: bigint) => bigint;
  karatsubaModMul: (a: bigint | number, b: bigint | number, m: bigint | number) => bigint;
  montgomeryReduction: (a: bigint, m: bigint) => bigint;
} {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create memoized functions if caching is enabled
  if (opts.useCache) {
    return {
      karatsubaMultiply: memoizeModular(
        (a, b) => karatsubaMultiply(a, b, opts),
        'karatsubaMultiply',
        { enabled: true }
      ),
      karatsubaModMul: memoizeModular(
        (a, b, m) => karatsubaModMul(a, b, m, opts),
        'karatsubaModMul',
        { enabled: true }
      ),
      montgomeryReduction: memoizeModular(
        (a, m) => montgomeryReduction(a, m, opts),
        'montgomeryReduction',
        { enabled: true }
      )
    };
  }
  
  // Return non-memoized functions if caching is disabled
  return {
    karatsubaMultiply: (a, b) => karatsubaMultiply(a, b, opts),
    karatsubaModMul: (a, b, m) => karatsubaModMul(a, b, m, opts),
    montgomeryReduction: (a, m) => montgomeryReduction(a, m, opts)
  };
}
