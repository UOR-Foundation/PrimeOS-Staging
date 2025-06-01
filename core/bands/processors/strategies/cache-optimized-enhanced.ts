/**
 * Enhanced Cache-Optimized Strategy
 * =================================
 * 
 * BASS band processor (33-64 bits) using REAL precision cache system
 * from core/precision/cache instead of primitive Map-based caching.
 * 
 * This replaces simple Maps with production-grade caching infrastructure.
 */

import { BaseStrategyProcessor, BaseStrategyConfig } from '../strategy-processor';
import { BandType, ProcessingContext } from '../../types';

// Import the production-grade cache system from precision module
import { 
  createLRUCache, 
  createLFUCache, 
  createTimeBasedCache,
  createCompositeCache,
  CacheModelInterface,
  memoize,
  memoizeAsync
} from '../../../precision/cache';

/**
 * Real cache configuration for BASS band using precision cache system
 */
interface EnhancedCacheConfig {
  maxPrimes: number;
  segmentSize: number;
  precomputeLimit: number;
  lookupTableSize: number;
  // Cache-specific settings
  cacheStrategy: 'lru' | 'lfu' | 'time' | 'composite';
  maxCacheSize: number;
  cacheTTL: number; // Time-to-live in milliseconds
  enableMetrics: boolean;
}

/**
 * Enhanced cache-optimized strategy using REAL precision cache system
 */
export class EnhancedCacheOptimizedStrategy extends BaseStrategyProcessor {
  // Replace primitive Maps with production-grade caches
  private primeCache!: CacheModelInterface<string, boolean>;
  private factorCache!: CacheModelInterface<string, Array<{prime: bigint, exponent: number}>>;
  private lookupCache!: CacheModelInterface<number, number[]>;
  private sieveCache!: CacheModelInterface<number, boolean[]>;
  private segmentCache!: CacheModelInterface<string, { isPrime: boolean, segment: boolean[] }>;
  
  private cacheConfig: EnhancedCacheConfig;
  private cacheStats = {
    primeHits: 0,
    factorHits: 0,
    lookupHits: 0,
    sieveHits: 0,
    totalRequests: 0
  };
  
  constructor(config: BaseStrategyConfig = {}) {
    super({
      enableCaching: true,
      cacheSize: 2000,
      ...config
    });
    
    this.cacheConfig = {
      maxPrimes: 10000,
      segmentSize: 4096,
      precomputeLimit: 1000000,
      lookupTableSize: 8192,
      // Enhanced cache settings
      cacheStrategy: 'composite', // Use sophisticated composite strategy
      maxCacheSize: 5000, // Larger cache for better performance
      cacheTTL: 30 * 60 * 1000, // 30 minutes TTL
      enableMetrics: true
    };
    
    // Initialize REAL precision cache system
    this.initializeRealCaches().catch(console.error);
  }
  
  /**
   * Initialize production-grade caches from precision module
   */
  private async initializeRealCaches(): Promise<void> {
    // Create sophisticated composite cache for prime testing
    this.primeCache = createCompositeCache<string, boolean>(
      [
        { type: 'lru', weight: 0.6 }, // Favor recent access
        { type: 'lfu', weight: 0.4 }  // But also consider frequency
      ],
      this.cacheConfig.maxCacheSize,
      {
        maxAge: this.cacheConfig.cacheTTL,
        metrics: this.cacheConfig.enableMetrics,
        name: 'prime-cache',
        debug: false
      }
    );
    
    // Create LFU cache for factor results (frequently used factors are valuable)
    this.factorCache = createLFUCache<string, Array<{prime: bigint, exponent: number}>>(
      this.cacheConfig.maxCacheSize * 2, // Larger cache for factors
      {
        maxAge: this.cacheConfig.cacheTTL,
        metrics: this.cacheConfig.enableMetrics,
        name: 'factor-cache',
        debug: false
      }
    );
    
    // Create LRU cache for lookup tables (recent lookups are likely to be used again)
    this.lookupCache = createLRUCache<number, number[]>(
      100, // Smaller cache for lookup tables
      {
        metrics: this.cacheConfig.enableMetrics,
        name: 'lookup-cache',
        debug: false
      }
    );
    
    // Create time-based cache for sieve segments (they can expire)
    this.sieveCache = createTimeBasedCache<number, boolean[]>(
      this.cacheConfig.cacheTTL / 2, // Shorter TTL for sieve data
      this.cacheConfig.maxCacheSize,
      {
        metrics: this.cacheConfig.enableMetrics,
        name: 'sieve-cache',
        debug: false
      }
    );
    
    // Create LRU cache for segmented sieve results
    this.segmentCache = createLRUCache<string, { isPrime: boolean, segment: boolean[] }>(
      1000,
      {
        maxAge: this.cacheConfig.cacheTTL,
        metrics: this.cacheConfig.enableMetrics,
        name: 'segment-cache',
        debug: false
      }
    );
    
    // Initialize all caches
    await Promise.all([
      this.primeCache.initialize(),
      this.factorCache.initialize(),
      this.lookupCache.initialize(),
      this.sieveCache.initialize(),
      this.segmentCache.initialize()
    ]);
    
    console.debug('Enhanced cache-optimized strategy initialized with precision cache system');
  }
  
  /**
   * Check if this strategy supports the given band
   */
  supports(band: BandType): boolean {
    return band === BandType.BASS;
  }
  
  /**
   * Execute enhanced cache-optimized strategy
   */
  protected async executeStrategy(input: any, context: ProcessingContext): Promise<any> {
    this.cacheStats.totalRequests++;
    
    // Handle different input types with REAL caching
    if (typeof input === 'bigint' || typeof input === 'number') {
      return this.processNumberWithRealCache(input, context);
    } else if (Array.isArray(input)) {
      return this.processBatchWithRealCache(input, context);
    } else if (input && typeof input === 'object' && 'operation' in input) {
      return this.processOperationWithRealCache(input, context);
    } else {
      throw new Error(`Unsupported input type for enhanced cache-optimized processing: ${typeof input}`);
    }
  }
  
  /**
   * Process a single number using REAL precision cache system
   */
  private async processNumberWithRealCache(n: bigint | number, context: ProcessingContext): Promise<any> {
    const num = typeof n === 'bigint' ? n : BigInt(n);
    
    // Validate number is in BASS range (33-64 bits)
    const bitSize = num.toString(2).length;
    if (bitSize < 33 || bitSize > 64) {
      throw new Error(`Number out of BASS band range: ${bitSize} bits (expected 33-64)`);
    }
    
    // Check REAL cache first using precision cache system
    const cacheKey = num.toString();
    const cachedResult = this.factorCache.get(cacheKey);
    
    if (cachedResult !== undefined) {
      this.cacheStats.factorHits++;
      return {
        factors: cachedResult,
        method: 'precision-cache-hit',
        cached: true,
        cacheMetrics: this.factorCache.getMetrics?.()
      };
    }
    
    // Use REAL cached sieve for factorization with precision cache
    const result = await this.realCachedSieveFactorization(num);
    
    // Cache the result using precision cache system
    this.factorCache.set(cacheKey, result.factors);
    
    return result;
  }
  
  /**
   * Process a batch with REAL cache optimization
   */
  private async processBatchWithRealCache(numbers: (bigint | number)[], context: ProcessingContext): Promise<any[]> {
    const results: any[] = new Array(numbers.length);
    const uncachedNumbers: bigint[] = [];
    const numberToIndex: Map<string, number[]> = new Map();
    
    // Separate cached and uncached numbers using REAL precision cache
    for (let i = 0; i < numbers.length; i++) {
      const item = numbers[i];
      if (item === undefined || item === null) {
        results[i] = { error: 'Invalid input: undefined or null', input: item };
        continue;
      }
      
      const num = typeof item === 'bigint' ? item : BigInt(item);
      const cacheKey = num.toString();
      
      const cachedResult = this.factorCache.get(cacheKey);
      if (cachedResult !== undefined) {
        this.cacheStats.factorHits++;
        results[i] = {
          factors: cachedResult,
          method: 'precision-cache-hit',
          cached: true
        };
      } else {
        uncachedNumbers.push(num);
        const indices = numberToIndex.get(cacheKey) || [];
        indices.push(i);
        numberToIndex.set(cacheKey, indices);
      }
    }
    
    // Process uncached numbers with REAL precision cache
    for (const num of uncachedNumbers) {
      try {
        const result = await this.realCachedSieveFactorization(num);
        const cacheKey = num.toString();
        
        // Cache result using precision cache system
        this.factorCache.set(cacheKey, result.factors);
        
        // Update all indices for this number
        const indices = numberToIndex.get(cacheKey) || [];
        for (const index of indices) {
          results[index] = result;
        }
      } catch (error) {
        const cacheKey = num.toString();
        const indices = numberToIndex.get(cacheKey) || [];
        for (const index of indices) {
          results[index] = {
            error: error instanceof Error ? error.message : 'Processing failed',
            input: num
          };
        }
      }
    }
    
    return results;
  }
  
  /**
   * Process operation with REAL cache system
   */
  private async processOperationWithRealCache(operation: any, context: ProcessingContext): Promise<any> {
    switch (operation.type) {
      case 'factor':
        return this.processNumberWithRealCache(operation.value, context);
      case 'isPrime':
        if (operation.value === undefined || operation.value === null) {
          throw new Error('Value cannot be undefined or null for isPrime operation');
        }
        return this.realCachedIsPrime(BigInt(operation.value));
      case 'generatePrimes':
        return this.generatePrimesWithRealCache(operation.start, operation.end);
      case 'primeCount':
        return this.countPrimesWithRealCache(operation.start, operation.end);
      case 'getCacheStats':
        return this.getRealCacheStatistics();
      case 'optimizeCaches':
        return this.optimizeAllRealCaches();
      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }
  }
  
  /**
   * REAL cached sieve factorization using precision cache system
   */
  private async realCachedSieveFactorization(n: bigint): Promise<{ factors: Array<{prime: bigint, exponent: number}>, method: string, cacheStats?: any }> {
    if (n <= 1n) {
      return { factors: [], method: 'enhanced-cached-sieve' };
    }
    
    const factors: Array<{prime: bigint, exponent: number}> = [];
    let remaining = n;
    
    // Use REAL cached small primes from precision cache
    const smallPrimes = await this.getRealCachedSmallPrimes();
    for (const prime of smallPrimes) {
      if (remaining % prime === 0n) {
        let count = 0;
        while (remaining % prime === 0n) {
          remaining /= prime;
          count++;
        }
        factors.push({ prime, exponent: count });
      }
      
      if (prime * prime > remaining) break;
    }
    
    // Use REAL cached segmented sieve with precision cache
    if (remaining > 1n && remaining <= BigInt(this.cacheConfig.precomputeLimit)) {
      const segment = await this.getRealCachedSegmentedSieve(Number(remaining));
      if (segment.isPrime) {
        factors.push({ prime: remaining, exponent: 1 });
      }
    } else if (remaining > 1n) {
      // Use memoized trial division for very large remaining factors
      const memoizedTrialDivision = memoizeAsync(this.trialDivisionLarge.bind(this));
      const largeFactors = await memoizedTrialDivision(remaining);
      factors.push(...largeFactors);
    }
    
    return { 
      factors, 
      method: 'enhanced-cached-sieve',
      cacheStats: {
        factorCacheSize: this.factorCache.getMetrics?.()?.currentSize,
        primeHitRate: this.cacheStats.primeHits / this.cacheStats.totalRequests
      }
    };
  }
  
  /**
   * REAL cached primality test using precision cache system
   */
  private async realCachedIsPrime(n: bigint): Promise<boolean> {
    const cacheKey = n.toString();
    
    // Check REAL precision cache first
    const cachedResult = this.primeCache.get(cacheKey);
    if (cachedResult !== undefined) {
      this.cacheStats.primeHits++;
      return cachedResult;
    }
    
    // Compute using memoized functions from precision cache
    const memoizedCompute = memoize(this.computeIsPrime.bind(this));
    const isPrime = memoizedCompute(n);
    
    // Cache using precision cache system
    this.primeCache.set(cacheKey, isPrime);
    
    return isPrime;
  }
  
  /**
   * Get REAL cached small primes using precision cache system
   */
  private async getRealCachedSmallPrimes(): Promise<bigint[]> {
    const cacheKey = 0; // Special key for small primes
    
    // Check REAL precision cache first
    const cached = this.lookupCache.get(cacheKey);
    if (cached !== undefined) {
      this.cacheStats.lookupHits++;
      return cached.map(p => BigInt(p));
    }
    
    // Generate and cache using precision cache system
    const limit = 65536; // 2^16
    const sieve = new Array(limit + 1).fill(true);
    sieve[0] = sieve[1] = false;
    
    for (let i = 2; i * i <= limit; i++) {
      if (sieve[i]) {
        for (let j = i * i; j <= limit; j += i) {
          sieve[j] = false;
        }
      }
    }
    
    const primes: number[] = [];
    for (let i = 2; i <= limit; i++) {
      if (sieve[i]) primes.push(i);
    }
    
    // Cache using precision cache system with TTL
    this.lookupCache.set(cacheKey, primes);
    
    return primes.map(p => BigInt(p));
  }
  
  /**
   * Get REAL cached segmented sieve using precision cache system
   */
  private async getRealCachedSegmentedSieve(n: number): Promise<{ isPrime: boolean, segment: boolean[] }> {
    const segmentStart = Math.floor(n / this.cacheConfig.segmentSize) * this.cacheConfig.segmentSize;
    const cacheKey = `${segmentStart}-${segmentStart + this.cacheConfig.segmentSize}`;
    
    // Check REAL precision cache first
    const cached = this.segmentCache.get(cacheKey);
    if (cached !== undefined) {
      this.cacheStats.sieveHits++;
      return cached;
    }
    
    // Compute and cache using precision cache system
    const segment = this.computeSegmentedSieve(segmentStart, segmentStart + this.cacheConfig.segmentSize);
    const index = n - segmentStart;
    
    const result = {
      isPrime: segment[index] || false,
      segment
    };
    
    // Cache using precision cache system with TTL
    this.segmentCache.set(cacheKey, result);
    
    return result;
  }
  
  /**
   * Generate primes with REAL cache optimization
   */
  private async generatePrimesWithRealCache(start: number, end: number): Promise<number[]> {
    // Use memoized function for better performance
    const memoizedGenerate = memoize(this.computePrimesInRange.bind(this), {
      maxSize: 100,
      maxAge: this.cacheConfig.cacheTTL
    });
    
    return memoizedGenerate(start, end);
  }
  
  /**
   * Count primes with REAL cache optimization
   */
  private async countPrimesWithRealCache(start: number, end: number): Promise<number> {
    const primes = await this.generatePrimesWithRealCache(start, end);
    return primes.length;
  }
  
  /**
   * Get comprehensive cache statistics from REAL precision cache system
   */
  private getRealCacheStatistics(): any {
    return {
      strategy: {
        primeHits: this.cacheStats.primeHits,
        factorHits: this.cacheStats.factorHits,
        lookupHits: this.cacheStats.lookupHits,
        sieveHits: this.cacheStats.sieveHits,
        totalRequests: this.cacheStats.totalRequests,
        overallHitRate: (this.cacheStats.primeHits + this.cacheStats.factorHits + 
                        this.cacheStats.lookupHits + this.cacheStats.sieveHits) / 
                       Math.max(1, this.cacheStats.totalRequests)
      },
      precisionCaches: {
        primeCache: this.primeCache.getMetrics?.(),
        factorCache: this.factorCache.getMetrics?.(),
        lookupCache: this.lookupCache.getMetrics?.(),
        sieveCache: this.sieveCache.getMetrics?.(),
        segmentCache: this.segmentCache.getMetrics?.()
      }
    };
  }
  
  /**
   * Optimize all REAL precision caches
   */
  private async optimizeAllRealCaches(): Promise<any> {
    const results = await Promise.allSettled([
      this.primeCache.optimize?.(),
      this.factorCache.optimize?.(),
      this.lookupCache.optimize?.(),
      this.sieveCache.optimize?.(),
      this.segmentCache.optimize?.()
    ]);
    
    return {
      optimized: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      cacheStats: this.getRealCacheStatistics()
    };
  }
  
  // Keep computational methods but enhance them with memoization
  private computeIsPrime = memoize((n: bigint): boolean => {
    if (n < 2n) return false;
    if (n === 2n) return true;
    if (n % 2n === 0n) return false;
    
    // Use Miller-Rabin for larger numbers
    if (n > BigInt(this.cacheConfig.precomputeLimit)) {
      return this.millerRabinTest(n);
    }
    
    return true;
  }, { maxSize: 1000 });
  
  private computePrimesInRange = memoize((start: number, end: number): number[] => {
    const primes: number[] = [];
    const sieve = this.getSieveForRange(start, end);
    
    for (let i = Math.max(start, 2); i <= end; i++) {
      if (sieve[i - start]) {
        primes.push(i);
      }
    }
    
    return primes;
  }, { maxSize: 100 });
  
  /**
   * Miller-Rabin primality test (unchanged but could be memoized)
   */
  private millerRabinTest(n: bigint, k: number = 10): boolean {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n) return false;
    
    // Write n-1 as d * 2^r
    let d = n - 1n;
    let r = 0;
    while (d % 2n === 0n) {
      d /= 2n;
      r++;
    }
    
    // Perform k rounds of testing
    for (let i = 0; i < k; i++) {
      const a = this.randomBigInt(2n, n - 2n);
      let x = this.modPow(a, d, n);
      
      if (x === 1n || x === n - 1n) continue;
      
      let composite = true;
      for (let j = 0; j < r - 1; j++) {
        x = this.modPow(x, 2n, n);
        if (x === n - 1n) {
          composite = false;
          break;
        }
      }
      
      if (composite) return false;
    }
    
    return true;
  }
  
  /**
   * Compute segmented sieve for a range (unchanged)
   */
  private computeSegmentedSieve(start: number, end: number): boolean[] {
    const size = end - start;
    const sieve = new Array(size).fill(true);
    
    // Mark even numbers as composite (except 2)
    for (let i = start % 2 === 0 ? 0 : 1; i < size; i += 2) {
      if (start + i !== 2) {
        sieve[i] = false;
      }
    }
    
    // Use cached small primes
    const smallPrimesPromise = this.getRealCachedSmallPrimes();
    smallPrimesPromise.then(smallPrimes => {
      for (const prime of smallPrimes) {
        if (Number(prime) * Number(prime) > end) break;
        
        const firstMultiple = Math.max(Number(prime) * Number(prime), Math.ceil(start / Number(prime)) * Number(prime));
        for (let j = firstMultiple; j < end; j += Number(prime)) {
          sieve[j - start] = false;
        }
      }
    });
    
    return sieve;
  }
  
  /**
   * Get sieve for a specific range (unchanged)
   */
  private getSieveForRange(start: number, end: number): boolean[] {
    const size = end - start + 1;
    const sieve = new Array(size).fill(true);
    
    if (start <= 1) sieve[0] = false;
    if (start <= 1 && end >= 1) sieve[1 - start] = false;
    
    // This would benefit from using the real cached small primes
    // but keeping simple for this example
    for (let i = 2; i * i <= end; i++) {
      const firstMultiple = Math.max(i * i, Math.ceil(start / i) * i);
      for (let j = firstMultiple; j <= end; j += i) {
        sieve[j - start] = false;
      }
    }
    
    return sieve;
  }
  
  /**
   * Trial division for large remaining factors (could be memoized)
   */
  private async trialDivisionLarge(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    const factors: Array<{prime: bigint, exponent: number}> = [];
    let remaining = n;
    
    const sqrt = this.integerSqrt(remaining);
    let candidate = 2n;
    
    while (candidate <= sqrt && remaining > 1n) {
      if (remaining % candidate === 0n) {
        let count = 0;
        while (remaining % candidate === 0n) {
          remaining /= candidate;
          count++;
        }
        factors.push({ prime: candidate, exponent: count });
      }
      candidate += candidate === 2n ? 1n : 2n; // Skip even numbers after 2
    }
    
    if (remaining > 1n) {
      factors.push({ prime: remaining, exponent: 1 });
    }
    
    return factors;
  }
  
  /**
   * Utility functions (unchanged)
   */
  private integerSqrt(n: bigint): bigint {
    if (n < 0n) throw new Error('Cannot compute square root of negative number');
    if (n < 2n) return n;
    
    let x = n;
    let y = (x + 1n) / 2n;
    
    while (y < x) {
      x = y;
      y = (x + n / x) / 2n;
    }
    
    return x;
  }
  
  private modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    let result = 1n;
    base = base % modulus;
    
    while (exponent > 0n) {
      if (exponent % 2n === 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent / 2n;
      base = (base * base) % modulus;
    }
    
    return result;
  }
  
  private randomBigInt(min: bigint, max: bigint): bigint {
    const range = max - min + 1n;
    const bits = range.toString(2).length;
    
    let result;
    do {
      result = 0n;
      for (let i = 0; i < bits; i++) {
        result = (result << 1n) + (Math.random() < 0.5 ? 0n : 1n);
      }
      result = result % range;
    } while (result + min > max);
    
    return result + min;
  }
  
  /**
   * Get base acceleration factor for enhanced cache-optimized processing
   */
  protected override getBaseAccelerationFactor(): number {
    return 8.0; // BASS band acceleration enhanced with REAL precision cache
  }
  
  /**
   * Estimate memory usage for enhanced cache-optimized processing
   */
  protected override estimateMemoryUsage(): number {
    // Calculate based on REAL cache usage
    const baseCacheMemory = this.cacheConfig.maxCacheSize * 5 * 1024; // ~5KB per cache entry estimate
    const precisionCacheOverhead = 2 * 1024 * 1024; // 2MB for precision cache infrastructure
    return baseCacheMemory + precisionCacheOverhead;
  }
  
  /**
   * Cleanup REAL precision caches on termination
   */
  async cleanup(): Promise<void> {
    await Promise.allSettled([
      this.primeCache.terminate(),
      this.factorCache.terminate(),
      this.lookupCache.terminate(),
      this.sieveCache.terminate(),
      this.segmentCache.terminate()
    ]);
  }
}
