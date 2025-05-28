/**
 * Pipeline Processor Implementation
 * ================================
 * 
 * Implements composable transformation pipelines with error handling and parallel processing.
 */

import {
  StreamPipeline,
  PipelineResult,
  PipelineMetrics,
  BackpressureController,
  StreamOptimizer,
  TransformFunction,
  AsyncTransformFunction,
  FilterFunction,
  ReduceFunction,
  SinkFunction,
  ErrorHandler,
  ProgressCallback,
  ErrorCallback,
  PipelineError
} from '../types';

/**
 * Helper to create an async iterable from a generator function
 */
function createAsyncIterableFromGenerator<T>(generator: () => AsyncGenerator<T>): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]: generator
  };
}

/**
 * Pipeline stage configuration
 */
interface PipelineStage<T, R> {
  type: 'source' | 'transform' | 'asyncTransform' | 'filter' | 'batch' | 'parallel' | 'sink' | 'catch' | 'retry' | 'timeout';
  operation: any;
  name?: string;
}

/**
 * Implementation of stream transformation pipeline
 */
export class StreamPipelineImpl<T, R> implements StreamPipeline<T, R> {
  private stages: PipelineStage<any, any>[] = [];
  private sourceData?: AsyncIterable<T>;
  private config: {
    id: string;
    maxConcurrency: number;
    retryAttempts: number;
    retryDelay: number;
    timeoutMs: number;
  };
  private backpressureController?: BackpressureController;
  private optimizer?: StreamOptimizer;
  private logger?: any;
  private progressCallback?: ProgressCallback;
  private errorCallback?: ErrorCallback;
  private errorHandler?: ErrorHandler<any>;
  private capturedErrors: PipelineError[] = [];
  private stats = {
    stagesExecuted: 0,
    itemsProcessed: 0,
    errors: 0,
    totalTime: 0
  };
  
  constructor(config: {
    id: string;
    maxConcurrency: number;
    retryAttempts: number;
    retryDelay: number;
    timeoutMs: number;
    backpressureController?: BackpressureController;
    optimizer?: StreamOptimizer;
    logger?: any;
  }) {
    this.config = {
      id: config.id,
      maxConcurrency: config.maxConcurrency,
      retryAttempts: config.retryAttempts,
      retryDelay: config.retryDelay,
      timeoutMs: config.timeoutMs
    };
    this.backpressureController = config.backpressureController;
    this.optimizer = config.optimizer;
    this.logger = config.logger;
  }
  
  source(input: AsyncIterable<T>): StreamPipeline<T, T> {
    this.sourceData = input;
    this.stages.push({
      type: 'source',
      operation: input,
      name: 'source'
    });
    return this as any;
  }
  
  transform<U>(fn: TransformFunction<T, U>): StreamPipeline<T, U> {
    this.stages.push({
      type: 'transform',
      operation: fn,
      name: 'transform'
    });
    return this as any;
  }
  
  asyncTransform<U>(fn: AsyncTransformFunction<T, U>): StreamPipeline<T, U> {
    this.stages.push({
      type: 'asyncTransform',
      operation: fn,
      name: 'asyncTransform'
    });
    return this as any;
  }
  
  filter(predicate: FilterFunction<T>): StreamPipeline<T, T> {
    this.stages.push({
      type: 'filter',
      operation: predicate,
      name: 'filter'
    });
    return this as any;
  }
  
  batch(size: number): StreamPipeline<T, T[]> {
    this.stages.push({
      type: 'batch',
      operation: size,
      name: 'batch'
    });
    return this as any;
  }
  
  parallel(concurrency: number): StreamPipeline<T, T> {
    this.stages.push({
      type: 'parallel',
      operation: concurrency,
      name: 'parallel'
    });
    return this as any;
  }
  
  distribute(partitionFn: (value: T) => number): StreamPipeline<T, T> {
    // For simplicity, treat as parallel processing
    this.stages.push({
      type: 'parallel',
      operation: this.config.maxConcurrency,
      name: 'distribute'
    });
    return this as any;
  }
  
  catch(handler: ErrorHandler<T>): StreamPipeline<T, T> {
    // Store error handler for processing
    this.errorHandler = handler;
    this.stages.push({
      type: 'catch',
      operation: handler,
      name: 'catch'
    });
    return this as any;
  }
  
  retry(attempts: number, delay: number): StreamPipeline<T, T> {
    // Configure retry settings and add retry stage
    this.config.retryAttempts = attempts;
    this.config.retryDelay = delay;
    this.stages.push({
      type: 'retry',
      operation: { attempts, delay },
      name: 'retry'
    });
    return this as any;
  }
  
  timeout(ms: number): StreamPipeline<T, T> {
    this.config.timeoutMs = ms;
    this.stages.push({
      type: 'timeout',
      operation: ms,
      name: 'timeout'
    });
    return this as any;
  }
  
  async sink(output: SinkFunction<R>): Promise<PipelineResult> {
    this.stages.push({
      type: 'sink',
      operation: output,
      name: 'sink'
    });
    
    return this.executePipeline();
  }
  
  async collect(): Promise<R[]> {
    const results: R[] = [];
    
    await this.sink(async (item: R) => {
      results.push(item);
    });
    
    return results;
  }
  
  async reduce<U>(fn: ReduceFunction<R, U>, initial: U): Promise<U> {
    let accumulator = initial;
    
    await this.sink(async (item: R) => {
      accumulator = fn(accumulator, item);
    });
    
    return accumulator;
  }
  
  onProgress(callback: ProgressCallback): StreamPipeline<T, R> {
    this.progressCallback = callback;
    return this;
  }
  
  onError(callback: ErrorCallback): StreamPipeline<T, R> {
    this.errorCallback = callback;
    return this;
  }
  
  async execute(): Promise<AsyncIterable<R>> {
    if (!this.sourceData) {
      throw new PipelineError('No source data provided', 'source', 0);
    }
    
    return this.createPipelineIterable();
  }
  
  private async executePipeline(): Promise<PipelineResult> {
    const startTime = performance.now();
    const errors: PipelineError[] = [];
    const warnings: string[] = [];
    let itemsProcessed = 0;
    
    try {
      if (!this.sourceData) {
        throw new PipelineError('No source data provided', 'source', 0);
      }
      
      if (this.logger) {
        await this.logger.debug('Starting pipeline execution', {
          pipelineId: this.config.id,
          stageCount: this.stages.length
        });
      }
      
      // Execute pipeline stages
      let currentData: AsyncIterable<any> = this.sourceData;
      
      for (let i = 0; i < this.stages.length; i++) {
        const stage = this.stages[i];
        
        try {
          currentData = await this.executeStage(currentData, stage, i);
          this.stats.stagesExecuted++;
        } catch (error) {
          const pipelineError = new PipelineError(
            `Stage ${i} (${stage.name}) failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            stage.name || 'unknown',
            i
          );
          errors.push(pipelineError);
          
          if (this.errorCallback) {
            this.errorCallback(pipelineError);
          }
          
          // Continue with error tolerance
          if (errors.length > this.config.retryAttempts) {
            throw pipelineError;
          }
        }
      }
      
      // Count processed items
      for await (const item of currentData) {
        itemsProcessed++;
        if (this.progressCallback) {
          this.progressCallback({
            processed: itemsProcessed,
            percentage: undefined // Unknown total
          });
        }
      }
      
      const executionTime = performance.now() - startTime;
      this.stats.totalTime = executionTime;
      this.stats.itemsProcessed = itemsProcessed;
      
      // Include captured errors from error callback
      errors.push(...this.capturedErrors);
      
      const metrics: PipelineMetrics = {
        throughput: itemsProcessed / (executionTime / 1000),
        latency: executionTime / itemsProcessed,
        memoryPeak: 0, // Would need to track this
        errorRate: errors.length / this.stages.length,
        backpressureEvents: 0, // Would need to track this
        stageMetrics: []
      };
      
      if (this.logger) {
        await this.logger.debug('Pipeline execution completed', {
          pipelineId: this.config.id,
          itemsProcessed,
          executionTime,
          errors: errors.length
        });
      }
      
      return {
        success: errors.length === 0,
        itemsProcessed,
        executionTime,
        memoryUsed: 0, // Would need to track this
        errors,
        warnings,
        metrics
      };
      
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      if (this.logger) {
        await this.logger.error('Pipeline execution failed', {
          pipelineId: this.config.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      return {
        success: false,
        itemsProcessed,
        executionTime,
        memoryUsed: 0,
        errors: [
          new PipelineError(
            error instanceof Error ? error.message : 'Pipeline execution failed',
            'pipeline',
            -1
          )
        ],
        warnings,
        metrics: {
          throughput: 0,
          latency: 0,
          memoryPeak: 0,
          errorRate: 1,
          backpressureEvents: 0,
          stageMetrics: []
        }
      };
    }
  }
  
  private async executeStage(
    input: AsyncIterable<any>,
    stage: PipelineStage<any, any>,
    index: number
  ): Promise<AsyncIterable<any>> {
    const self = this;
    
    switch (stage.type) {
      case 'source':
        return input;
        
      case 'transform':
        return createAsyncIterableFromGenerator(async function* () {
          for await (const item of input) {
            let result = item;
            let attempts = 0;
            let lastError: Error | undefined;
            const maxRetries = self.config.retryAttempts;
            
            while (attempts <= maxRetries) {
              try {
                result = stage.operation(result);
                yield result;
                break; // Success, move to next item
              } catch (error) {
                lastError = error as Error;
                attempts++;
                
                if (attempts <= maxRetries) {
                  // Wait before retrying
                  await new Promise(resolve => setTimeout(resolve, self.config.retryDelay));
                  // Reset result for retry
                  result = item;
                } else {
                  // All attempts exhausted - always call error callback first
                  if (self.errorCallback) {
                    const pipelineError = new PipelineError(
                      lastError.message,
                      'transform',
                      index
                    );
                    self.capturedErrors.push(pipelineError);
                    self.errorCallback(pipelineError);
                  }
                  
                  // Then handle the error through error handler or rethrow
                  if (self.errorHandler) {
                    yield self.errorHandler(lastError, item);
                  } else {
                    throw lastError;
                  }
                }
              }
            }
          }
        });
        
      case 'asyncTransform':
        return createAsyncIterableFromGenerator(async function* () {
          for await (const item of input) {
            let result = item;
            let attempts = 0;
            let lastError: Error | undefined;
            const maxRetries = self.config.retryAttempts;
            
            while (attempts <= maxRetries) {
              try {
                // Apply timeout if configured
                if (self.config.timeoutMs > 0) {
                  result = await Promise.race([
                    stage.operation(result),
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Operation timed out')), self.config.timeoutMs)
                    )
                  ]);
                } else {
                  result = await stage.operation(result);
                }
                yield result;
                break; // Success, move to next item
              } catch (error) {
                lastError = error as Error;
                attempts++;
                
                if (attempts <= maxRetries) {
                  // Wait before retrying
                  await new Promise(resolve => setTimeout(resolve, self.config.retryDelay));
                  // Reset result for retry
                  result = item;
                } else {
                  // All attempts exhausted - always call error callback first
                  if (self.errorCallback) {
                    const pipelineError = new PipelineError(
                      lastError.message,
                      'asyncTransform',
                      index
                    );
                    self.capturedErrors.push(pipelineError);
                    self.errorCallback(pipelineError);
                  }
                  
                  // Then handle the error through error handler or rethrow
                  if (self.errorHandler) {
                    yield self.errorHandler(lastError, item);
                  } else {
                    throw lastError;
                  }
                }
              }
            }
          }
        });
        
      case 'filter':
        return createAsyncIterableFromGenerator(async function* () {
          for await (const item of input) {
            try {
              if (stage.operation(item)) {
                yield item;
              }
            } catch (error) {
              // Always call error callback first
              if (self.errorCallback) {
                const pipelineError = new PipelineError(
                  error instanceof Error ? error.message : 'Filter error',
                  'filter',
                  index
                );
                self.capturedErrors.push(pipelineError);
                self.errorCallback(pipelineError);
              }
              
              // Then handle the error through error handler or rethrow
              if (self.errorHandler) {
                const result = self.errorHandler(error as Error, item);
                if (result !== undefined) {
                  yield result;
                }
              } else {
                throw error;
              }
            }
          }
        });
        
      case 'batch':
        return createAsyncIterableFromGenerator(async function* () {
          let batch: any[] = [];
          for await (const item of input) {
            batch.push(item);
            if (batch.length >= stage.operation) {
              yield [...batch];
              batch = [];
            }
          }
          if (batch.length > 0) {
            yield batch;
          }
        });
        
      case 'parallel':
        // Simplified parallel processing
        return createAsyncIterableFromGenerator(async function* () {
          const buffer: any[] = [];
          let count = 0;
          
          for await (const item of input) {
            buffer.push(item);
            count++;
            
            if (count >= stage.operation) {
              for (const bufferedItem of buffer) {
                yield bufferedItem;
              }
              buffer.length = 0;
              count = 0;
            }
          }
          
          for (const bufferedItem of buffer) {
            yield bufferedItem;
          }
        });
        
      case 'catch':
        // Error handling is done inline in other stages
        return input;
        
      case 'retry':
        // Retry is handled in the transform stages themselves
        return input;
        
      case 'timeout':
        return createAsyncIterableFromGenerator(async function* () {
          for await (const item of input) {
            try {
              // For timeout stage, we simulate timeout behavior
              const result = await Promise.race([
                Promise.resolve(item),
                new Promise<never>((_, reject) => 
                  setTimeout(() => reject(new Error('Operation timed out')), stage.operation)
                )
              ]);
              yield result;
            } catch (error) {
              // Always call error callback first
              if (self.errorCallback) {
                const pipelineError = new PipelineError(
                  error instanceof Error ? error.message : 'Timeout error',
                  'timeout',
                  index
                );
                self.capturedErrors.push(pipelineError);
                self.errorCallback(pipelineError);
              }
              
              // Then handle the error through error handler or rethrow
              if (self.errorHandler) {
                yield self.errorHandler(error as Error, item);
              } else {
                throw error;
              }
            }
          }
        });
        
      case 'sink':
        return createAsyncIterableFromGenerator(async function* () {
          for await (const item of input) {
            try {
              await stage.operation(item);
              yield item; // Pass through for potential chaining
            } catch (error) {
              // Always call error callback first
              if (self.errorCallback) {
                const pipelineError = new PipelineError(
                  error instanceof Error ? error.message : 'Sink error',
                  'sink',
                  index
                );
                self.capturedErrors.push(pipelineError);
                self.errorCallback(pipelineError);
              }
              
              // Then handle the error through error handler or rethrow
              if (self.errorHandler) {
                yield self.errorHandler(error as Error, item);
              } else {
                throw error;
              }
            }
          }
        });
        
      default:
        throw new PipelineError(`Unknown stage type: ${stage.type}`, stage.name || 'unknown', index);
    }
  }
  
  private async createPipelineIterable(): Promise<AsyncIterable<R>> {
    if (!this.sourceData) {
      throw new PipelineError('No source data provided', 'source', 0);
    }
    
    let currentData: AsyncIterable<any> = this.sourceData;
    
    for (let i = 0; i < this.stages.length; i++) {
      const stage = this.stages[i];
      currentData = await this.executeStage(currentData, stage, i);
    }
    
    return currentData as AsyncIterable<R>;
  }
  
  async terminate(): Promise<void> {
    // Clean up resources
    this.stages = [];
    this.sourceData = undefined;
    
    if (this.logger) {
      await this.logger.debug('Pipeline terminated', {
        pipelineId: this.config.id,
        stats: this.stats
      });
    }
  }
}
