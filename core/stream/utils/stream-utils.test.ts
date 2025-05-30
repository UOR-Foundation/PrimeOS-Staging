/**
 * Stream Utilities Tests
 * =====================
 * 
 * Comprehensive tests for stream operation utilities.
 */

import {
  createStreamFromArray,
  createAsyncIterable,
  streamFromAsyncIterable,
  mergeStreams,
  transformStreamAsync,
  batchProcess,
  rateLimit,
  debounce,
  bufferTime,
  takeUntil,
  skipUntil,
  window,
  distinct,
  zip
} from './stream-utils';

describe('Stream Operation Utilities', () => {
  describe('createStreamFromArray', () => {
    it('should create stream from array', async () => {
      const array = [1, 2, 3, 4, 5];
      const stream = createStreamFromArray(array);
      
      const result = await stream.toArray();
      expect(result).toEqual(array);
    });
    
    it('should support synchronous iteration', () => {
      const array = ['a', 'b', 'c'];
      const stream = createStreamFromArray(array);
      
      const result: string[] = [];
      for (const item of stream) {
        result.push(item);
      }
      
      expect(result).toEqual(array);
    });
    
    it('should support async iteration', async () => {
      const array = [10, 20, 30];
      const stream = createStreamFromArray(array);
      
      const result: number[] = [];
      for await (const item of stream) {
        result.push(item);
      }
      
      expect(result).toEqual(array);
    });
    
    it('should preserve original array', async () => {
      const array = [1, 2, 3];
      const stream = createStreamFromArray(array);
      
      array.push(4); // Modify original array
      
      const result = await stream.toArray();
      expect(result).toEqual([1, 2, 3]); // Should not include the new item
    });
  });
  
  describe('Stream transformations', () => {
    it('should map values', async () => {
      const stream = createStreamFromArray([1, 2, 3]);
      const doubled = stream.map(x => x * 2);
      
      const result = await doubled.toArray();
      expect(result).toEqual([2, 4, 6]);
    });
    
    it('should filter values', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5]);
      const evens = stream.filter(x => x % 2 === 0);
      
      const result = await evens.toArray();
      expect(result).toEqual([2, 4]);
    });
    
    it('should take n values', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5]);
      const firstThree = stream.take(3);
      
      const result = await firstThree.toArray();
      expect(result).toEqual([1, 2, 3]);
    });
    
    it('should skip n values', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5]);
      const afterTwo = stream.skip(2);
      
      const result = await afterTwo.toArray();
      expect(result).toEqual([3, 4, 5]);
    });
    
    it('should chunk values', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5, 6, 7]);
      const chunked = stream.chunk(3);
      
      const result = await chunked.toArray();
      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });
    
    it('should chain transformations', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5, 6])
        .filter(x => x % 2 === 0)
        .map(x => x * 10)
        .take(2);
      
      const result = await stream.toArray();
      expect(result).toEqual([20, 40]);
    });
  });
  
  describe('Stream consumption', () => {
    it('should reduce values', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5]);
      const sum = await stream.reduce((acc, val) => acc + val, 0);
      
      expect(sum).toBe(15);
    });
    
    it('should forEach values', async () => {
      const stream = createStreamFromArray(['a', 'b', 'c']);
      const collected: string[] = [];
      
      await stream.forEach(item => collected.push(item));
      
      expect(collected).toEqual(['a', 'b', 'c']);
    });
    
    it('should get buffer for buffered streams', () => {
      const stream = createStreamFromArray([1, 2, 3]);
      const buffer = stream.getBuffer ? stream.getBuffer() : [];
      
      expect(buffer).toEqual([1, 2, 3]);
    });
  });
  
  describe('Stream management', () => {
    it('should concat streams', async () => {
      const stream1 = createStreamFromArray([1, 2, 3]);
      const stream2 = createStreamFromArray([4, 5, 6]);
      
      const concatenated = stream1.concat(stream2);
      const result = await concatenated.toArray();
      
      expect(result).toEqual([1, 2, 3, 4, 5, 6]);
    });
    
    it('should branch stream', async () => {
      const original = createStreamFromArray([1, 2, 3]);
      const branch = original.branch();
      
      const result1 = await original.toArray();
      const result2 = await branch.toArray();
      
      expect(result1).toEqual([1, 2, 3]);
      expect(result2).toEqual([1, 2, 3]);
    });
    
    it('should handle flow control', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5]);
      const results: number[] = [];
      
      if (stream.pause) {
        stream.pause();
      }
      
      // Start consuming
      const consumePromise = (async () => {
        for await (const item of stream) {
          results.push(item);
        }
      })();
      
      // Give time for pause to take effect
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(results).toEqual([]); // Should not have consumed yet
      
      if (stream.resume) {
        stream.resume();
      }
      await consumePromise;
      
      expect(results).toEqual([1, 2, 3, 4, 5]);
    });
  });
  
  describe('createAsyncIterable', () => {
    it('should create async iterable with rate limiting', async () => {
      const items = [1, 2, 3];
      const startTime = Date.now();
      
      const asyncIterable = createAsyncIterable(items, { rateLimit: 10 }); // 10 items per second
      
      const results: number[] = [];
      for await (const item of asyncIterable) {
        results.push(item);
      }
      
      const duration = Date.now() - startTime;
      
      expect(results).toEqual(items);
      expect(duration).toBeGreaterThanOrEqual(200); // At least 200ms for 3 items at 10/s
    });
    
    it('should create async iterable with fixed delay', async () => {
      const items = ['a', 'b'];
      const startTime = Date.now();
      
      const asyncIterable = createAsyncIterable(items, { delayMs: 50 });
      
      const results: string[] = [];
      for await (const item of asyncIterable) {
        results.push(item);
      }
      
      const duration = Date.now() - startTime;
      
      expect(results).toEqual(items);
      expect(duration).toBeGreaterThanOrEqual(50); // At least 50ms total
    });
  });
  
  describe('mergeStreams', () => {
    it('should merge multiple streams', async () => {
      const stream1 = createStreamFromArray([1, 3, 5]);
      const stream2 = createStreamFromArray([2, 4, 6]);
      
      const merged = mergeStreams(stream1, stream2);
      const result = await merged.toArray();
      
      // Should contain all values
      expect(result.sort()).toEqual([1, 2, 3, 4, 5, 6]);
    });
    
    it('should handle empty streams', async () => {
      const stream1 = createStreamFromArray([1, 2]);
      const stream2 = createStreamFromArray([]);
      const stream3 = createStreamFromArray([3, 4]);
      
      const merged = mergeStreams(stream1, stream2, stream3);
      const result = await merged.toArray();
      
      expect(result.sort()).toEqual([1, 2, 3, 4]);
    });
    
    it('should handle single stream', async () => {
      const stream = createStreamFromArray([1, 2, 3]);
      const merged = mergeStreams(stream);
      
      const result = await merged.toArray();
      expect(result).toEqual([1, 2, 3]);
    });
  });
  
  describe('transformStreamAsync', () => {
    it('should transform with async function', async () => {
      const stream = createStreamFromArray([1, 2, 3]);
      const asyncDouble = async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return x * 2;
      };
      
      const transformed = transformStreamAsync(stream, asyncDouble);
      const result = await transformed.toArray();
      
      expect(result).toEqual([2, 4, 6]);
    });
    
    it('should handle concurrency', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5]);
      let concurrentCount = 0;
      let maxConcurrent = 0;
      
      const slowTransform = async (x: number) => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        await new Promise(resolve => setTimeout(resolve, 50));
        concurrentCount--;
        return x * 2;
      };
      
      const transformed = transformStreamAsync(stream, slowTransform, { concurrency: 2 });
      await transformed.toArray();
      
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
    
    it('should retry on failure', async () => {
      const stream = createStreamFromArray([1, 2, 3]);
      const attemptCounts = new Map<number, number>();
      
      const flakeyTransform = async (x: number) => {
        const count = (attemptCounts.get(x) || 0) + 1;
        attemptCounts.set(x, count);
        
        if (x === 2 && count <= 2) {
          throw new Error('Temporary failure');
        }
        return x * 2;
      };
      
      const transformed = transformStreamAsync(stream, flakeyTransform, { retryAttempts: 3 });
      const result = await transformed.toArray();
      
      expect(result).toEqual([2, 4, 6]);
      expect(attemptCounts.get(2)).toBeGreaterThan(2); // Should have retried for item 2
    });
    
    it('should fail after max retries', async () => {
      const stream = createStreamFromArray([1, 2, 3]);
      
      const alwaysFail = async (x: number) => {
        if (x === 2) throw new Error('Always fails');
        return x * 2;
      };
      
      const transformed = transformStreamAsync(stream, alwaysFail, { retryAttempts: 2 });
      
      await expect(transformed.toArray()).rejects.toThrow('Failed to transform item after 3 attempts');
    });
  });
  
  describe('batchProcess', () => {
    it('should batch process items', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5, 6, 7]);
      
      const processor = async (batch: number[]) => {
        return batch.map(x => x * 10);
      };
      
      const processed = batchProcess(stream, 3, processor);
      const result = await processed.toArray();
      
      expect(result).toEqual([10, 20, 30, 40, 50, 60, 70]);
    });
    
    it('should handle memory pressure', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5]);
      let processedBatches = 0;
      
      const processor = async (batch: number[]) => {
        processedBatches++;
        return batch.map(x => x * 2);
      };
      
      // Force high memory threshold to trigger immediate processing
      const processed = batchProcess(stream, 10, processor, {
        memoryThreshold: 0.0001,
        backpressure: true
      });
      
      await processed.toArray();
      
      // Should have processed in smaller batches due to memory pressure
      expect(processedBatches).toBeGreaterThan(1);
    });
  });
  
  describe('rateLimit', () => {
    it('should rate limit stream', async () => {
      const stream = createStreamFromArray([1, 2, 3]);
      const startTime = Date.now();
      
      const limited = rateLimit(stream, 10); // 10 items per second
      await limited.toArray();
      
      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThanOrEqual(200); // At least 200ms for 3 items
    });
    
    it('should handle burst with leaky bucket', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5]);
      const startTime = Date.now();
      
      const limited = rateLimit(stream, 10, { burstSize: 2, leakyBucket: true });
      const results: number[] = [];
      
      for await (const item of limited) {
        results.push(item);
      }
      
      expect(results).toEqual([1, 2, 3, 4, 5]);
      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThanOrEqual(200); // More realistic expectation
    });
  });
  
  describe('debounce', () => {
    it('should debounce stream items', async () => {
      const asyncIterable = async function* () {
        yield 1;
        await new Promise(resolve => setTimeout(resolve, 10));
        yield 2;
        await new Promise(resolve => setTimeout(resolve, 10));
        yield 3;
        await new Promise(resolve => setTimeout(resolve, 100)); // Long delay
        yield 4;
      };
      
      const stream = await streamFromAsyncIterable(asyncIterable());
      const debounced = debounce(stream, 50);
      
      const results = await debounced.toArray();
      
      // Should emit 3 (after rapid 1,2,3) and 4 (final item)
      expect(results).toEqual([3, 4]);
    });
  });
  
  describe('bufferTime', () => {
    it('should buffer items by time window', async () => {
      const asyncIterable = async function* () {
        for (let i = 1; i <= 6; i++) {
          yield i;
          if (i % 2 === 0) {
            await new Promise(resolve => setTimeout(resolve, 60));
          }
        }
      };
      
      const stream = await streamFromAsyncIterable(asyncIterable());
      const buffered = bufferTime(stream, 50);
      
      const results = await buffered.toArray();
      
      // Should get chunks based on time windows
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.flat()).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });
  
  describe('takeUntil', () => {
    it('should take values until condition met', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5]);
      const untilThree = takeUntil(stream, x => x === 3);
      
      const result = await untilThree.toArray();
      expect(result).toEqual([1, 2, 3]);
    });
    
    it('should handle condition never met', async () => {
      const stream = createStreamFromArray([1, 2, 3]);
      const untilTen = takeUntil(stream, x => x === 10);
      
      const result = await untilTen.toArray();
      expect(result).toEqual([1, 2, 3]);
    });
  });
  
  describe('skipUntil', () => {
    it('should skip values until condition met', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5]);
      const afterThree = skipUntil(stream, x => x === 3);
      
      const result = await afterThree.toArray();
      expect(result).toEqual([3, 4, 5]);
    });
    
    it('should skip all if condition never met', async () => {
      const stream = createStreamFromArray([1, 2, 3]);
      const afterTen = skipUntil(stream, x => x === 10);
      
      const result = await afterTen.toArray();
      expect(result).toEqual([]);
    });
  });
  
  describe('window', () => {
    it('should create sliding windows', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5]);
      const windowed = window(stream, 3, 1);
      
      const result = await windowed.toArray();
      expect(result).toEqual([
        [1, 2, 3],
        [2, 3, 4],
        [3, 4, 5]
      ]);
    });
    
    it('should handle skip greater than 1', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5, 6]);
      const windowed = window(stream, 3, 2);
      
      const result = await windowed.toArray();
      expect(result).toEqual([
        [1, 2, 3],
        [3, 4, 5]
      ]);
    });
    
    it('should handle window larger than stream', async () => {
      const stream = createStreamFromArray([1, 2]);
      const windowed = window(stream, 5);
      
      const result = await windowed.toArray();
      expect(result).toEqual([]);
    });
  });
  
  describe('distinct', () => {
    it('should remove duplicate values', async () => {
      const stream = createStreamFromArray([1, 2, 2, 3, 1, 4, 3, 5]);
      const unique = distinct(stream);
      
      const result = await unique.toArray();
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
    
    it('should use key selector', async () => {
      const items = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 1, name: 'c' },
        { id: 3, name: 'd' }
      ];
      
      const stream = createStreamFromArray(items);
      const unique = distinct(stream, item => item.id);
      
      const result = await unique.toArray();
      expect(result).toEqual([
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'd' }
      ]);
    });
  });
  
  describe('zip', () => {
    it('should zip two streams', async () => {
      const stream1 = createStreamFromArray([1, 2, 3]);
      const stream2 = createStreamFromArray(['a', 'b', 'c']);
      
      const zipped = zip(stream1, stream2);
      const result = await zipped.toArray();
      
      expect(result).toEqual([
        [1, 'a'],
        [2, 'b'],
        [3, 'c']
      ]);
    });
    
    it('should zip three streams', async () => {
      const stream1 = createStreamFromArray([1, 2]);
      const stream2 = createStreamFromArray(['a', 'b']);
      const stream3 = createStreamFromArray([true, false]);
      
      const zipped = zip(stream1, stream2, stream3);
      const result = await zipped.toArray();
      
      expect(result).toEqual([
        [1, 'a', true],
        [2, 'b', false]
      ]);
    });
    
    it('should stop at shortest stream', async () => {
      const stream1 = createStreamFromArray([1, 2, 3, 4]);
      const stream2 = createStreamFromArray(['a', 'b']);
      
      const zipped = zip(stream1, stream2);
      const result = await zipped.toArray();
      
      expect(result).toEqual([
        [1, 'a'],
        [2, 'b']
      ]);
    });
  });
  
  describe('Edge cases', () => {
    it('should handle empty streams', async () => {
      const empty = createStreamFromArray([]);
      
      expect(await empty.toArray()).toEqual([]);
      expect(await empty.map(x => x).toArray()).toEqual([]);
      expect(await empty.filter(() => true).toArray()).toEqual([]);
      expect(await empty.reduce((acc, val) => acc + val, 0)).toBe(0);
    });
    
    it('should handle stream.next() correctly', () => {
      const stream = createStreamFromArray([1, 2, 3]);
      
      expect(stream.next()).toEqual({ value: 1, done: false });
      expect(stream.next()).toEqual({ value: 2, done: false });
      expect(stream.next()).toEqual({ value: 3, done: false });
      expect(stream.next()).toEqual({ done: true, value: undefined });
    });
    
    it('should handle non-buffered async streams', async () => {
      const asyncIterable = async function* () {
        yield 1;
        yield 2;
        yield 3;
      };
      
      const stream = await streamFromAsyncIterable(asyncIterable());
      
      // Should throw when trying to use sync iterator
      expect(() => {
        for (const item of stream) {
          // Should not reach here
        }
      }).toThrow();
      
      // Async iteration should work
      const results: number[] = [];
      for await (const item of stream) {
        results.push(item);
      }
      expect(results).toEqual([1, 2, 3]);
    });
    
    it('should handle parallel processing', async () => {
      const stream = createStreamFromArray([1, 2, 3, 4, 5]);
      const parallel = stream.parallel(2);
      
      const result = await parallel.toArray();
      expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
