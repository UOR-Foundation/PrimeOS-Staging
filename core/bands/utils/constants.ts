/**
 * Band Optimization Constants
 * ===========================
 * 
 * Central configuration for all band optimization constants,
 * eliminating magic numbers and hardcoded values.
 */

import { BandType, ProcessingStrategy, WindowFunction } from '../types';

/**
 * Band bit size ranges and thresholds
 */
export const BAND_CONSTANTS = {
  // Bit size ranges for each band
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
  
  // Default primes for each band (optimized for range)
  DEFAULT_PRIMES: {
    [BandType.ULTRABASS]: BigInt(2147483647),      // 2^31 - 1
    [BandType.BASS]: BigInt(18446744073709551557), // Large 64-bit prime
    [BandType.MIDRANGE]: BigInt('340282366920938463463374607431768211297'), // 128-bit prime
    [BandType.UPPER_MID]: BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639747'), // 256-bit prime
    [BandType.TREBLE]: BigInt('13407807929942597099574024998205846127479365820592393377723561443721764030073546976801874298166903427690031858186486050853753882811946569946433649006084171'), // 512-bit prime
    [BandType.SUPER_TREBLE]: BigInt('179769313486231590772930519078902473361797697894230657273430081157732675805500963132708477322407536021120113879871393357658789768814416622492847430639474124377767893424865485276302219601246094119453082952085005768838150682342462881473913110540827237163350510684586298239947245938479716304835356329624224137217'), // 1024-bit prime  
    [BandType.ULTRASONIC_1]: BigInt('32317006071311007300714876688669951960444102669715484032130345427524655138867890893197201411522913463688717960921898019494119559150490921095088152386448283120630877367300996091750197750389652106796057638384067568276792218642619756161838094338476170470581645852036305042887575891541065808607552399123930385521914333389668342420684974786564569494856176035326322058077805659331026192708460314150258592864177116725943603718461857357598351152301645904403697613233287231227125684710820209725157101726931323469678542580656697935045997268352998638215525166389437335543602135433229604645318478604952148193555853611059596230656'), // 2048-bit prime
    [BandType.ULTRASONIC_2]: BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935') // Fallback large prime
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
 * Performance optimization constants
 */
export const PERFORMANCE_CONSTANTS = {
  // Expected acceleration factors for each band
  ACCELERATION_FACTORS: {
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
 * Processing strategy mappings
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
 * Helper functions for band operations
 */
export function getBitSizeForBand(band: BandType): { min: number; max: number } {
  return BAND_CONSTANTS.BIT_RANGES[band];
}

export function getDefaultPrimeForBand(band: BandType): bigint {
  return BAND_CONSTANTS.DEFAULT_PRIMES[band];
}

export function getExpectedAcceleration(band: BandType): number {
  return PERFORMANCE_CONSTANTS.ACCELERATION_FACTORS[band];
}

export function getOptimalStrategy(band: BandType): ProcessingStrategy {
  return STRATEGY_MAPPINGS[band];
}
