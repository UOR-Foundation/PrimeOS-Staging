/**
 * Cache Factory for Verification Module
 * ====================================
 * 
 * This module provides cache factory functionality for the precision module.
 */

import { createLRUCache } from '../cache';

/**
 * Create a cache factory for the precision module
 */
export function createCacheFactory() {
  return {
    createCache: (options: any = {}) => {
      return createLRUCache(options.maxSize || 1000, options);
    },
    memoize: <T extends (...args: any[]) => any>(fn: T, options: any = {}) => {
      const cache = createLRUCache(options.maxSize || 100, options);
      return ((...args: any[]) => {
        const key = JSON.stringify(args);
        const cached = cache.get(key);
        if (cached !== undefined) {
          return cached;
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
      }) as T;
    },
    memoizeAsync: <T extends (...args: any[]) => Promise<any>>(fn: T, options: any = {}) => {
      const cache = createLRUCache(options.maxSize || 100, options);
      return (async (...args: any[]) => {
        const key = JSON.stringify(args);
        const cached = cache.get(key);
        if (cached !== undefined) {
          return cached;
        }
        const result = await fn(...args);
        cache.set(key, result);
        return result;
      }) as T;
    }
  };
}
