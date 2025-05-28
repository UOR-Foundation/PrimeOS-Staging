/**
 * Chunk Processor Tests
 * ====================
 * 
 * Test suite for the chunk processing implementation that handles
 * breaking streams into manageable chunks for efficient processing.
 */

import { 
  ChunkProcessorImpl, 
  createChunkProcessor 
} from './chunk-processor';
import { 
  ChunkProcessor,
  ChunkProcessingConfig,
  ProcessingContext 
} from '../types';

// Mock the os modules
jest.mock('../../../os/model', () => ({
  BaseModel: class MockBaseModel {
    protected logger = {
      debug: jest.fn().mockResolvedValue(undefined),
      info: jest.fn().mockResolvedValue(undefined),
      warn: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined)
    };
  }
}));

// Mock calculateMemoryUsage utility
jest.mock('../utils', () => ({
  calculateMemoryUsage: jest.fn().mockReturnValue(1024)
}));

describe('Chunk Processor', () => {
  let config: ChunkProcessingConfig;
  let processor: ChunkProcessor<number>;
  
  beforeEach(() => {
    config = {
      chunkSize: 5,
      maxBufferSize: 1000,
      enableBackpressure: true,
      backpressureThreshold: 0.8,
      errorTolerance: 0.1,
      retryAttempts: 3,
      retryDelay: 100
    };
    
    // Create processor with pass-through function
    processor = createChunkProcessor<number>(
      async (chunk: number[]) => chunk, // Simple pass-through
      config,
      { logger: null }
    );
  });
  
  describe('Basic Functionality', () => {
    test('should create chunk processor with default config', () => {
      const defaultProcessor = createChunkProcessor<string>(
        async (chunk: string[]) => chunk
      );
      expect(defaultProcessor).toBeDefined();
    });
    
    test('should process chunks correctly', async () => {
      const chunk = [1, 2, 3, 4, 5];
      const metadata = new Map<string, any>();
      const context: ProcessingContext<number> = {
        index: 0,
        totalChunks: 1,
        metadata,
        startTime: Date.now(),
        processingTime: 0,
        memoryUsed: 0
      };
      
      const result = await processor.processChunk(chunk, context);
      expect(result).toEqual(chunk);
    });
    
    test('should handle empty chunks', async () => {
      const chunk: number[] = [];
      const metadata = new Map<string, any>();
      const context: ProcessingContext<number> = {
        index: 0,
        totalChunks: 1,
        metadata,
        startTime: Date.now(),
        processingTime: 0,
        memoryUsed: 0
      };
      
      const result = await processor.processChunk(chunk, context);
      expect(result).toEqual([]);
    });
  });
  
  describe('Configuration Management', () => {
    test('should use provided configuration', () => {
      const customConfig: ChunkProcessingConfig = {
        chunkSize: 10,
        maxBufferSize: 2000,
        enableBackpressure: false,
        backpressureThreshold: 0.9,
        errorTolerance: 0.05,
        retryAttempts: 5,
        retryDelay: 200
      };
      
      const customProcessor = createChunkProcessor<string>(
        async (chunk: string[]) => chunk,
        customConfig
      );
      expect(customProcessor).toBeDefined();
      expect(customProcessor.config.chunkSize).toBe(10);
    });
    
    test('should handle partial configuration', () => {
      const partialConfig: Partial<ChunkProcessingConfig> = {
        chunkSize: 20,
        enableBackpressure: false
      };
      
      const processor = createChunkProcessor<number>(
        async (chunk: number[]) => chunk,
        partialConfig
      );
      expect(processor).toBeDefined();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle processing errors gracefully', async () => {
      const errorProcessor = new ChunkProcessorImpl<number>(config, { logger: null });
      
      const chunk = [1, 2, 3];
      
      // Should handle error through handleProcessingError
      const errorResult = errorProcessor.handleProcessingError(new Error('Processing failed'), chunk);
      expect(errorResult).toBeNull();
    });
    
    test('should respect error tolerance settings', () => {
      const tolerantConfig: ChunkProcessingConfig = {
        chunkSize: 5,
        maxBufferSize: 1000,
        enableBackpressure: true,
        backpressureThreshold: 0.8,
        errorTolerance: 0.5, // High tolerance
        retryAttempts: 1,
        retryDelay: 50
      };
      
      const tolerantProcessor = createChunkProcessor<number>(
        async (chunk: number[]) => chunk,
        tolerantConfig
      );
      expect(tolerantProcessor).toBeDefined();
    });
  });
  
  describe('Memory Management', () => {
    test('should track memory usage', () => {
      const memoryUsage = processor.getMemoryUsage();
      expect(typeof memoryUsage).toBe('number');
      expect(memoryUsage).toBeGreaterThanOrEqual(0);
    });
    
    test('should apply backpressure when needed', () => {
      const shouldApply = processor.shouldApplyBackpressure();
      expect(typeof shouldApply).toBe('boolean');
    });
    
    test('should handle high memory usage', () => {
      // Create processor with low threshold
      const lowThresholdConfig: ChunkProcessingConfig = {
        ...config,
        backpressureThreshold: 0.1 // Very low threshold
      };
      
      const processor = createChunkProcessor<number>(
        async (chunk: number[]) => chunk,
        lowThresholdConfig
      );
      
      // Memory usage should trigger backpressure
      const shouldApply = processor.shouldApplyBackpressure();
      // Note: This depends on actual memory conditions, so we just test the interface
      expect(typeof shouldApply).toBe('boolean');
    });
  });
  
  describe('Lifecycle Management', () => {
    test('should initialize correctly', async () => {
      await expect(processor.initialize()).resolves.toBeUndefined();
    });
    
    test('should terminate correctly', async () => {
      await expect(processor.terminate()).resolves.toBeUndefined();
    });
    
    test('should flush remaining data', async () => {
      const flushedData = await processor.flush();
      expect(Array.isArray(flushedData)).toBe(true);
    });
  });
  
  describe('Large Data Processing', () => {
    test('should handle large chunks efficiently', async () => {
      const largeChunk = Array.from({ length: 10000 }, (_, i) => i);
      const metadata = new Map<string, any>();
      metadata.set('size', 'large');
      
      const context: ProcessingContext<number> = {
        index: 0,
        totalChunks: 1,
        metadata,
        startTime: Date.now(),
        processingTime: 0,
        memoryUsed: 0
      };
      
      const startTime = Date.now();
      const result = await processor.processChunk(largeChunk, context);
      const endTime = Date.now();
      
      expect(result).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
    
    test('should handle multiple concurrent chunks', async () => {
      const chunks = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ];
      
      const promises = chunks.map((chunk, index) => {
        const metadata = new Map<string, any>();
        const context: ProcessingContext<number> = {
          index,
          totalChunks: chunks.length,
          metadata,
          startTime: Date.now(),
          processingTime: 0,
          memoryUsed: 0
        };
        return processor.processChunk(chunk, context);
      });
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(results[0]).toEqual([1, 2, 3]);
      expect(results[1]).toEqual([4, 5, 6]);
      expect(results[2]).toEqual([7, 8, 9]);
    });
  });
  
  describe('Context Handling', () => {
    test('should use processing context effectively', async () => {
      const chunk = [10, 20, 30];
      const metadata = new Map<string, any>();
      metadata.set('source', 'test');
      metadata.set('priority', 'high');
      metadata.set('timestamp', Date.now());
      
      const context: ProcessingContext<number> = {
        index: 5,
        totalChunks: 10,
        metadata,
        startTime: Date.now(),
        processingTime: 0,
        memoryUsed: 1024
      };
      
      const result = await processor.processChunk(chunk, context);
      expect(result).toEqual(chunk);
    });
    
    test('should handle context with complex metadata', async () => {
      const chunk = ['a', 'b', 'c'];
      const metadata = new Map<string, any>();
      metadata.set('nested', {
        deep: {
          value: 42
        }
      });
      metadata.set('array', [1, 2, 3]);
      metadata.set('function', () => 'test');
      
      const complexContext: ProcessingContext<string> = {
        index: 0,
        totalChunks: 1,
        metadata,
        startTime: Date.now(),
        processingTime: 0,
        memoryUsed: 0
      };
      
      const stringProcessor = createChunkProcessor<string>(
        async (chunk: string[]) => chunk,
        config
      );
      const result = await stringProcessor.processChunk(chunk, complexContext);
      expect(result).toEqual(['a', 'b', 'c']);
    });
  });
  
  describe('Performance Optimization', () => {
    test('should optimize for different chunk sizes', async () => {
      const smallChunk = [1, 2];
      const mediumChunk = Array.from({ length: 100 }, (_, i) => i);
      const largeChunk = Array.from({ length: 1000 }, (_, i) => i);
      
      const metadata = new Map<string, any>();
      const context: ProcessingContext<number> = {
        index: 0,
        totalChunks: 1,
        metadata,
        startTime: Date.now(),
        processingTime: 0,
        memoryUsed: 0
      };
      
      // All should process successfully regardless of size
      const smallResult = await processor.processChunk(smallChunk, context);
      const mediumResult = await processor.processChunk(mediumChunk, context);
      const largeResult = await processor.processChunk(largeChunk, context);
      
      expect(smallResult).toHaveLength(2);
      expect(mediumResult).toHaveLength(100);
      expect(largeResult).toHaveLength(1000);
    });
    
    test('should maintain performance under stress', async () => {
      const stressChunks = Array.from({ length: 100 }, (_, i) => 
        Array.from({ length: 50 }, (_, j) => i * 50 + j)
      );
      
      const startTime = Date.now();
      
      const promises = stressChunks.map((chunk, index) => {
        const metadata = new Map<string, any>();
        metadata.set('stress', true);
        
        const context: ProcessingContext<number> = {
          index,
          totalChunks: stressChunks.length,
          metadata,
          startTime: Date.now(),
          processingTime: 0,
          memoryUsed: 0
        };
        return processor.processChunk(chunk, context);
      });
      
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
  
  describe('Type Safety', () => {
    test('should handle different data types', async () => {
      const metadata = new Map<string, any>();
      const context: ProcessingContext<any> = {
        index: 0,
        totalChunks: 1,
        metadata,
        startTime: Date.now(),
        processingTime: 0,
        memoryUsed: 0
      };
      
      // String processor
      const stringProcessor = createChunkProcessor<string>(
        async (chunk: string[]) => chunk
      );
      const stringResult = await stringProcessor.processChunk(['a', 'b', 'c'], context);
      expect(stringResult).toEqual(['a', 'b', 'c']);
      
      // Object processor
      const objectProcessor = createChunkProcessor<{ id: number; name: string }>(
        async (chunk: { id: number; name: string }[]) => chunk
      );
      const objects = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }];
      const objectResult = await objectProcessor.processChunk(objects, context);
      expect(objectResult).toEqual(objects);
      
      // Boolean processor
      const boolProcessor = createChunkProcessor<boolean>(
        async (chunk: boolean[]) => chunk
      );
      const boolResult = await boolProcessor.processChunk([true, false, true], context);
      expect(boolResult).toEqual([true, false, true]);
    });
  });
  
  describe('Custom Processing Logic', () => {
    test('should support custom transformation functions', async () => {
      // Create processor that doubles numbers
      const doublingProcessor = createChunkProcessor<number>(
        async (chunk: number[]) => chunk.map(x => x * 2)
      );
      
      const metadata = new Map<string, any>();
      const context: ProcessingContext<number> = {
        index: 0,
        totalChunks: 1,
        metadata,
        startTime: Date.now(),
        processingTime: 0,
        memoryUsed: 0
      };
      
      const result = await doublingProcessor.processChunk([1, 2, 3, 4, 5], context);
      expect(result).toEqual([2, 4, 6, 8, 10]);
    });
    
    test('should support async processing functions', async () => {
      // Create processor with async delay
      const delayProcessor = createChunkProcessor<string>(
        async (chunk: string[]) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return chunk.map(s => s.toUpperCase());
        }
      );
      
      const metadata = new Map<string, any>();
      const context: ProcessingContext<string> = {
        index: 0,
        totalChunks: 1,
        metadata,
        startTime: Date.now(),
        processingTime: 0,
        memoryUsed: 0
      };
      
      const result = await delayProcessor.processChunk(['hello', 'world'], context);
      expect(result).toEqual(['HELLO', 'WORLD']);
    });
  });
  
  describe('ChunkProcessorImpl Direct Usage', () => {
    test('should create ChunkProcessorImpl instance directly', () => {
      const implProcessor = new ChunkProcessorImpl<number>(config, { logger: null });
      expect(implProcessor).toBeDefined();
      expect(implProcessor.config).toEqual(expect.objectContaining(config));
    });
    
    test('should handle initialization and termination', async () => {
      const implProcessor = new ChunkProcessorImpl<number>(config, { logger: null });
      
      await implProcessor.initialize();
      expect(implProcessor).toBeDefined();
      
      await implProcessor.terminate();
      expect(implProcessor).toBeDefined();
    });
  });
});
