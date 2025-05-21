/**
 * Verification Types
 * ===============
 *
 * Type definitions for data verification operations.
 */

import { Factor } from '../types';
import { ChecksumExtractionResult } from '../checksums/types';
import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState,
  ModelLifecycleState
} from '../../../os/model';

/**
 * Status of verification
 */
export enum VerificationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  UNKNOWN = 'unknown'
}

/**
 * Retry configuration options
 */
export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
  
  /**
   * Initial delay between retries in milliseconds
   */
  initialDelay?: number;
  
  /**
   * Maximum delay between retries in milliseconds
   */
  maxDelay?: number;
  
  /**
   * Factor by which to increase delay after each retry
   */
  backoffFactor?: number;
}

/**
 * Configuration options for verification operations
 */
export interface VerificationOptions extends ModelOptions {
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
  
  /**
   * Enable automatic retry for transient failures
   */
  enableRetry?: boolean;
  
  /**
   * Retry configuration
   */
  retryOptions?: RetryOptions;
  
  /**
   * Enable rate limiting to prevent resource exhaustion
   */
  enableRateLimit?: boolean;
  
  /**
   * Maximum operations per second
   */
  rateLimit?: number;
  
  /**
   * Maximum burst size for rate limiting
   */
  rateLimitBurst?: number;
  
  /**
   * Enable circuit breaker to prevent cascading failures
   */
  enableCircuitBreaker?: boolean;
  
  /**
   * Number of failures before opening circuit
   */
  circuitBreakerThreshold?: number;
  
  /**
   * Time to wait before trying half-open state (ms)
   */
  circuitBreakerTimeout?: number;
  
  /**
   * Advanced resilience options
   */
  
  /**
   * Use advanced rate limiter with dynamic rate adjustment
   */
  useAdvancedRateLimiter?: boolean;
  
  /**
   * Enable dynamic rate adjustment based on system load
   */
  enableDynamicRateAdjustment?: boolean;
  
  /**
   * Minimum rate limit (operations per second)
   */
  minRateLimit?: number;
  
  /**
   * Maximum rate limit (operations per second)
   */
  maxRateLimit?: number;
  
  /**
   * System load threshold for rate adjustment (0-100)
   */
  loadThreshold?: number;
  
  /**
   * Rate adjustment factor (0-1)
   */
  adjustmentFactor?: number;
  
  /**
   * Rate limits by operation type
   */
  operationRateLimits?: {
    [operationType: string]: number;
  };
  
  /**
   * Use advanced circuit breaker with degraded state support
   */
  useAdvancedCircuitBreaker?: boolean;
  
  /**
   * Enable degraded state for circuit breaker
   */
  enableDegradedState?: boolean;
  
  /**
   * Threshold for entering degraded state (0-100)
   */
  degradedStateThreshold?: number;
  
  /**
   * Function to categorize failures
   */
  failureCategorizer?: (error: Error) => string;
  
  /**
   * Health check interval in milliseconds
   */
  healthCheckInterval?: number;
  
  /**
   * Failure thresholds by category
   */
  categoryThresholds?: {
    [category: string]: number;
  };
  
  /**
   * Operation criticality levels (0-100)
   * Higher criticality operations are blocked first in degraded state
   */
  operationCriticality?: {
    [operationType: string]: number;
  };
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
 * Base interface for a prime registry with required methods
 */
export interface BasePrimeRegistry {
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
 * Interface for a prime registry used in verification
 * Extends the base interface with optional methods
 */
export interface PrimeRegistryForVerification extends BasePrimeRegistry {
  /**
   * Get prime factors of a number
   * Optional: Used for optimization in some verification paths
   */
  getPrimeFactors?(x: bigint): Factor[];
  
  /**
   * Check if a number is prime
   * Optional: Used for validation in some verification paths
   */
  isPrime?(x: bigint): boolean;
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
   * Verify a value with retry for transient failures
   */
  verifyValueWithRetry(
    value: bigint,
    primeRegistry: PrimeRegistryForVerification,
    retryOptions?: RetryOptions
  ): Promise<VerificationResult>;
  
  /**
   * Verify multiple values
   */
  verifyValues(
    values: bigint[],
    primeRegistry: PrimeRegistryForVerification
  ): VerificationResult[];
  
  /**
   * Verify multiple values with retry for transient failures
   */
  verifyValuesWithRetry(
    values: bigint[],
    primeRegistry: PrimeRegistryForVerification,
    retryOptions?: RetryOptions
  ): Promise<VerificationResult[]>;
  
  /**
   * Create an optimized verification function for repeated use
   */
  createOptimizedVerifier(
    primeRegistry: PrimeRegistryForVerification
  ): (value: bigint) => boolean;
  
  /**
   * Create an optimized verification function with retry capability
   */
  createOptimizedVerifierWithRetry(
    primeRegistry: PrimeRegistryForVerification,
    retryOptions?: RetryOptions
  ): (value: bigint) => Promise<boolean>;
  
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
  resetVerification(): void;
  
  /**
   * Clear the verification cache
   */
  clearCache(): void;
  
  /**
   * Get detailed error information
   */
  getErrorDetails(error: Error): Record<string, any>;
  
  /**
   * Log error with detailed information
   */
  logError(error: Error, context?: Record<string, any>): void;
}

/**
 * Extended state for Verification module
 */
export interface VerificationState extends ModelState {
  /**
   * Configuration settings
   */
  config: VerificationOptions;
  
  /**
   * Cache statistics
   */
  cache: {
    size: number;
    hits: number;
    misses: number;
  };
  
  /**
   * Verification status
   */
  status: VerificationStatus;
  
  /**
   * Number of values verified
   */
  verifiedCount: number;
  
  /**
   * Number of valid values
   */
  validCount: number;
  
  /**
   * Number of invalid values
   */
  invalidCount: number;
}

/**
 * Input types for Verification module processing
 */
export interface VerificationProcessInput {
  operation: 'verifyValue' | 'verifyValues' | 'verifyValueWithRetry' | 'verifyValuesWithRetry' |
             'createOptimizedVerifier' | 'createOptimizedVerifierWithRetry' |
             'getStatus' | 'getResults' | 'reset' | 'clearCache' | 'getErrorDetails' | 'logError';
  params: any[];
}

/**
 * Interface extending ModelInterface for Verification module
 */
export interface VerificationModelInterface extends VerificationInterface, ModelInterface {
  /**
   * Get the module state including cache statistics
   */
  getState(): VerificationState;
}
