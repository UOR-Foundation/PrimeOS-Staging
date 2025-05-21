/**
 * Verification-specific error types
 * ==============================
 *
 * Specialized error types for the verification module.
 */

/**
 * Base class for all verification errors
 */
export class VerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VerificationError';
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends VerificationError {
  constructor(message: string, public value?: any) {
    super(`Validation Error: ${message}${value !== undefined ? ` (${value})` : ''}`);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when checksum verification fails
 */
export class ChecksumMismatchError extends VerificationError {
  constructor(
    message: string, 
    public expected: bigint, 
    public actual: bigint
  ) {
    super(`Checksum Mismatch: ${message} (expected: ${expected}, actual: ${actual})`);
    this.name = 'ChecksumMismatchError';
  }
}

/**
 * Error thrown when prime registry operations fail
 */
export class PrimeRegistryError extends VerificationError {
  constructor(message: string) {
    super(`Prime Registry Error: ${message}`);
    this.name = 'PrimeRegistryError';
  }
}

/**
 * Error thrown when cache operations fail
 */
export class CacheError extends VerificationError {
  constructor(message: string) {
    super(`Cache Error: ${message}`);
    this.name = 'CacheError';
  }
}

/**
 * Error thrown when a transient failure occurs that might succeed on retry
 */
export class TransientError extends VerificationError {
  constructor(message: string, public retryable: boolean = true) {
    super(`Transient Error: ${message}${retryable ? ' (retryable)' : ''}`);
    this.name = 'TransientError';
  }
}

/**
 * Helper functions to create specific error types
 */

export function createValidationError(message: string, value?: any): ValidationError {
  return new ValidationError(message, value);
}

export function createChecksumMismatchError(
  message: string, 
  expected: bigint, 
  actual: bigint
): ChecksumMismatchError {
  return new ChecksumMismatchError(message, expected, actual);
}

export function createPrimeRegistryError(message: string): PrimeRegistryError {
  return new PrimeRegistryError(message);
}

export function createCacheError(message: string): CacheError {
  return new CacheError(message);
}

export function createTransientError(message: string, retryable: boolean = true): TransientError {
  return new TransientError(message, retryable);
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryableErrors?: Array<new (...args: any[]) => Error>;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 1000,
    backoffFactor = 2,
    retryableErrors = [TransientError]
  } = options;
  
  let lastError: Error;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      const isRetryable = retryableErrors.some(errorType => error instanceof errorType) ||
                          (error instanceof TransientError && error.retryable);
      
      if (!isRetryable || attempt >= maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt (with max limit)
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError!;
}
