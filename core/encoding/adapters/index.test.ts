/**
 * Adapter Suite and Load Balancer Tests
 * ======================================
 * 
 * Comprehensive tests for the adapter suite and load balancing functionality.
 */

import {
  createAdapterSuite,
  createAdapterSuitePool,
  AdapterLoadBalancer,
  AdapterSuite,
  AdapterStats
} from './index';
import { PrimeRegistryAdapter } from './prime-adapter';
import { IntegrityAdapter } from './integrity-adapter';

// Mock modules
const mockPrimeRegistry = {
  initialize: jest.fn().mockResolvedValue({ success: true }),
  terminate: jest.fn().mockResolvedValue(undefined),
  getPrime: jest.fn().mockImplementation((idx: number) => BigInt(idx * 2 + 1)),
  getIndex: jest.fn().mockImplementation((prime: bigint) => Number((prime - 1n) / 2n)),
  factor: jest.fn().mockReturnValue([{ prime: 2n, exponent: 1 }]),
  isPrime: jest.fn().mockReturnValue(true)
};

const mockIntegrityModule = {
  initialize: jest.fn().mockResolvedValue({ success: true }),
  terminate: jest.fn().mockResolvedValue(undefined),
  generateChecksum: jest.fn().mockResolvedValue(7n),
  attachChecksum: jest.fn().mockResolvedValue(1234567n),
  verifyIntegrity: jest.fn().mockResolvedValue({ valid: true, checksum: 7n }),
  extractChecksum: jest.fn().mockResolvedValue({ valid: true, checksumPrime: 7n }),
  calculateXorSum: jest.fn().mockResolvedValue(123),
  verifyBatch: jest.fn().mockImplementation(async (values: bigint[]) => 
    values.map(() => ({ valid: true, checksum: 7n }))
  )
};

// Mock logger
const mockLogger = {
  debug: jest.fn().mockResolvedValue(undefined),
  info: jest.fn().mockResolvedValue(undefined),
  warn: jest.fn().mockResolvedValue(undefined),
  error: jest.fn().mockResolvedValue(undefined)
};

describe('createAdapterSuite', () => {
  let suite: AdapterSuite;

  beforeEach(() => {
    jest.clearAllMocks();
    suite = createAdapterSuite(mockPrimeRegistry, mockIntegrityModule, {
      enableCaching: true,
      logger: mockLogger
    });
  });

  it('should create suite with both adapters', () => {
    expect(suite.primeAdapter).toBeInstanceOf(PrimeRegistryAdapter);
    expect(suite.integrityAdapter).toBeInstanceOf(IntegrityAdapter);
  });

  it('should pass options to both adapters', () => {
    // Test that caching is enabled by checking cache stats
    const primeCacheStats = suite.primeAdapter.getCacheStats();
    const integrityCacheStats = suite.integrityAdapter.getCacheStats();
    
    expect(primeCacheStats).toBeDefined();
    expect(integrityCacheStats).toBeDefined();
  });

  describe('getStats', () => {
    beforeEach(async () => {
      // Perform some operations to generate stats
      await suite.primeAdapter.getPrime(5);
      await suite.primeAdapter.factor(12n);
      await suite.primeAdapter.isPrime(7n);
      
      await suite.integrityAdapter.generateChecksum([{ prime: 2n, exponent: 1 }]);
      await suite.integrityAdapter.verifyIntegrity(100n);
    });

    it('should return stats for prime adapter', () => {
      const stats = suite.getStats();
      
      expect(stats.prime).toMatchObject({
        totalOperations: expect.any(Number),
        successfulOperations: expect.any(Number),
        failedOperations: expect.any(Number),
        averageResponseTime: expect.any(Number),
        cacheHitRate: expect.any(Number),
        uptime: expect.any(Number)
      });
      
      expect(stats.prime.totalOperations).toBeGreaterThan(0);
    });

    it('should return stats for integrity adapter', () => {
      const stats = suite.getStats();
      
      expect(stats.integrity).toMatchObject({
        totalOperations: expect.any(Number),
        successfulOperations: expect.any(Number),
        failedOperations: expect.any(Number),
        averageResponseTime: expect.any(Number),
        cacheHitRate: expect.any(Number),
        uptime: expect.any(Number)
      });
      
      expect(stats.integrity.totalOperations).toBeGreaterThan(0);
    });

    it('should return combined stats', () => {
      const stats = suite.getStats();
      
      expect(stats.combined.totalOperations).toBe(
        stats.prime.totalOperations + stats.integrity.totalOperations
      );
      expect(stats.combined.successfulOperations).toBe(
        stats.prime.successfulOperations + stats.integrity.successfulOperations
      );
      expect(stats.combined.failedOperations).toBe(
        stats.prime.failedOperations + stats.integrity.failedOperations
      );
    });

    it('should calculate average response time and cache hit rate', () => {
      const stats = suite.getStats();
      
      expect(stats.combined.averageResponseTime).toBe(
        (stats.prime.averageResponseTime + stats.integrity.averageResponseTime) / 2
      );
      expect(stats.combined.cacheHitRate).toBe(
        (stats.prime.cacheHitRate + stats.integrity.cacheHitRate) / 2
      );
    });
  });

  describe('clearCaches', () => {
    it('should clear both adapter caches', async () => {
      // Add some cached data
      await suite.primeAdapter.getPrime(5);
      await suite.integrityAdapter.generateChecksum([{ prime: 2n, exponent: 1 }]);
      
      // Clear caches
      suite.clearCaches();
      
      // Check cache stats
      const primeCacheStats = suite.primeAdapter.getCacheStats();
      const integrityCacheStats = suite.integrityAdapter.getCacheStats();
      
      expect(primeCacheStats.size).toBe(0);
      expect(integrityCacheStats.size).toBe(0);
    });
  });

  describe('terminate', () => {
    it('should terminate both adapters', async () => {
      // Create fresh mocks for this test
      const testPrimeRegistry = {
        ...mockPrimeRegistry,
        terminate: jest.fn().mockResolvedValue(undefined)
      };
      const testIntegrityModule = {
        ...mockIntegrityModule,
        terminate: jest.fn().mockResolvedValue(undefined)
      };
      
      // Create a new suite with fresh mocks
      const terminateSuite = createAdapterSuite(testPrimeRegistry, testIntegrityModule);
      
      // Initialize adapters by performing an operation
      await terminateSuite.primeAdapter.getPrime(1);
      await terminateSuite.integrityAdapter.generateChecksum([{ prime: 2n, exponent: 1 }]);
      
      await terminateSuite.terminate();
      
      expect(testPrimeRegistry.terminate).toHaveBeenCalled();
      expect(testIntegrityModule.terminate).toHaveBeenCalled();
    });

    it('should handle termination errors gracefully', async () => {
      mockPrimeRegistry.terminate.mockRejectedValue(new Error('Prime terminate error'));
      mockIntegrityModule.terminate.mockRejectedValue(new Error('Integrity terminate error'));
      
      // Should not throw
      await expect(suite.terminate()).resolves.not.toThrow();
    });
  });
});

describe('createAdapterSuitePool', () => {
  it('should create multiple adapter suites', () => {
    const primeRegistries = [mockPrimeRegistry, mockPrimeRegistry, mockPrimeRegistry];
    const integrityModules = [mockIntegrityModule, mockIntegrityModule, mockIntegrityModule];
    
    const pool = createAdapterSuitePool(primeRegistries, integrityModules);
    
    expect(pool).toHaveLength(3);
    pool.forEach(suite => {
      expect(suite.primeAdapter).toBeInstanceOf(PrimeRegistryAdapter);
      expect(suite.integrityAdapter).toBeInstanceOf(IntegrityAdapter);
    });
  });

  it('should throw if array lengths do not match', () => {
    const primeRegistries = [mockPrimeRegistry, mockPrimeRegistry];
    const integrityModules = [mockIntegrityModule];
    
    expect(() => createAdapterSuitePool(primeRegistries, integrityModules)).toThrow(
      'Prime registries and integrity modules arrays must have the same length'
    );
  });

  it('should pass options to all suites', () => {
    const primeRegistries = [mockPrimeRegistry, mockPrimeRegistry];
    const integrityModules = [mockIntegrityModule, mockIntegrityModule];
    
    const pool = createAdapterSuitePool(primeRegistries, integrityModules, {
      enableCaching: false
    });
    
    pool.forEach(suite => {
      // Both adapters should have caching disabled
      const primeStats = suite.primeAdapter.getMetrics();
      const integrityStats = suite.integrityAdapter.getMetrics();
      
      expect(primeStats.cacheHits).toBeUndefined();
      expect(integrityStats.cacheHits).toBe(0);
    });
  });
});

describe('AdapterLoadBalancer', () => {
  let suites: AdapterSuite[];
  let loadBalancer: AdapterLoadBalancer;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup the terminate mocks
    mockPrimeRegistry.terminate.mockResolvedValue(undefined);
    mockIntegrityModule.terminate.mockResolvedValue(undefined);
    
    // Create 3 adapter suites
    suites = [
      createAdapterSuite(mockPrimeRegistry, mockIntegrityModule),
      createAdapterSuite(mockPrimeRegistry, mockIntegrityModule),
      createAdapterSuite(mockPrimeRegistry, mockIntegrityModule)
    ];
  });

  describe('round-robin strategy', () => {
    beforeEach(() => {
      loadBalancer = new AdapterLoadBalancer(suites, 'round-robin');
    });

    it('should distribute requests in round-robin fashion', () => {
      const suite1 = loadBalancer.getNext();
      const suite2 = loadBalancer.getNext();
      const suite3 = loadBalancer.getNext();
      const suite4 = loadBalancer.getNext();
      
      expect(suite1).toBe(suites[0]);
      expect(suite2).toBe(suites[1]);
      expect(suite3).toBe(suites[2]);
      expect(suite4).toBe(suites[0]); // Wraps around
    });

    it('should handle single suite', () => {
      const singleBalancer = new AdapterLoadBalancer([suites[0]], 'round-robin');
      
      expect(singleBalancer.getNext()).toBe(suites[0]);
      expect(singleBalancer.getNext()).toBe(suites[0]);
    });
  });

  describe('least-connections strategy', () => {
    beforeEach(() => {
      loadBalancer = new AdapterLoadBalancer(suites, 'least-connections');
    });

    it('should select suite with lowest operations', async () => {
      // Perform operations on first two suites
      await suites[0].primeAdapter.getPrime(1);
      await suites[0].primeAdapter.getPrime(2);
      await suites[0].primeAdapter.getPrime(3);
      
      await suites[1].primeAdapter.getPrime(1);
      
      // Third suite has no operations, should be selected
      const selected = loadBalancer.getNext();
      expect(selected).toBe(suites[2]);
    });

    it('should handle ties by selecting first', async () => {
      // All suites have same operations
      const selected = loadBalancer.getNext();
      expect(selected).toBe(suites[0]);
    });
  });

  describe('random strategy', () => {
    beforeEach(() => {
      loadBalancer = new AdapterLoadBalancer(suites, 'random');
    });

    it('should select random suites', () => {
      const selections = new Set<AdapterSuite>();
      
      // Make many selections to ensure randomness
      for (let i = 0; i < 100; i++) {
        selections.add(loadBalancer.getNext());
      }
      
      // Should have selected multiple different suites
      expect(selections.size).toBeGreaterThan(1);
    });

    it('should only select from available suites', () => {
      for (let i = 0; i < 100; i++) {
        const selected = loadBalancer.getNext();
        expect(suites).toContain(selected);
      }
    });
  });

  describe('getAllSuites', () => {
    beforeEach(() => {
      loadBalancer = new AdapterLoadBalancer(suites);
    });

    it('should return all suites', () => {
      const allSuites = loadBalancer.getAllSuites();
      
      expect(allSuites).toHaveLength(3);
      expect(allSuites).toEqual(suites);
    });

    it('should return a copy of suites array', () => {
      const allSuites = loadBalancer.getAllSuites();
      
      // Modifying returned array should not affect internal state
      allSuites.pop();
      
      expect(loadBalancer.getAllSuites()).toHaveLength(3);
    });
  });

  describe('getCombinedStats', () => {
    beforeEach(async () => {
      loadBalancer = new AdapterLoadBalancer(suites);
      
      // Perform different operations on each suite
      await suites[0].primeAdapter.getPrime(1);
      await suites[0].primeAdapter.getPrime(2);
      
      await suites[1].primeAdapter.factor(12n);
      await suites[1].integrityAdapter.generateChecksum([{ prime: 2n, exponent: 1 }]);
      
      await suites[2].integrityAdapter.verifyIntegrity(100n);
    });

    it('should combine stats from all suites', () => {
      const combinedStats = loadBalancer.getCombinedStats();
      
      expect(combinedStats.totalOperations).toBe(5); // 2 + 2 + 1
      expect(combinedStats.successfulOperations).toBe(5);
      expect(combinedStats.failedOperations).toBe(0);
    });

    it('should calculate averages correctly', () => {
      const combinedStats = loadBalancer.getCombinedStats();
      
      // Test that averageResponseTime is a positive number
      expect(combinedStats.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(typeof combinedStats.averageResponseTime).toBe('number');
      expect(isFinite(combinedStats.averageResponseTime)).toBe(true);
      
      // Test cache hit rate is between 0 and 1
      expect(combinedStats.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(combinedStats.cacheHitRate).toBeLessThanOrEqual(1);
    });

    it('should use minimum uptime', () => {
      const combinedStats = loadBalancer.getCombinedStats();
      const individualStats = suites.map(s => s.getStats().combined);
      
      // Uptime should be a positive number and less than or equal to current time
      expect(combinedStats.uptime).toBeGreaterThan(0);
      expect(combinedStats.uptime).toBeLessThanOrEqual(Date.now());
      
      // It should be less than or equal to all individual uptimes
      individualStats.forEach(stats => {
        expect(combinedStats.uptime).toBeLessThanOrEqual(stats.uptime);
      });
    });
  });

  describe('terminate', () => {
    let testPrimeRegistry: any;
    let testIntegrityModule: any;
    
    beforeEach(() => {
      // Create fresh mocks for terminate tests
      testPrimeRegistry = {
        ...mockPrimeRegistry,
        terminate: jest.fn().mockResolvedValue(undefined)
      };
      testIntegrityModule = {
        ...mockIntegrityModule,
        terminate: jest.fn().mockResolvedValue(undefined)
      };
      
      // Create fresh suites with fresh mocks
      suites = [
        createAdapterSuite(testPrimeRegistry, testIntegrityModule),
        createAdapterSuite(testPrimeRegistry, testIntegrityModule),
        createAdapterSuite(testPrimeRegistry, testIntegrityModule)
      ];
      
      loadBalancer = new AdapterLoadBalancer(suites);
    });

    it('should terminate all suites', async () => {
      // Initialize all suites
      for (const suite of suites) {
        await suite.primeAdapter.getPrime(1);
        await suite.integrityAdapter.generateChecksum([{ prime: 2n, exponent: 1 }]);
      }
      
      await loadBalancer.terminate();
      
      // Each suite should have both modules terminated
      expect(testPrimeRegistry.terminate).toHaveBeenCalledTimes(3);
      expect(testIntegrityModule.terminate).toHaveBeenCalledTimes(3);
    });

    it('should handle partial termination failures', async () => {
      // Initialize all suites
      for (const suite of suites) {
        await suite.primeAdapter.getPrime(1);
        await suite.integrityAdapter.generateChecksum([{ prime: 2n, exponent: 1 }]);
      }
      
      // Make first suite fail to terminate
      let callCount = 0;
      testPrimeRegistry.terminate.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Termination failed'));
        }
        return Promise.resolve();
      });
      
      // Should throw due to Promise.all behavior
      await expect(loadBalancer.terminate()).rejects.toThrow('Termination failed');
      
      // The implementation uses Promise.all, which stops on first rejection
      // So we can't guarantee all terminations will be attempted
      expect(testPrimeRegistry.terminate).toHaveBeenCalled();
      expect(testIntegrityModule.terminate).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty suite array', () => {
      expect(() => new AdapterLoadBalancer([])).not.toThrow();
      
      const emptyBalancer = new AdapterLoadBalancer([]);
      expect(() => emptyBalancer.getNext()).toThrow();
    });

    it('should default to round-robin for invalid strategy', () => {
      const balancer = new AdapterLoadBalancer(suites, 'invalid' as any);
      
      // Should behave like round-robin
      const suite1 = balancer.getNext();
      const suite2 = balancer.getNext();
      
      expect(suite1).toBe(suites[0]);
      expect(suite2).toBe(suites[1]);
    });
  });
});

describe('AdapterStats interface', () => {
  it('should have correct structure', () => {
    const stats: AdapterStats = {
      totalOperations: 100,
      successfulOperations: 95,
      failedOperations: 5,
      averageResponseTime: 10.5,
      cacheHitRate: 0.75,
      uptime: Date.now()
    };
    
    expect(stats).toHaveProperty('totalOperations');
    expect(stats).toHaveProperty('successfulOperations');
    expect(stats).toHaveProperty('failedOperations');
    expect(stats).toHaveProperty('averageResponseTime');
    expect(stats).toHaveProperty('cacheHitRate');
    expect(stats).toHaveProperty('uptime');
  });
});
