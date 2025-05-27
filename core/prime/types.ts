/**
 * Prime Module Types
 * ==================
 * 
 * Type definitions for the prime foundation module, which implements
 * the first axiom of the UOR kernel: "All representation derives from prime numbers"
 */

import {
  ModelLifecycleState,
  ModelState
} from '../../os/model/types';

/**
 * Configuration options for the prime registry
 */
export interface PrimeRegistryOptions {
  /**
   * Initial primes to populate the registry
   */
  initialPrimes?: bigint[];
  
  /**
   * Number of primes to preload
   */
  preloadCount?: number;
  
  /**
   * Whether to use streaming operations
   */
  useStreaming?: boolean;
  
  /**
   * Size of chunks for streaming operations
   */
  streamChunkSize?: number;
  
  /**
   * Enable logging for debugging
   */
  enableLogs?: boolean;
  
  /**
   * Enable debug mode
   */
  debug?: boolean;
  
  /**
   * Module name
   */
  name?: string;
  
  /**
   * Module version
   */
  version?: string;
}

/**
 * Prime factor with exponent
 */
export interface Factor {
  /**
   * The prime number
   */
  prime: bigint;
  
  /**
   * How many times this prime appears in the factorization
   */
  exponent: number;
}

/**
 * Generic stream interface for working with sequences of values
 */
export interface Stream<T> {
  /**
   * Make the stream iterable
   */
  [Symbol.iterator](): Iterator<T>;
  
  /**
   * Get the next item in the stream
   */
  next(): IteratorResult<T>;
  
  /**
   * Transform each item in the stream
   */
  map<U>(fn: (value: T) => U): Stream<U>;
  
  /**
   * Filter the stream to only include items matching the predicate
   */
  filter(fn: (value: T) => boolean): Stream<T>;
  
  /**
   * Take the first n items from the stream
   */
  take(n: number): Stream<T>;
  
  /**
   * Skip the first n items in the stream
   */
  skip(n: number): Stream<T>;
  
  /**
   * Reduce the stream to a single value
   */
  reduce<U>(fn: (acc: U, value: T) => U, initial: U): Promise<U>;
  
  /**
   * Execute a function for each item in the stream
   */
  forEach(fn: (value: T) => void): Promise<void>;
  
  /**
   * Convert the stream to an array
   */
  toArray(): Promise<T[]>;
  
  /**
   * Get current buffer contents
   */
  getBuffer?(): T[];
  
  /**
   * Concatenate with another stream
   */
  concat(other: Stream<T>): Stream<T>;
  
  /**
   * Create a duplicate stream (useful for multi-pass processing)
   */
  branch(): Stream<T>;
}

/**
 * Chunk for streaming operations with large numbers
 */
export interface StreamingChunk {
  /**
   * Chunk data (either as BigInt or Uint8Array for binary representation)
   */
  data: bigint | Uint8Array;
  
  /**
   * Position in the overall stream
   */
  position: number;
  
  /**
   * Whether this is the final chunk
   */
  final: boolean;
  
  /**
   * Optional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Options for streaming operations
 */
export interface StreamingOptions {
  /**
   * Chunk size in bytes
   */
  chunkSize?: number;
  
  /**
   * Maximum number of concurrent operations
   */
  maxConcurrent?: number;
  
  /**
   * Whether to process in parallel
   */
  parallel?: boolean;
  
  /**
   * Enable detailed logs for streaming operations
   */
  debugLogs?: boolean;
}

/**
 * Stream processor for large number operations
 */
export interface StreamProcessor {
  /**
   * Process a large number in chunks for factorization
   */
  factorizeStreaming(stream: AsyncIterable<StreamingChunk> | StreamingChunk[]): Promise<Factor[]>;
  
  /**
   * Apply transformations to a stream of data
   */
  transformStreaming(stream: AsyncIterable<StreamingChunk> | StreamingChunk[]): Promise<StreamingChunk[]>;
}

/**
 * Common interface for prime registries
 */
export interface PrimeRegistryInterface {
  /**
   * Test if a number is prime
   */
  isPrime(n: bigint): boolean;
  
  /**
   * Get prime at specific index
   */
  getPrime(idx: number): bigint;
  
  /**
   * Get index of a prime in the registry
   */
  getIndex(prime: bigint): number;
  
  /**
   * Extend prime cache to include at least idx+1 primes
   */
  extendTo(idx: number): void;
  
  /**
   * Factor a number into its prime components
   */
  factor(x: bigint): Factor[];
  
  /**
   * Integer square root (for BigInt)
   */
  integerSqrt(n: bigint): bigint;
  
  /**
   * Create a stream of primes
   */
  createPrimeStream(startIdx?: number): Stream<bigint>;
  
  /**
   * Create a factor stream for large numbers
   */
  createFactorStream(x: bigint): Stream<Factor>;
  
  /**
   * Create a stream processor for large number operations
   */
  createStreamProcessor(options?: StreamingOptions): StreamProcessor;
  
  /**
   * Factorize a large number using streaming operations
   */
  factorizeStreaming(stream: AsyncIterable<StreamingChunk> | StreamingChunk[]): Promise<Factor[]>;
}

/**
 * Alias for backwards compatibility - in PrimeOS all registries have streaming support
 */
export type StreamingPrimeRegistryInterface = PrimeRegistryInterface;

/**
 * Input types for Prime module processing
 */
export type PrimeProcessInput = {
  operation: 'isPrime' | 'getPrime' | 'getIndex' | 'factor' | 'createPrimeStream' | 
             'createFactorStream' | 'factorizeStreaming' | 'getVersion' | 'clearCache';
  params: any[];
};

/**
 * Extended state for Prime module
 */
export interface PrimeState extends ModelState {
  /**
   * Configuration settings
   */
  config: {
    streamingEnabled: boolean;
    chunkSize: number;
    enableLogs: boolean;
    preloadCount: number;
  };
  
  /**
   * Prime cache statistics
   */
  cache: {
    size: number;
    hits: number;
    misses: number;
    primeCount: number;
    largestPrime: bigint;
  };
  
  /**
   * Performance metrics
   */
  metrics: {
    factorizations: number;
    primalityTests: number;
    streamOperations: number;
    averageFactorizationTime: number;
  };
}
