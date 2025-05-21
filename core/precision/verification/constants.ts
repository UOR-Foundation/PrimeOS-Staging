/**
 * Verification Constants
 * =====================
 * 
 * Constants used in verification operations.
 */

/**
 * Constants used in verification operations
 */
export const VERIFICATION_CONSTANTS = {
  /**
   * Default cache size for verification operations
   */
  DEFAULT_CACHE_SIZE: 1000,
  
  /**
   * Default rate limit (operations per second)
   */
  DEFAULT_RATE_LIMIT: 10000,
  
  /**
   * Default circuit breaker failure threshold
   */
  DEFAULT_FAILURE_THRESHOLD: 5,
  
  /**
   * Default circuit breaker reset timeout (ms)
   */
  DEFAULT_RESET_TIMEOUT: 30000,
  
  /**
   * Default retry options
   */
  DEFAULT_RETRY_OPTIONS: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 1000,
    backoffFactor: 2
  },
  
  /**
   * Maximum memory size for caches (in bytes)
   * Default: 50MB
   */
  MAX_CACHE_MEMORY: 50 * 1024 * 1024,
  
  /**
   * Default time-to-live for cache entries (ms)
   * Default: 1 hour
   */
  DEFAULT_CACHE_TTL: 60 * 60 * 1000,
  
  /**
   * Default rate limit burst size
   */
  DEFAULT_RATE_LIMIT_BURST: 100,
  
  /**
   * Default circuit breaker half-open success threshold
   */
  DEFAULT_HALF_OPEN_SUCCESS_THRESHOLD: 1
};
