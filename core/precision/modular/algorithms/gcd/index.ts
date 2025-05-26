/**
 * GCD and LCM Operations
 * ====================
 * 
 * Implementation of greatest common divisor (GCD) and least common multiple (LCM)
 * operations with overflow protection.
 */

import { MODULAR_CONSTANTS } from '../../constants';
import { bitLength } from '../../../bigint';
import { memoizeModular } from '../../cache';
import { 
  createBitSizeError,
  createOverflowError
} from '../../errors';

/**
 * Options for GCD and LCM operations
 */
export interface GcdLcmOptions {
  /**
   * Whether to use optimized algorithms where available
   */
  useOptimized?: boolean;
  
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
 * Default options for GCD and LCM operations
 */
const DEFAULT_OPTIONS: GcdLcmOptions = {
  useOptimized: true,
  strict: false,
  useCache: true,
  debug: false
};

/**
 * Greatest common divisor of two numbers
 * Uses the Euclidean algorithm
 */
export function gcd(
  a: bigint, 
  b: bigint,
  options: Partial<GcdLcmOptions> = {}
): bigint {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`gcd(${a}, ${b})`).catch(() => {});
  }
  
  // Handle negative inputs
  a = a < BigInt(0) ? -a : a;
  b = b < BigInt(0) ? -b : b;
  
  // Check operation size in strict mode
  if (opts.strict) {
    const aBits = bitLength(a);
    const bBits = bitLength(b);
    
    if (Math.max(aBits, bBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
      const error = createBitSizeError(
        `gcd(${aBits} bits, ${bBits} bits)`,
        MODULAR_CONSTANTS.MAX_SUPPORTED_BITS,
        Math.max(aBits, bBits)
      );
      if (opts.debug && opts.logger) {
        opts.logger.error('Error in gcd (strict mode):', error).catch(() => {});
      }
      throw error;
    }
  }
  
  // Base case
  if (b === BigInt(0)) {
    if (opts.debug && opts.logger) {
      opts.logger.debug(`gcd result: ${a} (base case)`).catch(() => {});
    }
    return a;
  }
  
  // Recursive case
  if (opts.debug && opts.logger) {
    opts.logger.debug(`Computing gcd(${b}, ${a % b})`).catch(() => {});
  }
  return gcd(b, a % b, opts);
}

/**
 * Extended Euclidean algorithm to find Bézout coefficients
 * Returns [gcd, x, y] such that ax + by = gcd(a, b)
 */
export function extendedGcd(
  a: bigint, 
  b: bigint,
  options: Partial<GcdLcmOptions> = {}
): [bigint, bigint, bigint] {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`extendedGcd(${a}, ${b})`).catch(() => {});
  }
  
  // Check operation size in strict mode
  if (opts.strict) {
    const aBits = bitLength(a < BigInt(0) ? -a : a);
    const bBits = bitLength(b < BigInt(0) ? -b : b);
    
    if (Math.max(aBits, bBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
      const error = createBitSizeError(
        `extendedGcd(${aBits} bits, ${bBits} bits)`,
        MODULAR_CONSTANTS.MAX_SUPPORTED_BITS,
        Math.max(aBits, bBits)
      );
      if (opts.debug && opts.logger) {
        opts.logger.error('Error in extendedGcd (strict mode):', error).catch(() => {});
      }
      throw error;
    }
  }
  
  if (b === BigInt(0)) {
    if (opts.debug && opts.logger) {
      opts.logger.debug(`extendedGcd base case: [${a}, 1, 0]`).catch(() => {});
    }
    return [a, BigInt(1), BigInt(0)];
  }
  
  // Recursive case
  const [g, x1, y1] = extendedGcd(b, a % b, opts);
  const x = y1;
  const y = x1 - (a / b) * y1;
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`extendedGcd result: [${g}, ${x}, ${y}]`).catch(() => {});
    opts.logger.debug(`Verification: ${a} * ${x} + ${b} * ${y} = ${a * x + b * y} (should equal ${g})`).catch(() => {});
  }
  
  return [g, x, y];
}

/**
 * Least common multiple of two numbers with overflow protection
 * Uses the formula: lcm(a,b) = |a*b| / gcd(a,b)
 * 
 * This implementation avoids overflow by factoring out the GCD before multiplication
 */
export function lcm(
  a: bigint, 
  b: bigint,
  options: Partial<GcdLcmOptions> = {}
): bigint {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`lcm(${a}, ${b})`).catch(() => {});
  }
  
  if (a === BigInt(0) || b === BigInt(0)) {
    if (opts.debug && opts.logger) {
      opts.logger.debug(`lcm result: 0 (special case with zero input)`).catch(() => {});
    }
    return BigInt(0);
  }
  
  // Take absolute values
  a = a < BigInt(0) ? -a : a;
  b = b < BigInt(0) ? -b : b;
  
  // Check operation size in strict mode
  if (opts.strict) {
    const aBits = bitLength(a);
    const bBits = bitLength(b);
    
    if (Math.max(aBits, bBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
      const error = createBitSizeError(
        `lcm(${aBits} bits, ${bBits} bits)`,
        MODULAR_CONSTANTS.MAX_SUPPORTED_BITS,
        Math.max(aBits, bBits)
      );
      if (opts.debug && opts.logger) {
        opts.logger.error('Error in lcm (strict mode):', error).catch(() => {});
      }
      throw error;
    }
    
    // Check for potential overflow
    if (aBits + bBits > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
      const error = createOverflowError(
        `lcm(${a}, ${b})`,
        'Use the optimized implementation to avoid overflow'
      );
      if (opts.debug && opts.logger) {
        opts.logger.error('Error in lcm (overflow check):', error).catch(() => {});
      }
      throw error;
    }
  }
  
  // Calculate GCD
  const gcdValue = gcd(a, b, opts);
  
  // Enhanced overflow protection:
  // 1. Divide a by gcd first to reduce the size
  // 2. Then multiply by b
  // This avoids intermediate overflow
  const result = (a / gcdValue) * b;
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`lcm result: ${result} (gcd=${gcdValue})`).catch(() => {});
  }
  
  return result;
}

/**
 * Binary GCD algorithm (Stein's algorithm)
 * More efficient for large numbers
 */
export function binaryGcd(
  a: bigint, 
  b: bigint,
  options: Partial<GcdLcmOptions> = {}
): bigint {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`binaryGcd(${a}, ${b})`).catch(() => {});
  }
  
  // Handle negative inputs
  a = a < BigInt(0) ? -a : a;
  b = b < BigInt(0) ? -b : b;
  
  // Base cases
  if (a === BigInt(0)) return b;
  if (b === BigInt(0)) return a;
  if (a === b) return a;
  if (a === BigInt(1) || b === BigInt(1)) return BigInt(1);
  
  // Check if both a and b are even
  if ((a & BigInt(1)) === BigInt(0) && (b & BigInt(1)) === BigInt(0)) {
    return binaryGcd(a >> BigInt(1), b >> BigInt(1), opts) << BigInt(1);
  }
  
  // Check if a is even and b is odd
  if ((a & BigInt(1)) === BigInt(0)) {
    return binaryGcd(a >> BigInt(1), b, opts);
  }
  
  // Check if a is odd and b is even
  if ((b & BigInt(1)) === BigInt(0)) {
    return binaryGcd(a, b >> BigInt(1), opts);
  }
  
  // Both a and b are odd
  // Subtract the smaller from the larger
  if (a > b) {
    return binaryGcd((a - b) >> BigInt(1), b, opts);
  }
  
  return binaryGcd((b - a) >> BigInt(1), a, opts);
}

/**
 * Create memoized versions of the GCD and LCM operations
 */
export function createMemoizedGcdLcmOperations(
  options: Partial<GcdLcmOptions> = {}
): { 
  gcd: (a: bigint, b: bigint) => bigint; 
  lcm: (a: bigint, b: bigint) => bigint;
  extendedGcd: (a: bigint, b: bigint) => [bigint, bigint, bigint];
  binaryGcd: (a: bigint, b: bigint) => bigint;
} {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create memoized functions if caching is enabled
  if (opts.useCache) {
    return {
      gcd: memoizeModular(
        (a, b) => gcd(a, b, opts),
        'gcd',
        { enabled: true }
      ),
      lcm: memoizeModular(
        (a, b) => lcm(a, b, opts),
        'lcm',
        { enabled: true }
      ),
      extendedGcd: memoizeModular(
        (a, b) => extendedGcd(a, b, opts),
        'extendedGcd',
        { enabled: true }
      ),
      binaryGcd: memoizeModular(
        (a, b) => binaryGcd(a, b, opts),
        'binaryGcd',
        { enabled: true }
      )
    };
  }
  
  // Return non-memoized functions if caching is disabled
  return {
    gcd: (a, b) => gcd(a, b, opts),
    lcm: (a, b) => lcm(a, b, opts),
    extendedGcd: (a, b) => extendedGcd(a, b, opts),
    binaryGcd: (a, b) => binaryGcd(a, b, opts)
  };
}
