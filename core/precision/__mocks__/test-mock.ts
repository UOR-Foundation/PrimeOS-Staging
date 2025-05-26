/**
 * Test utilities for Precision module mocks
 * ========================================
 * 
 * This file provides test utilities and helpers for working with
 * the precision module mocks.
 */

import { Factor } from '../types';

/**
 * Create a mock prime registry for testing
 */
export function createMockPrimeRegistry() {
  const primes = [BigInt(2), BigInt(3), BigInt(5), BigInt(7), BigInt(11), BigInt(13), BigInt(17), BigInt(19), BigInt(23), BigInt(29), BigInt(31), BigInt(37), BigInt(41), BigInt(43), BigInt(47)];
  
  return {
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
    })
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
 * Create a value with checksum for testing
 */
export function createChecksummedValue(
  rawValue: bigint,
  checksumPrime: bigint,
  checksumPower: number = 6
): bigint {
  return rawValue * (checksumPrime ** BigInt(checksumPower));
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
 * Create a test configuration for precision module
 */
export function createTestConfig(overrides: any = {}) {
  return {
    debug: false,
    enableCaching: true,
    pythonCompatible: true,
    checksumPower: 6,
    cacheSize: 100,
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
