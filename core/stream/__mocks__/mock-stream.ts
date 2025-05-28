/**
 * Mock Stream Implementations
 * ==========================
 * 
 * Mock implementations for testing stream processing components.
 */

import {
  StreamInterface,
  StreamOptions,
  StreamState,
  Stream,
  ChunkProcessor,
  ChunkProcessingConfig,
  StreamPipeline,
  PrimeStreamProcessor,
  BackpressureController,
  EncodingStreamBridge,
  ChunkedStream,
  StreamPerformanceMetrics,
  OptimizationResult,
  MemoryStats,
  ProcessingContext
} from '../types';
import { ModelResult, ModelLifecycleState } from '../../../os/model/types';

// Simple mock DecodedChunk to avoid import issues
interface MockDecodedChunk {
  type: string;
  checksum: bigint;
  data: any;
}

/**
 * Mock stream implementation for testing
 */
export class MockStreamInterface implements StreamInterface {
  private mockState: StreamState = {
    lifecycle: ModelLifecycleState.Ready,
    operationCount: { total: 0, success: 0, failed: 0 },
    lastStateChangeTime: Date.now(),
    uptime: 0,
    custom: {},
    config: {
      defaultChunkSize: 1024,
      maxConcurrency: 4,
      memoryLimit: 100 * 1024 * 1024,
      enableOptimization: true
    },
    metrics: {
      throughput: 100,
      latency: 10,
      memoryUsage: 50 * 1024 * 1024,
      errorRate: 0.01,
      backpressureEvents: 0,
      cacheHitRate: 0.9,
      cpuUsage: 0.5,
      ioWaitTime: 5
    },
    activeStreams: {
      count: 2,
      types: { data: 2, prime: 0, transform: 0, merge: 0, parallel: 0 },
      totalMemoryUsage: 10 * 1024 * 1024
    },
    pipelines: {
      created: 5,
      completed: 4,
      failed: 1,
      averageExecutionTime: 150
    },
    memory: {
      currentUsage: 50 * 1024 * 1024,
      peakUsage: 60 * 1024 * 1024,
      bufferSizes: {
        inputBufferSize: 8192,
        outputBufferSize: 8192,
        intermediateBufferSize: 4096,
        backpressureThreshold: 0.8
      },
      backpressureActive: false
    }
  };

  createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T> {
    return {
      success,
      data: data as T,
      error,
      timestamp: Date.now(),
      source: 'mock-stream'
    };
  }

  async initialize() {
    return this.createResult(true);
  }

  async process(input: any) {
    this.mockState.operationCount.total++;
    this.mockState.operationCount.success++;
    return this.createResult(true, input);
  }

  async reset() {
    this.mockState.operationCount = { total: 0, success: 0, failed: 0 };
    return this.createResult(true);
  }

  async terminate() {
    return this.createResult(true);
  }

  getState(): StreamState {
    return this.mockState;
  }

  async processChunkedStream<T>(
    input: AsyncIterable<T>,
    processor: ChunkProcessor<T>
  ): Promise<AsyncIterable<T>> {
    return input; // Simple pass-through
  }

  createPipeline<T, R>(): StreamPipeline<T, R> {
    return new MockStreamPipeline<T, R>();
  }

  createPrimeStreamProcessor(): PrimeStreamProcessor {
    return new MockPrimeStreamProcessor();
  }

  createEncodingStreamBridge(): EncodingStreamBridge {
    return new MockEncodingStreamBridge();
  }

  getMetrics(): StreamPerformanceMetrics {
    return this.mockState.metrics;
  }

  getMemoryUsage(): MemoryStats {
    return {
      used: 50 * 1024 * 1024,
      available: 450 * 1024 * 1024,
      total: 500 * 1024 * 1024,
      bufferSize: 8192,
      gcCollections: 10
    };
  }

  async optimizePerformance(): Promise<OptimizationResult> {
    return {
      success: true,
      improvementPercentage: 10,
      newConfiguration: { chunkSize: 2048 },
      benchmarkResults: [],
      recommendations: []
    };
  }

  configure(options: Partial<StreamOptions>): void {
    // Mock configuration
  }

  getConfiguration(): StreamOptions {
    return {
      defaultChunkSize: 1024,
      maxConcurrency: 4,
      memoryLimit: 100 * 1024 * 1024
    };
  }

  createStream<T>(source: AsyncIterable<T>): Stream<T> {
    return new MockStream(source);
  }

  createChunkedStream<T>(config: ChunkProcessingConfig): ChunkedStream<T> {
    return new MockChunkedStream<T>(config);
  }

  getBackpressureController(): BackpressureController {
    return new MockBackpressureController();
  }

  getLogger() {
    return {
      debug: jest.fn().mockResolvedValue(undefined),
      info: jest.fn().mockResolvedValue(undefined),
      warn: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined)
    };
  }
}

/**
 * Mock stream implementation
 */
export class MockStream<T> implements Stream<T> {
  private data: T[] = [];

  constructor(source: AsyncIterable<T>) {
    // Convert async iterable to array for testing
    this.loadData(source);
  }

  private async loadData(source: AsyncIterable<T>) {
    for await (const item of source) {
      this.data.push(item);
    }
  }

  [Symbol.iterator](): Iterator<T> {
    let index = 0;
    const data = this.data;
    
    return {
      next(): IteratorResult<T> {
        if (index < data.length) {
          return { value: data[index++], done: false };
        }
        return { done: true, value: undefined as any };
      }
    };
  }

  next(): IteratorResult<T> {
    return this[Symbol.iterator]().next();
  }

  map<U>(fn: (value: T) => U): Stream<U> {
    return new MockStream(this.createAsyncIterable(this.data.map(fn)));
  }

  filter(fn: (value: T) => boolean): Stream<T> {
    return new MockStream(this.createAsyncIterable(this.data.filter(fn)));
  }

  take(n: number): Stream<T> {
    return new MockStream(this.createAsyncIterable(this.data.slice(0, n)));
  }

  skip(n: number): Stream<T> {
    return new MockStream(this.createAsyncIterable(this.data.slice(n)));
  }

  chunk(size: number): Stream<T[]> {
    const chunks: T[][] = [];
    for (let i = 0; i < this.data.length; i += size) {
      chunks.push(this.data.slice(i, i + size));
    }
    return new MockStream(this.createAsyncIterable(chunks)) as any;
  }

  parallel(concurrency: number): Stream<T> {
    return this; // No-op for mock
  }

  async reduce<U>(fn: (acc: U, value: T) => U, initial: U): Promise<U> {
    return this.data.reduce(fn, initial);
  }

  async forEach(fn: (value: T) => void): Promise<void> {
    this.data.forEach(fn);
  }

  async toArray(): Promise<T[]> {
    return [...this.data];
  }

  concat(other: Stream<T>): Stream<T> {
    return new MockStream(this.createAsyncIterable([...this.data, ...other.getBuffer!()]));
  }

  branch(): Stream<T> {
    return new MockStream(this.createAsyncIterable([...this.data]));
  }

  getBuffer?(): T[] {
    return [...this.data];
  }

  private async *createAsyncIterable<U>(items: U[]): AsyncIterable<U> {
    for (const item of items) {
      yield item;
    }
  }
}

/**
 * Mock chunked stream implementation
 */
export class MockChunkedStream<T> implements ChunkedStream<T> {
  chunkSize: number;
  private buffer: T[] = [];

  constructor(config: ChunkProcessingConfig) {
    this.chunkSize = config.chunkSize;
  }

  async processChunk(chunk: T[]): Promise<T[]> {
    return chunk; // Pass-through
  }

  async flush(): Promise<T[]> {
    const result = [...this.buffer];
    this.buffer = [];
    return result;
  }

  getMemoryUsage(): number {
    return this.buffer.length * 64; // Rough estimate
  }

  shouldApplyBackpressure(): boolean {
    return this.buffer.length > this.chunkSize * 10;
  }

  setChunkSize(size: number): void {
    this.chunkSize = size;
  }

  getChunkSize(): number {
    return this.chunkSize;
  }
}

/**
 * Mock stream pipeline implementation
 */
export class MockStreamPipeline<T, R> implements StreamPipeline<T, R> {
  private transformations: Array<(input: any) => any> = [];

  source(input: AsyncIterable<T>): StreamPipeline<T, T> {
    return new MockStreamPipeline<T, T>();
  }

  transform<U>(fn: (input: T) => U): StreamPipeline<T, U> {
    this.transformations.push(fn);
    return new MockStreamPipeline<T, U>();
  }

  asyncTransform<U>(fn: (input: T) => Promise<U>): StreamPipeline<T, U> {
    this.transformations.push(fn);
    return new MockStreamPipeline<T, U>();
  }

  filter(predicate: (input: T) => boolean): StreamPipeline<T, T> {
    this.transformations.push((items: T[]) => items.filter(predicate));
    return new MockStreamPipeline<T, T>();
  }

  batch(size: number): StreamPipeline<T, T[]> {
    return new MockStreamPipeline<T, T[]>();
  }

  parallel(concurrency: number): StreamPipeline<T, T> {
    return new MockStreamPipeline<T, T>();
  }

  distribute(partitionFn: (value: T) => number): StreamPipeline<T, T> {
    return new MockStreamPipeline<T, T>();
  }

  catch(handler: (error: Error, input: T) => T | null): StreamPipeline<T, T> {
    return new MockStreamPipeline<T, T>();
  }

  retry(attempts: number, delay: number): StreamPipeline<T, T> {
    return new MockStreamPipeline<T, T>();
  }

  timeout(ms: number): StreamPipeline<T, T> {
    return new MockStreamPipeline<T, T>();
  }

  async sink(output: (input: R) => Promise<void>) {
    return {
      success: true,
      itemsProcessed: 100,
      executionTime: 1000,
      memoryUsed: 1024 * 1024,
      errors: [],
      warnings: [],
      metrics: {
        throughput: 100,
        latency: 10,
        memoryPeak: 2 * 1024 * 1024,
        errorRate: 0,
        backpressureEvents: 0,
        stageMetrics: []
      }
    };
  }

  async collect(): Promise<R[]> {
    return [] as R[];
  }

  async reduce<U>(fn: (acc: U, current: R) => U, initial: U): Promise<U> {
    return initial;
  }

  onProgress(callback: any): StreamPipeline<T, R> {
    return this;
  }

  onError(callback: any): StreamPipeline<T, R> {
    return this;
  }

  async execute(): Promise<AsyncIterable<R>> {
    return this.createAsyncIterable([]);
  }

  private async *createAsyncIterable<U>(items: U[]): AsyncIterable<U> {
    for (const item of items) {
      yield item;
    }
  }
}

/**
 * Mock prime stream processor implementation
 */
export class MockPrimeStreamProcessor implements PrimeStreamProcessor {
  async processPrimeStream(chunks: AsyncIterable<bigint>) {
    const results = [];
    for await (const chunk of chunks) {
      // Create proper DecodedChunk mock
      const decodedData: MockDecodedChunk = {
        type: 'data',
        checksum: 0n,
        data: { value: 1, position: 0 }
      };
      
      results.push({
        originalChunk: chunk,
        decodedData,
        processingTime: 10,
        verified: true,
        errors: []
      });
    }
    return results;
  }

  async streamFactorization(numbers: AsyncIterable<bigint>) {
    const self = this;
    return {
      async *[Symbol.asyncIterator]() {
        for await (const number of numbers) {
          yield [{ prime: 2n, exponent: 1 }]; // Mock factorization
        }
      }
    };
  }

  async verifyStreamIntegrity(chunks: AsyncIterable<bigint>) {
    const results = [];
    for await (const chunk of chunks) {
      results.push({
        chunk,
        valid: true,
        checksum: 0n,
        errors: [],
        verificationTime: 5
      });
    }
    return results;
  }

  configure(options: any): void {
    // Mock configuration
  }

  getMetrics() {
    return {
      chunksProcessed: 10,
      numbersFactorized: 8,
      integrityChecksPerformed: 10,
      averageProcessingTime: 12,
      memoryUsage: 1024 * 1024,
      errorRate: 0.01
    };
  }
}

/**
 * Mock encoding stream bridge implementation
 */
export class MockEncodingStreamBridge implements EncodingStreamBridge {
  async *encodeTextStream(text: AsyncIterable<string>): AsyncIterable<bigint> {
    for await (const str of text) {
      yield BigInt(str.length); // Mock encoding
    }
  }

  async *decodeTextStream(chunks: AsyncIterable<bigint>): AsyncIterable<string> {
    for await (const chunk of chunks) {
      yield `decoded-${chunk}`;
    }
  }

  async *decodeChunkStream(chunks: AsyncIterable<bigint>): AsyncIterable<MockDecodedChunk> {
    for await (const chunk of chunks) {
      yield { 
        type: 'data', 
        data: chunk, 
        checksum: 0n 
      };
    }
  }

  async *executeStreamingProgram(chunks: AsyncIterable<bigint>): AsyncIterable<string> {
    for await (const chunk of chunks) {
      yield `executed-${chunk}`;
    }
  }

  configure(encodingModule: any): void {
    // Mock configuration
  }
}

/**
 * Mock backpressure controller implementation
 */
export class MockBackpressureController implements BackpressureController {
  private paused = false;

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  async drain(): Promise<void> {
    // Mock drain
  }

  getBufferLevel(): number {
    return 0.5;
  }

  getMemoryUsage(): MemoryStats {
    return {
      used: 50 * 1024 * 1024,
      available: 450 * 1024 * 1024,
      total: 500 * 1024 * 1024,
      bufferSize: 8192,
      gcCollections: 5
    };
  }

  onPressure(callback: () => void): void {
    // Mock event registration
  }

  setThreshold(threshold: number): void {
    // Mock threshold setting
  }

  getThreshold(): number {
    return 0.8;
  }
}

/**
 * Mock chunk processor implementation
 */
export class MockChunkProcessor<T> implements ChunkProcessor<T> {
  config: ChunkProcessingConfig = {
    chunkSize: 1024,
    maxBufferSize: 10240,
    enableBackpressure: true,
    backpressureThreshold: 0.8,
    errorTolerance: 0.05,
    retryAttempts: 3,
    retryDelay: 1000
  };

  async processChunk(chunk: T[], context: ProcessingContext<T>): Promise<T[]> {
    return chunk; // Pass-through
  }

  async flush(): Promise<T[]> {
    return [];
  }

  getMemoryUsage(): number {
    return 1024;
  }

  shouldApplyBackpressure(): boolean {
    return false;
  }

  handleProcessingError(error: Error, chunk: T[]): T[] | null {
    return null;
  }

  async initialize(): Promise<void> {
    // Mock initialization
  }

  async terminate(): Promise<void> {
    // Mock termination
  }
}

/**
 * Create a mock stream interface
 */
export function createMockStreamInterface(options: Partial<StreamOptions> = {}): StreamInterface {
  return new MockStreamInterface();
}

/**
 * Create mock performance metrics
 */
export function createMockMetrics(): StreamPerformanceMetrics {
  return {
    throughput: 100 + Math.random() * 900,
    latency: 10 + Math.random() * 40,
    memoryUsage: (50 + Math.random() * 50) * 1024 * 1024,
    errorRate: Math.random() * 0.05,
    backpressureEvents: Math.floor(Math.random() * 5),
    cacheHitRate: 0.8 + Math.random() * 0.2,
    cpuUsage: 0.3 + Math.random() * 0.4,
    ioWaitTime: Math.random() * 20
  };
}
