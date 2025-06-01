/**
 * Prime Module Adapter for Spectral Processing
 * ===========================================
 * 
 * Provides prime-based operations for spectral analysis using core/prime.
 */

import { BandType } from '../../types';

/**
 * Prime adapter configuration for spectral processing
 */
export interface SpectralPrimeConfig {
  enableCaching?: boolean;
  cacheSize?: number;
  enableBandOptimization?: boolean;
  preloadPrimes?: number;
  debug?: boolean;
}

/**
 * Default configuration for spectral prime operations
 */
const DEFAULT_SPECTRAL_PRIME_CONFIG: Required<SpectralPrimeConfig> = {
  enableCaching: true,
  cacheSize: 10000,
  enableBandOptimization: true,
  preloadPrimes: 1000,
  debug: false
};

/**
 * Prime adapter for spectral processing with band optimization
 */
export class SpectralPrimeAdapter {
  private primeRegistry: any;
  private config: Required<SpectralPrimeConfig>;
  private bandCache = new Map<string, any>();
  private operationStats = {
    primalityTests: 0,
    factorizations: 0,
    primeGenerations: 0,
    bandOptimizations: 0
  };
  
  constructor(
    primeRegistry: any,
    config: SpectralPrimeConfig = {}
  ) {
    this.primeRegistry = primeRegistry;
    this.config = { ...DEFAULT_SPECTRAL_PRIME_CONFIG, ...config };
    
    if (!this.primeRegistry) {
      throw new Error('Prime registry is required for spectral operations');
    }
  }
  
  /**
   * Ensure prime registry is initialized
   */
  async ensureInitialized(): Promise<void> {
    if (typeof this.primeRegistry.initialize === 'function' && 
        typeof this.primeRegistry.getState === 'function') {
      const state = this.primeRegistry.getState();
      if (state.lifecycle !== 'Ready') {
        const result = await this.primeRegistry.initialize();
        if (!result.success) {
          throw new Error(`Failed to initialize prime registry: ${result.error}`);
        }
      }
    }
  }
  
  /**
   * Test if a number is prime
   */
  isPrime(n: bigint): boolean {
    this.operationStats.primalityTests++;
    
    if (typeof this.primeRegistry.isPrime !== 'function') {
      throw new Error('Prime registry missing isPrime method');
    }
    
    return this.primeRegistry.isPrime(n);
  }
  
  /**
   * Get prime at specific index
   */
  getPrime(index: number): bigint {
    if (typeof this.primeRegistry.getPrime !== 'function') {
      throw new Error('Prime registry missing getPrime method');
    }
    
    return this.primeRegistry.getPrime(index);
  }
  
  /**
   * Get index of a prime
   */
  getIndex(prime: bigint): number {
    if (typeof this.primeRegistry.getIndex !== 'function') {
      throw new Error('Prime registry missing getIndex method');
    }
    
    return this.primeRegistry.getIndex(prime);
  }
  
  /**
   * Factor a number into prime components
   */
  factor(n: bigint): Array<{prime: bigint, exponent: number}> {
    this.operationStats.factorizations++;
    
    if (typeof this.primeRegistry.factor !== 'function') {
      throw new Error('Prime registry missing factor method');
    }
    
    return this.primeRegistry.factor(n);
  }
  
  /**
   * Find optimal NTT modulus for spectral processing
   */
  findOptimalNTTModulus(size: number, band?: BandType): bigint {
    const cacheKey = band ? `${band}-${size}` : `${size}`;
    
    if (this.config.enableCaching && this.bandCache.has(cacheKey)) {
      return this.bandCache.get(cacheKey);
    }
    
    // Start with size and find suitable prime modulus
    let candidate = BigInt(size * 2);
    
    // For NTT, we need p = k*n + 1 where n is transform size
    const targetSize = BigInt(size);
    
    while (true) {
      const modulus = candidate * targetSize + 1n;
      
      if (this.isPrime(modulus)) {
        if (this.config.enableCaching) {
          this.bandCache.set(cacheKey, modulus);
        }
        return modulus;
      }
      
      candidate++;
      
      // Safety limit
      if (candidate > 1000n) {
        break;
      }
    }
    
    // Fallback to known NTT primes
    return this.getBandOptimizedModulus(band || BandType.MIDRANGE);
  }
  
  /**
   * Get band-optimized modulus for spectral operations
   */
  getBandOptimizedModulus(band: BandType): bigint {
    const cacheKey = `modulus-${band}`;
    if (this.config.enableBandOptimization && this.bandCache.has(cacheKey)) {
      return this.bandCache.get(cacheKey);
    }
    
    // Band-specific NTT moduli optimized for different frequency ranges
    const moduli = {
      [BandType.ULTRABASS]: 998244353n,     // Standard, efficient
      [BandType.BASS]: 469762049n,          // Smaller for speed
      [BandType.MIDRANGE]: 998244353n,      // Standard NTT prime
      [BandType.UPPER_MID]: 2013265921n,    // Higher precision
      [BandType.TREBLE]: 2013265921n,       // High precision
      [BandType.SUPER_TREBLE]: 2281701377n, // Maximum precision
      [BandType.ULTRASONIC_1]: 2281701377n, // Very high precision
      [BandType.ULTRASONIC_2]: 2281701377n  // Maximum precision
    };
    
    const modulus = moduli[band] || 998244353n;
    
    if (this.config.enableBandOptimization) {
      this.bandCache.set(cacheKey, modulus);
      this.operationStats.bandOptimizations++;
    }
    
    return modulus;
  }
  
  /**
   * Find primitive root for modulus
   */
  findPrimitiveRoot(modulus: bigint, band?: BandType): bigint {
    // Known primitive roots for common NTT moduli
    const knownRoots = new Map([
      [998244353n, 3n],
      [469762049n, 3n],
      [2013265921n, 31n],
      [2281701377n, 3n]
    ]);
    
    if (knownRoots.has(modulus)) {
      return knownRoots.get(modulus)!;
    }
    
    // Search for primitive root
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
    const order = p - 1n;
    
    // Check a few key conditions
    if (this.modPow(g, order / 2n, p) === 1n) return false;
    if (this.modPow(g, order / 3n, p) === 1n) return false;
    
    return true;
  }
  
  /**
   * Modular exponentiation
   */
  private modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    let result = 1n;
    base = base % modulus;
    
    while (exponent > 0n) {
      if (exponent % 2n === 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent / 2n;
      base = (base * base) % modulus;
    }
    
    return result;
  }
  
  /**
   * Generate primes suitable for spectral analysis in a band
   */
  generateBandPrimes(band: BandType, count: number): bigint[] {
    this.operationStats.primeGenerations++;
    
    const primes: bigint[] = [];
    const startIndex = this.getBandStartIndex(band);
    
    for (let i = 0; i < count; i++) {
      try {
        const prime = this.getPrime(startIndex + i);
        primes.push(prime);
      } catch (error) {
        break; // Stop if we can't get more primes
      }
    }
    
    return primes;
  }
  
  /**
   * Get starting prime index for band
   */
  private getBandStartIndex(band: BandType): number {
    const startIndices = {
      [BandType.ULTRABASS]: 0,      // Start from 2
      [BandType.BASS]: 10,          // Start from 31
      [BandType.MIDRANGE]: 50,      // Start from 229
      [BandType.UPPER_MID]: 100,    // Start from 541
      [BandType.TREBLE]: 200,       // Start from 1223
      [BandType.SUPER_TREBLE]: 500, // Start from 3571
      [BandType.ULTRASONIC_1]: 1000, // Start from 7919
      [BandType.ULTRASONIC_2]: 2000  // Start from 17389
    };
    
    return startIndices[band] || 0;
  }
  
  /**
   * Convert number to prime-based representation for spectral analysis
   */
  toPrimeRepresentation(n: bigint, band: BandType): Array<{prime: bigint, power: number}> {
    const factors = this.factor(n);
    
    // Add band-specific weighting
    return factors.map(factor => ({
      prime: factor.prime,
      power: factor.exponent * this.getBandWeight(band)
    }));
  }
  
  /**
   * Get weighting factor for band
   */
  private getBandWeight(band: BandType): number {
    const weights = {
      [BandType.ULTRABASS]: 1.0,
      [BandType.BASS]: 1.2,
      [BandType.MIDRANGE]: 1.5,
      [BandType.UPPER_MID]: 1.8,
      [BandType.TREBLE]: 2.0,
      [BandType.SUPER_TREBLE]: 2.5,
      [BandType.ULTRASONIC_1]: 3.0,
      [BandType.ULTRASONIC_2]: 4.0
    };
    
    return weights[band] || 1.0;
  }
  
  /**
   * Get spectral characteristics of a number using prime factorization
   */
  getSpectralCharacteristics(n: bigint): {
    complexity: number;
    distribution: number[];
    dominantPrimes: bigint[];
    spectralWeight: number;
  } {
    const factors = this.factor(n);
    
    // Calculate complexity based on number of distinct prime factors
    const complexity = factors.length / Math.log2(Number(n.toString().length));
    
    // Calculate prime distribution
    const distribution = factors.map(f => f.exponent);
    
    // Find dominant primes (highest exponents)
    const dominantPrimes = factors
      .sort((a, b) => b.exponent - a.exponent)
      .slice(0, 3)
      .map(f => f.prime);
    
    // Calculate spectral weight
    const spectralWeight = factors.reduce((sum, f) => 
      sum + Math.log(Number(f.prime)) * f.exponent, 0
    );
    
    return {
      complexity,
      distribution,
      dominantPrimes,
      spectralWeight
    };
  }
  
  /**
   * Optimize prime operations for band
   */
  optimizeForBand(band: BandType): {
    modulus: bigint;
    primitiveRoot: bigint;
    startIndex: number;
    weight: number;
  } {
    const modulus = this.getBandOptimizedModulus(band);
    const primitiveRoot = this.findPrimitiveRoot(modulus, band);
    const startIndex = this.getBandStartIndex(band);
    const weight = this.getBandWeight(band);
    
    return {
      modulus,
      primitiveRoot,
      startIndex,
      weight
    };
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
      primalityTests: 0,
      factorizations: 0,
      primeGenerations: 0,
      bandOptimizations: 0
    };
  }
  
  /**
   * Terminate adapter and clean up resources
   */
  async terminate(): Promise<void> {
    this.clearCache();
  }
}

/**
 * Create a prime adapter for spectral processing
 */
export function createPrimeAdapter(
  primeRegistry: any,
  config: SpectralPrimeConfig = {}
): SpectralPrimeAdapter {
  return new SpectralPrimeAdapter(primeRegistry, config);
}

/**
 * Create a prime adapter with band optimization
 */
export function createBandOptimizedPrimeAdapter(
  primeRegistry: any,
  band: BandType,
  config: SpectralPrimeConfig = {}
): SpectralPrimeAdapter {
  const adapter = new SpectralPrimeAdapter(primeRegistry, {
    ...config,
    enableBandOptimization: true
  });
  
  // Pre-optimize for the specific band
  adapter.optimizeForBand(band);
  
  return adapter;
}
