/**
 * Verification Types
 * ===============
 *
 * Type definitions for data verification operations.
 */

import { Factor } from '../types';
import { ChecksumExtractionResult } from '../checksums/types';

/**
 * Status of verification
 */
export enum VerificationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  UNKNOWN = 'unknown'
}

/**
 * Configuration options for verification operations
 */
export interface VerificationOptions {
  /**
   * Enable debug logging
   */
  debug?: boolean;
  
  /**
   * Fail fast mode will stop processing after first verification failure
   */
  failFast?: boolean;
  
  /**
   * Verification cache size
   */
  cacheSize?: number;
  
  /**
   * Whether to enable cache for verification results
   */
  enableCache?: boolean;
}

/**
 * Result of a verification operation
 */
export interface VerificationResult {
  /**
   * Core factors of the verified value
   */
  coreFactors: Factor[];
  
  /**
   * Checksum prime used for verification
   */
  checksumPrime: bigint;
  
  /**
   * Whether verification was successful
   */
  valid: boolean;
  
  /**
   * Error information if verification failed
   */
  error?: {
    /**
     * Expected checksum prime
     */
    expected: bigint;
    
    /**
     * Actual checksum prime found
     */
    actual: bigint;
    
    /**
     * Error message
     */
    message: string;
  };
}

/**
 * Interface for a prime registry used in verification
 */
export interface PrimeRegistryForVerification {
  /**
   * Get prime at specific index
   */
  getPrime(idx: number): bigint;
  
  /**
   * Get index of a prime in the registry
   */
  getIndex(prime: bigint): number;
  
  /**
   * Factor a number into its prime components
   */
  factor(x: bigint): Factor[];
}

/**
 * Core interface for verification functionality
 */
export interface VerificationInterface {
  /**
   * Verify a value's integrity using its checksum
   */
  verifyValue(
    value: bigint,
    primeRegistry: PrimeRegistryForVerification
  ): VerificationResult;
  
  /**
   * Verify multiple values
   */
  verifyValues(
    values: bigint[],
    primeRegistry: PrimeRegistryForVerification
  ): VerificationResult[];
  
  /**
   * Create an optimized verification function for repeated use
   */
  createOptimizedVerifier(
    primeRegistry: PrimeRegistryForVerification
  ): (value: bigint) => boolean;
  
  /**
   * Get the overall verification status based on a set of results
   */
  getStatus(): VerificationStatus;
  
  /**
   * Get all verification results
   */
  getResults(): VerificationResult[];
  
  /**
   * Reset the verification context
   */
  reset(): void;
}
