/**
 * Cache Module
 * =====
 * 
 * High-performance caching system for PrimeOS precision operations.
 * This module provides flexible caching with multiple eviction strategies.
 */

import {
  BaseModel,
  ModelResult,
  ModelLifecycleState
} from '../../../os/model';

import {
  CacheOptions,
  CacheInterface,
  CacheModelInterface,
  CacheState,
  CacheMetrics,
  CacheProcessInput,
  SetOptions,
  CacheEntryMetadata
} from './types';

import { createLRUStrategy } from './strategies/lru-strategy';
import { createLFUStrategy } from './strategies/lfu-strategy';
import { createTimeStrategy } from './strategies/time-strategy';
import { createCompositeStrategy } from './strategies/composite-strategy';
import { EvictionStrategy } from './strategies/types';

/**
 * Default options for cache
 */
const DEFAULT_OPTIONS: CacheOptions = {
  maxSize: 1000,
  metrics: true,
  strategy: 'lru',
  name: 'precision-cache',
  version: '1.0.0',
  debug: false
};

/**
 * Cache Implementation extending BaseModel
 */
export class CacheImplementation<K = any, V = any> extends BaseModel implements CacheModelInterface<K, V> {
  private store = new Map<K, { value: V, metadata: CacheEntryMetadata }>();
  private strategy: EvictionStrategy<K, V>;
  private config: CacheOptions<K, V>;
  private metrics: CacheMetrics;
  private accessTimeSamples: number[] = [];
  private readonly MAX_SAMPLES = 100;
  
  /**
   * Create a new cache module instance
   */
  constructor(options: CacheOptions<K, V> = {}) {
    // Initialize BaseModel with options
    super({ ...DEFAULT_OPTIONS, ...options });
    
    // Process options with defaults
    this.config = {
      maxSize: options.maxSize || DEFAULT_OPTIONS.maxSize,
      maxAge: options.maxAge,
      metrics: options.metrics !== undefined ? options.metrics : DEFAULT_OPTIONS.metrics,
      strategy: options.strategy || DEFAULT_OPTIONS.strategy,
      strategyOptions: options.strategyOptions || {},
      debug: options.debug || DEFAULT_OPTIONS.debug
    };
    
    // Initialize metrics
    this.metrics = {
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      expirationCount: 0,
      averageAccessTime: 0,
      currentSize: 0,
      maxSize: this.config.maxSize!
    };
    
    // Create eviction strategy
    this.strategy = this.createStrategy();
  }
  
  /**
   * Create the appropriate eviction strategy
   */
  private createStrategy(): EvictionStrategy<K, V> {
    switch (this.config.strategy) {
      case 'lru':
        return createLRUStrategy(this.config.strategyOptions);
      case 'lfu':
        return createLFUStrategy(this.config.strategyOptions);
      case 'time':
        return createTimeStrategy(this.config.strategyOptions);
      case 'composite':
        // Ensure strategyOptions has the required 'strategies' property
        const compositeOptions = this.config.strategyOptions as any;
        if (!compositeOptions.strategies) {
          compositeOptions.strategies = [];
        }
        return createCompositeStrategy(compositeOptions);
      default:
        return createLRUStrategy();
    }
  }
  
  /**
   * Initialize the module
   */
  protected async onInitialize(): Promise<void> {
    // Add custom state tracking
    this.state.custom = {
      config: this.config,
      metrics: this.metrics
    };
    
    await this.logger.debug('Cache module initialized with configuration', this.config);
  }
  
  /**
   * Process operation request
   */
  protected async onProcess<T = CacheProcessInput<K, V>, R = unknown>(input: T): Promise<R> {
    if (!input) {
      throw new Error('Input cannot be undefined or null');
    }
    
    await this.logger.debug('Processing input', input);
    
    // Process based on input type
    if (typeof input === 'object' && input !== null && 'operation' in input) {
      const request = input as unknown as CacheProcessInput<K, V>;
      
      switch (request.operation) {
        case 'get':
          return this.get(request.key as K) as unknown as R;
          
        case 'set':
          this.set(
            request.key as K,
            request.value as V,
            request.options
          );
          return undefined as unknown as R;
          
        case 'has':
          return this.has(request.key as K) as unknown as R;
          
        case 'delete':
          return this.delete(request.key as K) as unknown as R;
          
        case 'clear':
          this.clear();
          return undefined as unknown as R;
          
        case 'getMetrics':
          return this.getMetrics() as unknown as R;
          
        case 'optimize':
          this.optimize();
          return undefined as unknown as R;
          
        case 'setMaxSize':
          this.setMaxSize(request.param as number);
          return undefined as unknown as R;
          
        case 'setMaxAge':
          this.setMaxAge(request.param as number);
          return undefined as unknown as R;
          
        default:
          throw new Error(`Unknown operation: ${(request as any).operation}`);
      }
    } else {
      // For direct function calls without the operation wrapper
      return input as unknown as R;
    }
  }
  
  /**
   * Reset the module state
   */
  protected async onReset(): Promise<void> {
    // Clear cache
    this.store.clear();
    
    // Reset metrics
    this.metrics = {
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      expirationCount: 0,
      averageAccessTime: 0,
      currentSize: 0,
      maxSize: this.config.maxSize!
    };
    
    // Update state
    this.state.custom = {
      config: this.config,
      metrics: this.metrics
    };
    
    await this.logger.debug('Cache module reset');
  }
  
  /**
   * Clean up resources when module is terminated
   */
  protected async onTerminate(): Promise<void> {
    // Clear the cache
    this.store.clear();
    await this.logger.debug('Cache module terminated');
  }
  
  /**
   * Get the module state including metrics
   */
  getState(): CacheState<K, V> {
    const baseState = super.getState();
    
    return {
      ...baseState,
      config: this.config,
      metrics: this.getMetrics()
    } as CacheState<K, V>;
  }
  
  /**
   * Track access time for metrics
   */
  private trackAccessTime(time: number): void {
    if (!this.config.metrics) return;
    
    this.accessTimeSamples.push(time);
    if (this.accessTimeSamples.length > this.MAX_SAMPLES) {
      this.accessTimeSamples.shift();
    }
    
    // Update average
    this.metrics.averageAccessTime = this.accessTimeSamples.reduce((sum, t) => sum + t, 0) / 
                                     this.accessTimeSamples.length;
  }
  
  /**
   * Get a value from the cache
   */
  get(key: K): V | undefined {
    const startTime = performance.now();
    
    // Check if key exists
    const entry = this.store.get(key);
    
    if (!entry) {
      this.metrics.missCount++;
      this.trackAccessTime(performance.now() - startTime);
      return undefined;
    }
    
    // Check if expired
    if (entry.metadata.expires && entry.metadata.expires < Date.now()) {
      this.store.delete(key);
      this.metrics.missCount++;
      this.metrics.expirationCount++;
      this.metrics.currentSize = this.store.size;
      this.trackAccessTime(performance.now() - startTime);
      return undefined;
    }
    
    // Update metadata
    entry.metadata.lastAccessed = Date.now();
    entry.metadata.accessCount++;
    
    // Notify strategy
    this.strategy.onAccess(key, entry.metadata);
    
    // Update metrics
    this.metrics.hitCount++;
    this.metrics.hitRate = this.metrics.hitCount / 
                          (this.metrics.hitCount + this.metrics.missCount);
    
    this.trackAccessTime(performance.now() - startTime);
    
    return entry.value;
  }
  
  /**
   * Set a value in the cache
   */
  set(key: K, value: V, options?: SetOptions): void {
    // Check if key already exists
    const existing = this.store.has(key);
    
    // If we need to add a new entry and we're at capacity, evict one
    if (!existing && this.store.size >= this.config.maxSize!) {
      this.evict();
    }
    
    // Create metadata
    const now = Date.now();
    const metadata: CacheEntryMetadata = {
      created: now,
      lastAccessed: now,
      accessCount: 0,
      custom: {}
    };
    
    // Set expiration if TTL provided
    if (options?.ttl) {
      metadata.expires = now + options.ttl;
    } else if (this.config.maxAge) {
      metadata.expires = now + this.config.maxAge;
    }
    
    // Store the entry
    this.store.set(key, { value, metadata });
    
    // Notify strategy
    this.strategy.onAdd(key, metadata);
    
    // Update metrics
    this.metrics.currentSize = this.store.size;
  }
  
  /**
   * Check if key exists and is not expired
   */
  has(key: K): boolean {
    const entry = this.store.get(key);
    
    if (!entry) {
      return false;
    }
    
    // Check expiration
    if (entry.metadata.expires && entry.metadata.expires < Date.now()) {
      this.store.delete(key);
      this.metrics.expirationCount++;
      this.metrics.currentSize = this.store.size;
      return false;
    }
    
    return true;
  }
  
  /**
   * Delete a key from the cache
   */
  delete(key: K): boolean {
    const result = this.store.delete(key);
    
    if (result) {
      this.metrics.currentSize = this.store.size;
    }
    
    return result;
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.store.clear();
    this.metrics.currentSize = 0;
  }
  
  /**
   * Evict an entry according to the strategy
   */
  private evict(): void {
    const keyToEvict = this.strategy.selectEvictionCandidate(
      new Map(Array.from(this.store.entries()).map(([k, v]) => [k, v.metadata]))
    );
    
    if (keyToEvict !== null) {
      this.store.delete(keyToEvict);
      this.metrics.evictionCount++;
      this.metrics.currentSize = this.store.size;
    }
  }
  
  /**
   * Get current cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Optimize the cache by removing expired entries
   */
  optimize(): void {
    if (!this.config.maxAge) return;
    
    const now = Date.now();
    let expired = 0;
    
    this.store.forEach((entry, key) => {
      if (entry.metadata.expires && entry.metadata.expires < now) {
        this.store.delete(key);
        expired++;
      }
    });
    
    if (expired > 0) {
      this.metrics.expirationCount += expired;
      this.metrics.currentSize = this.store.size;
    }
  }
  
  /**
   * Set maximum cache size
   */
  setMaxSize(size: number): void {
    this.config.maxSize = size;
    this.metrics.maxSize = size;
    
    // If current size exceeds new max, evict until we're under limit
    while (this.store.size > size) {
      this.evict();
    }
  }
  
  /**
   * Set maximum age for entries
   */
  setMaxAge(ms: number): void {
    this.config.maxAge = ms;
    
    // Update expires for all entries
    const now = Date.now();
    this.store.forEach((entry) => {
      entry.metadata.expires = now + ms;
    });
  }
}

/**
 * Create a cache instance with the specified options
 */
export function createCache<K = any, V = any>(options: CacheOptions<K, V> = {}): CacheModelInterface<K, V> {
  return new CacheImplementation<K, V>(options);
}

/**
 * Create and initialize a cache in a single step
 */
export async function createAndInitializeCache<K = any, V = any>(
  options: CacheOptions<K, V> = {}
): Promise<CacheModelInterface<K, V>> {
  const instance = createCache<K, V>(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize cache: ${result.error}`);
  }
  
  return instance;
}

/**
 * Create an LRU cache
 */
export function createLRUCache<K = any, V = any>(
  maxSize: number = 1000,
  options: Partial<CacheOptions<K, V>> = {}
): CacheModelInterface<K, V> {
  return createCache<K, V>({
    ...options,
    maxSize,
    strategy: 'lru'
  });
}

/**
 * Create an LFU cache
 */
export function createLFUCache<K = any, V = any>(
  maxSize: number = 1000,
  options: Partial<CacheOptions<K, V>> = {}
): CacheModelInterface<K, V> {
  return createCache<K, V>({
    ...options,
    maxSize,
    strategy: 'lfu'
  });
}

/**
 * Create a time-based cache
 */
export function createTimeBasedCache<K = any, V = any>(
  maxAge: number,
  maxSize: number = 1000,
  options: Partial<CacheOptions<K, V>> = {}
): CacheModelInterface<K, V> {
  return createCache<K, V>({
    ...options,
    maxSize,
    maxAge,
    strategy: 'time'
  });
}

/**
 * Create a composite cache with multiple strategies
 */
export function createCompositeCache<K = any, V = any>(
  strategies: Array<{type: 'lru' | 'lfu' | 'time', weight?: number}>,
  maxSize: number = 1000,
  options: Partial<CacheOptions<K, V>> = {}
): CacheModelInterface<K, V> {
  return createCache<K, V>({
    ...options,
    maxSize,
    strategy: 'composite',
    strategyOptions: { strategies }
  });
}

/**
 * Utility function for memoizing function results
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: Partial<CacheOptions<string, ReturnType<T>>> = {}
): T {
  // Create cache
  const cache = createLRUCache<string, ReturnType<T>>(1000, options);
  
  // Return memoized function
  return ((...args: Parameters<T>): ReturnType<T> => {
    // Create cache key from arguments
    const key = JSON.stringify(args);
    
    // Check cache
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    // Call function
    const result = fn(...args);
    
    // Cache result
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Utility function for memoizing async function results
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: Partial<CacheOptions<string, Awaited<ReturnType<T>>>> = {}
): T {
  // Create cache
  const cache = createLRUCache<string, Awaited<ReturnType<T>>>(1000, options);
  
  // Return memoized function
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    // Create cache key from arguments
    const key = JSON.stringify(args);
    
    // Check cache
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    // Call function
    const result = await fn(...args);
    
    // Cache result
    cache.set(key, result);
    
    return result;
  }) as T;
}

// Export types
export * from './types';
export * from './strategies/types';

// Export strategies
export { createLRUStrategy } from './strategies/lru-strategy';
export { createLFUStrategy } from './strategies/lfu-strategy';
export { createTimeStrategy } from './strategies/time-strategy';
export { createCompositeStrategy } from './strategies/composite-strategy';
