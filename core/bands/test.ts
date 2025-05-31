/**
 * bands Tests
 * =====
 * 
 * Test suite for the bands module.
 */

import { 
  createBands,
  BandOptimizationInterface,
  BandOptimizationOptions,
  BandOptimizationState,
  BandType,
  BandClassification
} from './index';
import { ModelLifecycleState } from '../../os/model';

describe('bands', () => {
  let instance: BandOptimizationInterface;
  
  beforeEach(async () => {
    // Create a fresh instance before each test
    instance = createBands({
      debug: true,
      name: 'test-bands'
    });
    
    // Initialize the instance
    await instance.initialize();
  });
  
  afterEach(async () => {
    // Clean up after each test
    await instance.terminate();
  });
  
  describe('Lifecycle Management', () => {
    test('should initialize correctly', () => {
      const state = instance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
    });
    
    test('should reset state', async () => {
      // Perform some operations
      await instance.classifyNumber(123n);
      
      // Reset the instance
      await instance.resetOptimization();
      
      // Check state after reset
      const state = instance.getState();
      expect(state.optimizationLevel).toBe(0);
      expect(state.transitionHistory).toHaveLength(0);
    });
    
    test('should terminate properly', async () => {
      const result = await instance.terminate();
      expect(result.success).toBe(true);
      
      const state = instance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Terminated);
    });
  });
  
  describe('Band Classification', () => {
    test('should classify small numbers to ULTRABASS', async () => {
      const classification = await instance.classifyNumber(123n);
      
      expect(classification.band).toBe(BandType.ULTRABASS);
      expect(classification.bitSize).toBeLessThanOrEqual(32);
      expect(classification.confidence).toBeGreaterThan(0);
      expect(classification.characteristics).toBeDefined();
    });
    
    test('should classify medium numbers to MIDRANGE', async () => {
      const largeNumber = BigInt('0x1234567890ABCDEF1234567890ABCDEF'); // 128-bit number
      const classification = await instance.classifyNumber(largeNumber);
      
      expect(classification.band).toBe(BandType.MIDRANGE);
      expect(classification.bitSize).toBeGreaterThan(64);
      expect(classification.bitSize).toBeLessThanOrEqual(128);
    });
    
    test('should provide alternative bands', async () => {
      const classification = await instance.classifyNumber(100n);
      
      expect(classification.alternatives).toBeDefined();
      expect(Array.isArray(classification.alternatives)).toBe(true);
    });
  });
  
  describe('Batch Optimization', () => {
    test('should optimize batch of numbers', async () => {
      const numbers = [10n, 20n, 30n, 40n, 50n];
      const optimization = await instance.optimizeBatch(numbers);
      
      expect(optimization.selectedBand).toBeDefined();
      expect(optimization.confidence).toBeGreaterThan(0);
      expect(optimization.confidence).toBeLessThanOrEqual(1);
      expect(optimization.expectedPerformance).toBeDefined();
      expect(optimization.recommendations).toBeDefined();
      expect(Array.isArray(optimization.recommendations)).toBe(true);
    });
    
    test('should handle mixed-size number batches', async () => {
      const mixedNumbers = [
        10n,  // ULTRABASS
        BigInt('0x123456789ABCDEF0'),  // BASS
        BigInt('0x123456789ABCDEF0123456789ABCDEF0')  // MIDRANGE
      ];
      
      const optimization = await instance.optimizeBatch(mixedNumbers);
      
      expect(optimization.selectedBand).toBeDefined();
      expect(optimization.confidence).toBeGreaterThan(0);
    });
  });
  
  describe('Configuration Management', () => {
    test('should update band configuration', async () => {
      const config = {
        bitRange: { min: 16, max: 32 },
        primeModulus: 17n,
        processingStrategy: 'DIRECT_COMPUTATION' as any,
        windowFunction: 'RECTANGULAR' as any,
        latticeConfig: {
          dimensions: 2,
          basis: [2n, 3n],
          reduction: 'LLL' as any,
          precision: 64
        },
        crossoverThresholds: [0.1, 0.3, 0.7, 0.9],
        cacheSize: 1000,
        parallelization: {
          enabled: false,
          threadCount: 1,
          workDistribution: 'static' as any,
          syncStrategy: 'locks' as any,
          chunkSize: 1000
        },
        memoryConfig: {
          bufferSize: 8192,
          maxMemoryUsage: 100000,
          cacheStrategy: 'LRU' as any,
          preloadSize: 1024
        },
        accelerationFactor: 2.5,
        qualityThreshold: 0.95
      };
      
      await expect(
        instance.updateConfiguration(BandType.ULTRABASS, config)
      ).resolves.not.toThrow();
    });
  });
  
  describe('Performance Metrics', () => {
    test('should retrieve performance metrics', async () => {
      const metrics = await instance.getPerformanceMetrics();
      
      expect(metrics.bandUtilization).toBeDefined();
      expect(metrics.overallErrorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.transitionOverhead).toBeGreaterThanOrEqual(0);
      expect(metrics.optimalBandSelection).toBeGreaterThanOrEqual(0);
      expect(metrics.averageAccuracy).toBeGreaterThanOrEqual(0);
    });
    
    test('should track band utilization', async () => {
      const metrics = await instance.getPerformanceMetrics();
      
      expect(metrics.bandUtilization.size).toBeGreaterThan(0);
      
      // Check that all band types are tracked
      Object.values(BandType).forEach(band => {
        expect(metrics.bandUtilization.has(band)).toBe(true);
      });
    });
  });
  
  describe('State Management', () => {
    test('should maintain proper state structure', () => {
      const state = instance.getState();
      
      expect(state.lifecycle).toBeDefined();
      expect(state.lastStateChangeTime).toBeDefined();
      expect(state.uptime).toBeDefined();
      expect(state.operationCount).toBeDefined();
      expect(state.currentBand).toBeDefined();
      expect(state.bandMetrics).toBeDefined();
      expect(state.transitionHistory).toBeDefined();
      expect(state.optimizationLevel).toBeDefined();
    });
    
    test('should track operations correctly', async () => {
      const initialState = instance.getState();
      const initialCount = initialState.operationCount.total;
      
      // Perform some operations
      await instance.classifyNumber(42n);
      await instance.getPerformanceMetrics();
      
      const finalState = instance.getState();
      expect(finalState.operationCount.total).toBeGreaterThan(initialCount);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', async () => {
      // Test with invalid band type
      await expect(
        instance.updateConfiguration('invalid' as any, {} as any)
      ).rejects.toThrow();
    });
    
    test('should handle zero and negative numbers', async () => {
      // Test with zero (should not throw)
      const classification = await instance.classifyNumber(0n);
      expect(classification.band).toBeDefined();
      
      // Test with "negative" numbers (they'll be treated as positive by bit length)
      const largeNumber = BigInt('-123');
      const result = await instance.classifyNumber(largeNumber);
      expect(result.band).toBeDefined();
    });
  });
  
  describe('Configuration Options', () => {
    test('should use default options when none provided', async () => {
      const defaultInstance = createBands();
      await defaultInstance.initialize();
      
      expect(defaultInstance).toBeDefined();
      
      await defaultInstance.terminate();
    });
    
    test('should respect custom options', async () => {
      const customOptions: BandOptimizationOptions = {
        debug: true,
        name: 'custom-bands',
        version: '1.2.3',
        enableAdaptiveThresholds: false,
        enablePerformanceMonitoring: false,
        enableSpectralProcessing: false,
        enableCrossoverOptimization: false
      };
      
      const customInstance = createBands(customOptions);
      await customInstance.initialize();
      
      expect(customInstance).toBeDefined();
      
      await customInstance.terminate();
    });
  });
  
  describe('Band Type Coverage', () => {
    test('should cover all band types', async () => {
      const testCases = [
        { value: 1n, expectedBand: BandType.ULTRABASS },  // 1 bit
        { value: BigInt('0xFFFFFFFF'), expectedBand: BandType.ULTRABASS },  // 32 bits
        { value: BigInt('0x1FFFFFFFF'), expectedBand: BandType.BASS },  // 33 bits
        { value: BigInt('0x1' + '0'.repeat(19)), expectedBand: BandType.BASS },  // 64 bits
        { value: BigInt('0x1' + '0'.repeat(20)), expectedBand: BandType.MIDRANGE },  // 65 bits
        { value: BigInt('0x1' + '0'.repeat(31)), expectedBand: BandType.MIDRANGE },  // 128 bits
        { value: BigInt('0x1' + '0'.repeat(32)), expectedBand: BandType.UPPER_MID },  // 129 bits
        { value: BigInt('0x1' + '0'.repeat(63)), expectedBand: BandType.UPPER_MID },  // 256 bits
        { value: BigInt('0x1' + '0'.repeat(64)), expectedBand: BandType.TREBLE },  // 257 bits
        { value: BigInt('0x1' + '0'.repeat(127)), expectedBand: BandType.TREBLE },  // 512 bits
        { value: BigInt('0x1' + '0'.repeat(128)), expectedBand: BandType.SUPER_TREBLE },  // 513 bits
        { value: BigInt('0x1' + '0'.repeat(255)), expectedBand: BandType.SUPER_TREBLE },  // 1024 bits
        { value: BigInt('0x1' + '0'.repeat(256)), expectedBand: BandType.ULTRASONIC_1 },  // 1025 bits
        { value: BigInt('0x1' + '0'.repeat(511)), expectedBand: BandType.ULTRASONIC_1 },  // 2048 bits
        { value: BigInt('0x1' + '0'.repeat(512)), expectedBand: BandType.ULTRASONIC_2 }   // 2049 bits
      ];
      
      for (const testCase of testCases) {
        const classification = await instance.classifyNumber(testCase.value);
        expect(classification.band).toBe(testCase.expectedBand);
      }
    });
  });
});
