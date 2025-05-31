/**
 * Stream Constants Tests
 * =====================
 * 
 * Tests for stream processing constants and helper functions.
 */

import {
  PRIME_CONSTANTS,
  MEMORY_CONSTANTS,
  OPTIMIZATION_THRESHOLDS,
  STREAM_DEFAULTS,
  WORKER_CONFIG,
  FACTORIZATION_STRATEGY,
  isValidMemoryThreshold,
  isValidChunkSize,
  isValidConcurrency,
  calculateOptimalChunkSize,
  calculateOptimalConcurrency,
  getStrategyForBitLength
} from './constants';

describe('Stream Constants', () => {
  describe('PRIME_CONSTANTS', () => {
    it('should define checksum prime threshold', () => {
      expect(PRIME_CONSTANTS.CHECKSUM_PRIME_THRESHOLD).toBe(1000000007n);
      expect(typeof PRIME_CONSTANTS.CHECKSUM_PRIME_THRESHOLD).toBe('bigint');
    });

    it('should define marker primes', () => {
      expect(PRIME_CONSTANTS.MARKER_PRIMES.POSITION).toBe(2n);
      expect(PRIME_CONSTANTS.MARKER_PRIMES.TYPE).toBe(3n);
      expect(PRIME_CONSTANTS.MARKER_PRIMES.METADATA).toBe(5n);
      expect(PRIME_CONSTANTS.MARKER_PRIMES.BOUNDARY).toBe(7n);
      expect(PRIME_CONSTANTS.MARKER_PRIMES.STREAM_START).toBe(11n);
      expect(PRIME_CONSTANTS.MARKER_PRIMES.STREAM_END).toBe(13n);
    });

    it('should define checksum mask', () => {
      expect(PRIME_CONSTANTS.CHECKSUM_MASK).toBe(0xFFFFFFFFn);
    });

    it('should define prime patterns', () => {
      expect(PRIME_CONSTANTS.PATTERNS.DATA_CHUNK).toEqual({ prime: 3n, exponent: 3 });
      expect(PRIME_CONSTANTS.PATTERNS.BLOCK_HEADER).toEqual({ prime: 5n, exponent: 2 });
      expect(PRIME_CONSTANTS.PATTERNS.NTT_HEADER).toEqual({ prime: 7n, exponent: 1 });
      expect(PRIME_CONSTANTS.PATTERNS.STREAM_MARKER).toEqual({ prime: 11n, exponent: 2 });
    });
  });

  describe('MEMORY_CONSTANTS', () => {
    it('should define base overhead values', () => {
      expect(MEMORY_CONSTANTS.BASE_OVERHEAD.PROCESSOR_INSTANCE).toBe(10 * 1024);
      expect(MEMORY_CONSTANTS.BASE_OVERHEAD.METRICS_TRACKING).toBe(2 * 1024);
      expect(MEMORY_CONSTANTS.BASE_OVERHEAD.CACHE_ENTRY).toBe(256);
      expect(MEMORY_CONSTANTS.BASE_OVERHEAD.BUFFER_OVERHEAD).toBe(512);
    });

    it('should define BigInt memory consumption', () => {
      expect(MEMORY_CONSTANTS.BIGINT_MEMORY.BYTES_PER_DIGIT).toBe(8);
      expect(MEMORY_CONSTANTS.BIGINT_MEMORY.BASE_OVERHEAD).toBe(64);
      expect(MEMORY_CONSTANTS.BIGINT_MEMORY.FACTOR_OVERHEAD).toBe(128);
    });

    it('should define adaptive caching allowances', () => {
      expect(MEMORY_CONSTANTS.ADAPTIVE_CACHING.SMALL_NUMBERS).toBe(10 * 1024);
      expect(MEMORY_CONSTANTS.ADAPTIVE_CACHING.MEDIUM_NUMBERS).toBe(50 * 1024);
      expect(MEMORY_CONSTANTS.ADAPTIVE_CACHING.LARGE_NUMBERS).toBe(200 * 1024);
    });
  });

  describe('OPTIMIZATION_THRESHOLDS', () => {
    it('should define memory thresholds', () => {
      expect(OPTIMIZATION_THRESHOLDS.MEMORY.LOW).toBe(0.5);
      expect(OPTIMIZATION_THRESHOLDS.MEMORY.MEDIUM).toBe(0.7);
      expect(OPTIMIZATION_THRESHOLDS.MEMORY.HIGH).toBe(0.85);
      expect(OPTIMIZATION_THRESHOLDS.MEMORY.CRITICAL).toBe(0.95);
    });

    it('should define throughput thresholds', () => {
      expect(OPTIMIZATION_THRESHOLDS.THROUGHPUT.POOR).toBe(100);
      expect(OPTIMIZATION_THRESHOLDS.THROUGHPUT.ACCEPTABLE).toBe(1000);
      expect(OPTIMIZATION_THRESHOLDS.THROUGHPUT.GOOD).toBe(10000);
      expect(OPTIMIZATION_THRESHOLDS.THROUGHPUT.EXCELLENT).toBe(100000);
    });

    it('should define latency thresholds', () => {
      expect(OPTIMIZATION_THRESHOLDS.LATENCY.EXCELLENT).toBe(1);
      expect(OPTIMIZATION_THRESHOLDS.LATENCY.GOOD).toBe(10);
      expect(OPTIMIZATION_THRESHOLDS.LATENCY.ACCEPTABLE).toBe(100);
      expect(OPTIMIZATION_THRESHOLDS.LATENCY.POOR).toBe(1000);
    });

    it('should define expected improvement percentages', () => {
      expect(OPTIMIZATION_THRESHOLDS.EXPECTED_IMPROVEMENT.MEMORY_REDUCTION).toBe(20);
      expect(OPTIMIZATION_THRESHOLDS.EXPECTED_IMPROVEMENT.THROUGHPUT_INCREASE).toBe(25);
      expect(OPTIMIZATION_THRESHOLDS.EXPECTED_IMPROVEMENT.LATENCY_REDUCTION).toBe(15);
      expect(OPTIMIZATION_THRESHOLDS.EXPECTED_IMPROVEMENT.CONCURRENCY_BOOST).toBe(30);
    });
  });

  describe('STREAM_DEFAULTS', () => {
    it('should define chunk size defaults', () => {
      expect(STREAM_DEFAULTS.CHUNK_SIZE.MIN).toBe(64);
      expect(STREAM_DEFAULTS.CHUNK_SIZE.DEFAULT).toBe(1024);
      expect(STREAM_DEFAULTS.CHUNK_SIZE.MAX).toBe(8192);
      expect(STREAM_DEFAULTS.CHUNK_SIZE.ADAPTIVE_FACTOR).toBe(0.75);
    });

    it('should define concurrency settings', () => {
      expect(STREAM_DEFAULTS.CONCURRENCY.MIN).toBe(1);
      expect(STREAM_DEFAULTS.CONCURRENCY.DEFAULT).toBe(4);
      expect(STREAM_DEFAULTS.CONCURRENCY.MAX).toBe(16);
      expect(STREAM_DEFAULTS.CONCURRENCY.INCREMENT).toBe(2);
    });

    it('should define buffer sizes', () => {
      expect(STREAM_DEFAULTS.BUFFER.MIN).toBe(1024);
      expect(STREAM_DEFAULTS.BUFFER.DEFAULT).toBe(8192);
      expect(STREAM_DEFAULTS.BUFFER.MAX).toBe(65536);
      expect(STREAM_DEFAULTS.BUFFER.BACKPRESSURE_REDUCTION).toBe(0.5);
    });

    it('should define timing intervals', () => {
      expect(STREAM_DEFAULTS.INTERVALS.METRICS_UPDATE).toBe(1000);
      expect(STREAM_DEFAULTS.INTERVALS.OPTIMIZATION_CHECK).toBe(5000);
      expect(STREAM_DEFAULTS.INTERVALS.MEMORY_MONITOR).toBe(500);
      expect(STREAM_DEFAULTS.INTERVALS.COORDINATED_OPTIMIZATION).toBe(30000);
    });
  });

  describe('WORKER_CONFIG', () => {
    it('should define worker pool settings', () => {
      expect(WORKER_CONFIG.POOL.MIN_WORKERS).toBe(2);
      expect(WORKER_CONFIG.POOL.MAX_WORKERS).toBe(8);
      expect(WORKER_CONFIG.POOL.WORKER_IDLE_TIMEOUT).toBe(60000);
      expect(WORKER_CONFIG.POOL.TASK_TIMEOUT).toBe(30000);
    });

    it('should define task distribution settings', () => {
      expect(WORKER_CONFIG.TASKS.MIN_BATCH_SIZE).toBe(10);
      expect(WORKER_CONFIG.TASKS.MAX_BATCH_SIZE).toBe(1000);
      expect(WORKER_CONFIG.TASKS.QUEUE_HIGH_WATER).toBe(10000);
      expect(WORKER_CONFIG.TASKS.QUEUE_LOW_WATER).toBe(1000);
    });

    it('should define communication settings', () => {
      expect(WORKER_CONFIG.COMMUNICATION.MESSAGE_TIMEOUT).toBe(5000);
      expect(WORKER_CONFIG.COMMUNICATION.HEARTBEAT_INTERVAL).toBe(10000);
      expect(WORKER_CONFIG.COMMUNICATION.MAX_RETRIES).toBe(3);
    });
  });

  describe('FACTORIZATION_STRATEGY', () => {
    it('should define bit length thresholds', () => {
      expect(FACTORIZATION_STRATEGY.BIT_LENGTH.TRIAL_DIVISION).toBe(50);
      expect(FACTORIZATION_STRATEGY.BIT_LENGTH.POLLARD_RHO).toBe(100);
      expect(FACTORIZATION_STRATEGY.BIT_LENGTH.QUADRATIC_SIEVE).toBe(200);
      expect(FACTORIZATION_STRATEGY.BIT_LENGTH.GENERAL_NUMBER_FIELD).toBe(300);
    });

    it('should define parallel factorization settings', () => {
      expect(FACTORIZATION_STRATEGY.PARALLEL.MIN_BIT_LENGTH).toBe(100);
      expect(FACTORIZATION_STRATEGY.PARALLEL.WORKER_COUNT).toBe(4);
      expect(FACTORIZATION_STRATEGY.PARALLEL.CHUNK_SIZE).toBe(1000);
    });
  });

  describe('Validation Functions', () => {
    describe('isValidMemoryThreshold', () => {
      it('should validate memory thresholds', () => {
        expect(isValidMemoryThreshold(0)).toBe(true);
        expect(isValidMemoryThreshold(0.5)).toBe(true);
        expect(isValidMemoryThreshold(1)).toBe(true);
        expect(isValidMemoryThreshold(-0.1)).toBe(false);
        expect(isValidMemoryThreshold(1.1)).toBe(false);
        expect(isValidMemoryThreshold(NaN)).toBe(false);
      });
    });

    describe('isValidChunkSize', () => {
      it('should validate chunk sizes', () => {
        expect(isValidChunkSize(64)).toBe(true);
        expect(isValidChunkSize(1024)).toBe(true);
        expect(isValidChunkSize(8192)).toBe(true);
        expect(isValidChunkSize(63)).toBe(false);
        expect(isValidChunkSize(8193)).toBe(false);
        expect(isValidChunkSize(0)).toBe(false);
        expect(isValidChunkSize(-1)).toBe(false);
      });
    });

    describe('isValidConcurrency', () => {
      it('should validate concurrency levels', () => {
        expect(isValidConcurrency(1)).toBe(true);
        expect(isValidConcurrency(4)).toBe(true);
        expect(isValidConcurrency(16)).toBe(true);
        expect(isValidConcurrency(0)).toBe(false);
        expect(isValidConcurrency(17)).toBe(false);
        expect(isValidConcurrency(-1)).toBe(false);
      });
    });
  });

  describe('Calculation Functions', () => {
    describe('calculateOptimalChunkSize', () => {
      it('should reduce chunk size under high memory pressure', () => {
        const highUsage = 0.9; // 90% memory usage
        const result = calculateOptimalChunkSize(highUsage);
        expect(result).toBe(Math.floor(STREAM_DEFAULTS.CHUNK_SIZE.DEFAULT * STREAM_DEFAULTS.CHUNK_SIZE.ADAPTIVE_FACTOR));
      });

      it('should increase chunk size under low memory pressure', () => {
        const lowUsage = 0.3; // 30% memory usage
        const result = calculateOptimalChunkSize(lowUsage);
        expect(result).toBe(Math.min(STREAM_DEFAULTS.CHUNK_SIZE.DEFAULT * 2, STREAM_DEFAULTS.CHUNK_SIZE.MAX));
      });

      it('should maintain default size for medium memory usage', () => {
        const mediumUsage = 0.6; // 60% memory usage
        const result = calculateOptimalChunkSize(mediumUsage);
        expect(result).toBe(STREAM_DEFAULTS.CHUNK_SIZE.DEFAULT);
      });
    });

    describe('calculateOptimalConcurrency', () => {
      it('should increase concurrency for poor throughput', () => {
        const poorThroughput = 50; // Below POOR threshold
        const result = calculateOptimalConcurrency(poorThroughput);
        expect(result).toBe(Math.min(
          STREAM_DEFAULTS.CONCURRENCY.DEFAULT + STREAM_DEFAULTS.CONCURRENCY.INCREMENT,
          STREAM_DEFAULTS.CONCURRENCY.MAX
        ));
      });

      it('should maintain default concurrency for excellent throughput', () => {
        const excellentThroughput = 150000; // Above EXCELLENT threshold
        const result = calculateOptimalConcurrency(excellentThroughput);
        expect(result).toBe(STREAM_DEFAULTS.CONCURRENCY.DEFAULT);
      });

      it('should maintain default concurrency for good throughput', () => {
        const goodThroughput = 5000; // Between POOR and EXCELLENT
        const result = calculateOptimalConcurrency(goodThroughput);
        expect(result).toBe(STREAM_DEFAULTS.CONCURRENCY.DEFAULT);
      });
    });

    describe('getStrategyForBitLength', () => {
      it('should return trial strategy for small numbers', () => {
        expect(getStrategyForBitLength(30)).toBe('trial');
        expect(getStrategyForBitLength(49)).toBe('trial');
      });

      it('should return adaptive strategy for medium numbers', () => {
        expect(getStrategyForBitLength(50)).toBe('adaptive');
        expect(getStrategyForBitLength(75)).toBe('adaptive');
        expect(getStrategyForBitLength(99)).toBe('adaptive');
      });

      it('should return parallel strategy for large numbers', () => {
        expect(getStrategyForBitLength(100)).toBe('adaptive');
        expect(getStrategyForBitLength(101)).toBe('parallel');
        expect(getStrategyForBitLength(500)).toBe('parallel');
      });
    });
  });

  describe('Constants Immutability', () => {
    it('should not allow modification of constants', () => {
      // Test that constants are frozen
      expect(() => {
        (PRIME_CONSTANTS as any).CHECKSUM_PRIME_THRESHOLD = 123n;
      }).toThrow();

      expect(() => {
        (MEMORY_CONSTANTS as any).BASE_OVERHEAD.PROCESSOR_INSTANCE = 999;
      }).toThrow();

      expect(() => {
        (OPTIMIZATION_THRESHOLDS as any).MEMORY.LOW = 0.1;
      }).toThrow();
    });
  });
});
