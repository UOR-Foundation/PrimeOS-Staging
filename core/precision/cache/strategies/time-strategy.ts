import {
  CacheEntryMetadata
} from '../types';

import {
  EvictionStrategy,
  TimeStrategyOptions
} from './types';

/**
 * Time-based eviction strategy implementation
 */
export class TimeStrategy<K = any, V = any> implements EvictionStrategy<K, V> {
  readonly type = 'time';
  readonly weight: number;
  private readonly defaultTTL: number;
  
  /**
   * Create a new time-based strategy
   */
  constructor(options: TimeStrategyOptions = {}) {
    this.weight = options.weight || 1.0;
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour default
  }
  
  /**
   * Handle entry access
   */
  onAccess(key: K, metadata: CacheEntryMetadata): void {
    // Update last accessed time
    metadata.lastAccessed = Date.now();
  }
  
  /**
   * Handle entry addition
   */
  onAdd(key: K, metadata: CacheEntryMetadata): void {
    // Set expiration time if not already set
    if (!metadata.expires) {
      metadata.expires = Date.now() + this.defaultTTL;
    }
  }
  
  /**
   * Select an entry to evict based on closest to expiry
   */
  selectEvictionCandidate(entries: Map<K, CacheEntryMetadata>): K | null {
    let closestToExpiry: K | null = null;
    let earliestExpiry = Infinity;
    
    // Find entry closest to expiration
    for (const [key, metadata] of entries) {
      // If an entry has no expiry, use last accessed time + default TTL
      const expiryTime = metadata.expires || 
                         metadata.lastAccessed + this.defaultTTL;
      
      if (expiryTime < earliestExpiry) {
        earliestExpiry = expiryTime;
        closestToExpiry = key;
      }
    }
    
    return closestToExpiry;
  }
}

/**
 * Create a time-based strategy
 */
export function createTimeStrategy<K = any, V = any>(
  options?: TimeStrategyOptions
): EvictionStrategy<K, V> {
  return new TimeStrategy<K, V>(options);
}
