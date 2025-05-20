/**
 * Basic Modular Arithmetic Operations
 * =================================
 * 
 * Implementation of basic modular arithmetic operations.
 */

import { ModFunction, ModMulFunction } from '../../types';
import { MODULAR_CONSTANTS } from '../../constants';
import { bitLength } from '../../../bigint';
import { memoizeModular } from '../../cache';
import { 
  createDivisionByZeroError, 
  createBitSizeError,
  createOverflowError
} from '../../errors';

/**
 * Options for basic modular operations
 */
export interface BasicModularOptions {
  /**
   * Whether to use Python-compatible modulo semantics for negative numbers
   * When true: mod(-5, 3) = 1 (like Python)
   * When false: mod(-5, 3) = -2 (standard JavaScript)
   */
  pythonCompatible?: boolean;
  
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
 * Default options for basic modular operations
 */
const DEFAULT_OPTIONS: BasicModularOptions = {
  pythonCompatible: true,
  useOptimized: true,
  nativeThreshold: MODULAR_CONSTANTS.MAX_NATIVE_BITS,
  strict: false,
  useCache: true,
  debug: false
};

/**
 * Python-compatible modulo operation
 * 
 * JavaScript:  -1 % 5 = -1
 * Python:      -1 % 5 = 4
 * 
 * This implementation follows Python's behavior for negative numbers.
 */
export function mod(
  a: bigint | number, 
  b: bigint | number,
  options: Partial<BasicModularOptions> = {}
): bigint {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`mod: ${a} % ${b}`).catch(() => {});
  }
  
  // Handle both bigint and number types
  if (typeof a === 'number' && typeof b === 'number') {
    // Fast path for regular numbers
    if (b === 0) {
      const error = createDivisionByZeroError('modulo operation');
      if (opts.debug && opts.logger) {
        opts.logger.error('Error in mod:', error).catch(() => {});
      }
      throw error;
    }
    
    // Handle negative modulus by taking absolute value
    const absB = Math.abs(b);
    
    // Always convert the result to bigint for consistency
    if (opts.pythonCompatible) {
      return BigInt(((a % absB) + absB) % absB);
    }
    return BigInt(a % absB);
  }
  
  // Convert to BigInt for consistent handling
  const aBig = BigInt(a);
  let bBig = BigInt(b);
  
  if (bBig === 0n) {
    const error = createDivisionByZeroError('modulo operation');
    if (opts.debug && opts.logger) {
      opts.logger.error('Error in mod:', error).catch(() => {});
    }
    throw error;
  }
  
  // Handle negative modulus by taking absolute value
  if (bBig < 0n) {
    bBig = -bBig;
  }
  
  // Check operation size in strict mode
  if (opts.strict) {
    const aBits = bitLength(aBig < 0n ? -aBig : aBig);
    const bBits = bitLength(bBig < 0n ? -bBig : bBig);
    
    if (Math.max(aBits, bBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
      const error = createBitSizeError(
        `mod(${aBits} bits, ${bBits} bits)`,
        MODULAR_CONSTANTS.MAX_SUPPORTED_BITS,
        Math.max(aBits, bBits)
      );
      if (opts.debug && opts.logger) {
        opts.logger.error('Error in mod (strict mode):', error).catch(() => {});
      }
      throw error;
    }
  }
  
  // Standard case
  let result: bigint;
  if (opts.pythonCompatible) {
    result = ((aBig % bBig) + bBig) % bBig;
  } else {
    result = aBig % bBig;
  }
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`mod result: ${result}`).catch(() => {});
  }
  
  return result;
}

/**
 * Modular multiplication with overflow protection
 * Calculates (a * b) % m without intermediate overflow
 */
export function modMul(
  a: bigint | number, 
  b: bigint | number, 
  m: bigint | number,
  options: Partial<BasicModularOptions> = {}
): bigint {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Debug logging
  if (opts.debug && opts.logger) {
    opts.logger.debug(`modMul: (${a} * ${b}) % ${m}`).catch(() => {});
  }
  
  // Convert to BigInt for consistent handling
  const aBig = BigInt(a);
  const bBig = BigInt(b);
  const mBig = BigInt(m);
  
  if (mBig === 0n) {
    const error = createDivisionByZeroError('modular multiplication');
    if (opts.debug && opts.logger) {
      opts.logger.error('Error in modMul:', error).catch(() => {});
    }
    throw error;
  }
  
  // Check operation size in strict mode
  if (opts.strict) {
    const aBits = bitLength(aBig < 0n ? -aBig : aBig);
    const bBits = bitLength(bBig < 0n ? -bBig : bBig);
    const mBits = bitLength(mBig < 0n ? -mBig : mBig);
    
    if (Math.max(aBits, bBits, mBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
      const error = createBitSizeError(
        `(${aBits} bits * ${bBits} bits) % ${mBits} bits`,
        MODULAR_CONSTANTS.MAX_SUPPORTED_BITS,
        Math.max(aBits, bBits, mBits)
      );
      if (opts.debug && opts.logger) {
        opts.logger.error('Error in modMul (strict mode):', error).catch(() => {});
      }
      throw error;
    }
  }
  
  // If the values are small enough, we can multiply directly
  if (opts.useOptimized && 
      bitLength(aBig) + bitLength(bBig) <= (opts.nativeThreshold || MODULAR_CONSTANTS.MAX_NATIVE_BITS)) {
    // Ensure Python-compatible modulo behavior for negative results
    let result = (aBig * bBig) % mBig;
    if (result < 0n) {
      result = (result + mBig) % mBig;
    }
    if (opts.debug && opts.logger) {
      opts.logger.debug(`Using optimized direct multiplication, result: ${result}`).catch(() => {});
    }
    return result;
  }
  
  // For large numbers, use the binary multiplication algorithm
  // This prevents overflow by reducing intermediate results
  let result = 0n;
  let x = aBig;
  let y = bBig;
  
  // Ensure a and b are positive within the modulus
  x = ((x % mBig) + mBig) % mBig;
  y = ((y % mBig) + mBig) % mBig;
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`Using Russian peasant algorithm with normalized values: (${x} * ${y}) % ${mBig}`).catch(() => {});
  }
  
  // Binary multiplication algorithm (Russian peasant algorithm)
  while (y > 0n) {
    if (y & 1n) {
      result = (result + x) % mBig;
    }
    x = (x << 1n) % mBig;
    y >>= 1n;
  }
  
  if (opts.debug && opts.logger) {
    opts.logger.debug(`modMul result: ${result}`).catch(() => {});
  }
  
  return result;
}

/**
 * Create memoized versions of the basic modular operations
 */
export function createMemoizedBasicOperations(
  options: Partial<BasicModularOptions> = {}
): { mod: ModFunction; modMul: ModMulFunction } {
  // Merge options with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create memoized functions if caching is enabled
  if (opts.useCache) {
    return {
      mod: memoizeModular(
        (a, b) => mod(a, b, opts),
        'mod',
        { enabled: true }
      ),
      modMul: memoizeModular(
        (a, b, m) => modMul(a, b, m, opts),
        'modMul',
        { enabled: true }
      )
    };
  }
  
  // Return non-memoized functions if caching is disabled
  return {
    mod: (a, b) => mod(a, b, opts),
    modMul: (a, b, m) => modMul(a, b, m, opts)
  };
}
