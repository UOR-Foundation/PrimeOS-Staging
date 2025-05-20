/**
 * Modular Arithmetic Module
 * ========================
 * 
 * Implementation of Python-compatible modular arithmetic operations.
 * Implements the PrimeOS Model interface pattern for consistent lifecycle management.
 */

import { 
  ModularOptions,
  ModularOperations,
  ModularModelInterface,
  ModularState,
  ModularProcessInput,
  ModFunction,
  ModPowFunction,
  ModInverseFunction,
  ModMulFunction,
  MODULAR_CONSTANTS
} from './types';

import { PRECISION_CONSTANTS } from '../types';
import { bitLength as bigintBitLength } from '../bigint';
import { createCache, CacheModelInterface } from '../cache';
import {
  BaseModel,
  ModelResult,
  ModelLifecycleState
} from '../../../os/model';
import { createLogging } from '../../../os/logging';

/**
 * Default options for modular operations
 */
const DEFAULT_OPTIONS: ModularOptions = {
  pythonCompatible: true,
  useCache: true,
  useOptimized: true,
  nativeThreshold: MODULAR_CONSTANTS.MAX_NATIVE_BITS,
  strict: false,
  debug: false,
  name: 'precision-modular',
  version: '1.0.0'
};

/**
 * ModularImpl provides methods for modular arithmetic operations.
 * Extends BaseModel to implement the PrimeOS Model interface pattern.
 */
export class ModularImpl extends BaseModel implements ModularModelInterface {
  private config: ModularOptions;
  private inverseCache: CacheModelInterface<string, bigint>;
  private gcdCache: CacheModelInterface<string, bigint>;
  
  /**
   * Create a new modular arithmetic implementation
   */
  constructor(options: ModularOptions = {}) {
    // Initialize BaseModel with options
    super({ ...DEFAULT_OPTIONS, ...options });
    
    // Store modular-specific options
    this.config = { ...DEFAULT_OPTIONS, ...options };
    
    // Create caches
    this.inverseCache = createCache<string, bigint>({
      maxSize: MODULAR_CONSTANTS.DEFAULT_CACHE_SIZE,
      strategy: 'lru',
      name: 'modular-inverse-cache'
    });
    
    this.gcdCache = createCache<string, bigint>({
      maxSize: MODULAR_CONSTANTS.DEFAULT_CACHE_SIZE,
      strategy: 'lru',
      name: 'modular-gcd-cache'
    });
    
    if (this.config.debug) {
      // Will use logger after initialization
      console.log('Created ModularImpl with options:', this.config);
    }
  }
  
  /**
   * Initialize the module
   */
  protected async onInitialize(): Promise<void> {
    // Initialize caches
    await this.inverseCache.initialize();
    await this.gcdCache.initialize();
    
    // Add custom state tracking
    this.state.custom = {
      config: this.config,
      cache: {
        inverseSize: 0,
        inverseHits: 0,
        inverseMisses: 0,
        gcdSize: 0,
        gcdHits: 0,
        gcdMisses: 0
      }
    };
    
    await this.logger.debug('Modular arithmetic module initialized with configuration', this.config);
  }
  
  /**
   * Process operation request
   */
  protected async onProcess<T = ModularProcessInput, R = unknown>(input: T): Promise<R> {
    if (!input) {
      throw new Error('Input cannot be undefined or null');
    }
    
    await this.logger.debug('Processing input', input);
    
    // Process based on input type
    if (typeof input === 'object' && input !== null && 'operation' in input && 'params' in input) {
      const request = input as unknown as ModularProcessInput;
      
      switch (request.operation) {
        case 'mod':
          return this.mod(
            request.params[0],
            request.params[1]
          ) as unknown as R;
          
        case 'modPow':
          return this.modPow(
            request.params[0],
            request.params[1],
            request.params[2]
          ) as unknown as R;
          
        case 'modInverse':
          return this.modInverse(
            request.params[0],
            request.params[1]
          ) as unknown as R;
          
        case 'modMul':
          return this.modMul(
            request.params[0],
            request.params[1],
            request.params[2]
          ) as unknown as R;
          
        case 'gcd':
          return this.gcd(
            request.params[0],
            request.params[1]
          ) as unknown as R;
          
        case 'lcm':
          return this.lcm(
            request.params[0],
            request.params[1]
          ) as unknown as R;
          
        case 'extendedGcd':
          return this.extendedGcd(
            request.params[0],
            request.params[1]
          ) as unknown as R;
          
        case 'clearCache':
          this.clearCache();
          return undefined as unknown as R;
          
        default:
          throw new Error(`Unknown operation: ${(request as any).operation}`);
      }
    } else {
      // For direct function calls without the operation wrapper
      return input as unknown as R;
    }
  }
  
  /**
   * Reset the module state
   */
  protected async onReset(): Promise<void> {
    // Clear caches
    await this.inverseCache.reset();
    await this.gcdCache.reset();
    
    // Update state
    this.state.custom = {
      config: this.config,
      cache: {
        inverseSize: 0,
        inverseHits: 0,
        inverseMisses: 0,
        gcdSize: 0,
        gcdHits: 0,
        gcdMisses: 0
      }
    };
    
    await this.logger.debug('Modular arithmetic module reset');
  }
  
  /**
   * Clean up resources when module is terminated
   */
  protected async onTerminate(): Promise<void> {
    // Terminate caches
    await this.inverseCache.terminate();
    await this.gcdCache.terminate();
    
    await this.logger.debug('Modular arithmetic module terminated');
  }
  
  /**
   * Get the module state including cache statistics
   */
  getState(): ModularState {
    const baseState = super.getState();
    
    // Get cache metrics
    const inverseMetrics = this.inverseCache.getState().metrics;
    const gcdMetrics = this.gcdCache.getState().metrics;
    
    return {
      ...baseState,
      config: this.config,
      cache: {
        inverseSize: inverseMetrics?.currentSize || 0,
        inverseHits: inverseMetrics?.hitCount || 0,
        inverseMisses: inverseMetrics?.missCount || 0,
        gcdSize: gcdMetrics?.currentSize || 0,
        gcdHits: gcdMetrics?.hitCount || 0,
        gcdMisses: gcdMetrics?.missCount || 0
      }
    } as ModularState;
  }
  
  /**
   * Python-compatible modulo operation
   * 
   * JavaScript:  -1 % 5 = -1
   * Python:      -1 % 5 = 4
   * 
   * This implementation follows Python's behavior for negative numbers.
   */
  mod: ModFunction = (a, b) => {
    if (this.config.debug) {
      this.logger.debug(`mod: ${a} % ${b}`).catch(() => {});
    }
    
    // Handle both bigint and number types
    if (typeof a === 'number' && typeof b === 'number') {
      // Fast path for regular numbers
      if (b === 0) {
        const error = new Error('Division by zero in modulo operation');
        if (this.config.debug) {
          this.logger.error('Error in mod:', error).catch(() => {});
        }
        throw error;
      }
      
      // Handle negative modulus by taking absolute value
      const absB = Math.abs(b);
      
      if (this.config.pythonCompatible) {
        return ((a % absB) + absB) % absB;
      }
      return a % absB;
    }
    
    // Convert to BigInt for consistent handling
    const aBig = BigInt(a);
    let bBig = BigInt(b);
    
    if (bBig === 0n) {
      const error = new Error('Division by zero in modulo operation');
      if (this.config.debug) {
        this.logger.error('Error in mod:', error).catch(() => {});
      }
      throw error;
    }
    
    // Handle negative modulus by taking absolute value
    if (bBig < 0n) {
      bBig = -bBig;
    }
    
    // Check operation size in strict mode
    if (this.config.strict) {
      const aBits = bigintBitLength(aBig < 0n ? -aBig : aBig);
      const bBits = bigintBitLength(bBig < 0n ? -bBig : bBig);
      
      if (Math.max(aBits, bBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
        const error = new Error(
          `Operation exceeds maximum supported bit size (${MODULAR_CONSTANTS.MAX_SUPPORTED_BITS}): ` +
          `mod(${aBits} bits, ${bBits} bits)`
        );
        if (this.config.debug) {
          this.logger.error('Error in mod (strict mode):', error).catch(() => {});
        }
        throw error;
      }
    }
    
    // Standard case
    let result: bigint;
    if (this.config.pythonCompatible) {
      result = ((aBig % bBig) + bBig) % bBig;
    } else {
      result = aBig % bBig;
    }
    
    if (this.config.debug) {
      this.logger.debug(`mod result: ${result}`).catch(() => {});
    }
    
    return result;
  };
  
  /**
   * Modular multiplication with overflow protection
   * Calculates (a * b) % m without intermediate overflow
   */
  modMul: ModMulFunction = (a, b, m) => {
    if (this.config.debug) {
      this.logger.debug(`modMul: (${a} * ${b}) % ${m}`).catch(() => {});
    }
    
    // Convert to BigInt for consistent handling
    const aBig = BigInt(a);
    const bBig = BigInt(b);
    const mBig = BigInt(m);
    
    if (mBig === 0n) {
      const error = new Error('Division by zero in modular multiplication');
      if (this.config.debug) {
        this.logger.error('Error in modMul:', error).catch(() => {});
      }
      throw error;
    }
    
    // Check operation size in strict mode
    if (this.config.strict) {
      const aBits = bigintBitLength(aBig < 0n ? -aBig : aBig);
      const bBits = bigintBitLength(bBig < 0n ? -bBig : bBig);
      const mBits = bigintBitLength(mBig < 0n ? -mBig : mBig);
      
      if (Math.max(aBits, bBits, mBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
        const error = new Error(
          `Operation exceeds maximum supported bit size (${MODULAR_CONSTANTS.MAX_SUPPORTED_BITS}): ` +
          `(${aBits} bits * ${bBits} bits) % ${mBits} bits`
        );
        if (this.config.debug) {
          this.logger.error('Error in modMul (strict mode):', error).catch(() => {});
        }
        throw error;
      }
    }
    
    // If the values are small enough, we can multiply directly
    if (this.config.useOptimized && 
        bigintBitLength(aBig) + bigintBitLength(bBig) <= MODULAR_CONSTANTS.MAX_NATIVE_BITS) {
      // Ensure Python-compatible modulo behavior for negative results
      let result = (aBig * bBig) % mBig;
      if (result < 0n) {
        result = (result + mBig) % mBig;
      }
      if (this.config.debug) {
        this.logger.debug(`Using optimized direct multiplication, result: ${result}`).catch(() => {});
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
    
    if (this.config.debug) {
      this.logger.debug(`Using Russian peasant algorithm with normalized values: (${x} * ${y}) % ${mBig}`).catch(() => {});
    }
    
    // Binary multiplication algorithm (Russian peasant algorithm)
    while (y > 0n) {
      if (y & 1n) {
        result = (result + x) % mBig;
      }
      x = (x << 1n) % mBig;
      y >>= 1n;
    }
    
    if (this.config.debug) {
      this.logger.debug(`modMul result: ${result}`).catch(() => {});
    }
    
    return result;
  };
  
  /**
   * Clear all caches used for memoization
   */
  clearCache(): void {
    if (this.config.debug) {
      this.logger.debug('Clearing modular arithmetic caches').catch(() => {});
    }
    
    this.inverseCache.clear();
    this.gcdCache.clear();
    
    if (this.config.debug) {
      this.logger.debug('Caches cleared').catch(() => {});
    }
  }
  
  /**
   * Greatest common divisor of two numbers
   * Uses the Euclidean algorithm
   */
  gcd = (a: bigint, b: bigint): bigint => {
    if (this.config.debug) {
      this.logger.debug(`gcd(${a}, ${b})`).catch(() => {});
    }
    
    // Handle negative inputs
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    
    // Check operation size in strict mode
    if (this.config.strict) {
      const aBits = bigintBitLength(a);
      const bBits = bigintBitLength(b);
      
      if (Math.max(aBits, bBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
        const error = new Error(
          `Operation exceeds maximum supported bit size (${MODULAR_CONSTANTS.MAX_SUPPORTED_BITS}): ` +
          `gcd(${aBits} bits, ${bBits} bits)`
        );
        if (this.config.debug) {
          this.logger.error('Error in gcd (strict mode):', error).catch(() => {});
        }
        throw error;
      }
    }
    
    // Base case
    if (b === 0n) {
      if (this.config.debug) {
        this.logger.debug(`gcd result: ${a} (base case)`).catch(() => {});
      }
      return a;
    }
    
    // Check cache if enabled
    if (this.config.useCache) {
      // Ensure consistent order for cache key
      const key = a >= b 
        ? `${a.toString()},${b.toString()}` 
        : `${b.toString()},${a.toString()}`;
      
      if (this.gcdCache.has(key)) {
        const cachedResult = this.gcdCache.get(key)!;
        if (this.config.debug) {
          this.logger.debug(`gcd cache hit for key ${key}, result: ${cachedResult}`).catch(() => {});
        }
        return cachedResult;
      }
      
      // Calculate and cache the result
      const result = this.gcd(b, a % b);
      
      this.gcdCache.set(key, result);
      if (this.config.debug) {
        this.logger.debug(`Cached gcd result for key ${key}: ${result}`).catch(() => {});
      }
      
      return result;
    }
    
    // Recursive case without caching
    if (this.config.debug) {
      this.logger.debug(`Computing gcd(${b}, ${a % b}) without caching`).catch(() => {});
    }
    return this.gcd(b, a % b);
  };
  
  /**
   * Least common multiple of two numbers
   */
  lcm = (a: bigint, b: bigint): bigint => {
    if (this.config.debug) {
      this.logger.debug(`lcm(${a}, ${b})`).catch(() => {});
    }
    
    if (a === 0n || b === 0n) {
      if (this.config.debug) {
        this.logger.debug(`lcm result: 0 (special case with zero input)`).catch(() => {});
      }
      return 0n;
    }
    
    // Check operation size in strict mode
    if (this.config.strict) {
      const aBits = bigintBitLength(a < 0n ? -a : a);
      const bBits = bigintBitLength(b < 0n ? -b : b);
      
      if (Math.max(aBits, bBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
        const error = new Error(
          `Operation exceeds maximum supported bit size (${MODULAR_CONSTANTS.MAX_SUPPORTED_BITS}): ` +
          `lcm(${aBits} bits, ${bBits} bits)`
        );
        if (this.config.debug) {
          this.logger.error('Error in lcm (strict mode):', error).catch(() => {});
        }
        throw error;
      }
    }
    
    // Use the formula: lcm(a,b) = |a*b| / gcd(a,b)
    const gcdValue = this.gcd(a, b);
    const result = (a / gcdValue) * b; // a and b are factored to avoid overflow
    
    if (this.config.debug) {
      this.logger.debug(`lcm result: ${result} (gcd=${gcdValue})`).catch(() => {});
    }
    
    return result;
  };
  
  /**
   * Extended Euclidean algorithm to find Bézout coefficients
   * Returns [gcd, x, y] such that ax + by = gcd(a, b)
   */
  extendedGcd = (a: bigint, b: bigint): [bigint, bigint, bigint] => {
    if (this.config.debug) {
      this.logger.debug(`extendedGcd(${a}, ${b})`).catch(() => {});
    }
    
    // Check operation size in strict mode
    if (this.config.strict) {
      const aBits = bigintBitLength(a < 0n ? -a : a);
      const bBits = bigintBitLength(b < 0n ? -b : b);
      
      if (Math.max(aBits, bBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
        const error = new Error(
          `Operation exceeds maximum supported bit size (${MODULAR_CONSTANTS.MAX_SUPPORTED_BITS}): ` +
          `extendedGcd(${aBits} bits, ${bBits} bits)`
        );
        if (this.config.debug) {
          this.logger.error('Error in extendedGcd (strict mode):', error).catch(() => {});
        }
        throw error;
      }
    }
    
    if (b === 0n) {
      if (this.config.debug) {
        this.logger.debug(`extendedGcd base case: [${a}, 1, 0]`).catch(() => {});
      }
      return [a, 1n, 0n];
    }
    
    // Recursive case
    const [g, x1, y1] = this.extendedGcd(b, a % b);
    const x = y1;
    const y = x1 - (a / b) * y1;
    
    if (this.config.debug) {
      this.logger.debug(`extendedGcd result: [${g}, ${x}, ${y}]`).catch(() => {});
      this.logger.debug(`Verification: ${a} * ${x} + ${b} * ${y} = ${a * x + b * y} (should equal ${g})`).catch(() => {});
    }
    
    return [g, x, y];
  };
  
  /**
   * Modular exponentiation (a^b mod m)
   * Uses the square-and-multiply algorithm for efficiency
   */
  modPow: ModPowFunction = (base, exponent, modulus) => {
    if (this.config.debug) {
      this.logger.debug(`modPow: ${base}^${exponent} mod ${modulus}`).catch(() => {});
    }
    
    // Convert to BigInt for consistent handling
    let baseBig = BigInt(base);
    let expBig = BigInt(exponent);
    const modBig = BigInt(modulus);
    
    if (modBig === 0n) {
      const error = new Error('Division by zero in modular exponentiation');
      if (this.config.debug) {
        this.logger.error('Error in modPow:', error).catch(() => {});
      }
      throw error;
    }
    
    if (modBig === 1n) {
      if (this.config.debug) {
        this.logger.debug(`modPow result: 0 (modulus is 1)`).catch(() => {});
      }
      return 0n;
    }
    
    // Check operation size in strict mode
    if (this.config.strict) {
      const baseBits = bigintBitLength(baseBig < 0n ? -baseBig : baseBig);
      const expBits = bigintBitLength(expBig < 0n ? -expBig : expBig);
      const modBits = bigintBitLength(modBig);
      
      if (Math.max(baseBits, modBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS || 
          expBits > 10000) { // Exponent has a separate limit as it affects algorithm complexity
        const error = new Error(
          `Operation exceeds maximum supported bit size: ` +
          `base=${baseBits} bits, exponent=${expBits} bits, modulus=${modBits} bits`
        );
        if (this.config.debug) {
          this.logger.error('Error in modPow (strict mode):', error).catch(() => {});
        }
        throw error;
      }
    }
    
    // Handle negative exponent using modular inverse
    if (expBig < 0n) {
      if (this.config.debug) {
        this.logger.debug(`Handling negative exponent ${expBig}, computing modular inverse of ${baseBig}`).catch(() => {});
      }
      
      // Calculate modular inverse of base
      baseBig = this.modInverse(baseBig, modBig) as bigint;
      expBig = -expBig;
      
      if (this.config.debug) {
        this.logger.debug(`Modular inverse computed: ${baseBig}`).catch(() => {});
      }
    }
    
    // Ensure base is positive within the modulus
    baseBig = ((baseBig % modBig) + modBig) % modBig;
    
    // Quick checks
    if (baseBig === 0n) {
      if (this.config.debug) {
        this.logger.debug(`modPow result: 0 (base is 0)`).catch(() => {});
      }
      return 0n;
    }
    
    if (expBig === 0n) {
      if (this.config.debug) {
        this.logger.debug(`modPow result: 1 (exponent is 0)`).catch(() => {});
      }
      return 1n;
    }
    
    if (this.config.debug) {
      this.logger.debug(`Computing ${baseBig}^${expBig} mod ${modBig} using square-and-multiply algorithm`).catch(() => {});
    }
    
    // Fast modular exponentiation using square-and-multiply
    let result = 1n;
    
    while (expBig > 0n) {
      if (expBig % 2n === 1n) {
        result = this.modMul(result, baseBig, modBig);
      }
      expBig >>= 1n;
      baseBig = this.modMul(baseBig, baseBig, modBig);
    }
    
    if (this.config.debug) {
      this.logger.debug(`modPow result: ${result}`).catch(() => {});
    }
    
    return result;
  };
  
  /**
   * Modular multiplicative inverse (a^-1 mod m)
   * Uses the extended Euclidean algorithm
   */
  modInverse: ModInverseFunction = (a, m) => {
    if (this.config.debug) {
      this.logger.debug(`modInverse: ${a}^(-1) mod ${m}`).catch(() => {});
    }
    
    // Convert to BigInt for consistent handling
    const aBig = BigInt(a);
    const mBig = BigInt(m);
    
    // Check for zero
    if (aBig === 0n || mBig === 0n) {
      const error = new Error('Modular inverse requires non-zero inputs');
      if (this.config.debug) {
        this.logger.error('Error in modInverse:', error).catch(() => {});
      }
      throw error;
    }
    
    // Check operation size in strict mode
    if (this.config.strict) {
      const aBits = bigintBitLength(aBig < 0n ? -aBig : aBig);
      const mBits = bigintBitLength(mBig < 0n ? -mBig : mBig);
      
      if (Math.max(aBits, mBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
        const error = new Error(
          `Operation exceeds maximum supported bit size (${MODULAR_CONSTANTS.MAX_SUPPORTED_BITS}): ` +
          `modInverse(${aBits} bits, ${mBits} bits)`
        );
        if (this.config.debug) {
          this.logger.error('Error in modInverse (strict mode):', error).catch(() => {});
        }
        throw error;
      }
    }
    
    // Check cache if enabled
    if (this.config.useCache) {
      const key = `${aBig.toString()},${mBig.toString()}`;
      
      if (this.inverseCache.has(key)) {
        if (this.config.debug) {
          this.logger.debug(`Cache hit for modInverse(${aBig}, ${mBig})`).catch(() => {});
        }
        return this.inverseCache.get(key)!;
      }
    }
    
    // Use extended GCD to calculate modular inverse
    const [g, x, _] = this.extendedGcd(aBig, mBig);
    
    // Check if inverse exists (gcd must be 1 for a to be invertible)
    if (g !== 1n) {
      if (this.config.debug) {
        this.logger.debug(`No modular inverse for ${aBig} mod ${mBig} (gcd = ${g})`).catch(() => {});
      }
      throw new Error(`Modular inverse does not exist (gcd = ${g})`);
    }
    
    // Calculate inverse and ensure it's positive
    const inverse = (x % mBig + mBig) % mBig;
    
    // Cache the result if enabled
    if (this.config.useCache) {
      const key = `${aBig.toString()},${mBig.toString()}`;
      this.inverseCache.set(key, inverse);
    }
    
    return inverse;
  };
}

/**
 * Create a modular arithmetic operations instance with the specified options
 */
export function createModularOperations(options: ModularOptions = {}): ModularModelInterface {
  return new ModularImpl(options);
}

/**
 * Create and initialize a modular operations module in a single step
 */
export async function createAndInitializeModularOperations(
  options: ModularOptions = {}
): Promise<ModularModelInterface> {
  const instance = createModularOperations(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize modular operations: ${result.error}`);
  }
  
  return instance;
}

// Create default instance with standard options
const defaultOperations = createModularOperations();

// Export individual functions from the default instance
export const {
  mod,
  modPow,
  modInverse,
  extendedGcd,
  gcd,
  lcm,
  modMul
} = defaultOperations;

// Export clearCache as a standalone function to avoid 'this' binding issues
export function clearCache(): void {
  defaultOperations.clearCache();
}

// Export types and interfaces
export type { ModularOperations, ModularModelInterface, ModFunction, ModPowFunction, ModInverseFunction, ModMulFunction };

// Export constants
export { MODULAR_CONSTANTS };
