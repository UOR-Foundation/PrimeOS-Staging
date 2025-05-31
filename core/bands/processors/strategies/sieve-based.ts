/**
 * Sieve-Based Strategy
 * ===================
 * 
 * MIDRANGE band processor (65-128 bits)
 * Optimized for moderate numbers using segmented sieve algorithms.
 * Uses advanced sieving techniques with memory-efficient segmentation.
 */

import { BaseStrategyProcessor, BaseStrategyConfig } from '../strategy-processor';
import { BandType, ProcessingContext } from '../../types';

/**
 * Sieve configuration for MIDRANGE band
 */
interface SieveConfig {
  segmentSize: number;
  wheelSize: number;
  cacheSegments: number;
  maxSieveLimit: number;
  useAtkinSieve: boolean;
}

/**
 * Sieve-based strategy for MIDRANGE band
 * Handles numbers with 65-128 bits using sophisticated sieving
 */
export class SieveBasedStrategy extends BaseStrategyProcessor {
  private segmentCache: Map<string, boolean[]> = new Map();
  private primeCache: Set<bigint> = new Set();
  private wheelCache: Map<number, number[]> = new Map();
  private sieveConfig: SieveConfig;
  
  constructor(config: BaseStrategyConfig = {}) {
    super({
      enableCaching: true,
      cacheSize: 5000,
      ...config
    });
    
    this.sieveConfig = {
      segmentSize: 32768, // 32KB segments
      wheelSize: 210, // Wheel of 2,3,5,7
      cacheSegments: 16,
      maxSieveLimit: 10000000, // 10M
      useAtkinSieve: true
    };
    
    // Initialize sieve infrastructure
    this.initializeSieve();
  }
  
  /**
   * Check if this strategy supports the given band
   */
  supports(band: BandType): boolean {
    return band === BandType.MIDRANGE;
  }
  
  /**
   * Execute sieve-based strategy
   */
  protected async executeStrategy(input: any, context: ProcessingContext): Promise<any> {
    if (typeof input === 'bigint' || typeof input === 'number') {
      return this.processNumber(input, context);
    } else if (Array.isArray(input)) {
      return this.processBatch(input, context);
    } else if (input && typeof input === 'object' && 'operation' in input) {
      return this.processOperation(input, context);
    } else {
      throw new Error(`Unsupported input type for sieve-based processing: ${typeof input}`);
    }
  }
  
  /**
   * Process a single number using sieve-based algorithms
   */
  private async processNumber(n: bigint | number, context: ProcessingContext): Promise<any> {
    const num = typeof n === 'bigint' ? n : BigInt(n);
    
    // Validate number is in MIDRANGE range (65-128 bits)
    const bitSize = num.toString(2).length;
    if (bitSize < 65 || bitSize > 128) {
      throw new Error(`Number out of MIDRANGE band range: ${bitSize} bits (expected 65-128)`);
    }
    
    // Use advanced sieving for factorization
    const result = await this.advancedSieveFactorization(num);
    
    return result;
  }
  
  /**
   * Process a batch of numbers with optimized sieving
   */
  private async processBatch(numbers: (bigint | number)[], context: ProcessingContext): Promise<any[]> {
    const results: any[] = [];
    
    // Group numbers by range for efficient batch sieving
    const numberGroups = this.groupNumbersByRange(numbers);
    
    for (const [range, nums] of numberGroups) {
      // Pre-sieve the range
      await this.preSieveRange(range.start, range.end);
      
      // Process numbers in this range
      for (const num of nums) {
        try {
          const result = await this.processNumber(num.value, context);
          results[num.index] = result;
        } catch (error) {
          results[num.index] = {
            error: error instanceof Error ? error.message : 'Processing failed',
            input: num.value
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
        return this.sievePrimalityTest(BigInt(operation.value));
      case 'sieveRange':
        return this.sieveRange(operation.start, operation.end);
      case 'primeCount':
        return this.countPrimesInRange(operation.start, operation.end);
      case 'nextPrime':
        return this.nextPrimeUsingSieve(BigInt(operation.value));
      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }
  }
  
  /**
   * Advanced sieve factorization for large numbers
   */
  private async advancedSieveFactorization(n: bigint): Promise<{ factors: Array<{prime: bigint, exponent: number}>, method: string }> {
    if (n <= 1n) {
      return { factors: [], method: 'advanced-sieve' };
    }
    
    const factors: Array<{prime: bigint, exponent: number}> = [];
    let remaining = n;
    
    // Use wheel-based trial division for small factors
    const wheelPrimes = this.getWheelPrimes();
    for (const prime of wheelPrimes) {
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
    
    // Use segmented sieve for medium factors
    if (remaining > 1n && remaining <= BigInt(this.sieveConfig.maxSieveLimit)) {
      const mediumFactors = await this.segmentedSieveFactorization(remaining);
      factors.push(...mediumFactors);
    } else if (remaining > 1n) {
      // Use Pollard's rho for very large factors
      const largeFactors = await this.pollardRhoFactorization(remaining);
      factors.push(...largeFactors);
    }
    
    return { factors, method: 'advanced-sieve' };
  }
  
  /**
   * Segmented sieve factorization
   */
  private async segmentedSieveFactorization(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    const factors: Array<{prime: bigint, exponent: number}> = [];
    let remaining = n;
    
    const sqrt = this.integerSqrt(remaining);
    const limit = Number(sqrt) + 1;
    
    // Generate primes up to sqrt(n) using segmented sieve
    const primes = await this.generatePrimesUpTo(limit);
    
    for (const prime of primes) {
      if (remaining % prime === 0n) {
        let count = 0;
        while (remaining % prime === 0n) {
          remaining /= prime;
          count++;
        }
        factors.push({ prime, exponent: count });
      }
      
      if (remaining === 1n) break;
    }
    
    // Handle remaining prime factor
    if (remaining > 1n) {
      factors.push({ prime: remaining, exponent: 1 });
    }
    
    return factors;
  }
  
  /**
   * Pollard's rho factorization for very large numbers
   */
  private async pollardRhoFactorization(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    const factors: Array<{prime: bigint, exponent: number}> = [];
    const toFactor = [n];
    
    while (toFactor.length > 0) {
      const current = toFactor.pop()!;
      
      if (current === 1n) continue;
      
      if (await this.isProbablePrime(current)) {
        factors.push({ prime: current, exponent: 1 });
        continue;
      }
      
      const factor = await this.pollardRho(current);
      if (factor && factor !== current && factor !== 1n) {
        toFactor.push(factor);
        toFactor.push(current / factor);
      } else {
        // Fallback to trial division
        const trialFactors = await this.trialDivisionLarge(current);
        factors.push(...trialFactors);
      }
    }
    
    return factors;
  }
  
  /**
   * Pollard's rho algorithm implementation
   */
  private async pollardRho(n: bigint): Promise<bigint | null> {
    if (n % 2n === 0n) return 2n;
    
    let x = 2n;
    let y = 2n;
    let d = 1n;
    
    const f = (x: bigint) => (x * x + 1n) % n;
    
    for (let i = 0; i < 1000000 && d === 1n; i++) {
      x = f(x);
      y = f(f(y));
      d = this.gcd(this.abs(x - y), n);
    }
    
    return d === n ? null : d;
  }
  
  /**
   * Sieve-based primality test
   */
  private async sievePrimalityTest(n: bigint): Promise<boolean> {
    if (n < 2n) return false;
    if (n === 2n) return true;
    if (n % 2n === 0n) return false;
    
    // Check cached primes first
    if (this.primeCache.has(n)) return true;
    
    // Use sieve for small numbers
    if (n <= BigInt(this.sieveConfig.maxSieveLimit)) {
      const primes = await this.generatePrimesUpTo(Number(n));
      return primes.includes(n);
    }
    
    // Use Miller-Rabin for very large numbers
    return this.millerRabinTest(n);
  }
  
  /**
   * Generate primes up to limit using optimized sieve
   */
  private async generatePrimesUpTo(limit: number): Promise<bigint[]> {
    const cacheKey = `primes_${limit}`;
    
    if (this.segmentCache.has(cacheKey)) {
      const sieve = this.segmentCache.get(cacheKey)!;
      return this.extractPrimesFromSieve(sieve, limit);
    }
    
    let sieve: boolean[];
    
    if (this.sieveConfig.useAtkinSieve && limit > 1000000) {
      sieve = this.sieveOfAtkin(limit);
    } else {
      sieve = this.segmentedSieveOfEratosthenes(limit);
    }
    
    this.segmentCache.set(cacheKey, sieve);
    
    const primes = this.extractPrimesFromSieve(sieve, limit);
    
    // Cache individual primes
    for (const prime of primes) {
      this.primeCache.add(prime);
    }
    
    return primes;
  }
  
  /**
   * Sieve of Atkin implementation for large ranges
   */
  private sieveOfAtkin(limit: number): boolean[] {
    const sieve = new Array(limit + 1).fill(false);
    const sqrtLimit = Math.sqrt(limit);
    
    // Mark 2, 3, 5 as prime
    if (limit >= 2) sieve[2] = true;
    if (limit >= 3) sieve[3] = true;
    if (limit >= 5) sieve[5] = true;
    
    for (let x = 1; x <= sqrtLimit; x++) {
      for (let y = 1; y <= sqrtLimit; y++) {
        let n = 4 * x * x + y * y;
        if (n <= limit && (n % 12 === 1 || n % 12 === 5)) {
          sieve[n] = !sieve[n];
        }
        
        n = 3 * x * x + y * y;
        if (n <= limit && n % 12 === 7) {
          sieve[n] = !sieve[n];
        }
        
        n = 3 * x * x - y * y;
        if (x > y && n <= limit && n % 12 === 11) {
          sieve[n] = !sieve[n];
        }
      }
    }
    
    // Mark squares of primes as composite
    for (let r = 5; r * r <= limit; r++) {
      if (sieve[r]) {
        for (let i = r * r; i <= limit; i += r * r) {
          sieve[i] = false;
        }
      }
    }
    
    return sieve;
  }
  
  /**
   * Segmented Sieve of Eratosthenes
   */
  private segmentedSieveOfEratosthenes(limit: number): boolean[] {
    const segmentSize = this.sieveConfig.segmentSize;
    const sqrt = Math.sqrt(limit);
    
    // First, sieve primes up to sqrt
    const basePrimes = this.simpleSieve(Math.floor(sqrt));
    
    const sieve = new Array(limit + 1).fill(true);
    sieve[0] = sieve[1] = false;
    
    // Process each segment
    for (let low = 0; low <= limit; low += segmentSize) {
      const high = Math.min(low + segmentSize - 1, limit);
      
      // Mark multiples of base primes in this segment
      for (const prime of basePrimes) {
        const start = Math.max(prime * prime, Math.ceil(low / prime) * prime);
        
        for (let j = start; j <= high; j += prime) {
          sieve[j] = false;
        }
      }
    }
    
    return sieve;
  }
  
  /**
   * Simple sieve for small ranges
   */
  private simpleSieve(limit: number): number[] {
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
    
    return primes;
  }
  
  /**
   * Extract primes from sieve array
   */
  private extractPrimesFromSieve(sieve: boolean[], limit: number): bigint[] {
    const primes: bigint[] = [];
    for (let i = 2; i <= limit; i++) {
      if (sieve[i]) {
        primes.push(BigInt(i));
      }
    }
    return primes;
  }
  
  /**
   * Group numbers by range for efficient batch processing
   */
  private groupNumbersByRange(numbers: (bigint | number)[]): Map<{start: number, end: number}, Array<{value: bigint | number, index: number}>> {
    const groups = new Map();
    
    for (let i = 0; i < numbers.length; i++) {
      const num = numbers[i];
      const value = typeof num === 'bigint' ? Number(num) : num;
      
      // Find appropriate range
      const rangeStart = Math.floor(value / this.sieveConfig.segmentSize) * this.sieveConfig.segmentSize;
      const rangeEnd = rangeStart + this.sieveConfig.segmentSize;
      
      const range = { start: rangeStart, end: rangeEnd };
      const key = `${range.start}-${range.end}`;
      
      if (!groups.has(key)) {
        groups.set(key, { range, numbers: [] });
      }
      
      groups.get(key).numbers.push({ value: num, index: i });
    }
    
    return new Map(Array.from(groups.values()).map(g => [g.range, g.numbers]));
  }
  
  /**
   * Pre-sieve a range for batch processing
   */
  private async preSieveRange(start: number, end: number): Promise<void> {
    const cacheKey = `range_${start}_${end}`;
    
    if (!this.segmentCache.has(cacheKey)) {
      const sieve = this.segmentedSieveOfEratosthenes(end);
      this.segmentCache.set(cacheKey, sieve);
    }
  }
  
  /**
   * Sieve a specific range
   */
  private async sieveRange(start: number, end: number): Promise<bigint[]> {
    await this.preSieveRange(start, end);
    const sieve = this.segmentCache.get(`range_${start}_${end}`)!;
    
    const primes: bigint[] = [];
    for (let i = Math.max(start, 2); i <= end; i++) {
      if (sieve[i]) {
        primes.push(BigInt(i));
      }
    }
    
    return primes;
  }
  
  /**
   * Count primes in range using sieve
   */
  private async countPrimesInRange(start: number, end: number): Promise<number> {
    const primes = await this.sieveRange(start, end);
    return primes.length;
  }
  
  /**
   * Find next prime using sieve
   */
  private async nextPrimeUsingSieve(n: bigint): Promise<bigint> {
    const start = Number(n) + 1;
    const chunkSize = 10000;
    
    for (let i = 0; i < 100; i++) { // Limit search
      const end = start + i * chunkSize + chunkSize;
      const primes = await this.sieveRange(start + i * chunkSize, end);
      
      if (primes.length > 0) {
        return primes[0];
      }
    }
    
    throw new Error(`Could not find next prime after ${n}`);
  }
  
  /**
   * Get wheel primes for efficient trial division
   */
  private getWheelPrimes(): bigint[] {
    const cached = this.wheelCache.get(this.sieveConfig.wheelSize);
    if (cached) {
      return cached.map(p => BigInt(p));
    }
    
    const primes = this.simpleSieve(this.sieveConfig.wheelSize);
    this.wheelCache.set(this.sieveConfig.wheelSize, primes);
    
    return primes.map(p => BigInt(p));
  }
  
  /**
   * Initialize sieve infrastructure
   */
  private async initializeSieve(): Promise<void> {
    // Pre-generate small wheel primes
    this.getWheelPrimes();
    
    // Pre-cache first few segments
    for (let i = 0; i < this.sieveConfig.cacheSegments; i++) {
      const start = i * this.sieveConfig.segmentSize;
      const end = start + this.sieveConfig.segmentSize;
      await this.preSieveRange(start, end);
    }
  }
  
  // Utility methods
  private async isProbablePrime(n: bigint): Promise<boolean> {
    return this.millerRabinTest(n, 10);
  }
  
  private millerRabinTest(n: bigint, k: number = 10): boolean {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n) return false;
    
    let d = n - 1n;
    let r = 0;
    while (d % 2n === 0n) {
      d /= 2n;
      r++;
    }
    
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
      candidate += candidate === 2n ? 1n : 2n;
    }
    
    if (remaining > 1n) {
      factors.push({ prime: remaining, exponent: 1 });
    }
    
    return factors;
  }
  
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
  
  private gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
      [a, b] = [b, a % b];
    }
    return a;
  }
  
  private abs(n: bigint): bigint {
    return n < 0n ? -n : n;
  }
  
  /**
   * Get base acceleration factor for sieve-based processing
   */
  protected getBaseAccelerationFactor(): number {
    return 8.0; // MIDRANGE band acceleration
  }
  
  /**
   * Estimate memory usage for sieve-based processing
   */
  protected estimateMemoryUsage(): number {
    // Moderate memory usage for segmented sieves
    return 16 * 1024 * 1024; // 16MB
  }
}
