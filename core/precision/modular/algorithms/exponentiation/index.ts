/**
 * Modular Exponentiation Operations
 * ==============================
 * 
 * Implementation of modular exponentiation and modular inverse operations.
 */

import { ModPowFunction, ModInverseFunction } from '../../types';
import { MODULAR_CONSTANTS } from '../../constants';
import { bitLength } from '../../../bigint';
import { memoizeModular } from '../../cache';
import { 
  createDivisionByZeroError, 
  createBitSizeError,
  createNoInverseError
} from '../../errors';
import { mod, modMul } from '../basic';
import { extendedGcd } from '../gcd';

/**
 * Options for modular exponentiation operations
 */
export interface ExponentiationOptions {
  /**
   * Whether to use optimized algorithms where available
   */
  useOptimized?: boolean;
  
  /**
   * Maximum size (in bits) to use native operations before switching to specialized algorithms
   */
  nativeThreshold?: number;
  
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
 * Default options for modular exponentiation operations
 */
const DEFAULT_OPTIONS: ExponentiationOptions = {
  useOptimized: true,
  nativeThreshold: MODULAR_CONSTANTS.MAX_NATIVE_BITS,
  strict: false,
  useCache: true,
  debug: false
};

/**
 * Modular exponentiation (a^b mod m)
 * Uses the square-and-multiply algorithm for efficiency
 */
export function modPow(
  base: bigint | number, 
  exponent: bigint | number, 
  modulus: bigint | number,
  options: Partial<ExponentiationOptions> = {}
): bigint {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`modPow: ${base}^${exponent} mod ${modulus}`).catch(() => {});
  }
  
  // Convert to BigInt for consistent handling
  let baseBig = BigInt(base);
  let expBig = BigInt(exponent);
  const modBig = BigInt(modulus);
  
  if (modBig === BigInt(0)) {
    const error = createDivisionByZeroError('modular exponentiation');
    if (opts.debug && opts.logger) {
      opts.logger.error('Error in modPow:', error).catch(() => {});
    }
    throw error;
  }
  
  if (modBig === BigInt(1)) {
    if (opts.debug && opts.logger) {
      opts.logger.debug(`modPow result: 0 (modulus is 1)`).catch(() => {});
    }
    return BigInt(0);
  }
  
  // Check operation size in strict mode
  if (opts.strict) {
    const baseBits = bitLength(baseBig < BigInt(0) ? -baseBig : baseBig);
    const expBits = bitLength(expBig < BigInt(0) ? -expBig : expBig);
    const modBits = bitLength(modBig);
    
    if (Math.max(baseBits, modBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS || 
        expBits > MODULAR_CONSTANTS.MAX_EXPONENT_BITS) {
      const error = createBitSizeError(
        `base=${baseBits} bits, exponent=${expBits} bits, modulus=${modBits} bits`,
        MODULAR_CONSTANTS.MAX_SUPPORTED_BITS,
        Math.max(baseBits, modBits)
      );
      if (opts.debug && opts.logger) {
        opts.logger.error('Error in modPow (strict mode):', error).catch(() => {});
      }
      throw error;
    }
  }
  
  // Handle negative exponent using modular inverse
  if (expBig < BigInt(0)) {
    if (opts.debug && opts.logger) {
      opts.logger.debug(`Handling negative exponent ${expBig}, computing modular inverse of ${baseBig}`).catch(() => {});
    }
    
    // Calculate modular inverse of base
    baseBig = modInverse(baseBig, modBig, opts);
    expBig = -expBig;
    
    if (opts.debug && opts.logger) {
      opts.logger.debug(`Modular inverse computed: ${baseBig}`).catch(() => {});
    }
  }
  
  // Ensure base is positive within the modulus
  baseBig = mod(baseBig, modBig);
  
  // Quick checks
  if (baseBig === BigInt(0)) {
    if (opts.debug && opts.logger) {
      opts.logger.debug(`modPow result: 0 (base is 0)`).catch(() => {});
    }
    return BigInt(0);
  }
  
  if (expBig === BigInt(0)) {
    if (opts.debug && opts.logger) {
      opts.logger.debug(`modPow result: 1 (exponent is 0)`).catch(() => {});
    }
    return BigInt(1);
  }
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`Computing ${baseBig}^${expBig} mod ${modBig} using square-and-multiply algorithm`).catch(() => {});
  }
  
  // Fast modular exponentiation using square-and-multiply
  let result = BigInt(1);
  
  while (expBig > BigInt(0)) {
    if (expBig % BigInt(2) === BigInt(1)) {
      result = modMul(result, baseBig, modBig);
    }
    expBig >>= BigInt(1);
    baseBig = modMul(baseBig, baseBig, modBig);
  }
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`modPow result: ${result}`).catch(() => {});
  }
  
  return result;
}

/**
 * Modular multiplicative inverse (a^-1 mod m)
 * Uses the extended Euclidean algorithm
 */
export function modInverse(
  a: bigint | number, 
  m: bigint | number,
  options: Partial<ExponentiationOptions> = {}
): bigint {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`modInverse: ${a}^(-1) mod ${m}`).catch(() => {});
  }
  
  // Convert to BigInt for consistent handling
  const aBig = BigInt(a);
  const mBig = BigInt(m);
  
  // Check for zero
  if (aBig === BigInt(0) || mBig === BigInt(0)) {
    const error = createDivisionByZeroError('modular inverse');
    if (opts.debug && opts.logger) {
      opts.logger.error('Error in modInverse:', error).catch(() => {});
    }
    throw error;
  }
  
  // Check operation size in strict mode
  if (opts.strict) {
    const aBits = bitLength(aBig < BigInt(0) ? -aBig : aBig);
    const mBits = bitLength(mBig < BigInt(0) ? -mBig : mBig);
    
    if (Math.max(aBits, mBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
      const error = createBitSizeError(
        `modInverse(${aBits} bits, ${mBits} bits)`,
        MODULAR_CONSTANTS.MAX_SUPPORTED_BITS,
        Math.max(aBits, mBits)
      );
      if (opts.debug && opts.logger) {
        opts.logger.error('Error in modInverse (strict mode):', error).catch(() => {});
      }
      throw error;
    }
  }
  
  // Use extended GCD to calculate modular inverse
  const [g, x, _] = extendedGcd(aBig, mBig);
  
  // Check if inverse exists (gcd must be 1 for a to be invertible)
  if (g !== BigInt(1)) {
    if (opts.debug && opts.logger) {
      opts.logger.debug(`No modular inverse for ${aBig} mod ${mBig} (gcd = ${g})`).catch(() => {});
    }
    throw createNoInverseError(aBig, mBig, g);
  }
  
  // Calculate inverse and ensure it's positive
  const inverse = mod(x, mBig);
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`modInverse result: ${inverse}`).catch(() => {});
    opts.logger.debug(`Verification: ${aBig} * ${inverse} mod ${mBig} = ${mod(aBig * inverse, mBig)} (should be 1)`).catch(() => {});
  }
  
  return inverse;
}

/**
 * Modular exponentiation using the sliding window algorithm
 * More efficient for large exponents
 */
export function slidingWindowModPow(
  base: bigint | number, 
  exponent: bigint | number, 
  modulus: bigint | number,
  windowSize: number = 4,
  options: Partial<ExponentiationOptions> = {}
): bigint {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`slidingWindowModPow: ${base}^${exponent} mod ${modulus} (window size: ${windowSize})`).catch(() => {});
  }
  
  // Convert to BigInt for consistent handling
  let baseBig = BigInt(base);
  let expBig = BigInt(exponent);
  const modBig = BigInt(modulus);
  
  // Handle special cases
  if (modBig === BigInt(1)) return BigInt(0);
  if (expBig === BigInt(0)) return BigInt(1);
  if (baseBig === BigInt(0)) return BigInt(0);
  
  // Handle negative exponent
  if (expBig < BigInt(0)) {
    baseBig = modInverse(baseBig, modBig, opts);
    expBig = -expBig;
  }
  
  // Ensure base is positive within the modulus
  baseBig = mod(baseBig, modBig);
  
  // Precompute powers of base
  const precomputed = new Map<bigint, bigint>();
  precomputed.set(BigInt(1), baseBig);
  
  const baseSquared = modMul(baseBig, baseBig, modBig);
  for (let i = 1; i < (1 << (windowSize - 1)); i++) {
    const prev = precomputed.get(BigInt(2 * i - 1))!;
    precomputed.set(BigInt(2 * i + 1), modMul(prev, baseSquared, modBig));
  }
  
  // Convert exponent to binary
  const binaryExp = expBig.toString(2);
  
  // Sliding window algorithm
  let result = BigInt(1);
  let i = 0;
  
  while (i < binaryExp.length) {
    if (binaryExp[i] === '0') {
      // Square
      result = modMul(result, result, modBig);
      i++;
    } else {
      // Find the longest window of 1s (up to windowSize)
      let windowEnd = i;
      while (windowEnd < binaryExp.length && 
             windowEnd - i < windowSize && 
             binaryExp[windowEnd] === '1') {
        windowEnd++;
      }
      
      // Square for each bit in the window
      for (let j = 0; j < windowEnd - i; j++) {
        result = modMul(result, result, modBig);
      }
      
      // Multiply by the precomputed value
      const windowValue = BigInt(parseInt(binaryExp.substring(i, windowEnd), 2));
      result = modMul(result, precomputed.get(windowValue)!, modBig);
      
      i = windowEnd;
    }
  }
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`slidingWindowModPow result: ${result}`).catch(() => {});
  }
  
  return result;
}

/**
 * Create memoized versions of the modular exponentiation operations
 */
export function createMemoizedExponentiationOperations(
  options: Partial<ExponentiationOptions> = {}
): { 
  modPow: ModPowFunction; 
  modInverse: ModInverseFunction;
  slidingWindowModPow: (base: bigint | number, exponent: bigint | number, modulus: bigint | number, windowSize?: number) => bigint;
} {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create memoized functions if caching is enabled
  if (opts.useCache) {
    return {
      modPow: memoizeModular(
        (base, exponent, modulus) => modPow(base, exponent, modulus, opts),
        'modPow',
        { enabled: true }
      ),
      modInverse: memoizeModular(
        (a, m) => modInverse(a, m, opts),
        'modInverse',
        { enabled: true }
      ),
      slidingWindowModPow: memoizeModular(
        (base, exponent, modulus, windowSize = 4) => 
          slidingWindowModPow(base, exponent, modulus, windowSize, opts),
        'slidingWindowModPow',
        { enabled: true }
      )
    };
  }
  
  // Return non-memoized functions if caching is disabled
  return {
    modPow: (base, exponent, modulus) => modPow(base, exponent, modulus, opts),
    modInverse: (a, m) => modInverse(a, m, opts),
    slidingWindowModPow: (base, exponent, modulus, windowSize = 4) => 
      slidingWindowModPow(base, exponent, modulus, windowSize, opts)
  };
}
