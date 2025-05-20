/**
 * Mathematical Utility Constants
 * ===========================
 * 
 * Constants used in mathematical utility operations.
 */

/**
 * Constants used in mathematical utility operations
 */
export const UTILS_CONSTANTS = {
  /**
   * Maximum bit size for using native implementation without overflow concerns
   */
  MAX_NATIVE_BITS: 50,
  
  /**
   * Default cache size for utility operations
   */
  DEFAULT_CACHE_SIZE: 1000,
  
  /**
   * Maximum supported bit length for operations
   * Operations beyond this size may cause performance issues
   */
  MAX_SUPPORTED_BITS: 4096,

  /**
   * Maximum memory size for caches (in bytes)
   * Default: 50MB
   */
  MAX_CACHE_MEMORY: 50 * 1024 * 1024,
  
  /**
   * Threshold for using optimized algorithms
   */
  OPTIMIZATION_THRESHOLD: 1000
};
