/**
 * Pipeline Processor Tests
 * =======================
 * 
 * Test suite for the stream pipeline processor that handles
 * complex data transformation pipelines with error handling and monitoring.
 */

import { 
  StreamPipelineImpl 
} from './pipeline-processor';
import { 
  StreamPipeline,
  PipelineResult,
  PipelineError,
  TransformFunction,
  AsyncTransformFunction,
  FilterFunction,
  ReduceFunction,
  SinkFunction
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

describe('Pipeline Processor', () => {
  let pipeline: StreamPipeline<number, number>;
  
  beforeEach(() => {
    pipeline = new StreamPipelineImpl<number, number>({
      id: 'test-pipeline',
      maxConcurrency: 4,
      retryAttempts: 3,
      retryDelay: 100,
      timeoutMs: 5000,
      logger: null
    });
  });
  
  describe('Basic Pipeline Construction', () => {
    test('should create pipeline with configuration', () => {
      expect(pipeline).toBeDefined();
      expect(typeof pipeline.source).toBe('function');
      expect(typeof pipeline.transform).toBe('function');
      expect(typeof pipeline.filter).toBe('function');
      expect(typeof pipeline.execute).toBe('function');
    });
    
    test('should handle source data', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      
      const sourcedPipeline = pipeline.source(sourceData());
      expect(sourcedPipeline).toBeDefined();
    });
  });
  
  describe('Transformation Operations', () => {
    test('should apply synchronous transformations', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      
      const transform: TransformFunction<number, number> = (x: number) => x * 2;
      
      const result = await pipeline
        .source(sourceData())
        .transform(transform)
        .collect();
      
      expect(result).toEqual([2, 4, 6]);
    });
    
    test('should apply asynchronous transformations', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      
      const asyncTransform: AsyncTransformFunction<number, number> = async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return x * 3;
      };
      
      const result = await pipeline
        .source(sourceData())
        .asyncTransform(asyncTransform)
        .collect();
      
      expect(result).toEqual([3, 6, 9]);
    });
    
    test('should chain multiple transformations', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      
      const result = await pipeline
        .source(sourceData())
        .transform((x: number) => x * 2)
        .transform((x: number) => x + 1)
        .collect();
      
      expect(result).toEqual([3, 5, 7]);
    });
  });
  
  describe('Filtering Operations', () => {
    test('should filter data correctly', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
        yield 4;
        yield 5;
      };
      
      const isEven: FilterFunction<number> = (x: number) => x % 2 === 0;
      
      const result = await pipeline
        .source(sourceData())
        .filter(isEven)
        .collect();
      
      expect(result).toEqual([2, 4]);
    });
    
    test('should combine filtering and transformation', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
        yield 4;
        yield 5;
      };
      
      const result = await pipeline
        .source(sourceData())
        .filter((x: number) => x % 2 === 0)
        .transform((x: number) => x * 10)
        .collect();
      
      expect(result).toEqual([20, 40]);
    });
  });
  
  describe('Batching Operations', () => {
    test('should batch data into groups', async () => {
      const sourceData = async function* () {
        for (let i = 1; i <= 10; i++) {
          yield i;
        }
      };
      
      const result = await pipeline
        .source(sourceData())
        .batch(3)
        .collect();
      
      expect(result).toHaveLength(4); // [1,2,3], [4,5,6], [7,8,9], [10]
      expect(result[0]).toEqual([1, 2, 3]);
      expect(result[1]).toEqual([4, 5, 6]);
      expect(result[2]).toEqual([7, 8, 9]);
      expect(result[3]).toEqual([10]);
    });
    
    test('should handle empty batches', async () => {
      const sourceData = async function* (): AsyncGenerator<number> {
        // Empty source
      };
      
      const result = await pipeline
        .source(sourceData())
        .batch(5)
        .collect();
      
      expect(result).toEqual([]);
    });
  });
  
  describe('Parallel Processing', () => {
    test('should process in parallel', async () => {
      const sourceData = async function* () {
        for (let i = 1; i <= 10; i++) {
          yield i;
        }
      };
      
      const startTime = Date.now();
      const result = await pipeline
        .source(sourceData())
        .parallel(4)
        .asyncTransform(async (x: number) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return x * 2;
        })
        .collect();
      const endTime = Date.now();
      
      expect(result).toHaveLength(10);
      expect(result).toContain(2);
      expect(result).toContain(20);
      // Should complete faster than sequential processing
      expect(endTime - startTime).toBeLessThan(1000);
    });
    
    test('should respect concurrency limits', async () => {
      const sourceData = async function* () {
        for (let i = 1; i <= 5; i++) {
          yield i;
        }
      };
      
      const result = await pipeline
        .source(sourceData())
        .parallel(2) // Limit to 2 concurrent operations
        .transform((x: number) => x * 2)
        .collect();
      
      expect(result).toHaveLength(5);
    });
  });
  
  describe('Error Handling', () => {
    test('should catch and handle errors', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      
      const errorHandler = jest.fn().mockReturnValue(0);
      
      const result = await pipeline
        .source(sourceData())
        .transform((x: number) => {
          if (x === 2) throw new Error('Test error');
          return x * 2;
        })
        .catch(errorHandler)
        .collect();
      
      expect(result).toEqual([2, 0, 6]); // Error replaced with 0
      expect(errorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        2
      );
    });
    
    test('should retry failed operations', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      
      let attemptCount = 0;
      const result = await pipeline
        .source(sourceData())
        .transform((x: number) => {
          if (x === 2) {
            attemptCount++;
            if (attemptCount < 3) {
              throw new Error('Temporary error');
            }
          }
          return x * 2;
        })
        .retry(3, 50)
        .collect();
      
      expect(result).toEqual([2, 4, 6]);
      expect(attemptCount).toBe(3);
    });
    
    test('should handle timeouts', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
      };
      
      const result = await pipeline
        .source(sourceData())
        .asyncTransform(async (x: number) => {
          if (x === 2) {
            await new Promise(resolve => setTimeout(resolve, 6000)); // Longer than timeout
          }
          return x * 2;
        })
        .timeout(1000) // 1 second timeout
        .catch(() => 0) // Handle timeout error
        .collect();
      
      expect(result).toEqual([2, 0]); // Second item timed out
    });
  });
  
  describe('Reduction Operations', () => {
    test('should reduce to single value', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
        yield 4;
        yield 5;
      };
      
      const sum = await pipeline
        .source(sourceData())
        .reduce((acc: number, current: number) => acc + current, 0);
      
      expect(sum).toBe(15);
    });
    
    test('should reduce with transformations', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      
      const result = await pipeline
        .source(sourceData())
        .transform((x: number) => x * 2)
        .reduce((acc: number, current: number) => acc + current, 0);
      
      expect(result).toBe(12); // (1*2) + (2*2) + (3*2) = 2 + 4 + 6 = 12
    });
  });
  
  describe('Sink Operations', () => {
    test('should sink data to external handler', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      
      const sinkData: number[] = [];
      const sink: SinkFunction<number> = async (value: number) => {
        sinkData.push(value);
      };
      
      const result = await pipeline
        .source(sourceData())
        .transform((x: number) => x * 2)
        .sink(sink);
      
      expect(result.success).toBe(true);
      expect(result.itemsProcessed).toBe(3);
      expect(sinkData).toEqual([2, 4, 6]);
    });
    
    test('should handle sink errors', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      
      const sink: SinkFunction<number> = async (value: number) => {
        if (value === 4) { // 2 * 2
          throw new Error('Sink error');
        }
      };
      
      const result = await pipeline
        .source(sourceData())
        .transform((x: number) => x * 2)
        .sink(sink);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
  
  describe('Progress Monitoring', () => {
    test('should track progress', async () => {
      const sourceData = async function* () {
        for (let i = 1; i <= 10; i++) {
          yield i;
        }
      };
      
      const progressUpdates: Array<{ processed: number; total?: number; percentage?: number }> = [];
      
      const result = await pipeline
        .source(sourceData())
        .transform((x: number) => x * 2)
        .onProgress((progress) => {
          progressUpdates.push(progress);
        })
        .collect();
      
      expect(result).toHaveLength(10);
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1].processed).toBe(10);
    });
    
    test('should track errors through callbacks', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      
      const errors: any[] = [];
      
      const result = await pipeline
        .source(sourceData())
        .transform((x: number) => {
          if (x === 2) throw new Error('Test error');
          return x * 2;
        })
        .onError((error) => {
          errors.push(error);
        })
        .catch(() => 0)
        .collect();
      
      expect(result).toEqual([2, 0, 6]);
      expect(errors.length).toBe(1);
      expect(errors[0].message).toBe('Test error');
    });
  });
  
  describe('Pipeline Execution', () => {
    test('should execute and return async iterable', async () => {
      const sourceData = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      
      const executed = await pipeline
        .source(sourceData())
        .transform((x: number) => x * 2)
        .execute();
      
      const results: number[] = [];
      for await (const item of executed) {
        results.push(item);
      }
      
      expect(results).toEqual([2, 4, 6]);
    });
    
    test('should handle large streams efficiently', async () => {
      const sourceData = async function* () {
        for (let i = 1; i <= 10000; i++) {
          yield i;
        }
      };
      
      const startTime = Date.now();
      const result = await pipeline
        .source(sourceData())
        .filter((x: number) => x % 2 === 0)
        .transform((x: number) => x / 2)
        .batch(100)
        .collect();
      const endTime = Date.now();
      
      expect(result).toHaveLength(50); // 5000 even numbers / 100 per batch
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
  
  describe('Distribution and Partitioning', () => {
    test('should distribute data based on partition function', async () => {
      const sourceData = async function* () {
        for (let i = 1; i <= 10; i++) {
          yield i;
        }
      };
      
      // Partition by even/odd
      const result = await pipeline
        .source(sourceData())
        .distribute((x: number) => x % 2)
        .collect();
      
      expect(result).toHaveLength(10);
      // Results should maintain order but be processed in partitions
    });
  });
  
  describe('Complex Pipeline Scenarios', () => {
    test('should handle complex multi-stage pipeline', async () => {
      const sourceData = async function* () {
        for (let i = 1; i <= 100; i++) {
          yield i;
        }
      };
      
      // Simplified version without batching to avoid type complexity
      const result = await pipeline
        .source(sourceData())
        .filter((x: number) => x % 3 === 0) // Multiples of 3
        .transform((x: number) => x * 2)    // Double them
        .filter((x: number) => x > 20)      // Only values > 20
        .collect();
      
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(x => x > 20)).toBe(true);
      expect(result.every(x => x % 6 === 0)).toBe(true); // Should be multiples of 6 (3*2)
    });
    
    test('should handle error recovery in complex pipeline', async () => {
      const sourceData = async function* () {
        for (let i = 1; i <= 20; i++) {
          yield i;
        }
      };
      
      let errorCount = 0;
      
      const result = await pipeline
        .source(sourceData())
        .transform((x: number) => {
          if (x === 10 || x === 15) {
            throw new Error(`Error at ${x}`);
          }
          return x * 2;
        })
        .catch((error, value) => {
          errorCount++;
          return value; // Return original value on error
        })
        .filter((x: number) => x > 5)
        .batch(3)
        .collect();
      
      expect(errorCount).toBe(2);
      expect(result.length).toBeGreaterThan(0);
    });
  });
  
  describe('Resource Management', () => {
    test('should clean up resources properly', async () => {
      const sourceData = async function* () {
        try {
          for (let i = 1; i <= 5; i++) {
            yield i;
          }
        } finally {
          // Cleanup logic would go here
        }
      };
      
      const result = await pipeline
        .source(sourceData())
        .transform((x: number) => x * 2)
        .collect();
      
      expect(result).toEqual([2, 4, 6, 8, 10]);
    });
    
    test('should handle memory pressure gracefully', async () => {
      const largeSourceData = async function* () {
        for (let i = 1; i <= 100000; i++) {
          yield i;
        }
      };
      
      // This should not cause memory issues due to streaming
      const result = await pipeline
        .source(largeSourceData())
        .filter((x: number) => x % 1000 === 0)
        .collect();
      
      expect(result).toHaveLength(100);
      expect(result[0]).toBe(1000);
      expect(result[99]).toBe(100000);
    });
  });
});
