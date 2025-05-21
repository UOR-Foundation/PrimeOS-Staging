/**
 * Verification Cache Types
 * =====================
 * 
 * Type definitions for verification cache.
 * Leverages the precision/cache module for efficient caching.
 */

import { 
  CacheOptions, 
  CacheInterface, 
  CacheModelInterface, 
  CacheMetrics,
  CacheEntryMetadata,
  CacheState
} from '../../cache';
import { LoggingInterface } from '../../../../os/logging';
import { ModelResult } from '../../../../os/model';

/**
 * Cache eviction policy
 */
export enum CacheEvictionPolicy {
  LRU = 'lru',       // Least Recently Used
  LFU = 'lfu',       // Least Frequently Used
  FIFO = 'fifo',     // First In, First Out
  TIME = 'time'      // Time-based expiration
}

/**
 * Cache options
 */
export interface VerificationCacheOptions {
  /**
   * Maximum cache size
   */
  maxSize: number;
  
  /**
   * Eviction policy
   */
  policy: CacheEvictionPolicy;
  
  /**
   * Time-to-live for cache entries (ms)
   */
  ttl?: number;
  
  /**
   * Whether to collect metrics
   */
  metrics?: boolean;
}

/**
 * Maps VerificationCacheOptions to CacheOptions
 */
export function mapToCacheOptions(options: VerificationCacheOptions): CacheOptions {
  return {
    maxSize: options.maxSize,
    maxAge: options.ttl,
    metrics: options.metrics,
    strategy: mapEvictionPolicyToStrategy(options.policy),
    strategyOptions: options.policy === CacheEvictionPolicy.TIME ? { ttl: options.ttl } : undefined
  };
}

/**
 * Maps CacheEvictionPolicy to precision/cache strategy
 */
export function mapEvictionPolicyToStrategy(policy: CacheEvictionPolicy): 'lru' | 'lfu' | 'time' | 'composite' {
  switch (policy) {
    case CacheEvictionPolicy.LRU: return 'lru';
    case CacheEvictionPolicy.LFU: return 'lfu';
    case CacheEvictionPolicy.FIFO: return 'lru'; // Map FIFO to LRU for now
    case CacheEvictionPolicy.TIME: return 'time';
    default: return 'lru'; // Default
  }
}

/**
 * Cache entry
 */
export interface CacheEntry<V> {
  /**
   * Cached value
   */
  value: V;
  
  /**
   * Creation timestamp
   */
  created: number;
  
  /**
   * Last access timestamp
   */
  lastAccessed: number;
  
  /**
   * Access count
   */
  accessCount: number;
}

/**
 * Cache interface
 */
export interface VerificationCache<K, V> {
  /**
   * Get a value from the cache
   */
  get(key: K): V | undefined;
  
  /**
   * Set a value in the cache
   */
  set(key: K, value: V, options?: any): void;
  
  /**
   * Check if a key exists in the cache
   */
  has(key: K): boolean;
  
  /**
   * Delete a key from the cache
   */
  delete(key: K): boolean;
  
  /**
   * Clear the cache
   */
  clear(): void;
  
  /**
   * Get cache size
   */
  size(): number;
  
  /**
   * Get cache metrics
   */
  getMetrics(): {
    hits: number;
    misses: number;
    size: number;
  };
}

/**
 * Advanced cache interface with additional features from precision/cache
 */
export interface VerificationCacheAdvanced<K, V> extends VerificationCache<K, V> {
  /**
   * Get detailed cache metrics
   */
  getDetailedMetrics(): CacheMetrics;
  
  /**
   * Optimize the cache by removing expired entries
   */
  optimize(): void;
  
  /**
   * Set maximum cache size
   */
  setMaxSize(size: number): void;
  
  /**
   * Set maximum age for entries
   */
  setMaxAge(ms: number): void;
  
  /**
   * Get the underlying cache model
   */
  getUnderlyingCache(): CacheModelInterface<K, V>;
  
  /**
   * Get the cache state
   */
  getState(): CacheState<K, V>;
  
  /**
   * Get the logger
   */
  getLogger(): LoggingInterface;
  
  /**
   * Initialize the cache
   */
  initialize(): Promise<ModelResult>;
  
  /**
   * Reset the cache
   */
  reset(): Promise<ModelResult>;
  
  /**
   * Terminate the cache
   */
  terminate(): Promise<ModelResult>;
  
  /**
   * Process a cache operation
   */
  process<T = any, R = any>(input: T): Promise<ModelResult<R>>;
}

/**
 * Memoization function type
 */
export type MemoizeFunction = <T extends (...args: any[]) => any>(
  fn: T,
  options?: Partial<CacheOptions<string, ReturnType<T>>>
) => T;

/**
 * Async memoization function type
 */
export type MemoizeAsyncFunction = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: Partial<CacheOptions<string, Awaited<ReturnType<T>>>>
) => T;

/**
 * Advanced cache factory interface with additional features
 */
export interface VerificationCacheFactoryAdvanced extends VerificationCacheFactory {
  /**
   * Create an LRU cache
   */
  createLRUCache<K, V>(maxSize?: number): VerificationCacheAdvanced<K, V>;
  
  /**
   * Create an LFU cache
   */
  createLFUCache<K, V>(maxSize?: number): VerificationCacheAdvanced<K, V>;
  
  /**
   * Create a time-based cache
   */
  createTimeBasedCache<K, V>(maxAge: number, maxSize?: number): VerificationCacheAdvanced<K, V>;
  
  /**
   * Create a composite cache
   */
  createCompositeCache<K, V>(
    strategies: Array<{type: 'lru' | 'lfu' | 'time', weight?: number}>,
    maxSize?: number
  ): VerificationCacheAdvanced<K, V>;
  
  /**
   * Memoize a function
   */
  memoize: MemoizeFunction;
  
  /**
   * Memoize an async function
   */
  memoizeAsync: MemoizeAsyncFunction;
}

/**
 * Cache factory interface
 */
export interface VerificationCacheFactory {
  /**
   * Create a new cache
   */
  createCache<K, V>(options: VerificationCacheOptions): VerificationCacheAdvanced<K, V>;
}
