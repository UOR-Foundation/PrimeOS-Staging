/**
 * Cache Registry
 * =============
 * 
 * Centralized registry for tracking all cache instances across the precision module.
 * This enables proper cleanup and management of all caches.
 */

import { CacheModelInterface } from './cache';

/**
 * Interface for cache registry entries
 */
interface CacheEntry {
  name: string;
  cache: CacheModelInterface | any;
  module: string;
  clearMethod?: string;
}

/**
 * Global cache registry
 */
class CacheRegistry {
  private static instance: CacheRegistry;
  private caches: Map<string, CacheEntry> = new Map();
  
  /**
   * Get singleton instance
   */
  static getInstance(): CacheRegistry {
    if (!CacheRegistry.instance) {
      CacheRegistry.instance = new CacheRegistry();
    }
    return CacheRegistry.instance;
  }
  
  /**
   * Register a cache instance
   */
  register(id: string, entry: CacheEntry): void {
    this.caches.set(id, entry);
  }
  
  /**
   * Unregister a cache instance
   */
  unregister(id: string): void {
    this.caches.delete(id);
  }
  
  /**
   * Clear all registered caches
   */
  async clearAll(): Promise<void> {
    const clearPromises: Promise<void>[] = [];
    
    for (const [id, entry] of this.caches) {
      try {
        const cache = entry.cache;
        const clearMethod = entry.clearMethod || 'clear';
        
        if (cache && typeof cache[clearMethod] === 'function') {
          const result = cache[clearMethod]();
          
          // Handle both sync and async clear methods
          if (result instanceof Promise) {
            clearPromises.push(result);
          }
        }
      } catch (error) {
        console.error(`Failed to clear cache ${id}:`, error);
      }
    }
    
    // Wait for all async clears to complete
    await Promise.all(clearPromises);
  }
  
  /**
   * Get all registered caches
   */
  getAll(): Map<string, CacheEntry> {
    return new Map(this.caches);
  }
  
  /**
   * Get cache by ID
   */
  get(id: string): CacheEntry | undefined {
    return this.caches.get(id);
  }
  
  /**
   * Clear registry (for testing)
   */
  clear(): void {
    this.caches.clear();
  }
}

// Export singleton instance
export const cacheRegistry = CacheRegistry.getInstance();

/**
 * Helper function to register a cache
 */
export function registerCache(
  id: string,
  cache: CacheModelInterface | any,
  module: string,
  name?: string,
  clearMethod?: string
): void {
  cacheRegistry.register(id, {
    name: name || id,
    cache,
    module,
    clearMethod
  });
}

/**
 * Helper function to unregister a cache
 */
export function unregisterCache(id: string): void {
  cacheRegistry.unregister(id);
}

/**
 * Clear all caches in the registry
 */
export async function clearAllRegisteredCaches(): Promise<void> {
  await cacheRegistry.clearAll();
}
