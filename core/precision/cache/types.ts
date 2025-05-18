/**
 * Cache Types
 * =====
 * 
 * Type definitions for the cache module.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState,
  ModelLifecycleState
} from '../../../os/model/types';
import { LoggingInterface } from '../../../os/logging';

/**
 * Cache options extending model options
 */
export interface CacheOptions<K = any, V = any> extends ModelOptions {
  /**
   * Maximum size of the cache
   */
  maxSize?: number;
  
  /**
   * Maximum age of items in milliseconds before expiration
   */
  maxAge?: number;
  
  /**
   * Whether to collect metrics
   */
  metrics?: boolean;
  
  /**
   * Eviction strategy to use
   */
  strategy?: 'lru' | 'lfu' | 'time' | 'composite';
  
  /**
   * Custom strategy configuration
   */
  strategyOptions?: Record<string, any>;
}

/**
 * Options for setting cache entries
 */
export interface SetOptions {
  /**
   * Time-to-live in milliseconds
   */
  ttl?: number;
  
  /**
   * Priority for certain strategies
   */
  priority?: number;
}

/**
 * Cache entry metadata
 */
export interface CacheEntryMetadata {
  /**
   * When the entry was created
   */
  created: number;
  
  /**
   * When the entry was last accessed
   */
  lastAccessed: number;
  
  /**
   * When the entry expires (if applicable)
   */
  expires?: number;
  
  /**
   * How many times the entry has been accessed
   */
  accessCount: number;
  
  /**
   * Custom metadata for strategy use
   */
  custom?: Record<string, any>;
}

/**
 * Cache metrics
 */
export interface CacheMetrics {
  /**
   * Number of cache hits
   */
  hitCount: number;
  
  /**
   * Number of cache misses
   */
  missCount: number;
  
  /**
   * Hit rate (hits / total)
   */
  hitRate: number;
  
  /**
   * Number of evictions
   */
  evictionCount: number;
  
  /**
   * Number of expirations
   */
  expirationCount: number;
  
  /**
   * Average access time in milliseconds
   */
  averageAccessTime: number;
  
  /**
   * Current cache size
   */
  currentSize: number;
  
  /**
   * Maximum cache size
   */
  maxSize: number;
}

/**
 * Cache state extending model state
 */
export interface CacheState<K = any, V = any> extends ModelState {
  /**
   * Configuration settings
   */
  config: CacheOptions<K, V>;
  
  /**
   * Cache metrics
   */
  metrics: CacheMetrics;
}

/**
 * Cache interface for all cache implementations
 */
export interface CacheInterface<K = any, V = any> {
  /**
   * Get a value from the cache
   */
  get(key: K): V | undefined;
  
  /**
   * Set a value in the cache
   */
  set(key: K, value: V, options?: SetOptions): void;
  
  /**
   * Check if key exists in cache
   */
  has(key: K): boolean;
  
  /**
   * Delete a key from the cache
   */
  delete(key: K): boolean;
  
  /**
   * Clear the entire cache
   */
  clear(): void;
  
  /**
   * Get cache metrics
   */
  getMetrics?(): CacheMetrics;
  
  /**
   * Optimize the cache (prune expired entries, etc.)
   */
  optimize?(): void;
  
  /**
   * Set maximum size
   */
  setMaxSize?(size: number): void;
  
  /**
   * Set maximum age
   */
  setMaxAge?(ms: number): void;
  
  /**
   * Access the module logger
   */
  getLogger(): LoggingInterface;
}

/**
 * Cache model interface extending model interface
 */
export interface CacheModelInterface<K = any, V = any> extends ModelInterface, CacheInterface<K, V> {
  /**
   * Get the cache state
   */
  getState(): CacheState<K, V>;
}

/**
 * Cache process input for operation requests
 */
export interface CacheProcessInput<K = any, V = any> {
  /**
   * Operation to perform
   */
  operation: 'get' | 'set' | 'has' | 'delete' | 'clear' | 'getMetrics' | 'optimize' | 'setMaxSize' | 'setMaxAge';
  
  /**
   * Key for the operation
   */
  key?: K;
  
  /**
   * Value for set operations
   */
  value?: V;
  
  /**
   * Options for set operations
   */
  options?: SetOptions;
  
  /**
   * Numeric parameter for setMaxSize/setMaxAge
   */
  param?: number;
}

/**
 * Result of cache operations
 */
export type CacheResult<T = unknown> = ModelResult<T>;
