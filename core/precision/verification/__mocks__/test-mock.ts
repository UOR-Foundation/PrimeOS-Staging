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
  getIndex: (prime: bigint) => Number((prime - BigInt(3)) / BigInt(2)),
  factor: (x: bigint) => {
    // Simple mock implementation for testing
    if (x === BigInt(42)) {
      return [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(7), exponent: 1 }
      ];
    } else if (x === BigInt(30)) {
      return [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(5), exponent: 1 }
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
    if (value === BigInt(42)) {
      return {
        coreFactors: [
          { prime: BigInt(2), exponent: 1 },
          { prime: BigInt(3), exponent: 1 },
          { prime: BigInt(7), exponent: 1 }
        ],
        checksumPrime: BigInt(11)
      };
    } else if (value === BigInt(30)) {
      return {
        coreFactors: [
          { prime: BigInt(2), exponent: 1 },
          { prime: BigInt(3), exponent: 1 },
          { prime: BigInt(5), exponent: 1 }
        ],
        checksumPrime: BigInt(7)
      };
    } else if (value === BigInt(100)) {
      return {
        coreFactors: [
          { prime: BigInt(2), exponent: 2 },
          { prime: BigInt(5), exponent: 2 }
        ],
        checksumPrime: BigInt(13)
      };
    } else {
      throw new Error('Invalid value for testing');
    }
  },
  calculateChecksum: (factors: Factor[]) => {
    // Simple mock implementation for testing
    if (factors.length === 3 && 
        factors[0].prime === BigInt(2) && 
        factors[1].prime === BigInt(3) && 
        factors[2].prime === BigInt(7)) {
      return BigInt(11);
    } else if (factors.length === 3 && 
               factors[0].prime === BigInt(2) && 
               factors[1].prime === BigInt(3) && 
               factors[2].prime === BigInt(5)) {
      return BigInt(7);
    } else if (factors.length === 2 && 
               factors[0].prime === BigInt(2) && 
               factors[1].prime === BigInt(5)) {
      return BigInt(13);
    }
    return BigInt(0);
  }
};

/**
 * Mock verification results for testing
 */
export const mockVerificationResults: VerificationResult[] = [
  {
    coreFactors: [
      { prime: BigInt(2), exponent: 1 },
      { prime: BigInt(3), exponent: 1 },
      { prime: BigInt(7), exponent: 1 }
    ],
    checksumPrime: BigInt(11),
    valid: true
  },
  {
    coreFactors: [
      { prime: BigInt(2), exponent: 1 },
      { prime: BigInt(3), exponent: 1 },
      { prime: BigInt(5), exponent: 1 }
    ],
    checksumPrime: BigInt(7),
    valid: true
  },
  {
    coreFactors: [
      { prime: BigInt(2), exponent: 2 },
      { prime: BigInt(5), exponent: 2 }
    ],
    checksumPrime: BigInt(13),
    valid: true
  }
];

/**
 * Mock verification result with error
 */
export const mockErrorResult: VerificationResult = {
  coreFactors: [],
  checksumPrime: BigInt(0),
  valid: false,
  error: {
    expected: BigInt(11),
    actual: BigInt(13),
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
