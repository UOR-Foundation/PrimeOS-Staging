/**
 * Caching for Mathematical Utilities
 * ===============================
 * 
 * Cache management for mathematical operations.
 */

import { createLRUCache, CacheModelInterface } from '../../cache';

// Collection of all caches for centralized management
const caches: CacheModelInterface<any, any>[] = [];

/**
 * Create a new cache for a specific operation
 */
export function createUtilsCache<K = any, V = any>(
  size: number,
  name: string
): CacheModelInterface<K, V> {
  const cache = createLRUCache<K, V>(size, {
    name: `utils-${name}-cache`,
    metrics: true
  });
  
  // Initialize the cache
  cache.initialize().catch(err => {
    console.error(`Failed to initialize ${name} cache:`, err);
  });
  
  // Add to collection for centralized management
  caches.push(cache);
  
  return cache;
}

/**
 * Clear all caches used by the utils module
 */
export function clearAllCaches(): void {
  for (const cache of caches) {
    cache.clear();
  }
}

/**
 * Terminate all caches used by the utils module
 */
export async function terminateAllCaches(): Promise<void> {
  for (const cache of caches) {
    await cache.terminate();
  }
  
  // Clear the collection
  caches.length = 0;
}
