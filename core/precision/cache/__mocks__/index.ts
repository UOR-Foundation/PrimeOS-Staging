/**
 * Cache Module Mocks Export
 * 
 * This file exports mocks for the cache module that can be used by other modules
 * in their tests.
 */

// Re-export model and logging mocks
export * from './os-model-mock';
export * from './os-logging-mock';
export * from './test-mock';

// Import actual Cache types for mocking
import { 
  CacheOptions,
  SetOptions,
  CacheMetrics,
  CacheState,
  CacheInterface,
  CacheModelInterface
} from '../types';

import { ModelResult, ModelLifecycleState } from '../../../../os/model/types';
import { createLoggingMock, createLogging } from './os-logging-mock';

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
  
  // Return mock implementation
  return {
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
      return createLogging();
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
    
    async process(input: any): Promise<any> {
      state.operationCount.total += 1;
      
      try {
        let result: any;
        
        if (typeof input === 'object' && input !== null && 'operation' in input) {
          const request = input as any;
          
          switch (request.operation) {
            case 'get':
              result = this.get?.(request.key);
              break;
            case 'set':
              result = this.set?.(request.key, request.value);
              break;
            case 'has':
              result = this.has?.(request.key);
              break;
            case 'delete':
              result = this.delete?.(request.key);
              break;
            case 'clear':
              this.clear?.();
              result = true;
              break;
            case 'getMetrics':
              result = this.getMetrics?.();
              break;
            case 'optimize':
              this.optimize?.();
              result = true;
              break;
            case 'setMaxSize':
              this.setMaxSize?.(request.param);
              result = true;
              break;
            case 'setMaxAge':
              this.setMaxAge?.(request.param);
              result = true;
              break;
            default:
              result = null;
          }
        } else {
          result = null;
        }
        
        state.operationCount.success += 1;
        
        return this.createResult(true, result);
      } catch (error: any) {
        state.operationCount.failed += 1;
        return this.createResult(false, undefined, error.message);
      }
    },
    
    getState() {
      return { ...state };
    },
    
    async reset() {
      this.clear?.();
      
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
    
    createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T> {
      return {
        success,
        data,
        error,
        timestamp: Date.now(),
        source: options.name || 'mock-cache'
      };
    }
  };
}

/**
 * Create a cache instance with the specified options - alias for createMockCache
 */
export function createCache<K = any, V = any>(options: CacheOptions = {}): CacheModelInterface<K, V> {
  return createMockCache(options) as CacheModelInterface<K, V>;
}

/**
 * Create and initialize a cache in a single step
 */
export async function createAndInitializeCache<K = any, V = any>(
  options: CacheOptions = {}
): Promise<CacheModelInterface<K, V>> {
  const instance = createMockCache(options) as CacheModelInterface<K, V>;
  // Ensure TypeScript knows initialize exists
  if (instance.initialize) {
    await instance.initialize();
  }
  return instance;
}

/**
 * Create an LRU cache
 */
export function createLRUCache<K = any, V = any>(
  maxSize: number = 1000,
  options: Partial<CacheOptions> = {}
): CacheModelInterface<K, V> {
  return createMockCache({
    ...options,
    maxSize,
    strategy: 'lru'
  }) as CacheModelInterface<K, V>;
}

/**
 * Create an LFU cache
 */
export function createLFUCache<K = any, V = any>(
  maxSize: number = 1000,
  options: Partial<CacheOptions> = {}
): CacheModelInterface<K, V> {
  return createMockCache({
    ...options,
    maxSize,
    strategy: 'lfu'
  }) as CacheModelInterface<K, V>;
}

/**
 * Create a time-based cache
 */
export function createTimeBasedCache<K = any, V = any>(
  maxAge: number,
  maxSize: number = 1000,
  options: Partial<CacheOptions> = {}
): CacheModelInterface<K, V> {
  return createMockCache({
    ...options,
    maxSize,
    maxAge,
    strategy: 'time'
  }) as CacheModelInterface<K, V>;
}

/**
 * Create a composite cache with multiple strategies
 */
export function createCompositeCache<K = any, V = any>(
  strategies: Array<{type: 'lru' | 'lfu' | 'time', weight?: number}>,
  maxSize: number = 1000,
  options: Partial<CacheOptions> = {}
): CacheModelInterface<K, V> {
  return createMockCache({
    ...options,
    maxSize,
    strategy: 'composite',
    strategyOptions: { strategies }
  }) as CacheModelInterface<K, V>;
}

/**
 * Utility function for memoizing function results
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: Partial<CacheOptions> = {}
): T {
  // Simple mock implementation that just returns the original function
  return fn;
}

/**
 * Utility function for memoizing async function results
 */
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: Partial<CacheOptions> = {}
): T {
  // Simple mock implementation that just returns the original function
  return fn;
}

// Export constants
export { DEFAULT_METRICS };

// Re-export types from the actual module
export * from '../types';
export * from '../strategies/types';
