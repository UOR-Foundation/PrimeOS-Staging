/**
 * Test file for the Precision module mock
 * =======================================
 * 
 * This file tests that the mock implementation works correctly
 * and can be used in place of the real module.
 */

// Import from the mock
import {
  MathUtilities,
  PRECISION_CONSTANTS,
  createPrecision,
  precision,
  bitLength,
  mod,
  calculateChecksum,
  verifyValue,
  createCache,
  getVersion,
  clearAllCaches,
  Factor
} from './index';

describe('Precision Module Mock', () => {
  beforeEach(() => {
    // Clear all mock function calls before each test
    jest.clearAllMocks();
  });

  describe('Mock Structure', () => {
    test('should export MathUtilities', () => {
      expect(MathUtilities).toBeDefined();
      expect(MathUtilities.bitLength).toBeDefined();
      expect(MathUtilities.mod).toBeDefined();
      expect(MathUtilities.calculateChecksum).toBeDefined();
      expect(MathUtilities.verifyValue).toBeDefined();
    });

    test('should export PRECISION_CONSTANTS', () => {
      expect(PRECISION_CONSTANTS).toBeDefined();
      expect(PRECISION_CONSTANTS.MAX_SAFE_INTEGER).toBe(9007199254740991);
      expect(PRECISION_CONSTANTS.DEFAULT_CHECKSUM_POWER).toBe(6);
    });

    test('should export factory functions', () => {
      expect(createPrecision).toBeDefined();
      expect(typeof createPrecision).toBe('function');
    });

    test('should export default precision instance', () => {
      expect(precision).toBeDefined();
      expect(precision.bigint).toBeDefined();
      expect(precision.modular).toBeDefined();
      expect(precision.checksums).toBeDefined();
      expect(precision.verification).toBeDefined();
      expect(precision.utils).toBeDefined();
      expect(precision.cache).toBeDefined();
    });
  });

  describe('Mock Functions', () => {
    test('bitLength should return mocked values', () => {
      const result = bitLength(BigInt(42));
      expect(result).toBe(6); // 42 in binary is 101010 (6 bits)
      expect(bitLength).toHaveBeenCalledWith(BigInt(42));
    });

    test('mod should handle Python-compatible modulo', () => {
      const result = mod(-BigInt(5), BigInt(13));
      expect(result).toBe(BigInt(8));
      expect(mod).toHaveBeenCalledWith(-BigInt(5), BigInt(13));
    });

    test('calculateChecksum should work with mock registry', () => {
      const mockRegistry = {
        getPrime: jest.fn((index: number) => BigInt(index * 2 + 1)),
        getIndex: jest.fn((prime: bigint) => Number((prime - BigInt(1)) / BigInt(2)))
      };

      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 }
      ];

      const result = calculateChecksum(factors, mockRegistry);
      expect(typeof result).toBe('bigint');
      expect(calculateChecksum).toHaveBeenCalledWith(factors, mockRegistry);
    });

    test('verifyValue should return mock verification result', () => {
      const mockRegistry = {
        getPrime: jest.fn(),
        getIndex: jest.fn(),
        factor: jest.fn()
      };

      const result = verifyValue(BigInt(42), mockRegistry);
      expect(result).toEqual({
        valid: true,
        coreFactors: [],
        checksumPrime: BigInt(2)
      });
      expect(verifyValue).toHaveBeenCalledWith(BigInt(42), mockRegistry);
    });

    test('createCache should return mock cache', () => {
      const cache = createCache({ maxSize: 100 });
      expect(cache).toBeDefined();
      expect(cache.get).toBeDefined();
      expect(cache.set).toBeDefined();
      expect(cache.clear).toBeDefined();
      expect(createCache).toHaveBeenCalledWith({ maxSize: 100 });
    });

    test('getVersion should return version string', () => {
      const version = getVersion();
      expect(version).toBe('1.0.0');
      expect(getVersion).toHaveBeenCalled();
    });

    test('clearAllCaches should be callable', () => {
      clearAllCaches();
      expect(clearAllCaches).toHaveBeenCalled();
    });
  });

  describe('MathUtilities Integration', () => {
    test('should provide access to all submodule functions', () => {
      // BigInt operations
      expect(MathUtilities.bitLength(BigInt(42))).toBe(6);
      expect(MathUtilities.bitLength).toHaveBeenCalledWith(BigInt(42));

      // Modular operations
      expect(MathUtilities.mod(-BigInt(5), BigInt(13))).toBe(BigInt(8));
      expect(MathUtilities.mod).toHaveBeenCalledWith(-BigInt(5), BigInt(13));

      // Utility operations
      expect(MathUtilities.gcd(BigInt(48), BigInt(18))).toBe(BigInt(2));
      expect(MathUtilities.gcd).toHaveBeenCalledWith(BigInt(48), BigInt(18));

      // Cache operations
      const cache = MathUtilities.createCache();
      expect(cache).toBeDefined();
      expect(MathUtilities.createCache).toHaveBeenCalled();
    });
  });

  describe('Configuration', () => {
    test('createPrecision should accept configuration', () => {
      const config = {
        debug: true,
        enableCaching: true,
        checksumPower: 8
      };

      const customPrecision = createPrecision(config);
      expect(customPrecision).toBeDefined();
      expect(customPrecision.config).toEqual(config);
      expect(createPrecision).toHaveBeenCalledWith(config);
    });

    test('should create shared cache when caching is enabled', () => {
      const customPrecision = createPrecision({ enableCaching: true });
      expect(customPrecision.sharedCache).toBeDefined();
      expect(customPrecision.sharedCache.get).toBeDefined();
      expect(customPrecision.sharedCache.set).toBeDefined();
      expect(customPrecision.sharedCache.clear).toBeDefined();
    });
  });

  describe('Mock Reset', () => {
    test('should be able to reset mock function calls', () => {
      // Make some calls
      bitLength(BigInt(42));
      mod(-BigInt(5), BigInt(13));
      getVersion();

      // Verify calls were made
      expect(bitLength).toHaveBeenCalledTimes(1);
      expect(mod).toHaveBeenCalledTimes(1);
      expect(getVersion).toHaveBeenCalledTimes(1);

      // Clear mocks
      jest.clearAllMocks();

      // Verify mocks were cleared
      expect(bitLength).toHaveBeenCalledTimes(0);
      expect(mod).toHaveBeenCalledTimes(0);
      expect(getVersion).toHaveBeenCalledTimes(0);
    });
  });
});
