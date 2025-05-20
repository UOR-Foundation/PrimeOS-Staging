/**
 * Modular Arithmetic Caching
 * ========================
 * 
 * Caching implementation for modular arithmetic operations.
 * Leverages the precision/cache module for efficient caching.
 */

import { 
  createCache, 
  memoize, 
  memoizeAsync, 
  CacheModelInterface,
  CacheOptions
} from '../../cache';
import { MODULAR_CONSTANTS } from '../constants';
import { LoggingInterface } from '../../../../os/logging/types';

/**
 * Options for modular arithmetic caching
 */
export interface ModularCacheOptions {
  /**
   * Whether to enable caching
   */
  enabled: boolean;
  
  /**
   * Maximum size of the cache (number of entries)
   */
  maxSize?: number;
  
  /**
   * Maximum memory usage of the cache (in bytes)
   */
  maxMemory?: number;
  
  /**
   * Cache eviction strategy
   */
  strategy?: 'lru' | 'lfu' | 'time' | 'composite';
  
  /**
   * Logger instance for debug information
   */
  logger?: LoggingInterface;
  
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
}

/**
 * Default cache options
 */
const DEFAULT_CACHE_OPTIONS: ModularCacheOptions = {
  enabled: true,
  maxSize: MODULAR_CONSTANTS.DEFAULT_CACHE_SIZE,
  maxMemory: MODULAR_CONSTANTS.MAX_CACHE_MEMORY,
  strategy: 'lru',
  debug: false
};

/**
 * Create a cache for modular arithmetic operations
 */
export function createModularCache<K = string, V = bigint>(
  name: string,
  options: Partial<ModularCacheOptions> = {}
): CacheModelInterface<K, V> {
  // Merge options with defaults
  const mergedOptions: ModularCacheOptions = {
    ...DEFAULT_CACHE_OPTIONS,
    ...options
  };
  
  // If caching is disabled, return a no-op cache
  if (!mergedOptions.enabled) {
    return createNoOpCache<K, V>();
  }
  
  // Create cache with appropriate options
  const cache = createCache<K, V>({
    maxSize: mergedOptions.maxSize,
    strategy: mergedOptions.strategy,
    name: name,
    debug: mergedOptions.debug,
    strategyOptions: mergedOptions.strategy === 'composite' ? {
      strategies: [
        { type: 'lru', weight: 0.7 },
        { type: 'lfu', weight: 0.3 }
      ]
    } : undefined
  });
  
  // Log cache creation if debug is enabled
  if (mergedOptions.debug && mergedOptions.logger) {
    mergedOptions.logger.debug(
      `Created ${name} cache with options:`,
      mergedOptions
    ).catch(() => {});
  }
  
  return cache;
}

/**
 * Create a no-op cache that doesn't actually cache anything
 * Used when caching is disabled
 */
function createNoOpCache<K = string, V = bigint>(): CacheModelInterface<K, V> {
  // Create a minimal cache that doesn't actually cache anything
  // This is a simplified version that just implements the interface
  return createCache<K, V>({
    maxSize: 1,
    name: 'no-op-cache',
    strategy: 'lru'
  });
}

/**
 * Create a key generator function for cache keys
 * This handles large numbers by truncating them to avoid excessive memory usage
 */
export function createKeyGenerator(maxKeyLength: number = 100): (a: any, b: any, ...rest: any[]) => string {
  return (a: any, b: any, ...rest: any[]): string => {
    // Convert arguments to strings
    const aStr = a?.toString() || 'undefined';
    const bStr = b?.toString() || 'undefined';
    
    // Truncate if necessary
    const truncatedA = aStr.length > maxKeyLength 
      ? `${aStr.substring(0, maxKeyLength)}...` 
      : aStr;
    
    const truncatedB = bStr.length > maxKeyLength 
      ? `${bStr.substring(0, maxKeyLength)}...` 
      : bStr;
    
    // If there are additional arguments, include them
    if (rest.length > 0) {
      const restStr = rest.map(arg => {
        const str = arg?.toString() || 'undefined';
        return str.length > maxKeyLength 
          ? `${str.substring(0, maxKeyLength)}...` 
          : str;
      }).join(',');
      
      return `${truncatedA},${truncatedB},${restStr}`;
    }
    
    return `${truncatedA},${truncatedB}`;
  };
}

/**
 * Memoize a modular arithmetic function
 */
export function memoizeModular<T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  options: Partial<ModularCacheOptions> = {}
): T {
  // If caching is disabled, return the original function
  if (options.enabled === false) {
    return fn;
  }
  
  // Create key generator
  const keyGen = createKeyGenerator();
  
  // Create memoized function with custom key generation
  return ((...args: any[]): ReturnType<T> => {
    // Create cache key
    const key = keyGen(args[0], args[1], ...args.slice(2));
    
    // Get cache
    const cache = getCacheForFunction(name, options);
    
    // Check cache
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    // Call function
    const result = fn(...args);
    
    // Cache result
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Cache storage for memoized functions
 */
const functionCaches = new Map<string, CacheModelInterface<string, any>>();

/**
 * Get or create a cache for a specific function
 */
function getCacheForFunction(
  name: string,
  options: Partial<ModularCacheOptions> = {}
): CacheModelInterface<string, any> {
  // Check if cache already exists
  if (functionCaches.has(name)) {
    return functionCaches.get(name)!;
  }
  
  // Create new cache
  const cache = createModularCache<string, any>(name, options);
  
  // Initialize cache
  cache.initialize().catch(() => {});
  
  // Store cache
  functionCaches.set(name, cache);
  
  return cache;
}

/**
 * Clear all function caches
 */
export function clearAllCaches(): void {
  functionCaches.forEach(cache => {
    cache.clear();
  });
}

/**
 * Clear a specific function cache
 */
export function clearFunctionCache(name: string): void {
  const cache = functionCaches.get(name);
  if (cache) {
    cache.clear();
  }
}

/**
 * Terminate all caches
 */
export async function terminateAllCaches(): Promise<void> {
  for (const [name, cache] of functionCaches.entries()) {
    await cache.terminate();
    functionCaches.delete(name);
  }
}
