/**
 * Verification LRU Cache Policy
 * =========================
 * 
 * Implementation of Least Recently Used (LRU) cache eviction policy.
 */

import { LoggingInterface } from '../../../../../os/logging';
import { CacheEntry, VerificationCache } from '../types';
import { CacheError } from '../../errors';

/**
 * LRU Cache implementation
 */
export class LRUCache<K, V> implements VerificationCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private keyOrder: K[];
  private maxSize: number;
  private hits: number;
  private misses: number;
  private logger?: LoggingInterface;
  
  /**
   * Create a new LRU cache
   */
  constructor(maxSize: number, logger?: LoggingInterface) {
    this.cache = new Map<K, CacheEntry<V>>();
    this.keyOrder = [];
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
    this.logger = logger;
    
    if (this.logger) {
      this.logger.debug(`Created LRU cache with max size ${maxSize}`).catch(() => {});
    }
  }
  
  /**
   * Get a value from the cache
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      
      if (this.logger) {
        this.logger.debug(`Cache miss for key: ${String(key)}`).catch(() => {});
      }
      
      return undefined;
    }
    
    // Update access information
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    
    // Move key to the end (most recently used)
    this.keyOrder = this.keyOrder.filter(k => k !== key);
    this.keyOrder.push(key);
    
    this.hits++;
    
    if (this.logger) {
      this.logger.debug(`Cache hit for key: ${String(key)}`).catch(() => {});
    }
    
    return entry.value;
  }
  
  /**
   * Set a value in the cache
   */
  set(key: K, value: V): void {
    const now = Date.now();
    
    // If key exists, update its position in keyOrder
    if (this.cache.has(key)) {
      this.keyOrder = this.keyOrder.filter(k => k !== key);
      
      // Update the entry
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.lastAccessed = now;
      entry.accessCount++;
    } 
    // If at capacity, remove least recently used item
    else if (this.keyOrder.length === this.maxSize) {
      const lruKey = this.keyOrder.shift();
      if (lruKey !== undefined) {
        this.cache.delete(lruKey);
        
        if (this.logger) {
          this.logger.debug(`Evicted LRU key: ${String(lruKey)}`).catch(() => {});
        }
      }
    }
    
    // Add new entry
    this.cache.set(key, {
      value,
      created: now,
      lastAccessed: now,
      accessCount: 0
    });
    
    // Add key to the end (most recently used)
    this.keyOrder.push(key);
    
    if (this.logger) {
      this.logger.debug(`Set key in cache: ${String(key)}`).catch(() => {});
    }
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
    if (!this.cache.has(key)) {
      return false;
    }
    
    // Remove from cache
    this.cache.delete(key);
    
    // Remove from key order
    this.keyOrder = this.keyOrder.filter(k => k !== key);
    
    if (this.logger) {
      this.logger.debug(`Deleted key from cache: ${String(key)}`).catch(() => {});
    }
    
    return true;
  }
  
  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.keyOrder = [];
    
    if (this.logger) {
      this.logger.debug('Cache cleared').catch(() => {});
    }
  }
  
  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Get cache metrics
   */
  getMetrics(): { hits: number; misses: number; size: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size
    };
  }
}

/**
 * Create a new LRU cache
 */
export function createLRUCache<K, V>(
  maxSize: number,
  logger?: LoggingInterface
): VerificationCache<K, V> {
  if (maxSize <= 0) {
    throw new CacheError('Cache size must be positive');
  }
  
  return new LRUCache<K, V>(maxSize, logger);
}
