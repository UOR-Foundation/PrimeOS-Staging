import { CacheEntryMetadata } from '../types';

/**
 * Interface for all eviction strategies
 */
export interface EvictionStrategy<K = any, V = any> {
  /**
   * Type identifier for the strategy
   */
  readonly type: 'lru' | 'lfu' | 'time' | 'composite';
  
  /**
   * Weight for composite strategies
   */
  readonly weight: number;
  
  /**
   * Handle entry access
   */
  onAccess(key: K, metadata: CacheEntryMetadata): void;
  
  /**
   * Handle entry addition
   */
  onAdd(key: K, metadata: CacheEntryMetadata): void;
  
  /**
   * Select an entry to evict
   */
  selectEvictionCandidate(entries: Map<K, CacheEntryMetadata>): K | null;
}

/**
 * LRU strategy options
 */
export interface LRUStrategyOptions {
  /**
   * Weight for composite strategies
   */
  weight?: number;
}

/**
 * LFU strategy options
 */
export interface LFUStrategyOptions {
  /**
   * Weight for composite strategies
   */
  weight?: number;
  
  /**
   * Factor to age frequency counts (1.0 means no aging)
   */
  agingFactor?: number;
}

/**
 * Time-based strategy options
 */
export interface TimeStrategyOptions {
  /**
   * Weight for composite strategies
   */
  weight?: number;
  
  /**
   * Default TTL in milliseconds
   */
  defaultTTL?: number;
}

/**
 * Composite strategy options
 */
export interface CompositeStrategyOptions {
  /**
   * Strategies to combine
   */
  strategies: EvictionStrategy[];
}
