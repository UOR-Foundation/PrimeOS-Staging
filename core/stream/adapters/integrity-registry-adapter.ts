/**
 * Integrity Adapter for Stream Processing
 * =====================================
 * 
 * Simple adapter to integrate stream processing with the actual integrity module
 * from the core/integrity module, following the encoding module's proven pattern.
 * 
 * Production implementation - no fallbacks or mocks.
 */

import { IntegrityImplementation, createIntegrity } from '../../integrity';
import { Factor, VerificationResult, ChecksumExtraction } from '../../integrity/types';

/**
 * Performance metrics for the integrity adapter
 */
interface IntegrityMetrics {
  checksumsGenerated: number;
  checksumsAttached: number;
  integritiesVerified: number;
  checksumsExtracted: number;
  xorCalculations: number;
  totalOperationTime: number;
  errorCount: number;
  integrityFailures: number;
  averageResponseTime: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * Cache entry for integrity operations
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

/**
 * Simple adapter class to wrap the integrity module for stream processing use
 */
export class IntegrityAdapter {
  private integrity: IntegrityImplementation;
  private initialized = false;
  private metrics: IntegrityMetrics;
  private cache: Map<string, CacheEntry<any>>;
  private maxCacheSize: number;
  private cacheExpiryMs: number;
  private enableCaching: boolean;
  private logger?: any;
  
  constructor(
    integrity: IntegrityImplementation,
    options: {
      enableCaching?: boolean;
      maxCacheSize?: number;
      cacheExpiryMs?: number;
      logger?: any;
    } = {}
  ) {
    if (!integrity) {
      throw new Error('Integrity module is required - no fallbacks allowed in production');
    }
    this.integrity = integrity;
    this.enableCaching = options.enableCaching ?? true;
    this.maxCacheSize = options.maxCacheSize || 500;
    this.cacheExpiryMs = options.cacheExpiryMs || 600000; // 10 minutes
    this.logger = options.logger;
    this.cache = new Map();
    this.metrics = {
      checksumsGenerated: 0,
      checksumsAttached: 0,
      integritiesVerified: 0,
      checksumsExtracted: 0,
      xorCalculations: 0,
      totalOperationTime: 0,
      errorCount: 0,
      integrityFailures: 0,
      averageResponseTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
  
  /**
   * Ensure the integrity module is initialized
   */
  async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      const startTime = performance.now();
      try {
        const result = await this.integrity.initialize();
        if (!result.success) {
          throw new Error(`Failed to initialize integrity module: ${result.error}`);
        }
        this.initialized = true;
        
        if (this.logger) {
          await this.logger.debug('Integrity adapter initialized', {
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
   * Generate a checksum from prime factors with caching
   */
  async generateChecksum(factors: Factor[], primeRegistry?: any): Promise<bigint> {
    const startTime = performance.now();
    const cacheKey = this.generateFactorsCacheKey('checksum', factors);
    
    try {
      await this.ensureInitialized();
      this.metrics.checksumsGenerated++;
      
      // Check cache first
      if (this.enableCaching && this.hasValidCacheEntry(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.cache.get(cacheKey)!;
        cached.accessCount++;
        return cached.value;
      }
      
      // Generate checksum
      const result = await this.integrity.generateChecksum(factors, primeRegistry);
      
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
        await this.logger.error('Checksum generation failed', { 
          factorCount: factors.length, 
          error 
        });
      }
      throw error;
    }
  }
  
  /**
   * Verify the integrity of a checksummed value with caching
   */
  async verifyIntegrity(value: bigint, primeRegistry?: any): Promise<VerificationResult> {
    const startTime = performance.now();
    const cacheKey = `verify:${value.toString()}`;
    
    try {
      await this.ensureInitialized();
      this.metrics.integritiesVerified++;
      
      // Check cache first (only for smaller values)
      if (this.enableCaching && value < 1000000n && this.hasValidCacheEntry(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.cache.get(cacheKey)!;
        cached.accessCount++;
        return cached.value;
      }
      
      // Verify integrity
      const result = await this.integrity.verifyIntegrity(value, primeRegistry);
      
      // Track integrity failures
      if (!result.valid) {
        this.metrics.integrityFailures++;
      }
      
      // Cache the result (only for smaller values and successful verifications)
      if (this.enableCaching && value < 1000000n && result.valid) {
        this.setCacheEntry(cacheKey, result);
        this.metrics.cacheMisses++;
      }
      
      this.updateMetrics(startTime);
      return result;
      
    } catch (error) {
      this.metrics.errorCount++;
      this.metrics.integrityFailures++;
      if (this.logger) {
        await this.logger.error('Integrity verification failed', { 
          value: value.toString(),
          error 
        });
      }
      throw error;
    }
  }
  
  /**
   * Calculate XOR sum for factors with caching
   */
  async calculateXorSum(factors: Factor[], primeRegistry?: any): Promise<number> {
    const startTime = performance.now();
    const cacheKey = this.generateFactorsCacheKey('xor', factors);
    
    try {
      await this.ensureInitialized();
      this.metrics.xorCalculations++;
      
      // Check cache first
      if (this.enableCaching && this.hasValidCacheEntry(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.cache.get(cacheKey)!;
        cached.accessCount++;
        return cached.value;
      }
      
      // Calculate XOR sum
      const result = await this.integrity.calculateXorSum(factors, primeRegistry);
      
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
        await this.logger.error('XOR calculation failed', { 
          factorCount: factors.length,
          error 
        });
      }
      throw error;
    }
  }
  
  /**
   * Extract checksum from a value with caching
   */
  async extractChecksum(value: bigint, primeRegistry?: any): Promise<ChecksumExtraction> {
    const startTime = performance.now();
    const cacheKey = `extract:${value.toString()}`;
    
    try {
      await this.ensureInitialized();
      this.metrics.checksumsExtracted++;
      
      // Check cache first (only for smaller values)
      if (this.enableCaching && value < 1000000n && this.hasValidCacheEntry(cacheKey)) {
        this.metrics.cacheHits++;
        const cached = this.cache.get(cacheKey)!;
        cached.accessCount++;
        return cached.value;
      }
      
      // Extract checksum
      const result = await this.integrity.extractChecksum(value, primeRegistry);
      
      // Cache the result (only for smaller values and successful extractions)
      if (this.enableCaching && value < 1000000n && result.valid) {
        this.setCacheEntry(cacheKey, result);
        this.metrics.cacheMisses++;
      }
      
      this.updateMetrics(startTime);
      return result;
      
    } catch (error) {
      this.metrics.errorCount++;
      if (this.logger) {
        await this.logger.error('Checksum extraction failed', { 
          value: value.toString(),
          error 
        });
      }
      throw error;
    }
  }
  
  /**
   * Get the underlying integrity instance
   */
  getIntegrity(): IntegrityImplementation {
    return this.integrity;
  }
  
  /**
   * Get performance metrics
   */
  getMetrics(): IntegrityMetrics {
    const totalOperations = this.metrics.checksumsGenerated + this.metrics.checksumsAttached + 
                           this.metrics.integritiesVerified + this.metrics.checksumsExtracted + 
                           this.metrics.xorCalculations;
    
    return {
      ...this.metrics,
      averageResponseTime: totalOperations > 0 ? this.metrics.totalOperationTime / totalOperations : 0
    };
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    if (this.logger) {
      this.logger.debug('Integrity adapter cache cleared').catch(() => {});
    }
  }
  
  /**
   * Terminate the integrity module and cleanup
   */
  async terminate(): Promise<void> {
    if (this.initialized) {
      await this.integrity.terminate();
      this.initialized = false;
    }
    
    this.clearCache();
    
    if (this.logger) {
      await this.logger.debug('Integrity adapter terminated', {
        finalMetrics: this.getMetrics()
      });
    }
  }
  
  // Private helper methods
  
  private generateFactorsCacheKey(prefix: string, factors: Factor[]): string {
    const factorStr = factors
      .map(f => `${f.prime}^${f.exponent}`)
      .sort()
      .join('*');
    return `${prefix}:${factorStr}`;
  }
  
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
    
    // Remove 25% of entries (at least 1)
    const removeCount = Math.max(1, Math.floor(this.cache.size * 0.25));
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }
  
  private updateMetrics(startTime: number): void {
    this.metrics.totalOperationTime += performance.now() - startTime;
  }
}

/**
 * Create a new simple integrity adapter
 * Production version - requires valid integrity module, no fallbacks
 */
export function createIntegrityAdapter(
  integrity: IntegrityImplementation,
  options?: {
    enableCaching?: boolean;
    maxCacheSize?: number;
    cacheExpiryMs?: number;
    logger?: any;
  }
): IntegrityAdapter {
  if (!integrity) {
    throw new Error('Integrity module is required for production integrity adapter - no fallbacks allowed');
  }
  return new IntegrityAdapter(integrity, options);
}
