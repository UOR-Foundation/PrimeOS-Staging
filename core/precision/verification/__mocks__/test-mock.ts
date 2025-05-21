/**
 * Test mocks for verification module
 */

import { Factor } from '../../types';
import { VerificationResult } from '../types';

/**
 * Mock prime registry for testing
 */
export const mockPrimeRegistry = {
  getPrime: (idx: number) => BigInt(idx * 2 + 3),
  getIndex: (prime: bigint) => Number((prime - 3n) / 2n),
  factor: (x: bigint) => {
    // Simple mock implementation for testing
    if (x === 42n) {
      return [
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 1 },
        { prime: 7n, exponent: 1 }
      ];
    } else if (x === 30n) {
      return [
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
      ];
    }
    return [];
  }
};

/**
 * Mock checksums module for testing
 */
export const mockChecksums = {
  extractFactorsAndChecksum: (value: bigint) => {
    if (value === 42n) {
      return {
        coreFactors: [
          { prime: 2n, exponent: 1 },
          { prime: 3n, exponent: 1 },
          { prime: 7n, exponent: 1 }
        ],
        checksumPrime: 11n
      };
    } else if (value === 30n) {
      return {
        coreFactors: [
          { prime: 2n, exponent: 1 },
          { prime: 3n, exponent: 1 },
          { prime: 5n, exponent: 1 }
        ],
        checksumPrime: 7n
      };
    } else if (value === 100n) {
      return {
        coreFactors: [
          { prime: 2n, exponent: 2 },
          { prime: 5n, exponent: 2 }
        ],
        checksumPrime: 13n
      };
    } else {
      throw new Error('Invalid value for testing');
    }
  },
  calculateChecksum: (factors: Factor[]) => {
    // Simple mock implementation for testing
    if (factors.length === 3 && 
        factors[0].prime === 2n && 
        factors[1].prime === 3n && 
        factors[2].prime === 7n) {
      return 11n;
    } else if (factors.length === 3 && 
               factors[0].prime === 2n && 
               factors[1].prime === 3n && 
               factors[2].prime === 5n) {
      return 7n;
    } else if (factors.length === 2 && 
               factors[0].prime === 2n && 
               factors[1].prime === 5n) {
      return 13n;
    }
    return 0n;
  }
};

/**
 * Mock verification results for testing
 */
export const mockVerificationResults: VerificationResult[] = [
  {
    coreFactors: [
      { prime: 2n, exponent: 1 },
      { prime: 3n, exponent: 1 },
      { prime: 7n, exponent: 1 }
    ],
    checksumPrime: 11n,
    valid: true
  },
  {
    coreFactors: [
      { prime: 2n, exponent: 1 },
      { prime: 3n, exponent: 1 },
      { prime: 5n, exponent: 1 }
    ],
    checksumPrime: 7n,
    valid: true
  },
  {
    coreFactors: [
      { prime: 2n, exponent: 2 },
      { prime: 5n, exponent: 2 }
    ],
    checksumPrime: 13n,
    valid: true
  }
];

/**
 * Mock verification result with error
 */
export const mockErrorResult: VerificationResult = {
  coreFactors: [],
  checksumPrime: 0n,
  valid: false,
  error: {
    expected: 11n,
    actual: 13n,
    message: 'Checksum verification failed'
  }
};

/**
 * Mock cache for testing
 */
export class MockCache<K, V> {
  private cache = new Map<K, V>();
  private hits = 0;
  private misses = 0;
  
  constructor(private capacity: number) {}
  
  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      this.hits++;
      return this.cache.get(key);
    }
    this.misses++;
    return undefined;
  }
  
  set(key: K, value: V): void {
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }
  
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
  
  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses
    };
  }
}
