/**
 * Test file for the Prime module mock
 * ==================================
 * 
 * This file tests that the mock implementation works correctly
 * and can be used in place of the real module.
 */

// Import from the mock
import {
  MockPrimeRegistryModel,
  createPrimeRegistry,
  createAndInitializePrimeRegistry,
  createBasicStream,
  mod,
  modPow,
  integerSqrt,
  isPerfectSquare,
  reconstructFromFactors,
  Factor
} from './index';

import {
  createMockPrimeRegistry,
  createTestFactors,
  createTestStream,
  verifyMockCalls,
  resetAllMocks,
  createTestConfig
} from './test-mock';

describe('Prime Module Mock', () => {
  beforeEach(() => {
    // Clear all mock function calls before each test
    jest.clearAllMocks();
  });

  describe('Mock Structure', () => {
    test('should export MockPrimeRegistryModel', () => {
      expect(MockPrimeRegistryModel).toBeDefined();
      expect(typeof MockPrimeRegistryModel).toBe('function');
    });

    test('should export factory functions', () => {
      expect(createPrimeRegistry).toBeDefined();
      expect(typeof createPrimeRegistry).toBe('function');
      
      expect(createAndInitializePrimeRegistry).toBeDefined();
      expect(typeof createAndInitializePrimeRegistry).toBe('function');
    });

    test('should export utility functions', () => {
      expect(mod).toBeDefined();
      expect(modPow).toBeDefined();
      expect(integerSqrt).toBeDefined();
      expect(isPerfectSquare).toBeDefined();
      expect(reconstructFromFactors).toBeDefined();
      expect(createBasicStream).toBeDefined();
    });
  });

  describe('MockPrimeRegistryModel', () => {
    test('should create instance with default options', () => {
      const registry = new MockPrimeRegistryModel();
      expect(registry).toBeDefined();
      expect(registry.isPrime).toBeDefined();
      expect(registry.getPrime).toBeDefined();
      expect(registry.getIndex).toBeDefined();
      expect(registry.factor).toBeDefined();
    });

    test('should create instance with custom options', () => {
      const options = {
        preloadCount: 20,
        enableLogs: true,
        debug: true
      };
      
      const registry = new MockPrimeRegistryModel(options);
      expect(registry).toBeDefined();
    });

    test('should handle isPrime correctly', () => {
      const registry = new MockPrimeRegistryModel();
      
      expect(registry.isPrime(BigInt(2))).toBe(true);
      expect(registry.isPrime(BigInt(3))).toBe(true);
      expect(registry.isPrime(BigInt(4))).toBe(false);
      expect(registry.isPrime(BigInt(17))).toBe(true);
      expect(registry.isPrime(BigInt(18))).toBe(false);
    });

    test('should handle getPrime correctly', () => {
      const registry = new MockPrimeRegistryModel();
      
      expect(registry.getPrime(0)).toBe(BigInt(2));
      expect(registry.getPrime(1)).toBe(BigInt(3));
      expect(registry.getPrime(2)).toBe(BigInt(5));
      expect(registry.getPrime(3)).toBe(BigInt(7));
    });

    test('should handle getIndex correctly', () => {
      const registry = new MockPrimeRegistryModel();
      
      expect(registry.getIndex(BigInt(2))).toBe(0);
      expect(registry.getIndex(BigInt(3))).toBe(1);
      expect(registry.getIndex(BigInt(5))).toBe(2);
      expect(registry.getIndex(BigInt(7))).toBe(3);
    });

    test('should handle factor correctly', () => {
      const registry = new MockPrimeRegistryModel();
      
      const factors6 = registry.factor(BigInt(6));
      expect(factors6).toEqual([
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 }
      ]);
      
      const factors12 = registry.factor(BigInt(12));
      expect(factors12).toEqual([
        { prime: BigInt(2), exponent: 2 },
        { prime: BigInt(3), exponent: 1 }
      ]);
    });

    test('should handle integerSqrt correctly', () => {
      const registry = new MockPrimeRegistryModel();
      
      expect(registry.integerSqrt(BigInt(16))).toBe(BigInt(4));
      expect(registry.integerSqrt(BigInt(17))).toBe(BigInt(4));
      expect(registry.integerSqrt(BigInt(100))).toBe(BigInt(10));
    });

    test('should handle clearCache', () => {
      const registry = new MockPrimeRegistryModel();
      expect(() => registry.clearCache()).not.toThrow();
    });

    test('should return version', () => {
      const registry = new MockPrimeRegistryModel();
      expect(registry.getVersion()).toBe('1.0.0');
    });
  });

  describe('Factory Functions', () => {
    test('createPrimeRegistry should return instance', () => {
      const registry = createPrimeRegistry();
      expect(registry).toBeInstanceOf(MockPrimeRegistryModel);
    });

    test('createPrimeRegistry should accept options', () => {
      const options = {
        preloadCount: 15,
        debug: true
      };
      
      const registry = createPrimeRegistry(options);
      expect(registry).toBeInstanceOf(MockPrimeRegistryModel);
    });

    test('createAndInitializePrimeRegistry should return initialized instance', async () => {
      const registry = await createAndInitializePrimeRegistry();
      expect(registry).toBeInstanceOf(MockPrimeRegistryModel);
      
      const state = registry.getState();
      expect(state.lifecycle).toBe('ready');
    });
  });

  describe('Utility Functions', () => {
    test('mod should handle Python-compatible modulo', () => {
      expect(mod(-BigInt(5), BigInt(13))).toBe(BigInt(8));
      expect(mod(BigInt(10), BigInt(3))).toBe(BigInt(1));
      expect(mod(-BigInt(10), BigInt(3))).toBe(BigInt(2));
    });

    test('modPow should calculate modular exponentiation', () => {
      expect(modPow(BigInt(2), BigInt(10), BigInt(1000))).toBe(BigInt(24));
      expect(modPow(BigInt(3), BigInt(4), BigInt(7))).toBe(BigInt(4));
    });

    test('integerSqrt should calculate integer square root', () => {
      expect(integerSqrt(BigInt(16))).toBe(BigInt(4));
      expect(integerSqrt(BigInt(17))).toBe(BigInt(4));
      expect(integerSqrt(BigInt(100))).toBe(BigInt(10));
      expect(integerSqrt(BigInt(101))).toBe(BigInt(10));
    });

    test('isPerfectSquare should identify perfect squares', () => {
      expect(isPerfectSquare(BigInt(16))).toBe(true);
      expect(isPerfectSquare(BigInt(17))).toBe(false);
      expect(isPerfectSquare(BigInt(100))).toBe(true);
      expect(isPerfectSquare(BigInt(101))).toBe(false);
      expect(isPerfectSquare(BigInt(0))).toBe(true);
    });

    test('reconstructFromFactors should reconstruct values', () => {
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 }
      ];
      
      expect(reconstructFromFactors(factors)).toBe(BigInt(6));
      
      const factors2: Factor[] = [
        { prime: BigInt(2), exponent: 2 },
        { prime: BigInt(3), exponent: 1 }
      ];
      
      expect(reconstructFromFactors(factors2)).toBe(BigInt(12));
    });

    test('createBasicStream should create working stream', () => {
      const values = [BigInt(2), BigInt(3), BigInt(5)];
      const stream = createBasicStream(values);
      
      expect(stream).toBeDefined();
      
      // Test iterator
      const iterator = stream[Symbol.iterator]();
      expect(iterator.next().value).toBe(BigInt(2));
      expect(iterator.next().value).toBe(BigInt(3));
      expect(iterator.next().value).toBe(BigInt(5));
      expect(iterator.next().done).toBe(true);
    });
  });

  describe('Stream Operations', () => {
    test('should support stream operations', async () => {
      const registry = new MockPrimeRegistryModel();
      
      const primeStream = registry.createPrimeStream(0);
      expect(primeStream).toBeDefined();
      
      const factorStream = registry.createFactorStream(BigInt(12));
      expect(factorStream).toBeDefined();
    });

    test('should support streaming processor', () => {
      const registry = new MockPrimeRegistryModel();
      
      const processor = registry.createStreamProcessor();
      expect(processor).toBeDefined();
      expect(processor.factorizeStreaming).toBeDefined();
      expect(processor.transformStreaming).toBeDefined();
    });

    test('should handle factorizeStreaming', async () => {
      const registry = new MockPrimeRegistryModel();
      
      const chunks = [{ 
        data: BigInt(42),
        position: 0,
        final: true
      }];
      const factors = await registry.factorizeStreaming(chunks);
      
      expect(Array.isArray(factors)).toBe(true);
    });
  });

  describe('Test Utilities', () => {
    test('createMockPrimeRegistry should create mock registry', () => {
      const mockRegistry = createMockPrimeRegistry();
      expect(mockRegistry).toBeDefined();
      expect(mockRegistry.isPrime).toBeDefined();
      expect(mockRegistry.getPrime).toBeDefined();
      expect(mockRegistry.factor).toBeDefined();
    });

    test('createTestFactors should create test factors', () => {
      const simple = createTestFactors('simple');
      expect(simple).toEqual([
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 }
      ]);
      
      const empty = createTestFactors('empty');
      expect(empty).toEqual([]);
      
      const single = createTestFactors('single');
      expect(single).toEqual([{ prime: BigInt(13), exponent: 1 }]);
    });

    test('createTestStream should create mock stream', () => {
      const values = [1, 2, 3];
      const stream = createTestStream(values);
      
      expect(stream).toBeDefined();
      expect(stream.map).toBeDefined();
      expect(stream.filter).toBeDefined();
      expect(stream.take).toBeDefined();
    });

    test('verifyMockCalls should verify mock calls', () => {
      const mockFn = jest.fn();
      mockFn('arg1', 'arg2');
      mockFn('arg3', 'arg4');
      
      verifyMockCalls(mockFn, [
        ['arg1', 'arg2'],
        ['arg3', 'arg4']
      ]);
    });

    test('resetAllMocks should reset mocks', () => {
      const mock1 = jest.fn();
      const mock2 = jest.fn();
      
      mock1('test');
      mock2('test');
      
      expect(mock1).toHaveBeenCalledTimes(1);
      expect(mock2).toHaveBeenCalledTimes(1);
      
      resetAllMocks(mock1, mock2);
      
      expect(mock1).toHaveBeenCalledTimes(0);
      expect(mock2).toHaveBeenCalledTimes(0);
    });

    test('createTestConfig should create configuration', () => {
      const config = createTestConfig();
      expect(config).toEqual({
        debug: false,
        enableLogs: false,
        useStreaming: false,
        streamChunkSize: 1024,
        preloadCount: 10
      });
      
      const customConfig = createTestConfig({ debug: true });
      expect(customConfig.debug).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors in integerSqrt', () => {
      expect(() => integerSqrt(-BigInt(1))).toThrow('Square root of negative number is not defined');
    });

    test('should handle errors in factor', () => {
      const registry = new MockPrimeRegistryModel();
      expect(() => registry.factor(BigInt(0))).toThrow('Can only factor positive integers');
      expect(() => registry.factor(-BigInt(5))).toThrow('Can only factor positive integers');
    });

    test('should handle prime index out of range', () => {
      const registry = new MockPrimeRegistryModel();
      expect(() => registry.getPrime(1000)).toThrow('Prime index 1000 is beyond mock data');
    });
  });

  describe('State Management', () => {
    test('should track metrics', () => {
      const registry = new MockPrimeRegistryModel();
      
      // Perform operations to update metrics
      registry.isPrime(BigInt(17));
      registry.factor(BigInt(12));
      registry.createPrimeStream(0);
      
      const state = registry.getState();
      if (state.custom && typeof state.custom === 'object' && 'metrics' in state.custom) {
        const metrics = state.custom.metrics as any;
        expect(metrics.primalityTests).toBeGreaterThan(0);
        expect(metrics.factorizations).toBeGreaterThan(0);
        expect(metrics.streamOperations).toBeGreaterThan(0);
      } else {
        throw new Error('State custom metrics not found');
      }
    });

    test('should provide cache stats', () => {
      const registry = new MockPrimeRegistryModel();
      
      const state = registry.getState();
      if (state.custom && typeof state.custom === 'object' && 'cache' in state.custom) {
        const cache = state.custom.cache as any;
        expect(cache.size).toBeGreaterThan(0);
        expect(cache.primeCount).toBeGreaterThan(0);
      } else {
        throw new Error('State custom cache not found');
      }
    });
  });

  describe('Mock Reset', () => {
    test('should be able to reset mock function calls', () => {
      const registry = createMockPrimeRegistry();
      
      // Make some calls
      registry.isPrime(BigInt(17));
      registry.getPrime(5);
      registry.factor(BigInt(12));

      // Verify calls were made
      expect(registry.isPrime).toHaveBeenCalledTimes(1);
      expect(registry.getPrime).toHaveBeenCalledTimes(1);
      expect(registry.factor).toHaveBeenCalledTimes(1);

      // Clear mocks
      jest.clearAllMocks();

      // Verify mocks were cleared
      expect(registry.isPrime).toHaveBeenCalledTimes(0);
      expect(registry.getPrime).toHaveBeenCalledTimes(0);
      expect(registry.factor).toHaveBeenCalledTimes(0);
    });
  });
});
