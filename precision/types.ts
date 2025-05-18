/**
 * Precision Module - Type Definitions
 * ===================================
 *
 * Core type definitions for the precision-focused mathematical operations.
 * These types provide the foundation for mathematically exact operations
 * with large integers and modular arithmetic.
 */

/**
 * Factor type for prime factorization
 */
export interface Factor {
  /**
   * The prime number
   */
  prime: bigint;
  
  /**
   * How many times this prime appears in the factorization
   */
  exponent: number;
}

/**
 * Options for precision-enhanced modular operations
 */
export interface ModularOptions {
  /**
   * Force results to match Python's behavior exactly
   * May impact performance but ensures perfect compatibility
   */
  pythonCompatible?: boolean;

  /**
   * Apply correction for JavaScript's numeric precision issues
   */
  applyPrecisionCorrection?: boolean;
}

/**
 * Options for Number Theoretic Transform operations
 */
export interface NTTOptions {
  /**
   * Whether to apply error correction for roundtrip transforms
   */
  correctRoundtrip?: boolean;

  /**
   * Custom modulus for the NTT transform
   */
  customModulus?: number | bigint;

  /**
   * Custom primitive root for the NTT transform
   */
  customRoot?: number | bigint;
}

/**
 * Options for verification operations
 */
export interface VerificationOptions {
  /**
   * Apply tolerance for verification
   * Useful for handling JavaScript's numeric precision
   */
  tolerance?: number;

  /**
   * Allow fallback verification methods
   */
  allowFallbacks?: boolean;

  /**
   * If true, will halt verification on first integrity failure
   * If false, will continue and report all failures
   */
  failFast?: boolean;
}

/**
 * Result of checksum verification
 */
export interface VerificationResult {
  /**
   * Core factors extracted from the value
   */
  coreFactors: Factor[];

  /**
   * Checksum prime
   */
  checksum: bigint;

  /**
   * Whether verification succeeded
   */
  valid: boolean;

  /**
   * Detailed error information if verification failed
   */
  error?: {
    expected: bigint;
    actual: bigint;
    message: string;
  };
}

/**
 * Result of a spectrum analysis operation
 */
export interface SpectrumAnalysis {
  /**
   * Frequency components
   */
  frequencies: number[];

  /**
   * Amplitude of each frequency component
   */
  amplitudes: number[];

  /**
   * Dominant frequency (excluding DC component)
   */
  dominantFrequency: number;

  /**
   * Spectral entropy
   */
  entropy: number;

  /**
   * Whether the spectrum is approximately uniform
   */
  isUniform: boolean;
}

/**
 * Status constants for verification operations
 */
export enum VerificationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  UNKNOWN = 'unknown'
}

/**
 * Context for verification operations
 */
export interface VerificationContext {
  /**
   * Tolerance for numeric comparisons
   */
  tolerance?: number;
  
  /**
   * Error message if verification fails
   */
  errorMessage?: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Conversion utilities for different numeric representations
 */
export interface NumericConverter {
  /**
   * Convert BigInt to Number safely
   */
  toNumber(value: bigint): number;

  /**
   * Convert Number to BigInt
   */
  toBigInt(value: number): bigint;
}
