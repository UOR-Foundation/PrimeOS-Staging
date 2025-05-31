/**
 * Stream Processing Constants
 * ===========================
 * 
 * Central configuration for all stream processing constants,
 * eliminating magic numbers and hardcoded values.
 */

import { MathUtilities } from '../precision';

/**
 * Prime-related constants for stream operations
 */
export const PRIME_CONSTANTS = {
  // Checksum prime threshold - based on UOR kernel specifications
  CHECKSUM_PRIME_THRESHOLD: BigInt(1000000007),
  
  // Marker primes for stream structure identification
  MARKER_PRIMES: {
    POSITION: BigInt(2),
    TYPE: BigInt(3),
    METADATA: BigInt(5),
    BOUNDARY: BigInt(7),
    STREAM_START: BigInt(11),
    STREAM_END: BigInt(13)
  },
  
  // Checksum calculation mask (32-bit for compatibility)
  CHECKSUM_MASK: BigInt(0xFFFFFFFF),
  
  // Prime pattern recognition
  PATTERNS: {
    DATA_CHUNK: { prime: BigInt(3), exponent: 3 },
    BLOCK_HEADER: { prime: BigInt(5), exponent: 2 },
    NTT_HEADER: { prime: BigInt(7), exponent: 1 },
    STREAM_MARKER: { prime: BigInt(11), exponent: 2 }
  }
} as const;

/**
 * Memory estimation constants based on empirical measurements
 */
export const MEMORY_CONSTANTS = {
  // Base overhead for different components (in bytes)
  BASE_OVERHEAD: {
    PROCESSOR_INSTANCE: 10 * 1024, // 10KB base
    METRICS_TRACKING: 2 * 1024,     // 2KB for metrics
    CACHE_ENTRY: 256,               // 256 bytes per cache entry
    BUFFER_OVERHEAD: 512            // 512 bytes buffer overhead
  },
  
  // BigInt memory consumption estimates
  BIGINT_MEMORY: {
    BYTES_PER_DIGIT: 8,             // 8 bytes per bigint digit
    BASE_OVERHEAD: 64,              // 64 bytes base overhead
    FACTOR_OVERHEAD: 128            // 128 bytes per factor structure
  },
  
  // Adaptive strategy memory allowances
  ADAPTIVE_CACHING: {
    SMALL_NUMBERS: 10 * 1024,       // 10KB for numbers < 100 bits
    MEDIUM_NUMBERS: 50 * 1024,      // 50KB for 100-1000 bits
    LARGE_NUMBERS: 200 * 1024       // 200KB for > 1000 bits
  }
} as const;

/**
 * Performance optimization thresholds
 */
export const OPTIMIZATION_THRESHOLDS = {
  // Memory usage thresholds
  MEMORY: {
    LOW: 0.5,                       // 50% - normal operations
    MEDIUM: 0.7,                    // 70% - start optimization
    HIGH: 0.85,                     // 85% - aggressive optimization
    CRITICAL: 0.95                  // 95% - emergency measures
  },
  
  // Throughput thresholds (operations per second)
  THROUGHPUT: {
    POOR: 100,
    ACCEPTABLE: 1000,
    GOOD: 10000,
    EXCELLENT: 100000
  },
  
  // Latency thresholds (milliseconds)
  LATENCY: {
    EXCELLENT: 1,
    GOOD: 10,
    ACCEPTABLE: 100,
    POOR: 1000
  },
  
  // Expected improvement percentages
  EXPECTED_IMPROVEMENT: {
    MEMORY_REDUCTION: 20,
    THROUGHPUT_INCREASE: 25,
    LATENCY_REDUCTION: 15,
    CONCURRENCY_BOOST: 30
  }
} as const;

/**
 * Stream processing configuration defaults
 */
export const STREAM_DEFAULTS = {
  // Chunk processing
  CHUNK_SIZE: {
    MIN: 64,
    DEFAULT: 1024,
    MAX: 8192,
    ADAPTIVE_FACTOR: 0.75         // Reduce by 25% under pressure
  },
  
  // Concurrency settings
  CONCURRENCY: {
    MIN: 1,
    DEFAULT: 4,
    MAX: 16,
    INCREMENT: 2                   // Increase by 2 when optimizing
  },
  
  // Buffer sizes
  BUFFER: {
    MIN: 1024,
    DEFAULT: 8192,
    MAX: 65536,
    BACKPRESSURE_REDUCTION: 0.5   // Reduce by 50% under pressure
  },
  
  // Timing intervals (milliseconds)
  INTERVALS: {
    METRICS_UPDATE: 1000,          // Update metrics every second
    OPTIMIZATION_CHECK: 5000,      // Check optimization every 5 seconds
    MEMORY_MONITOR: 500,           // Monitor memory every 500ms
    COORDINATED_OPTIMIZATION: 30000 // Coordinate optimization every 30s
  }
} as const;

/**
 * Worker thread configuration for parallel processing
 */
export const WORKER_CONFIG = {
  // Worker pool settings
  POOL: {
    MIN_WORKERS: 2,
    MAX_WORKERS: 8,
    WORKER_IDLE_TIMEOUT: 60000,    // 60 seconds idle timeout
    TASK_TIMEOUT: 30000            // 30 seconds task timeout
  },
  
  // Task distribution
  TASKS: {
    MIN_BATCH_SIZE: 10,
    MAX_BATCH_SIZE: 1000,
    QUEUE_HIGH_WATER: 10000,       // Max queued tasks
    QUEUE_LOW_WATER: 1000          // Resume accepting tasks
  },
  
  // Communication settings
  COMMUNICATION: {
    MESSAGE_TIMEOUT: 5000,         // 5 seconds message timeout
    HEARTBEAT_INTERVAL: 10000,     // 10 seconds heartbeat
    MAX_RETRIES: 3
  }
} as const;

/**
 * Factorization strategy thresholds
 */
export const FACTORIZATION_STRATEGY = {
  // Bit length thresholds for strategy selection
  BIT_LENGTH: {
    TRIAL_DIVISION: 25,            // Use trial division for < 25 bits
    POLLARD_RHO: 100,             // Use Pollard's rho for 25-100 bits
    QUADRATIC_SIEVE: 200,         // Use QS for 100-200 bits
    GENERAL_NUMBER_FIELD: 300     // Use GNFS for > 200 bits
  },
  
  // Parallel factorization settings
  PARALLEL: {
    MIN_BIT_LENGTH: 100,          // Minimum size for parallel
    WORKER_COUNT: 4,              // Number of parallel workers
    CHUNK_SIZE: 1000              // Factors per chunk
  }
} as const;

/**
 * Type guards for constant validation
 */
export function isValidMemoryThreshold(value: number): boolean {
  return value >= 0 && value <= 1;
}

export function isValidChunkSize(size: number): boolean {
  return size >= STREAM_DEFAULTS.CHUNK_SIZE.MIN && 
         size <= STREAM_DEFAULTS.CHUNK_SIZE.MAX;
}

export function isValidConcurrency(level: number): boolean {
  return level >= STREAM_DEFAULTS.CONCURRENCY.MIN && 
         level <= STREAM_DEFAULTS.CONCURRENCY.MAX;
}

/**
 * Helper functions for dynamic calculations
 */
export function calculateOptimalChunkSize(memoryUsage: number): number {
  if (memoryUsage > OPTIMIZATION_THRESHOLDS.MEMORY.HIGH) {
    return Math.floor(STREAM_DEFAULTS.CHUNK_SIZE.DEFAULT * STREAM_DEFAULTS.CHUNK_SIZE.ADAPTIVE_FACTOR);
  }
  if (memoryUsage < OPTIMIZATION_THRESHOLDS.MEMORY.LOW) {
    return Math.min(
      STREAM_DEFAULTS.CHUNK_SIZE.DEFAULT * 2,
      STREAM_DEFAULTS.CHUNK_SIZE.MAX
    );
  }
  return STREAM_DEFAULTS.CHUNK_SIZE.DEFAULT;
}

export function calculateOptimalConcurrency(throughput: number): number {
  if (throughput < OPTIMIZATION_THRESHOLDS.THROUGHPUT.POOR) {
    return Math.min(
      STREAM_DEFAULTS.CONCURRENCY.DEFAULT + STREAM_DEFAULTS.CONCURRENCY.INCREMENT,
      STREAM_DEFAULTS.CONCURRENCY.MAX
    );
  }
  if (throughput > OPTIMIZATION_THRESHOLDS.THROUGHPUT.EXCELLENT) {
    return STREAM_DEFAULTS.CONCURRENCY.DEFAULT;
  }
  return STREAM_DEFAULTS.CONCURRENCY.DEFAULT;
}

export function getStrategyForBitLength(bitLength: number): 'trial' | 'parallel' | 'adaptive' {
  if (bitLength < FACTORIZATION_STRATEGY.BIT_LENGTH.TRIAL_DIVISION) {
    return 'trial';
  }
  if (bitLength > FACTORIZATION_STRATEGY.PARALLEL.MIN_BIT_LENGTH) {
    return 'parallel';
  }
  return 'adaptive';
}

/**
 * Helper function to calculate bit length of a bigint using precision module
 */
export function getBitLength(n: bigint): number {
  return MathUtilities.bitLength(n);
}
