/**
 * Modular Arithmetic Constants
 * ===========================
 * 
 * Constants used in modular arithmetic operations.
 */

/**
 * Constants used in modular arithmetic operations
 */
export const MODULAR_CONSTANTS = {
  /**
   * Maximum bit size for using native implementation without overflow concerns
   */
  MAX_NATIVE_BITS: 50,
  
  /**
   * Default cache size for modular operations
   */
  DEFAULT_CACHE_SIZE: 1000,
  
  /**
   * Maximum supported bit length for modular operations
   * Operations beyond this size may cause performance issues
   */
  MAX_SUPPORTED_BITS: 4096,

  /**
   * Maximum memory size for caches (in bytes)
   * Default: 50MB
   */
  MAX_CACHE_MEMORY: 50 * 1024 * 1024,

  /**
   * Maximum exponent bit size
   * Exponents larger than this may cause excessive computation time
   */
  MAX_EXPONENT_BITS: 10000
};
