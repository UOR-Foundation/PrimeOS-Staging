/**
 * Stream Operation Utilities
 * ==========================
 * 
 * Complete utilities for creating and managing stream operations with
 * full async support, backpressure handling, and performance optimization.
 */

import { Stream, StreamProcessingError, MemoryStats } from '../types';
import { getMemoryStats } from './memory-utils';

/**
 * Advanced stream implementation with full async support
 */
class AdvancedStream<T> implements Stream<T> {
  private source: AsyncIterable<T>;
  private buffer: T[] = [];
  private isBuffered = false;
  private position = 0;
  private paused = false;
  private drainPromise?: Promise<void>;
  private drainResolve?: () => void;
  
  constructor(source: AsyncIterable<T> | T[]) {
    if (Array.isArray(source)) {
      this.buffer = [...source];
      this.isBuffered = true;
      this.source = this.createAsyncIterableFromArray(source);
    } else {
      this.source = source;
    }
  }
  
  private async *createAsyncIterableFromArray(items: T[]): AsyncIterable<T> {
    for (const item of items) {
      while (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      yield item;
    }
  }
  
  // Iterator protocol
  [Symbol.iterator](): Iterator<T> {
    if (this.isBuffered) {
      let pos = 0;
      const buffer = this.buffer;
      return {
        next(): IteratorResult<T> {
          if (pos < buffer.length) {
            return { value: buffer[pos++], done: false };
          }
          return { done: true, value: undefined as any };
        }
      };
    }
    throw new Error('Cannot use sync iterator on async stream. Use for-await-of instead.');
  }
  
  // Async iterator protocol
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    for await (const item of this.source) {
      while (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      yield item;
    }
  }
  
  next(): IteratorResult<T> {
    if (this.isBuffered && this.position < this.buffer.length) {
      return { value: this.buffer[this.position++], done: false };
    }
    return { done: true, value: undefined as any };
  }
  
  // Transformation methods
  map<U>(fn: (value: T) => U): Stream<U> {
    return new AdvancedStream(this.mapAsyncIterable(fn));
  }
  
  filter(fn: (value: T) => boolean): Stream<T> {
    return new AdvancedStream(this.filterAsyncIterable(fn));
  }
  
  take(n: number): Stream<T> {
    return new AdvancedStream(this.takeAsyncIterable(n));
  }
  
  skip(n: number): Stream<T> {
    return new AdvancedStream(this.skipAsyncIterable(n));
  }
  
  chunk(size: number): Stream<T[]> {
    return new AdvancedStream(this.chunkAsyncIterable(size)) as any;
  }
  
  parallel(concurrency: number): Stream<T> {
    return new AdvancedStream(this.parallelAsyncIterable(concurrency));
  }
  
  // Consumption methods
  async reduce<U>(fn: (acc: U, value: T) => U, initial: U): Promise<U> {
    let accumulator = initial;
    for await (const item of this.source) {
      while (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      accumulator = fn(accumulator, item);
    }
    return accumulator;
  }
  
  async forEach(fn: (value: T) => void): Promise<void> {
    for await (const item of this.source) {
      while (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      fn(item);
    }
  }
  
  async toArray(): Promise<T[]> {
    if (this.isBuffered) {
      return [...this.buffer];
    }
    
    const result: T[] = [];
    for await (const item of this.source) {
      while (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      result.push(item);
    }
    return result;
  }
  
  // Stream management
  getBuffer(): T[] {
    return this.isBuffered ? [...this.buffer] : [];
  }
  
  concat(other: Stream<T>): Stream<T> {
    return new AdvancedStream(this.concatAsyncIterable(other));
  }
  
  branch(): Stream<T> {
    if (this.isBuffered) {
      return new AdvancedStream([...this.buffer]);
    }
    return new AdvancedStream(this.source);
  }
  
  // Flow control
  pause(): void {
    this.paused = true;
    if (!this.drainPromise) {
      this.drainPromise = new Promise(resolve => {
        this.drainResolve = resolve;
      });
    }
  }
  
  resume(): void {
    this.paused = false;
    if (this.drainResolve) {
      this.drainResolve();
      this.drainPromise = undefined;
      this.drainResolve = undefined;
    }
  }
  
  async drain(): Promise<void> {
    if (this.drainPromise) {
      await this.drainPromise;
    }
  }
  
  // Helper async iterables
  private async *mapAsyncIterable<U>(fn: (value: T) => U): AsyncIterable<U> {
    for await (const item of this.source) {
      while (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      yield fn(item);
    }
  }
  
  private async *filterAsyncIterable(fn: (value: T) => boolean): AsyncIterable<T> {
    for await (const item of this.source) {
      while (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      if (fn(item)) {
        yield item;
      }
    }
  }
  
  private async *takeAsyncIterable(n: number): AsyncIterable<T> {
    let count = 0;
    for await (const item of this.source) {
      if (count >= n) break;
      while (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      yield item;
      count++;
    }
  }
  
  private async *skipAsyncIterable(n: number): AsyncIterable<T> {
    let count = 0;
    for await (const item of this.source) {
      while (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      if (count >= n) {
        yield item;
      }
      count++;
    }
  }
  
  private async *chunkAsyncIterable(size: number): AsyncIterable<T[]> {
    let chunk: T[] = [];
    for await (const item of this.source) {
      while (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      chunk.push(item);
      if (chunk.length >= size) {
        yield [...chunk];
        chunk = [];
      }
    }
    if (chunk.length > 0) {
      yield chunk;
    }
  }
  
  private async *parallelAsyncIterable(concurrency: number): AsyncIterable<T> {
    // True parallel processing with controlled concurrency
    const processingQueue: Array<{
      item: T;
      resolve: (value: T) => void;
      reject: (error: Error) => void;
    }> = [];
    
    const results = new Map<number, T>();
    let inputIndex = 0;
    let outputIndex = 0;
    let inputDone = false;
    let activeWorkers = 0;
    
    // Worker function that processes items from the queue
    const worker = async (): Promise<void> => {
      while (processingQueue.length > 0 || !inputDone) {
        // Wait if paused
        while (this.paused) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Get next item from queue
        const work = processingQueue.shift();
        if (!work) {
          if (inputDone) break;
          // Wait for more items
          await new Promise(resolve => setTimeout(resolve, 1));
          continue;
        }
        
        try {
          // Process the item (in real worker pools, this would be in a separate thread)
          const processed = await this.processItem(work.item);
          work.resolve(processed);
        } catch (error) {
          work.reject(error as Error);
        }
      }
      
      activeWorkers--;
    };
    
    // Start worker pool
    const workers: Promise<void>[] = [];
    for (let i = 0; i < concurrency; i++) {
      activeWorkers++;
      workers.push(worker());
    }
    
    // Input handler - reads from source and queues items
    const inputHandler = async () => {
      try {
        for await (const item of this.source) {
          const index = inputIndex++;
          
          // Create promise for this item's processing
          const itemPromise = new Promise<T>((resolve, reject) => {
            processingQueue.push({ item, resolve, reject });
          });
          
          // Store the result when ready
          itemPromise.then(result => {
            results.set(index, result);
          }).catch(() => {
            // Error handling is done elsewhere
          });
          
          // Apply backpressure if queue is too large
          while (processingQueue.length > concurrency * 2) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
      } finally {
        inputDone = true;
      }
    };
    
    // Start input handling
    inputHandler();
    
    // Yield results in order
    while (outputIndex < inputIndex || !inputDone) {
      // Wait for the next result in sequence
      while (!results.has(outputIndex) && (outputIndex < inputIndex || !inputDone)) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      if (results.has(outputIndex)) {
        yield results.get(outputIndex)!;
        results.delete(outputIndex);
        outputIndex++;
      }
    }
    
    // Wait for all workers to complete
    await Promise.all(workers);
  }
  
  // Helper method to process individual items (can be overridden for custom processing)
  private async processItem(item: T): Promise<T> {
    // In a real implementation, this could involve:
    // - Serialization for worker thread communication
    // - Custom transformation logic
    // - Resource-intensive computations
    // For now, return the item as-is (identity function)
    return item;
  }
  
  private async *concatAsyncIterable(other: Stream<T>): AsyncIterable<T> {
    // First yield all items from this stream
    for await (const item of this.source) {
      while (this.paused) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      yield item;
    }
    
    // Then yield all items from other stream
    if (other.getBuffer) {
      const otherBuffer = other.getBuffer();
      for (const item of otherBuffer) {
        while (this.paused) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        yield item;
      }
    } else {
      // Convert other to array and yield
      const otherArray = await other.toArray();
      for (const item of otherArray) {
        while (this.paused) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        yield item;
      }
    }
  }
}

/**
 * Create a stream from an array with full functionality
 */
export function createStreamFromArray<T>(data: T[]): Stream<T> {
  return new AdvancedStream(data);
}

/**
 * Create an async iterable from an array with rate limiting
 */
export async function* createAsyncIterable<T>(
  items: T[], 
  options: { 
    rateLimit?: number; // items per second
    delayMs?: number;   // fixed delay between items
  } = {}
): AsyncIterable<T> {
  const delay = options.delayMs || (options.rateLimit ? 1000 / options.rateLimit : 0);
  
  for (const item of items) {
    yield item;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Create a stream from an async iterable
 */
export async function streamFromAsyncIterable<T>(source: AsyncIterable<T>): Promise<Stream<T>> {
  return new AdvancedStream(source);
}

/**
 * Merge multiple streams into one with proper async handling
 */
export function mergeStreams<T>(...streams: Stream<T>[]): Stream<T> {
  const mergedIterable = async function* (): AsyncIterable<T> {
    const iterators = streams.map(stream => {
      if (stream.getBuffer) {
        const buffer = stream.getBuffer();
        return (async function* () {
          for (const item of buffer) {
            yield item;
          }
        })();
      }
      // For non-buffered streams, convert to array first
      return (async function* () {
        const array = await stream.toArray();
        for (const item of array) {
          yield item;
        }
      })();
    });
    
    // Round-robin merge
    let activeIterators = iterators.length;
    let currentIndex = 0;
    
    while (activeIterators > 0) {
      const iterator = iterators[currentIndex];
      const result = await iterator.next();
      
      if (result.done) {
        activeIterators--;
        iterators.splice(currentIndex, 1);
        if (currentIndex >= iterators.length) {
          currentIndex = 0;
        }
      } else {
        yield result.value;
        currentIndex = (currentIndex + 1) % iterators.length;
      }
    }
  };
  
  return new AdvancedStream(mergedIterable());
}

/**
 * Transform a stream with an async function and concurrency control
 */
export function transformStreamAsync<T, U>(
  stream: Stream<T>,
  transform: (item: T) => Promise<U>,
  options: { concurrency?: number; retryAttempts?: number } = {}
): Stream<U> {
  const { concurrency = 4, retryAttempts = 3 } = options;
  
  const transformedIterable = async function* (): AsyncIterable<U> {
    // Track workers with a Map for easier removal
    const activeWorkers = new Map<symbol, Promise<{ index: number; result: U; workerId: symbol }>>();
    const results = new Map<number, U>();
    let nextIndex = 0;
    let outputIndex = 0;
    
    // Helper to process an item with retry logic
    const processWithRetry = async (item: T, index: number, workerId: symbol): Promise<{ index: number; result: U; workerId: symbol }> => {
      let lastError: Error | undefined;
      
      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          const result = await transform(item);
          return { index, result, workerId };
        } catch (error) {
          lastError = error as Error;
          if (attempt < retryAttempts) {
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 10));
          }
        }
      }
      
      throw new StreamProcessingError(
        `Failed to transform item after ${retryAttempts + 1} attempts: ${lastError?.message}`,
        'transform',
        { item, attempts: retryAttempts + 1 }
      );
    };
    
    // Process stream items
    for await (const item of stream) {
      // Start processing if we have capacity
      if (activeWorkers.size < concurrency) {
        const workerId = Symbol('worker');
        activeWorkers.set(workerId, processWithRetry(item, nextIndex++, workerId));
      } else {
        // Wait for a worker to complete
        const completed = await Promise.race(activeWorkers.values());
        
        // Remove the completed worker
        activeWorkers.delete(completed.workerId);
        
        results.set(completed.index, completed.result);
        
        // Yield results in order
        while (results.has(outputIndex)) {
          yield results.get(outputIndex)!;
          results.delete(outputIndex);
          outputIndex++;
        }
        
        // Start processing the new item
        const workerId = Symbol('worker');
        activeWorkers.set(workerId, processWithRetry(item, nextIndex++, workerId));
      }
    }
    
    // Process remaining workers
    while (activeWorkers.size > 0) {
      const completed = await Promise.race(activeWorkers.values());
      
      // Remove the completed worker
      activeWorkers.delete(completed.workerId);
      
      results.set(completed.index, completed.result);
      
      // Yield results in order
      while (results.has(outputIndex)) {
        yield results.get(outputIndex)!;
        results.delete(outputIndex);
        outputIndex++;
      }
    }
  };
  
  return new AdvancedStream(transformedIterable());
}

/**
 * Batch process stream items with memory monitoring
 */
export function batchProcess<T, U>(
  stream: Stream<T>,
  batchSize: number,
  processor: (batch: T[]) => Promise<U[]>,
  options: { 
    memoryThreshold?: number; // Memory usage threshold (0-1)
    backpressure?: boolean;   // Enable backpressure
  } = {}
): Stream<U> {
  const { memoryThreshold = 0.8, backpressure = true } = options;
  
  const batchedIterable = async function* (): AsyncIterable<U> {
    let batch: T[] = [];
    
    for await (const item of stream) {
      batch.push(item);
      
      // Check memory pressure if backpressure is enabled
      if (backpressure) {
        const memoryStats = getMemoryStats();
        const memoryUsage = memoryStats.used / memoryStats.total;
        
        if (memoryUsage > memoryThreshold) {
          // Process current batch immediately to free memory
          if (batch.length > 0) {
            const results = await processor([...batch]);
            for (const result of results) {
              yield result;
            }
            batch = [];
          }
          
          // Brief pause to allow garbage collection
          await new Promise(resolve => setTimeout(resolve, 10));
          continue;
        }
      }
      
      // Process batch when it reaches the target size
      if (batch.length >= batchSize) {
        const results = await processor([...batch]);
        for (const result of results) {
          yield result;
        }
        batch = [];
      }
    }
    
    // Process remaining items
    if (batch.length > 0) {
      const results = await processor(batch);
      for (const result of results) {
        yield result;
      }
    }
  };
  
  return new AdvancedStream(batchedIterable());
}

/**
 * Rate limit a stream with precise timing control
 */
export function rateLimit<T>(
  stream: Stream<T>, 
  itemsPerSecond: number,
  options: { burstSize?: number; leakyBucket?: boolean } = {}
): Stream<T> {
  const { burstSize = 1, leakyBucket = false } = options;
  const intervalMs = 1000 / itemsPerSecond;
  
  const rateLimitedIterable = async function* (): AsyncIterable<T> {
    let lastEmission = 0;
    let tokenBucket = burstSize;
    let bucketRefillTimer = Date.now();
    
    for await (const item of stream) {
      if (leakyBucket) {
        // Leaky bucket algorithm
        const now = Date.now();
        const timePassed = now - bucketRefillTimer;
        const tokensToAdd = Math.floor(timePassed / intervalMs);
        
        if (tokensToAdd > 0) {
          tokenBucket = Math.min(burstSize, tokenBucket + tokensToAdd);
          bucketRefillTimer += tokensToAdd * intervalMs;
        }
        
        if (tokenBucket > 0) {
          tokenBucket--;
          yield item;
        } else {
          // Wait for next token
          const waitTime = intervalMs - (now - bucketRefillTimer);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          tokenBucket = burstSize - 1;
          bucketRefillTimer = Date.now();
          yield item;
        }
      } else {
        // Simple rate limiting
        const now = Date.now();
        const timeSinceLastEmission = now - lastEmission;
        
        if (timeSinceLastEmission < intervalMs) {
          await new Promise(resolve => setTimeout(resolve, intervalMs - timeSinceLastEmission));
        }
        
        lastEmission = Date.now();
        yield item;
      }
    }
  };
  
  return new AdvancedStream(rateLimitedIterable());
}

/**
 * Debounce stream items - only emit after a period of inactivity
 */
export function debounce<T>(stream: Stream<T>, delayMs: number): Stream<T> {
  const debouncedIterable = async function* (): AsyncIterable<T> {
    let lastItem: T | undefined;
    let timeout: NodeJS.Timeout | undefined;
    let emitPromise: Promise<T> | undefined;
    let emitResolve: ((value: T) => void) | undefined;
    
    const scheduleEmit = (item: T) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      lastItem = item;
      
      if (!emitPromise) {
        emitPromise = new Promise(resolve => {
          emitResolve = resolve;
        });
      }
      
      timeout = setTimeout(() => {
        if (emitResolve && lastItem !== undefined) {
          emitResolve(lastItem);
          emitPromise = undefined;
          emitResolve = undefined;
          lastItem = undefined;
        }
      }, delayMs);
    };
    
    // Start processing stream
    const streamPromise = (async () => {
      for await (const item of stream) {
        scheduleEmit(item);
      }
      
      // Emit final item if pending
      if (timeout && lastItem !== undefined) {
        clearTimeout(timeout);
        if (emitResolve) {
          emitResolve(lastItem);
        }
      }
    })();
    
    // Yield debounced items
    try {
      let streamDone = false;
      while (!streamDone) {
        if (emitPromise) {
          const item = await emitPromise;
          yield item;
        } else {
          // Check if stream is done
          const raceResult = await Promise.race([
            streamPromise.then(() => 'done'),
            new Promise(resolve => setTimeout(resolve, 10)).then(() => 'timeout')
          ]);
          
          if (raceResult === 'done') {
            streamDone = true;
            // Wait for any final emit
            if (emitPromise) {
              const finalItem = await emitPromise;
              yield finalItem;
            }
          }
        }
      }
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  };
  
  return new AdvancedStream(debouncedIterable());
}

/**
 * Buffer stream items for a specific time window
 */
export function bufferTime<T>(stream: Stream<T>, timeMs: number): Stream<T[]> {
  const bufferedIterable = async function* (): AsyncIterable<T[]> {
    let buffer: T[] = [];
    let timeout: NodeJS.Timeout | undefined;
    let flushPromise: Promise<T[]> | undefined;
    let flushResolve: ((value: T[]) => void) | undefined;
    
    const scheduleFlush = () => {
      if (!flushPromise) {
        flushPromise = new Promise(resolve => {
          flushResolve = resolve;
        });
        
        timeout = setTimeout(() => {
          if (flushResolve) {
            flushResolve([...buffer]);
            buffer = [];
            flushPromise = undefined;
            flushResolve = undefined;
          }
        }, timeMs);
      }
    };
    
    // Start processing stream
    const streamPromise = (async () => {
      for await (const item of stream) {
        buffer.push(item);
        scheduleFlush();
      }
      
      // Flush final buffer
      if (buffer.length > 0 && flushResolve) {
        if (timeout) {
          clearTimeout(timeout);
        }
        flushResolve([...buffer]);
      }
    })();
    
    // Yield buffered chunks
    try {
      while (true) {
        if (flushPromise) {
          const chunk = await flushPromise;
          if (chunk.length > 0) {
            yield chunk;
          }
        } else {
          // Check if stream is done
          await Promise.race([
            streamPromise,
            new Promise(resolve => setTimeout(resolve, 10))
          ]);
          
          if (!flushPromise) {
            break;
          }
        }
      }
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  };
  
  return new AdvancedStream(bufferedIterable());
}

/**
 * Take items from stream until condition is met
 */
export function takeUntil<T>(stream: Stream<T>, predicate: (item: T) => boolean): Stream<T> {
  const takeUntilIterable = async function* (): AsyncIterable<T> {
    for await (const item of stream) {
      yield item;
      if (predicate(item)) {
        break;
      }
    }
  };
  
  return new AdvancedStream(takeUntilIterable());
}

/**
 * Skip items from stream until condition is met
 */
export function skipUntil<T>(stream: Stream<T>, predicate: (item: T) => boolean): Stream<T> {
  const skipUntilIterable = async function* (): AsyncIterable<T> {
    let shouldYield = false;
    
    for await (const item of stream) {
      if (!shouldYield && predicate(item)) {
        shouldYield = true;
      }
      
      if (shouldYield) {
        yield item;
      }
    }
  };
  
  return new AdvancedStream(skipUntilIterable());
}

/**
 * Window stream items into overlapping windows
 */
export function window<T>(stream: Stream<T>, size: number, skip: number = 1): Stream<T[]> {
  const windowIterable = async function* (): AsyncIterable<T[]> {
    const buffer: T[] = [];
    
    for await (const item of stream) {
      buffer.push(item);
      
      // Emit window when we have enough items
      if (buffer.length >= size) {
        yield [...buffer];
        
        // Remove items based on skip
        for (let i = 0; i < skip && buffer.length > 0; i++) {
          buffer.shift();
        }
      }
    }
    
    // Emit remaining windows
    while (buffer.length >= size) {
      yield [...buffer];
      for (let i = 0; i < skip && buffer.length > 0; i++) {
        buffer.shift();
      }
    }
  };
  
  return new AdvancedStream(windowIterable());
}

/**
 * Distinct stream items (remove duplicates)
 */
export function distinct<T>(stream: Stream<T>, keySelector?: (item: T) => any): Stream<T> {
  const distinctIterable = async function* (): AsyncIterable<T> {
    const seen = new Set();
    
    for await (const item of stream) {
      const key = keySelector ? keySelector(item) : item;
      
      if (!seen.has(key)) {
        seen.add(key);
        yield item;
      }
    }
  };
  
  return new AdvancedStream(distinctIterable());
}

/**
 * Zip multiple streams together
 */
export function zip<T, U>(stream1: Stream<T>, stream2: Stream<U>): Stream<[T, U]>;
export function zip<T, U, V>(stream1: Stream<T>, stream2: Stream<U>, stream3: Stream<V>): Stream<[T, U, V]>;
export function zip<T>(...streams: Stream<T>[]): Stream<T[]>;
export function zip(...streams: Stream<any>[]): Stream<any[]> {
  const zippedIterable = async function* (): AsyncIterable<any[]> {
    const iterators = streams.map(stream => {
      if (stream.getBuffer) {
        const buffer = stream.getBuffer();
        return (async function* () {
          for (const item of buffer) {
            yield item;
          }
        })();
      }
      // Convert to async iterable
      return (async function* () {
        const array = await stream.toArray();
        for (const item of array) {
          yield item;
        }
      })();
    });
    
    while (true) {
      const results = await Promise.all(
        iterators.map(iterator => iterator.next())
      );
      
      // If any iterator is done, stop
      if (results.some(result => result.done)) {
        break;
      }
      
      yield results.map(result => result.value);
    }
  };
  
  return new AdvancedStream(zippedIterable());
}
