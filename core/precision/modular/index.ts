/**
 * Modular Arithmetic Module
 * ========================
 * 
 * Implementation of Python-compatible modular arithmetic operations.
 */

import {
  ModularOptions,
  ModularOperations,
  ModFunction,
  ModPowFunction,
  ModInverseFunction,
  MODULAR_CONSTANTS,
  ModularInterface,
  ModularProcessInput,
  ModularState
} from './types';

import { PRECISION_CONSTANTS } from '../types';
import { bitLength as bigintBitLength } from '../bigint';
import { BaseModel } from '../../../os/model';
import { createLogging } from '../../../os/logging';

/**
 * Create modular arithmetic operations with the specified options
 */
function createModularOperations(options: ModularOptions = {}): ModularOperations {
  // Process options with defaults
  const config = {
    pythonCompatible: options.pythonCompatible ?? true,
    useCache: options.useCache ?? true,
    useOptimized: options.useOptimized ?? true,
    nativeThreshold: options.nativeThreshold ?? MODULAR_CONSTANTS.MAX_NATIVE_BITS,
    strict: options.strict ?? false,
    debug: options.debug ?? false
  };
  
  if (config.debug) {
    console.log('Creating ModularOperations with configuration:', config);
  }
  
  // Cache for expensive operations
  const inverseCache = new Map<string, bigint>();
  const gcdCache = new Map<string, bigint>();
  
  /**
   * Python-compatible modulo operation
   * 
   * JavaScript:  -1 % 5 = -1
   * Python:      -1 % 5 = 4
   * 
   * This implementation follows Python's behavior for negative numbers.
   */
  const mod: ModFunction = (a, b) => {
    if (config.debug) {
      console.log(`mod: ${a} % ${b}`);
    }
    
    // Handle both bigint and number types
    if (typeof a === 'number' && typeof b === 'number') {
      // Fast path for regular numbers
      if (b === 0) {
        const error = new Error('Division by zero in modulo operation');
        if (config.debug) {
          console.error('Error in mod:', error);
        }
        throw error;
      }
      
      if (config.pythonCompatible) {
        return ((a % b) + b) % b;
      }
      return a % b;
    }
    
    // Convert to BigInt for consistent handling
    const aBig = BigInt(a);
    const bBig = BigInt(b);
    
    if (bBig === 0n) {
      const error = new Error('Division by zero in modulo operation');
      if (config.debug) {
        console.error('Error in mod:', error);
      }
      throw error;
    }
    
    // Check operation size in strict mode
    if (config.strict) {
      const aBits = bigintBitLength(aBig < 0n ? -aBig : aBig);
      const bBits = bigintBitLength(bBig < 0n ? -bBig : bBig);
      
      if (Math.max(aBits, bBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
        const error = new Error(
          `Operation exceeds maximum supported bit size (${MODULAR_CONSTANTS.MAX_SUPPORTED_BITS}): ` +
          `mod(${aBits} bits, ${bBits} bits)`
        );
        if (config.debug) {
          console.error('Error in mod (strict mode):', error);
        }
        throw error;
      }
    }
    
    // Standard case
    let result: bigint;
    if (config.pythonCompatible) {
      result = ((aBig % bBig) + bBig) % bBig;
    } else {
      result = aBig % bBig;
    }
    
    if (config.debug) {
      console.log(`mod result: ${result}`);
    }
    
    return result;
  };
  
  /**
   * Modular multiplication with overflow protection
   * Calculates (a * b) % m without intermediate overflow
   */
  const modMul = (a: bigint | number, b: bigint | number, m: bigint | number): bigint => {
    if (config.debug) {
      console.log(`modMul: (${a} * ${b}) % ${m}`);
    }
    
    // Convert to BigInt for consistent handling
    const aBig = BigInt(a);
    const bBig = BigInt(b);
    const mBig = BigInt(m);
    
    if (mBig === 0n) {
      const error = new Error('Division by zero in modular multiplication');
      if (config.debug) {
        console.error('Error in modMul:', error);
      }
      throw error;
    }
    
    // Check operation size in strict mode
    if (config.strict) {
      const aBits = bigintBitLength(aBig < 0n ? -aBig : aBig);
      const bBits = bigintBitLength(bBig < 0n ? -bBig : bBig);
      const mBits = bigintBitLength(mBig < 0n ? -mBig : mBig);
      
      if (Math.max(aBits, bBits, mBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
        const error = new Error(
          `Operation exceeds maximum supported bit size (${MODULAR_CONSTANTS.MAX_SUPPORTED_BITS}): ` +
          `(${aBits} bits * ${bBits} bits) % ${mBits} bits`
        );
        if (config.debug) {
          console.error('Error in modMul (strict mode):', error);
        }
        throw error;
      }
    }
    
    // If the values are small enough, we can multiply directly
    if (config.useOptimized && 
        bigintBitLength(aBig) + bigintBitLength(bBig) <= MODULAR_CONSTANTS.MAX_NATIVE_BITS) {
      const result = (aBig * bBig) % mBig;
      if (config.debug) {
        console.log(`Using optimized direct multiplication, result: ${result}`);
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
    
    if (config.debug) {
      console.log(`Using Russian peasant algorithm with normalized values: (${x} * ${y}) % ${mBig}`);
    }
    
    // Binary multiplication algorithm (Russian peasant algorithm)
    while (y > 0n) {
      if (y & 1n) {
        result = (result + x) % mBig;
      }
      x = (x << 1n) % mBig;
      y >>= 1n;
    }
    
    if (config.debug) {
      console.log(`modMul result: ${result}`);
    }
    
    return result;
  };
  
  /**
   * Clear all caches used for memoization
   */
  const clearCache = (): void => {
    if (config.debug) {
      console.log(`Clearing caches: inverse (${inverseCache.size} entries), gcd (${gcdCache.size} entries)`);
    }
    
    inverseCache.clear();
    gcdCache.clear();
    
    if (config.debug) {
      console.log('Caches cleared');
    }
  };
  
  /**
   * Greatest common divisor of two numbers
   * Uses the Euclidean algorithm
   */
  const gcd = (a: bigint, b: bigint): bigint => {
    if (config.debug) {
      console.log(`gcd(${a}, ${b})`);
    }
    
    // Handle negative inputs
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    
    // Check operation size in strict mode
    if (config.strict) {
      const aBits = bigintBitLength(a);
      const bBits = bigintBitLength(b);
      
      if (Math.max(aBits, bBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
        const error = new Error(
          `Operation exceeds maximum supported bit size (${MODULAR_CONSTANTS.MAX_SUPPORTED_BITS}): ` +
          `gcd(${aBits} bits, ${bBits} bits)`
        );
        if (config.debug) {
          console.error('Error in gcd (strict mode):', error);
        }
        throw error;
      }
    }
    
    // Base case
    if (b === 0n) {
      if (config.debug) {
        console.log(`gcd result: ${a} (base case)`);
      }
      return a;
    }
    
    // Check cache if enabled
    if (config.useCache) {
      // Ensure consistent order for cache key
      const key = a >= b 
        ? `${a.toString()},${b.toString()}` 
        : `${b.toString()},${a.toString()}`;
      
      if (gcdCache.has(key)) {
        const cachedResult = gcdCache.get(key)!;
        if (config.debug) {
          console.log(`gcd cache hit for key ${key}, result: ${cachedResult}`);
        }
        return cachedResult;
      }
      
      // Calculate and cache the result
      const result = gcd(b, a % b);
      
      if (gcdCache.size < MODULAR_CONSTANTS.DEFAULT_CACHE_SIZE) {
        gcdCache.set(key, result);
        if (config.debug) {
          console.log(`Cached gcd result for key ${key}: ${result}`);
        }
      }
      
      return result;
    }
    
    // Recursive case without caching
    if (config.debug) {
      console.log(`Computing gcd(${b}, ${a % b}) without caching`);
    }
    return gcd(b, a % b);
  };
  
  /**
   * Least common multiple of two numbers
   */
  const lcm = (a: bigint, b: bigint): bigint => {
    if (config.debug) {
      console.log(`lcm(${a}, ${b})`);
    }
    
    if (a === 0n || b === 0n) {
      if (config.debug) {
        console.log(`lcm result: 0 (special case with zero input)`);
      }
      return 0n;
    }
    
    // Check operation size in strict mode
    if (config.strict) {
      const aBits = bigintBitLength(a < 0n ? -a : a);
      const bBits = bigintBitLength(b < 0n ? -b : b);
      
      if (Math.max(aBits, bBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
        const error = new Error(
          `Operation exceeds maximum supported bit size (${MODULAR_CONSTANTS.MAX_SUPPORTED_BITS}): ` +
          `lcm(${aBits} bits, ${bBits} bits)`
        );
        if (config.debug) {
          console.error('Error in lcm (strict mode):', error);
        }
        throw error;
      }
    }
    
    // Use the formula: lcm(a,b) = |a*b| / gcd(a,b)
    const gcdValue = gcd(a, b);
    const result = (a / gcdValue) * b; // a and b are factored to avoid overflow
    
    if (config.debug) {
      console.log(`lcm result: ${result} (gcd=${gcdValue})`);
    }
    
    return result;
  };
  
  /**
   * Extended Euclidean algorithm to find Bézout coefficients
   * Returns [gcd, x, y] such that ax + by = gcd(a, b)
   */
  const extendedGcd = (a: bigint, b: bigint): [bigint, bigint, bigint] => {
    if (config.debug) {
      console.log(`extendedGcd(${a}, ${b})`);
    }
    
    // Check operation size in strict mode
    if (config.strict) {
      const aBits = bigintBitLength(a < 0n ? -a : a);
      const bBits = bigintBitLength(b < 0n ? -b : b);
      
      if (Math.max(aBits, bBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
        const error = new Error(
          `Operation exceeds maximum supported bit size (${MODULAR_CONSTANTS.MAX_SUPPORTED_BITS}): ` +
          `extendedGcd(${aBits} bits, ${bBits} bits)`
        );
        if (config.debug) {
          console.error('Error in extendedGcd (strict mode):', error);
        }
        throw error;
      }
    }
    
    if (b === 0n) {
      if (config.debug) {
        console.log(`extendedGcd base case: [${a}, 1, 0]`);
      }
      return [a, 1n, 0n];
    }
    
    // Recursive case
    const [g, x1, y1] = extendedGcd(b, a % b);
    const x = y1;
    const y = x1 - (a / b) * y1;
    
    if (config.debug) {
      console.log(`extendedGcd result: [${g}, ${x}, ${y}]`);
      console.log(`Verification: ${a} * ${x} + ${b} * ${y} = ${a * x + b * y} (should equal ${g})`);
    }
    
    return [g, x, y];
  };
  
  /**
   * Modular exponentiation (a^b mod m)
   * Uses the square-and-multiply algorithm for efficiency
   */
  const modPow: ModPowFunction = (base, exponent, modulus) => {
    if (config.debug) {
      console.log(`modPow: ${base}^${exponent} mod ${modulus}`);
    }
    
    // Convert to BigInt for consistent handling
    let baseBig = BigInt(base);
    let expBig = BigInt(exponent);
    const modBig = BigInt(modulus);
    
    if (modBig === 0n) {
      const error = new Error('Division by zero in modular exponentiation');
      if (config.debug) {
        console.error('Error in modPow:', error);
      }
      throw error;
    }
    
    if (modBig === 1n) {
      if (config.debug) {
        console.log(`modPow result: 0 (modulus is 1)`);
      }
      return 0n;
    }
    
    // Check operation size in strict mode
    if (config.strict) {
      const baseBits = bigintBitLength(baseBig < 0n ? -baseBig : baseBig);
      const expBits = bigintBitLength(expBig < 0n ? -expBig : expBig);
      const modBits = bigintBitLength(modBig);
      
      if (Math.max(baseBits, modBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS || 
          expBits > 10000) { // Exponent has a separate limit as it affects algorithm complexity
        const error = new Error(
          `Operation exceeds maximum supported bit size: ` +
          `base=${baseBits} bits, exponent=${expBits} bits, modulus=${modBits} bits`
        );
        if (config.debug) {
          console.error('Error in modPow (strict mode):', error);
        }
        throw error;
      }
    }
    
    // Handle negative exponent using modular inverse
    if (expBig < 0n) {
      if (config.debug) {
        console.log(`Handling negative exponent ${expBig}, computing modular inverse of ${baseBig}`);
      }
      
      // Calculate modular inverse of base
      baseBig = modInverse(baseBig, modBig) as bigint;
      expBig = -expBig;
      
      if (config.debug) {
        console.log(`Modular inverse computed: ${baseBig}`);
      }
    }
    
    // Ensure base is positive within the modulus
    baseBig = ((baseBig % modBig) + modBig) % modBig;
    
    // Quick checks
    if (baseBig === 0n) {
      if (config.debug) {
        console.log(`modPow result: 0 (base is 0)`);
      }
      return 0n;
    }
    
    if (expBig === 0n) {
      if (config.debug) {
        console.log(`modPow result: 1 (exponent is 0)`);
      }
      return 1n;
    }
    
    if (config.debug) {
      console.log(`Computing ${baseBig}^${expBig} mod ${modBig} using square-and-multiply algorithm`);
    }
    
    // Fast modular exponentiation using square-and-multiply
    let result = 1n;
    
    while (expBig > 0n) {
      if (expBig % 2n === 1n) {
        result = modMul(result, baseBig, modBig);
      }
      expBig >>= 1n;
      baseBig = modMul(baseBig, baseBig, modBig);
    }
    
    if (config.debug) {
      console.log(`modPow result: ${result}`);
    }
    
    return result;
  };
  
  /**
   * Modular multiplicative inverse (a^-1 mod m)
   * Uses the extended Euclidean algorithm
   */
  const modInverse: ModInverseFunction = (a, m) => {
    if (config.debug) {
      console.log(`modInverse: ${a}^(-1) mod ${m}`);
    }
    
    // Convert to BigInt for consistent handling
    const aBig = BigInt(a);
    const mBig = BigInt(m);
    
    // Check for zero
    if (aBig === 0n || mBig === 0n) {
      const error = new Error('Modular inverse requires non-zero inputs');
      if (config.debug) {
        console.error('Error in modInverse:', error);
      }
      throw error;
    }
    
    // Check operation size in strict mode
    if (config.strict) {
      const aBits = bigintBitLength(aBig < 0n ? -aBig : aBig);
      const mBits = bigintBitLength(mBig < 0n ? -mBig : mBig);
      
      if (Math.max(aBits, mBits) > MODULAR_CONSTANTS.MAX_SUPPORTED_BITS) {
        const error = new Error(
          `Operation exceeds maximum supported bit size (${MODULAR_CONSTANTS.MAX_SUPPORTED_BITS}): ` +
          `modInverse(${aBits} bits, ${mBits} bits)`
        );
        if (config.debug) {
          console.error('Error in modInverse (strict mode):', error);
        }
        throw error;
      }
    }
    
    // Check cache if enabled
    if (config.useCache) {
      const key = `${aBig.toString()},${mBig.toString()}`;
      
      if (inverseCache.has(key)) {
        if (config.debug) {
          console.log(`Cache hit for modInverse(${aBig}, ${mBig})`);
        }
        return inverseCache.get(key)!;
      }
    }
    
    // Use extended GCD to calculate modular inverse
    const [g, x, _] = extendedGcd(aBig, mBig);
    
    // Check if inverse exists (gcd must be 1 for a to be invertible)
    if (g !== 1n) {
      if (config.debug) {
        console.log(`No modular inverse for ${aBig} mod ${mBig} (gcd = ${g})`);
      }
      throw new Error(`Modular inverse does not exist (gcd = ${g})`);
    }
    
    // Calculate inverse and ensure it's positive
    const inverse = (x % mBig + mBig) % mBig;
    
    // Cache the result if enabled
    if (config.useCache && inverseCache.size < MODULAR_CONSTANTS.DEFAULT_CACHE_SIZE) {
      const key = `${aBig.toString()},${mBig.toString()}`;
      inverseCache.set(key, inverse);
    }
    
    return inverse;
  };
  
  // Return the public API
  return {
    mod,
    modPow,
    modInverse,
    extendedGcd,
    gcd,
    lcm,
    modMul,
    clearCache
  };
}

/**
 * Modular model implementation
 */
class ModularImplementation extends BaseModel implements ModularInterface {
  private impl: ModularOperations;
  private config: Required<ModularOptions>;

  constructor(options: ModularOptions = {}) {
    const processed = {
      pythonCompatible: options.pythonCompatible ?? true,
      useCache: options.useCache ?? true,
      useOptimized: options.useOptimized ?? true,
      nativeThreshold: options.nativeThreshold ?? MODULAR_CONSTANTS.MAX_NATIVE_BITS,
      strict: options.strict ?? false,
      debug: options.debug ?? false
    } as Required<ModularOptions>;

    super({ debug: processed.debug, name: options.name || 'precision-modular', version: options.version || '1.0.0' });

    this.config = processed;
    this.impl = createModularOperations(processed);

    // bind methods
    this.mod = this.impl.mod;
    this.modPow = this.impl.modPow;
    this.modInverse = this.impl.modInverse;
    this.extendedGcd = this.impl.extendedGcd;
    this.gcd = this.impl.gcd;
    this.lcm = this.impl.lcm;
    this.modMul = this.impl.modMul;
    this.clearCache = this.impl.clearCache;
  }

  protected async onInitialize(): Promise<void> {
    this.logger = createLogging();
    this.state.custom = { config: this.config };
  }

  protected async onProcess<T = ModularProcessInput, R = unknown>(input: T): Promise<R> {
    const req = input as unknown as ModularProcessInput;
    switch (req.operation) {
      case 'mod':
        return this.impl.mod(req.params[0], req.params[1]) as unknown as R;
      case 'modPow':
        return this.impl.modPow(req.params[0], req.params[1], req.params[2]) as unknown as R;
      case 'modInverse':
        return this.impl.modInverse(req.params[0], req.params[1]) as unknown as R;
      case 'extendedGcd':
        return this.impl.extendedGcd(req.params[0], req.params[1]) as unknown as R;
      case 'gcd':
        return this.impl.gcd(req.params[0], req.params[1]) as unknown as R;
      case 'lcm':
        return this.impl.lcm(req.params[0], req.params[1]) as unknown as R;
      case 'modMul':
        return this.impl.modMul(req.params[0], req.params[1], req.params[2]) as unknown as R;
      case 'clearCache':
        this.impl.clearCache();
        return undefined as unknown as R;
      default:
        throw new Error(`Unknown operation: ${req.operation}`);
    }
  }

  protected async onReset(): Promise<void> {
    this.impl.clearCache();
  }

  protected async onTerminate(): Promise<void> {
    // nothing extra
  }

  getState(): ModularState {
    const base = super.getState();
    return { ...base, config: this.config } as ModularState;
  }

  // placeholder properties overwritten in constructor
  mod!: ModFunction;
  modPow!: ModPowFunction;
  modInverse!: ModInverseFunction;
  extendedGcd!: (a: bigint, b: bigint) => [bigint, bigint, bigint];
  gcd!: (a: bigint, b: bigint) => bigint;
  lcm!: (a: bigint, b: bigint) => bigint;
  modMul!: ModMulFunction;
  clearCache!: () => void;
}

export function createModular(options: ModularOptions = {}): ModularInterface {
  return new ModularImplementation(options);
}

export async function createAndInitializeModular(options: ModularOptions = {}): Promise<ModularInterface> {
  const instance = createModular(options);
  const result = await instance.initialize();
  if (!result.success) {
    throw new Error(`Failed to initialize modular module: ${result.error}`);
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
  modMul,
  clearCache
} = defaultOperations;

// Export types and interfaces
export type {
  ModularOperations,
  ModularOptions,
  ModularInterface,
  ModularProcessInput,
  ModularState,
  ModularFactory
};

// Export the factory function
export { createModularOperations, createModular, createAndInitializeModular, ModularImplementation };

// Export constants
export { MODULAR_CONSTANTS };
