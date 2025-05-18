/**
 * Precision Module - Verification
 * =============================
 *
 * This file implements verification capabilities for the precision module,
 * providing integrity checks for mathematical operations.
 */

import {
  Factor,
  VerificationResult,
  VerificationOptions
} from './types';

import { calculateChecksum, extractFactorsAndChecksum } from './checksums';

/**
 * Verification result status enum
 */
export enum VerificationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  UNKNOWN = 'unknown'
}

/**
 * Verify a value against its expected checksums
 *
 * @param value Value to verify
 * @param primeRegistry Registry to get primes and indices
 * @param options Verification options
 * @returns Verification result
 */
export function verifyValue(
  value: bigint,
  primeRegistry: {
    getIndex: (prime: bigint) => number;
    getPrime: (index: number) => bigint;
    factor: (n: bigint) => Factor[];
  },
  options: VerificationOptions = {}
): VerificationResult {
  try {
    // Extract factors and checksum
    const { coreFactors, checksum } = extractFactorsAndChecksum(
      value,
      primeRegistry
    );

    // Calculate expected checksum
    const expectedChecksum = calculateChecksum(
      coreFactors,
      primeRegistry
    );

    // Compare checksums
    const valid = expectedChecksum === checksum;

    if (!valid) {
      return {
        coreFactors,
        checksum,
        valid: false,
        error: {
          expected: expectedChecksum,
          actual: checksum,
          message: 'Checksum verification failed'
        }
      };
    }

    return {
      coreFactors,
      checksum,
      valid: true
    };
  } catch (error: any) {
    // Handle errors
    return {
      coreFactors: [],
      checksum: 0n,
      valid: false,
      error: {
        expected: 0n,
        actual: 0n,
        message: error.message || 'Unknown verification error'
      }
    };
  }
}

/**
 * Create a verification context for batched operations
 */
export class VerificationContext {
  private primeRegistry: {
    getIndex: (prime: bigint) => number;
    getPrime: (index: number) => bigint;
    factor: (n: bigint) => Factor[];
  };

  private options: VerificationOptions;
  private results: VerificationResult[] = [];
  private status: VerificationStatus = VerificationStatus.UNKNOWN;

  constructor(
    primeRegistry: {
      getIndex: (prime: bigint) => number;
      getPrime: (index: number) => bigint;
      factor: (n: bigint) => Factor[];
    },
    options: VerificationOptions = {}
  ) {
    this.primeRegistry = primeRegistry;
    this.options = options;
  }

  /**
   * Verify a single value
   *
   * @param value Value to verify
   * @returns Verification result
   */
  verifyValue(value: bigint): VerificationResult {
    const result = verifyValue(value, this.primeRegistry, this.options);
    this.results.push(result);

    // Update status
    if (!result.valid) {
      this.status = VerificationStatus.INVALID;

      if (this.options.failFast) {
        return result;
      }
    }

    return result;
  }

  /**
   * Verify multiple values
   *
   * @param values Values to verify
   * @returns Array of verification results
   */
  verifyValues(values: bigint[]): VerificationResult[] {
    const results: VerificationResult[] = [];

    for (const value of values) {
      const result = this.verifyValue(value);
      results.push(result);

      if (!result.valid && this.options.failFast) {
        break;
      }
    }

    return results;
  }

  /**
   * Get overall verification status
   */
  getStatus(): VerificationStatus {
    if (this.results.length === 0) {
      return VerificationStatus.UNKNOWN;
    }

    if (this.results.some(r => !r.valid)) {
      return VerificationStatus.INVALID;
    }

    return VerificationStatus.VALID;
  }

  /**
   * Get all verification results
   */
  getResults(): VerificationResult[] {
    return [...this.results];
  }

  /**
   * Reset the verification context
   */
  reset(): void {
    this.results = [];
    this.status = VerificationStatus.UNKNOWN;
  }
}


/**
 * Create an optimized verification function
 * 
 * @param primeRegistry Registry to get primes and indices
 * @param options Verification options
 * @returns Optimized verification function
 */
export function createOptimizedVerifier(
  primeRegistry: { 
    getIndex: (prime: bigint) => number; 
    getPrime: (index: number) => bigint;
    factor: (n: bigint) => Factor[];
  },
  options: VerificationOptions = {}
): (value: bigint) => boolean {
  // Cache recent verifications for performance
  const cache = new Map<string, boolean>();
  const cacheSize = 1000; // Fixed cache size
  
  return (value: bigint) => {
    // Check cache first
    const key = value.toString();
    if (cache.has(key)) {
      return cache.get(key) as boolean;
    }
    
    // Verify value
    const result = verifyValue(value, primeRegistry, options);
    
    // Cache result
    if (cache.size >= cacheSize) {
      // Remove oldest entry
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    cache.set(key, result.valid);
    
    return result.valid;
  };
}
