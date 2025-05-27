/**
 * Test utilities for Prime module mocks
 * ====================================
 * 
 * This file provides test utilities and helpers for working with
 * the prime module mocks.
 */

import { Factor } from '../types';

/**
 * Create a mock prime registry for testing
 */
export function createMockPrimeRegistry() {
  const primes = [BigInt(2), BigInt(3), BigInt(5), BigInt(7), BigInt(11), BigInt(13), BigInt(17), BigInt(19), BigInt(23), BigInt(29), BigInt(31), BigInt(37), BigInt(41), BigInt(43), BigInt(47)];
  
  return {
    isPrime: jest.fn((n: bigint) => {
      if (n < 2n) return false;
      if (n === 2n) return true;
      if (n % 2n === 0n) return false;
      
      // Simple trial division for mock
      for (let i = 3n; i * i <= n; i += 2n) {
        if (n % i === 0n) return false;
      }
      return true;
    }),
    
    getPrime: jest.fn((index: number) => {
      return index < primes.length ? primes[index] : BigInt(index * 2 + 1);
    }),
    
    getIndex: jest.fn((prime: bigint) => {
      const index = primes.indexOf(prime);
      return index >= 0 ? index : Number((prime - BigInt(1)) / BigInt(2));
    }),
    
    factor: jest.fn((n: bigint): Factor[] => {
      // Provide some common test factorizations
      const factorizations: Record<string, Factor[]> = {
        '1': [],
        '2': [{ prime: BigInt(2), exponent: 1 }],
        '3': [{ prime: BigInt(3), exponent: 1 }],
        '4': [{ prime: BigInt(2), exponent: 2 }],
        '6': [
          { prime: BigInt(2), exponent: 1 },
          { prime: BigInt(3), exponent: 1 }
        ],
        '12': [
          { prime: BigInt(2), exponent: 2 },
          { prime: BigInt(3), exponent: 1 }
        ],
        '30': [
          { prime: BigInt(2), exponent: 1 },
          { prime: BigInt(3), exponent: 1 },
          { prime: BigInt(5), exponent: 1 }
        ],
        '42': [
          { prime: BigInt(2), exponent: 1 },
          { prime: BigInt(3), exponent: 1 },
          { prime: BigInt(7), exponent: 1 }
        ],
        '60': [
          { prime: BigInt(2), exponent: 2 },
          { prime: BigInt(3), exponent: 1 },
          { prime: BigInt(5), exponent: 1 }
        ],
        '128': [{ prime: BigInt(2), exponent: 7 }],
        '210': [
          { prime: BigInt(2), exponent: 1 },
          { prime: BigInt(3), exponent: 1 },
          { prime: BigInt(5), exponent: 1 },
          { prime: BigInt(7), exponent: 1 }
        ]
      };
      
      const key = n.toString();
      if (key in factorizations) {
        return factorizations[key];
      }
      
      // For other values, provide a simple factorization
      if (n <= BigInt(1)) return [];
      
      // Check if it's prime
      let isPrime = true;
      for (let i = BigInt(2); i * i <= n; i++) {
        if (n % i === BigInt(0)) {
          isPrime = false;
          break;
        }
      }
      
      if (isPrime) {
        return [{ prime: n, exponent: 1 }];
      }
      
      // Simple factorization for composite numbers
      const factors: Factor[] = [];
      let remaining = n;
      
      for (const prime of primes) {
        let exponent = 0;
        while (remaining % prime === BigInt(0)) {
          exponent++;
          remaining /= prime;
        }
        if (exponent > 0) {
          factors.push({ prime, exponent });
        }
        if (remaining === BigInt(1)) break;
      }
      
      // If there's a remainder, it's a large prime
      if (remaining > BigInt(1)) {
        factors.push({ prime: remaining, exponent: 1 });
      }
      
      return factors;
    }),
    
    integerSqrt: jest.fn((n: bigint) => {
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
    }),
    
    extendTo: jest.fn((idx: number) => {
      // Mock implementation - just track the call
    }),
    
    clearCache: jest.fn(() => {
      // Mock implementation - just track the call
    }),
    
    getVersion: jest.fn(() => '1.0.0')
  };
}

/**
 * Create test factors for common test cases
 */
export function createTestFactors(type: 'simple' | 'complex' | 'empty' | 'single'): Factor[] {
  switch (type) {
    case 'simple':
      return [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 }
      ];
      
    case 'complex':
      return [
        { prime: BigInt(2), exponent: 3 },
        { prime: BigInt(3), exponent: 2 },
        { prime: BigInt(5), exponent: 1 },
        { prime: BigInt(7), exponent: 1 }
      ];
      
    case 'empty':
      return [];
      
    case 'single':
      return [{ prime: BigInt(13), exponent: 1 }];
      
    default:
      return [];
  }
}

/**
 * Create test streams with mock data
 */
export function createTestStream<T>(values: T[]): any {
  return {
    [Symbol.iterator](): Iterator<T> {
      let position = 0;
      return {
        next(): IteratorResult<T> {
          if (position < values.length) {
            return { value: values[position++], done: false };
          }
          return { done: true, value: undefined as any };
        }
      };
    },
    
    map: jest.fn((fn: (value: T) => any): any => createTestStream(values.map(fn))),
    filter: jest.fn((fn: (value: T) => boolean): any => createTestStream(values.filter(fn))),
    take: jest.fn((n: number): any => createTestStream(values.slice(0, n))),
    skip: jest.fn((n: number): any => createTestStream(values.slice(n))),
    reduce: jest.fn(async (fn: any, initial: any): Promise<any> => values.reduce(fn, initial)),
    forEach: jest.fn(async (fn: (value: T) => void): Promise<void> => values.forEach(fn)),
    toArray: jest.fn(async (): Promise<T[]> => [...values]),
    getBuffer: jest.fn((): T[] => [...values]),
    concat: jest.fn((other: any): any => createTestStream([...values, ...other.getBuffer()])),
    branch: jest.fn((): any => createTestStream([...values]))
  };
}

/**
 * Test helper to verify mock function calls
 */
export function verifyMockCalls(mockFn: jest.Mock, expectedCalls: any[][]) {
  expect(mockFn).toHaveBeenCalledTimes(expectedCalls.length);
  
  expectedCalls.forEach((expectedArgs, index) => {
    expect(mockFn).toHaveBeenNthCalledWith(index + 1, ...expectedArgs);
  });
}

/**
 * Reset all mocks in a module
 */
export function resetAllMocks(...mocks: jest.Mock[]) {
  mocks.forEach(mock => {
    mock.mockClear();
    mock.mockReset();
  });
}

/**
 * Create a test configuration for prime module
 */
export function createTestConfig(overrides: any = {}) {
  return {
    debug: false,
    enableLogs: false,
    useStreaming: false,
    streamChunkSize: 1024,
    preloadCount: 10,
    ...overrides
  };
}

/**
 * Helper to test async functions with timeout
 */
export async function testWithTimeout<T>(
  fn: () => Promise<T>,
  timeout: number = 5000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Test timeout')), timeout)
    )
  ]);
}

/**
 * Helper to test error cases
 */
export async function expectAsyncError(
  fn: () => Promise<any>,
  errorMessage?: string | RegExp
) {
  let error: Error | undefined;
  
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }
  
  expect(error).toBeDefined();
  
  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      expect(error!.message).toBe(errorMessage);
    } else {
      expect(error!.message).toMatch(errorMessage);
    }
  }
  
  return error;
}

/**
 * Mock performance.now for consistent timing tests
 */
export function mockPerformanceNow() {
  let currentTime = 0;
  
  const mock = jest.spyOn(performance, 'now').mockImplementation(() => {
    return currentTime;
  });
  
  return {
    advance: (ms: number) => {
      currentTime += ms;
    },
    reset: () => {
      currentTime = 0;
    },
    restore: () => {
      mock.mockRestore();
    }
  };
}

/**
 * Create a spy on console methods for testing logging
 */
export function spyOnConsole() {
  const spies = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation()
  };
  
  return {
    ...spies,
    restore: () => {
      Object.values(spies).forEach(spy => spy.mockRestore());
    }
  };
}

/**
 * Helper to create streaming chunks for testing
 */
export function createStreamingChunks(data: any[]) {
  return data.map((item, index) => ({
    id: `chunk-${index}`,
    data: item,
    metadata: {
      timestamp: Date.now(),
      sequence: index,
      size: 1
    }
  }));
}

/**
 * Mock streaming processor for tests
 */
export function createMockStreamProcessor() {
  return {
    factorizeStreaming: jest.fn(async (stream: any) => {
      // Simple mock that returns factors for the first chunk
      const chunks = Array.isArray(stream) ? stream : [{ data: BigInt(42) }];
      if (chunks.length === 0) return [];
      
      const firstData = chunks[0].data;
      if (typeof firstData === 'bigint') {
        return [{ prime: BigInt(2), exponent: 1 }, { prime: BigInt(3), exponent: 1 }, { prime: BigInt(7), exponent: 1 }];
      }
      return [];
    }),
    
    transformStreaming: jest.fn(async (stream: any) => {
      return Array.isArray(stream) ? stream : [];
    })
  };
}

/**
 * Utility to reconstruct values from factors for testing
 */
export function reconstructTestValue(factors: Factor[]): bigint {
  return factors.reduce(
    (acc, { prime, exponent }) => acc * (prime ** BigInt(exponent)),
    BigInt(1)
  );
}

/**
 * Create mock metrics for testing
 */
export function createMockMetrics() {
  return {
    factorizations: 0,
    primalityTests: 0,
    streamOperations: 0,
    averageFactorizationTime: 0.1,
    cacheHits: 0,
    cacheMisses: 0,
    reset: jest.fn(() => {
      // Reset all counters
    }),
    increment: jest.fn((metric: string) => {
      // Increment specified metric
    })
  };
}

/**
 * Create a test prime number for specific bit lengths
 */
export function createTestPrime(bitLength: number): bigint {
  // Simple way to create test primes of specific bit lengths
  const knownPrimes: Record<number, bigint> = {
    1: BigInt(2),
    2: BigInt(3),
    3: BigInt(5),
    4: BigInt(11),
    5: BigInt(17),
    6: BigInt(41),
    7: BigInt(67),
    8: BigInt(131),
    10: BigInt(521),
    16: BigInt(65521)
  };
  
  return knownPrimes[bitLength] || BigInt(2);
}
