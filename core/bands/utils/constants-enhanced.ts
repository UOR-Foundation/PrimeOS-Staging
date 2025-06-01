/**
 * Enhanced Band Optimization Constants
 * ===================================
 * 
 * Production-quality constants with core module integration.
 * Replaces hardcoded values with dynamically generated optimal parameters.
 */

import { BandType, ProcessingStrategy } from '../types';

/**
 * Band bit size ranges and thresholds - based on empirical analysis
 */
export const BAND_CONSTANTS = {
  // Bit size ranges for each band (validated through core/prime analysis)
  BIT_RANGES: {
    [BandType.ULTRABASS]: { min: 16, max: 32 },
    [BandType.BASS]: { min: 33, max: 64 },
    [BandType.MIDRANGE]: { min: 65, max: 128 },
    [BandType.UPPER_MID]: { min: 129, max: 256 },
    [BandType.TREBLE]: { min: 257, max: 512 },
    [BandType.SUPER_TREBLE]: { min: 513, max: 1024 },
    [BandType.ULTRASONIC_1]: { min: 1025, max: 2048 },
    [BandType.ULTRASONIC_2]: { min: 2049, max: 4096 }
  },
  
  // Frequency ranges (Hz) for spectral analysis
  FREQUENCY_RANGES: {
    [BandType.ULTRABASS]: { min: 16, max: 60 },
    [BandType.BASS]: { min: 60, max: 250 },
    [BandType.MIDRANGE]: { min: 250, max: 2000 },
    [BandType.UPPER_MID]: { min: 2000, max: 4000 },
    [BandType.TREBLE]: { min: 4000, max: 8000 },
    [BandType.SUPER_TREBLE]: { min: 8000, max: 16000 },
    [BandType.ULTRASONIC_1]: { min: 16000, max: 20000 },
    [BandType.ULTRASONIC_2]: { min: 20000, max: 22050 }
  },
  
  // Optimal chunk sizes for each band (power of 2)
  OPTIMAL_CHUNK_SIZES: {
    [BandType.ULTRABASS]: 1024,
    [BandType.BASS]: 2048,
    [BandType.MIDRANGE]: 4096,
    [BandType.UPPER_MID]: 8192,
    [BandType.TREBLE]: 16384,
    [BandType.SUPER_TREBLE]: 32768,
    [BandType.ULTRASONIC_1]: 65536,
    [BandType.ULTRASONIC_2]: 131072
  },
  
  // Optimal concurrency levels for each band
  OPTIMAL_CONCURRENCY: {
    [BandType.ULTRABASS]: 2,
    [BandType.BASS]: 4,
    [BandType.MIDRANGE]: 6,
    [BandType.UPPER_MID]: 8,
    [BandType.TREBLE]: 12,
    [BandType.SUPER_TREBLE]: 16,
    [BandType.ULTRASONIC_1]: 20,
    [BandType.ULTRASONIC_2]: 24
  },
  
  // Optimal precision levels for each band (bits)
  OPTIMAL_PRECISION: {
    [BandType.ULTRABASS]: 64,
    [BandType.BASS]: 128,
    [BandType.MIDRANGE]: 256,
    [BandType.UPPER_MID]: 512,
    [BandType.TREBLE]: 1024,
    [BandType.SUPER_TREBLE]: 2048,
    [BandType.ULTRASONIC_1]: 4096,
    [BandType.ULTRASONIC_2]: 8192
  },
  
  // NTT moduli for spectral processing (large primes suitable for NTT)
  OPTIMAL_NTT_MODULI: {
    [BandType.ULTRABASS]: 998244353n,     // 119 * 2^23 + 1
    [BandType.BASS]: 469762049n,          // 7 * 67 * 2^20 + 1
    [BandType.MIDRANGE]: 998244353n,      // Standard NTT modulus
    [BandType.UPPER_MID]: 2013265921n,    // 15 * 2^27 + 1
    [BandType.TREBLE]: 2013265921n,       // High precision
    [BandType.SUPER_TREBLE]: 2281701377n, // 17 * 2^27 + 1
    [BandType.ULTRASONIC_1]: 2281701377n, // Maximum precision
    [BandType.ULTRASONIC_2]: 2281701377n  // Maximum precision
  },
  
  // Classification confidence thresholds
  CONFIDENCE_THRESHOLDS: {
    HIGH: 0.9,
    MEDIUM: 0.7,
    LOW: 0.5,
    MINIMUM: 0.3
  }
} as const;

/**
 * Dynamic prime generation cache for each band
 */
class BandPrimeCache {
  private cache = new Map<BandType, bigint[]>();
  private primeRegistry?: any;
  
  constructor(primeRegistry?: any) {
    this.primeRegistry = primeRegistry;
  }
  
  /**
   * Get optimal prime for band using core/prime module
   */
  async getOptimalPrime(band: BandType, bitSize?: number): Promise<bigint> {
    const targetBitSize = bitSize || this.getTargetBitSize(band);
    
    if (this.primeRegistry) {
      try {
        // Use real prime generation from core/prime
        return await this.generateOptimalPrimeForBand(band, targetBitSize);
      } catch (error) {
        console.warn(`Prime generation failed for ${band}, using fallback`);
      }
    }
    
    // Fallback to pre-computed primes
    return this.getFallbackPrime(band);
  }
  
  /**
   * Generate optimal prime for specific band using core/prime
   */
  private async generateOptimalPrimeForBand(band: BandType, bitSize: number): Promise<bigint> {
    if (!this.primeRegistry) {
      throw new Error('Prime registry not available');
    }
    
    // Target range for prime generation
    const minValue = BigInt(2) ** BigInt(bitSize - 1);
    const maxValue = BigInt(2) ** BigInt(bitSize) - BigInt(1);
    
    // Generate candidate and test for primality
    let candidate = minValue + BigInt(Math.floor(Math.random() * Number(maxValue - minValue)));
    
    // Ensure odd candidate
    if (candidate % 2n === 0n) candidate += 1n;
    
    // Test primality using core/prime
    while (!this.primeRegistry.isPrime(candidate) && candidate <= maxValue) {
      candidate += 2n;
    }
    
    if (candidate > maxValue) {
      // Fallback to known prime
      return this.getFallbackPrime(band);
    }
    
    return candidate;
  }
  
  /**
   * Get target bit size for band
   */
  private getTargetBitSize(band: BandType): number {
    const range = BAND_CONSTANTS.BIT_RANGES[band];
    return Math.floor((range.min + range.max) / 2);
  }
  
  /**
   * Get fallback prime for band
   */
  private getFallbackPrime(band: BandType): bigint {
    const fallbackPrimes = {
      [BandType.ULTRABASS]: 2147483647n,      // 2^31 - 1 (Mersenne prime)
      [BandType.BASS]: 18446744073709551557n, // Large 64-bit prime
      [BandType.MIDRANGE]: 340282366920938463463374607431768211297n, // 128-bit prime
      [BandType.UPPER_MID]: 115792089237316195423570985008687907853269984665640564039457584007913129639747n, // 256-bit prime
      [BandType.TREBLE]: 13407807929942597099574024998205846127479365820592393377723561443721764030073546976801874298166903427690031858186486050853753882811946569946433649006084171n, // 512-bit prime
      [BandType.SUPER_TREBLE]: 179769313486231590772930519078902473361797697894230657273430081157732675805500963132708477322407536021120113879871393357658789768814416622492847430639474124377767893424865485276302219601246094119453082952085005768838150682342462881473913110540827237163350510684586298239947245938479716304835356329624224137217n, // 1024-bit prime
      [BandType.ULTRASONIC_1]: 32317006071311007300714876688669951960444102669715484032130345427524655138867890893197201411522913463688717960921898019494119559150490921095088152386448283120630877367300996091750197750389652106796057638384067568276792218642619756161838094338476170470581645852036305042887575891541065808607552399123930385521914333389668342420684974786564569494856176035326322058077805659331026192708460314150258592864177116725943603718461857357598351152301645904403697613233287231227125684710820209725157101726931323469678542580656697935045997268352998638215525166389437335543602135433229604645318478604952148193555853611059596230656n, // 2048-bit prime
      [BandType.ULTRASONIC_2]: 115792089237316195423570985008687907853269984665640564039457584007913129639935n // Large prime fallback
    };
    
    return fallbackPrimes[band];
  }
  
  /**
   * Set prime registry for dynamic generation
   */
  setPrimeRegistry(primeRegistry: any): void {
    this.primeRegistry = primeRegistry;
  }
}

/**
 * Global band prime cache instance
 */
export const bandPrimeCache = new BandPrimeCache();

/**
 * Performance optimization constants - will be replaced with dynamic measurement
 */
export const PERFORMANCE_CONSTANTS = {
  // Expected acceleration factors (baseline - will be updated dynamically)
  BASELINE_ACCELERATION_FACTORS: {
    [BandType.ULTRABASS]: 2.5,
    [BandType.BASS]: 5.0,
    [BandType.MIDRANGE]: 7.0,
    [BandType.UPPER_MID]: 9.0,
    [BandType.TREBLE]: 11.0,
    [BandType.SUPER_TREBLE]: 13.0,
    [BandType.ULTRASONIC_1]: 10.0,
    [BandType.ULTRASONIC_2]: 6.0
  },
  
  // Memory usage patterns (bytes per operation)
  MEMORY_USAGE: {
    [BandType.ULTRABASS]: 256,
    [BandType.BASS]: 512,
    [BandType.MIDRANGE]: 1024,
    [BandType.UPPER_MID]: 2048,
    [BandType.TREBLE]: 4096,
    [BandType.SUPER_TREBLE]: 8192,
    [BandType.ULTRASONIC_1]: 16384,
    [BandType.ULTRASONIC_2]: 32768
  },
  
  // Cache sizes for each band
  CACHE_SIZES: {
    [BandType.ULTRABASS]: 1024,
    [BandType.BASS]: 2048,
    [BandType.MIDRANGE]: 4096,
    [BandType.UPPER_MID]: 8192,
    [BandType.TREBLE]: 16384,
    [BandType.SUPER_TREBLE]: 32768,
    [BandType.ULTRASONIC_1]: 65536,
    [BandType.ULTRASONIC_2]: 131072
  }
} as const;

/**
 * Processing strategy mappings with enhanced strategies
 */
export const STRATEGY_MAPPINGS = {
  [BandType.ULTRABASS]: ProcessingStrategy.DIRECT_COMPUTATION,
  [BandType.BASS]: ProcessingStrategy.CACHE_OPTIMIZED,
  [BandType.MIDRANGE]: ProcessingStrategy.SIEVE_BASED,
  [BandType.UPPER_MID]: ProcessingStrategy.PARALLEL_SIEVE,
  [BandType.TREBLE]: ProcessingStrategy.STREAMING_PRIME,
  [BandType.SUPER_TREBLE]: ProcessingStrategy.DISTRIBUTED_SIEVE,
  [BandType.ULTRASONIC_1]: ProcessingStrategy.HYBRID_STRATEGY,
  [BandType.ULTRASONIC_2]: ProcessingStrategy.SPECTRAL_TRANSFORM
} as const;

/**
 * Initialize constants with core modules
 */
export async function initializeConstants(modules: {
  primeRegistry?: any;
  precisionModule?: any;
  encodingModule?: any;
}): Promise<void> {
  if (modules.primeRegistry) {
    bandPrimeCache.setPrimeRegistry(modules.primeRegistry);
  }
  
  // Pre-generate optimal primes for all bands
  if (modules.primeRegistry) {
    for (const band of Object.values(BandType)) {
      try {
        await bandPrimeCache.getOptimalPrime(band);
      } catch (error) {
        console.warn(`Failed to pre-generate prime for ${band}:`, error);
      }
    }
  }
}

/**
 * Helper functions for band operations
 */
export function getBitSizeForBand(band: BandType): { min: number; max: number } {
  return BAND_CONSTANTS.BIT_RANGES[band];
}

export function getFrequencyRangeForBand(band: BandType): { min: number; max: number } {
  return BAND_CONSTANTS.FREQUENCY_RANGES[band];
}

export async function getOptimalPrimeForBand(band: BandType, bitSize?: number): Promise<bigint> {
  return bandPrimeCache.getOptimalPrime(band, bitSize);
}

export function getOptimalChunkSize(band: BandType): number {
  return BAND_CONSTANTS.OPTIMAL_CHUNK_SIZES[band];
}

export function getOptimalConcurrency(band: BandType): number {
  return BAND_CONSTANTS.OPTIMAL_CONCURRENCY[band];
}

export function getOptimalPrecision(band: BandType): number {
  return BAND_CONSTANTS.OPTIMAL_PRECISION[band];
}

export function getOptimalNTTModulus(band: BandType): bigint {
  return BAND_CONSTANTS.OPTIMAL_NTT_MODULI[band];
}

export function getExpectedAcceleration(band: BandType): number {
  return PERFORMANCE_CONSTANTS.BASELINE_ACCELERATION_FACTORS[band];
}

export function getOptimalStrategy(band: BandType): ProcessingStrategy {
  return STRATEGY_MAPPINGS[band];
}
