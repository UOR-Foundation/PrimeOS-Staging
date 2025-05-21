/**
 * Verification Cache Factory
 * ======================
 * 
 * Factory for creating verification caches with different policies.
 * Leverages the precision/cache module for efficient caching.
 */

import { LoggingInterface } from '../../../../os/logging';
import { 
  CacheEvictionPolicy, 
  VerificationCache, 
  VerificationCacheFactory, 
  VerificationCacheOptions,
  VerificationCacheAdvanced,
  VerificationCacheFactoryAdvanced,
  MemoizeFunction,
  MemoizeAsyncFunction,
  mapToCacheOptions
} from './types';
import { createVerificationCacheAdapter } from './adapter';
import { CacheError } from '../errors';
import { VERIFICATION_CONSTANTS } from '../constants';
import { 
  createCache, 
  createLRUCache as createPrecisionLRUCache,
  createLFUCache as createPrecisionLFUCache,
  createTimeBasedCache as createPrecisionTimeBasedCache,
  createCompositeCache as createPrecisionCompositeCache,
  memoize as precisionMemoize,
  memoizeAsync as precisionMemoizeAsync
} from '../../cache';

/**
 * Implementation of cache factory
 */
export class VerificationCacheFactoryImpl implements VerificationCacheFactoryAdvanced {
  private logger?: LoggingInterface;
  
  /**
   * Create a new cache factory
   */
  constructor(logger?: LoggingInterface) {
    this.logger = logger;
  }
  
  /**
   * Create a new cache with the specified options
   */
  createCache<K, V>(options: VerificationCacheOptions): VerificationCacheAdvanced<K, V> {
    if (this.logger) {
      this.logger.debug('Creating cache with options', options).catch(() => {});
    }
    
    // Validate options
    if (options.policy === CacheEvictionPolicy.TIME && !options.ttl) {
      throw new CacheError('TTL must be specified for time-based cache');
    }
    
    // Map verification options to precision/cache options
    const cacheOptions = mapToCacheOptions(options);
    
    // Create cache using precision/cache
    const cache = createCache<K, V>(cacheOptions);
    
    // Initialize the cache
    cache.initialize().catch(error => {
      if (this.logger) {
        this.logger.error('Failed to initialize cache', error).catch(() => {});
      }
    });
    
    // Wrap with adapter
    return createVerificationCacheAdapter(cache, this.logger);
  }
  
  /**
   * Create an LRU cache
   */
  createLRUCache<K, V>(maxSize: number = 1000): VerificationCacheAdvanced<K, V> {
    if (this.logger) {
      this.logger.debug(`Creating LRU cache with max size ${maxSize}`).catch(() => {});
    }
    
    const cache = createPrecisionLRUCache<K, V>(maxSize);
    
    // Initialize the cache
    cache.initialize().catch(error => {
      if (this.logger) {
        this.logger.error('Failed to initialize LRU cache', error).catch(() => {});
      }
    });
    
    return createVerificationCacheAdapter(cache, this.logger);
  }
  
  /**
   * Create an LFU cache
   */
  createLFUCache<K, V>(maxSize: number = 1000): VerificationCacheAdvanced<K, V> {
    if (this.logger) {
      this.logger.debug(`Creating LFU cache with max size ${maxSize}`).catch(() => {});
    }
    
    const cache = createPrecisionLFUCache<K, V>(maxSize);
    
    // Initialize the cache
    cache.initialize().catch(error => {
      if (this.logger) {
        this.logger.error('Failed to initialize LFU cache', error).catch(() => {});
      }
    });
    
    return createVerificationCacheAdapter(cache, this.logger);
  }
  
  /**
   * Create a time-based cache
   */
  createTimeBasedCache<K, V>(maxAge: number, maxSize: number = 1000): VerificationCacheAdvanced<K, V> {
    if (this.logger) {
      this.logger.debug(`Creating time-based cache with max age ${maxAge}ms and max size ${maxSize}`).catch(() => {});
    }
    
    const cache = createPrecisionTimeBasedCache<K, V>(maxAge, maxSize);
    
    // Initialize the cache
    cache.initialize().catch(error => {
      if (this.logger) {
        this.logger.error('Failed to initialize time-based cache', error).catch(() => {});
      }
    });
    
    return createVerificationCacheAdapter(cache, this.logger);
  }
  
  /**
   * Create a composite cache
   */
  createCompositeCache<K, V>(
    strategies: Array<{type: 'lru' | 'lfu' | 'time', weight?: number}>,
    maxSize: number = 1000
  ): VerificationCacheAdvanced<K, V> {
    if (this.logger) {
      this.logger.debug(`Creating composite cache with max size ${maxSize}`).catch(() => {});
    }
    
    const cache = createPrecisionCompositeCache<K, V>(strategies, maxSize);
    
    // Initialize the cache
    cache.initialize().catch(error => {
      if (this.logger) {
        this.logger.error('Failed to initialize composite cache', error).catch(() => {});
      }
    });
    
    return createVerificationCacheAdapter(cache, this.logger);
  }
  
  /**
   * Memoize a function
   */
  memoize: MemoizeFunction = precisionMemoize;
  
  /**
   * Memoize an async function
   */
  memoizeAsync: MemoizeAsyncFunction = precisionMemoizeAsync;
}

/**
 * Create a new cache factory
 */
export function createCacheFactory(logger?: LoggingInterface): VerificationCacheFactoryAdvanced {
  return new VerificationCacheFactoryImpl(logger);
}

/**
 * Create a cache with default options
 */
export function createDefaultCache<K, V>(logger?: LoggingInterface): VerificationCacheAdvanced<K, V> {
  const factory = createCacheFactory(logger);
  
  return factory.createCache<K, V>({
    maxSize: VERIFICATION_CONSTANTS.DEFAULT_CACHE_SIZE,
    policy: CacheEvictionPolicy.LRU
  });
}
