/**
 * Verification Implementation
 * ========================
 *
 * This module provides data integrity verification capabilities.
 */

import {
  VerificationOptions,
  VerificationInterface,
  VerificationResult,
  VerificationStatus,
  PrimeRegistryForVerification
} from './types';

import {
  extractFactorsAndChecksum,
  calculateChecksum,
  ChecksumExtractionResult
} from '../checksums';

/**
 * Default options for verification operations
 */
const DEFAULT_OPTIONS: VerificationOptions = {
  debug: false,
  failFast: false,
  cacheSize: 1000,
  enableCache: true
};

/**
 * VerificationContext provides methods for verifying data integrity
 * through checksum validation.
 */
export class VerificationContext implements VerificationInterface {
  private options: VerificationOptions;
  private results: VerificationResult[] = [];
  private status: VerificationStatus = VerificationStatus.UNKNOWN;
  private cache: Map<string, boolean> = new Map();
  
  /**
   * Create a new verification context
   */
  constructor(options: VerificationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * Verify a single value
   */
  verifyValue(
    value: bigint,
    primeRegistry: PrimeRegistryForVerification
  ): VerificationResult {
    try {
      // Check cache first if enabled
      if (this.options.enableCache) {
        const cacheKey = value.toString();
        const cached = this.cache.get(cacheKey);
        
        if (cached !== undefined) {
          // We know it's valid, but we need to extract factors for a full result
          try {
            const { coreFactors, checksumPrime } = extractFactorsAndChecksum(value, primeRegistry);
            const result: VerificationResult = { coreFactors, checksumPrime, valid: true };
            this.results.push(result);
            return result;
          } catch (e) {
            // This shouldn't happen if the cache is correct, but handle it anyway
            if (this.options.debug) {
              console.warn('Cache inconsistency detected:', e);
            }
          }
        }
      }
      
      // Extract factors and checksum
      const { coreFactors, checksumPrime } = extractFactorsAndChecksum(value, primeRegistry);
      
      // Calculate expected checksum
      const expectedChecksum = calculateChecksum(coreFactors, primeRegistry);
      
      // Compare checksums
      const valid = expectedChecksum === checksumPrime;
      
      let result: VerificationResult;
      
      if (!valid) {
        result = {
          coreFactors,
          checksumPrime,
          valid: false,
          error: {
            expected: expectedChecksum,
            actual: checksumPrime,
            message: 'Checksum verification failed'
          }
        };
        
        // Update status
        this.status = VerificationStatus.INVALID;
      } else {
        result = {
          coreFactors,
          checksumPrime,
          valid: true
        };
        
        // Update status if not already invalid
        if (this.status !== VerificationStatus.INVALID) {
          this.status = VerificationStatus.VALID;
        }
      }
      
      // Update cache if enabled
      if (this.options.enableCache) {
        const cacheKey = value.toString();
        this.cache.set(cacheKey, valid);
        
        // Trim cache if needed
        if (this.cache.size > (this.options.cacheSize || DEFAULT_OPTIONS.cacheSize!)) {
          const oldestKey = this.cache.keys().next().value;
          this.cache.delete(oldestKey);
        }
      }
      
      // Add to results
      this.results.push(result);
      
      if (this.options.debug) {
        console.log(`Verified value ${value}: ${valid ? 'VALID' : 'INVALID'}`);
        if (!valid) {
          console.log(`Expected checksum: ${expectedChecksum}, Actual checksum: ${checksumPrime}`);
        }
      }
      
      return result;
    } catch (error: any) {
      // Handle errors
      const result: VerificationResult = {
        coreFactors: [],
        checksumPrime: 0n,
        valid: false,
        error: {
          expected: 0n,
          actual: 0n,
          message: error.message || 'Unknown verification error'
        }
      };
      
      // Update status
      this.status = VerificationStatus.INVALID;
      
      // Add to results
      this.results.push(result);
      
      if (this.options.debug) {
        console.error(`Verification error for value ${value}:`, error);
      }
      
      return result;
    }
  }
  
  /**
   * Verify multiple values
   */
  verifyValues(
    values: bigint[],
    primeRegistry: PrimeRegistryForVerification
  ): VerificationResult[] {
    const results: VerificationResult[] = [];
    
    for (const value of values) {
      const result = this.verifyValue(value, primeRegistry);
      results.push(result);
      
      if (!result.valid && this.options.failFast) {
        break;
      }
    }
    
    return results;
  }
  
  /**
   * Create an optimized verification function for repeated use
   * The returned function is more efficient for frequent checks
   */
  createOptimizedVerifier(
    primeRegistry: PrimeRegistryForVerification
  ): (value: bigint) => boolean {
    // Cache recent verifications for performance
    const cache = new Map<string, boolean>();
    const cacheSize = this.options.cacheSize || DEFAULT_OPTIONS.cacheSize!;
    
    return (value: bigint) => {
      // Check cache first
      const key = value.toString();
      if (cache.has(key)) {
        return cache.get(key) as boolean;
      }
      
      // Verify value
      let valid = false;
      
      try {
        const { coreFactors, checksumPrime } = extractFactorsAndChecksum(value, primeRegistry);
        const expectedChecksum = calculateChecksum(coreFactors, primeRegistry);
        valid = expectedChecksum === checksumPrime;
      } catch (e) {
        valid = false;
      }
      
      // Cache result
      if (cache.size >= cacheSize) {
        // Remove oldest entry
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
      }
      cache.set(key, valid);
      
      return valid;
    };
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
    
    // Keep cache for performance unless the cache got too large
    if (this.cache.size > (this.options.cacheSize || DEFAULT_OPTIONS.cacheSize!) * 2) {
      this.cache.clear();
    }
  }
  
  /**
   * Clear the verification cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Create a verification context with the specified options
 */
export function createVerification(options: VerificationOptions = {}): VerificationInterface {
  return new VerificationContext(options);
}

// Export the verification status enum
export { VerificationStatus };

// Export default instance with standard options
export const verification = createVerification();

// Export standalone verification function for simple cases
export function verifyValue(
  value: bigint,
  primeRegistry: PrimeRegistryForVerification
): VerificationResult {
  return verification.verifyValue(value, primeRegistry);
}

// Export optimized verifier creator for performance-critical applications
export function createOptimizedVerifier(
  primeRegistry: PrimeRegistryForVerification
): (value: bigint) => boolean {
  return verification.createOptimizedVerifier(primeRegistry);
}

// Export type definitions
export * from './types';
