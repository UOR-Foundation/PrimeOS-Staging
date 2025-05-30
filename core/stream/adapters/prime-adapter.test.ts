/**
 * Prime Stream Adapter Tests
 * ==========================
 * 
 * Tests for the prime stream adapter functionality.
 */

import { 
  PrimeStreamAdapter,
  createPrimeStreamAdapter,
  createEnhancedPrimeStreamAdapter
} from './prime-adapter';
import { PrimeRegistryInterface, Factor } from '../../prime/types';

// Mock prime registry
const mockPrimeRegistry: PrimeRegistryInterface = {
  getPrime: jest.fn().mockImplementation((index: number) => {
    const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
    if (index < primes.length) {
      return primes[index];
    }
    // Generate primes for indices beyond our array
    return BigInt(30 + (index - primes.length) * 2 + 1);
  }),
  getIndex: jest.fn().mockImplementation((prime: bigint) => {
    const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
    const index = primes.indexOf(prime);
    return index >= 0 ? index : Number(prime);
  }),
  factor: jest.fn().mockImplementation((n: bigint) => {
    if (n === 12n) return [{ prime: 2n, exponent: 2 }, { prime: 3n, exponent: 1 }];
    if (n === 30n) return [{ prime: 2n, exponent: 1 }, { prime: 3n, exponent: 1 }, { prime: 5n, exponent: 1 }];
    return [{ prime: n, exponent: 1 }];
  }),
  isPrime: jest.fn().mockImplementation((n: bigint) => {
    const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
    return primes.includes(n);
  }),
  extendTo: jest.fn().mockResolvedValue(undefined),
  integerSqrt: jest.fn().mockImplementation((n: bigint) => {
    // Simple approximation for testing
    return BigInt(Math.floor(Math.sqrt(Number(n))));
  }),
  createPrimeStream: jest.fn().mockImplementation(async function* () {
    const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
    for (const prime of primes) {
      yield prime;
    }
  }),
  createFactorStream: jest.fn().mockImplementation(async function* (numbers: AsyncIterable<bigint>) {
    for await (const n of numbers) {
      if (n === 12n) yield [{ prime: 2n, exponent: 2 }, { prime: 3n, exponent: 1 }];
      else if (n === 30n) yield [{ prime: 2n, exponent: 1 }, { prime: 3n, exponent: 1 }, { prime: 5n, exponent: 1 }];
      else yield [{ prime: n, exponent: 1 }];
    }
  }),
  createStreamProcessor: jest.fn().mockReturnValue({
    process: jest.fn().mockResolvedValue({ success: true })
  }),
  factorizeStreaming: jest.fn().mockImplementation(async function* (numbers: AsyncIterable<bigint>) {
    for await (const n of numbers) {
      if (n === 12n) yield [{ prime: 2n, exponent: 2 }, { prime: 3n, exponent: 1 }];
      else if (n === 30n) yield [{ prime: 2n, exponent: 1 }, { prime: 3n, exponent: 1 }, { prime: 5n, exponent: 1 }];
      else yield [{ prime: n, exponent: 1 }];
    }
  })
};

// Mock logger
const mockLogger: any = {
  debug: jest.fn().mockResolvedValue(undefined),
  info: jest.fn().mockResolvedValue(undefined),
  warn: jest.fn().mockResolvedValue(undefined),
  error: jest.fn().mockResolvedValue(undefined)
};

// Helper to convert array to async iterable
async function* arrayToAsyncIterable<T>(array: T[]): AsyncIterable<T> {
  for (const item of array) {
    yield item;
  }
}

// Helper to collect async iterable to array
async function collectAsyncIterable<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
}

describe('PrimeStreamAdapter', () => {
  let adapter: PrimeStreamAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup mocks after clearing
    mockPrimeRegistry.getPrime = jest.fn().mockImplementation((index: number) => {
      const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
      if (index < primes.length) {
        return primes[index];
      }
      // Generate primes for indices beyond our array
      return BigInt(30 + (index - primes.length) * 2 + 1);
    });
    mockPrimeRegistry.factor = jest.fn().mockImplementation((n: bigint) => {
      if (n === 12n) return [{ prime: 2n, exponent: 2 }, { prime: 3n, exponent: 1 }];
      if (n === 30n) return [{ prime: 2n, exponent: 1 }, { prime: 3n, exponent: 1 }, { prime: 5n, exponent: 1 }];
      return [{ prime: n, exponent: 1 }];
    });
    mockPrimeRegistry.isPrime = jest.fn().mockImplementation((n: bigint) => {
      const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
      return primes.includes(n);
    });
    adapter = new PrimeStreamAdapter({
      primeRegistry: mockPrimeRegistry,
      logger: mockLogger,
      enableCaching: false
    });
  });

  describe('generatePrimeStream', () => {
    it('should generate consecutive primes', async () => {
      const stream = adapter.generatePrimeStream(0, 5);
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual([2n, 3n, 5n, 7n, 11n]);
      expect(mockPrimeRegistry.getPrime).toHaveBeenCalledTimes(5);
    });

    it('should generate primes from specified index', async () => {
      const stream = adapter.generatePrimeStream(3, 3);
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual([7n, 11n, 13n]);
      expect(mockPrimeRegistry.getPrime).toHaveBeenCalledWith(3);
      expect(mockPrimeRegistry.getPrime).toHaveBeenCalledWith(4);
      expect(mockPrimeRegistry.getPrime).toHaveBeenCalledWith(5);
    });

    it('should generate unlimited primes when count is undefined', async () => {
      const stream = adapter.generatePrimeStream(0);
      const result: bigint[] = [];
      
      // Take only first 3 to avoid infinite loop
      let count = 0;
      for await (const prime of stream) {
        result.push(prime);
        if (++count >= 3) break;
      }

      expect(result).toEqual([2n, 3n, 5n]);
    });

    it('should validate input parameters', async () => {
      await expect(collectAsyncIterable(adapter.generatePrimeStream(-1))).rejects.toThrow('non-negative integer');
      await expect(collectAsyncIterable(adapter.generatePrimeStream(1.5))).rejects.toThrow('non-negative integer');
      await expect(collectAsyncIterable(adapter.generatePrimeStream(0, -1))).rejects.toThrow('non-negative integer');
    });

    it('should track statistics', async () => {
      await collectAsyncIterable(adapter.generatePrimeStream(0, 3));
      
      const stats = adapter.getStreamStats();
      expect(stats.primesGenerated).toBe(3);
      expect(stats.largestPrimeGenerated).toBe(5n);
      expect(stats.errors).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockPrimeRegistry.getPrime = jest.fn().mockImplementation(() => {
        throw new Error('Registry error');
      });

      const stream = adapter.generatePrimeStream(0, 2);
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual([]); // Should stop on first error
      expect(mockLogger.warn).toHaveBeenCalled();
      
      const stats = adapter.getStreamStats();
      expect(stats.errors).toBe(1);
    });
  });

  describe('factorizeStream', () => {
    it('should factorize numbers', async () => {
      const input = [12n, 30n];
      const stream = adapter.factorizeStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual([{ prime: 2n, exponent: 2 }, { prime: 3n, exponent: 1 }]);
      expect(result[1]).toEqual([{ prime: 2n, exponent: 1 }, { prime: 3n, exponent: 1 }, { prime: 5n, exponent: 1 }]);
    });

    it('should track statistics', async () => {
      const input = [12n, 30n, 7n];
      await collectAsyncIterable(adapter.factorizeStream(arrayToAsyncIterable(input)));

      const stats = adapter.getStreamStats();
      expect(stats.numbersFactorized).toBe(3);
      expect(stats.largestNumberFactorized).toBe(30n);
    });

    it('should handle errors by yielding empty array', async () => {
      mockPrimeRegistry.factor = jest.fn().mockImplementation(() => {
        throw new Error('Factor error');
      });

      const input = [12n];
      const stream = adapter.factorizeStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual([[]]);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should use cache when enabled', async () => {
      adapter = new PrimeStreamAdapter({
        primeRegistry: mockPrimeRegistry,
        logger: mockLogger,
        enableCaching: true,
        cacheMaxSize: 10
      });

      const input = [12n, 12n, 12n]; // Same number 3 times
      await collectAsyncIterable(adapter.factorizeStream(arrayToAsyncIterable(input)));

      expect(mockPrimeRegistry.factor).toHaveBeenCalledTimes(1); // Only called once due to caching
      
      const stats = adapter.getStreamStats();
      expect(stats.cacheHits).toBe(2);
      expect(stats.cacheMisses).toBe(1);
    });
  });

  describe('primalityTestStream', () => {
    it('should test primality of numbers', async () => {
      const input = [2n, 4n, 5n, 6n, 7n];
      const stream = adapter.primalityTestStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toHaveLength(5);
      expect(result[0]).toEqual({ number: 2n, isPrime: true, testTime: expect.any(Number) });
      expect(result[1]).toEqual({ number: 4n, isPrime: false, testTime: expect.any(Number) });
      expect(result[2]).toEqual({ number: 5n, isPrime: true, testTime: expect.any(Number) });
      expect(result[3]).toEqual({ number: 6n, isPrime: false, testTime: expect.any(Number) });
      expect(result[4]).toEqual({ number: 7n, isPrime: true, testTime: expect.any(Number) });
    });

    it('should track statistics', async () => {
      const input = [2n, 3n, 4n, 5n];
      await collectAsyncIterable(adapter.primalityTestStream(arrayToAsyncIterable(input)));

      const stats = adapter.getStreamStats();
      expect(stats.primalityTests).toBe(4);
      expect(stats.primalityTestsPassed).toBe(3);
    });

    it('should handle errors', async () => {
      mockPrimeRegistry.isPrime = jest.fn().mockImplementation(() => {
        throw new Error('Prime test error');
      });

      const input = [7n];
      const stream = adapter.primalityTestStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result[0]).toEqual({
        number: 7n,
        isPrime: false,
        testTime: expect.any(Number)
      });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should use cache when enabled', async () => {
      adapter = new PrimeStreamAdapter({
        primeRegistry: mockPrimeRegistry,
        logger: mockLogger,
        enableCaching: true
      });

      const input = [7n, 7n, 7n]; // Same number 3 times
      await collectAsyncIterable(adapter.primalityTestStream(arrayToAsyncIterable(input)));

      expect(mockPrimeRegistry.isPrime).toHaveBeenCalledTimes(1); // Only called once
      
      const stats = adapter.getStreamStats();
      expect(stats.cacheHits).toBe(2);
      expect(stats.cacheMisses).toBe(1);
    });
  });

  describe('reconstructStream', () => {
    it('should reconstruct numbers from factors', async () => {
      const input: Factor[][] = [
        [{ prime: 2n, exponent: 2 }, { prime: 3n, exponent: 1 }], // 12
        [{ prime: 2n, exponent: 1 }, { prime: 5n, exponent: 2 }]  // 50
      ];
      const stream = adapter.reconstructStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual([12n, 50n]);
    });

    it('should handle empty factor list', async () => {
      const input: Factor[][] = [[]];
      const stream = adapter.reconstructStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual([1n]);
    });

    it('should track statistics', async () => {
      const input: Factor[][] = [
        [{ prime: 2n, exponent: 1 }],
        [{ prime: 3n, exponent: 1 }]
      ];
      await collectAsyncIterable(adapter.reconstructStream(arrayToAsyncIterable(input)));

      const stats = adapter.getStreamStats();
      expect(stats.numbersReconstructed).toBe(2);
    });

    it('should handle errors by yielding 1', async () => {
      const input: Factor[][] = [[{ prime: 2n, exponent: -1 }]]; // Invalid exponent
      
      // Mock the error by temporarily replacing the method
      const originalFactor = mockPrimeRegistry.factor;
      mockPrimeRegistry.factor = jest.fn().mockImplementation(() => {
        throw new Error('Invalid factorization');
      });
      
      // Create a new adapter to test error handling in reconstruction
      const errorAdapter = new PrimeStreamAdapter({
        primeRegistry: mockPrimeRegistry,
        logger: mockLogger,
        enableCaching: false
      });
      
      const stream = errorAdapter.reconstructStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);
      
      // Restore original mock
      mockPrimeRegistry.factor = originalFactor;
      
      expect(result).toEqual([1n]); // Should yield 1n on error
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('filterPrimesStream', () => {
    it('should filter only prime numbers', async () => {
      const input = [2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 11n];
      const stream = adapter.filterPrimesStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual([2n, 3n, 5n, 7n, 11n]);
    });

    it('should track statistics', async () => {
      const input = [2n, 3n, 4n, 5n, 6n];
      await collectAsyncIterable(adapter.filterPrimesStream(arrayToAsyncIterable(input)));

      const stats = adapter.getStreamStats();
      expect(stats.primesFiltered).toBe(3);
    });

    it('should handle errors by skipping numbers', async () => {
      let callCount = 0;
      mockPrimeRegistry.isPrime = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) throw new Error('Prime test error');
        return callCount % 2 === 1;
      });

      const input = [2n, 3n, 5n];
      const stream = adapter.filterPrimesStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual([2n, 5n]); // 3n was skipped due to error
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('caching', () => {
    beforeEach(() => {
      adapter = new PrimeStreamAdapter({
        primeRegistry: mockPrimeRegistry,
        logger: mockLogger,
        enableCaching: true,
        cacheMaxSize: 3,
        cacheTTL: 1000
      });
    });

    it('should evict old entries when cache is full', async () => {
      const input = [2n, 3n, 5n, 7n]; // 4 items, cache size is 3
      await collectAsyncIterable(adapter.primalityTestStream(arrayToAsyncIterable(input)));

      // Test first item again - should be cache miss (evicted)
      await collectAsyncIterable(adapter.primalityTestStream(arrayToAsyncIterable([2n])));

      const stats = adapter.getStreamStats();
      expect(stats.cacheMisses).toBe(5); // 4 initial + 1 after eviction
    });

    it('should expire cache entries after TTL', async () => {
      adapter = new PrimeStreamAdapter({
        primeRegistry: mockPrimeRegistry,
        logger: mockLogger,
        enableCaching: true,
        cacheTTL: 50 // 50ms TTL
      });

      const input = [7n];
      await collectAsyncIterable(adapter.primalityTestStream(arrayToAsyncIterable(input)));

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test same number again - should be cache miss
      await collectAsyncIterable(adapter.primalityTestStream(arrayToAsyncIterable([7n])));

      const stats = adapter.getStreamStats();
      expect(stats.cacheMisses).toBe(2);
      expect(stats.cacheHits).toBe(0);
    });

    it('should clear caches', () => {
      adapter.clearCaches();
      expect(mockLogger.debug).toHaveBeenCalledWith('Prime adapter caches cleared');
    });
  });

  describe('statistics and configuration', () => {
    it('should get comprehensive statistics', async () => {
      const primeInput = [2n, 3n, 5n];
      await collectAsyncIterable(adapter.filterPrimesStream(arrayToAsyncIterable(primeInput)));

      const stats = adapter.getStreamStats();
      expect(stats).toMatchObject({
        primesGenerated: 0,
        numbersFactorized: 0,
        primalityTests: 0,
        primalityTestsPassed: 0,
        numbersReconstructed: 0,
        primesFiltered: 3,
        errors: 0,
        registrySize: 0,
        cacheUtilization: 0
      });
      expect(stats.totalProcessingTime).toBeGreaterThan(0);
    });

    it('should reset statistics', async () => {
      await collectAsyncIterable(adapter.generatePrimeStream(0, 2));
      
      let stats = adapter.getStreamStats();
      expect(stats.primesGenerated).toBe(2);

      adapter.resetStats();
      stats = adapter.getStreamStats();
      expect(stats.primesGenerated).toBe(0);
      expect(stats.numbersFactorized).toBe(0);
      expect(stats.totalProcessingTime).toBe(0);
    });

    it('should get prime registry', () => {
      expect(adapter.getPrimeRegistry()).toBe(mockPrimeRegistry);
    });

    it('should set logger', () => {
      const newLogger = { ...mockLogger };
      adapter.setLogger(newLogger);
      // Logger is now set and will be used in subsequent operations
    });
  });
});

describe('createPrimeStreamAdapter', () => {
  it('should create adapter with dependencies', () => {
    const adapter = createPrimeStreamAdapter({
      primeRegistry: mockPrimeRegistry,
      logger: mockLogger
    });

    expect(adapter).toBeInstanceOf(PrimeStreamAdapter);
    expect(adapter.getPrimeRegistry()).toBe(mockPrimeRegistry);
  });
});

describe('createEnhancedPrimeStreamAdapter', () => {
  it('should create adapter with enhanced capabilities', () => {
    const adapter = createEnhancedPrimeStreamAdapter({
      primeRegistry: mockPrimeRegistry,
      logger: mockLogger,
      enableCaching: true,
      cacheMaxSize: 500,
      cacheTTL: 30000,
      batchSize: 50
    });

    expect(adapter).toBeInstanceOf(PrimeStreamAdapter);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Enhanced prime stream adapter created',
      expect.objectContaining({
        enableCaching: true,
        cacheMaxSize: 500,
        cacheTTL: 30000,
        batchSize: 50
      })
    );
  });

  it('should use default values when not specified', () => {
    const adapter = createEnhancedPrimeStreamAdapter({
      primeRegistry: mockPrimeRegistry
    });

    expect(adapter).toBeInstanceOf(PrimeStreamAdapter);
    // Defaults are applied in the factory function
  });
});
