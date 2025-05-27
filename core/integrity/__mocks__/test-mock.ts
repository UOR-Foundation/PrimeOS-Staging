/**
 * Test Mock Utilities for Integrity Module
 * =======================================
 * 
 * Provides mock data and utilities for testing the integrity module.
 */

import type { Factor, VerificationResult, ChecksumExtraction } from '../types';

/**
 * Mock factor data for testing
 */
export const mockFactors: Record<string, Factor[]> = {
  // Single factors
  '2': [{ prime: 2n, exponent: 1 }],
  '3': [{ prime: 3n, exponent: 1 }],
  '4': [{ prime: 2n, exponent: 2 }],
  '6': [
    { prime: 2n, exponent: 1 },
    { prime: 3n, exponent: 1 }
  ],
  '12': [
    { prime: 2n, exponent: 2 },
    { prime: 3n, exponent: 1 }
  ],
  '24': [
    { prime: 2n, exponent: 3 },
    { prime: 3n, exponent: 1 }
  ],
  '30': [
    { prime: 2n, exponent: 1 },
    { prime: 3n, exponent: 1 },
    { prime: 5n, exponent: 1 }
  ],
  '42': [
    { prime: 2n, exponent: 1 },
    { prime: 3n, exponent: 1 },
    { prime: 7n, exponent: 1 }
  ],
  '60': [
    { prime: 2n, exponent: 2 },
    { prime: 3n, exponent: 1 },
    { prime: 5n, exponent: 1 }
  ],
  '128': [{ prime: 2n, exponent: 7 }],
  '210': [
    { prime: 2n, exponent: 1 },
    { prime: 3n, exponent: 1 },
    { prime: 5n, exponent: 1 },
    { prime: 7n, exponent: 1 }
  ]
};

/**
 * Mock prime registry for testing
 */
export class MockPrimeRegistry {
  private primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n];
  
  getPrime(index: number): bigint {
    if (index < 0) {
      throw new Error('Invalid prime index: must be non-negative');
    }
    
    if (index < this.primes.length) {
      return this.primes[index];
    }
    
    // Simple approximation for larger indices
    return BigInt(index * 2 + 1);
  }
  
  getIndex(prime: bigint): number {
    const index = this.primes.findIndex(p => p === prime);
    if (index >= 0) return index;
    
    // Simple approximation for primes not in table
    return Number((prime - 1n) / 2n);
  }
  
  factor(n: bigint): Factor[] {
    if (n <= 0n) {
      throw new Error('Cannot factor non-positive numbers');
    }
    
    if (n === 1n) {
      return [];
    }
    
    // Check if we have pre-computed factors
    const nStr = n.toString();
    if (mockFactors[nStr]) {
      return [...mockFactors[nStr]];
    }
    
    // Simple factorization for unknown values
    const factors: Factor[] = [];
    let remaining = n;
    
    for (const prime of this.primes) {
      let exponent = 0;
      while (remaining % prime === 0n) {
        exponent++;
        remaining = remaining / prime;
      }
      if (exponent > 0) {
        factors.push({ prime: BigInt(prime), exponent });
      }
      if (remaining === 1n) break;
    }
    
    // Handle remaining prime factor
    if (remaining > 1n) {
      factors.push({ prime: BigInt(remaining), exponent: 1 });
    }
    
    return factors;
  }
}

/**
 * Mock verification results for testing
 */
export const mockVerificationResults = {
  valid: {
    factors: [
      { prime: 2n, exponent: 1 },
      { prime: 3n, exponent: 1 }
    ],
    
    complexFactors: [
      { prime: 2n, exponent: 3 },
      { prime: 3n, exponent: 2 },
      { prime: 5n, exponent: 1 },
      { prime: 7n, exponent: 1 }
    ],
    
    singleFactor: [
      { prime: 13n, exponent: 1 }
    ]
  },
  
  invalid: {
    emptyFactors: [],
    negativeValue: -1n,
    zeroValue: 0n
  }
};

/**
 * Create a mock verification result
 */
export function createMockVerificationResult(valid: boolean, factors?: Factor[], checksum?: bigint, error?: string): VerificationResult {
  return {
    valid,
    coreFactors: factors,
    checksum,
    error
  };
}

/**
 * Create a mock checksum extraction result
 */
export function createMockChecksumExtraction(
  valid: boolean,
  coreFactors: Factor[] = [],
  checksumPrime: bigint = 0n,
  checksumExponent: number = 0,
  error?: string
): ChecksumExtraction {
  return {
    valid,
    coreFactors,
    checksumPrime,
    checksumExponent,
    error
  };
}

/**
 * Generate test data for a given value
 */
export function generateTestData(value: bigint) {
  const registry = new MockPrimeRegistry();
  const factors = registry.factor(value);
  
  return {
    value,
    factors,
    registry,
    expectedChecksum: registry.getPrime(factors.length), // Simple mock checksum
    expectedWithChecksum: value * (registry.getPrime(factors.length) ** 6n)
  };
}

/**
 * Common test values with their expected factor breakdowns
 */
export const testValues = {
  small: {
    '2': { value: 2n, factors: mockFactors['2'] },
    '6': { value: 6n, factors: mockFactors['6'] },
    '12': { value: 12n, factors: mockFactors['12'] }
  },
  
  medium: {
    '60': { value: 60n, factors: mockFactors['60'] },
    '128': { value: 128n, factors: mockFactors['128'] },
    '210': { value: 210n, factors: mockFactors['210'] }
  },
  
  large: {
    '1000': { value: 1000n, factors: [{ prime: 2n, exponent: 3 }, { prime: 5n, exponent: 3 }] },
    '9999': { value: 9999n, factors: [{ prime: 3n, exponent: 2 }, { prime: 11n, exponent: 1 }, { prime: 101n, exponent: 1 }] }
  }
};

/**
 * Mock error scenarios for testing
 */
export const mockErrorScenarios = {
  invalidFactors: [
    { prime: 0n, exponent: 1 }, // Invalid: zero prime
    { prime: -2n, exponent: 1 }, // Invalid: negative prime
    { prime: 2n, exponent: 0 }, // Invalid: zero exponent
    { prime: 2n, exponent: -1 } // Invalid: negative exponent
  ],
  
  invalidValues: [
    0n, // Zero
    -1n, // Negative
    -42n // Negative with factors
  ]
};

/**
 * Performance test data generators
 */
export const performanceTestData = {
  generateFactorSequence: (count: number): Factor[][] => {
    const sequences: Factor[][] = [];
    const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
    
    for (let i = 0; i < count; i++) {
      const factorCount = (i % 3) + 1; // 1-3 factors
      const factors: Factor[] = [];
      
      for (let j = 0; j < factorCount; j++) {
        factors.push({
          prime: primes[j % primes.length],
          exponent: ((i + j) % 3) + 1 // 1-3 exponent
        });
      }
      
      sequences.push(factors);
    }
    
    return sequences;
  },
  
  generateValueSequence: (count: number): bigint[] => {
    const values: bigint[] = [];
    
    for (let i = 1; i <= count; i++) {
      values.push(BigInt(i * 2)); // Even numbers for easier factoring
    }
    
    return values;
  }
};

/**
 * Validation helpers for tests
 */
export const testValidators = {
  isValidFactor: (factor: Factor): boolean => {
    return factor.prime > 0n && factor.exponent > 0;
  },
  
  isValidFactorArray: (factors: Factor[]): boolean => {
    return factors.every(testValidators.isValidFactor);
  },
  
  hasValidChecksum: (result: VerificationResult): boolean => {
    return result.valid && 
           result.checksum !== undefined && 
           result.checksum > 0n;
  }
};

/**
 * Mock timer utilities for performance testing
 */
export const mockTimer = {
  start: (): number => Date.now(),
  
  elapsed: (startTime: number): number => Date.now() - startTime,
  
  benchmark: async <T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = mockTimer.start();
    const result = await operation();
    const duration = mockTimer.elapsed(start);
    
    return { result, duration };
  }
};
