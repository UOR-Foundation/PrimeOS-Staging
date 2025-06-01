/**
 * Encoding Adapter Tests
 * =====================
 * 
 * Test suite for the encoding module integration adapter.
 */

import {
  EncodingAdapter,
  EncodingAdapterImpl,
  createEncodingAdapter,
  EncodingAdapterConfig
} from './encoding-adapter';

import { BandType, ProcessingContext, WindowFunction, ProcessingStrategy } from '../types';

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

// Mock the encoding module
const mockEncodingModule = {
  encodeText: jest.fn(),
  decodeText: jest.fn(),
  encodeData: jest.fn(),
  decodeChunk: jest.fn(),
  encodeProgram: jest.fn(),
  executeProgram: jest.fn(),
  initialize: jest.fn(),
  getState: jest.fn()
};

describe('EncodingAdapter', () => {
  let adapter: EncodingAdapter;
  let config: Partial<EncodingAdapterConfig>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    config = {
      enableBandOptimization: true,
      chunkSize: 512,
      enableCompression: true,
      enableSpectralEncoding: true,
      timeoutMs: 5000
    };

    adapter = new EncodingAdapterImpl(mockEncodingModule, config);

    // Setup mock returns
    mockEncodingModule.getState.mockReturnValue({ lifecycle: 'Ready' });
    mockEncodingModule.encodeText.mockResolvedValue([1n, 2n, 3n]);
    mockEncodingModule.decodeText.mockResolvedValue('test');
    mockEncodingModule.encodeData.mockResolvedValue(42n);
    mockEncodingModule.decodeChunk.mockResolvedValue({ type: 'data', value: 42 });
  });

  describe('Constructor and Configuration', () => {
    test('should create adapter with default configuration', () => {
      const defaultAdapter = new EncodingAdapterImpl(mockEncodingModule);
      expect(defaultAdapter).toBeDefined();
    });

    test('should create adapter with custom configuration', () => {
      const customConfig: Partial<EncodingAdapterConfig> = {
        enableBandOptimization: false,
        chunkSize: 2048,
        enableCompression: false
      };

      const customAdapter = new EncodingAdapterImpl(mockEncodingModule, customConfig);
      expect(customAdapter).toBeDefined();
    });

    test('should merge custom config with defaults', () => {
      const partialConfig = { chunkSize: 256 };
      const adapter = new EncodingAdapterImpl(mockEncodingModule, partialConfig);
      expect(adapter).toBeDefined();
    });
  });

  describe('Core Encoding Operations', () => {
    test('should encode text in band', async () => {
      const text = 'Hello, World!';
      const result = await adapter.encodeInBand(text, BandType.MIDRANGE);

      expect(result).toEqual([1n, 2n, 3n]);
      expect(mockEncodingModule.encodeText).toHaveBeenCalledWith(text);
    });

    test('should encode numbers in band', async () => {
      const number = 42;
      const result = await adapter.encodeInBand(number, BandType.BASS);

      expect(result).toBe(42n);
      expect(mockEncodingModule.encodeData).toHaveBeenCalledWith(0, 42);
    });

    test('should encode bigint in band', async () => {
      const bigintValue = 12345n;
      const result = await adapter.encodeInBand(bigintValue, BandType.TREBLE);

      expect(result).toBe(42n);
      expect(mockEncodingModule.encodeData).toHaveBeenCalledWith(0, 12345);
    });

    test('should encode arrays as programs', async () => {
      const array = [1, 2, 3, 4];
      mockEncodingModule.encodeProgram.mockResolvedValue([10n, 20n, 30n, 40n]);

      const result = await adapter.encodeInBand(array, BandType.UPPER_MID);

      expect(result).toEqual([10n, 20n, 30n, 40n]);
      expect(mockEncodingModule.encodeProgram).toHaveBeenCalled();
    });

    test('should handle encoding failures', async () => {
      mockEncodingModule.encodeText.mockRejectedValue(new Error('Encoding failed'));

      await expect(adapter.encodeInBand('test', BandType.MIDRANGE))
        .rejects.toThrow('Band-optimized encoding failed');
    });

    test('should throw error for unsupported data types', async () => {
      const unsupported = Symbol('test');

      await expect(adapter.encodeInBand(unsupported, BandType.MIDRANGE))
        .rejects.toThrow('Unsupported data type for real encoding');
    });
  });

  describe('Core Decoding Operations', () => {
    test('should decode text arrays', async () => {
      const encoded = [1n, 2n, 3n];
      const result = await adapter.decodeInBand(encoded, BandType.MIDRANGE);

      expect(result).toBe('test');
      expect(mockEncodingModule.decodeText).toHaveBeenCalledWith(encoded);
    });

    test('should decode single chunks when text decoding fails', async () => {
      const encoded = [1n, 2n, 3n];
      mockEncodingModule.decodeText.mockRejectedValue(new Error('Not text'));
      mockEncodingModule.decodeChunk.mockResolvedValue({ type: 'data', value: 1 });

      const result = await adapter.decodeInBand(encoded, BandType.MIDRANGE);

      expect(Array.isArray(result)).toBe(true);
      expect(mockEncodingModule.decodeChunk).toHaveBeenCalledTimes(3);
    });

    test('should decode single bigint chunks', async () => {
      const encoded = 42n;
      const result = await adapter.decodeInBand(encoded, BandType.BASS);

      expect(result).toEqual({ type: 'data', value: 42 });
      expect(mockEncodingModule.decodeChunk).toHaveBeenCalledWith(encoded);
    });

    test('should handle decoding failures', async () => {
      mockEncodingModule.decodeText.mockRejectedValue(new Error('Decoding failed'));
      mockEncodingModule.decodeChunk.mockRejectedValue(new Error('Chunk decode failed'));

      await expect(adapter.decodeInBand([1n, 2n], BandType.MIDRANGE))
        .rejects.toThrow('Band-optimized decoding failed');
    });

    test('should throw error for unsupported encoded types', async () => {
      const unsupported = 'not-encoded';

      await expect(adapter.decodeInBand(unsupported, BandType.MIDRANGE))
        .rejects.toThrow('Unsupported encoded type for real decoding');
    });
  });

  describe('Chunk Processing', () => {
    test('should process bigint chunks', async () => {
      const chunks = [1n, 2n, 3n];
      const result = await adapter.processChunksInBand(chunks, BandType.MIDRANGE);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(mockEncodingModule.decodeChunk).toHaveBeenCalledTimes(3);
    });

    test('should process and encode non-bigint chunks', async () => {
      const chunks = ['test1', 'test2'];
      const result = await adapter.processChunksInBand(chunks, BandType.BASS);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    test('should handle chunk processing failures', async () => {
      mockEncodingModule.decodeChunk.mockRejectedValue(new Error('Chunk processing failed'));

      await expect(adapter.processChunksInBand([1n], BandType.MIDRANGE))
        .rejects.toThrow('Band-optimized chunk processing failed');
    });

    test('should process empty chunk arrays', async () => {
      const result = await adapter.processChunksInBand([], BandType.MIDRANGE);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('Performance Evaluation', () => {
    test('should evaluate performance for different bands', async () => {
      const data = ['test1', 'test2', 'test3'];

      const ultraBassScore = await adapter.evaluatePerformance(data, BandType.ULTRABASS);
      const midrangeScore = await adapter.evaluatePerformance(data, BandType.MIDRANGE);
      const ultrasonicScore = await adapter.evaluatePerformance(data, BandType.ULTRASONIC_1);

      expect(ultraBassScore).toBeGreaterThan(0);
      expect(midrangeScore).toBeGreaterThan(0);
      expect(ultrasonicScore).toBeGreaterThan(0);

      // Midrange should score highest for encoding operations
      expect(midrangeScore).toBeGreaterThan(ultraBassScore);
    });

    test('should cache performance results', async () => {
      const data = ['test'];

      const score1 = await adapter.evaluatePerformance(data, BandType.MIDRANGE);
      const score2 = await adapter.evaluatePerformance(data, BandType.MIDRANGE);

      expect(score1).toBe(score2);
    });

    test('should handle empty data arrays', async () => {
      const score = await adapter.evaluatePerformance([], BandType.MIDRANGE);
      expect(score).toBeGreaterThan(0);
    });

    test('should adjust scores based on data characteristics', async () => {
      const smallData = ['a'];
      const largeData = new Array(1000).fill('test');

      const smallScore = await adapter.evaluatePerformance(smallData, BandType.MIDRANGE);
      const largeScore = await adapter.evaluatePerformance(largeData, BandType.MIDRANGE);

      expect(smallScore).toBeGreaterThan(0);
      expect(largeScore).toBeGreaterThan(0);
    });
  });

  describe('Context Operations', () => {
    test('should support all contexts', () => {
      const context: ProcessingContext = {
        band: BandType.MIDRANGE,
        bitSize: 128,
        workload: { type: 'encoding', complexity: 0.5 },
        resources: { cpu: 0.5, memory: 0.3, io: 0.2 },
        constraints: { maxMemoryUsage: 1024 * 1024 }
      };

      expect(adapter.supportsContext(context)).toBe(true);
    });

    test('should evaluate context with different bands', async () => {
      const contexts = Object.values(BandType).map(band => ({
        band,
        bitSize: 128,
        workload: { type: 'encoding', complexity: 0.5 },
        resources: { cpu: 0.5, memory: 0.3, io: 0.2 },
        constraints: { maxMemoryUsage: 1024 * 1024 }
      }));

      for (const context of contexts) {
        const score = await adapter.evaluateContext(context);
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    });

    test('should give bonus for encoding workloads', async () => {
      const encodingContext: ProcessingContext = {
        band: BandType.MIDRANGE,
        bitSize: 128,
        workload: { type: 'encoding', complexity: 0.5 },
        resources: { cpu: 0.5, memory: 0.3, io: 0.2 },
        constraints: { maxMemoryUsage: 1024 * 1024 }
      };

      const otherContext: ProcessingContext = {
        band: BandType.MIDRANGE,
        bitSize: 128,
        workload: { type: 'computation', complexity: 0.5 },
        resources: { cpu: 0.5, memory: 0.3, io: 0.2 },
        constraints: { maxMemoryUsage: 1024 * 1024 }
      };

      const encodingScore = await adapter.evaluateContext(encodingContext);
      const otherScore = await adapter.evaluateContext(otherContext);

      expect(encodingScore).toBeGreaterThan(otherScore);
    });

    test('should consider memory constraints', async () => {
      const constrainedContext: ProcessingContext = {
        band: BandType.MIDRANGE,
        bitSize: 128,
        workload: { type: 'encoding', complexity: 0.5 },
        resources: { cpu: 0.5, memory: 0.3, io: 0.2 },
        constraints: { maxMemoryUsage: 1024 * 1024 }
      };

      const unconstrainedContext: ProcessingContext = {
        band: BandType.MIDRANGE,
        bitSize: 128,
        workload: { type: 'encoding', complexity: 0.5 },
        resources: { cpu: 0.5, memory: 0.3, io: 0.2 },
        constraints: { maxMemoryUsage: 10 * 1024 * 1024 }
      };

      const constrainedScore = await adapter.evaluateContext(constrainedContext);
      const unconstrainedScore = await adapter.evaluateContext(unconstrainedContext);

      expect(constrainedScore).toBeGreaterThan(0);
      expect(unconstrainedScore).toBeGreaterThan(0);
    });
  });

  describe('Context Processing', () => {
    test('should process text data in context', async () => {
      const context: ProcessingContext = {
        band: BandType.MIDRANGE,
        bitSize: 128,
        workload: { type: 'encoding', complexity: 0.5 },
        resources: { cpu: 0.5, memory: 0.3, io: 0.2 },
        constraints: { maxMemoryUsage: 1024 * 1024 }
      };

      const result = await adapter.processInContext('Hello, World!', context);

      expect(result.success).toBe(true);
      expect(result.result).toEqual([1n, 2n, 3n]);
      expect(result.metrics).toBeDefined();
      expect(result.quality).toBeDefined();
    });

    test('should process array data in context', async () => {
      const context: ProcessingContext = {
        band: BandType.MIDRANGE,
        bitSize: 128,
        workload: { type: 'chunk_processing', complexity: 0.6 },
        resources: { cpu: 0.6, memory: 0.4, io: 0.3 },
        constraints: { maxMemoryUsage: 2 * 1024 * 1024 }
      };

      const data = [1n, 2n, 3n];
      const result = await adapter.processInContext(data, context);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.result)).toBe(true);
    });

    test('should process bigint data in context', async () => {
      const context: ProcessingContext = {
        band: BandType.BASS,
        bitSize: 64,
        workload: { type: 'encoding', complexity: 0.3 },
        resources: { cpu: 0.4, memory: 0.2, io: 0.1 },
        constraints: { maxMemoryUsage: 512 * 1024 }
      };

      const result = await adapter.processInContext(42n, context);

      expect(result.success).toBe(true);
      expect(result.result).toBe(42n);
    });

    test('should handle processing errors gracefully', async () => {
      mockEncodingModule.encodeText.mockRejectedValue(new Error('Processing failed'));

      const context: ProcessingContext = {
        band: BandType.MIDRANGE,
        bitSize: 128,
        workload: { type: 'encoding', complexity: 0.5 },
        resources: { cpu: 0.5, memory: 0.3, io: 0.2 },
        constraints: { maxMemoryUsage: 1024 * 1024 }
      };

      const result = await adapter.processInContext('test', context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.quality).toBeDefined();
    });

    test('should calculate accurate metrics', async () => {
      const context: ProcessingContext = {
        band: BandType.MIDRANGE,
        bitSize: 128,
        workload: { type: 'encoding', complexity: 0.5 },
        resources: { cpu: 0.5, memory: 0.3, io: 0.2 },
        constraints: { maxMemoryUsage: 1024 * 1024 }
      };

      const result = await adapter.processInContext('test', context);

      expect(result.metrics.throughput).toBeGreaterThan(0);
      expect(result.metrics.latency).toBeGreaterThan(0);
      expect(result.metrics.memoryUsage).toBeGreaterThan(0);
      expect(result.metrics.accelerationFactor).toBeGreaterThan(0);
    });
  });

  describe('Band Configuration', () => {
    test('should configure band settings', () => {
      const bandConfig = {
        bitRange: { min: 65, max: 128 },
        primeModulus: 13n,
        processingStrategy: 'cache_optimized' as any,
        windowFunction: WindowFunction.HAMMING,
        latticeConfig: {
          dimensions: 2,
          basis: [2n, 3n],
          reduction: 'LLL' as const,
          precision: 1.0
        },
        crossoverThresholds: [0.8, 0.9],
        cacheSize: 1000,
        parallelization: {
          enabled: true,
          threadCount: 4,
          workDistribution: 'dynamic' as const,
          syncStrategy: 'lockfree' as const,
          chunkSize: 256
        },
        memoryConfig: {
          bufferSize: 8192,
          maxMemoryUsage: 1024 * 1024,
          cacheStrategy: 'LRU' as const,
          preloadSize: 100
        },
        accelerationFactor: 2.0,
        qualityThreshold: 0.95
      };

      expect(() => {
        adapter.configureBand(BandType.MIDRANGE, bandConfig);
      }).not.toThrow();
    });

    test('should retrieve band configuration', () => {
      const bandConfig = {
        bitRange: { min: 33, max: 64 },
        primeModulus: 7n,
        processingStrategy: ProcessingStrategy.SIEVE_BASED,
        windowFunction: WindowFunction.BLACKMAN,
        latticeConfig: {
          dimensions: 1,
          basis: [2n, 3n, 5n],
          reduction: 'BKZ' as const,
          precision: 0.8
        },
        crossoverThresholds: [0.7, 0.9],
        cacheSize: 500,
        parallelization: {
          enabled: false,
          threadCount: 2,
          workDistribution: 'static' as const,
          syncStrategy: 'locks' as const,
          chunkSize: 128
        },
        memoryConfig: {
          bufferSize: 4096,
          maxMemoryUsage: 512 * 1024,
          cacheStrategy: 'LFU' as const,
          preloadSize: 50
        },
        accelerationFactor: 1.5,
        qualityThreshold: 0.85
      };

      adapter.configureBand(BandType.BASS, bandConfig);
      const retrieved = adapter.getBandConfiguration(BandType.BASS);

      expect(retrieved).toEqual(bandConfig);
    });

    test('should return undefined for unconfigured bands', () => {
      const config = adapter.getBandConfiguration(BandType.TREBLE);
      expect(config).toBeUndefined();
    });

    test('should clear performance cache when configuration changes', async () => {
      const data = ['test'];
      
      // Get initial score
      const score1 = await adapter.evaluatePerformance(data, BandType.MIDRANGE);
      
      // Configure band
      const newConfig = {
        bitRange: { min: 65, max: 128 },
        primeModulus: 13n,
        processingStrategy: 'balanced' as const,
        windowFunction: 'hamming' as const,
        spectralCharacteristics: { frequency: 1000, amplitude: 1.0, phase: 0 },
        latticeConfiguration: { dimensions: 2, spacing: 1.0 },
        crossoverSettings: { enabled: true, threshold: 0.8 },
        optimizationParameters: { level: 'high', adaptive: true },
        cacheConfiguration: { enabled: true, size: 1000, ttl: 300000 },
        performanceTargets: { throughput: 1000, latency: 10, errorRate: 0.01 },
        bandSpecificOptions: { encoding: { compression: true } }
      };
      adapter.configureBand(BandType.MIDRANGE, newConfig);
      
      // Score should be recalculated (not cached)
      const score2 = await adapter.evaluatePerformance(data, BandType.MIDRANGE);
      
      expect(score1).toBeGreaterThan(0);
      expect(score2).toBeGreaterThan(0);
    });
  });

  describe('Module Initialization', () => {
    test('should handle module initialization', async () => {
      mockEncodingModule.getState.mockReturnValue({ lifecycle: 'Initializing' });
      mockEncodingModule.initialize.mockResolvedValue(undefined);

      const result = await adapter.encodeInBand('test', BandType.MIDRANGE);

      expect(mockEncodingModule.initialize).toHaveBeenCalled();
      expect(result).toEqual([1n, 2n, 3n]);
    });

    test('should handle modules without initialization', async () => {
      const moduleWithoutInit = {
        encodeText: jest.fn().mockResolvedValue([1n, 2n, 3n])
      };

      const simpleAdapter = new EncodingAdapterImpl(moduleWithoutInit);
      const result = await simpleAdapter.encodeInBand('test', BandType.MIDRANGE);

      expect(result).toEqual([1n, 2n, 3n]);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle null encoding module', async () => {
      const nullAdapter = new EncodingAdapterImpl(null);

      await expect(nullAdapter.encodeInBand('test', BandType.MIDRANGE))
        .rejects.toThrow();
    });

    test('should handle undefined data', async () => {
      await expect(adapter.encodeInBand(undefined, BandType.MIDRANGE))
        .rejects.toThrow();
    });

    test('should handle null data', async () => {
      await expect(adapter.encodeInBand(null, BandType.MIDRANGE))
        .rejects.toThrow();
    });

    test('should handle very large data arrays', async () => {
      const largeArray = new Array(10000).fill('test');

      // Should not throw and should complete in reasonable time
      const startTime = Date.now();
      await expect(adapter.processChunksInBand(largeArray, BandType.MIDRANGE))
        .resolves.toBeDefined();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    });

    test('should handle encoding module failures', async () => {
      mockEncodingModule.encodeText.mockImplementation(() => {
        throw new Error('Module failure');
      });

      await expect(adapter.encodeInBand('test', BandType.MIDRANGE))
        .rejects.toThrow('Band-optimized encoding failed');
    });

    test('should handle timeouts gracefully', async () => {
      const timeoutAdapter = new EncodingAdapterImpl(mockEncodingModule, {
        timeoutMs: 1
      });

      mockEncodingModule.encodeText.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([1n]), 100))
      );

      // Should complete even with very short timeout
      const result = await timeoutAdapter.encodeInBand('test', BandType.MIDRANGE);
      expect(result).toBeDefined();
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        adapter.encodeInBand(`test${i}`, BandType.MIDRANGE)
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toEqual([1n, 2n, 3n]);
      });
    });

    test('should optimize memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Process many operations
      for (let i = 0; i < 100; i++) {
        await adapter.encodeInBand(`test${i}`, BandType.MIDRANGE);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });

    test('should maintain performance with repeated operations', async () => {
      const startTime = Date.now();

      // Perform many encoding operations
      for (let i = 0; i < 50; i++) {
        await adapter.encodeInBand(`test${i}`, BandType.MIDRANGE);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // Should complete in less than 2 seconds
    });
  });

  describe('Factory Function', () => {
    test('should create adapter via factory function', () => {
      const factoryAdapter = createEncodingAdapter(mockEncodingModule);
      expect(factoryAdapter).toBeDefined();
      expect(factoryAdapter).toBeInstanceOf(EncodingAdapterImpl);
    });

    test('should create adapter with custom config via factory', () => {
      const customConfig = {
        enableBandOptimization: false,
        chunkSize: 2048
      };

      const factoryAdapter = createEncodingAdapter(mockEncodingModule, customConfig);
      expect(factoryAdapter).toBeDefined();
      expect(factoryAdapter).toBeInstanceOf(EncodingAdapterImpl);
    });
  });
});
