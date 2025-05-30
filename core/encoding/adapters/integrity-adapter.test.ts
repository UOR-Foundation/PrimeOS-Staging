/**
 * Integrity Module Adapter Tests
 * ===============================
 * 
 * Comprehensive tests for the integrity module adapter implementation.
 */

import {
  IntegrityAdapter,
  createIntegrityAdapter,
  createIntegrityAdapterPool
} from './integrity-adapter';
import { Factor, VerificationResult, ChecksumExtraction } from '../../integrity/types';

// Mock integrity module
const mockIntegrityModule = {
  initialize: jest.fn(),
  terminate: jest.fn(),
  generateChecksum: jest.fn(),
  attachChecksum: jest.fn(),
  verifyIntegrity: jest.fn(),
  extractChecksum: jest.fn(),
  calculateXorSum: jest.fn(),
  verifyBatch: jest.fn()
};

// Mock logger
const mockLogger = {
  debug: jest.fn().mockResolvedValue(undefined),
  info: jest.fn().mockResolvedValue(undefined),
  warn: jest.fn().mockResolvedValue(undefined),
  error: jest.fn().mockResolvedValue(undefined)
};

// Test factors
const testFactors: Factor[] = [
  { prime: 2n, exponent: 3 },
  { prime: 3n, exponent: 1 },
  { prime: 5n, exponent: 2 }
];

describe('IntegrityAdapter', () => {
  let adapter: IntegrityAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockIntegrityModule.initialize.mockResolvedValue({ success: true });
    mockIntegrityModule.generateChecksum.mockResolvedValue(7n);
    mockIntegrityModule.attachChecksum.mockResolvedValue(1234567n);
    mockIntegrityModule.verifyIntegrity.mockResolvedValue({
      valid: true,
      checksum: 7n,
      coreFactors: testFactors
    });
    mockIntegrityModule.extractChecksum.mockResolvedValue({
      coreFactors: testFactors,
      checksumPrime: 7n,
      checksumExponent: 6,
      valid: true
    });
    mockIntegrityModule.calculateXorSum.mockResolvedValue(123);
    mockIntegrityModule.verifyBatch.mockImplementation(async (values: bigint[]) => 
      values.map(() => ({ valid: true, checksum: 7n }))
    );
    
    adapter = new IntegrityAdapter(mockIntegrityModule as any, {
      enableCaching: true,
      maxCacheSize: 50,
      cacheExpiryMs: 1000,
      logger: mockLogger
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize the integrity module on first operation', async () => {
      await adapter.generateChecksum(testFactors);
      
      expect(mockIntegrityModule.initialize).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Integrity adapter initialized',
        expect.objectContaining({
          enableCaching: true,
          maxCacheSize: 50
        })
      );
    });

    it('should only initialize once', async () => {
      await adapter.generateChecksum(testFactors);
      await adapter.verifyIntegrity(123n);
      await adapter.calculateXorSum(testFactors);
      
      expect(mockIntegrityModule.initialize).toHaveBeenCalledTimes(1);
    });

    it('should throw error if initialization fails', async () => {
      mockIntegrityModule.initialize.mockResolvedValue({ 
        success: false, 
        error: 'Init failed' 
      });
      
      await expect(adapter.generateChecksum(testFactors)).rejects.toThrow(
        'Failed to initialize integrity module: Init failed'
      );
    });

    it('should throw error if module is not provided', () => {
      expect(() => new IntegrityAdapter(null as any)).toThrow(
        'Integrity module is required - no fallbacks allowed in production'
      );
    });
  });

  describe('generateChecksum', () => {
    it('should generate checksum from factors', async () => {
      const result = await adapter.generateChecksum(testFactors);
      
      expect(result).toBe(7n);
      expect(mockIntegrityModule.generateChecksum).toHaveBeenCalledWith(testFactors, undefined);
    });

    it('should cache checksum generation', async () => {
      await adapter.generateChecksum(testFactors);
      await adapter.generateChecksum(testFactors);
      
      expect(mockIntegrityModule.generateChecksum).toHaveBeenCalledTimes(1);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
    });

    it('should pass prime registry if provided', async () => {
      const mockRegistry = { getPrime: jest.fn() };
      await adapter.generateChecksum(testFactors, mockRegistry);
      
      expect(mockIntegrityModule.generateChecksum).toHaveBeenCalledWith(testFactors, mockRegistry);
    });

    it('should handle errors', async () => {
      mockIntegrityModule.generateChecksum.mockRejectedValue(new Error('Checksum error'));
      
      await expect(adapter.generateChecksum(testFactors)).rejects.toThrow('Checksum error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Checksum generation failed',
        expect.objectContaining({ factorCount: 3 })
      );
      
      const metrics = adapter.getMetrics();
      expect(metrics.errorCount).toBe(1);
    });
  });

  describe('attachChecksum', () => {
    it('should attach checksum to value', async () => {
      const result = await adapter.attachChecksum(1000n, testFactors);
      
      expect(result).toBe(1234567n);
      expect(mockIntegrityModule.attachChecksum).toHaveBeenCalledWith(1000n, testFactors, undefined);
    });

    it('should cache attachment for small values', async () => {
      await adapter.attachChecksum(100n, testFactors);
      await adapter.attachChecksum(100n, testFactors);
      
      expect(mockIntegrityModule.attachChecksum).toHaveBeenCalledTimes(1);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
    });

    it('should not cache attachment for large values', async () => {
      const largeValue = 1000001n;
      
      await adapter.attachChecksum(largeValue, testFactors);
      await adapter.attachChecksum(largeValue, testFactors);
      
      expect(mockIntegrityModule.attachChecksum).toHaveBeenCalledTimes(2);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(0);
    });

    it('should handle errors', async () => {
      mockIntegrityModule.attachChecksum.mockRejectedValue(new Error('Attach error'));
      
      await expect(adapter.attachChecksum(100n, testFactors)).rejects.toThrow('Attach error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Checksum attachment failed',
        expect.objectContaining({ 
          value: '100',
          factorCount: 3
        })
      );
    });
  });

  describe('verifyIntegrity', () => {
    it('should verify integrity of value', async () => {
      const result = await adapter.verifyIntegrity(1234567n);
      
      expect(result).toEqual({
        valid: true,
        checksum: 7n,
        coreFactors: testFactors
      });
      expect(mockIntegrityModule.verifyIntegrity).toHaveBeenCalledWith(1234567n, undefined);
    });

    it('should cache verification for small values', async () => {
      await adapter.verifyIntegrity(100n);
      await adapter.verifyIntegrity(100n);
      
      expect(mockIntegrityModule.verifyIntegrity).toHaveBeenCalledTimes(1);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
    });

    it('should not cache failed verifications', async () => {
      mockIntegrityModule.verifyIntegrity.mockResolvedValue({
        valid: false,
        error: 'Invalid checksum'
      });
      
      await adapter.verifyIntegrity(100n);
      await adapter.verifyIntegrity(100n);
      
      expect(mockIntegrityModule.verifyIntegrity).toHaveBeenCalledTimes(2);
    });

    it('should track integrity failures', async () => {
      mockIntegrityModule.verifyIntegrity.mockResolvedValue({
        valid: false,
        error: 'Invalid checksum'
      });
      
      await adapter.verifyIntegrity(100n);
      
      const metrics = adapter.getMetrics();
      expect(metrics.integrityFailures).toBe(1);
    });

    it('should handle errors', async () => {
      mockIntegrityModule.verifyIntegrity.mockRejectedValue(new Error('Verify error'));
      
      await expect(adapter.verifyIntegrity(100n)).rejects.toThrow('Verify error');
      
      const metrics = adapter.getMetrics();
      expect(metrics.errorCount).toBe(1);
      expect(metrics.integrityFailures).toBe(1);
    });
  });

  describe('extractChecksum', () => {
    it('should extract checksum from value', async () => {
      const result = await adapter.extractChecksum(1234567n);
      
      expect(result).toEqual({
        coreFactors: testFactors,
        checksumPrime: 7n,
        checksumExponent: 6,
        valid: true
      });
      expect(mockIntegrityModule.extractChecksum).toHaveBeenCalledWith(1234567n, undefined);
    });

    it('should cache extraction for small values', async () => {
      await adapter.extractChecksum(100n);
      await adapter.extractChecksum(100n);
      
      expect(mockIntegrityModule.extractChecksum).toHaveBeenCalledTimes(1);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
    });

    it('should not cache failed extractions', async () => {
      mockIntegrityModule.extractChecksum.mockResolvedValue({
        coreFactors: [],
        checksumPrime: 0n,
        checksumExponent: 0,
        valid: false,
        error: 'No checksum found'
      });
      
      await adapter.extractChecksum(100n);
      await adapter.extractChecksum(100n);
      
      expect(mockIntegrityModule.extractChecksum).toHaveBeenCalledTimes(2);
    });

    it('should handle errors', async () => {
      mockIntegrityModule.extractChecksum.mockRejectedValue(new Error('Extract error'));
      
      await expect(adapter.extractChecksum(100n)).rejects.toThrow('Extract error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Checksum extraction failed',
        expect.objectContaining({ value: '100' })
      );
    });
  });

  describe('calculateXorSum', () => {
    it('should calculate XOR sum for factors', async () => {
      const result = await adapter.calculateXorSum(testFactors);
      
      expect(result).toBe(123);
      expect(mockIntegrityModule.calculateXorSum).toHaveBeenCalledWith(testFactors, undefined);
    });

    it('should cache XOR calculations', async () => {
      await adapter.calculateXorSum(testFactors);
      await adapter.calculateXorSum(testFactors);
      
      expect(mockIntegrityModule.calculateXorSum).toHaveBeenCalledTimes(1);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
    });

    it('should handle errors', async () => {
      mockIntegrityModule.calculateXorSum.mockRejectedValue(new Error('XOR error'));
      
      await expect(adapter.calculateXorSum(testFactors)).rejects.toThrow('XOR error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'XOR calculation failed',
        expect.objectContaining({ factorCount: 3 })
      );
    });
  });

  describe('verifyBatch', () => {
    it('should verify multiple values in batch', async () => {
      const values = [100n, 200n, 300n];
      const results = await adapter.verifyBatch(values);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.valid).toBe(true);
        expect(result.checksum).toBe(7n);
      });
      
      expect(mockIntegrityModule.verifyBatch).toHaveBeenCalledWith(values, undefined);
    });

    it('should use cache for batch operations', async () => {
      // Pre-cache one value
      await adapter.verifyIntegrity(100n);
      
      const values = [100n, 200n, 300n];
      const results = await adapter.verifyBatch(values);
      
      expect(results).toHaveLength(3);
      expect(mockIntegrityModule.verifyBatch).toHaveBeenCalledWith([200n, 300n], undefined);
      
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBeGreaterThan(0);
    });

    it('should track integrity failures in batch', async () => {
      mockIntegrityModule.verifyBatch.mockResolvedValue([
        { valid: true, checksum: 7n },
        { valid: false, error: 'Invalid' },
        { valid: true, checksum: 7n }
      ]);
      
      await adapter.verifyBatch([100n, 200n, 300n]);
      
      const metrics = adapter.getMetrics();
      expect(metrics.integrityFailures).toBe(1);
    });

    it('should log batch completion', async () => {
      const values = [100n, 200n, 300n];
      await adapter.verifyBatch(values);
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Batch integrity verification completed',
        expect.objectContaining({
          totalValues: 3,
          validResults: 3
        })
      );
    });

    it('should handle errors', async () => {
      mockIntegrityModule.verifyBatch.mockRejectedValue(new Error('Batch error'));
      
      await expect(adapter.verifyBatch([100n, 200n])).rejects.toThrow('Batch error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Batch verification failed',
        expect.objectContaining({ valueCount: 2 })
      );
    });
  });

  describe('batchProcess', () => {
    it('should process multiple integrity operations', async () => {
      const requests = [
        { type: 'generateChecksum' as const, id: '1', factors: testFactors },
        { type: 'attachChecksum' as const, id: '2', value: 100n, factors: testFactors },
        { type: 'verifyIntegrity' as const, id: '3', value: 1234567n },
        { type: 'extractChecksum' as const, id: '4', value: 1234567n },
        { type: 'calculateXorSum' as const, id: '5', factors: testFactors }
      ];
      
      const results = await adapter.batchProcess(requests);
      
      expect(results).toHaveLength(5);
      expect(results[0]).toEqual({ id: '1', result: 7n });
      expect(results[1]).toEqual({ id: '2', result: 1234567n });
      expect(results[2]).toEqual({ 
        id: '3', 
        result: { valid: true, checksum: 7n, coreFactors: testFactors }
      });
      expect(results[3]).toEqual({
        id: '4',
        result: {
          coreFactors: testFactors,
          checksumPrime: 7n,
          checksumExponent: 6,
          valid: true
        }
      });
      expect(results[4]).toEqual({ id: '5', result: 123 });
    });

    it('should handle errors in batch processing', async () => {
      mockIntegrityModule.generateChecksum.mockRejectedValue(new Error('Batch op error'));
      
      const requests = [
        { type: 'generateChecksum' as const, id: '1', factors: testFactors },
        { type: 'calculateXorSum' as const, id: '2', factors: testFactors }
      ];
      
      const results = await adapter.batchProcess(requests);
      
      expect(results[0]).toEqual({
        id: '1',
        result: null,
        error: 'Batch op error'
      });
      expect(results[1]).toEqual({ id: '2', result: 123 });
    });

    it('should handle missing parameters', async () => {
      const requests = [
        { type: 'generateChecksum' as const, id: '1' }, // Missing factors
        { type: 'attachChecksum' as const, id: '2', value: 100n }, // Missing factors
        { type: 'verifyIntegrity' as const, id: '3' }, // Missing value
      ];
      
      const results = await adapter.batchProcess(requests);
      
      expect(results[0].error).toContain('Missing factors');
      expect(results[1].error).toContain('Missing value or factors');
      expect(results[2].error).toContain('Missing value');
    });

    it('should handle unknown operation types', async () => {
      const requests = [
        { type: 'unknown' as any, id: '1' }
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
        { type: 'generateChecksum' as const, id: '1', factors: testFactors },
        { type: 'calculateXorSum' as const, id: '2', factors: testFactors }
      ];
      
      await adapter.batchProcess(requests);
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Batch integrity processing completed',
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
      const smallAdapter = new IntegrityAdapter(mockIntegrityModule as any, {
        enableCaching: true,
        maxCacheSize: 3,
        cacheExpiryMs: 60000
      });
      
      // Fill cache beyond limit
      for (let i = 0; i < 5; i++) {
        const factors = [{ prime: BigInt(i + 2), exponent: 1 }];
        await smallAdapter.generateChecksum(factors);
      }
      
      const cacheStats = smallAdapter.getCacheStats();
      expect(cacheStats.size).toBeLessThanOrEqual(3);
    });

    it('should expire cache entries after TTL', async () => {
      jest.useFakeTimers();
      
      await adapter.generateChecksum(testFactors);
      
      // First access should hit cache
      await adapter.generateChecksum(testFactors);
      let metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      
      // Advance time past TTL
      jest.advanceTimersByTime(2000);
      
      // Next access should miss cache
      await adapter.generateChecksum(testFactors);
      metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(2);
    });

    it('should track access count for cache entries', async () => {
      await adapter.generateChecksum(testFactors);
      await adapter.generateChecksum(testFactors);
      await adapter.generateChecksum(testFactors);
      
      const cacheStats = adapter.getCacheStats();
      const entry = cacheStats.entries.find(e => e.key.startsWith('checksum:'));
      expect(entry?.accessCount).toBe(3);
    });

    it('should clear cache on demand', async () => {
      await adapter.generateChecksum(testFactors);
      await adapter.calculateXorSum(testFactors);
      
      let cacheStats = adapter.getCacheStats();
      expect(cacheStats.size).toBe(2);
      
      adapter.clearCache();
      
      cacheStats = adapter.getCacheStats();
      expect(cacheStats.size).toBe(0);
      expect(mockLogger.debug).toHaveBeenCalledWith('Integrity adapter cache cleared');
    });

    it('should work without caching when disabled', async () => {
      const noCacheAdapter = new IntegrityAdapter(mockIntegrityModule as any, {
        enableCaching: false
      });
      
      await noCacheAdapter.generateChecksum(testFactors);
      await noCacheAdapter.generateChecksum(testFactors);
      
      expect(mockIntegrityModule.generateChecksum).toHaveBeenCalledTimes(2);
      
      const metrics = noCacheAdapter.getMetrics();
      expect(metrics.cacheHits).toBe(0);
      expect(metrics.cacheMisses).toBe(0);
    });
  });

  describe('metrics and stats', () => {
    it('should track all operation metrics', async () => {
      await adapter.generateChecksum(testFactors);
      await adapter.attachChecksum(100n, testFactors);
      await adapter.verifyIntegrity(1234567n);
      await adapter.extractChecksum(1234567n);
      await adapter.calculateXorSum(testFactors);
      await adapter.verifyBatch([100n, 200n]);
      
      const metrics = adapter.getMetrics();
      
      expect(metrics.checksumsGenerated).toBe(1);
      expect(metrics.checksumsAttached).toBe(1);
      expect(metrics.integritiesVerified).toBe(1);
      expect(metrics.checksumsExtracted).toBe(1);
      expect(metrics.xorCalculations).toBe(1);
      expect(metrics.batchVerifications).toBe(1);
      expect(metrics.totalOperationTime).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    it('should calculate cache hit rate', async () => {
      await adapter.generateChecksum(testFactors);
      await adapter.generateChecksum(testFactors);
      
      const cacheStats = adapter.getCacheStats();
      expect(cacheStats.hitRate).toBe(0.5);
    });

    it('should provide cache entry details', async () => {
      await adapter.generateChecksum(testFactors);
      await adapter.calculateXorSum(testFactors);
      
      const cacheStats = adapter.getCacheStats();
      
      expect(cacheStats.entries).toHaveLength(2);
      expect(cacheStats.entries[0]).toHaveProperty('key');
      expect(cacheStats.entries[0]).toHaveProperty('accessCount');
      expect(cacheStats.entries[0]).toHaveProperty('age');
    });
  });

  describe('termination', () => {
    it('should terminate module and clear cache', async () => {
      await adapter.generateChecksum(testFactors);
      await adapter.terminate();
      
      expect(mockIntegrityModule.terminate).toHaveBeenCalled();
      
      const cacheStats = adapter.getCacheStats();
      expect(cacheStats.size).toBe(0);
      
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Integrity adapter terminated',
        expect.objectContaining({ finalMetrics: expect.any(Object) })
      );
    });

    it('should handle termination when not initialized', async () => {
      const uninitAdapter = new IntegrityAdapter(mockIntegrityModule as any);
      
      await expect(uninitAdapter.terminate()).resolves.not.toThrow();
      expect(mockIntegrityModule.terminate).not.toHaveBeenCalled();
    });
  });
});

describe('createIntegrityAdapter', () => {
  it('should create adapter with module', () => {
    const adapter = createIntegrityAdapter(mockIntegrityModule as any);
    
    expect(adapter).toBeInstanceOf(IntegrityAdapter);
  });

  it('should throw if module is not provided', () => {
    expect(() => createIntegrityAdapter(null as any)).toThrow(
      'Integrity module is required for production integrity adapter - no fallbacks allowed'
    );
  });

  it('should pass options to adapter', () => {
    const adapter = createIntegrityAdapter(mockIntegrityModule as any, {
      enableCaching: false,
      maxCacheSize: 25
    });
    
    const cacheStats = adapter.getCacheStats();
    expect(cacheStats.size).toBe(0);
  });
});

describe('createIntegrityAdapterPool', () => {
  it('should create multiple adapters', () => {
    const modules = [mockIntegrityModule, mockIntegrityModule, mockIntegrityModule];
    const pool = createIntegrityAdapterPool(modules as any[]);
    
    expect(pool).toHaveLength(3);
    pool.forEach(adapter => {
      expect(adapter).toBeInstanceOf(IntegrityAdapter);
    });
  });

  it('should throw if no modules provided', () => {
    expect(() => createIntegrityAdapterPool([])).toThrow(
      'At least one integrity module is required for adapter pool'
    );
  });

  it('should pass options to all adapters', () => {
    const modules = [mockIntegrityModule, mockIntegrityModule];
    const pool = createIntegrityAdapterPool(modules as any[], {
      enableCaching: false
    });
    
    pool.forEach(adapter => {
      const metrics = adapter.getMetrics();
      expect(metrics.cacheHits).toBe(0);
    });
  });
});
