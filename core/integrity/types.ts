/**
 * Integrity Module Types
 * =====================
 * 
 * Type definitions for the integrity module implementing Axiom 2:
 * Data carries self-verification via checksums.
 * 
 * This implementation avoids JavaScript bigint and uses regular numbers
 * with the precision modules for any large number operations.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelState
} from '../../os/model/types';

/**
 * Represents a prime factor with exponent
 * Using regular numbers instead of bigint
 */
export interface Factor {
  /**
   * Prime number (as regular number)
   */
  prime: number;
  
  /**
   * Exponent of the prime
   */
  exponent: number;
}

/**
 * Options for integrity operations
 */
export interface IntegrityOptions extends ModelOptions {
  /**
   * Power (exponent) to use for checksums (default: 6)
   */
  checksumPower?: number;
  
  /**
   * Enable caching for checksum calculations
   */
  enableCache?: boolean;
  
  /**
   * Maximum size of the cache
   */
  cacheSize?: number;
  
  /**
   * Prime registry to use for operations
   */
  primeRegistry?: any;
}

/**
 * Extended state for integrity module
 */
export interface IntegrityState extends ModelState {
  /**
   * Configuration settings
   */
  config: Required<Omit<IntegrityOptions, keyof ModelOptions>>;
  
  /**
   * Cache statistics
   */
  cache?: {
    size: number;
    hits: number;
    misses: number;
  };
  
  /**
   * Operation statistics
   */
  stats: {
    checksumsGenerated: number;
    verificationsPerformed: number;
    integrityFailures: number;
  };
}

/**
 * Result of integrity verification
 */
export interface VerificationResult {
  /**
   * Whether the integrity check passed
   */
  valid: boolean;
  
  /**
   * Core factors if extraction was successful
   */
  coreFactors?: Factor[];
  
  /**
   * Checksum value if extraction was successful
   */
  checksum?: number;
  
  /**
   * Error message if verification failed
   */
  error?: string;
}

/**
 * Result of checksum extraction
 */
export interface ChecksumExtraction {
  /**
   * Core factors extracted from the value
   */
  coreFactors: Factor[];
  
  /**
   * Checksum prime value
   */
  checksumPrime: number;
  
  /**
   * Checksum exponent
   */
  checksumExponent: number;
  
  /**
   * Whether the extraction was successful
   */
  valid: boolean;
  
  /**
   * Error message if extraction failed
   */
  error?: string;
}

/**
 * Input for integrity processing operations
 */
export interface IntegrityProcessInput {
  operation: 'generateChecksum' | 'attachChecksum' | 'verifyIntegrity' | 
            'extractChecksum' | 'calculateXorSum' | 'verifyBatch';
  
  /**
   * Prime factors for operations
   */
  factors?: Factor[];
  
  /**
   * Value to operate on
   */
  value?: number;
  
  /**
   * Array of values for batch operations
   */
  values?: number[];
  
  /**
   * Prime registry to use
   */
  primeRegistry?: any;
}

/**
 * Interface for the integrity module
 */
export interface IntegrityInterface extends ModelInterface {
  /**
   * Generate a checksum from prime factors
   */
  generateChecksum(factors: Factor[], primeRegistry?: any): Promise<number>;
  
  /**
   * Attach a checksum to a value
   */
  attachChecksum(value: number, factors: Factor[], primeRegistry?: any): Promise<number>;
  
  /**
   * Verify the integrity of a checksummed value
   */
  verifyIntegrity(value: number, primeRegistry?: any): Promise<VerificationResult>;
  
  /**
   * Extract checksum and core factors from a value
   */
  extractChecksum(value: number, primeRegistry?: any): Promise<ChecksumExtraction>;
  
  /**
   * Calculate XOR sum for factors
   */
  calculateXorSum(factors: Factor[], primeRegistry?: any): Promise<number>;
  
  /**
   * Verify multiple values in batch
   */
  verifyBatch(values: number[], primeRegistry?: any): Promise<VerificationResult[]>;
  
  /**
   * Get access to the logger
   */
  getLogger(): any;
  
  /**
   * Get the module state
   */
  getState(): IntegrityState;
}

/**
 * Base error class for integrity operations
 */
export class IntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntegrityError';
  }
}

/**
 * Error for checksum mismatches
 */
export class ChecksumMismatchError extends IntegrityError {
  constructor(expected: number, actual: number) {
    super(`Checksum mismatch: expected ${expected}, got ${actual}`);
    this.name = 'ChecksumMismatchError';
  }
}

/**
 * Error for invalid factors
 */
export class InvalidFactorError extends IntegrityError {
  constructor(factor: Factor) {
    super(`Invalid factor: prime=${factor.prime}, exponent=${factor.exponent}`);
    this.name = 'InvalidFactorError';
  }
}

/**
 * Error for missing checksums
 */
export class MissingChecksumError extends IntegrityError {
  constructor() {
    super('No checksum found in value');
    this.name = 'MissingChecksumError';
  }
}
