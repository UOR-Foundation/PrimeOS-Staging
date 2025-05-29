/**
 * Stream Processing Types
 * ======================
 * 
 * Type definitions for the stream processing module implementing Axiom 4:
 * "High-throughput streaming primitives for efficient data handling"
 * 
 * Based on mathematical principles of data flow composition with
 * memory-optimized chunk processing and backpressure management.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState,
  ModelLifecycleState
} from '../../os/model/types';
import { Factor } from '../prime/types';
import { DecodedChunk, EncodingInterface } from '../encoding';
import { PrimeRegistryInterface } from '../prime';

// Forward declaration for bands interface
export interface BandsInterface {
  // Will be fully defined in bands module
  [key: string]: any;
}

/**
 * Input for stream processing operations
 */
export interface StreamProcessInput {
  operation: 'createStream' | 'processChunkedStream' | 'createPipeline' | 
            'getMetrics' | 'optimizePerformance' | 'createPrimeStreamProcessor' |
            'createEncodingStreamBridge' | 'getMemoryUsage' | 'configure';
  
  // Parameters for different operations
  source?: AsyncIterable<any>;
  input?: AsyncIterable<any>;
  processor?: ChunkProcessor<any>;
  options?: Partial<StreamOptions>;
  config?: ChunkProcessingConfig;
}

/**
 * Generic stream interface for working with sequences of values
 */
export interface Stream<T> {
  // Async iterator protocol
  [Symbol.asyncIterator](): AsyncIterator<T>;
  // Iterator protocol
  [Symbol.iterator](): Iterator<T>;
  next(): IteratorResult<T>;
  
  // Transformation methods
  map<U>(fn: (value: T) => U): Stream<U>;
  filter(fn: (value: T) => boolean): Stream<T>;
  take(n: number): Stream<T>;
  skip(n: number): Stream<T>;
  chunk(size: number): Stream<T[]>;
  parallel(concurrency: number): Stream<T>;
  
  // Consumption methods
  reduce<U>(fn: (acc: U, value: T) => U, initial: U): Promise<U>;
  forEach(fn: (value: T) => void): Promise<void>;
  toArray(): Promise<T[]>;
  
  // Stream management
  getBuffer?(): T[];
  concat(other: Stream<T>): Stream<T>;
  branch(): Stream<T>;
  
  // Flow control
  pause?(): void;
  resume?(): void;
  drain?(): Promise<void>;
}

/**
 * Chunked stream interface for memory-efficient processing
 */
export interface ChunkedStream<T> {
  chunkSize: number;
  processChunk(chunk: T[]): Promise<T[]>;
  flush(): Promise<T[]>;
  
  // Memory management
  getMemoryUsage(): number;
  shouldApplyBackpressure(): boolean;
  
  // Configuration
  setChunkSize(size: number): void;
  getChunkSize(): number;
}

/**
 * Chunk processing configuration
 */
export interface ChunkProcessingConfig {
  chunkSize: number;
  maxBufferSize: number;
  enableBackpressure: boolean;
  backpressureThreshold: number;
  errorTolerance: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Processing context for chunk operations
 */
export interface ProcessingContext<T> {
  index: number;
  totalChunks: number;
  previousResult?: T[];
  metadata: Map<string, any>;
  
  // Performance tracking
  startTime: number;
  processingTime: number;
  memoryUsed: number;
}

/**
 * Data stream types
 */
export enum StreamType {
  DATA = 'data',
  PRIME = 'prime',
  TRANSFORM = 'transform',
  MERGE = 'merge',
  PARALLEL = 'parallel'
}

/**
 * Prime-encoded stream processor
 */
export interface PrimeStreamProcessor {
  // Core stream processing
  processPrimeStream(chunks: AsyncIterable<bigint>): Promise<ProcessedChunk[]>;
  
  // Factorization streaming
  streamFactorization(numbers: AsyncIterable<bigint>): Promise<AsyncIterable<Factor[]>>;
  
  // Integrity verification streaming
  verifyStreamIntegrity(chunks: AsyncIterable<bigint>): Promise<VerificationResult[]>;
  
  // Configuration
  configure(options: PrimeStreamOptions): void;
  getMetrics(): PrimeStreamMetrics;
}

/**
 * Prime stream configuration
 */
export interface PrimeStreamOptions {
  chunkSize: number;
  maxConcurrency: number;
  enableIntegrityCheck: boolean;
  factorizationStrategy: 'parallel' | 'sequential' | 'adaptive';
  memoryLimit: number;
}

/**
 * Prime stream metrics
 */
export interface PrimeStreamMetrics {
  chunksProcessed: number;
  numbersFactorized: number;
  integrityChecksPerformed: number;
  averageProcessingTime: number;
  memoryUsage: number;
  errorRate: number;
}

/**
 * Processed chunk result
 */
export interface ProcessedChunk {
  originalChunk: bigint;
  decodedData: DecodedChunk;
  processingTime: number;
  verified: boolean;
  errors: string[];
}

/**
 * Verification result for integrity checking
 */
export interface VerificationResult {
  chunk: bigint;
  valid: boolean;
  checksum: bigint;
  errors: string[];
  verificationTime: number;
}

/**
 * Encoding stream bridge for integration
 */
export interface EncodingStreamBridge {
  // Text streaming
  encodeTextStream(text: AsyncIterable<string>): AsyncIterable<bigint>;
  decodeTextStream(chunks: AsyncIterable<bigint>): AsyncIterable<string>;
  
  // Chunk streaming
  decodeChunkStream(chunks: AsyncIterable<bigint>): AsyncIterable<DecodedChunk>;
  
  // Program execution streaming
  executeStreamingProgram(chunks: AsyncIterable<bigint>): AsyncIterable<string>;
  
  // Configuration
  configure(encodingModule: EncodingInterface): void;
}

/**
 * Pipeline builder interface
 */
export interface StreamPipeline<T, R> {
  // Pipeline construction
  source(input: AsyncIterable<T>): StreamPipeline<T, T>;
  transform<U>(fn: TransformFunction<T, U>): StreamPipeline<T, U>;
  asyncTransform<U>(fn: AsyncTransformFunction<T, U>): StreamPipeline<T, U>;
  filter(predicate: FilterFunction<T>): StreamPipeline<T, T>;
  batch(size: number): StreamPipeline<T, T[]>;
  
  // Parallel processing
  parallel(concurrency: number): StreamPipeline<T, T>;
  distribute(partitionFn: (value: T) => number): StreamPipeline<T, T>;
  
  // Error handling
  catch(handler: ErrorHandler<T>): StreamPipeline<T, T>;
  retry(attempts: number, delay: number): StreamPipeline<T, T>;
  timeout(ms: number): StreamPipeline<T, T>;
  
  // Output
  sink(output: SinkFunction<R>): Promise<PipelineResult>;
  collect(): Promise<R[]>;
  reduce<U>(fn: ReduceFunction<R, U>, initial: U): Promise<U>;
  
  // Monitoring
  onProgress(callback: ProgressCallback): StreamPipeline<T, R>;
  onError(callback: ErrorCallback): StreamPipeline<T, R>;
  
  // Execution
  execute(): Promise<AsyncIterable<R>>;
}

/**
 * Pipeline error type
 */
export interface PipelineError {
  stage: string;
  message: string;
  timestamp: number;
  context?: any;
}

/**
 * Pipeline result with metrics
 */
export interface PipelineResult {
  success: boolean;
  itemsProcessed: number;
  executionTime: number;
  memoryUsed: number;
  errors: PipelineError[];
  warnings: string[];
  metrics: PipelineMetrics;
}

/**
 * Pipeline performance metrics
 */
export interface PipelineMetrics {
  throughput: number;          // Items per second
  latency: number;            // Average processing time per item
  memoryPeak: number;         // Peak memory usage
  errorRate: number;          // Percentage of failed items
  backpressureEvents: number; // Count of backpressure activations
  stageMetrics: StageMetrics[]; // Per-stage performance
}

/**
 * Stage-specific metrics
 */
export interface StageMetrics {
  stageName: string;
  itemsProcessed: number;
  averageTime: number;
  errors: number;
  memoryUsed: number;
}

/**
 * Memory management configuration
 */
export interface StreamMemoryConfig {
  maxBufferSize: number;        // Maximum buffer size in bytes
  chunkSize: number;           // Processing chunk size
  backpressureThreshold: number; // Trigger backpressure at this level
  gcInterval: number;          // Garbage collection hints
  memoryLimit: number;         // Hard memory limit
}

/**
 * Backpressure controller
 */
export interface BackpressureController {
  // Flow control
  pause(): void;
  resume(): void;
  drain(): Promise<void>;
  
  // Monitoring
  getBufferLevel(): number;
  getMemoryUsage(): MemoryStats | undefined;
  onPressure(callback: () => void): void;
  
  // Configuration
  setThreshold(threshold: number): void;
  getThreshold(): number;
}

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  used: number;              // Currently used memory
  available: number;         // Available memory
  total: number;            // Total system memory
  bufferSize: number;       // Current buffer size
  gcCollections: number;    // Garbage collection count
  rss?: number;             // Resident set size (Node.js)
  external?: number;        // External memory (Node.js)
  limit?: number;           // Memory limit (browser)
}

/**
 * Performance monitoring interface
 */
export interface StreamPerformanceMetrics {
  throughput: number;         // Items per second
  latency: number;           // Average processing latency
  memoryUsage: number;       // Current memory consumption
  errorRate: number;         // Percentage of failed operations
  backpressureEvents: number; // Count of backpressure activations
  
  // Advanced metrics
  cacheHitRate: number;      // Cache efficiency
  networkLatency?: number;   // Network latency if applicable
  cpuUsage: number;         // CPU utilization
  ioWaitTime: number;       // I/O wait time
}

/**
 * Stream optimizer interface
 */
export interface StreamOptimizer {
  // Adaptive processing
  adaptChunkSize(metrics: StreamPerformanceMetrics): number;
  optimizeConcurrency(metrics: StreamPerformanceMetrics): number;
  adjustBufferSizes(metrics: StreamPerformanceMetrics): BufferConfig;
  
  // Performance tuning
  enableProfiling(): void;
  disableProfiling(): void;
  getPerformanceReport(): PerformanceReport;
  suggestOptimizations(): OptimizationSuggestion[];
  
  // Configuration
  setOptimizationStrategy(strategy: OptimizationStrategy): void;
  getOptimizationStrategy(): OptimizationStrategy;
}

/**
 * Buffer configuration
 */
export interface BufferConfig {
  inputBufferSize: number;
  outputBufferSize: number;
  intermediateBufferSize: number;
  backpressureThreshold: number;
}

/**
 * Performance report
 */
export interface PerformanceReport {
  summary: {
    averageThroughput: number;
    peakThroughput: number;
    averageLatency: number;
    errorRate: number;
  };
  bottlenecks: BottleneckAnalysis[];
  recommendations: string[];
  historicalTrends: PerformanceHistory[];
}

/**
 * Bottleneck analysis
 */
export interface BottleneckAnalysis {
  stage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number; // Performance impact percentage
  suggestedFix: string;
}

/**
 * Performance history entry
 */
export interface PerformanceHistory {
  timestamp: number;
  metrics: StreamPerformanceMetrics;
  configuration: Record<string, any>;
}

/**
 * Optimization strategy
 */
export enum OptimizationStrategy {
  THROUGHPUT = 'throughput',    // Maximize items per second
  LATENCY = 'latency',         // Minimize processing delay
  MEMORY = 'memory',           // Minimize memory usage
  BALANCED = 'balanced',       // Balance all metrics
  CUSTOM = 'custom'            // User-defined strategy
}

/**
 * Optimization suggestion
 */
export interface OptimizationSuggestion {
  type: 'configuration' | 'algorithm' | 'resource';
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImprovement: number; // Percentage improvement
  implementation: string;
}

/**
 * Stream processing options
 */
export interface StreamOptions extends ModelOptions {
  // Processing configuration
  defaultChunkSize?: number;           // Default chunk size for processing
  maxConcurrency?: number;            // Maximum parallel operations
  memoryLimit?: number;               // Memory usage limit in bytes
  
  // Performance tuning
  enableOptimization?: boolean;       // Enable automatic optimization
  metricsInterval?: number;          // Metrics collection interval
  profilingEnabled?: boolean;        // Enable performance profiling
  optimizationStrategy?: OptimizationStrategy; // Optimization approach
  
  // Error handling
  retryAttempts?: number;            // Default retry attempts
  retryDelay?: number;               // Delay between retries
  errorTolerance?: number;           // Acceptable error rate percentage
  timeoutMs?: number;                // Operation timeout
  
  // Backpressure management
  enableBackpressure?: boolean;      // Enable backpressure control
  backpressureThreshold?: number;    // Backpressure trigger threshold
  bufferSize?: number;               // Default buffer size
  
  // Integration
  encodingModule?: EncodingInterface; // Integration with encoding
  primeRegistry?: PrimeRegistryInterface; // Prime operations
  bandsOptimizer?: BandsInterface;   // Band optimization
}

/**
 * Extended state for stream module
 */
export interface StreamState extends ModelState {
  // Configuration
  config: {
    defaultChunkSize: number;
    maxConcurrency: number;
    memoryLimit: number;
    enableOptimization: boolean;
  };
  
  // Performance metrics
  metrics: StreamPerformanceMetrics;
  
  // Active streams
  activeStreams: {
    count: number;
    types: Record<StreamType, number>;
    totalMemoryUsage: number;
  };
  
  // Pipeline statistics
  pipelines: {
    created: number;
    completed: number;
    failed: number;
    averageExecutionTime: number;
  };
  
  // Memory management
  memory: {
    currentUsage: number;
    peakUsage: number;
    bufferSizes: BufferConfig;
    backpressureActive: boolean;
  };
}

/**
 * Core interface for stream functionality
 */
export interface StreamInterface extends ModelInterface {
  // Required createResult method from ModelInterface
  createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T>;
  
  // Core streaming operations
  processChunkedStream<T>(
    input: AsyncIterable<T>,
    processor: ChunkProcessor<T>
  ): Promise<AsyncIterable<T>>;
  
  createPipeline<T, R>(): StreamPipeline<T, R>;
  
  // Prime stream processing
  createPrimeStreamProcessor(): PrimeStreamProcessor;
  createEncodingStreamBridge(): EncodingStreamBridge;
  
  // Performance and monitoring
  getMetrics(): StreamPerformanceMetrics;
  getMemoryUsage(): MemoryStats;
  optimizePerformance(): Promise<OptimizationResult>;
  
  // Configuration
  configure(options: Partial<StreamOptions>): void;
  getConfiguration(): StreamOptions;
  
  // Stream management
  createStream<T>(source: AsyncIterable<T>): Stream<T>;
  createChunkedStream<T>(config: ChunkProcessingConfig): ChunkedStream<T>;
  
  // Backpressure management
  getBackpressureController(): BackpressureController;
  
  getLogger(): any;
  getState(): StreamState;
}

/**
 * Chunk processor interface
 */
export interface ChunkProcessor<T> {
  // Configuration
  config: ChunkProcessingConfig;
  
  // Processing operations
  processChunk(chunk: T[], context: ProcessingContext<T>): Promise<T[]>;
  flush(): Promise<T[]>;
  
  // Memory management
  getMemoryUsage(): number;
  shouldApplyBackpressure(): boolean;
  
  // Error handling
  handleProcessingError(error: Error, chunk: T[]): T[] | null;
  
  // Lifecycle
  initialize(): Promise<void>;
  terminate(): Promise<void>;
}

/**
 * High-throughput processor
 */
export interface HighThroughputProcessor {
  processStream<T>(
    input: AsyncIterable<T>,
    config: OptimizationConfig
  ): Promise<ProcessingMetrics>;
  
  // Performance optimization
  enableTurboMode(): void;
  optimizeForThroughput(): Promise<void>;
  optimizeForLatency(): Promise<void>;
  
  // Monitoring
  getPerformanceMetrics(): StreamPerformanceMetrics;
  getBottlenecks(): BottleneckAnalysis[];
}

/**
 * Optimization configuration
 */
export interface OptimizationConfig {
  strategy: OptimizationStrategy;
  targetThroughput?: number;
  maxLatency?: number;
  memoryBudget?: number;
  adaptiveThresholds: boolean;
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  success: boolean;
  improvementPercentage: number;
  newConfiguration: Record<string, any>;
  benchmarkResults: BenchmarkResult[];
  recommendations: OptimizationSuggestion[];
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  testName: string;
  beforeMetrics: StreamPerformanceMetrics;
  afterMetrics: StreamPerformanceMetrics;
  improvement: number;
}

/**
 * Processing metrics result
 */
export interface ProcessingMetrics {
  totalItems: number;
  processingTime: number;
  throughput: number;
  errorCount: number;
  memoryUsage: MemoryStats;
  performanceMetrics: StreamPerformanceMetrics;
}

/**
 * Function type definitions
 */
export type TransformFunction<T, U> = (input: T) => U;
export type AsyncTransformFunction<T, U> = (input: T) => Promise<U>;
export type FilterFunction<T> = (input: T) => boolean;
export type ReduceFunction<T, U> = (accumulator: U, current: T) => U;
export type SinkFunction<T> = (input: T) => Promise<void>;
export type ErrorHandler<T> = (error: Error, input: T) => T | null;

/**
 * Callback type definitions
 */
export type ProgressCallback = (progress: { processed: number; total?: number; percentage?: number }) => void;
export type ErrorCallback = (error: StreamProcessingError) => void;

/**
 * Result type for stream operations
 */
export type StreamResult<T = unknown> = ModelResult<T>;

/**
 * Error types for stream processing
 */
export class StreamProcessingError extends Error {
  constructor(message: string, public stage?: string, public context?: any) {
    super(message);
    this.name = 'StreamProcessingError';
  }
}

export class BackpressureError extends StreamProcessingError {
  constructor(message: string, public memoryUsage: number, public threshold: number) {
    super(message, 'backpressure');
    this.name = 'BackpressureError';
  }
}

export class PipelineError extends StreamProcessingError {
  constructor(message: string, public pipelineStage: string, public stageIndex: number) {
    super(message, pipelineStage);
    this.name = 'PipelineError';
  }
}

export class ChunkProcessingError extends StreamProcessingError {
  constructor(message: string, public chunkIndex: number, public chunkData?: any) {
    super(message, 'chunk_processing', { chunkIndex, chunkData });
    this.name = 'ChunkProcessingError';
  }
}

export class MemoryLimitError extends StreamProcessingError {
  constructor(message: string, public currentUsage: number, public limit: number) {
    super(message, 'memory_management');
    this.name = 'MemoryLimitError';
  }
}

export class OptimizationError extends StreamProcessingError {
  constructor(message: string, public optimizationType: string) {
    super(message, 'optimization');
    this.name = 'OptimizationError';
  }
}
