/**
 * Chunk Processor Implementation
 * =============================
 * 
 * Handles memory-efficient processing of data chunks with backpressure management.
 */

import {
  ChunkProcessor,
  ChunkProcessingConfig,
  ProcessingContext,
  BackpressureController,
  ChunkedStream
} from '../types';

import { calculateMemoryUsage } from '../utils';

/**
 * Default configuration for chunk processing
 */
const DEFAULT_CONFIG: ChunkProcessingConfig = {
  chunkSize: 1024,
  maxBufferSize: 8192,
  enableBackpressure: true,
  backpressureThreshold: 0.8,
  errorTolerance: 0.05,
  retryAttempts: 3,
  retryDelay: 1000
};

/**
 * Implementation of chunk processor with memory management
 */
export class ChunkProcessorImpl<T> implements ChunkProcessor<T> {
  public readonly config: ChunkProcessingConfig;
  private buffer: T[] = [];
  private backpressureController?: BackpressureController;
  private logger?: any;
  private stats = {
    chunksProcessed: 0,
    itemsProcessed: 0,
    errors: 0,
    retries: 0,
    totalProcessingTime: 0
  };
  
  constructor(
    config: Partial<ChunkProcessingConfig> = {},
    dependencies: {
      backpressureController?: BackpressureController;
      logger?: any;
    } = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.backpressureController = dependencies.backpressureController;
    this.logger = dependencies.logger;
  }
  
  get chunkSize(): number {
    return this.config.chunkSize;
  }
  
  async initialize(): Promise<void> {
    this.buffer = [];
    this.stats = {
      chunksProcessed: 0,
      itemsProcessed: 0,
      errors: 0,
      retries: 0,
      totalProcessingTime: 0
    };
    
    if (this.logger) {
      await this.logger.debug('ChunkProcessor initialized', { config: this.config });
    }
  }
  
  async processChunk(chunk: T[], context: ProcessingContext<T>): Promise<T[]> {
    const startTime = performance.now();
    
    try {
      // Validate chunk
      if (!Array.isArray(chunk)) {
        throw new Error('Invalid chunk: expected array');
      }
      
      // Check for backpressure
      if (this.shouldApplyBackpressure()) {
        if (this.backpressureController) {
          await this.backpressureController.drain();
        }
      }
      
      // Process the chunk (default is pass-through)
      const result = await this.processChunkData(chunk, context);
      
      // Update statistics
      this.stats.chunksProcessed++;
      this.stats.itemsProcessed += chunk.length;
      this.stats.totalProcessingTime += performance.now() - startTime;
      
      if (this.logger) {
        await this.logger.debug('Chunk processed successfully', {
          chunkIndex: context.index,
          itemCount: chunk.length,
          processingTime: performance.now() - startTime
        });
      }
      
      return result;
      
    } catch (error) {
      this.stats.errors++;
      
      if (this.logger) {
        await this.logger.error('Chunk processing failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          chunkIndex: context.index
        });
      }
      
      // Handle error based on tolerance
      const errorRate = this.stats.errors / this.stats.chunksProcessed;
      if (errorRate > this.config.errorTolerance) {
        throw error;
      }
      
      // Return processed chunk if possible
      return this.handleProcessingError(error as Error, chunk) || [];
    }
  }
  
  async flush(): Promise<T[]> {
    const flushedData = [...this.buffer];
    this.buffer = [];
    
    if (this.logger && flushedData.length > 0) {
      await this.logger.debug('Flushed buffer', { itemCount: flushedData.length });
    }
    
    return flushedData;
  }
  
  getMemoryUsage(): number {
    return calculateMemoryUsage() + this.estimateBufferSize();
  }
  
  shouldApplyBackpressure(): boolean {
    if (!this.config.enableBackpressure) {
      return false;
    }
    
    const memoryUsage = this.getMemoryUsage();
    const threshold = this.config.maxBufferSize * this.config.backpressureThreshold;
    
    return memoryUsage > threshold;
  }
  
  setChunkSize(size: number): void {
    if (size > 0) {
      (this.config as any).chunkSize = size;
    }
  }
  
  getChunkSize(): number {
    return this.config.chunkSize;
  }
  
  handleProcessingError(error: Error, chunk: T[]): T[] | null {
    if (this.logger) {
      this.logger.warn('Handling processing error', {
        error: error.message,
        chunkSize: chunk.length
      }).catch(() => {});
    }
    
    // Default error handling: skip the chunk
    return null;
  }
  
  async terminate(): Promise<void> {
    // Flush any remaining data
    await this.flush();
    
    if (this.logger) {
      await this.logger.debug('ChunkProcessor terminated', { stats: this.stats });
    }
  }
  
  /**
   * Override this method to implement custom chunk processing logic
   */
  protected async processChunkData(chunk: T[], context: ProcessingContext<T>): Promise<T[]> {
    // Default implementation: pass through
    return chunk;
  }
  
  private estimateBufferSize(): number {
    return this.buffer.length * 64; // Rough estimate: 64 bytes per item
  }
}

/**
 * Create a chunk processor with custom processing logic
 */
export function createChunkProcessor<T>(
  processingFunction: (chunk: T[], context: ProcessingContext<T>) => Promise<T[]>,
  config: Partial<ChunkProcessingConfig> = {},
  dependencies: {
    backpressureController?: BackpressureController;
    logger?: any;
  } = {}
): ChunkProcessor<T> {
  
  class CustomChunkProcessor extends ChunkProcessorImpl<T> {
    protected async processChunkData(chunk: T[], context: ProcessingContext<T>): Promise<T[]> {
      return processingFunction(chunk, context);
    }
  }
  
  return new CustomChunkProcessor(config, dependencies);
}
