/**
 * Cache-Optimized Strategy
 * =======================
 * 
 * BASS band processor (33-64 bits)
 * Optimized for medium numbers using aggressive caching and lookup tables.
 * Uses cached sieve and precomputation for enhanced performance.
 */

import { BaseStrategyProcessor, BaseStrategyConfig } from '../strategy-processor';
import { BandType, ProcessingContext } from '../../types';

/**
 * Cache configuration for BASS band
 */
interface CacheConfig {
  maxPrimes: number;
  segmentSize: number;
  precomputeLimit: number;
  lookupTableSize: number;
}

/**
 * Cache-optimized strategy for BASS band
 * Handles numbers with 33-64 bits using cached algorithms
 */
export class CacheOptimizedStrategy extends BaseStrategyProcessor {
  private primeCache: Map<bigint, boolean> = new Map();
  private factorCache: Map<string, Array<{prime: bigint, exponent: number}>> = new Map();
  private lookupTable: Map<number, number[]> = new Map();
  private sieveCache: Map<number, boolean[]> = new Map();
  private cacheConfig: CacheConfig;
  
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
      lookupTableSize: 8192
    };
    
    // Initialize caches
    this.initializeCaches();
  }
  
  /**
   * Check if this strategy supports the given band
   */
  supports(band: BandType): boolean {
    return band === BandType.BASS;
  }
  
  /**
   * Execute cache-optimized strategy
   */
  protected async executeStrategy(input: any, context: ProcessingContext): Promise<any> {
    // Handle different input types
    if (typeof input === 'bigint' || typeof input === 'number') {
      return this.processNumber(input, context);
    } else if (Array.isArray(input)) {
      return this.processBatch(input, context);
    } else if (input && typeof input === 'object' && 'operation' in input) {
      return this.processOperation(input, context);
    } else {
      throw new Error(`Unsupported input type for cache-optimized processing: ${typeof input}`);
    }
  }
  
  /**
   * Process a single number using cache-optimized algorithms
   */
  private async processNumber(n: bigint | number, context: ProcessingContext): Promise<any> {
    const num = typeof n === 'bigint' ? n : BigInt(n);
    
    // Validate number is in BASS range (33-64 bits)
    const bitSize = num.toString(2).length;
    if (bitSize < 33 || bitSize > 64) {
      throw new Error(`Number out of BASS band range: ${bitSize} bits (expected 33-64)`);
    }
    
    // Check cache first
    const cacheKey = num.toString();
    if (this.factorCache.has(cacheKey)) {
      return {
        factors: this.factorCache.get(cacheKey)!,
        method: 'cache-hit',
        cached: true
      };
    }
    
    // Use cached sieve for factorization
    const result = await this.cachedSieveFactorization(num);
    
    // Cache the result
    this.factorCache.set(cacheKey, result.factors);
    
    return result;
  }
  
  /**
   * Process a batch of numbers with optimized caching
   */
  private async processBatch(numbers: (bigint | number)[], context: ProcessingContext): Promise<any[]> {
    const results: any[] = [];
    const uncachedNumbers: bigint[] = [];
    const numberToIndex: Map<string, number[]> = new Map();
    
    // Separate cached and uncached numbers
    for (let i = 0; i < numbers.length; i++) {
      const num = typeof numbers[i] === 'bigint' ? numbers[i] : BigInt(numbers[i]);
      const cacheKey = num.toString();
      
      if (this.factorCache.has(cacheKey)) {
        results[i] = {
          factors: this.factorCache.get(cacheKey)!,
          method: 'cache-hit',
          cached: true
        };
      } else {
        uncachedNumbers.push(num);
        const indices = numberToIndex.get(cacheKey) || [];
        indices.push(i);
        numberToIndex.set(cacheKey, indices);
      }
    }
    
    // Process uncached numbers
    for (const num of uncachedNumbers) {
      try {
        const result = await this.cachedSieveFactorization(num);
        const cacheKey = num.toString();
        
        // Cache result
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
   * Process operation-based input
   */
  private async processOperation(operation: any, context: ProcessingContext): Promise<any> {
    switch (operation.type) {
      case 'factor':
        return this.processNumber(operation.value, context);
      case 'isPrime':
        return this.cachedIsPrime(BigInt(operation.value));
      case 'generatePrimes':
        return this.generatePrimesInRange(operation.start, operation.end);
      case 'primeCount':
        return this.countPrimesInRange(operation.start, operation.end);
      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }
  }
  
  /**
   * Cached sieve factorization algorithm
   */
  private async cachedSieveFactorization(n: bigint): Promise<{ factors: Array<{prime: bigint, exponent: number}>, method: string }> {
    if (n <= 1n) {
      return { factors: [], method: 'cached-sieve' };
    }
    
    const factors: Array<{prime: bigint, exponent: number}> = [];
    let remaining = n;
    
    // Use precomputed small primes
    const smallPrimes = this.getSmallPrimes();
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
    
    // Use segmented sieve for larger factors
    if (remaining > 1n && remaining <= BigInt(this.cacheConfig.precomputeLimit)) {
      const segment = await this.getSegmentedSieve(Number(remaining));
      if (segment.isPrime) {
        factors.push({ prime: remaining, exponent: 1 });
      }
    } else if (remaining > 1n) {
      // Use trial division for very large remaining factors
      const largeFactors = await this.trialDivisionLarge(remaining);
      factors.push(...largeFactors);
    }
    
    return { factors, method: 'cached-sieve' };
  }
  
  /**
   * Cached primality test
   */
  private cachedIsPrime(n: bigint): boolean {
    // Check cache first
    if (this.primeCache.has(n)) {
      return this.primeCache.get(n)!;
    }
    
    // Compute and cache result
    const isPrime = this.computeIsPrime(n);
    this.primeCache.set(n, isPrime);
    
    return isPrime;
  }
  
  /**
   * Compute primality using cached algorithms
   */
  private computeIsPrime(n: bigint): boolean {
    if (n < 2n) return false;
    if (n === 2n) return true;
    if (n % 2n === 0n) return false;
    
    // Check against cached small primes
    const smallPrimes = this.getSmallPrimes();
    for (const prime of smallPrimes) {
      if (n === prime) return true;
      if (n % prime === 0n) return false;
      if (prime * prime > n) break;
    }
    
    // Use Miller-Rabin for larger numbers
    if (n > BigInt(this.cacheConfig.precomputeLimit)) {
      return this.millerRabinTest(n);
    }
    
    return true;
  }
  
  /**
   * Miller-Rabin primality test
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
   * Generate primes in a range using cached sieve
   */
  private generatePrimesInRange(start: number, end: number): number[] {
    const primes: number[] = [];
    const sieve = this.getSieveForRange(start, end);
    
    for (let i = Math.max(start, 2); i <= end; i++) {
      if (sieve[i - start]) {
        primes.push(i);
      }
    }
    
    return primes;
  }
  
  /**
   * Count primes in a range
   */
  private countPrimesInRange(start: number, end: number): number {
    return this.generatePrimesInRange(start, end).length;
  }
  
  /**
   * Get or compute segmented sieve
   */
  private async getSegmentedSieve(n: number): Promise<{ isPrime: boolean, segment: boolean[] }> {
    const segmentStart = Math.floor(n / this.cacheConfig.segmentSize) * this.cacheConfig.segmentSize;
    const segmentKey = segmentStart;
    
    if (!this.sieveCache.has(segmentKey)) {
      const segment = this.computeSegmentedSieve(segmentStart, segmentStart + this.cacheConfig.segmentSize);
      this.sieveCache.set(segmentKey, segment);
    }
    
    const segment = this.sieveCache.get(segmentKey)!;
    const index = n - segmentStart;
    
    return {
      isPrime: segment[index] || false,
      segment
    };
  }
  
  /**
   * Compute segmented sieve for a range
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
    
    // Sieve with odd primes
    const smallPrimes = this.getSmallPrimes();
    for (const prime of smallPrimes) {
      if (Number(prime) * Number(prime) > end) break;
      
      const firstMultiple = Math.max(Number(prime) * Number(prime), Math.ceil(start / Number(prime)) * Number(prime));
      for (let j = firstMultiple; j < end; j += Number(prime)) {
        sieve[j - start] = false;
      }
    }
    
    return sieve;
  }
  
  /**
   * Get sieve for a specific range
   */
  private getSieveForRange(start: number, end: number): boolean[] {
    const size = end - start + 1;
    const sieve = new Array(size).fill(true);
    
    if (start <= 1) sieve[0] = false;
    if (start <= 1 && end >= 1) sieve[1 - start] = false;
    
    const smallPrimes = this.getSmallPrimes();
    for (const prime of smallPrimes) {
      if (Number(prime) * Number(prime) > end) break;
      
      const firstMultiple = Math.max(Number(prime) * Number(prime), Math.ceil(start / Number(prime)) * Number(prime));
      for (let j = firstMultiple; j <= end; j += Number(prime)) {
        sieve[j - start] = false;
      }
    }
    
    return sieve;
  }
  
  /**
   * Trial division for large remaining factors
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
   * Get cached small primes
   */
  private getSmallPrimes(): bigint[] {
    const cached = this.lookupTable.get(0);
    if (cached) {
      return cached.map(p => BigInt(p));
    }
    
    // Generate small primes up to sqrt of 64-bit max
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
    
    this.lookupTable.set(0, primes);
    return primes.map(p => BigInt(p));
  }
  
  /**
   * Initialize all caches
   */
  private async initializeCaches(): Promise<void> {
    // Precompute small primes
    this.getSmallPrimes();
    
    // Precompute first few segments
    for (let i = 0; i < 4; i++) {
      const start = i * this.cacheConfig.segmentSize;
      const segment = this.computeSegmentedSieve(start, start + this.cacheConfig.segmentSize);
      this.sieveCache.set(start, segment);
    }
  }
  
  /**
   * Utility functions
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
   * Get base acceleration factor for cache-optimized processing
   */
  protected getBaseAccelerationFactor(): number {
    return 5.0; // BASS band acceleration
  }
  
  /**
   * Estimate memory usage for cache-optimized processing
   */
  protected estimateMemoryUsage(): number {
    // Higher memory usage due to caching
    return 4 * 1024 * 1024; // 4MB
  }
}
