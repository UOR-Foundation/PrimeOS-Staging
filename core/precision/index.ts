/**
 * Precision Module - Main Entry Point
 * ===================================
 *
 * This file is the main entry point for the precision module, which provides
 * mathematical operations with enhanced precision for the PrimeOS ecosystem.
 */

// Import utils module (this needs to be first as others may depend on it)
import * as utilsModule from './utils';
export {
  // Utility functions
  bitLength as utilBitLength,
  exactlyEquals as utilExactlyEquals,
  toByteArray as utilToByteArray,
  fromByteArray as utilFromByteArray,
  isSafeInteger,
  sign,
  abs,
  isPowerOfTwo,
  // Class and factory
  MathUtils,
  createMathUtils
} from './utils';

// Import and re-export from the bigint module
import * as bigintModule from './bigint';
export {
  // Core BigInt operations
  BIGINT_CONSTANTS,
  BigIntOperations,
  bitLength,
  exactlyEquals,
  toByteArray,
  fromByteArray,
  getRandomBigInt,
  isProbablePrime,
  countLeadingZeros,
  countTrailingZeros,
  getBit,
  setBit
} from './bigint';

// Import and re-export from the modular module
import * as modularModule from './modular';
export {
  // Core modular operations
  mod,
  modPow,
  modInverse
} from './modular';

// Import and re-export from the checksums module
import * as checksumsModule from './checksums';
export {
  // Checksum operations
  ChecksumsImplementation,
  calculateChecksum,
  extractFactorsAndChecksum,
  attachChecksum,
  calculateBatchChecksum
} from './checksums';

// Import and re-export from the verification module
import * as verificationModule from './verification';
export {
  // Verification operations
  verifyValue,
  createOptimizedVerifier,
  createVerification,
  VerificationStatus,
  
  // Verification cache operations
  VerificationCache,
  VerificationCacheAdvanced,
  VerificationCacheFactory,
  VerificationCacheFactoryAdvanced,
  CacheEvictionPolicy,
  createCacheFactory,
  createDefaultCache
} from './verification';

// Import and re-export common types
export * from './types';

/**
 * Create a unified math utilities object that combines all functionality
 */
export const MathUtilities = {
  // BigInt operations
  bitLength: bigintModule.bitLength,
  exactlyEquals: bigintModule.exactlyEquals,
  toByteArray: bigintModule.toByteArray,
  fromByteArray: bigintModule.fromByteArray,
  getRandomBigInt: bigintModule.getRandomBigInt,
  isProbablePrime: bigintModule.isProbablePrime,
  
  // Modular arithmetic
  mod: modularModule.mod,
  modPow: modularModule.modPow,
  modInverse: modularModule.modInverse,
  
  // Checksum operations
  calculateChecksum: checksumsModule.calculateChecksum,
  verifyChecksum: (value: bigint, primeRegistry: any) => {
    try {
      verificationModule.verifyValue(value, primeRegistry);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  // Cache operations
  createCache: (options: any) => {
    return verificationModule.createCacheFactory().createCache(options);
  },
  memoize: <T extends (...args: any[]) => any>(fn: T, options?: any) => {
    return verificationModule.createCacheFactory().memoize(fn, options);
  },
  memoizeAsync: <T extends (...args: any[]) => Promise<any>>(fn: T, options?: any) => {
    return verificationModule.createCacheFactory().memoizeAsync(fn, options);
  },
  
  // Utility operations
  utilBitLength: utilsModule.bitLength,
  utilExactlyEquals: utilsModule.exactlyEquals,
  utilToByteArray: utilsModule.toByteArray,
  utilFromByteArray: utilsModule.fromByteArray,
  isSafeInteger: utilsModule.isSafeInteger,
  sign: utilsModule.sign,
  abs: utilsModule.abs,
  isPowerOfTwo: utilsModule.isPowerOfTwo
};

/**
 * PrecisionConfiguration contains all options for the precision module
 */
export interface PrecisionConfiguration {
  /**
   * Debug mode will log extra information
   */
  debug?: boolean;
  
  /**
   * Enable caching for improved performance
   */
  enableCaching?: boolean;
  
  /**
   * Match Python's modular arithmetic semantics exactly
   */
  pythonCompatible?: boolean;
  
  /**
   * Checksum power (exponent) to use for checksums
   */
  checksumPower?: number;
  
  /**
   * Cache size for verification and other caching operations
   */
  cacheSize?: number;
  
  /**
   * Cache eviction policy
   */
  cachePolicy?: 'lru' | 'lfu' | 'fifo' | 'time';
  
  /**
   * Time-to-live for cache entries (ms)
   */
  cacheTTL?: number;
}

/**
 * Create a precision module with the specified configuration
 */
export function createPrecision(config: PrecisionConfiguration = {}) {
  // Initialize cache if cache configuration is provided
  let cache;
  
  if (config.cacheSize || config.cachePolicy || config.cacheTTL) {
    // Create cache options based on configuration
    const cacheOptions: any = {
      maxSize: config.cacheSize || 1000,
      policy: config.cachePolicy === 'lru' ? 'lru' :
              config.cachePolicy === 'lfu' ? 'lfu' :
              config.cachePolicy === 'fifo' ? 'fifo' :
              config.cachePolicy === 'time' ? 'time' : 'lru'
    };
    
    // Add TTL if specified
    if (config.cacheTTL) {
      cacheOptions.ttl = config.cacheTTL;
    }
    
    // Create a cache factory with the specified options
    const cacheFactory = verificationModule.createCacheFactory();
    
    // Create a default cache with the specified options
    cache = cacheFactory.createCache(cacheOptions);
  }
  
  // Create a unified interface that includes all operations
  return {
    // Include all modules
    bigint: bigintModule,
    modular: modularModule,
    checksums: checksumsModule,
    verification: verificationModule,
    utils: utilsModule,
    
    // Include the consolidated utilities
    MathUtilities,
    
    // Include cache if created
    cache,
    
    // Provide module configuration
    config
  };
}

/**
 * Default precision module instance with standard configuration
 */
export const precision = createPrecision();

/**
 * Return the version of the precision module
 */
export function getVersion(): string {
  return "1.0.0";
}
