/**
 * Cache Module Mock Implementation
 * 
 * This file provides a mock implementation of the cache module interface
 * that can be used in tests.
 */

import { ModelLifecycleState } from './os-model-mock';
import { createLogging } from './os-logging-mock';
import {
  CacheOptions,
  CacheMetrics,
  CacheState,
  CacheModelInterface,
  CacheProcessInput
} from '../types';

// Default cache metrics
const DEFAULT_METRICS: CacheMetrics = {
  hitCount: 0,
  missCount: 0,
  hitRate: 0,
  evictionCount: 0,
  expirationCount: 0,
  averageAccessTime: 0,
  currentSize: 0,
  maxSize: 100
};

// Default cache constants
export const CACHE_CONSTANTS = {
  DEFAULT_MAX_SIZE: 100,
  DEFAULT_MAX_AGE: 3600000, // 1 hour in ms
  DEFAULT_STRATEGY: 'lru' as const
};

/**
 * Create a mock cache instance
 */
export function createMockCache(options: CacheOptions = {}): CacheModelInterface {
  // Simple cache storage
  const store = new Map<any, any>();
  
  // Keep track of metrics
  const metrics: CacheMetrics = {
    ...DEFAULT_METRICS,
    maxSize: options.maxSize || CACHE_CONSTANTS.DEFAULT_MAX_SIZE
  };
  
  // Track cache state
  const state: CacheState = {
    lifecycle: ModelLifecycleState.Uninitialized,
    lastStateChangeTime: Date.now(),
    uptime: 0,
    operationCount: {
      total: 0,
      success: 0,
      failed: 0
    },
    config: {
      ...options,
      maxSize: options.maxSize || CACHE_CONSTANTS.DEFAULT_MAX_SIZE,
      maxAge: options.maxAge || CACHE_CONSTANTS.DEFAULT_MAX_AGE,
      strategy: options.strategy || CACHE_CONSTANTS.DEFAULT_STRATEGY
    },
    metrics
  };
  
  // Create the cache implementation
  const cacheImpl: CacheModelInterface = {
    // Cache interface methods
    get(key: any) {
      metrics.hitCount += store.has(key) ? 1 : 0;
      metrics.missCount += !store.has(key) ? 1 : 0;
      
      if (metrics.hitCount + metrics.missCount > 0) {
        metrics.hitRate = metrics.hitCount / (metrics.hitCount + metrics.missCount);
      }
      
      return store.get(key);
    },
    
    set(key: any, value: any) {
      if (store.size >= metrics.maxSize && !store.has(key)) {
        metrics.evictionCount += 1;
        // Simple eviction - just remove one item
        const firstKey = store.keys().next().value;
        store.delete(firstKey);
      }
      
      store.set(key, value);
      metrics.currentSize = store.size;
      return true;
    },
    
    has(key: any) {
      return store.has(key);
    },
    
    delete(key: any) {
      const result = store.delete(key);
      if (result) {
        metrics.currentSize = store.size;
      }
      return result;
    },
    
    clear() {
      store.clear();
      metrics.currentSize = 0;
    },
    
    getMetrics() {
      return { ...metrics };
    },
    
    optimize() {
      // Nothing to optimize in the mock
      return;
    },
    
    setMaxSize(size: number) {
      metrics.maxSize = size;
      state.config.maxSize = size;
      
      // Evict items if needed
      while (store.size > size) {
        const firstKey = store.keys().next().value;
        store.delete(firstKey);
        metrics.evictionCount += 1;
      }
      
      metrics.currentSize = store.size;
    },
    
    setMaxAge(ms: number) {
      state.config.maxAge = ms;
      // In a real implementation this would update expiration times
    },
    
    getLogger() {
      // Use our enhanced mock logger that implements the full LoggingInterface
      return createLogging({ name: options.name || 'cache-mock-logger' });
    },
    
    // Model interface methods
    async initialize() {
      state.lifecycle = ModelLifecycleState.Ready;
      state.lastStateChangeTime = Date.now();
      
      return {
        success: true,
        timestamp: Date.now(),
        source: options.name || 'mock-cache'
      };
    },
    
    async process<T = any, R = any>(input: T): Promise<R> {
      state.operationCount.total += 1;
      
      try {
        let result: any;
        const cacheInput = input as unknown as CacheProcessInput;
        
        switch (cacheInput.operation) {
          case 'get':
            result = cacheImpl.get(cacheInput.key);
            break;
          case 'set':
            result = cacheImpl.set(cacheInput.key, cacheInput.value, cacheInput.options);
            break;
          case 'has':
            result = cacheImpl.has(cacheInput.key);
            break;
          case 'delete':
            result = cacheImpl.delete(cacheInput.key);
            break;
          case 'clear':
            cacheImpl.clear();
            result = true;
            break;
          case 'getMetrics':
            // Safe call with null check
            result = cacheImpl.getMetrics ? cacheImpl.getMetrics() : DEFAULT_METRICS;
            break;
          case 'optimize':
            // Safe call with null check
            if (cacheImpl.optimize) {
              cacheImpl.optimize();
            }
            result = true;
            break;
          case 'setMaxSize':
            // Safe call with null checks
            if (cacheImpl.setMaxSize && cacheInput.param !== undefined) {
              cacheImpl.setMaxSize(cacheInput.param);
            }
            result = true;
            break;
          case 'setMaxAge':
            // Safe call with null checks
            if (cacheImpl.setMaxAge && cacheInput.param !== undefined) {
              cacheImpl.setMaxAge(cacheInput.param);
            }
            result = true;
            break;
          default:
            throw new Error(`Unknown operation: ${cacheInput.operation}`);
        }
        
        state.operationCount.success += 1;
        
        return result as R;
      } catch (error) {
        state.operationCount.failed += 1;
        throw error;
      }
    },
    
    getState() {
      return { ...state };
    },
    
    async reset() {
      cacheImpl.clear();
      
      // Reset metrics
      Object.assign(metrics, {
        ...DEFAULT_METRICS,
        maxSize: state.config.maxSize
      });
      
      state.operationCount = {
        total: 0,
        success: 0,
        failed: 0
      };
      
      state.lastStateChangeTime = Date.now();
      
      return {
        success: true,
        timestamp: Date.now(),
        source: options.name || 'mock-cache'
      };
    },
    
    async terminate() {
      state.lifecycle = ModelLifecycleState.Terminated;
      state.lastStateChangeTime = Date.now();
      
      return {
        success: true,
        timestamp: Date.now(),
        source: options.name || 'mock-cache'
      };
    },
    
    createResult(success, data, error) {
      return {
        success,
        data,
        error,
        timestamp: Date.now(),
        source: options.name || 'mock-cache'
      };
    }
  };
  
  return cacheImpl;
}
