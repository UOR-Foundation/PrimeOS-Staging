/**
 * Precision Module - Modular Arithmetic
 * ===================================
 * 
 * Enhanced modular arithmetic functions that match Python's behavior exactly.
 * Addresses JavaScript's differences in modular operations, particularly
 * for negative values and modular inverses.
 */

import { ModularOptions } from './types';

/**
 * Correct modulo operation that always returns positive values,
 * matching Python's behavior.
 * 
 * JavaScript:  -5 % 13 = -5
 * Python:      -5 % 13 = 8
 * 
 * @param a The dividend
 * @param m The modulus (must be positive)
 * @returns The positive modulo result
 */
export function mod(a: number | bigint, m: number | bigint): number | bigint {
  if (typeof a === 'bigint' && typeof m === 'bigint') {
    return ((a % m) + m) % m;
  } else if (typeof a === 'number' && typeof m === 'number') {
    return ((a % m) + m) % m;
  } else {
    // Handle mixed types by converting to BigInt
    const aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
    const mBig = typeof m === 'number' ? BigInt(Math.floor(m)) : m;
    return ((aBig % mBig) + mBig) % mBig;
  }
}

/**
 * Modular addition with correct handling of negative values
 * 
 * @param a First operand
 * @param b Second operand
 * @param m Modulus
 * @returns (a + b) mod m
 */
export function modAdd(a: number | bigint, b: number | bigint, m: number | bigint): number | bigint {
  if (typeof a === 'bigint' && typeof b === 'bigint' && typeof m === 'bigint') {
    return mod(a + b, m);
  } else if (typeof a === 'number' && typeof b === 'number' && typeof m === 'number') {
    return mod(a + b, m);
  } else {
    // Handle mixed types by converting to BigInt
    const aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
    const bBig = typeof b === 'number' ? BigInt(Math.floor(b)) : b;
    const mBig = typeof m === 'number' ? BigInt(Math.floor(m)) : m;
    return mod(aBig + bBig, mBig);
  }
}

/**
 * Modular subtraction with correct handling of negative values
 * 
 * @param a First operand
 * @param b Second operand
 * @param m Modulus
 * @returns (a - b) mod m
 */
export function modSub(a: number | bigint, b: number | bigint, m: number | bigint): number | bigint {
  if (typeof a === 'bigint' && typeof b === 'bigint' && typeof m === 'bigint') {
    return mod(a - b, m);
  } else if (typeof a === 'number' && typeof b === 'number' && typeof m === 'number') {
    return mod(a - b, m);
  } else {
    // Handle mixed types by converting to BigInt
    const aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
    const bBig = typeof b === 'number' ? BigInt(Math.floor(b)) : b;
    const mBig = typeof m === 'number' ? BigInt(Math.floor(m)) : m;
    return mod(aBig - bBig, mBig);
  }
}

/**
 * Modular multiplication with correct handling of negative values
 * 
 * @param a First operand
 * @param b Second operand
 * @param m Modulus
 * @returns (a * b) mod m
 */
export function modMul(a: number | bigint, b: number | bigint, m: number | bigint): number | bigint {
  if (typeof a === 'bigint' && typeof b === 'bigint' && typeof m === 'bigint') {
    return mod(a * b, m);
  } else if (typeof a === 'number' && typeof b === 'number' && typeof m === 'number') {
    return mod(a * b, m);
  } else {
    // Handle mixed types by converting to BigInt
    const aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
    const bBig = typeof b === 'number' ? BigInt(Math.floor(b)) : b;
    const mBig = typeof m === 'number' ? BigInt(Math.floor(m)) : m;
    return mod(aBig * bBig, mBig);
  }
}

/**
 * Modular exponentiation: (base^exponent) mod modulus
 * Handles negative exponents by calculating modular inverse.
 * Exactly matches Python's pow(base, exponent, modulus) behavior.
 * 
 * @param base Base value
 * @param exponent Exponent (can be negative)
 * @param modulus Modulus
 * @param options Additional options
 * @returns (base^exponent) mod modulus
 */
export function modPow(
  base: number | bigint,
  exponent: number | bigint,
  modulus: number | bigint,
  options: ModularOptions = {}
): number | bigint {
  // Handle case where modulus is 1
  if ((typeof modulus === 'number' && modulus === 1) || 
      (typeof modulus === 'bigint' && modulus === 1n)) {
    return typeof modulus === 'bigint' ? 0n : 0;
  }
  
  // Check if exponent is negative
  let isNegativeExponent = false;
  if ((typeof exponent === 'number' && exponent < 0) || 
      (typeof exponent === 'bigint' && exponent < 0n)) {
    isNegativeExponent = true;
  }
  
  // For negative exponents, we need to calculate modular inverse first
  if (isNegativeExponent) {
    // Calculate modular inverse of base
    const inverse = modInverse(base, modulus);
    
    // Calculate positive exponent
    const positiveExponent = typeof exponent === 'number' 
      ? Math.abs(exponent)
      : -exponent; // For BigInt, negate the negative exponent
      
    // Calculate (base^-1)^|exponent| mod modulus
    return modPow(inverse, positiveExponent, modulus, options);
  }
  
  // All BigInt case
  if (typeof base === 'bigint' && typeof exponent === 'bigint' && typeof modulus === 'bigint') {
    return modPowBigInt(base, exponent, modulus);
  }
  
  // All Number case
  if (typeof base === 'number' && typeof exponent === 'number' && typeof modulus === 'number') {
    return modPowNumber(base, exponent, modulus);
  }
  
  // Mixed types - convert to BigInt for highest precision
  const baseBig = typeof base === 'number' ? BigInt(Math.floor(base)) : base;
  const expBig = typeof exponent === 'number' ? BigInt(Math.floor(exponent)) : exponent;
  const modBig = typeof modulus === 'number' ? BigInt(Math.floor(modulus)) : modulus;
  
  return modPowBigInt(baseBig, expBig, modBig);
}

/**
 * BigInt implementation of modular exponentiation
 */
function modPowBigInt(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  
  let result = 1n;
  base = ((base % modulus) + modulus) % modulus; // Ensure positive base
  
  while (exponent > 0n) {
    if (exponent & 1n) { // exponent is odd
      result = (result * base) % modulus;
    }
    exponent >>= 1n; // exponent = exponent / 2
    base = (base * base) % modulus;
  }
  
  return result;
}

/**
 * Number implementation of modular exponentiation
 */
function modPowNumber(base: number, exponent: number, modulus: number): number {
  if (modulus === 1) return 0;
  
  let result = 1;
  base = ((base % modulus) + modulus) % modulus; // Ensure positive base
  
  while (exponent > 0) {
    if (exponent % 2 === 1) { // exponent is odd
      result = (result * base) % modulus;
    }
    exponent = Math.floor(exponent / 2);
    base = (base * base) % modulus;
  }
  
  return result;
}

/**
 * Calculate the modular multiplicative inverse.
 * Equivalent to Python's pow(a, -1, m).
 * 
 * @param a Value to find the modular inverse for
 * @param m Modulus
 * @returns a^-1 mod m
 * @throws Error if the modular inverse doesn't exist
 */
export function modInverse(a: number | bigint, m: number | bigint): number | bigint {
  // Handle all BigInt case
  if (typeof a === 'bigint' && typeof m === 'bigint') {
    return modInverseBigInt(a, m);
  }
  
  // Handle all Number case
  if (typeof a === 'number' && typeof m === 'number') {
    return modInverseNumber(a, m);
  }
  
  // Mixed types - convert to BigInt for highest precision
  const aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
  const mBig = typeof m === 'number' ? BigInt(Math.floor(m)) : m;
  
  return modInverseBigInt(aBig, mBig);
}

/**
 * BigInt implementation of modular inverse using Extended Euclidean Algorithm
 */
function modInverseBigInt(a: bigint, m: bigint): bigint {
  // Ensure positive a
  a = ((a % m) + m) % m;
  
  if (a === 0n) {
    throw new Error('Modular inverse does not exist (0 has no inverse)');
  }
  
  // Extended Euclidean Algorithm
  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];
  let [old_t, t] = [0n, 1n];
  
  while (r !== 0n) {
    const quotient = old_r / r;
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
    [old_t, t] = [t, old_t - quotient * t];
  }
  
  // Check if a and m are coprime
  if (old_r !== 1n) {
    throw new Error(`Modular inverse does not exist (${a} and ${m} are not coprime)`);
  }
  
  // Ensure positive result matching Python's behavior
  return ((old_s % m) + m) % m;
}

/**
 * Number implementation of modular inverse using Extended Euclidean Algorithm
 */
function modInverseNumber(a: number, m: number): number {
  // Ensure positive a
  a = ((a % m) + m) % m;
  
  if (a === 0) {
    throw new Error('Modular inverse does not exist (0 has no inverse)');
  }
  
  // Extended Euclidean Algorithm
  let [old_r, r] = [a, m];
  let [old_s, s] = [1, 0];
  let [old_t, t] = [0, 1];
  
  while (r !== 0) {
    const quotient = Math.floor(old_r / r);
    [old_r, r] = [r, old_r - quotient * r];
    [old_s, s] = [s, old_s - quotient * s];
    [old_t, t] = [t, old_t - quotient * t];
  }
  
  // Check if a and m are coprime
  if (old_r !== 1) {
    throw new Error(`Modular inverse does not exist (${a} and ${m} are not coprime)`);
  }
  
  // Ensure positive result matching Python's behavior
  return ((old_s % m) + m) % m;
}

/**
 * Check if a and m are coprime (their greatest common divisor is 1)
 * 
 * @param a First number
 * @param m Second number
 * @returns True if a and m are coprime
 */
export function isCoprime(a: number | bigint, m: number | bigint): boolean {
  if (typeof a === 'bigint' && typeof m === 'bigint') {
    return gcdBigInt(a, m) === 1n;
  } else if (typeof a === 'number' && typeof m === 'number') {
    return gcdNumber(a, m) === 1;
  } else {
    // Mixed types - convert to BigInt
    const aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
    const mBig = typeof m === 'number' ? BigInt(Math.floor(m)) : m;
    return gcdBigInt(aBig, mBig) === 1n;
  }
}

/**
 * Calculate the greatest common divisor (GCD) of two numbers
 * 
 * @param a First number
 * @param b Second number
 * @returns The GCD of a and b
 */
export function gcd(a: number | bigint, b: number | bigint): number | bigint {
  if (typeof a === 'bigint' && typeof b === 'bigint') {
    return gcdBigInt(a, b);
  } else if (typeof a === 'number' && typeof b === 'number') {
    return gcdNumber(a, b);
  } else {
    // Mixed types - convert to BigInt
    const aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
    const bBig = typeof b === 'number' ? BigInt(Math.floor(b)) : b;
    return gcdBigInt(aBig, bBig);
  }
}

/**
 * BigInt implementation of the Euclidean algorithm for GCD
 */
function gcdBigInt(a: bigint, b: bigint): bigint {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  
  // Ensure a >= b
  if (b > a) {
    [a, b] = [b, a];
  }
  
  while (b !== 0n) {
    [a, b] = [b, a % b];
  }
  
  return a;
}

/**
 * Number implementation of the Euclidean algorithm for GCD
 */
function gcdNumber(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  
  // Ensure a >= b
  if (b > a) {
    [a, b] = [b, a];
  }
  
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  
  return a;
}

/**
 * Calculate the least common multiple (LCM) of two numbers
 * 
 * @param a First number
 * @param b Second number
 * @returns The LCM of a and b
 */
export function lcm(a: number | bigint, b: number | bigint): number | bigint {
  if (typeof a === 'bigint' && typeof b === 'bigint') {
    const g = gcdBigInt(a, b);
    return g === 0n ? 0n : ((a / g) * b);
  } else if (typeof a === 'number' && typeof b === 'number') {
    const g = gcdNumber(a, b);
    return g === 0 ? 0 : Math.abs((a / g) * b);
  } else {
    // Mixed types - convert to BigInt
    const aBig = typeof a === 'number' ? BigInt(Math.floor(a)) : a;
    const bBig = typeof b === 'number' ? BigInt(Math.floor(b)) : b;
    const g = gcdBigInt(aBig, bBig);
    return g === 0n ? 0n : ((aBig / g) * bBig);
  }
}

/**
 * Find primitive roots modulo n.
 * A primitive root modulo n is an integer g such that for any integer a coprime to n,
 * there is an integer k such that g^k ≡ a (mod n).
 * 
 * @param n Modulus
 * @param count Maximum number of primitive roots to find (default: 1)
 * @returns Array of primitive roots modulo n
 */
export function findPrimitiveRoots(n: number, count: number = 1): number[] {
  // Special case: no primitive roots for these values
  if (n <= 0 || n === 1) return [];
  
  // Handle n = 2 separately
  if (n === 2) return [1];
  
  // For large n, restrict search to avoid excessive computation
  const maxCandidate = Math.min(n - 1, 1000);
  const phi = calculateEulerTotient(n);
  const roots: number[] = [];
  
  // Find primitive roots
  for (let g = 2; g < maxCandidate && roots.length < count; g++) {
    if (isPrimitiveRoot(g, n, phi)) {
      roots.push(g);
    }
  }
  
  return roots;
}

/**
 * Check if g is a primitive root modulo n
 */
function isPrimitiveRoot(g: number, n: number, phi: number): boolean {
  if (gcdNumber(g, n) !== 1) return false;
  
  // Get prime factors of phi(n)
  const primeFactors = getPrimeFactors(phi);
  
  // Check if g^(phi/p) != 1 (mod n) for all prime factors p of phi(n)
  for (const p of primeFactors) {
    if (modPowNumber(g, Math.floor(phi / p), n) === 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get prime factors of n (without multiplicity)
 */
function getPrimeFactors(n: number): number[] {
  const factors: number[] = [];
  
  // Check for factor 2
  if (n % 2 === 0) {
    factors.push(2);
    while (n % 2 === 0) n = Math.floor(n / 2);
  }
  
  // Check odd factors
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) {
      factors.push(i);
      while (n % i === 0) n = Math.floor(n / i);
    }
  }
  
  // If n > 1, it's a prime factor
  if (n > 1) {
    factors.push(n);
  }
  
  return factors;
}

/**
 * Calculate Euler's totient function φ(n)
 * φ(n) counts the positive integers up to n that are coprime to n
 */
function calculateEulerTotient(n: number): number {
  let result = n;
  
  // Check for factor 2
  if (n % 2 === 0) {
    result -= Math.floor(result / 2);
    while (n % 2 === 0) n = Math.floor(n / 2);
  }
  
  // Check odd factors
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) {
      result -= Math.floor(result / i);
      while (n % i === 0) n = Math.floor(n / i);
    }
  }
  
  // If n > 1, it's a prime factor
  if (n > 1) {
    result -= Math.floor(result / n);
  }
  
  return result;
}
