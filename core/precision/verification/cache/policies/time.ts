/**
 * Verification Time-Based Cache Policy
 * ================================
 * 
 * Implementation of time-based cache eviction policy.
 */

import { LoggingInterface } from '../../../../../os/logging';
import { CacheEntry, VerificationCache } from '../types';
import { CacheError } from '../../errors';

/**
 * Time-based Cache implementation
 */
export class TimeCache<K, V> implements VerificationCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private ttl: number;
  private maxSize: number;
  private hits: number;
  private misses: number;
  private logger?: LoggingInterface;
  private cleanupInterval?: NodeJS.Timeout;
  
  /**
   * Create a new time-based cache
   */
  constructor(maxSize: number, ttl: number, logger?: LoggingInterface) {
    this.cache = new Map<K, CacheEntry<V>>();
    this.ttl = ttl;
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
    this.logger = logger;
    
    // Set up periodic cleanup
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), Math.min(ttl, 60000));
    }
    
    if (this.logger) {
      this.logger.debug(`Created time-based cache with max size ${maxSize} and TTL ${ttl}ms`).catch(() => {});
    }
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.created > this.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0 && this.logger) {
      this.logger.debug(`Cleaned up ${expiredCount} expired cache entries`).catch(() => {});
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
    
    // Check if entry has expired
    const now = Date.now();
    if (now - entry.created > this.ttl) {
      // Remove expired entry
      this.cache.delete(key);
      this.misses++;
      
      if (this.logger) {
        this.logger.debug(`Cache entry expired for key: ${String(key)}`).catch(() => {});
      }
      
      return undefined;
    }
    
    // Update access information
    entry.lastAccessed = now;
    entry.accessCount++;
    
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
    
    // If at capacity and key doesn't exist, remove oldest entry
    if (this.cache.size === this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }
    
    // Add new entry
    this.cache.set(key, {
      value,
      created: now,
      lastAccessed: now,
      accessCount: 0
    });
    
    if (this.logger) {
      this.logger.debug(`Set key in cache: ${String(key)}`).catch(() => {});
    }
  }
  
  /**
   * Evict the oldest entry
   */
  private evictOldest(): void {
    let oldestKey: K | undefined;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.created < oldestTime) {
        oldestTime = entry.created;
        oldestKey = key;
      }
    }
    
    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
      
      if (this.logger) {
        this.logger.debug(`Evicted oldest key: ${String(oldestKey)}`).catch(() => {});
      }
    }
  }
  
  /**
   * Check if a key exists in the cache
   */
  has(key: K): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check if entry has expired
    const now = Date.now();
    if (now - entry.created > this.ttl) {
      // Remove expired entry
      this.cache.delete(key);
      return false;
    }
    
    return true;
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
    
    if (this.logger) {
      this.logger.debug('Cache cleared').catch(() => {});
    }
  }
  
  /**
   * Get cache size
   */
  size(): number {
    // Clean up expired entries first
    this.cleanup();
    
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
  
  /**
   * Dispose of the cache
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    
    this.cache.clear();
    
    if (this.logger) {
      this.logger.debug('Cache disposed').catch(() => {});
    }
  }
}

/**
 * Create a new time-based cache
 */
export function createTimeCache<K, V>(
  maxSize: number,
  ttl: number,
  logger?: LoggingInterface
): VerificationCache<K, V> {
  if (maxSize <= 0) {
    throw new CacheError('Cache size must be positive');
  }
  
  if (ttl <= 0) {
    throw new CacheError('TTL must be positive');
  }
  
  return new TimeCache<K, V>(maxSize, ttl, logger);
}
