/**
 * Global Cache Manager
 * ===================
 * 
 * Provides global cache management functionality for clearing all caches.
 */

import { CacheModelInterface } from './types';

/**
 * Global cache registry for clearing all caches
 */
const globalCacheRegistry = new Set<CacheModelInterface<any, any>>();

/**
 * Register a cache instance for global management
 */
export function registerCache<K, V>(cache: CacheModelInterface<K, V>): void {
  globalCacheRegistry.add(cache);
}

/**
 * Unregister a cache instance from global management
 */
export function unregisterCache<K, V>(cache: CacheModelInterface<K, V>): void {
  globalCacheRegistry.delete(cache);
}

/**
 * Clear all registered caches
 */
export function clearAllCaches(): void {
  globalCacheRegistry.forEach(cache => {
    try {
      cache.clear();
    } catch (error) {
      // Ignore errors when clearing individual caches
      console.warn('Error clearing cache:', error);
    }
  });
}
