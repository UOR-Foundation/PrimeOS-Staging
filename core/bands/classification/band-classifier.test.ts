/**
 * Band Classifier Tests
 * ====================
 * 
 * Test suite for the band classification implementation that handles
 * mapping numbers to optimal processing bands.
 */

import { BandClassifier } from './band-classifier';
import {
  BandType,
  BandClassification,
  BandCriteria,
  PerformanceRequirements,
  QualityRequirements,
  ResourceConstraints
} from '../types';

// Mock the utilities
jest.mock('../utils/helpers', () => ({
  calculateBitSize: jest.fn(),
  classifyByBitSize: jest.fn(),
  analyzeNumberCharacteristics: jest.fn(),
  calculateClassificationConfidence: jest.fn(),
  generateBandAlternatives: jest.fn(),
  validateBandType: jest.fn()
}));

jest.mock('../utils/constants', () => ({
  BAND_CONSTANTS: {
    BIT_RANGES: {
      [BandType.ULTRABASS]: { min: 16, max: 32 },
      [BandType.BASS]: { min: 33, max: 64 },
      [BandType.MIDRANGE]: { min: 65, max: 128 },
      [BandType.UPPER_MID]: { min: 129, max: 256 },
      [BandType.TREBLE]: { min: 257, max: 512 },
      [BandType.SUPER_TREBLE]: { min: 513, max: 1024 },
      [BandType.ULTRASONIC_1]: { min: 1025, max: 2048 },
      [BandType.ULTRASONIC_2]: { min: 2049, max: 4096 }
    }
  },
  PERFORMANCE_CONSTANTS: {
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
  },
  getBitSizeForBand: jest.fn(),
  getExpectedAcceleration: jest.fn()
}));

// Import mocked functions
import {
  calculateBitSize,
  classifyByBitSize,
  analyzeNumberCharacteristics,
  calculateClassificationConfidence,
  generateBandAlternatives,
  validateBandType
} from '../utils/helpers';

import {
  getBitSizeForBand,
  getExpectedAcceleration
} from '../utils/constants';

describe('BandClassifier', () => {
  let classifier: BandClassifier;

  beforeEach(() => {
    jest.clearAllMocks();
    classifier = new BandClassifier({ cacheSize: 100 });

    // Setup default mock returns
    (analyzeNumberCharacteristics as jest.Mock).mockReturnValue({
      bitSize: 64,
      isPrime: false,
      hasSmallFactors: true,
      complexity: 0.5
    });

    (classifyByBitSize as jest.Mock).mockReturnValue(BandType.BASS);
    (calculateClassificationConfidence as jest.Mock).mockReturnValue(0.85);
    (generateBandAlternatives as jest.Mock).mockReturnValue([BandType.ULTRABASS, BandType.MIDRANGE]);
    (getBitSizeForBand as jest.Mock).mockReturnValue({ min: 33, max: 64 });
    (getExpectedAcceleration as jest.Mock).mockReturnValue(2.5);
  });

  describe('Constructor and Configuration', () => {
    test('should create classifier with default cache size', () => {
      const defaultClassifier = new BandClassifier();
      expect(defaultClassifier).toBeDefined();
    });

    test('should create classifier with custom cache size', () => {
      const customClassifier = new BandClassifier({ cacheSize: 500 });
      expect(customClassifier).toBeDefined();
    });

    test('should initialize with empty cache', () => {
      const stats = classifier.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe('Single Number Classification', () => {
    test('should classify a number correctly', () => {
      const number = BigInt(12345);
      const result = classifier.classifyNumber(number);

      expect(result).toBeDefined();
      expect(result.band).toBe(BandType.BASS);
      expect(result.bitSize).toBe(64);
      expect(result.confidence).toBe(0.85);
      expect(result.alternatives).toEqual([BandType.ULTRABASS, BandType.MIDRANGE]);
      expect(analyzeNumberCharacteristics).toHaveBeenCalledWith(number);
    });

    test('should use cache for repeated classifications', () => {
      const number = BigInt(12345);
      
      // First classification
      const result1 = classifier.classifyNumber(number);
      expect(analyzeNumberCharacteristics).toHaveBeenCalledTimes(1);
      
      // Second classification (should use cache)
      const result2 = classifier.classifyNumber(number);
      expect(analyzeNumberCharacteristics).toHaveBeenCalledTimes(1); // Not called again
      expect(result1).toEqual(result2);
      
      const stats = classifier.getCacheStats();
      expect(stats.hitRate).toBe(0.5); // 1 hit out of 2 requests
    });

    test('should handle small numbers', () => {
      (analyzeNumberCharacteristics as jest.Mock).mockReturnValue({
        bitSize: 20,
        isPrime: true,
        hasSmallFactors: false,
        complexity: 0.1
      });
      (classifyByBitSize as jest.Mock).mockReturnValue(BandType.ULTRABASS);

      const result = classifier.classifyNumber(BigInt(7));
      expect(result.band).toBe(BandType.ULTRABASS);
    });

    test('should handle large numbers', () => {
      (analyzeNumberCharacteristics as jest.Mock).mockReturnValue({
        bitSize: 2048,
        isPrime: false,
        hasSmallFactors: false,
        complexity: 0.9
      });
      (classifyByBitSize as jest.Mock).mockReturnValue(BandType.ULTRASONIC_2);

      const result = classifier.classifyNumber(BigInt('123456789012345678901234567890'));
      expect(result.band).toBe(BandType.ULTRASONIC_2);
    });
  });

  describe('Batch Classification', () => {
    test('should classify multiple numbers', () => {
      const numbers = [BigInt(100), BigInt(1000), BigInt(10000)];
      
      // Mock different classifications for different numbers
      (analyzeNumberCharacteristics as jest.Mock)
        .mockReturnValueOnce({ bitSize: 32, isPrime: false, hasSmallFactors: true, complexity: 0.3 })
        .mockReturnValueOnce({ bitSize: 64, isPrime: false, hasSmallFactors: true, complexity: 0.5 })
        .mockReturnValueOnce({ bitSize: 96, isPrime: false, hasSmallFactors: true, complexity: 0.7 });
      
      (classifyByBitSize as jest.Mock)
        .mockReturnValueOnce(BandType.ULTRABASS)
        .mockReturnValueOnce(BandType.BASS)
        .mockReturnValueOnce(BandType.MIDRANGE);

      const result = classifier.classifyBatch(numbers);

      expect(result.individual).toHaveLength(3);
      expect(result.distribution.size).toBeGreaterThan(0);
      expect(result.optimal).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should find optimal band for homogeneous batch', () => {
      const numbers = [BigInt(100), BigInt(200), BigInt(300)];
      
      // All numbers classify to same band
      (classifyByBitSize as jest.Mock).mockReturnValue(BandType.BASS);

      const result = classifier.classifyBatch(numbers);
      expect(result.optimal).toBe(BandType.BASS);
      expect(result.distribution.get(BandType.BASS)).toBe(3);
    });

    test('should handle mixed batch with multiple bands', () => {
      const numbers = [BigInt(10), BigInt(1000), BigInt(100000)];
      
      (analyzeNumberCharacteristics as jest.Mock)
        .mockReturnValueOnce({ bitSize: 16, isPrime: false, hasSmallFactors: true, complexity: 0.1 })
        .mockReturnValueOnce({ bitSize: 64, isPrime: false, hasSmallFactors: true, complexity: 0.5 })
        .mockReturnValueOnce({ bitSize: 128, isPrime: false, hasSmallFactors: true, complexity: 0.8 });
      
      (classifyByBitSize as jest.Mock)
        .mockReturnValueOnce(BandType.ULTRABASS)
        .mockReturnValueOnce(BandType.BASS)
        .mockReturnValueOnce(BandType.MIDRANGE);

      const result = classifier.classifyBatch(numbers);
      expect(result.distribution.size).toBe(3);
      expect(result.confidence).toBeLessThan(1.0); // Should be lower for mixed batch
    });

    test('should handle empty batch', () => {
      const result = classifier.classifyBatch([]);
      expect(result.individual).toHaveLength(0);
      expect(result.distribution.size).toBe(0);
      expect(result.confidence).toBe(0);
    });
  });

  describe('Optimal Band Finding', () => {
    test('should find optimal band based on bit size range', () => {
      const criteria: BandCriteria = {
        bitSizeRange: [50, 100]
      };

      (getBitSizeForBand as jest.Mock).mockImplementation((band: BandType) => {
        const ranges = {
          [BandType.ULTRABASS]: { min: 16, max: 32 },
          [BandType.BASS]: { min: 33, max: 64 },
          [BandType.MIDRANGE]: { min: 65, max: 128 }
        };
        return ranges[band] || { min: 0, max: 0 };
      });

      const result = classifier.findOptimalBand(criteria);
      expect([BandType.BASS, BandType.MIDRANGE]).toContain(result);
    });

    test('should find optimal band based on performance requirements', () => {
      const criteria: BandCriteria = {
        performanceRequirements: {
          minThroughput: 1000,
          maxLatency: 0.1,
          targetAcceleration: 5.0
        }
      };

      (getExpectedAcceleration as jest.Mock).mockImplementation((band: BandType) => {
        const accelerations = {
          [BandType.ULTRABASS]: 1.2,
          [BandType.BASS]: 2.5,
          [BandType.MIDRANGE]: 5.0,
          [BandType.UPPER_MID]: 8.0
        };
        return accelerations[band] || 1.0;
      });

      const result = classifier.findOptimalBand(criteria);
      expect(result).toBeDefined();
    });

    test('should find optimal band based on quality requirements', () => {
      const criteria: BandCriteria = {
        qualityRequirements: {
          minPrecision: 0.99
        }
      };

      const result = classifier.findOptimalBand(criteria);
      expect(result).toBeDefined();
    });

    test('should find optimal band based on resource constraints', () => {
      const criteria: BandCriteria = {
        resourceConstraints: {
          maxMemoryUsage: 1024 * 1024, // 1MB
          maxCpuUsage: 50
        }
      };

      const result = classifier.findOptimalBand(criteria);
      expect(result).toBeDefined();
    });

    test('should handle complex criteria with multiple requirements', () => {
      const criteria: BandCriteria = {
        bitSizeRange: [64, 256],
        performanceRequirements: {
          minThroughput: 500,
          targetAcceleration: 3.0
        },
        qualityRequirements: {
          minPrecision: 0.95
        },
        resourceConstraints: {
          maxMemoryUsage: 10 * 1024 * 1024 // 10MB
        }
      };

      const result = classifier.findOptimalBand(criteria);
      expect(result).toBeDefined();
    });
  });

  describe('Band Metrics', () => {
    test('should get comprehensive metrics for a band', () => {
      (getBitSizeForBand as jest.Mock).mockReturnValue({ min: 65, max: 128 });
      (getExpectedAcceleration as jest.Mock).mockReturnValue(4.2);

      const metrics = classifier.getBandMetrics(BandType.MIDRANGE);

      expect(metrics).toBeDefined();
      expect(metrics.performance).toBeDefined();
      expect(metrics.performance.expectedAcceleration).toBe(4.2);
      expect(metrics.characteristics).toBeDefined();
      expect(metrics.characteristics.bitRange).toEqual({ min: 65, max: 128 });
      expect(metrics.usage).toBeDefined();
    });

    test('should include usage statistics in metrics', () => {
      // Classify some numbers first to generate usage data
      classifier.classifyNumber(BigInt(1000));
      classifier.classifyNumber(BigInt(2000));
      
      const metrics = classifier.getBandMetrics(BandType.BASS);
      expect(metrics.usage.classificationsCount).toBeGreaterThan(0);
    });

    test('should handle metrics for bands with no usage', () => {
      const metrics = classifier.getBandMetrics(BandType.ULTRASONIC_2);
      expect(metrics.usage.classificationsCount).toBe(0);
      expect(metrics.usage.averageConfidence).toBe(0);
    });
  });

  describe('Cache Management', () => {
    test('should clear cache correctly', () => {
      // Add some entries to cache
      classifier.classifyNumber(BigInt(100));
      classifier.classifyNumber(BigInt(200));
      
      expect(classifier.getCacheStats().size).toBeGreaterThan(0);
      
      classifier.clearCache();
      
      const stats = classifier.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    test('should enforce cache size limit', () => {
      const smallCacheClassifier = new BandClassifier({ cacheSize: 2 });
      
      // Add more entries than cache size
      smallCacheClassifier.classifyNumber(BigInt(100));
      smallCacheClassifier.classifyNumber(BigInt(200));
      smallCacheClassifier.classifyNumber(BigInt(300)); // Should evict first entry
      
      const stats = smallCacheClassifier.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(2);
    });

    test('should provide accurate cache statistics', () => {
      const number1 = BigInt(100);
      const number2 = BigInt(200);
      
      // First access - cache miss
      classifier.classifyNumber(number1);
      // Second access - cache hit
      classifier.classifyNumber(number1);
      // Third access - cache miss
      classifier.classifyNumber(number2);
      
      const stats = classifier.getCacheStats();
      expect(stats.hitRate).toBeCloseTo(1/3, 2); // 1 hit out of 3 requests
    });
  });

  describe('Performance Tracking', () => {
    test('should record classification results', () => {
      classifier.recordClassificationResult(BandType.BASS, true);
      classifier.recordClassificationResult(BandType.BASS, false);
      classifier.recordClassificationResult(BandType.MIDRANGE, true);
      
      const stats = classifier.getPerformanceStats();
      expect(stats.bandSuccessRates.has(BandType.BASS)).toBe(true);
      expect(stats.bandSuccessRates.get(BandType.BASS)).toBe(0.5); // 1 success out of 2
    });

    test('should calculate overall success rate', () => {
      classifier.recordClassificationResult(BandType.BASS, true);
      classifier.recordClassificationResult(BandType.BASS, true);
      classifier.recordClassificationResult(BandType.MIDRANGE, false);
      
      const stats = classifier.getPerformanceStats();
      expect(stats.overallSuccessRate).toBeCloseTo(2/3, 2);
    });

    test('should track total classifications', () => {
      classifier.classifyNumber(BigInt(100));
      classifier.classifyNumber(BigInt(200));
      classifier.classifyNumber(BigInt(100)); // Cache hit
      
      const stats = classifier.getPerformanceStats();
      expect(stats.totalClassifications).toBe(3);
      expect(stats.cacheEfficiency).toBeCloseTo(1/3, 2); // 1 cache hit out of 3
    });
  });

  describe('Error Handling', () => {
    test('should handle classification errors gracefully', () => {
      (analyzeNumberCharacteristics as jest.Mock).mockImplementation(() => {
        throw new Error('Analysis failed');
      });

      expect(() => classifier.classifyNumber(BigInt(100))).toThrow('Analysis failed');
    });

    test('should handle invalid band types', () => {
      // Mock validateBandType to return false for testing
      const mockValidateBandType = validateBandType as jest.MockedFunction<typeof validateBandType>;
      mockValidateBandType.mockReturnValue(false);
      
      // This should still work but might produce unexpected results
      const result = classifier.classifyNumber(BigInt(100));
      expect(result).toBeDefined();
    });

    test('should handle zero and negative numbers', () => {
      (analyzeNumberCharacteristics as jest.Mock).mockReturnValue({
        bitSize: 1,
        isPrime: false,
        hasSmallFactors: false,
        complexity: 0
      });
      (classifyByBitSize as jest.Mock).mockReturnValue(BandType.ULTRABASS);

      const result = classifier.classifyNumber(BigInt(0));
      expect(result).toBeDefined();
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle large batches efficiently', () => {
      const largeBatch = Array.from({ length: 1000 }, (_, i) => BigInt(i + 1));
      
      const startTime = Date.now();
      const result = classifier.classifyBatch(largeBatch);
      const endTime = Date.now();
      
      expect(result.individual).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should optimize cache usage for repeated patterns', () => {
      const numbers = [BigInt(100), BigInt(200), BigInt(100), BigInt(200)];
      
      numbers.forEach(n => classifier.classifyNumber(n));
      
      const stats = classifier.getCacheStats();
      expect(stats.hitRate).toBeGreaterThan(0); // Should have some cache hits
    });

    test('should provide consistent results for same input', () => {
      const number = BigInt(12345);
      
      const result1 = classifier.classifyNumber(number);
      const result2 = classifier.classifyNumber(number);
      
      expect(result1).toEqual(result2);
    });
  });

  describe('Band Distribution Analysis', () => {
    test('should analyze band distribution correctly', () => {
      const numbers = [
        BigInt(50),    // ULTRABASS
        BigInt(100),   // BASS  
        BigInt(1000),  // MIDRANGE
        BigInt(100)    // BASS (duplicate)
      ];
      
      (analyzeNumberCharacteristics as jest.Mock)
        .mockReturnValueOnce({ bitSize: 25, isPrime: false, hasSmallFactors: true, complexity: 0.1 })
        .mockReturnValueOnce({ bitSize: 50, isPrime: false, hasSmallFactors: true, complexity: 0.3 })
        .mockReturnValueOnce({ bitSize: 100, isPrime: false, hasSmallFactors: true, complexity: 0.7 })
        .mockReturnValueOnce({ bitSize: 50, isPrime: false, hasSmallFactors: true, complexity: 0.3 });
      
      (classifyByBitSize as jest.Mock)
        .mockReturnValueOnce(BandType.ULTRABASS)
        .mockReturnValueOnce(BandType.BASS)
        .mockReturnValueOnce(BandType.MIDRANGE)
        .mockReturnValueOnce(BandType.BASS);

      const result = classifier.classifyBatch(numbers);
      
      expect(result.distribution.get(BandType.BASS)).toBe(2);
      expect(result.distribution.get(BandType.ULTRABASS)).toBe(1);
      expect(result.distribution.get(BandType.MIDRANGE)).toBe(1);
      expect(result.optimal).toBe(BandType.BASS); // Most common
    });
  });

  describe('Integration with Constants and Helpers', () => {
    test('should use bit size calculations correctly', () => {
      const number = BigInt(12345);
      classifier.classifyNumber(number);
      
      expect(analyzeNumberCharacteristics).toHaveBeenCalledWith(number);
      expect(classifyByBitSize).toHaveBeenCalled();
    });

    test('should use confidence calculations', () => {
      const number = BigInt(12345);
      classifier.classifyNumber(number);
      
      expect(calculateClassificationConfidence).toHaveBeenCalled();
    });

    test('should generate alternatives correctly', () => {
      const number = BigInt(12345);
      const result = classifier.classifyNumber(number);
      
      expect(generateBandAlternatives).toHaveBeenCalled();
      expect(result.alternatives).toBeDefined();
    });
  });
});
