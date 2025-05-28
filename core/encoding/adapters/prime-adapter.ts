/**
 * Prime Registry Adapter for Encoding
 * ==================================
 * 
 * Enhanced adapter to integrate the encoding module with the actual prime registry
 * from the core/prime module, providing a consistent interface with performance
 * monitoring, caching, and batch processing capabilities.
 * 
 * Production implementation - no fallbacks or mocks.
 */

import { PrimeRegistryModel, createPrimeRegistry } from '../../prime';
import { Factor } from '../../prime/types';

/**
 * Performance metrics for the adapter
 */
interface AdapterMetrics {
  primeRequests: number;
  indexRequests: number;
  factorizations: number;
  primalityTests: number;
  batchOperations: number;
  cacheHits: number;
  cacheMisses: number;
  totalOperationTime: number;
  errorCount: number;
  averageResponseTime: number;
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
 * Batch operation request
 */
interface BatchRequest {
  type: 'getPrime' | 'getIndex' | 'factor' | 'isPrime';
  input: number | bigint;
  id: string;
}

/**
 * Batch operation result
 */
interface BatchResult {
  id: string;
  result: any;
  error?: string;
}

/**
 * Enhanced adapter class to wrap the prime registry for encoding module use
 */
export class PrimeRegistryAdapter {
  private registry: PrimeRegistryModel;
  private initialized = false;
  private metrics: AdapterMetrics;
  private cache: Map<string, CacheEntry<any>>;
  private maxCacheSize: number;
  private cacheExpiryMs: number;
  private enableCaching: boolean;
  private logger?: any;
  
  constructor(
    registry: PrimeRegistryModel, 
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
      batchOperations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalOperationTime: 0,
      errorCount: 0,
      averageResponseTime: 0
    };
  }
  
  /**
   * Ensure the registry is initialized
   */
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      const startTime = performance.now();
      try {
        const result = await this.registry.initialize();
        if (!result.success) {
          throw new Error(`Failed to initialize prime registry: ${result.error}`);
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
  async getPrime(index: number): Promise<bigint> {
    const startTime = performance.now();
    const cacheKey = `prime:${index}`;
    
    try {
      await this.ensureInitialized();
      this.metrics.primeRequests++;
      
      // Check cache first
      if (this.enableCaching && this.hasValidCacheEntry(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.cache.get(cacheKey)!;
        cached.accessCount++;
        return cached.value;
      }
      
      // Get from registry
      const result = await this.registry.getPrime(index);
      
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
        await this.logger.error('Prime retrieval failed', { index, error });
      }
      throw error;
    }
  }
  
  /**
   * Get index of a prime with caching
   */
  async getIndex(prime: bigint): Promise<number> {
    const startTime = performance.now();
    const cacheKey = `index:${prime.toString()}`;
    
    try {
      await this.ensureInitialized();
      this.metrics.indexRequests++;
      
      // Check cache first
      if (this.enableCaching && this.hasValidCacheEntry(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.cache.get(cacheKey)!;
        cached.accessCount++;
        return cached.value;
      }
      
      // Get from registry
      const result = await this.registry.getIndex(prime);
      
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
        await this.logger.error('Index retrieval failed', { prime: prime.toString(), error });
      }
      throw error;
    }
  }
  
  /**
   * Factor a number into prime components with caching
   */
  async factor(n: bigint): Promise<Factor[]> {
    const startTime = performance.now();
    const cacheKey = `factor:${n.toString()}`;
    
    try {
      await this.ensureInitialized();
      this.metrics.factorizations++;
      
      // Check cache first (only for smaller numbers to avoid memory issues)
      if (this.enableCaching && n < 1000000n && this.hasValidCacheEntry(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.cache.get(cacheKey)!;
        cached.accessCount++;
        return cached.value;
      }
      
      // Get from registry
      const result = await this.registry.factor(n);
      
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
        await this.logger.error('Factorization failed', { n: n.toString(), error });
      }
      throw error;
    }
  }
  
  /**
   * Test if a number is prime with caching
   */
  async isPrime(n: bigint): Promise<boolean> {
    const startTime = performance.now();
    const cacheKey = `isPrime:${n.toString()}`;
    
    try {
      await this.ensureInitialized();
      this.metrics.primalityTests++;
      
      // Check cache first (only for smaller numbers)
      if (this.enableCaching && n < 1000000n && this.hasValidCacheEntry(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.cache.get(cacheKey)!;
        cached.accessCount++;
        return cached.value;
      }
      
      // Get from registry
      const result = await this.registry.isPrime(n);
      
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
        await this.logger.error('Primality test failed', { n: n.toString(), error });
      }
      throw error;
    }
  }
  
  /**
   * Batch process multiple operations for efficiency
   */
  async batchProcess(requests: BatchRequest[]): Promise<BatchResult[]> {
    const startTime = performance.now();
    
    try {
      await this.ensureInitialized();
      this.metrics.batchOperations++;
      
      const results: BatchResult[] = [];
      
      // Process requests in parallel with controlled concurrency
      const concurrency = Math.min(10, requests.length);
      const chunks: BatchRequest[][] = [];
      
      for (let i = 0; i < requests.length; i += concurrency) {
        chunks.push(requests.slice(i, i + concurrency));
      }
      
      for (const chunk of chunks) {
        const chunkResults = await Promise.allSettled(
          chunk.map(async (request) => {
            try {
              let result: any;
              
              switch (request.type) {
                case 'getPrime':
                  result = await this.getPrime(request.input as number);
                  break;
                case 'getIndex':
                  result = await this.getIndex(request.input as bigint);
                  break;
                case 'factor':
                  result = await this.factor(request.input as bigint);
                  break;
                case 'isPrime':
                  result = await this.isPrime(request.input as bigint);
                  break;
                default:
                  throw new Error(`Unknown batch operation type: ${request.type}`);
              }
              
              return { id: request.id, result };
            } catch (error) {
              return {
                id: request.id,
                result: null,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
            }
          })
        );
        
        results.push(...chunkResults.map(r => 
          r.status === 'fulfilled' ? r.value : r.reason
        ));
      }
      
      this.updateMetrics(startTime);
      
      if (this.logger) {
        await this.logger.debug('Batch processing completed', {
          requestCount: requests.length,
          successCount: results.filter(r => !r.error).length,
          errorCount: results.filter(r => r.error).length,
          processingTime: performance.now() - startTime
        });
      }
      
      return results;
      
    } catch (error) {
      this.metrics.errorCount++;
      if (this.logger) {
        await this.logger.error('Batch processing failed', { 
          requestCount: requests.length, 
          error 
        });
      }
      throw error;
    }
  }
  
  /**
   * Get the underlying registry instance
   */
  getRegistry(): PrimeRegistryModel {
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
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    entries: Array<{key: string; accessCount: number; age: number}>;
  } {
    const totalAccesses = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = totalAccesses > 0 ? this.metrics.cacheHits / totalAccesses : 0;
    
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      age: Date.now() - entry.timestamp
    }));
    
    return {
      size: this.cache.size,
      hitRate,
      entries
    };
  }
  
  /**
   * Synchronous versions for performance-critical paths
   */
  getPrimeSync(index: number): bigint {
    if (!this.initialized) {
      throw new Error('Prime registry not initialized - call ensureInitialized() first');
    }
    
    const cacheKey = `prime:${index}`;
    if (this.enableCaching && this.hasValidCacheEntry(cacheKey)) {
      this.metrics.cacheHits++;
      const cached = this.cache.get(cacheKey)!;
      cached.accessCount++;
      return cached.value;
    }
    
    const result = this.registry.getPrime(index);
    
    if (this.enableCaching) {
      this.setCacheEntry(cacheKey, result);
      this.metrics.cacheMisses++;
    }
    
    this.metrics.primeRequests++;
    return result;
  }
  
  getIndexSync(prime: bigint): number {
    if (!this.initialized) {
      throw new Error('Prime registry not initialized - call ensureInitialized() first');
    }
    
    const cacheKey = `index:${prime.toString()}`;
    if (this.enableCaching && this.hasValidCacheEntry(cacheKey)) {
      this.metrics.cacheHits++;
      const cached = this.cache.get(cacheKey)!;
      cached.accessCount++;
      return cached.value;
    }
    
    const result = this.registry.getIndex(prime);
    
    if (this.enableCaching) {
      this.setCacheEntry(cacheKey, result);
      this.metrics.cacheMisses++;
    }
    
    this.metrics.indexRequests++;
    return result;
  }
  
  factorSync(n: bigint): Factor[] {
    if (!this.initialized) {
      throw new Error('Prime registry not initialized - call ensureInitialized() first');
    }
    
    const cacheKey = `factor:${n.toString()}`;
    if (this.enableCaching && n < 1000000n && this.hasValidCacheEntry(cacheKey)) {
      this.metrics.cacheHits++;
      const cached = this.cache.get(cacheKey)!;
      cached.accessCount++;
      return cached.value;
    }
    
    const result = this.registry.factor(n);
    
    if (this.enableCaching && n < 1000000n) {
      this.setCacheEntry(cacheKey, result);
      this.metrics.cacheMisses++;
    }
    
    this.metrics.factorizations++;
    return result;
  }
  
  isPrimeSync(n: bigint): boolean {
    if (!this.initialized) {
      throw new Error('Prime registry not initialized - call ensureInitialized() first');
    }
    
    const cacheKey = `isPrime:${n.toString()}`;
    if (this.enableCaching && n < 1000000n && this.hasValidCacheEntry(cacheKey)) {
      this.metrics.cacheHits++;
      const cached = this.cache.get(cacheKey)!;
      cached.accessCount++;
      return cached.value;
    }
    
    const result = this.registry.isPrime(n);
    
    if (this.enableCaching && n < 1000000n) {
      this.setCacheEntry(cacheKey, result);
      this.metrics.cacheMisses++;
    }
    
    this.metrics.primalityTests++;
    return result;
  }
  
  /**
   * Terminate the registry and cleanup
   */
  async terminate(): Promise<void> {
    if (this.initialized) {
      await this.registry.terminate();
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
 * Create a new enhanced prime registry adapter
 * Production version - requires valid registry, no fallbacks
 */
export function createPrimeAdapter(
  registry: PrimeRegistryModel,
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

/**
 * Create multiple adapter instances for load balancing
 */
export function createPrimeAdapterPool(
  registries: PrimeRegistryModel[],
  options?: {
    enableCaching?: boolean;
    maxCacheSize?: number;
    cacheExpiryMs?: number;
    logger?: any;
  }
): PrimeRegistryAdapter[] {
  if (!registries || registries.length === 0) {
    throw new Error('At least one prime registry is required for adapter pool');
  }
  
  return registries.map(registry => createPrimeAdapter(registry, options));
}
