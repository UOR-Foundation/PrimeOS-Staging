/**
 * Prime Registry Adapter Tests
 * ============================
 * 
 * Comprehensive tests for the prime registry adapter implementation.
 */

import {
  PrimeRegistryAdapter,
  createPrimeAdapter,
  createPrimeAdapterPool
} from './prime-adapter';

// Mock prime registry
const mockPrimeRegistry = {
  initialize: jest.fn(),
  terminate: jest.fn(),
  getPrime: jest.fn(),
  getIndex: jest.fn(),
  factor: jest.fn(),
  isPrime: jest.fn()
};

// Mock logger
const mockLogger = {
  debug: jest.fn().mockResolvedValue(undefined),
  info: jest.fn().mockResolvedValue(undefined),
  warn: jest.fn().mockResolvedValue(undefined),
  error: jest.fn().mockResolvedValue(undefined)
};

describe('PrimeRegistryAdapter', () => {
  let adapter: PrimeRegistryAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockPrimeRegistry.initialize.mockResolvedValue({ success: true });
    mockPrimeRegistry.getPrime.mockImplementation((idx: number) => BigInt(idx * 2 + 1));
    mockPrimeRegistry.getIndex.mockImplementation((prime: bigint) => Number((prime - 1n) / 2n));
    mockPrimeRegistry.factor.mockImplementation((n: bigint) => [
      { prime: 2n, exponent: 1 },
      { prime: 3n, exponent: 2 }
    ]);
    mockPrimeRegistry.isPrime.mockImplementation((n: bigint) => n > 1n && n % 2n !== 0n);
    
    adapter = new PrimeRegistryAdapter(mockPrimeRegistry as any, {
      enableCaching: true,
      maxCacheSize: 100,
      cacheExpiryMs: 1000,
      logger: mockLogger
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize the prime registry on first operation', async () => {
      await adapter.getPrime(5);
      
      expect(mockPrimeRegistry.initialize).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Prime registry adapter initialized',
        expect.objectContaining({
          enableCaching: true,
          maxCacheSize: 100
        })
      );
    });

    it('should only initialize once', async () => {
      await adapter.getPrime(5);
      await adapter.getIndex(11n);
      await adapter.factor(15n);
      
      expect(mockPrimeRegistry.initialize).toHaveBeenCalledTimes(1);
    });

    it('should throw error if initialization fails', async () => {
      mockPrimeRegistry.initialize.mockResolvedValue({ 
        success: false, 
        error: 'Init failed' 
      });
      
      await expect(adapter.getPrime(5)).rejects.toThrow('Failed to initialize prime registry: Init failed');
    });

    it('should throw error if registry is not provided', () => {
      expect(() => new PrimeRegistryAdapter(null as any)).toThrow(
        'Prime registry is required - no fallbacks allowed in production'
      );
    });
  });

  describe('getPrime', () => {
    it('should get prime at index', async () => {
      const result = await adapter.getPrime(5);
      
      expect(result).toBe(11n);
      expect(mockPrimeRegistry.getPrime).toHaveBeenCalledWith(5);
    });

    it('should cache prime values', async () => {
      await adapter.getPrime(5);
      await adapter.getPrime(5);
      
      expect(mockPrimeRegistry.getPrime).toHaveBeenCalledTimes(1);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
    });

    it('should handle errors', async () => {
      mockPrimeRegistry.getPrime.mockRejectedValue(new Error('Prime error'));
      
      await expect(adapter.getPrime(5)).rejects.toThrow('Prime error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Prime retrieval failed',
        expect.objectContaining({ index: 5 })
      );
      
      const metrics = adapter.getMetrics();
      expect(metrics.errorCount).toBe(1);
    });
  });

  describe('getIndex', () => {
    it('should get index of prime', async () => {
      const result = await adapter.getIndex(11n);
      
      expect(result).toBe(5);
      expect(mockPrimeRegistry.getIndex).toHaveBeenCalledWith(11n);
    });

    it('should cache index values', async () => {
      await adapter.getIndex(11n);
      await adapter.getIndex(11n);
      
      expect(mockPrimeRegistry.getIndex).toHaveBeenCalledTimes(1);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
    });

    it('should handle errors', async () => {
      mockPrimeRegistry.getIndex.mockRejectedValue(new Error('Index error'));
      
      await expect(adapter.getIndex(11n)).rejects.toThrow('Index error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Index retrieval failed',
        expect.objectContaining({ prime: '11' })
      );
    });
  });

  describe('factor', () => {
    it('should factor numbers', async () => {
      const result = await adapter.factor(12n);
      
      expect(result).toEqual([
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 2 }
      ]);
      expect(mockPrimeRegistry.factor).toHaveBeenCalledWith(12n);
    });

    it('should cache factorizations for small numbers', async () => {
      await adapter.factor(100n);
      await adapter.factor(100n);
      
      expect(mockPrimeRegistry.factor).toHaveBeenCalledTimes(1);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
    });

    it('should not cache factorizations for large numbers', async () => {
      const largeNumber = 1000001n;
      
      await adapter.factor(largeNumber);
      await adapter.factor(largeNumber);
      
      expect(mockPrimeRegistry.factor).toHaveBeenCalledTimes(2);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(0);
    });

    it('should handle errors', async () => {
      mockPrimeRegistry.factor.mockRejectedValue(new Error('Factor error'));
      
      await expect(adapter.factor(12n)).rejects.toThrow('Factor error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Factorization failed',
        expect.objectContaining({ n: '12' })
      );
    });
  });

  describe('isPrime', () => {
    it('should test primality', async () => {
      const result = await adapter.isPrime(11n);
      
      expect(result).toBe(true);
      expect(mockPrimeRegistry.isPrime).toHaveBeenCalledWith(11n);
    });

    it('should cache primality tests for small numbers', async () => {
      await adapter.isPrime(17n);
      await adapter.isPrime(17n);
      
      expect(mockPrimeRegistry.isPrime).toHaveBeenCalledTimes(1);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
    });

    it('should not cache primality tests for large numbers', async () => {
      const largeNumber = 1000001n;
      
      await adapter.isPrime(largeNumber);
      await adapter.isPrime(largeNumber);
      
      expect(mockPrimeRegistry.isPrime).toHaveBeenCalledTimes(2);
    });

    it('should handle errors', async () => {
      mockPrimeRegistry.isPrime.mockRejectedValue(new Error('Prime test error'));
      
      await expect(adapter.isPrime(11n)).rejects.toThrow('Prime test error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Primality test failed',
        expect.objectContaining({ n: '11' })
      );
    });
  });

  describe('batchProcess', () => {
    it('should process multiple operations in batch', async () => {
      const requests = [
        { type: 'getPrime' as const, input: 5, id: '1' },
        { type: 'getIndex' as const, input: 11n, id: '2' },
        { type: 'factor' as const, input: 12n, id: '3' },
        { type: 'isPrime' as const, input: 17n, id: '4' }
      ];
      
      const results = await adapter.batchProcess(requests);
      
      expect(results).toHaveLength(4);
      expect(results[0]).toEqual({ id: '1', result: 11n });
      expect(results[1]).toEqual({ id: '2', result: 5 });
      expect(results[2]).toEqual({ id: '3', result: [
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 2 }
      ]});
      expect(results[3]).toEqual({ id: '4', result: true });
    });

    it('should handle errors in batch operations', async () => {
      mockPrimeRegistry.getPrime.mockRejectedValue(new Error('Batch error'));
      
      const requests = [
        { type: 'getPrime' as const, input: 5, id: '1' },
        { type: 'isPrime' as const, input: 17n, id: '2' }
      ];
      
      const results = await adapter.batchProcess(requests);
      
      expect(results[0]).toEqual({
        id: '1',
        result: null,
        error: 'Batch error'
      });
      expect(results[1]).toEqual({ id: '2', result: true });
    });

    it('should handle unknown operation types', async () => {
      const requests = [
        { type: 'unknown' as any, input: 5, id: '1' }
      ];
      
      const results = await adapter.batchProcess(requests);
      
      expect(results[0]).toEqual({
        id: '1',
        result: null,
        error: 'Unknown batch operation type: unknown'
      });
    });

    it('should log batch processing completion', async () => {
      const requests = [
        { type: 'getPrime' as const, input: 5, id: '1' },
        { type: 'isPrime' as const, input: 17n, id: '2' }
      ];
      
      await adapter.batchProcess(requests);
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Batch processing completed',
        expect.objectContaining({
          requestCount: 2,
          successCount: 2,
          errorCount: 0
        })
      );
    });
  });

  describe('caching behavior', () => {
    it('should evict old entries when cache is full', async () => {
      const smallAdapter = new PrimeRegistryAdapter(mockPrimeRegistry as any, {
        enableCaching: true,
        maxCacheSize: 5,
        cacheExpiryMs: 60000
      });
      
      // Fill cache beyond limit
      for (let i = 0; i < 10; i++) {
        await smallAdapter.getPrime(i);
      }
      
      const cacheStats = smallAdapter.getCacheStats();
      expect(cacheStats.size).toBeLessThanOrEqual(5);
    });

    it('should expire cache entries after TTL', async () => {
      jest.useFakeTimers();
      
      await adapter.getPrime(5);
      
      // First access should hit cache
      await adapter.getPrime(5);
      let metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      
      // Advance time past TTL
      jest.advanceTimersByTime(2000);
      
      // Next access should miss cache
      await adapter.getPrime(5);
      metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(2);
    });

    it('should track access count for cache entries', async () => {
      await adapter.getPrime(5);
      await adapter.getPrime(5);
      await adapter.getPrime(5);
      
      const cacheStats = adapter.getCacheStats();
      const primeEntry = cacheStats.entries.find(e => e.key === 'prime:5');
      expect(primeEntry?.accessCount).toBe(3);
    });

    it('should clear cache on demand', async () => {
      await adapter.getPrime(5);
      await adapter.getIndex(11n);
      
      let cacheStats = adapter.getCacheStats();
      expect(cacheStats.size).toBe(2);
      
      adapter.clearCache();
      
      cacheStats = adapter.getCacheStats();
      expect(cacheStats.size).toBe(0);
      expect(mockLogger.debug).toHaveBeenCalledWith('Prime adapter cache cleared');
    });

    it('should work without caching when disabled', async () => {
      const noCacheAdapter = new PrimeRegistryAdapter(mockPrimeRegistry as any, {
        enableCaching: false
      });
      
      await noCacheAdapter.getPrime(5);
      await noCacheAdapter.getPrime(5);
      
      expect(mockPrimeRegistry.getPrime).toHaveBeenCalledTimes(2);
      
      const metrics = noCacheAdapter.getMetrics();
      expect(metrics.cacheHits).toBeUndefined();
      expect(metrics.cacheMisses).toBeUndefined();
    });
  });

  describe('synchronous methods', () => {
    beforeEach(async () => {
      // Initialize the adapter first
      await adapter.ensureInitialized();
    });

    it('should get prime synchronously', () => {
      const result = adapter.getPrimeSync(5);
      
      expect(result).toBe(11n);
      expect(mockPrimeRegistry.getPrime).toHaveBeenCalledWith(5);
    });

    it('should get index synchronously', () => {
      const result = adapter.getIndexSync(11n);
      
      expect(result).toBe(5);
      expect(mockPrimeRegistry.getIndex).toHaveBeenCalledWith(11n);
    });

    it('should factor synchronously', () => {
      const result = adapter.factorSync(12n);
      
      expect(result).toEqual([
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 2 }
      ]);
    });

    it('should test primality synchronously', () => {
      const result = adapter.isPrimeSync(11n);
      
      expect(result).toBe(true);
    });

    it('should throw if not initialized', () => {
      const uninitAdapter = new PrimeRegistryAdapter(mockPrimeRegistry as any);
      
      expect(() => uninitAdapter.getPrimeSync(5)).toThrow(
        'Prime registry not initialized - call ensureInitialized() first'
      );
    });

    it('should use cache in sync methods', () => {
      adapter.getPrimeSync(5);
      adapter.getPrimeSync(5);
      
      expect(mockPrimeRegistry.getPrime).toHaveBeenCalledTimes(1);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
    });
  });

  describe('metrics and stats', () => {
    it('should track all operation metrics', async () => {
      await adapter.getPrime(5);
      await adapter.getIndex(11n);
      await adapter.factor(12n);
      await adapter.isPrime(17n);
      
      const metrics = adapter.getMetrics();
      
      expect(metrics.primeRequests).toBe(1);
      expect(metrics.indexRequests).toBe(1);
      expect(metrics.factorizations).toBe(1);
      expect(metrics.primalityTests).toBe(1);
      expect(metrics.totalOperationTime).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    it('should calculate cache hit rate', async () => {
      await adapter.getPrime(5);
      await adapter.getPrime(5);
      await adapter.getPrime(6);
      
      const cacheStats = adapter.getCacheStats();
      expect(cacheStats.hitRate).toBe(1/3);
    });

    it('should provide cache entry details', async () => {
      await adapter.getPrime(5);
      await adapter.getIndex(11n);
      
      const cacheStats = adapter.getCacheStats();
      
      expect(cacheStats.entries).toHaveLength(2);
      expect(cacheStats.entries[0]).toHaveProperty('key');
      expect(cacheStats.entries[0]).toHaveProperty('accessCount');
      expect(cacheStats.entries[0]).toHaveProperty('age');
    });
  });

  describe('termination', () => {
    it('should terminate registry and clear cache', async () => {
      await adapter.getPrime(5);
      await adapter.terminate();
      
      expect(mockPrimeRegistry.terminate).toHaveBeenCalled();
      
      const cacheStats = adapter.getCacheStats();
      expect(cacheStats.size).toBe(0);
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Prime registry adapter terminated',
        expect.objectContaining({ finalMetrics: expect.any(Object) })
      );
    });

    it('should handle termination when not initialized', async () => {
      const uninitAdapter = new PrimeRegistryAdapter(mockPrimeRegistry as any);
      
      await expect(uninitAdapter.terminate()).resolves.not.toThrow();
      expect(mockPrimeRegistry.terminate).not.toHaveBeenCalled();
    });
  });
});

describe('createPrimeAdapter', () => {
  it('should create adapter with registry', () => {
    const adapter = createPrimeAdapter(mockPrimeRegistry as any);
    
    expect(adapter).toBeInstanceOf(PrimeRegistryAdapter);
  });

  it('should throw if registry is not provided', () => {
    expect(() => createPrimeAdapter(null as any)).toThrow(
      'Prime registry is required for production prime adapter - no fallbacks allowed'
    );
  });

  it('should pass options to adapter', () => {
    const adapter = createPrimeAdapter(mockPrimeRegistry as any, {
      enableCaching: false,
      maxCacheSize: 50
    });
    
    const cacheStats = adapter.getCacheStats();
    expect(cacheStats.size).toBe(0);
  });
});

describe('createPrimeAdapterPool', () => {
  it('should create multiple adapters', () => {
    const registries = [mockPrimeRegistry, mockPrimeRegistry, mockPrimeRegistry];
    const pool = createPrimeAdapterPool(registries as any[]);
    
    expect(pool).toHaveLength(3);
    pool.forEach(adapter => {
      expect(adapter).toBeInstanceOf(PrimeRegistryAdapter);
    });
  });

  it('should throw if no registries provided', () => {
    expect(() => createPrimeAdapterPool([])).toThrow(
      'At least one prime registry is required for adapter pool'
    );
  });

  it('should pass options to all adapters', () => {
    const registries = [mockPrimeRegistry, mockPrimeRegistry];
    const pool = createPrimeAdapterPool(registries as any[], {
      enableCaching: false
    });
    
    pool.forEach(adapter => {
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBeUndefined();
    });
  });
});
