/**
 * Prime Module Mocks
 * ==================
 * 
 * Mock implementations for the prime module, providing simplified but consistent
 * behavior for testing purposes. These mocks follow the same interface as the
 * real prime module but use predictable, lightweight implementations.
 */

import {
  PrimeRegistryOptions,
  PrimeRegistryInterface,
  StreamingPrimeRegistryInterface,
  Factor,
  Stream,
  StreamingChunk,
  StreamingOptions,
  StreamProcessor,
  PrimeProcessInput,
  PrimeState
} from '../types';

import {
  ModelLifecycleState,
  ModelResult,
  ModelOptions,
  ModelState
} from '../../../os/model/types';

/**
 * Mock BaseModel for testing
 */
class MockBaseModel {
  protected options: ModelOptions;
  protected state: ModelState;
  protected logger: any;

  constructor(options: ModelOptions) {
    this.options = options;
    this.state = {
      lifecycle: ModelLifecycleState.Uninitialized,
      lastStateChangeTime: Date.now(),
      uptime: 0,
      operationCount: {
        total: 0,
        success: 0,
        failed: 0
      },
      custom: {}
    };
    
    this.logger = {
      info: jest.fn().mockResolvedValue(undefined),
      debug: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined),
      warn: jest.fn().mockResolvedValue(undefined)
    };
  }

  createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T> {
    return {
      success,
      data,
      error,
      timestamp: Date.now(),
      source: this.options.name || 'mock-model'
    };
  }

  async initialize(): Promise<ModelResult> {
    this.state.lifecycle = ModelLifecycleState.Ready;
    await this.onInitialize();
    return this.createResult(true);
  }

  async process<T, R>(input: T): Promise<ModelResult<R>> {
    this.state.operationCount.total++;
    try {
      const result = await this.onProcess(input);
      this.state.operationCount.success++;
      return this.createResult<R>(true, result as R);
    } catch (error) {
      this.state.operationCount.failed++;
      return this.createResult<R>(false, undefined, error instanceof Error ? error.message : String(error));
    }
  }

  async reset(): Promise<ModelResult> {
    await this.onReset();
    return this.createResult(true);
  }

  async terminate(): Promise<ModelResult> {
    this.state.lifecycle = ModelLifecycleState.Terminated;
    await this.onTerminate();
    return this.createResult(true);
  }

  getState(): ModelState {
    return { ...this.state };
  }

  protected async onInitialize(): Promise<void> {}
  protected async onProcess<T, R>(input: T): Promise<R | undefined> { 
    return input as unknown as R | undefined; 
  }
  protected async onReset(): Promise<void> {}
  protected async onTerminate(): Promise<void> {}
}

/**
 * Simple predefined primes for testing
 */
const MOCK_PRIMES = [
  2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n, 53n, 59n, 61n, 67n, 71n,
  73n, 79n, 83n, 89n, 97n, 101n, 103n, 107n, 109n, 113n, 127n, 131n, 137n, 139n, 149n, 151n, 157n,
  163n, 167n, 173n, 179n, 181n, 191n, 193n, 197n, 199n, 211n, 223n, 227n, 229n, 233n, 239n, 241n,
  251n, 257n, 263n, 269n, 271n, 277n, 281n, 283n, 293n, 307n, 311n, 313n, 317n, 331n, 337n, 347n,
  349n, 353n, 359n, 367n, 373n, 379n, 383n, 389n, 397n, 401n, 409n, 419n, 421n, 431n, 433n, 439n,
  443n, 449n, 457n, 461n, 463n, 467n, 479n, 487n, 491n, 499n, 503n, 509n, 521n, 523n, 541n, 547n
];

/**
 * Mock basic stream implementation
 */
function createMockStream<T>(values: T[]): Stream<T> {
  let position = 0;
  const buffer = [...values];
  
  return {
    [Symbol.iterator](): Iterator<T> {
      let iterPosition = 0;
      return {
        next(): IteratorResult<T> {
          if (iterPosition < buffer.length) {
            return { value: buffer[iterPosition++], done: false };
          }
          return { done: true, value: undefined as any };
        }
      };
    },
    
    next(): IteratorResult<T> {
      if (position < buffer.length) {
        return { value: buffer[position++], done: false };
      }
      return { done: true, value: undefined as any };
    },
    
    map<U>(fn: (value: T) => U): Stream<U> {
      return createMockStream(buffer.map(fn));
    },
    
    filter(fn: (value: T) => boolean): Stream<T> {
      return createMockStream(buffer.filter(fn));
    },
    
    take(n: number): Stream<T> {
      return createMockStream(buffer.slice(0, n));
    },
    
    skip(n: number): Stream<T> {
      return createMockStream(buffer.slice(n));
    },
    
    async reduce<U>(fn: (acc: U, value: T) => U, initial: U): Promise<U> {
      return buffer.reduce(fn, initial);
    },
    
    async forEach(fn: (value: T) => void): Promise<void> {
      buffer.forEach(fn);
    },
    
    async toArray(): Promise<T[]> {
      return [...buffer];
    },
    
    getBuffer(): T[] {
      return [...buffer];
    },
    
    concat(other: Stream<T>): Stream<T> {
      const otherBuffer = other.getBuffer ? other.getBuffer() : [];
      return createMockStream([...buffer, ...otherBuffer]);
    },
    
    branch(): Stream<T> {
      return createMockStream([...buffer]);
    }
  };
}

/**
 * Mock Prime Registry Model
 */
export class MockPrimeRegistryModel extends MockBaseModel implements PrimeRegistryInterface, StreamingPrimeRegistryInterface {
  private primes: bigint[];
  private primeIndices: Map<string, number>;
  private config: any;
  private metrics: any;

  constructor(options: PrimeRegistryOptions = {}) {
    super({
      name: options.name || 'mock-prime-registry',
      version: options.version || '1.0.0',
      id: `mock-prime-${Date.now()}`,
      debug: options.debug || false
    });

    // Initialize with mock primes
    this.primes = options.initialPrimes || MOCK_PRIMES.slice(0, options.preloadCount || 10);
    this.primeIndices = new Map();
    this.primes.forEach((p, idx) => this.primeIndices.set(p.toString(), idx));

    this.config = {
      streamingEnabled: options.useStreaming || false,
      chunkSize: options.streamChunkSize || 1024,
      enableLogs: options.enableLogs || false,
      preloadCount: options.preloadCount || 10
    };

    this.metrics = {
      factorizations: 0,
      primalityTests: 0,
      streamOperations: 0,
      factorizationTimes: []
    };
  }

  protected async onInitialize(): Promise<void> {
    this.state.custom = {
      config: this.config,
      cache: this._getCacheStats(),
      metrics: this._getMetrics()
    };
  }

  protected async onProcess<T = PrimeProcessInput, R = unknown>(input: T): Promise<R | undefined> {
    if (typeof input === 'object' && input !== null && 'operation' in input) {
      const request = input as unknown as PrimeProcessInput;
      
      switch (request.operation) {
        case 'isPrime':
          return this.isPrime(request.params[0] as bigint) as unknown as R;
        case 'getPrime':
          return this.getPrime(request.params[0] as number) as unknown as R;
        case 'getIndex':
          return this.getIndex(request.params[0] as bigint) as unknown as R;
        case 'factor':
          return this.factor(request.params[0] as bigint) as unknown as R;
        case 'createPrimeStream':
          return this.createPrimeStream(request.params[0] as number) as unknown as R;
        case 'createFactorStream':
          return this.createFactorStream(request.params[0] as bigint) as unknown as R;
        case 'factorizeStreaming':
          return this.factorizeStreaming(request.params[0] as any) as unknown as R;
        case 'getVersion':
          return this.getVersion() as unknown as R;
        case 'clearCache':
          this.clearCache();
          return undefined;
        default:
          throw new Error(`Unknown operation: ${(request as any).operation}`);
      }
    }
    return input as unknown as R;
  }

  getState(): PrimeState {
    const baseState = super.getState();
    
    // Always update the custom state with current metrics and cache info
    this.state.custom = {
      config: this.config,
      cache: this._getCacheStats(),
      metrics: this._getMetrics()
    };
    
    return {
      ...baseState,
      custom: this.state.custom,
      config: this.config,
      cache: this._getCacheStats(),
      metrics: this._getMetrics()
    } as PrimeState;
  }

  getVersion(): string {
    return this.options.version || '1.0.0';
  }

  clearCache(): void {
    // Reset to minimal primes
    this.primes = [2n];
    this.primeIndices = new Map([['2', 0]]);
  }

  isPrime(n: bigint): boolean {
    this.metrics.primalityTests++;
    
    if (n < 2n) return false;
    if (n === 2n) return true;
    if (n % 2n === 0n) return false;
    
    // Simple trial division for mock
    for (let i = 3n; i * i <= n; i += 2n) {
      if (n % i === 0n) return false;
    }
    return true;
  }

  extendTo(idx: number): void {
    while (this.primes.length <= idx && this.primes.length < MOCK_PRIMES.length) {
      const nextPrime = MOCK_PRIMES[this.primes.length];
      this.primes.push(nextPrime);
      this.primeIndices.set(nextPrime.toString(), this.primes.length - 1);
    }
  }

  getPrime(idx: number): bigint {
    this.extendTo(idx);
    if (idx >= this.primes.length) {
      throw new Error(`Prime index ${idx} is beyond mock data`);
    }
    return this.primes[idx];
  }

  getIndex(prime: bigint): number {
    const primeStr = prime.toString();
    if (!this.primeIndices.has(primeStr)) {
      if (!this.isPrime(prime)) {
        throw new Error(`${prime} is not a prime number`);
      }
      // For mock, just add it to the end if it's prime
      this.primes.push(prime);
      this.primeIndices.set(primeStr, this.primes.length - 1);
    }
    return this.primeIndices.get(primeStr) || 0;
  }

  factor(x: bigint): Factor[] {
    this.metrics.factorizations++;
    
    if (x <= 0n) {
      throw new Error("Can only factor positive integers");
    }
    if (x === 1n) {
      return [];
    }

    const factors: Factor[] = [];
    let remaining = x;

    // Simple trial division with known primes
    for (const prime of this.primes) {
      if (prime * prime > remaining) break;
      
      if (remaining % prime === 0n) {
        let count = 0;
        while (remaining % prime === 0n) {
          remaining /= prime;
          count++;
        }
        factors.push({ prime, exponent: count });
      }
    }

    // Handle remaining factor
    if (remaining > 1n) {
      factors.push({ prime: remaining, exponent: 1 });
    }

    return factors;
  }

  integerSqrt(n: bigint): bigint {
    if (n < 0n) {
      throw new Error('Square root of negative number is not defined');
    }
    if (n < 2n) return n;
    
    // Simple Newton's method approximation for mock
    let x = n;
    let prev;
    do {
      prev = x;
      x = (x + n / x) / 2n;
    } while (x < prev);
    
    return prev;
  }

  createPrimeStream(startIdx: number = 0): Stream<bigint> {
    this.metrics.streamOperations++;
    const streamPrimes = this.primes.slice(startIdx, Math.min(startIdx + 100, this.primes.length));
    return createMockStream(streamPrimes);
  }

  createFactorStream(x: bigint): Stream<Factor> {
    this.metrics.streamOperations++;
    const factors = this.factor(x);
    return createMockStream(factors);
  }

  createStreamProcessor(options: StreamingOptions = {}): StreamProcessor {
    return {
      factorizeStreaming: async (stream: AsyncIterable<StreamingChunk> | StreamingChunk[]): Promise<Factor[]> => {
        // Mock implementation - just factor the first chunk's data
        let data: bigint;
        
        if (Array.isArray(stream)) {
          if (stream.length === 0) throw new Error("Empty stream");
          const chunk = stream[0];
          data = typeof chunk.data === 'bigint' ? chunk.data : BigInt(1);
        } else {
          for await (const chunk of stream) {
            data = typeof chunk.data === 'bigint' ? chunk.data : BigInt(1);
            break;
          }
          data = data! || BigInt(1);
        }
        
        return this.factor(data);
      },
      
      transformStreaming: async (stream: AsyncIterable<StreamingChunk> | StreamingChunk[]): Promise<StreamingChunk[]> => {
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

  async factorizeStreaming(stream: AsyncIterable<StreamingChunk> | StreamingChunk[]): Promise<Factor[]> {
    const processor = this.createStreamProcessor();
    return processor.factorizeStreaming(stream);
  }

  private _getCacheStats() {
    return {
      size: this.primes.length,
      hits: 0,
      misses: 0,
      primeCount: this.primes.length,
      largestPrime: this.primes.length > 0 ? this.primes[this.primes.length - 1] : BigInt(0)
    };
  }

  private _getMetrics() {
    return {
      factorizations: this.metrics.factorizations,
      primalityTests: this.metrics.primalityTests,
      streamOperations: this.metrics.streamOperations,
      averageFactorizationTime: 0.1 // Mock timing
    };
  }
}

/**
 * Mock factory function
 */
export function createPrimeRegistry(options: PrimeRegistryOptions = {}): MockPrimeRegistryModel {
  return new MockPrimeRegistryModel(options);
}

/**
 * Mock async factory function
 */
export async function createAndInitializePrimeRegistry(
  options: PrimeRegistryOptions = {}
): Promise<MockPrimeRegistryModel> {
  const model = new MockPrimeRegistryModel(options);
  await model.initialize();
  return model;
}

/**
 * Mock utility functions
 */
export function createBasicStream<T>(values: T[]): Stream<T> {
  return createMockStream(values);
}

export function mod(a: bigint, m: bigint): bigint {
  // Mock Python-compatible modular arithmetic
  const result = a % m;
  return result < 0n ? result + m : result;
}

export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  // Simple mock modular exponentiation
  if (modulus === 1n) return 0n;
  let result = 1n;
  base = mod(base, modulus);
  
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = mod(result * base, modulus);
    }
    exponent = exponent / 2n;
    base = mod(base * base, modulus);
  }
  
  return result;
}

export function integerSqrt(n: bigint): bigint {
  if (n < 0n) {
    throw new Error('Square root of negative number is not defined');
  }
  if (n < 2n) return n;
  
  let x = n;
  let prev;
  do {
    prev = x;
    x = (x + n / x) / 2n;
  } while (x < prev);
  
  return prev;
}

export function isPerfectSquare(n: bigint): boolean {
  if (n < 0n) return false;
  if (n === 0n) return true;
  
  const root = integerSqrt(n);
  return root * root === n;
}

export function reconstructFromFactors(factors: Factor[]): bigint {
  return factors.reduce(
    (acc, { prime, exponent }) => acc * (prime ** BigInt(exponent)),
    1n
  );
}

// Re-export all types
export * from '../types';

// Export the mock model as the default implementation
export const PrimeRegistryModel = MockPrimeRegistryModel;

// Mock Jest functions if not available
if (typeof jest === 'undefined') {
  global.jest = {
    fn: () => ({
      mockResolvedValue: (value: any) => () => Promise.resolve(value),
      mockReturnValue: (value: any) => () => value
    })
  } as any;
}
