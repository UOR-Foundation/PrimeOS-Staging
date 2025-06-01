/**
 * Band Selector Tests
 * ==================
 * 
 * Test suite for the band selector implementation that provides
 * high-level band selection with adaptive capabilities.
 */

import { BandSelectorImpl } from './band-selector';
import { BandClassifier } from './band-classifier';
import {
  BandType,
  BandClassification,
  BandOptimizationResult,
  BandConfiguration,
  BandSelectorOptions,
  BandPerformanceMetrics
} from '../types';

// Mock the band classifier
jest.mock('./band-classifier');

// Mock the utilities
jest.mock('../utils/helpers', () => ({
  calculateBitSize: jest.fn(),
  analyzeNumberCharacteristics: jest.fn(),
  createDefaultBandMetrics: jest.fn(),
  getNeighboringBands: jest.fn()
}));

jest.mock('../utils/constants', () => ({
  getBitSizeForBand: jest.fn(),
  getDefaultPrimeForBand: jest.fn(),
  getExpectedAcceleration: jest.fn()
}));

// Import mocked functions
import {
  createDefaultBandMetrics,
  getNeighboringBands
} from '../utils/helpers';

import {
  getBitSizeForBand,
  getDefaultPrimeForBand,
  getExpectedAcceleration
} from '../utils/constants';

describe('BandSelector', () => {
  let mockClassifier: jest.Mocked<BandClassifier>;
  let selector: BandSelectorImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock classifier
    mockClassifier = {
      classifyNumber: jest.fn(),
      classifyBatch: jest.fn(),
      findOptimalBand: jest.fn(),
      getBandMetrics: jest.fn(),
      clearCache: jest.fn(),
      recordClassificationResult: jest.fn(),
      getPerformanceStats: jest.fn(),
      getCacheStats: jest.fn()
    } as any;

    selector = new BandSelectorImpl(mockClassifier);

    // Setup default mock returns
    (createDefaultBandMetrics as jest.Mock).mockReturnValue({
      throughput: 1000,
      latency: 0.001,
      memoryUsage: 1024,
      errorRate: 0.01,
      accelerationFactor: 2.5
    });

    (getNeighboringBands as jest.Mock).mockReturnValue([BandType.ULTRABASS, BandType.MIDRANGE]);
    (getBitSizeForBand as jest.Mock).mockReturnValue({ min: 33, max: 64 });
    (getDefaultPrimeForBand as jest.Mock).mockReturnValue(BigInt(31));
    (getExpectedAcceleration as jest.Mock).mockReturnValue(2.5);
  });

  describe('Constructor and Configuration', () => {
    test('should create selector with default options', () => {
      const defaultSelector = new BandSelectorImpl(mockClassifier);
      expect(defaultSelector).toBeDefined();
    });

    test('should create selector with custom options', () => {
      const options: BandSelectorOptions = {
        adaptiveThresholds: false,
        performanceMonitoring: false,
        hysteresisMargin: 0.2,
        qualityThreshold: 0.8,
        cacheSize: 500
      };

      const customSelector = new BandSelectorImpl(mockClassifier, options);
      expect(customSelector).toBeDefined();
      
      const config = customSelector.getConfiguration();
      expect(config.hysteresisMargin).toBe(0.2);
      expect(config.qualityThreshold).toBe(0.8);
    });

    test('should configure selector after creation', () => {
      const newOptions: BandSelectorOptions = {
        adaptiveThresholds: true,
        hysteresisMargin: 0.15
      };

      selector.configure(newOptions);
      
      const config = selector.getConfiguration();
      expect(config.adaptiveThresholds).toBe(true);
      expect(config.hysteresisMargin).toBe(0.15);
    });
  });

  describe('Single Number Selection', () => {
    test('should select band for single number', () => {
      const mockClassification: BandClassification = {
        band: BandType.BASS,
        bitSize: 50,
        confidence: 0.85,
        alternatives: [BandType.ULTRABASS, BandType.MIDRANGE],
        characteristics: {
          bitSize: 50,
          magnitude: 1n,
          primeDensity: 0.5,
          factorizationComplexity: 0.3,
          cacheLocality: 0.8,
          parallelizationPotential: 0.6
        }
      };

      mockClassifier.classifyNumber.mockReturnValue(mockClassification);

      const result = selector.selectBand(BigInt(12345));
      expect(result).toBe(BandType.BASS);
      expect(mockClassifier.classifyNumber).toHaveBeenCalledWith(BigInt(12345));
    });

    test('should select band with metrics', () => {
      const mockClassification: BandClassification = {
        band: BandType.MIDRANGE,
        bitSize: 100,
        confidence: 0.92,
        alternatives: [BandType.BASS, BandType.UPPER_MID],
        characteristics: {
          bitSize: 100,
          magnitude: 2n,
          primeDensity: 0.7,
          factorizationComplexity: 0.8,
          cacheLocality: 0.6,
          parallelizationPotential: 0.9
        }
      };

      mockClassifier.classifyNumber.mockReturnValue(mockClassification);

      const result = selector.selectBandWithMetrics(BigInt(67890));
      expect(result).toEqual(mockClassification);
      expect(mockClassifier.classifyNumber).toHaveBeenCalledWith(BigInt(67890));
    });

    test('should apply adaptive selection when enabled', () => {
      selector.configure({ adaptiveThresholds: true });
      
      const mockClassification: BandClassification = {
        band: BandType.BASS,
        bitSize: 60,
        confidence: 0.75,
        alternatives: [BandType.ULTRABASS, BandType.MIDRANGE],
        characteristics: {
          bitSize: 60,
          magnitude: 1n,
          primeDensity: 0.6,
          factorizationComplexity: 0.6,
          cacheLocality: 0.7,
          parallelizationPotential: 0.7
        }
      };

      mockClassifier.classifyNumber.mockReturnValue(mockClassification);
      (getBitSizeForBand as jest.Mock).mockReturnValue({ min: 33, max: 64 });

      const result = selector.selectBand(BigInt(12345));
      expect(result).toBeDefined();
      expect(mockClassifier.classifyNumber).toHaveBeenCalled();
    });
  });

  describe('Multiple Number Selection', () => {
    test('should select optimal band for multiple numbers', () => {
      const numbers = [BigInt(100), BigInt(200), BigInt(300)];
      
      const mockBatchResult = {
        individual: [
          { band: BandType.BASS, bitSize: 50, confidence: 0.8, alternatives: [], characteristics: {} as any },
          { band: BandType.BASS, bitSize: 52, confidence: 0.85, alternatives: [], characteristics: {} as any },
          { band: BandType.MIDRANGE, bitSize: 55, confidence: 0.7, alternatives: [], characteristics: {} as any }
        ],
        optimal: BandType.BASS,
        distribution: new Map([[BandType.BASS, 2], [BandType.MIDRANGE, 1]]),
        confidence: 0.78
      };

      mockClassifier.classifyBatch.mockReturnValue(mockBatchResult);

      const result = selector.selectOptimalBand(numbers);
      expect(result).toBe(BandType.BASS);
      expect(mockClassifier.classifyBatch).toHaveBeenCalledWith(numbers);
    });

    test('should handle empty array', () => {
      const result = selector.selectOptimalBand([]);
      expect(result).toBe(BandType.MIDRANGE); // Default
    });

    test('should handle single number in batch', () => {
      const mockClassification: BandClassification = {
        band: BandType.TREBLE,
        bitSize: 300,
        confidence: 0.9,
        alternatives: [BandType.UPPER_MID, BandType.SUPER_TREBLE],
        characteristics: {
          bitSize: 300,
          magnitude: 5n,
          primeDensity: 0.9,
          factorizationComplexity: 0.9,
          cacheLocality: 0.3,
          parallelizationPotential: 0.95
        }
      };

      mockClassifier.classifyNumber.mockReturnValue(mockClassification);

      const result = selector.selectOptimalBand([BigInt(54321)]);
      expect(result).toBe(BandType.TREBLE);
    });
  });

  describe('Optimal Band Selection with Analysis', () => {
    test('should provide detailed optimization result', () => {
      const numbers = [BigInt(1000), BigInt(2000), BigInt(3000)];
      
      const mockBatchResult = {
        individual: [
          { band: BandType.MIDRANGE, bitSize: 80, confidence: 0.9, alternatives: [], characteristics: {} as any },
          { band: BandType.MIDRANGE, bitSize: 85, confidence: 0.88, alternatives: [], characteristics: {} as any },
          { band: BandType.MIDRANGE, bitSize: 82, confidence: 0.92, alternatives: [], characteristics: {} as any }
        ],
        optimal: BandType.MIDRANGE,
        distribution: new Map([[BandType.MIDRANGE, 3]]),
        confidence: 0.9
      };

      mockClassifier.classifyBatch.mockReturnValue(mockBatchResult);

      const result = selector.selectOptimalBandWithAnalysis(numbers);

      expect(result.selectedBand).toBe(BandType.MIDRANGE);
      expect(result.confidence).toBe(0.9);
      expect(result.expectedPerformance).toBeDefined();
      expect(result.alternatives).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    test('should handle empty array with default result', () => {
      const result = selector.selectOptimalBandWithAnalysis([]);
      
      expect(result.selectedBand).toBe(BandType.MIDRANGE);
      expect(result.confidence).toBe(0.5);
      expect(result.recommendations).toContain('No input numbers provided');
    });

    test('should generate alternatives and recommendations', () => {
      const numbers = [BigInt(500), BigInt(600)];
      
      const mockBatchResult = {
        individual: [
          { band: BandType.BASS, bitSize: 45, confidence: 0.6, alternatives: [], characteristics: {} as any },
          { band: BandType.MIDRANGE, bitSize: 65, confidence: 0.7, alternatives: [], characteristics: {} as any }
        ],
        optimal: BandType.BASS,
        distribution: new Map([[BandType.BASS, 1], [BandType.MIDRANGE, 1]]),
        confidence: 0.4 // Low confidence
      };

      mockClassifier.classifyBatch.mockReturnValue(mockBatchResult);

      const result = selector.selectOptimalBandWithAnalysis(numbers);

      expect(result.alternatives.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('Low confidence'))).toBe(true);
    });
  });

  describe('Performance-Based Adaptation', () => {
    test('should adapt band selection based on performance metrics', () => {
      const mockMetrics: BandPerformanceMetrics = {
        bandUtilization: new Map([
          [BandType.BASS, 0.8],
          [BandType.MIDRANGE, 0.6],
          [BandType.TREBLE, 0.9]
        ]),
        transitionOverhead: 0.05,
        averageAccuracy: 0.95,
        overallErrorRate: 0.02,
        optimalBandSelection: 0.92
      };

      const result = selector.adaptBandSelection(mockMetrics);

      expect(result).toBeDefined();
      expect(result.band).toBeDefined();
      expect(result.config).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(result.lastUpdated).toBeGreaterThan(0);
    });

    test('should update adaptive thresholds based on performance', () => {
      const mockMetrics: BandPerformanceMetrics = {
        bandUtilization: new Map([
          [BandType.MIDRANGE, 0.95] // High utilization
        ]),
        transitionOverhead: 0.1,
        averageAccuracy: 0.88,
        overallErrorRate: 0.03,
        optimalBandSelection: 0.85
      };

      const result = selector.adaptBandSelection(mockMetrics);

      expect(result.config.accelerationFactor).toBeGreaterThan(0);
      expect(result.config.qualityThreshold).toBeGreaterThan(0);
    });

    test('should select appropriate strategy based on metrics', () => {
      const highErrorMetrics: BandPerformanceMetrics = {
        bandUtilization: new Map([[BandType.BASS, 0.5]]),
        transitionOverhead: 0.05,
        averageAccuracy: 0.85,
        overallErrorRate: 0.08, // High error rate
        optimalBandSelection: 0.7
      };

      const result = selector.adaptBandSelection(highErrorMetrics);
      expect(result.config.processingStrategy).toBe('DIRECT_COMPUTATION');

      const highUtilizationMetrics: BandPerformanceMetrics = {
        bandUtilization: new Map([[BandType.MIDRANGE, 0.8]]),
        transitionOverhead: 0.05,
        averageAccuracy: 0.95,
        overallErrorRate: 0.02,
        optimalBandSelection: 0.9
      };

      const result2 = selector.adaptBandSelection(highUtilizationMetrics);
      expect(result2.config.processingStrategy).toBe('PARALLEL_SIEVE');
    });
  });

  describe('Configuration Management', () => {
    test('should get current configuration', () => {
      const config = selector.getConfiguration();
      
      expect(config).toBeDefined();
      expect(config.adaptiveThresholds).toBeDefined();
      expect(config.performanceMonitoring).toBeDefined();
      expect(config.hysteresisMargin).toBeDefined();
      expect(config.qualityThreshold).toBeDefined();
      expect(config.cacheSize).toBeDefined();
    });

    test('should merge configurations when updating', () => {
      const originalConfig = selector.getConfiguration();
      
      selector.configure({
        hysteresisMargin: 0.25,
        qualityThreshold: 0.9
      });
      
      const newConfig = selector.getConfiguration();
      
      expect(newConfig.hysteresisMargin).toBe(0.25);
      expect(newConfig.qualityThreshold).toBe(0.9);
      expect(newConfig.adaptiveThresholds).toBe(originalConfig.adaptiveThresholds); // Unchanged
    });
  });

  describe('Adaptive Threshold Logic', () => {
    test('should apply hysteresis margin when enabled', () => {
      selector.configure({ 
        adaptiveThresholds: true,
        hysteresisMargin: 0.2 
      });

      const mockClassification: BandClassification = {
        band: BandType.BASS,
        bitSize: 62, // Close to boundary
        confidence: 0.8,
        alternatives: [BandType.MIDRANGE],
        characteristics: {
          bitSize: 62,
          magnitude: 1n,
          primeDensity: 0.6,
          factorizationComplexity: 0.6,
          cacheLocality: 0.75,
          parallelizationPotential: 0.7
        }
      };

      mockClassifier.classifyNumber.mockReturnValue(mockClassification);
      (getBitSizeForBand as jest.Mock).mockReturnValue({ min: 33, max: 64 });

      const result = selector.selectBand(BigInt(12345));
      expect(result).toBeDefined();
    });

    test('should consider neighboring bands in adaptive mode', () => {
      selector.configure({ adaptiveThresholds: true });

      const mockClassification: BandClassification = {
        band: BandType.MIDRANGE,
        bitSize: 100,
        confidence: 0.75,
        alternatives: [BandType.BASS, BandType.UPPER_MID],
        characteristics: {
          bitSize: 100,
          magnitude: 2n,
          primeDensity: 0.7,
          factorizationComplexity: 0.7,
          cacheLocality: 0.6,
          parallelizationPotential: 0.8
        }
      };

      mockClassifier.classifyNumber.mockReturnValue(mockClassification);
      (getNeighboringBands as jest.Mock).mockReturnValue([BandType.BASS, BandType.UPPER_MID]);

      const result = selector.selectBand(BigInt(98765));
      expect(result).toBeDefined();
      expect(getNeighboringBands).toHaveBeenCalledWith(BandType.MIDRANGE);
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should update performance data when monitoring enabled', () => {
      selector.configure({ performanceMonitoring: true });

      const mockClassification: BandClassification = {
        band: BandType.TREBLE,
        bitSize: 400,
        confidence: 0.88,
        alternatives: [],
        characteristics: {
          bitSize: 400,
          magnitude: 6n,
          primeDensity: 0.95,
          factorizationComplexity: 0.95,
          cacheLocality: 0.2,
          parallelizationPotential: 0.98
        }
      };

      mockClassifier.classifyNumber.mockReturnValue(mockClassification);

      selector.selectBandWithMetrics(BigInt(123456789));
      
      // Performance data should be updated internally
      expect(mockClassifier.classifyNumber).toHaveBeenCalled();
    });

    test('should not monitor performance when disabled', () => {
      selector.configure({ performanceMonitoring: false });

      const mockClassification: BandClassification = {
        band: BandType.BASS,
        bitSize: 40,
        confidence: 0.9,
        alternatives: [],
        characteristics: {
          bitSize: 40,
          magnitude: 1n,
          primeDensity: 0.4,
          factorizationComplexity: 0.2,
          cacheLocality: 0.9,
          parallelizationPotential: 0.4
        }
      };

      mockClassifier.classifyNumber.mockReturnValue(mockClassification);

      const result = selector.selectBandWithMetrics(BigInt(567));
      expect(result).toEqual(mockClassification);
    });
  });

  describe('Error Handling', () => {
    test('should handle classifier errors gracefully', () => {
      mockClassifier.classifyNumber.mockImplementation(() => {
        throw new Error('Classification failed');
      });

      expect(() => selector.selectBand(BigInt(12345))).toThrow('Classification failed');
    });

    test('should handle batch classification errors', () => {
      mockClassifier.classifyBatch.mockImplementation(() => {
        throw new Error('Batch classification failed');
      });

      expect(() => selector.selectOptimalBand([BigInt(100), BigInt(200)])).toThrow('Batch classification failed');
    });

    test('should provide fallback behavior for analysis errors', () => {
      mockClassifier.classifyBatch.mockImplementation(() => {
        throw new Error('Analysis failed');
      });

      expect(() => selector.selectOptimalBandWithAnalysis([BigInt(123)])).toThrow('Analysis failed');
    });
  });

  describe('Integration with Utilities', () => {
    test('should use neighboring bands utility', () => {
      const mockClassification: BandClassification = {
        band: BandType.MIDRANGE,
        bitSize: 90,
        confidence: 0.85,
        alternatives: [BandType.BASS, BandType.UPPER_MID],
        characteristics: {
          bitSize: 90,
          magnitude: 2n,
          primeDensity: 0.65,
          factorizationComplexity: 0.7,
          cacheLocality: 0.65,
          parallelizationPotential: 0.75
        }
      };

      mockClassifier.classifyNumber.mockReturnValue(mockClassification);
      selector.configure({ adaptiveThresholds: true });

      selector.selectBand(BigInt(555));
      
      expect(getNeighboringBands).toHaveBeenCalled();
    });

    test('should use bit size utility', () => {
      const mockClassification: BandClassification = {
        band: BandType.BASS,
        bitSize: 50,
        confidence: 0.8,
        alternatives: [],
        characteristics: {
          bitSize: 50,
          magnitude: 1n,
          primeDensity: 0.5,
          factorizationComplexity: 0.5,
          cacheLocality: 0.8,
          parallelizationPotential: 0.6
        }
      };

      mockClassifier.classifyNumber.mockReturnValue(mockClassification);

      selector.selectBand(BigInt(777));
      
      // getBitSizeForBand should be called during adaptive selection
      expect(getBitSizeForBand).toHaveBeenCalled();
    });

    test('should use default band metrics utility', () => {
      const numbers = [BigInt(888)];
      
      const mockBatchResult = {
        individual: [
          { band: BandType.BASS, bitSize: 45, confidence: 0.9, alternatives: [], characteristics: {} as any }
        ],
        optimal: BandType.BASS,
        distribution: new Map([[BandType.BASS, 1]]),
        confidence: 0.9
      };

      mockClassifier.classifyBatch.mockReturnValue(mockBatchResult);

      selector.selectOptimalBandWithAnalysis(numbers);
      
      expect(createDefaultBandMetrics).toHaveBeenCalled();
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle mixed confidence scenarios', () => {
      const numbers = [BigInt(100), BigInt(200), BigInt(300), BigInt(400)];
      
      const mockBatchResult = {
        individual: [
          { band: BandType.BASS, bitSize: 30, confidence: 0.9, alternatives: [], characteristics: {} as any },
          { band: BandType.BASS, bitSize: 35, confidence: 0.3, alternatives: [], characteristics: {} as any }, // Low confidence
          { band: BandType.MIDRANGE, bitSize: 70, confidence: 0.8, alternatives: [], characteristics: {} as any },
          { band: BandType.BASS, bitSize: 40, confidence: 0.85, alternatives: [], characteristics: {} as any }
        ],
        optimal: BandType.BASS,
        distribution: new Map([[BandType.BASS, 3], [BandType.MIDRANGE, 1]]),
        confidence: 0.7125 // Average
      };

      mockClassifier.classifyBatch.mockReturnValue(mockBatchResult);

      const result = selector.selectOptimalBandWithAnalysis(numbers);
      
      expect(result.selectedBand).toBe(BandType.BASS);
      expect(result.confidence).toBeCloseTo(0.7125, 3);
    });

    test('should provide appropriate recommendations for diverse inputs', () => {
      const numbers = Array.from({ length: 10 }, (_, i) => BigInt(Math.pow(10, i + 1)));
      
      const mockBatchResult = {
        individual: numbers.map((_, i) => ({
          band: i < 3 ? BandType.BASS : i < 6 ? BandType.MIDRANGE : BandType.TREBLE,
          bitSize: 30 + i * 10,
          confidence: 0.8,
          alternatives: [],
          characteristics: {} as any
        })),
        optimal: BandType.MIDRANGE,
        distribution: new Map([
          [BandType.BASS, 3],
          [BandType.MIDRANGE, 3],
          [BandType.TREBLE, 4]
        ]),
        confidence: 0.5 // Low due to diversity
      };

      mockClassifier.classifyBatch.mockReturnValue(mockBatchResult);

      const result = selector.selectOptimalBandWithAnalysis(numbers);
      
      expect(result.recommendations.some(r => r.includes('High band diversity'))).toBe(true);
    });
  });
});
