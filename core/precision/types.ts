/**
 * Core Precision Types
 * =================
 * 
 * Core type definitions for the precision module.
 */

/**
 * Represents a prime factor with exponent
 */
export interface Factor {
  /**
   * Prime number
   */
  prime: bigint;
  
  /**
   * Exponent of the prime
   */
  exponent: number;
}

/**
 * Options for precision operations
 */
export interface PrecisionOptions {
  /**
   * Whether to throw on overflow
   */
  throwOnOverflow?: boolean;
  
  /**
   * Whether to use native JS operations when possible
   */
  useNative?: boolean;
  
  /**
   * Whether to cache intermediate results
   */
  enableCache?: boolean;
}

/**
 * Configuration for the precision module
 */
export interface PrecisionConfig {
  /**
   * Enable debugging output
   */
  debug?: boolean;
  
  /**
   * Enable caching for expensive operations
   */
  enableCaching?: boolean;
  
  /**
   * Use Python-compatible modular arithmetic
   */
  pythonCompatible?: boolean;
  
  /**
   * Power (exponent) to use for checksums
   */
  checksumPower?: number;
}

/**
 * Interface for the precision module
 */
export interface PrecisionInterface {
  /**
   * Configuration for this instance
   */
  config: PrecisionConfig;
  
  /**
   * BigInt module
   */
  bigint: any;
  
  /**
   * Modular arithmetic module
   */
  modular: any;
  
  /**
   * Checksums module
   */
  checksums: any;
  
  /**
   * Verification module
   */
  verification: any;
  
  /**
   * Utility functions
   */
  utils: any;
  
  /**
   * Math utilities
   */
  MathUtilities: any;
}

/**
 * Result of a precision operation
 */
export interface PrecisionResult<T> {
  /**
   * Result value
   */
  value: T;
  
  /**
   * Operation status
   */
  status: PrecisionStatus;
  
  /**
   * Whether the result is valid
   */
  valid: boolean;
  
  /**
   * Error message if any
   */
  error?: string;
}

/**
 * Status of a precision operation
 */
export enum PrecisionStatus {
  /**
   * Operation succeeded
   */
  SUCCESS = 'success',
  
  /**
   * Operation failed due to error
   */
  ERROR = 'error',
  
  /**
   * Operation result has reduced precision
   */
  PRECISION_LOSS = 'precision_loss',
  
  /**
   * Operation result is approximate
   */
  APPROXIMATE = 'approximate',
  
  /**
   * Operation encountered overflow
   */
  OVERFLOW = 'overflow',
  
  /**
   * Operation encountered underflow
   */
  UNDERFLOW = 'underflow'
}

/**
 * Constants used in precision operations
 */
export const PRECISION_CONSTANTS = {
  /**
   * Maximum safe integer in JavaScript as a number
   */
  MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
  
  /**
   * Minimum safe integer in JavaScript as a number
   */
  MIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
  
  /**
   * Maximum safe integer in JavaScript as a BigInt
   */
  MAX_SAFE_BIGINT: BigInt(Number.MAX_SAFE_INTEGER),
  
  /**
   * Minimum safe integer in JavaScript as a BigInt
   */
  MIN_SAFE_BIGINT: BigInt(Number.MIN_SAFE_INTEGER),
  
  /**
   * Default power (exponent) to use for checksums
   */
  DEFAULT_CHECKSUM_POWER: 6
};
