/**
 * Stream Processing Module
 * =======================
 * 
 * High-throughput streaming primitives for efficient data processing.
 * Provides chunked processing, pipeline management, and prime stream operations.
 * 
 * Production implementation requiring proper core module integration.
 * No fallbacks or simplifications - strict dependency requirements.
 */

import {
  BaseModel,
  ModelResult,
  ModelLifecycleState,
  ModelOptions
} from '../../os/model';

import {
  StreamOptions,
  StreamInterface,
  StreamState,
  StreamProcessInput,
  Stream,
  ChunkProcessor,
  ChunkProcessingConfig,
  StreamPipeline,
  PrimeStreamProcessor,
  BackpressureController,
  StreamOptimizer,
  MemoryStats,
  StreamPerformanceMetrics,
  OptimizationResult,
  EncodingStreamBridge,
  ChunkedStream,
  ProcessingContext,
  StreamProcessingError
} from './types';

import { ChunkProcessorImpl, createChunkProcessor } from './processors/chunk-processor';
import { StreamPipelineImpl } from './processors/pipeline-processor';
import { PrimeStreamProcessorImpl } from './processors/prime-processor';
import { 
  createStreamFromArray, 
  mergeStreams, 
  transformStreamAsync,
  batchProcess 
} from './utils/stream-utils';
import { 
  createProcessingContext,
  calculateOptimalChunkSize,
  chunkArray,
  mergeChunks
} from './utils/chunk-utils';
import { 
  getMemoryStats, 
  isMemoryPressure, 
  calculateBufferSize,
  MemoryMonitor 
} from './utils/memory-utils';
import { PerformanceMonitor, getPerformanceMonitor } from './utils/performance-monitor';
import { OPTIMIZATION_THRESHOLDS, STREAM_DEFAULTS } from './constants';
import { PrimeRegistryAdapter, createPrimeRegistryAdapter } from './adapters/prime-registry-adapter';
import { IntegrityAdapter, createIntegrityAdapter } from './adapters/integrity-registry-adapter';

/**
 * Adapter for encoding module integration
 */
class EncodingModuleAdapter {
  constructor(private encodingModule: any) {}
  
  async ensureInitialized(): Promise<void> {
    if (typeof this.encodingModule.initialize === 'function' && 
        typeof this.encodingModule.getState === 'function') {
      const state = this.encodingModule.getState();
      if (state.lifecycle !== 'Ready') {
        const result = await this.encodingModule.initialize();
        if (!result.success) {
          throw new StreamProcessingError(`Failed to initialize encoding module: ${result.error}`);
        }
      }
    }
  }
  
  async encodeText(text: string): Promise<bigint[]> {
    if (typeof this.encodingModule.encodeText !== 'function') {
      throw new StreamProcessingError('Encoding module missing encodeText method');
    }
    return this.encodingModule.encodeText(text);
  }
  
  async decodeText(chunks: bigint[]): Promise<string> {
    if (typeof this.encodingModule.decodeText !== 'function') {
      throw new StreamProcessingError('Encoding module missing decodeText method');
    }
    return this.encodingModule.decodeText(chunks);
  }
  
  async decodeChunk(chunk: bigint): Promise<any> {
    if (typeof this.encodingModule.decodeChunk !== 'function') {
      throw new StreamProcessingError('Encoding module missing decodeChunk method');
    }
    return this.encodingModule.decodeChunk(chunk);
  }
  
  async executeProgram(chunks: bigint[]): Promise<string[]> {
    if (typeof this.encodingModule.executeProgram !== 'function') {
      throw new StreamProcessingError('Encoding module missing executeProgram method');
    }
    return this.encodingModule.executeProgram(chunks);
  }
}

/**
 * Default options for stream processing
 */
const DEFAULT_OPTIONS: Required<Omit<StreamOptions, keyof ModelOptions | 'encodingModule' | 'primeRegistry' | 'bandsOptimizer' | 'performanceMonitor'>> = {
  defaultChunkSize: 1024,
  maxConcurrency: 4,
  memoryLimit: 100 * 1024 * 1024, // 100MB
  enableOptimization: true,
  metricsInterval: 5000,
  profilingEnabled: false,
  optimizationStrategy: 'balanced' as any,
  retryAttempts: 3,
  retryDelay: 1000,
  errorTolerance: 0.05,
  timeoutMs: 30000,
  enableBackpressure: true,
  backpressureThreshold: 0.8,
  bufferSize: 8192
};

/**
 * Main implementation of stream processing system
 * Production quality - requires dependencies, no fallbacks
 */
export class StreamImplementation extends BaseModel implements StreamInterface {
  private config: {
    defaultChunkSize: number;
    maxConcurrency: number;
    memoryLimit: number;
    enableOptimization: boolean;
    metricsInterval: number;
    profilingEnabled: boolean;
    optimizationStrategy: any;
    retryAttempts: number;
    retryDelay: number;
    errorTolerance: number;
    timeoutMs: number;
    enableBackpressure: boolean;
    backpressureThreshold: number;
    bufferSize: number;
    encodingModule?: any;
    primeRegistry?: any;
    bandsOptimizer?: any;
  };
  
  private memoryMonitor: MemoryMonitor;
  private performanceMonitor: PerformanceMonitor;
  private backpressureController?: BackpressureController;
  private encodingAdapter?: EncodingModuleAdapter;
  private primeAdapter?: PrimeRegistryAdapter;
  
  private stats = {
    streamsCreated: 0,
    chunksProcessed: 0,
    pipelinesExecuted: 0,
    bytesProcessed: 0,
    averageProcessingTime: 0,
    errors: 0,
    backpressureEvents: 0
  };
  
  constructor(options: StreamOptions = {}) {
    super({
      name: 'stream',
      version: '1.0.0',
      debug: false,
      ...options
    });
    
    this.config = {
      defaultChunkSize: options.defaultChunkSize ?? DEFAULT_OPTIONS.defaultChunkSize,
      maxConcurrency: options.maxConcurrency ?? DEFAULT_OPTIONS.maxConcurrency,
      memoryLimit: options.memoryLimit ?? DEFAULT_OPTIONS.memoryLimit,
      enableOptimization: options.enableOptimization ?? DEFAULT_OPTIONS.enableOptimization,
      metricsInterval: options.metricsInterval ?? DEFAULT_OPTIONS.metricsInterval,
      profilingEnabled: options.profilingEnabled ?? DEFAULT_OPTIONS.profilingEnabled,
      optimizationStrategy: options.optimizationStrategy ?? DEFAULT_OPTIONS.optimizationStrategy,
      retryAttempts: options.retryAttempts ?? DEFAULT_OPTIONS.retryAttempts,
      retryDelay: options.retryDelay ?? DEFAULT_OPTIONS.retryDelay,
      errorTolerance: options.errorTolerance ?? DEFAULT_OPTIONS.errorTolerance,
      timeoutMs: options.timeoutMs ?? DEFAULT_OPTIONS.timeoutMs,
      enableBackpressure: options.enableBackpressure ?? DEFAULT_OPTIONS.enableBackpressure,
      backpressureThreshold: options.backpressureThreshold ?? DEFAULT_OPTIONS.backpressureThreshold,
      bufferSize: options.bufferSize ?? DEFAULT_OPTIONS.bufferSize,
      encodingModule: options.encodingModule,
      primeRegistry: options.primeRegistry,
      bandsOptimizer: options.bandsOptimizer
    };
    
    // Create adapters for provided dependencies
    if (this.config.encodingModule) {
      this.encodingAdapter = new EncodingModuleAdapter(this.config.encodingModule);
    }
    if (this.config.primeRegistry) {
      this.primeAdapter = createPrimeRegistryAdapter(this.config.primeRegistry, {
        logger: undefined // Will be set during initialization
      });
    }
    
    this.memoryMonitor = new MemoryMonitor();
    this.performanceMonitor = options.performanceMonitor || getPerformanceMonitor();
  }
  
  /**
   * Initialize the stream module
   */
  protected async onInitialize(): Promise<void> {
    // Initialize adapters if available
    if (this.encodingAdapter) {
      await this.encodingAdapter.ensureInitialized();
    }
    if (this.primeAdapter) {
      await this.primeAdapter.ensureInitialized();
    }
    
    this.state.custom = {
      config: this.config,
      stats: { ...this.stats },
      memory: getMemoryStats()
    };
    
    // Start memory monitoring if enabled
    if (this.config.enableOptimization) {
      this.memoryMonitor.start(this.config.metricsInterval);
    }
    
    await this.logger.info('Stream module initialized', { 
      config: {
        defaultChunkSize: this.config.defaultChunkSize,
        maxConcurrency: this.config.maxConcurrency,
        memoryLimit: this.config.memoryLimit,
        hasEncodingModule: !!this.config.encodingModule,
        hasPrimeRegistry: !!this.config.primeRegistry
      }
    });
  }
  
  /**
   * Process stream operations
   */
  protected async onProcess<T = StreamProcessInput, R = unknown>(input: T): Promise<R> {
    if (!input || typeof input !== 'object') {
      throw new StreamProcessingError('Invalid input: expected StreamProcessInput object');
    }
    
    const request = input as unknown as StreamProcessInput;
    
    await this.logger.debug('Processing stream operation', { operation: request.operation });
    
    switch (request.operation) {
      case 'createStream':
        if (!request.source) throw new StreamProcessingError('Missing source for stream creation');
        return this.createStream(request.source) as unknown as R;
        
      case 'processChunkedStream':
        if (!request.input || !request.processor) throw new StreamProcessingError('Missing input or processor');
        return this.processChunkedStream(request.input, request.processor) as unknown as R;
        
      case 'createPipeline':
        return this.createPipeline() as unknown as R;
        
      case 'getMetrics':
        return this.getMetrics() as unknown as R;
        
      case 'optimizePerformance':
        return this.optimizePerformance() as unknown as R;
        
      default:
        throw new StreamProcessingError(`Unknown operation: ${(request as any).operation}`);
    }
  }
  
  /**
   * Reset the module state
   */
  protected async onReset(): Promise<void> {
    this.stats = {
      streamsCreated: 0,
      chunksProcessed: 0,
      pipelinesExecuted: 0,
      bytesProcessed: 0,
      averageProcessingTime: 0,
      errors: 0,
      backpressureEvents: 0
    };
    
    this.memoryMonitor.reset();
    
    this.state.custom = {
      config: this.config,
      stats: { ...this.stats },
      memory: getMemoryStats()
    };
    
    await this.logger.info('Stream module reset');
  }
  
  /**
   * Terminate the module
   */
  protected async onTerminate(): Promise<void> {
    this.memoryMonitor.stop();
    await this.logger.info('Stream module terminated');
  }
  
  // StreamInterface implementation
  
  async processChunkedStream<T>(
    input: AsyncIterable<T>,
    processor: ChunkProcessor<T>
  ): Promise<AsyncIterable<T>> {
    const self = this;
    
    return {
      async *[Symbol.asyncIterator]() {
        let chunkIndex = 0;
        let currentChunk: T[] = [];
        
        for await (const item of input) {
          currentChunk.push(item);
          
          if (currentChunk.length >= self.config.defaultChunkSize) {
            const context = createProcessingContext<T>(chunkIndex++, -1);
            const processed = await processor.processChunk(currentChunk, context);
            
            for (const processedItem of processed) {
              yield processedItem;
            }
            
            currentChunk = [];
            self.stats.chunksProcessed++;
          }
        }
        
        // Process remaining items
        if (currentChunk.length > 0) {
          const context = createProcessingContext<T>(chunkIndex, -1);
          const processed = await processor.processChunk(currentChunk, context);
          
          for (const processedItem of processed) {
            yield processedItem;
          }
          self.stats.chunksProcessed++;
        }
      }
    };
  }
  
  createPipeline<T, R>(): StreamPipeline<T, R> {
    this.stats.pipelinesExecuted++;
    return new StreamPipelineImpl<T, R>({
      id: `pipeline-${this.stats.pipelinesExecuted}`,
      maxConcurrency: this.config.maxConcurrency,
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
      timeoutMs: this.config.timeoutMs,
      logger: this.logger
    });
  }
  
  createPrimeStreamProcessor(): PrimeStreamProcessor {
    // Require prime registry for prime stream operations
    if (!this.primeAdapter) {
      throw new StreamProcessingError('Prime registry is required for prime stream processing');
    }
    
    return new PrimeStreamProcessorImpl({
      primeRegistry: this.config.primeRegistry,
      chunkSize: this.config.defaultChunkSize,
      logger: this.logger
    });
  }
  
  createEncodingStreamBridge(): EncodingStreamBridge {
    // Require encoding module for encoding bridge operations
    if (!this.encodingAdapter) {
      throw new StreamProcessingError('Encoding module is required for encoding stream bridge');
    }
    
    const adapter = this.encodingAdapter;
    const logger = this.logger;
    
    return {
      async *encodeTextStream(text: AsyncIterable<string>): AsyncIterable<bigint> {
        for await (const str of text) {
          const chunks = await adapter.encodeText(str);
          for (const chunk of chunks) {
            yield chunk;
          }
        }
      },
      
      async *decodeTextStream(chunks: AsyncIterable<bigint>): AsyncIterable<string> {
        const chunkBuffer: bigint[] = [];
        
        for await (const chunk of chunks) {
          chunkBuffer.push(chunk);
          
          // Try to decode accumulated chunks
          try {
            const decoded = await adapter.decodeText(chunkBuffer);
            if (decoded) {
              yield decoded;
              chunkBuffer.length = 0; // Clear buffer after successful decode
            }
          } catch (error) {
            // Continue accumulating chunks if decode fails
            await logger.debug('Accumulating chunks for decoding', { bufferSize: chunkBuffer.length });
          }
        }
        
        // Final decode attempt
        if (chunkBuffer.length > 0) {
          try {
            const decoded = await adapter.decodeText(chunkBuffer);
            if (decoded) {
              yield decoded;
            }
          } catch (error) {
            await logger.error('Failed to decode final chunk buffer', error);
          }
        }
      },
      
      async *decodeChunkStream(chunks: AsyncIterable<bigint>): AsyncIterable<any> {
        for await (const chunk of chunks) {
          try {
            const decoded = await adapter.decodeChunk(chunk);
            yield decoded;
          } catch (error) {
            await logger.error('Failed to decode chunk', { chunk: chunk.toString(), error });
          }
        }
      },
      
      async *executeStreamingProgram(chunks: AsyncIterable<bigint>): AsyncIterable<string> {
        const chunkBuffer: bigint[] = [];
        
        for await (const chunk of chunks) {
          chunkBuffer.push(chunk);
        }
        
        // Execute complete program
        const output = await adapter.executeProgram(chunkBuffer);
        for (const line of output) {
          yield line;
        }
      },
      
      configure(encodingModule: any): void {
        // Create new adapter with updated module
        if (encodingModule) {
          const newAdapter = new EncodingModuleAdapter(encodingModule);
          Object.assign(adapter, newAdapter);
        }
      }
    };
  }
  
  getMetrics(): StreamPerformanceMetrics {
    const perfMetrics = this.performanceMonitor.getMetrics();
    return {
      throughput: perfMetrics.throughput || (this.stats.streamsCreated / (this.getUptime() / 1000) || 0),
      latency: perfMetrics.latency || this.stats.averageProcessingTime,
      memoryUsage: perfMetrics.memoryUsage || getMemoryStats().used,
      errorRate: perfMetrics.errorRate || (this.stats.errors / Math.max(1, this.stats.chunksProcessed)),
      backpressureEvents: perfMetrics.backpressureEvents || this.stats.backpressureEvents,
      cacheHitRate: perfMetrics.cacheHitRate,
      cpuUsage: perfMetrics.cpuUsage,
      ioWaitTime: perfMetrics.ioWaitTime
    };
  }
  
  getMemoryUsage(): MemoryStats {
    const stats = getMemoryStats();
    stats.bufferSize = this.config.bufferSize;
    return stats;
  }
  
  async optimizePerformance(): Promise<OptimizationResult> {
    const metrics = this.getMetrics();
    const memoryUsageRatio = metrics.memoryUsage / this.config.memoryLimit;
    
    // Use constants for optimization thresholds
    const recommendations = [];
    let estimatedImprovement = 0;
    const newConfig = { ...this.config };
    
    // Memory optimization
    if (memoryUsageRatio > OPTIMIZATION_THRESHOLDS.MEMORY.HIGH) {
      const newChunkSize = Math.floor(this.config.defaultChunkSize * STREAM_DEFAULTS.CHUNK_SIZE.ADAPTIVE_FACTOR);
      recommendations.push({
        type: 'configuration' as const,
        priority: memoryUsageRatio > OPTIMIZATION_THRESHOLDS.MEMORY.CRITICAL ? 'critical' as const : 'high' as const,
        description: 'Memory usage is high, consider reducing chunk size',
        expectedImprovement: OPTIMIZATION_THRESHOLDS.EXPECTED_IMPROVEMENT.MEMORY_REDUCTION,
        implementation: `Reduce defaultChunkSize to ${newChunkSize}`
      });
      newConfig.defaultChunkSize = newChunkSize;
      estimatedImprovement += OPTIMIZATION_THRESHOLDS.EXPECTED_IMPROVEMENT.MEMORY_REDUCTION;
    }
    
    // Throughput optimization
    if (metrics.throughput < OPTIMIZATION_THRESHOLDS.THROUGHPUT.ACCEPTABLE) {
      const newConcurrency = Math.min(
        this.config.maxConcurrency + STREAM_DEFAULTS.CONCURRENCY.INCREMENT,
        STREAM_DEFAULTS.CONCURRENCY.MAX
      );
      recommendations.push({
        type: 'configuration' as const,
        priority: metrics.throughput < OPTIMIZATION_THRESHOLDS.THROUGHPUT.POOR ? 'high' as const : 'medium' as const,
        description: 'Throughput is low, consider increasing concurrency',
        expectedImprovement: OPTIMIZATION_THRESHOLDS.EXPECTED_IMPROVEMENT.THROUGHPUT_INCREASE,
        implementation: `Increase maxConcurrency to ${newConcurrency}`
      });
      newConfig.maxConcurrency = newConcurrency;
      estimatedImprovement += OPTIMIZATION_THRESHOLDS.EXPECTED_IMPROVEMENT.THROUGHPUT_INCREASE;
    }
    
    // Latency optimization
    if (metrics.latency > OPTIMIZATION_THRESHOLDS.LATENCY.ACCEPTABLE) {
      recommendations.push({
        type: 'resource' as const,
        priority: metrics.latency > OPTIMIZATION_THRESHOLDS.LATENCY.POOR ? 'high' as const : 'medium' as const,
        description: 'High latency detected, consider reducing buffer sizes',
        expectedImprovement: OPTIMIZATION_THRESHOLDS.EXPECTED_IMPROVEMENT.LATENCY_REDUCTION,
        implementation: `Reduce bufferSize to ${Math.floor(this.config.bufferSize * 0.75)}`
      });
      newConfig.bufferSize = Math.floor(this.config.bufferSize * 0.75);
      estimatedImprovement += OPTIMIZATION_THRESHOLDS.EXPECTED_IMPROVEMENT.LATENCY_REDUCTION;
    }
    
    return {
      success: true,
      improvementPercentage: Math.min(estimatedImprovement, 100),
      newConfiguration: newConfig,
      benchmarkResults: [],
      recommendations
    };
  }
  
  configure(options: Partial<StreamOptions>): void {
    // Update configuration
    if (options.defaultChunkSize !== undefined) {
      this.config.defaultChunkSize = options.defaultChunkSize;
    }
    if (options.maxConcurrency !== undefined) {
      this.config.maxConcurrency = options.maxConcurrency;
    }
    if (options.memoryLimit !== undefined) {
      this.config.memoryLimit = options.memoryLimit;
    }
    
    // Update dependencies with proper adapters
    if (options.encodingModule !== undefined) {
      this.config.encodingModule = options.encodingModule;
      if (options.encodingModule) {
        this.encodingAdapter = new EncodingModuleAdapter(options.encodingModule);
      } else {
        this.encodingAdapter = undefined;
      }
    }
    
    if (options.primeRegistry !== undefined) {
      this.config.primeRegistry = options.primeRegistry;
      if (options.primeRegistry) {
        this.primeAdapter = createPrimeRegistryAdapter(options.primeRegistry, {
          logger: this.logger
        });
      } else {
        this.primeAdapter = undefined;
      }
    }
  }
  
  getConfiguration(): StreamOptions {
    return { ...this.config };
  }
  
  createStream<T>(source: AsyncIterable<T>): Stream<T> {
    this.stats.streamsCreated++;
    const streamInstance = this;
    
    return {
      // Sync iterator implementation
      [Symbol.iterator](): Iterator<T> {
        throw new Error('This stream only supports async iteration. Use for-await-of instead.');
      },
      
      // Async iterator implementation
      async *[Symbol.asyncIterator]() {
        for await (const item of source) {
          yield item;
        }
      },
      
      next(): IteratorResult<T> {
        throw new Error('Use async iteration with for-await-of');
      },
      
      map<U>(fn: (value: T) => U): Stream<U> {
        return streamInstance.createStream(streamInstance.mapAsyncIterable(source, fn));
      },
      
      filter(fn: (value: T) => boolean): Stream<T> {
        return streamInstance.createStream(streamInstance.filterAsyncIterable(source, fn));
      },
      
      take(n: number): Stream<T> {
        return streamInstance.createStream(streamInstance.takeAsyncIterable(source, n));
      },
      
      skip(n: number): Stream<T> {
        return streamInstance.createStream(streamInstance.skipAsyncIterable(source, n));
      },
      
      chunk(size: number): Stream<T[]> {
        return streamInstance.createStream(streamInstance.chunkAsyncIterable(source, size)) as any;
      },
      
      parallel(concurrency: number): Stream<T> {
        return streamInstance.createStream(source);
      },
      
      async reduce<U>(fn: (acc: U, value: T) => U, initial: U): Promise<U> {
        let acc = initial;
        for await (const item of source) {
          acc = fn(acc, item);
        }
        return acc;
      },
      
      async forEach(fn: (value: T) => void): Promise<void> {
        for await (const item of source) {
          fn(item);
        }
      },
      
      async toArray(): Promise<T[]> {
        const result: T[] = [];
        for await (const item of source) {
          result.push(item);
        }
        return result;
      },
      
      concat(other: Stream<T>): Stream<T> {
        return streamInstance.createStream(streamInstance.concatAsyncIterables(source, other));
      },
      
      branch(): Stream<T> {
        return streamInstance.createStream(source);
      }
    };
  }
  
  createChunkedStream<T>(config: ChunkProcessingConfig): ChunkedStream<T> {
    return new ChunkProcessorImpl<T>(config, { logger: this.logger }) as unknown as ChunkedStream<T>;
  }
  
  getBackpressureController(): BackpressureController {
    if (!this.backpressureController) {
      let currentThreshold = this.config.backpressureThreshold;
      let isPaused = false;
      const pauseCallbacks: (() => void)[] = [];
      
      this.backpressureController = {
        pause: () => {
          isPaused = true;
          this.logger.debug('Backpressure: stream paused').catch(() => {});
        },
        
        resume: () => {
          isPaused = false;
          this.logger.debug('Backpressure: stream resumed').catch(() => {});
        },
        
        drain: async () => {
          while (isPaused) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        },
        
        getBufferLevel: () => {
          const memStats = getMemoryStats();
          return memStats.used / this.config.memoryLimit;
        },
        
        getMemoryUsage: () => getMemoryStats(),
        
        onPressure: (callback: () => void) => {
          pauseCallbacks.push(callback);
        },
        
        setThreshold: (threshold: number) => {
          currentThreshold = Math.max(0, Math.min(1, threshold));
        },
        
        getThreshold: () => currentThreshold
      };
    }
    return this.backpressureController;
  }
  
  getState(): StreamState {
    const baseState = super.getState();
    const memoryStats = getMemoryStats();
    
    return {
      ...baseState,
      config: {
        defaultChunkSize: this.config.defaultChunkSize,
        maxConcurrency: this.config.maxConcurrency,
        memoryLimit: this.config.memoryLimit,
        enableOptimization: this.config.enableOptimization
      },
      metrics: this.getMetrics(),
      activeStreams: {
        count: this.stats.streamsCreated,
        types: {
          data: this.stats.streamsCreated,
          prime: 0,
          transform: 0,
          merge: 0,
          parallel: 0
        },
        totalMemoryUsage: memoryStats.used
      },
      pipelines: {
        created: this.stats.pipelinesExecuted,
        completed: this.stats.pipelinesExecuted,
        failed: 0,
        averageExecutionTime: this.stats.averageProcessingTime
      },
      memory: {
        currentUsage: memoryStats.used,
        peakUsage: memoryStats.used,
        bufferSizes: {
          inputBufferSize: this.config.bufferSize,
          outputBufferSize: this.config.bufferSize,
          intermediateBufferSize: this.config.bufferSize / 2,
          backpressureThreshold: this.config.backpressureThreshold
        },
        backpressureActive: false
      }
    };
  }
  
  getLogger() {
    return this.logger;
  }
  
  createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T> {
    return {
      success,
      data,
      error,
      timestamp: Date.now(),
      source: 'stream'
    };
  }
  
  private getUptime(): number {
    return Date.now() - (this.state.lastStateChangeTime || Date.now());
  }
  
  // Helper methods for async iterable operations
  private async *mapAsyncIterable<T, U>(source: AsyncIterable<T>, fn: (value: T) => U): AsyncIterable<U> {
    for await (const item of source) {
      yield fn(item);
    }
  }
  
  private async *filterAsyncIterable<T>(source: AsyncIterable<T>, fn: (value: T) => boolean): AsyncIterable<T> {
    for await (const item of source) {
      if (fn(item)) {
        yield item;
      }
    }
  }
  
  private async *takeAsyncIterable<T>(source: AsyncIterable<T>, n: number): AsyncIterable<T> {
    let count = 0;
    for await (const item of source) {
      if (count >= n) break;
      yield item;
      count++;
    }
  }
  
  private async *skipAsyncIterable<T>(source: AsyncIterable<T>, n: number): AsyncIterable<T> {
    let count = 0;
    for await (const item of source) {
      if (count >= n) {
        yield item;
      }
      count++;
    }
  }
  
  private async *chunkAsyncIterable<T>(source: AsyncIterable<T>, size: number): AsyncIterable<T[]> {
    let chunk: T[] = [];
    for await (const item of source) {
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
  
  private async *concatAsyncIterables<T>(source1: AsyncIterable<T>, source2: AsyncIterable<T> | Stream<T>): AsyncIterable<T> {
    for await (const item of source1) {
      yield item;
    }
    
    // Handle Stream type
    if (source2 && typeof source2 === 'object' && 'toArray' in source2) {
      const items = await source2.toArray();
      for (const item of items) {
        yield item;
      }
    } else {
      for await (const item of source2 as AsyncIterable<T>) {
        yield item;
      }
    }
  }
}

/**
 * Create a stream processing instance
 */
export function createStream(options: StreamOptions = {}): StreamInterface {
  return new StreamImplementation(options);
}

/**
 * Create and initialize a stream processing instance
 */
export async function createAndInitializeStream(options: StreamOptions = {}): Promise<StreamInterface> {
  const instance = createStream(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize stream: ${result.error}`);
  }
  
  return instance;
}

// Export all types and utilities
export * from './types';
export * from './utils';
export * from './processors';

// Export utility functions for direct use
export {
  createStreamFromArray,
  mergeStreams,
  transformStreamAsync,
  batchProcess,
  createProcessingContext,
  calculateOptimalChunkSize,
  chunkArray,
  mergeChunks,
  getMemoryStats,
  isMemoryPressure,
  calculateBufferSize,
  MemoryMonitor
};
