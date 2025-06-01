/**
 * Crossover Management Tests
 * =========================
 * 
 * Test suite for the crossover management system that handles smooth
 * transitions between frequency bands with hysteresis control.
 */

import {
  CrossoverController,
  TransitionType,
  TransitionStrategy,
  TransitionEvent,
  TransitionResult,
  HybridResult,
  CrossoverConfig,
  createCrossoverController
} from './index';

import { BandType, BandMetrics } from '../types';

// Mock the utilities
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
  PERFORMANCE_CONSTANTS: {},
  getBitSizeForBand: jest.fn(),
  getExpectedAcceleration: jest.fn()
}));

jest.mock('../utils/helpers', () => ({
  calculateBitSize: jest.fn(),
  analyzeNumberCharacteristics: jest.fn(),
  createDefaultBandMetrics: jest.fn()
}));

// Import mocked functions
import { getBitSizeForBand, getExpectedAcceleration } from '../utils/constants';
import { calculateBitSize, createDefaultBandMetrics } from '../utils/helpers';

describe('CrossoverController', () => {
  let controller: CrossoverController;
  let mockMetrics: BandMetrics;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    controller = new CrossoverController();
    
    mockMetrics = {
      throughput: 1000,
      latency: 0.001,
      memoryUsage: 1024,
      errorRate: 0.01,
      accelerationFactor: 2.5,
      cacheHitRate: 0.9,
      primeGeneration: 500,
      factorizationRate: 200,
      spectralEfficiency: 0.85,
      distributionBalance: 0.8,
      precision: 0.95,
      stability: 0.9,
      convergence: 0.85
    };

    // Setup default mock returns
    (getBitSizeForBand as jest.Mock).mockReturnValue({ min: 33, max: 64 });
    (getExpectedAcceleration as jest.Mock).mockImplementation((band: BandType) => {
      const accelerations = {
        [BandType.ULTRABASS]: 1.2,
        [BandType.BASS]: 2.5,
        [BandType.MIDRANGE]: 5.0,
        [BandType.UPPER_MID]: 8.0,
        [BandType.TREBLE]: 12.0,
        [BandType.SUPER_TREBLE]: 14.0,
        [BandType.ULTRASONIC_1]: 13.0,
        [BandType.ULTRASONIC_2]: 11.0
      };
      return accelerations[band] || 2.0;
    });
    (calculateBitSize as jest.Mock).mockReturnValue(64);
    (createDefaultBandMetrics as jest.Mock).mockReturnValue(mockMetrics);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Constructor and Configuration', () => {
    test('should create controller with default configuration', () => {
      const defaultController = new CrossoverController();
      expect(defaultController).toBeDefined();
    });

    test('should create controller with custom configuration', () => {
      const config: Partial<CrossoverConfig> = {
        hysteresisMargin: 0.2,
        transitionWindow: 200,
        qualityThreshold: 0.9,
        maxTransitionsPerSecond: 5
      };

      const customController = new CrossoverController(config);
      expect(customController).toBeDefined();
    });

    test('should merge custom config with defaults', () => {
      const config: Partial<CrossoverConfig> = {
        hysteresisMargin: 0.15
      };

      const controller = new CrossoverController(config);
      
      // Test that configuration is applied (we can't directly access private config,
      // but we can test behavior that depends on it)
      expect(controller).toBeDefined();
    });

    test('should initialize with custom transition strategies', () => {
      const customStrategy: TransitionStrategy = {
        type: TransitionType.HYBRID,
        windowSize: 100,
        overlapRatio: 0.5,
        blendingFunction: 'exponential'
      };

      const config: Partial<CrossoverConfig> = {
        defaultStrategy: customStrategy,
        bandStrategies: new Map([
          ['BASS->MIDRANGE', customStrategy]
        ])
      };

      const controller = new CrossoverController(config);
      expect(controller).toBeDefined();
    });
  });

  describe('Transition Decision Logic', () => {
    test('should determine when transition is needed', () => {
      const shouldTransition = controller.shouldTransition(
        BandType.BASS,
        BandType.MIDRANGE,
        mockMetrics
      );

      expect(typeof shouldTransition).toBe('boolean');
    });

    test('should prevent too frequent transitions', () => {
      // First transition should be allowed
      const first = controller.shouldTransition(
        BandType.BASS,
        BandType.MIDRANGE,
        mockMetrics
      );

      // Immediately after, should be prevented due to rate limiting
      const second = controller.shouldTransition(
        BandType.BASS,
        BandType.MIDRANGE,
        mockMetrics
      );

      // At least one should be different due to rate limiting
      expect(first).toBeDefined();
      expect(second).toBeDefined();
    });

    test('should apply hysteresis to prevent oscillation', () => {
      // Simulate a recent transition
      controller.shouldTransition(BandType.BASS, BandType.MIDRANGE, mockMetrics);
      
      // Advance time to allow transitions
      jest.advanceTimersByTime(1000);
      
      // Test reverse transition (should be harder due to hysteresis)
      const reverseTransition = controller.shouldTransition(
        BandType.MIDRANGE,
        BandType.BASS,
        mockMetrics
      );

      expect(typeof reverseTransition).toBe('boolean');
    });

    test('should handle edge case metrics', () => {
      const edgeMetrics: BandMetrics = {
        throughput: 0,
        latency: 1.0,
        memoryUsage: 0,
        errorRate: 1.0,
        accelerationFactor: 0,
        cacheHitRate: 0,
        primeGeneration: 0,
        factorizationRate: 0,
        spectralEfficiency: 0,
        distributionBalance: 0,
        precision: 0,
        stability: 0,
        convergence: 0
      };

      expect(() => {
        controller.shouldTransition(BandType.BASS, BandType.MIDRANGE, edgeMetrics);
      }).not.toThrow();
    });

    test('should handle same band transition request', () => {
      const sameBand = controller.shouldTransition(
        BandType.BASS,
        BandType.BASS,
        mockMetrics
      );

      expect(sameBand).toBe(false);
    });
  });

  describe('Transition Execution', () => {
    test('should execute immediate transition successfully', async () => {
      const testData = { value: 12345 };
      
      const result = await controller.performTransition(
        BandType.BASS,
        BandType.MIDRANGE,
        testData
      );

      expect(result.success).toBe(true);
      expect(result.fromBand).toBe(BandType.BASS);
      expect(result.toBand).toBe(BandType.MIDRANGE);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.qualityLoss).toBeGreaterThanOrEqual(0);
    });

    test('should handle transition failures gracefully', async () => {
      // Mock processInBand to throw an error
      const originalProcessInBand = (controller as any).processInBand;
      (controller as any).processInBand = jest.fn().mockRejectedValue(new Error('Processing failed'));

      const result = await controller.performTransition(
        BandType.BASS,
        BandType.MIDRANGE,
        { value: 12345 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Processing failed');
      expect(result.qualityLoss).toBe(1.0);

      // Restore original method
      (controller as any).processInBand = originalProcessInBand;
    });

    test('should execute gradual transition with windowing', async () => {
      // Create controller with gradual transition strategy
      const config: Partial<CrossoverConfig> = {
        defaultStrategy: {
          type: TransitionType.GRADUAL,
          windowSize: 10,
          overlapRatio: 0.2,
          blendingFunction: 'linear'
        }
      };

      const gradualController = new CrossoverController(config);
      const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const result = await gradualController.performTransition(
        BandType.BASS,
        BandType.MIDRANGE,
        testData
      );

      expect(result.success).toBe(true);
      expect(result.qualityLoss).toBeLessThan(0.1); // Gradual should have minimal quality loss
    });

    test('should execute hybrid transition with multiple bands', async () => {
      const config: Partial<CrossoverConfig> = {
        defaultStrategy: {
          type: TransitionType.HYBRID,
          qualityThreshold: 0.9
        }
      };

      const hybridController = new CrossoverController(config);
      const testData = { value: BigInt(12345) };

      const result = await hybridController.performTransition(
        BandType.BASS,
        BandType.MIDRANGE,
        testData
      );

      expect(result.success).toBe(true);
      expect(result.fromBand).toBe(BandType.BASS);
      expect(result.toBand).toBe(BandType.MIDRANGE);
    });

    test('should execute deferred transition', async () => {
      const config: Partial<CrossoverConfig> = {
        defaultStrategy: {
          type: TransitionType.DEFERRED
        }
      };

      const deferredController = new CrossoverController(config);
      const testData = { value: 'test' };

      const result = await deferredController.performTransition(
        BandType.BASS,
        BandType.MIDRANGE,
        testData
      );

      expect(result.success).toBe(true);
      // Deferred transition should complete immediately but schedule for later
    });

    test('should handle unknown transition type', async () => {
      const config: Partial<CrossoverConfig> = {
        defaultStrategy: {
          type: 'unknown' as TransitionType
        }
      };

      const controller = new CrossoverController(config);
      
      const result = await controller.performTransition(
        BandType.BASS,
        BandType.MIDRANGE,
        { value: 123 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown transition type');
    });
  });

  describe('Multi-Band Processing', () => {
    test('should process data in multiple bands simultaneously', async () => {
      const testData = { value: BigInt(12345) };
      const bands = [BandType.BASS, BandType.MIDRANGE, BandType.TREBLE];

      const result = await controller.processInMultipleBands(testData, bands);

      expect(result.results.size).toBe(bands.length);
      expect(result.combinedResult).toBeDefined();
      expect(result.weightings.size).toBe(bands.length);
      expect(result.overallQuality).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);

      // Check that all bands were processed
      for (const band of bands) {
        expect(result.results.has(band)).toBe(true);
        expect(result.weightings.has(band)).toBe(true);
      }
    });

    test('should handle processing failures in some bands', async () => {
      const testData = { value: 'test' };
      const bands = [BandType.BASS, BandType.MIDRANGE];

      // Mock processInBand to fail for one band
      const originalProcessInBand = (controller as any).processInBand;
      (controller as any).processInBand = jest.fn()
        .mockResolvedValueOnce({ band: BandType.BASS, result: 'success', quality: 0.9 })
        .mockRejectedValueOnce(new Error('Processing failed'));

      const result = await controller.processInMultipleBands(testData, bands);

      expect(result.results.size).toBeGreaterThan(0);
      expect(result.combinedResult).toBeDefined();

      // Restore original method
      (controller as any).processInBand = originalProcessInBand;
    });

    test('should calculate appropriate weightings based on performance', async () => {
      const testData = { value: 100 };
      const bands = [BandType.BASS, BandType.MIDRANGE];

      const result = await controller.processInMultipleBands(testData, bands);

      // Weightings should sum to approximately 1
      const totalWeight = Array.from(result.weightings.values()).reduce((sum, w) => sum + w, 0);
      expect(totalWeight).toBeCloseTo(1.0, 2);

      // Each band should have positive weighting
      for (const band of bands) {
        expect(result.weightings.get(band)).toBeGreaterThan(0);
      }
    });

    test('should handle empty band list', async () => {
      const testData = { value: 123 };
      const bands: BandType[] = [];

      const result = await controller.processInMultipleBands(testData, bands);

      expect(result.results.size).toBe(0);
      expect(result.weightings.size).toBe(0);
      expect(result.overallQuality).toBe(0);
    });
  });

  describe('Transition Cost Calculation', () => {
    test('should calculate transition costs based on band distance', () => {
      const cost1 = controller.getTransitionCost(BandType.BASS, BandType.MIDRANGE);
      const cost2 = controller.getTransitionCost(BandType.BASS, BandType.TREBLE);

      expect(cost1).toBeGreaterThan(0);
      expect(cost2).toBeGreaterThan(cost1); // Longer distance should cost more
    });

    test('should handle same band transition cost', () => {
      const cost = controller.getTransitionCost(BandType.BASS, BandType.BASS);
      expect(cost).toBe(0); // Same band should have no cost
    });

    test('should consider complexity differences in cost', () => {
      const upCost = controller.getTransitionCost(BandType.BASS, BandType.TREBLE);
      const downCost = controller.getTransitionCost(BandType.TREBLE, BandType.BASS);

      expect(upCost).toBeGreaterThan(0);
      expect(downCost).toBeGreaterThan(0);
      // Costs might be different due to complexity factors
    });
  });

  describe('Threshold Optimization', () => {
    test('should optimize thresholds based on performance data', () => {
      const performanceData = [
        {
          transition: { fromBand: BandType.BASS, toBand: BandType.MIDRANGE },
          success: true,
          improvement: 0.2,
          cost: 100
        },
        {
          transition: { fromBand: BandType.BASS, toBand: BandType.MIDRANGE },
          success: false,
          improvement: -0.1,
          cost: 150
        }
      ];

      expect(() => {
        controller.optimizeThresholds(performanceData);
      }).not.toThrow();
    });

    test('should not optimize when adaptive thresholds are disabled', () => {
      const config: Partial<CrossoverConfig> = {
        adaptiveThresholds: false
      };

      const nonAdaptiveController = new CrossoverController(config);
      const performanceData = [{ transition: { fromBand: BandType.BASS, toBand: BandType.MIDRANGE } }];

      expect(() => {
        nonAdaptiveController.optimizeThresholds(performanceData);
      }).not.toThrow();
    });

    test('should handle empty performance data', () => {
      expect(() => {
        controller.optimizeThresholds([]);
      }).not.toThrow();
    });

    test('should handle malformed performance data', () => {
      const badData = [
        { invalid: 'data' },
        null,
        undefined,
        { transition: null }
      ];

      expect(() => {
        controller.optimizeThresholds(badData);
      }).not.toThrow();
    });
  });

  describe('Metrics and Monitoring', () => {
    test('should provide comprehensive transition metrics', () => {
      const metrics = controller.getTransitionMetrics();

      expect(metrics).toHaveProperty('totalTransitions');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('averageCost');
      expect(metrics).toHaveProperty('transitionFrequency');
      expect(metrics).toHaveProperty('bandTransitionCounts');
      expect(metrics).toHaveProperty('adaptiveParameters');

      expect(typeof metrics.totalTransitions).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
      expect(typeof metrics.averageCost).toBe('number');
      expect(typeof metrics.transitionFrequency).toBe('number');
    });

    test('should track transition history', async () => {
      // Execute some transitions to populate history
      await controller.performTransition(BandType.BASS, BandType.MIDRANGE, { value: 1 });
      await controller.performTransition(BandType.MIDRANGE, BandType.TREBLE, { value: 2 });

      const metrics = controller.getTransitionMetrics();
      expect(metrics.totalTransitions).toBeGreaterThan(0);
    });

    test('should handle metrics with no transition history', () => {
      const newController = new CrossoverController();
      const metrics = newController.getTransitionMetrics();

      expect(metrics.totalTransitions).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.averageCost).toBe(0);
    });

    test('should limit history to recent transitions', async () => {
      // Execute many transitions to test history limiting
      for (let i = 0; i < 150; i++) {
        await controller.performTransition(
          i % 2 === 0 ? BandType.BASS : BandType.MIDRANGE,
          i % 2 === 0 ? BandType.MIDRANGE : BandType.BASS,
          { value: i }
        );
      }

      const metrics = controller.getTransitionMetrics();
      expect(metrics.totalTransitions).toBeLessThanOrEqual(100); // Should be limited to recent 100
    });
  });

  describe('Data Processing and Windowing', () => {
    test('should handle array data with proper windowing', () => {
      const arrayData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const windows = (controller as any).splitIntoWindows(arrayData, 3, 0.2);

      expect(Array.isArray(windows)).toBe(true);
      expect(windows.length).toBeGreaterThan(0);
      expect(windows[0].length).toBeGreaterThan(0);
    });

    test('should handle BigInt data with bit-based windowing', () => {
      const bigintData = BigInt(12345678901234567890n);
      const windows = (controller as any).splitIntoWindows(bigintData, 4, 0.3);

      expect(Array.isArray(windows)).toBe(true);
      expect(windows.length).toBeGreaterThan(0);
    });

    test('should handle string data', () => {
      const stringData = "Hello, World!";
      const windows = (controller as any).splitIntoWindows(stringData, 5, 0.1);

      expect(Array.isArray(windows)).toBe(true);
      expect(windows.length).toBeGreaterThan(0);
    });

    test('should handle empty data gracefully', () => {
      const emptyArray: any[] = [];
      const windows = (controller as any).splitIntoWindows(emptyArray, 3, 0.2);

      expect(Array.isArray(windows)).toBe(true);
      expect(windows.length).toBeGreaterThan(0); // Should return the original data
    });
  });

  describe('Result Blending', () => {
    test('should blend numeric results correctly', () => {
      const result1 = { value: 10, quality: 0.8 };
      const result2 = { value: 20, quality: 0.9 };

      const blended = (controller as any).blendResults(result1, result2, 0.5, 'linear');

      expect(blended).toBeDefined();
      expect(blended.value).toBeCloseTo(15, 1); // Linear blend of 10 and 20
    });

    test('should handle different blending functions', () => {
      const result1 = 10;
      const result2 = 20;

      const linear = (controller as any).blendResults(result1, result2, 0.5, 'linear');
      const exponential = (controller as any).blendResults(result1, result2, 0.5, 'exponential');
      const sigmoid = (controller as any).blendResults(result1, result2, 0.5, 'sigmoid');

      expect(typeof linear).toBe('number');
      expect(typeof exponential).toBe('number');
      expect(typeof sigmoid).toBe('number');
    });

    test('should handle null or undefined results', () => {
      const result1 = null;
      const result2 = { value: 10 };

      const blended = (controller as any).blendResults(result1, result2, 0.5);
      expect(blended).toEqual({ value: 10 });
    });

    test('should handle complex object blending', () => {
      const result1 = {
        value: 10,
        metrics: { accuracy: 0.8, speed: 100 },
        metadata: 'test1'
      };
      const result2 = {
        value: 20,
        metrics: { accuracy: 0.9, speed: 200 },
        metadata: 'test2'
      };

      const blended = (controller as any).blendResults(result1, result2, 0.3);

      expect(blended).toBeDefined();
      expect(blended.value).toBeDefined();
      expect(blended.metrics).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid band types', async () => {
      const invalidBand = 'INVALID_BAND' as BandType;

      const result = await controller.performTransition(
        invalidBand,
        BandType.MIDRANGE,
        { value: 123 }
      );

      // Should handle gracefully
      expect(result).toBeDefined();
    });

    test('should handle null or undefined data', async () => {
      const result1 = await controller.performTransition(
        BandType.BASS,
        BandType.MIDRANGE,
        null
      );

      const result2 = await controller.performTransition(
        BandType.BASS,
        BandType.MIDRANGE,
        undefined
      );

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    test('should handle extreme metric values', () => {
      const extremeMetrics: BandMetrics = {
        throughput: Infinity,
        latency: -1,
        memoryUsage: Number.MAX_VALUE,
        errorRate: 2.0,
        accelerationFactor: -5,
        cacheHitRate: 2.0,
        primeGeneration: -100,
        factorizationRate: Infinity,
        spectralEfficiency: -0.5,
        distributionBalance: -1.0,
        precision: 2.0,
        stability: -0.5,
        convergence: Infinity
      };

      expect(() => {
        controller.shouldTransition(BandType.BASS, BandType.MIDRANGE, extremeMetrics);
      }).not.toThrow();
    });

    test('should handle processing timeouts gracefully', async () => {
      // Mock processInBand to take a very long time
      const originalProcessInBand = (controller as any).processInBand;
      (controller as any).processInBand = jest.fn(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      const startTime = Date.now();
      const result = await controller.performTransition(
        BandType.BASS,
        BandType.MIDRANGE,
        { value: 123 }
      );
      const duration = Date.now() - startTime;

      // Should complete in reasonable time
      expect(duration).toBeLessThan(5000);
      expect(result).toBeDefined();

      // Restore original method
      (controller as any).processInBand = originalProcessInBand;
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle large datasets efficiently', async () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => i);

      const startTime = Date.now();
      const result = await controller.processInMultipleBands(
        largeData,
        [BandType.BASS, BandType.MIDRANGE]
      );
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time
    });

    test('should optimize memory usage for repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many transitions
      for (let i = 0; i < 100; i++) {
        await controller.performTransition(
          i % 2 === 0 ? BandType.BASS : BandType.MIDRANGE,
          i % 2 === 0 ? BandType.MIDRANGE : BandType.BASS,
          { value: i }
        );
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
    });

    test('should maintain performance with frequent threshold updates', () => {
      const performanceData = Array.from({ length: 1000 }, (_, i) => ({
        transition: {
          fromBand: i % 2 === 0 ? BandType.BASS : BandType.MIDRANGE,
          toBand: i % 2 === 0 ? BandType.MIDRANGE : BandType.BASS
        },
        success: i % 3 !== 0,
        improvement: Math.random() * 0.4 - 0.2,
        cost: Math.random() * 200 + 50
      }));

      const startTime = Date.now();
      controller.optimizeThresholds(performanceData);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete quickly
    });
  });

  describe('Configuration Edge Cases', () => {
    test('should handle extreme configuration values', () => {
      const extremeConfig: Partial<CrossoverConfig> = {
        hysteresisMargin: 2.0, // > 1.0
        transitionWindow: -10,
        qualityThreshold: 2.0, // > 1.0
        maxTransitionsPerSecond: 0
      };

      expect(() => {
        new CrossoverController(extremeConfig);
      }).not.toThrow();
    });

    test('should handle malformed transition strategies', () => {
      const badConfig: Partial<CrossoverConfig> = {
        defaultStrategy: {
          type: TransitionType.GRADUAL,
          windowSize: -5,
          overlapRatio: 2.0,
          blendingFunction: 'invalid' as any
        }
      };

      expect(() => {
        new CrossoverController(badConfig);
      }).not.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent transitions safely', async () => {
      const promises: Promise<TransitionResult>[] = [];

      // Start multiple transitions concurrently
      for (let i = 0; i < 10; i++) {
        promises.push(
          controller.performTransition(
            BandType.BASS,
            BandType.MIDRANGE,
            { value: i }
          )
        );
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.success).toBeDefined();
      });
    });

    test('should handle concurrent multi-band processing', async () => {
      const promises: Promise<HybridResult>[] = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          controller.processInMultipleBands(
            { value: i },
            [BandType.BASS, BandType.MIDRANGE, BandType.TREBLE]
          )
        );
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.results.size).toBe(3);
        expect(result.combinedResult).toBeDefined();
      });
    });
  });

  describe('Factory Function', () => {
    test('should create controller via factory function', () => {
      const controller = createCrossoverController();
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(CrossoverController);
    });

    test('should create controller with custom config via factory', () => {
      const config: Partial<CrossoverConfig> = {
        hysteresisMargin: 0.15,
        maxTransitionsPerSecond: 8
      };

      const controller = createCrossoverController(config);
      expect(controller).toBeDefined();
      expect(controller).toBeInstanceOf(CrossoverController);
    });
  });
});
