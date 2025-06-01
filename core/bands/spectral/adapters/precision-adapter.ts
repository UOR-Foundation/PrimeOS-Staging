/**
 * Precision Module Adapter for Spectral Processing
 * ===============================================
 * 
 * Provides enhanced mathematical operations for spectral analysis using core/precision.
 */

import {
  mod,
  modPow,
  modInverse,
  gcd,
  lcm,
  integerSqrt,
  MathUtilities,
  createPrecision,
  PrecisionConfiguration
} from '../../../precision';

import { BandType } from '../../types';

/**
 * Precision adapter configuration for spectral processing
 */
export interface SpectralPrecisionConfig {
  enableCaching?: boolean;
  cacheSize?: number;
  precision?: number;
  enableOptimizations?: boolean;
  bandOptimization?: boolean;
  debug?: boolean;
}

/**
 * Default configuration for spectral precision operations
 */
const DEFAULT_SPECTRAL_PRECISION_CONFIG: Required<SpectralPrecisionConfig> = {
  enableCaching: true,
  cacheSize: 5000,
  precision: 128,
  enableOptimizations: true,
  bandOptimization: true,
  debug: false
};

/**
 * Precision adapter for spectral processing with band optimization
 */
export class SpectralPrecisionAdapter {
  private precisionModule: any;
  private config: Required<SpectralPrecisionConfig>;
  private bandCache = new Map<BandType, any>();
  private operationStats = {
    modularOperations: 0,
    integerOperations: 0,
    transformOperations: 0,
    bandOptimizations: 0
  };
  
  constructor(
    precisionModule: any,
    config: SpectralPrecisionConfig = {}
  ) {
    this.precisionModule = precisionModule;
    this.config = { ...DEFAULT_SPECTRAL_PRECISION_CONFIG, ...config };
    
    if (!this.precisionModule) {
      throw new Error('Precision module is required for spectral operations');
    }
  }
  
  /**
   * Enhanced modular arithmetic for spectral transforms
   */
  mod(a: bigint, m: bigint): bigint {
    this.operationStats.modularOperations++;
    return mod(a, m);
  }
  
  /**
   * Enhanced modular exponentiation for NTT operations
   */
  modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    this.operationStats.modularOperations++;
    return modPow(base, exponent, modulus);
  }
  
  /**
   * Modular multiplicative inverse for spectral operations
   */
  modInverse(a: bigint, m: bigint): bigint {
    this.operationStats.modularOperations++;
    return modInverse(a, m);
  }
  
  /**
   * Enhanced integer square root for spectral analysis
   */
  integerSqrt(n: bigint): bigint {
    this.operationStats.integerOperations++;
    const result = integerSqrt(n);
    return typeof result === 'bigint' ? result : BigInt(result);
  }
  
  /**
   * Greatest common divisor with caching
   */
  gcd(a: bigint, b: bigint): bigint {
    this.operationStats.integerOperations++;
    return gcd(a, b);
  }
  
  /**
   * Least common multiple
   */
  lcm(a: bigint, b: bigint): bigint {
    this.operationStats.integerOperations++;
    return lcm(a, b);
  }
  
  /**
   * Convert number to modular representation for NTT
   */
  toModular(value: number | bigint, modulus: bigint): bigint {
    const bigValue = typeof value === 'bigint' ? value : BigInt(Math.floor(value * 1000000));
    return this.mod(bigValue, modulus);
  }
  
  /**
   * Convert from modular representation back to number
   */
  fromModular(value: bigint, scale: number = 1000000): number {
    return Number(value) / scale;
  }
  
  /**
   * Band-optimized modular operations
   */
  getBandOptimizedModulus(band: BandType, size: number): bigint {
    const cacheKey = `${band}-${size}`;
    
    if (this.config.bandOptimization && this.bandCache.has(band)) {
      const cached = this.bandCache.get(band);
      if (cached && cached.size >= size) {
        return cached.modulus;
      }
    }
    
    // Generate optimal modulus for band and transform size
    const optimalModulus = this.generateOptimalModulus(band, size);
    
    if (this.config.bandOptimization) {
      this.bandCache.set(band, { modulus: optimalModulus, size });
      this.operationStats.bandOptimizations++;
    }
    
    return optimalModulus;
  }
  
  /**
   * Generate optimal NTT modulus for band characteristics
   */
  private generateOptimalModulus(band: BandType, size: number): bigint {
    // Band-specific modulus selection
    const baseModuli = {
      [BandType.ULTRABASS]: 998244353n,     // Standard NTT modulus
      [BandType.BASS]: 469762049n,          // Smaller modulus for efficiency
      [BandType.MIDRANGE]: 998244353n,      // Standard
      [BandType.UPPER_MID]: 2013265921n,    // Larger for precision
      [BandType.TREBLE]: 2013265921n,       // High precision
      [BandType.SUPER_TREBLE]: 2281701377n, // Maximum precision
      [BandType.ULTRASONIC_1]: 2281701377n, // High precision needed
      [BandType.ULTRASONIC_2]: 2281701377n  // Maximum precision
    };
    
    let modulus = baseModuli[band] || 998244353n;
    
    // Ensure modulus supports transform size
    // For NTT, we need modulus = k * size + 1 for some k
    const targetSize = BigInt(size);
    while ((modulus - 1n) % targetSize !== 0n) {
      modulus += targetSize;
      
      // Ensure it's still prime (simplified check)
      if (this.isProbablePrime(modulus)) {
        break;
      }
    }
    
    return modulus;
  }
  
  /**
   * Band-optimized primitive root finding
   */
  getBandOptimizedPrimitiveRoot(modulus: bigint, band: BandType): bigint {
    // Cache primitive roots for performance
    const cacheKey = `root-${modulus}-${band}`;
    
    if (this.config.enableCaching) {
      // In practice, would use actual cache
      // For now, use simple computation
    }
    
    // Find primitive root suitable for the band
    return this.findPrimitiveRoot(modulus, band);
  }
  
  /**
   * Find primitive root for modular arithmetic
   */
  private findPrimitiveRoot(modulus: bigint, band: BandType): bigint {
    // Common primitive roots for standard NTT moduli
    const knownRoots = new Map([
      [998244353n, 3n],
      [469762049n, 3n],
      [2013265921n, 31n],
      [2281701377n, 3n]
    ]);
    
    if (knownRoots.has(modulus)) {
      return knownRoots.get(modulus)!;
    }
    
    // Find primitive root by testing small values
    for (let g = 2n; g < 100n; g++) {
      if (this.isPrimitiveRoot(g, modulus)) {
        return g;
      }
    }
    
    // Fallback
    return 3n;
  }
  
  /**
   * Check if g is a primitive root modulo p
   */
  private isPrimitiveRoot(g: bigint, p: bigint): boolean {
    // Simplified primitive root test
    // In practice, would implement full test using Fermat's little theorem
    const order = p - 1n;
    
    // Check if g^((p-1)/q) ≢ 1 (mod p) for all prime factors q of p-1
    // For now, use simplified test
    return this.modPow(g, order / 2n, p) !== 1n;
  }
  
  /**
   * Simplified primality test
   */
  private isProbablePrime(n: bigint): boolean {
    if (n < 2n) return false;
    if (n === 2n) return true;
    if (n % 2n === 0n) return false;
    
    // Simple Fermat test
    return this.modPow(2n, n - 1n, n) === 1n;
  }
  
  /**
   * Optimize spectral computation for specific band
   */
  optimizeForBand(band: BandType): {
    modulus: bigint;
    primitiveRoot: bigint;
    precision: number;
    cacheSize: number;
  } {
    const size = this.getBandTransformSize(band);
    const modulus = this.getBandOptimizedModulus(band, size);
    const primitiveRoot = this.getBandOptimizedPrimitiveRoot(modulus, band);
    
    // Band-specific precision requirements
    const precision = this.getBandPrecision(band);
    const cacheSize = this.getBandCacheSize(band);
    
    return {
      modulus,
      primitiveRoot,
      precision,
      cacheSize
    };
  }
  
  /**
   * Get optimal transform size for band
   */
  private getBandTransformSize(band: BandType): number {
    const sizes = {
      [BandType.ULTRABASS]: 1024,
      [BandType.BASS]: 2048,
      [BandType.MIDRANGE]: 4096,
      [BandType.UPPER_MID]: 4096,
      [BandType.TREBLE]: 8192,
      [BandType.SUPER_TREBLE]: 8192,
      [BandType.ULTRASONIC_1]: 16384,
      [BandType.ULTRASONIC_2]: 32768
    };
    
    return sizes[band] || 4096;
  }
  
  /**
   * Get precision requirements for band
   */
  private getBandPrecision(band: BandType): number {
    const precisions = {
      [BandType.ULTRABASS]: 32,
      [BandType.BASS]: 64,
      [BandType.MIDRANGE]: 64,
      [BandType.UPPER_MID]: 128,
      [BandType.TREBLE]: 128,
      [BandType.SUPER_TREBLE]: 256,
      [BandType.ULTRASONIC_1]: 256,
      [BandType.ULTRASONIC_2]: 512
    };
    
    return precisions[band] || 128;
  }
  
  /**
   * Get cache size for band
   */
  private getBandCacheSize(band: BandType): number {
    const cacheSizes = {
      [BandType.ULTRABASS]: 1000,
      [BandType.BASS]: 2000,
      [BandType.MIDRANGE]: 3000,
      [BandType.UPPER_MID]: 4000,
      [BandType.TREBLE]: 5000,
      [BandType.SUPER_TREBLE]: 7500,
      [BandType.ULTRASONIC_1]: 10000,
      [BandType.ULTRASONIC_2]: 15000
    };
    
    return cacheSizes[band] || 5000;
  }
  
  /**
   * Get operation statistics
   */
  getStats() {
    return { ...this.operationStats };
  }
  
  /**
   * Clear caches and reset statistics
   */
  clearCache(): void {
    this.bandCache.clear();
    this.operationStats = {
      modularOperations: 0,
      integerOperations: 0,
      transformOperations: 0,
      bandOptimizations: 0
    };
  }
  
  /**
   * Get access to underlying precision utilities
   */
  getMathUtilities() {
    return MathUtilities;
  }
  
  /**
   * Create band-specific precision instance
   */
  createBandPrecisionInstance(band: BandType) {
    const optimization = this.optimizeForBand(band);
    
    const config: PrecisionConfiguration = {
      enableCaching: this.config.enableCaching,
      cacheSize: optimization.cacheSize,
      useOptimized: this.config.enableOptimizations,
      debug: this.config.debug
    };
    
    return createPrecision(config);
  }
}

/**
 * Create a precision adapter for spectral processing
 */
export function createPrecisionAdapter(
  precisionModule: any,
  config: SpectralPrecisionConfig = {}
): SpectralPrecisionAdapter {
  return new SpectralPrecisionAdapter(precisionModule, config);
}

/**
 * Create a precision adapter with band optimization
 */
export function createBandOptimizedPrecisionAdapter(
  precisionModule: any,
  band: BandType,
  config: SpectralPrecisionConfig = {}
): SpectralPrecisionAdapter {
  const adapter = new SpectralPrecisionAdapter(precisionModule, {
    ...config,
    bandOptimization: true
  });
  
  // Pre-optimize for the specific band
  adapter.optimizeForBand(band);
  
  return adapter;
}
