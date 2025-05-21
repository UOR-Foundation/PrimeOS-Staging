/**
 * Verification Cache Adapter
 * ======================
 * 
 * Adapter that implements VerificationCache interface but uses precision/cache.
 * Provides advanced features from the precision/cache module.
 */

import { LoggingInterface } from '../../../../os/logging';
import { ModelResult } from '../../../../os/model';
import { 
  CacheModelInterface, 
  CacheMetrics,
  CacheState,
  SetOptions
} from '../../cache';
import { VerificationCache, VerificationCacheAdvanced } from './types';

/**
 * Adapter that implements VerificationCache interface but uses precision/cache
 */
export class VerificationCacheAdapter<K, V> implements VerificationCacheAdvanced<K, V> {
  private cache: CacheModelInterface<K, V>;
  private logger?: LoggingInterface;
  
  /**
   * Create a new verification cache adapter
   */
  constructor(cache: CacheModelInterface<K, V>, logger?: LoggingInterface) {
    this.cache = cache;
    this.logger = logger;
    
    if (this.logger) {
      this.logger.debug('Created verification cache adapter').catch(() => {});
    }
  }
  
  /**
   * Get a value from the cache
   */
  get(key: K): V | undefined {
    return this.cache.get(key);
  }
  
  /**
   * Set a value in the cache
   */
  set(key: K, value: V, options?: SetOptions): void {
    this.cache.set(key, value, options);
  }
  
  /**
   * Check if a key exists in the cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  /**
   * Delete a key from the cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache size
   */
  size(): number {
    const metrics = this.cache.getMetrics?.();
    return metrics ? metrics.currentSize : 0;
  }
  
  /**
   * Get cache metrics
   */
  getMetrics(): { hits: number; misses: number; size: number } {
    const metrics = this.cache.getMetrics?.() || { 
      hitCount: 0, 
      missCount: 0, 
      currentSize: 0 
    };
    
    return {
      hits: metrics.hitCount,
      misses: metrics.missCount,
      size: metrics.currentSize
    };
  }
  
  /**
   * Get detailed cache metrics
   * Advanced feature from precision/cache
   */
  getDetailedMetrics(): CacheMetrics {
    return this.cache.getMetrics?.() || {
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      expirationCount: 0,
      averageAccessTime: 0,
      currentSize: 0,
      maxSize: 0
    };
  }
  
  /**
   * Optimize the cache by removing expired entries
   * Advanced feature from precision/cache
   */
  optimize(): void {
    this.cache.optimize?.();
  }
  
  /**
   * Set maximum cache size
   * Advanced feature from precision/cache
   */
  setMaxSize(size: number): void {
    this.cache.setMaxSize?.(size);
  }
  
  /**
   * Set maximum age for entries
   * Advanced feature from precision/cache
   */
  setMaxAge(ms: number): void {
    this.cache.setMaxAge?.(ms);
  }
  
  /**
   * Get the underlying cache model
   * Advanced feature for direct access to precision/cache
   */
  getUnderlyingCache(): CacheModelInterface<K, V> {
    return this.cache;
  }
  
  /**
   * Get the cache state
   * Advanced feature from precision/cache
   */
  getState(): CacheState<K, V> {
    return this.cache.getState();
  }
  
  /**
   * Get the logger
   * Advanced feature from precision/cache
   */
  getLogger(): LoggingInterface {
    return this.cache.getLogger();
  }
  
  /**
   * Initialize the cache
   * Advanced feature from precision/cache
   */
  initialize(): Promise<ModelResult> {
    return this.cache.initialize();
  }
  
  /**
   * Reset the cache
   * Advanced feature from precision/cache
   */
  reset(): Promise<ModelResult> {
    return this.cache.reset();
  }
  
  /**
   * Terminate the cache
   * Advanced feature from precision/cache
   */
  terminate(): Promise<ModelResult> {
    return this.cache.terminate();
  }
  
  /**
   * Process a cache operation
   * Advanced feature from precision/cache
   */
  process<T = any, R = any>(input: T): Promise<ModelResult<R>> {
    return this.cache.process(input);
  }
}

/**
 * Create a verification cache adapter
 */
export function createVerificationCacheAdapter<K, V>(
  cache: CacheModelInterface<K, V>,
  logger?: LoggingInterface
): VerificationCacheAdvanced<K, V> {
  return new VerificationCacheAdapter<K, V>(cache, logger);
}
