/**
 * Prime Registry Adapter for Stream Processing
 * ===========================================
 * 
 * Simple adapter to integrate stream processing with the actual prime registry
 * from the core/prime module, following the encoding module's proven pattern.
 * 
 * Production implementation - no fallbacks or mocks.
 */

import { PrimeRegistryModel, createPrimeRegistry } from '../../prime';
import { Factor, PrimeRegistryInterface } from '../../prime/types';

/**
 * Performance metrics for the adapter
 */
interface AdapterMetrics {
  primeRequests: number;
  indexRequests: number;
  factorizations: number;
  primalityTests: number;
  totalOperationTime: number;
  errorCount: number;
  averageResponseTime: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * Cache entry for prime operations
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

/**
 * Simple adapter class to wrap the prime registry for stream processing use
 */
export class PrimeRegistryAdapter {
  private registry: PrimeRegistryInterface;
  private initialized = false;
  private metrics: AdapterMetrics;
  private cache: Map<string, CacheEntry<any>>;
  private maxCacheSize: number;
  private cacheExpiryMs: number;
  private enableCaching: boolean;
  private logger?: any;
  
  constructor(
    registry: PrimeRegistryInterface, 
    options: {
      enableCaching?: boolean;
      maxCacheSize?: number;
      cacheExpiryMs?: number;
      logger?: any;
    } = {}
  ) {
    if (!registry) {
      throw new Error('Prime registry is required - no fallbacks allowed in production');
    }
    this.registry = registry;
    this.enableCaching = options.enableCaching ?? true;
    this.maxCacheSize = options.maxCacheSize || 1000;
    this.cacheExpiryMs = options.cacheExpiryMs || 300000; // 5 minutes
    this.logger = options.logger;
    this.cache = new Map();
    this.metrics = {
      primeRequests: 0,
      indexRequests: 0,
      factorizations: 0,
      primalityTests: 0,
      totalOperationTime: 0,
      errorCount: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
  
  /**
   * Ensure the registry is initialized
   */
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      const startTime = performance.now();
      try {
        // Check if registry has initialize method
        const registryAny = this.registry as any;
        if (typeof registryAny.initialize === 'function') {
          const result = await registryAny.initialize();
          if (!result.success) {
            throw new Error(`Failed to initialize prime registry: ${result.error}`);
          }
        }
        this.initialized = true;
        
        if (this.logger) {
          await this.logger.debug('Prime registry adapter initialized', {
            initTime: performance.now() - startTime,
            enableCaching: this.enableCaching,
            maxCacheSize: this.maxCacheSize
          });
        }
      } catch (error) {
        this.metrics.errorCount++;
        throw error;
      }
    }
  }
  
  /**
   * Get prime at specific index with caching
   */
  getPrime(index: number): bigint {
    const startTime = performance.now();
    const cacheKey = `prime:${index}`;
    
    try {
      if (!this.initialized) {
        throw new Error('Prime registry not initialized - call ensureInitialized() first');
      }
      
      this.metrics.primeRequests++;
      
      // Check cache first
      if (this.enableCaching && this.hasValidCacheEntry(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.cache.get(cacheKey)!;
        cached.accessCount++;
        return cached.value;
      }
      
      // Get from registry
      const result = this.registry.getPrime(index);
      
      // Cache the result
      if (this.enableCaching) {
        this.setCacheEntry(cacheKey, result);
        this.metrics.cacheMisses++;
      }
      
      this.updateMetrics(startTime);
      return result;
      
    } catch (error) {
      this.metrics.errorCount++;
      if (this.logger) {
        this.logger.error('Prime retrieval failed', { index, error }).catch(() => {});
      }
      throw error;
    }
  }
  
  /**
   * Get index of a prime with caching
   */
  getIndex(prime: bigint): number {
    const startTime = performance.now();
    const cacheKey = `index:${prime.toString()}`;
    
    try {
      if (!this.initialized) {
        throw new Error('Prime registry not initialized - call ensureInitialized() first');
      }
      
      this.metrics.indexRequests++;
      
      // Check cache first
      if (this.enableCaching && this.hasValidCacheEntry(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.cache.get(cacheKey)!;
        cached.accessCount++;
        return cached.value;
      }
      
      // Get from registry
      const result = this.registry.getIndex(prime);
      
      // Cache the result
      if (this.enableCaching) {
        this.setCacheEntry(cacheKey, result);
        this.metrics.cacheMisses++;
      }
      
      this.updateMetrics(startTime);
      return result;
      
    } catch (error) {
      this.metrics.errorCount++;
      if (this.logger) {
        this.logger.error('Index retrieval failed', { prime: prime.toString(), error }).catch(() => {});
      }
      throw error;
    }
  }
  
  /**
   * Factor a number into prime components with caching
   */
  factor(n: bigint): Factor[] {
    const startTime = performance.now();
    const cacheKey = `factor:${n.toString()}`;
    
    try {
      if (!this.initialized) {
        throw new Error('Prime registry not initialized - call ensureInitialized() first');
      }
      
      this.metrics.factorizations++;
      
      // Check cache first (only for smaller numbers to avoid memory issues)
      if (this.enableCaching && n < 1000000n && this.hasValidCacheEntry(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.cache.get(cacheKey)!;
        cached.accessCount++;
        return cached.value;
      }
      
      // Get from registry
      const result = this.registry.factor(n);
      
      // Cache the result (only for smaller numbers)
      if (this.enableCaching && n < 1000000n) {
        this.setCacheEntry(cacheKey, result);
        this.metrics.cacheMisses++;
      }
      
      this.updateMetrics(startTime);
      return result;
      
    } catch (error) {
      this.metrics.errorCount++;
      if (this.logger) {
        this.logger.error('Factorization failed', { n: n.toString(), error }).catch(() => {});
      }
      throw error;
    }
  }
  
  /**
   * Test if a number is prime with caching
   */
  isPrime(n: bigint): boolean {
    const startTime = performance.now();
    const cacheKey = `isPrime:${n.toString()}`;
    
    try {
      if (!this.initialized) {
        throw new Error('Prime registry not initialized - call ensureInitialized() first');
      }
      
      this.metrics.primalityTests++;
      
      // Check cache first (only for smaller numbers)
      if (this.enableCaching && n < 1000000n && this.hasValidCacheEntry(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.cache.get(cacheKey)!;
        cached.accessCount++;
        return cached.value;
      }
      
      // Get from registry
      const result = this.registry.isPrime(n);
      
      // Cache the result (only for smaller numbers)
      if (this.enableCaching && n < 1000000n) {
        this.setCacheEntry(cacheKey, result);
        this.metrics.cacheMisses++;
      }
      
      this.updateMetrics(startTime);
      return result;
      
    } catch (error) {
      this.metrics.errorCount++;
      if (this.logger) {
        this.logger.error('Primality test failed', { n: n.toString(), error }).catch(() => {});
      }
      throw error;
    }
  }
  
  /**
   * Get the underlying registry instance
   */
  getRegistry(): PrimeRegistryInterface {
    return this.registry;
  }
  
  /**
   * Get performance metrics
   */
  getMetrics(): AdapterMetrics {
    const totalRequests = this.metrics.primeRequests + this.metrics.indexRequests + 
                         this.metrics.factorizations + this.metrics.primalityTests;
    
    return {
      ...this.metrics,
      averageResponseTime: totalRequests > 0 ? this.metrics.totalOperationTime / totalRequests : 0
    };
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    if (this.logger) {
      this.logger.debug('Prime adapter cache cleared').catch(() => {});
    }
  }
  
  /**
   * Terminate the registry and cleanup
   */
  async terminate(): Promise<void> {
    if (this.initialized) {
      // Check if registry has terminate method
      const registryAny = this.registry as any;
      if (typeof registryAny.terminate === 'function') {
        await registryAny.terminate();
      }
      this.initialized = false;
    }
    
    this.clearCache();
    
    if (this.logger) {
      await this.logger.debug('Prime registry adapter terminated', {
        finalMetrics: this.getMetrics()
      });
    }
  }
  
  // Private helper methods
  
  private hasValidCacheEntry(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const age = Date.now() - entry.timestamp;
    if (age > this.cacheExpiryMs) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  private setCacheEntry<T>(key: string, value: T): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestEntries();
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1
    });
  }
  
  private evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by timestamp and access count (LRU strategy)
    entries.sort((a, b) => {
      const ageA = Date.now() - a[1].timestamp;
      const ageB = Date.now() - b[1].timestamp;
      const scoreA = ageA / (a[1].accessCount + 1);
      const scoreB = ageB / (b[1].accessCount + 1);
      return scoreB - scoreA;
    });
    
    // Remove 25% of entries
    const removeCount = Math.floor(this.cache.size * 0.25);
    for (let i = 0; i < removeCount; i++) {
      this.cache.delete(entries[i][0]);
    }
  }
  
  private updateMetrics(startTime: number): void {
    this.metrics.totalOperationTime += performance.now() - startTime;
  }
}

/**
 * Create a new simple prime registry adapter
 * Production version - requires valid registry, no fallbacks
 */
export function createPrimeRegistryAdapter(
  registry: PrimeRegistryInterface,
  options?: {
    enableCaching?: boolean;
    maxCacheSize?: number;
    cacheExpiryMs?: number;
    logger?: any;
  }
): PrimeRegistryAdapter {
  if (!registry) {
    throw new Error('Prime registry is required for production prime adapter - no fallbacks allowed');
  }
  return new PrimeRegistryAdapter(registry, options);
}
