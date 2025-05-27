/**
 * Prime Module Implementation
 * ==========================
 * 
 * This module implements the first axiom of the UOR kernel system:
 * "Prime Number Foundation: All representation derives from prime numbers"
 * 
 * It provides tools for working with prime numbers, which form the basis for
 * all data representation in the PrimeOS architecture.
 * 
 * This implementation follows the PrimeOS Model interface pattern for
 * consistent lifecycle management and state tracking.
 */

import {
  BaseModel,
  ModelResult,
  ModelLifecycleState,
  ModelOptions
} from '../../os/model';

import { createLogging } from '../../os/logging';

import { 
  PrimeRegistryOptions,
  PrimeRegistryInterface as IPrimeRegistry,
  StreamingPrimeRegistryInterface,
  Factor,
  Stream,
  StreamingChunk,
  StreamingOptions,
  StreamProcessor,
  PrimeProcessInput,
  PrimeState
} from './types';

import {
  createBasicStream,
  mod,
  modPow,
  integerSqrt,
  isPerfectSquare,
  reconstructFromFactors
} from './utils';

// Import enhanced functions from precision module
import { isProbablePrime } from '../precision';

// Constants for optimizing operations
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_SAFE_SQRT = BigInt(Math.floor(Math.sqrt(Number.MAX_SAFE_INTEGER)));

/**
 * Default options for Prime Registry
 */
const DEFAULT_OPTIONS: PrimeRegistryOptions = {
  preloadCount: 5,
  useStreaming: false,
  streamChunkSize: 1024,
  enableLogs: false,
  debug: false,
  name: 'prime-registry',
  version: '1.0.0'
};

/**
 * Prime Registry Model extending BaseModel
 */
export class PrimeRegistryModel extends BaseModel implements IPrimeRegistry, StreamingPrimeRegistryInterface {
  /**
   * Cached primes for efficient lookup
   */
  private primes: bigint[] = [2n];
  
  /**
   * Mapping from primes to their indices for O(1) lookups
   */
  private primeIndices: Map<string, number> = new Map([['2', 0]]);
  
  /**
   * Configuration options
   */
  private config: {
    streamingEnabled: boolean;
    chunkSize: number;
    enableLogs: boolean;
    preloadCount: number;
  };
  
  /**
   * Performance metrics
   */
  private metrics = {
    factorizations: 0,
    primalityTests: 0,
    streamOperations: 0,
    factorizationTimes: [] as number[]
  };
  
  /**
   * Create a new PrimeRegistryModel
   */
  constructor(options: PrimeRegistryOptions = {}) {
    // Initialize BaseModel with options
    super({ ...DEFAULT_OPTIONS, ...options });
    
    // Process options with defaults
    this.config = {
      streamingEnabled: options.useStreaming ?? DEFAULT_OPTIONS.useStreaming!,
      chunkSize: options.streamChunkSize ?? DEFAULT_OPTIONS.streamChunkSize!,
      enableLogs: options.enableLogs ?? DEFAULT_OPTIONS.enableLogs!,
      preloadCount: options.preloadCount ?? DEFAULT_OPTIONS.preloadCount!
    };
  }
  
  /**
   * Initialize the model
   */
  protected async onInitialize(): Promise<void> {
    await this.logger.info('Initializing Prime Registry module', { config: this.config });
    
    try {
      // Initialize with custom primes if provided
      const options = this.options as PrimeRegistryOptions;
      if (options.initialPrimes && options.initialPrimes.length > 0) {
        this.primes = [...options.initialPrimes];
        this.primeIndices.clear();
        this.primes.forEach((p, idx) => this.primeIndices.set(p.toString(), idx));
        await this.logger.debug(`Initialized with ${options.initialPrimes.length} custom primes`);
      }

      // Preload primes
      this.extendTo(this.config.preloadCount);
      
      // Add custom state tracking
      this.state.custom = {
        config: this.config,
        cache: this._getCacheStats(),
        metrics: this._getMetrics()
      };
      
      await this.logger.info('Prime Registry module initialized successfully', {
        primeCount: this.primes.length,
        largestPrime: this.primes[this.primes.length - 1]
      });
      
    } catch (error) {
      await this.logger.error('Failed to initialize Prime Registry module', error);
      throw error;
    }
  }
  
  /**
   * Process operation request
   */
  protected async onProcess<T = PrimeProcessInput, R = unknown>(input: T): Promise<R> {
    if (!input || typeof input !== 'object') {
      throw new Error('Input cannot be undefined or null');
    }
    
    await this.logger.debug('Processing input', input);
    
    // Process based on input type
    if (typeof input === 'object' && input !== null && 'operation' in input && 'params' in input) {
      const request = input as unknown as PrimeProcessInput;
      
      switch (request.operation) {
        case 'isPrime':
          this.metrics.primalityTests++;
          return this.isPrime(request.params[0] as bigint) as unknown as R;
          
        case 'getPrime':
          return this.getPrime(request.params[0] as number) as unknown as R;
          
        case 'getIndex':
          return this.getIndex(request.params[0] as bigint) as unknown as R;
          
        case 'factor':
          this.metrics.factorizations++;
          const startTime = performance.now();
          const result = this.factor(request.params[0] as bigint);
          const duration = performance.now() - startTime;
          this.metrics.factorizationTimes.push(duration);
          if (this.metrics.factorizationTimes.length > 1000) {
            this.metrics.factorizationTimes.shift();
          }
          return result as unknown as R;
          
        case 'createPrimeStream':
          this.metrics.streamOperations++;
          return this.createPrimeStream(request.params[0] as number) as unknown as R;
          
        case 'createFactorStream':
          this.metrics.streamOperations++;
          return this.createFactorStream(request.params[0] as bigint) as unknown as R;
          
        case 'factorizeStreaming':
          return this.factorizeStreaming(request.params[0] as any) as unknown as R;
          
        case 'getVersion':
          return this.getVersion() as unknown as R;
          
        case 'clearCache':
          this.clearCache();
          return undefined as unknown as R;
          
        default:
          throw new Error(`Unknown operation: ${(request as any).operation}`);
      }
    } else {
      // For direct function calls without the operation wrapper
      return input as unknown as R;
    }
  }
  
  /**
   * Reset the module state
   */
  protected async onReset(): Promise<void> {
    await this.logger.info('Resetting Prime Registry module');
    
    // Reset to default state
    this.primes = [2n];
    this.primeIndices = new Map([['2', 0]]);
    
    // Reset metrics
    this.metrics = {
      factorizations: 0,
      primalityTests: 0,
      streamOperations: 0,
      factorizationTimes: []
    };
    
    // Preload default number of primes
    this.extendTo(this.config.preloadCount);
    
    // Update state
    this.state.custom = {
      config: this.config,
      cache: this._getCacheStats(),
      metrics: this._getMetrics()
    };
    
    await this.logger.info('Prime Registry module reset complete');
  }
  
  /**
   * Terminate the module
   */
  protected async onTerminate(): Promise<void> {
    await this.logger.info('Terminating Prime Registry module');
    
    // Clear references
    this.primes = [];
    this.primeIndices.clear();
    
    await this.logger.info('Prime Registry module terminated');
  }
  
  /**
   * Get the module state including cache statistics
   */
  getState(): PrimeState {
    const baseState = super.getState();
    
    // Update cache and metrics
    if (this.state.custom) {
      this.state.custom.cache = this._getCacheStats();
      this.state.custom.metrics = this._getMetrics();
    }
    
    return {
      ...baseState,
      config: this.config,
      cache: this._getCacheStats(),
      metrics: this._getMetrics()
    } as PrimeState;
  }
  
  /**
   * Get version
   */
  getVersion(): string {
    return this.options.version || '1.0.0';
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    // Reset to minimal state
    this.primes = [2n];
    this.primeIndices = new Map([['2', 0]]);
    
    if (this.config.enableLogs) {
      this.logger.debug('Prime cache cleared').catch(() => {});
    }
  }
  
  /**
   * Test if a number is prime using enhanced algorithms from the precision module
   */
  isPrime(n: bigint): boolean {
    if (n < 2n) return false;
    
    // Check if in prime index for quick lookup
    if (this.primeIndices.has(n.toString())) return true;

    // For larger numbers, use the precision module's probabilistic prime test
    // which is much more efficient than trial division
    if (n > 1000000n) {
      return isProbablePrime(n);
    }

    // For smaller numbers, use trial division with known primes
    const sqrt = this.integerSqrt(n);
    
    // Ensure we have enough primes to test up to sqrt(n)
    // We need to extend our cache if the largest prime is <= sqrt
    while (this.primes.length > 0 && this.primes[this.primes.length - 1] <= sqrt) {
      // Use a simple sieve to find the next prime without calling isPrime
      let candidate = this.primes[this.primes.length - 1] + 1n;
      let foundPrime = false;
      
      while (!foundPrime) {
        foundPrime = true;
        for (const p of this.primes) {
          if (p * p > candidate) break;
          if (candidate % p === 0n) {
            foundPrime = false;
            break;
          }
        }
        if (foundPrime) {
          this.primes.push(candidate);
          this.primeIndices.set(candidate.toString(), this.primes.length - 1);
        } else {
          candidate++;
        }
      }
    }
    
    for (const p of this.primes) {
      if (p > sqrt) break;
      // Using proper modular semantics
      if (mod(n, p) === 0n) return false;
    }
    return true;
  }

  /**
   * Integer square root (for BigInt)
   */
  integerSqrt(n: bigint): bigint {
    return integerSqrt(n);
  }

  /**
   * Extend prime cache to include at least idx+1 primes
   */
  extendTo(idx: number): void {
    if (idx < this.primes.length) return;
    
    let candidate = this.primes[this.primes.length - 1] + 1n;
    
    while (this.primes.length <= idx) {
      if (this.isPrime(candidate)) {
        this.primes.push(candidate);
        this.primeIndices.set(candidate.toString(), this.primes.length - 1);
        
        if (this.config.enableLogs && this.primes.length % 1000 === 0) {
          this.logger.debug(`Prime cache extended to ${this.primes.length} primes`).catch(() => {});
        }
      }
      candidate += 1n;
    }
  }

  /**
   * Get prime at specific index, extending cache if needed
   */
  getPrime(idx: number): bigint {
    this.extendTo(idx);
    return this.primes[idx];
  }

  /**
   * Get index of a prime in the registry
   */
  getIndex(prime: bigint): number {
    const primeStr = prime.toString();
    
    if (!this.primeIndices.has(primeStr)) {
      if (!this.isPrime(prime)) {
        throw new Error(`${prime} is not a prime number`);
      }
      
      // Add to registry if it's a prime we haven't seen
      this.extendTo(this.primes.length);
      
      if (!this.primeIndices.has(primeStr)) {
        // Still not found, must be bigger than all our primes
        this.primes.push(prime);
        this.primeIndices.set(primeStr, this.primes.length - 1);
      }
    }
    
    return this.primeIndices.get(primeStr) || 0;
  }

  /**
   * Factor a number into its prime components
   */
  factor(x: bigint): Factor[] {
    if (x <= 0n) {
      throw new Error("Can only factor positive integers");
    }
    if (x === 1n) {
      return [];
    }
    
    const factors: Factor[] = [];
    
    // Trial division with known primes
    let i = 0;
    let remaining = x;
    
    while (true) {
      const p = this.getPrime(i);
      if (p * p > remaining) break;
      
      if (remaining % p === 0n) {
        let count = 0;
        while (remaining % p === 0n) {
          remaining /= p;
          count++;
        }
        factors.push({ prime: p, exponent: count });
      }
      i++;
    }
    
    // Handle remaining prime factor if any
    if (remaining > 1n) {
      if (!this.primeIndices.has(remaining.toString())) {
        this.getIndex(remaining); // This will add remaining to the registry
      }
      factors.push({ prime: remaining, exponent: 1 });
    }
    
    return factors;
  }

  /**
   * Create a stream of primes starting from a given index
   */
  createPrimeStream(startIdx: number = 0): Stream<bigint> {
    // Buffer size for each chunk
    const chunkSize = 100;
    
    // Initial setup
    let currentIdx = startIdx;
    let buffer: bigint[] = [];
    let position = 0;
    const registry = this;
    
    // Load a chunk of primes
    const loadChunk = (fromIndex: number, count: number): bigint[] => {
      const primes: bigint[] = [];
      for (let i = fromIndex; i < fromIndex + count; i++) {
        try {
          primes.push(registry.getPrime(i));
        } catch (e) {
          break; // Stop if we exceed available primes
        }
      }
      return primes;
    };
    
    // Initialize first chunk
    buffer = loadChunk(currentIdx, chunkSize);
    
    // Create a stream with dynamic loading capability
    const stream: Stream<bigint> = {
      // Iterator protocol methods
      [Symbol.iterator](): Iterator<bigint> {
        // Reset position for new iteration
        position = 0;
        
        return {
          next(): IteratorResult<bigint> {
            // If we have items in the buffer, return them
            if (position < buffer.length) {
              return {
                value: buffer[position++],
                done: false
              };
            }
            
            // Otherwise, load more primes
            currentIdx += buffer.length;
            buffer = loadChunk(currentIdx, chunkSize);
            position = 0;
            
            // If we couldn't get any more primes, we're done
            if (buffer.length === 0) {
              return { done: true, value: undefined as any };
            }
            
            // Return the first item in the new batch
            return {
              value: buffer[position++],
              done: false
            };
          }
        };
      },
      
      next(): IteratorResult<bigint> {
        // If we have items in the buffer, return them
        if (position < buffer.length) {
          return {
            value: buffer[position++],
            done: false
          };
        }
        
        // Otherwise, load more primes
        currentIdx += buffer.length;
        buffer = loadChunk(currentIdx, chunkSize);
        position = 0;
        
        // If we couldn't get any more primes, we're done
        if (buffer.length === 0) {
          return { done: true, value: undefined as any };
        }
        
        // Return the first item in the new batch
        return {
          value: buffer[position++],
          done: false
        };
      },
      
      // Stream transformation methods
      map<U>(fn: (value: bigint) => U): Stream<U> {
        return createBasicStream(buffer.map(fn));
      },
      
      filter(fn: (value: bigint) => boolean): Stream<bigint> {
        return createBasicStream(buffer.filter(fn));
      },
      
      take(n: number): Stream<bigint> {
        // Ensure we have enough primes to take n
        while (buffer.length < n && buffer.length > 0) {
          const nextBatch = loadChunk(currentIdx + buffer.length, chunkSize);
          if (nextBatch.length === 0) break;
          buffer = [...buffer, ...nextBatch];
        }
        
        return createBasicStream(buffer.slice(0, n));
      },
      
      skip(n: number): Stream<bigint> {
        // Create a new stream starting from startIdx + n
        return registry.createPrimeStream(startIdx + n);
      },
      
      // Stream consumption methods
      async reduce<U>(fn: (acc: U, value: bigint) => U, initial: U): Promise<U> {
        let result = initial;
        let keepGoing = true;
        
        // Reset state for complete consumption
        position = 0;
        currentIdx = startIdx;
        buffer = loadChunk(currentIdx, chunkSize);
        
        while (keepGoing) {
          // Process current buffer
          for (let i = 0; i < buffer.length; i++) {
            result = fn(result, buffer[i]);
          }
          
          // Load next batch
          currentIdx += buffer.length;
          buffer = loadChunk(currentIdx, chunkSize);
          
          // Stop if no more primes
          if (buffer.length === 0) {
            keepGoing = false;
          }
        }
        
        return result;
      },
      
      async forEach(fn: (value: bigint) => void): Promise<void> {
        // Similar to reduce but without accumulating a result
        let keepGoing = true;
        
        // Reset state for complete consumption
        position = 0;
        currentIdx = startIdx;
        buffer = loadChunk(currentIdx, chunkSize);
        
        while (keepGoing) {
          // Process current buffer
          for (let i = 0; i < buffer.length; i++) {
            fn(buffer[i]);
          }
          
          // Load next batch
          currentIdx += buffer.length;
          buffer = loadChunk(currentIdx, chunkSize);
          
          // Stop if no more primes
          if (buffer.length === 0) {
            keepGoing = false;
          }
        }
      },
      
      async toArray(): Promise<bigint[]> {
        // This could be dangerous for infinite streams
        // We'll limit to a reasonable number to avoid memory issues
        const maxPrimes = 10000;
        const result: bigint[] = [];
        
        // Reset state
        position = 0;
        currentIdx = startIdx;
        buffer = loadChunk(currentIdx, chunkSize);
        
        while (buffer.length > 0 && result.length < maxPrimes) {
          result.push(...buffer);
          currentIdx += buffer.length;
          buffer = loadChunk(currentIdx, chunkSize);
        }
        
        return result;
      },
      
      // Buffer management
      getBuffer(): bigint[] {
        return [...buffer];
      },
      
      // Stream composition
      concat(other: Stream<bigint>): Stream<bigint> {
        const otherBuffer = other.getBuffer ? other.getBuffer() : [];
        return createBasicStream([...buffer, ...otherBuffer]);
      },
      
      // Stream branching
      branch(): Stream<bigint> {
        return registry.createPrimeStream(startIdx);
      }
    };
    
    return stream;
  }

  /**
   * Create a factor stream for large numbers
   */
  createFactorStream(x: bigint): Stream<Factor> {
    if (x <= 0n) {
      throw new Error("Can only factor positive integers");
    }
    
    // For small numbers, use regular factorization
    if (x < MAX_SAFE_INTEGER_BIGINT) {
      const factors = this.factor(x);
      return createBasicStream(factors);
    }
    
    // Factorization state
    let factorBuffer: Factor[] = [];
    let position = 0;
    let completed = false;
    const registry = this;
    
    // Create the stream with intelligent loading
    const stream: Stream<Factor> = {
      // Iterator protocol methods
      [Symbol.iterator](): Iterator<Factor> {
        // Reset position for new iteration
        position = 0;
        
        return {
          next(): IteratorResult<Factor> {
            // If we have factors and haven't consumed all of them
            if (position < factorBuffer.length) {
              return {
                value: factorBuffer[position++],
                done: false
              };
            }
            
            // If we haven't factorized yet
            if (!completed && factorBuffer.length === 0) {
              try {
                factorBuffer = registry.factor(x);
                completed = true;
              } catch (error) {
                registry.logger.error('Error in factorization', error).catch(() => {});
                completed = true;
              }
              
              if (position < factorBuffer.length) {
                return {
                  value: factorBuffer[position++],
                  done: false
                };
              }
            }
            
            // If we've exhausted all factors or factorization failed
            return { done: true, value: undefined as any };
          }
        };
      },
      
      next(): IteratorResult<Factor> {
        // If we have factors and haven't consumed all of them
        if (position < factorBuffer.length) {
          return {
            value: factorBuffer[position++],
            done: false
          };
        }
        
        // If we haven't factorized yet
        if (!completed && factorBuffer.length === 0) {
          try {
            factorBuffer = registry.factor(x);
            completed = true;
          } catch (error) {
            registry.logger.error('Error in factorization', error).catch(() => {});
            completed = true;
          }
          
          if (position < factorBuffer.length) {
            return {
              value: factorBuffer[position++],
              done: false
            };
          }
        }
        
        // If we've exhausted all factors or factorization failed
        return { done: true, value: undefined as any };
      },
      
      // Stream transformation methods
      map<U>(fn: (value: Factor) => U): Stream<U> {
        // Ensure factorization is completed
        if (!completed) {
          factorBuffer = registry.factor(x);
          completed = true;
        }
        return createBasicStream(factorBuffer.map(fn));
      },
      
      filter(fn: (value: Factor) => boolean): Stream<Factor> {
        // Ensure factorization is completed
        if (!completed) {
          factorBuffer = registry.factor(x);
          completed = true;
        }
        return createBasicStream(factorBuffer.filter(fn));
      },
      
      take(n: number): Stream<Factor> {
        // Ensure factorization is completed
        if (!completed) {
          factorBuffer = registry.factor(x);
          completed = true;
        }
        return createBasicStream(factorBuffer.slice(0, n));
      },
      
      skip(n: number): Stream<Factor> {
        // Skip n elements by advancing position
        position += n;
        return this;
      },
      
      // Stream consumption methods
      async reduce<U>(fn: (acc: U, value: Factor) => U, initial: U): Promise<U> {
        // Ensure factorization is completed
        if (!completed) {
          factorBuffer = registry.factor(x);
          completed = true;
        }
        return factorBuffer.reduce(fn, initial);
      },
      
      async forEach(fn: (value: Factor) => void): Promise<void> {
        // Ensure factorization is completed
        if (!completed) {
          factorBuffer = registry.factor(x);
          completed = true;
        }
        factorBuffer.forEach(fn);
      },
      
      async toArray(): Promise<Factor[]> {
        // Ensure factorization is completed
        if (!completed) {
          factorBuffer = registry.factor(x);
          completed = true;
        }
        return [...factorBuffer];
      },
      
      // Buffer management
      getBuffer(): Factor[] {
        // Ensure factorization is completed
        if (!completed) {
          factorBuffer = registry.factor(x);
          completed = true;
        }
        return [...factorBuffer];
      },
      
      // Stream composition
      concat(other: Stream<Factor>): Stream<Factor> {
        // Ensure factorization is completed
        if (!completed) {
          factorBuffer = registry.factor(x);
          completed = true;
        }
        const otherBuffer = other.getBuffer ? other.getBuffer() : [];
        return createBasicStream([...factorBuffer, ...otherBuffer]);
      },
      
      // Stream branching
      branch(): Stream<Factor> {
        return registry.createFactorStream(x);
      }
    };
    
    return stream;
  }
  
  /**
   * Create a stream processor for large number operations
   */
  createStreamProcessor(options: StreamingOptions = {}): StreamProcessor {
    const registry = this;
    
    return {
      factorizeStreaming: async (stream: AsyncIterable<StreamingChunk> | StreamingChunk[]): Promise<Factor[]> => {
        // Convert the stream to a single bigint
        let number: bigint;
        
        if (Array.isArray(stream)) {
          // Handle array of chunks
          if (stream.length === 0) {
            throw new Error("Empty stream provided");
          }
          
          // For simplicity, we assume the first chunk contains the entire number
          const chunk = stream[0];
          if (typeof chunk.data === 'bigint') {
            number = chunk.data;
          } else if (chunk.data instanceof Uint8Array) {
            // Convert Uint8Array to bigint (simplified)
            number = BigInt('0x' + Array.from(chunk.data)
              .map(b => b.toString(16).padStart(2, '0'))
              .join(''));
          } else {
            throw new Error(`Unsupported chunk data type: ${typeof chunk.data}`);
          }
        } else {
          // Handle AsyncIterable stream
          let firstChunk: StreamingChunk | undefined;
          
          for await (const chunk of stream) {
            firstChunk = chunk;
            break; // Only use the first chunk for simplicity
          }
          
          if (!firstChunk) {
            throw new Error("Empty stream provided");
          }
          
          if (typeof firstChunk.data === 'bigint') {
            number = firstChunk.data;
          } else if (firstChunk.data instanceof Uint8Array) {
            // Convert Uint8Array to bigint (simplified)
            number = BigInt('0x' + Array.from(firstChunk.data as Uint8Array)
              .map(b => b.toString(16).padStart(2, '0'))
              .join(''));
          } else {
            throw new Error(`Unsupported chunk data type: ${typeof firstChunk.data}`);
          }
        }
        
        // Now factor the number using our regular factorization
        return registry.factor(number);
      },
      
      transformStreaming: async (stream: AsyncIterable<StreamingChunk> | StreamingChunk[]): Promise<StreamingChunk[]> => {
        // For now, just return the input stream
        if (Array.isArray(stream)) {
          return [...stream];
        } else {
          const chunks: StreamingChunk[] = [];
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          return chunks;
        }
      }
    };
  }
  
  /**
   * Factorize a large number using streaming operations
   */
  async factorizeStreaming(stream: AsyncIterable<StreamingChunk> | StreamingChunk[]): Promise<Factor[]> {
    const processor = this.createStreamProcessor();
    return processor.factorizeStreaming(stream);
  }
  
  /**
   * Get cache statistics
   */
  private _getCacheStats() {
    return {
      size: this.primes.length,
      hits: 0, // TODO: Implement hit tracking
      misses: 0, // TODO: Implement miss tracking
      primeCount: this.primes.length,
      largestPrime: this.primes.length > 0 ? this.primes[this.primes.length - 1] : BigInt(0)
    };
  }
  
  /**
   * Get performance metrics
   */
  private _getMetrics() {
    const avgFactorizationTime = this.metrics.factorizationTimes.length > 0
      ? this.metrics.factorizationTimes.reduce((a, b) => a + b, 0) / this.metrics.factorizationTimes.length
      : 0;
    
    return {
      factorizations: this.metrics.factorizations,
      primalityTests: this.metrics.primalityTests,
      streamOperations: this.metrics.streamOperations,
      averageFactorizationTime: avgFactorizationTime
    };
  }
}

/**
 * Create a prime registry model with the specified options
 */
export function createPrimeRegistry(options: PrimeRegistryOptions = {}): PrimeRegistryModel {
  return new PrimeRegistryModel(options);
}

/**
 * Create and initialize a prime registry model in a single step
 */
export async function createAndInitializePrimeRegistry(
  options: PrimeRegistryOptions = {}
): Promise<PrimeRegistryModel> {
  const model = new PrimeRegistryModel(options);
  const result = await model.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize prime registry: ${result.error}`);
  }
  
  return model;
}

// Export types and utilities
export * from './types';
export * from './utils';
