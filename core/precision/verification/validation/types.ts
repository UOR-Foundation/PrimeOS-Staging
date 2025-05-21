/**
 * Verification Validation Types
 * =========================
 * 
 * Type definitions for verification validation.
 */

import { 
  PrimeRegistryForVerification, 
  RetryOptions, 
  VerificationOptions 
} from '../types';

/**
 * Validation result
 */
export interface ValidationResult {
  /**
   * Whether validation passed
   */
  valid: boolean;
  
  /**
   * Error message if validation failed
   */
  error?: string;
  
  /**
   * Additional error details
   */
  details?: Record<string, any>;
}

/**
 * Validator interface
 */
export interface Validator<T> {
  /**
   * Validate a value
   */
  validate(value: T): ValidationResult;
  
  /**
   * Validate and throw if invalid
   */
  validateAndThrow(value: T): void;
}

/**
 * Validation factory interface
 */
export interface ValidationFactory {
  /**
   * Create a validator for bigint values
   */
  createBigIntValidator(): Validator<bigint>;
  
  /**
   * Create a validator for prime registry
   */
  createPrimeRegistryValidator(): Validator<PrimeRegistryForVerification>;
  
  /**
   * Create a validator for retry options
   */
  createRetryOptionsValidator(): Validator<RetryOptions>;
  
  /**
   * Create a validator for verification options
   */
  createVerificationOptionsValidator(): Validator<VerificationOptions>;
}
