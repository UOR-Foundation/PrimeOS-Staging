/**
 * Direct Computation Strategy
 * ==========================
 * 
 * ULTRABASS band processor (16-32 bits)
 * Optimized for small numbers using direct computation methods.
 * Uses trial division and wheel factorization for maximum efficiency.
 */

import { BaseStrategyProcessor, BaseStrategyConfig } from '../strategy-processor';
import { BandType, ProcessingContext } from '../../types';

/**
 * Direct computation strategy for ULTRABASS band
 * Handles numbers with 16-32 bits using simple, fast algorithms
 */
export class DirectComputationStrategy extends BaseStrategyProcessor {
  private wheelCache: Map<number, number[]> = new Map();
  private smallPrimesCache: number[] = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
  
  constructor(config: BaseStrategyConfig = {}) {
    super({
      enableCaching: true,
      cacheSize: 500,
      ...config
    });
    
    // Initialize wheel factorization cache
    this.initializeWheelCache();
  }
  
  /**
   * Check if this strategy supports the given band
   */
  supports(band: BandType): boolean {
    return band === BandType.ULTRABASS;
  }
  
  /**
   * Execute direct computation strategy
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
      throw new Error(`Unsupported input type for direct computation: ${typeof input}`);
    }
  }
  
  /**
   * Process a single number using direct computation
   */
  private async processNumber(n: bigint | number, context: ProcessingContext): Promise<any> {
    const num = typeof n === 'bigint' ? n : BigInt(n);
    
    // Validate number is in ULTRABASS range (16-32 bits)
    const bitSize = num.toString(2).length;
    if (bitSize > 32) {
      throw new Error(`Number too large for ULTRABASS band: ${bitSize} bits > 32 bits`);
    }
    
    // Use appropriate algorithm based on number size
    if (num <= 1000n) {
      return this.trialDivisionSmall(num);
    } else {
      return this.wheelFactorization(num);
    }
  }
  
  /**
   * Process a batch of numbers
   */
  private async processBatch(numbers: (bigint | number)[], context: ProcessingContext): Promise<any[]> {
    const results: any[] = [];
    
    for (const num of numbers) {
      try {
        const result = await this.processNumber(num, context);
        results.push(result);
      } catch (error) {
        results.push({
          error: error instanceof Error ? error.message : 'Processing failed',
          input: num
        });
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
        return this.isPrime(BigInt(operation.value));
      case 'nextPrime':
        return this.nextPrime(BigInt(operation.value));
      case 'primeFactors':
        return this.getPrimeFactors(BigInt(operation.value));
      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }
  }
  
  /**
   * Trial division for small numbers (< 1000)
   */
  private trialDivisionSmall(n: bigint): { factors: Array<{prime: bigint, exponent: number}>, method: string } {
    if (n <= 1n) {
      return { factors: [], method: 'trial-division-small' };
    }
    
    const factors: Array<{prime: bigint, exponent: number}> = [];
    let remaining = n;
    
    // Check small primes
    for (const p of this.smallPrimesCache) {
      const prime = BigInt(p);
      if (prime * prime > remaining) break;
      
      if (remaining % prime === 0n) {
        let count = 0;
        while (remaining % prime === 0n) {
          remaining /= prime;
          count++;
        }
        factors.push({ prime, exponent: count });
      }
    }
    
    // Handle remaining prime factor
    if (remaining > 1n) {
      factors.push({ prime: remaining, exponent: 1 });
    }
    
    return { factors, method: 'trial-division-small' };
  }
  
  /**
   * Wheel factorization for medium numbers (1000-2^32)
   */
  private wheelFactorization(n: bigint): { factors: Array<{prime: bigint, exponent: number}>, method: string } {
    if (n <= 1n) {
      return { factors: [], method: 'wheel-factorization' };
    }
    
    const factors: Array<{prime: bigint, exponent: number}> = [];
    let remaining = n;
    
    // Handle wheel base primes (2, 3, 5)
    const wheelBase = [2n, 3n, 5n];
    for (const prime of wheelBase) {
      if (remaining % prime === 0n) {
        let count = 0;
        while (remaining % prime === 0n) {
          remaining /= prime;
          count++;
        }
        factors.push({ prime, exponent: count });
      }
    }
    
    // Use wheel to skip multiples of 2, 3, 5
    const wheel = this.getWheel30();
    let candidate = 7n;
    let wheelIndex = 0;
    
    while (candidate * candidate <= remaining) {
      if (remaining % candidate === 0n) {
        let count = 0;
        while (remaining % candidate === 0n) {
          remaining /= candidate;
          count++;
        }
        factors.push({ prime: candidate, exponent: count });
      }
      
      // Move to next candidate using wheel
      candidate += BigInt(wheel[wheelIndex]);
      wheelIndex = (wheelIndex + 1) % wheel.length;
    }
    
    // Handle remaining prime factor
    if (remaining > 1n) {
      factors.push({ prime: remaining, exponent: 1 });
    }
    
    return { factors, method: 'wheel-factorization' };
  }
  
  /**
   * Check if a number is prime using trial division
   */
  private isPrime(n: bigint): boolean {
    if (n < 2n) return false;
    if (n === 2n) return true;
    if (n % 2n === 0n) return false;
    
    // Check odd divisors up to sqrt(n)
    const sqrt = this.integerSqrt(n);
    for (let i = 3n; i <= sqrt; i += 2n) {
      if (n % i === 0n) return false;
    }
    
    return true;
  }
  
  /**
   * Find next prime after n
   */
  private nextPrime(n: bigint): bigint {
    let candidate = n + 1n;
    while (!this.isPrime(candidate)) {
      candidate++;
    }
    return candidate;
  }
  
  /**
   * Get prime factors as an array of primes
   */
  private getPrimeFactors(n: bigint): bigint[] {
    const factorization = this.wheelFactorization(n);
    const primes: bigint[] = [];
    
    for (const factor of factorization.factors) {
      for (let i = 0; i < factor.exponent; i++) {
        primes.push(factor.prime);
      }
    }
    
    return primes;
  }
  
  /**
   * Integer square root for BigInt
   */
  private integerSqrt(n: bigint): bigint {
    if (n < 0n) throw new Error('Cannot compute square root of negative number');
    if (n < 2n) return n;
    
    // Newton's method for integer square root
    let x = n;
    let y = (x + 1n) / 2n;
    
    while (y < x) {
      x = y;
      y = (x + n / x) / 2n;
    }
    
    return x;
  }
  
  /**
   * Get wheel of size 30 (skips multiples of 2, 3, 5)
   */
  private getWheel30(): number[] {
    const cached = this.wheelCache.get(30);
    if (cached) return cached;
    
    // Wheel increments for modulo 30
    const wheel = [4, 6, 10, 12, 16, 18, 22, 24];
    this.wheelCache.set(30, wheel);
    return wheel;
  }
  
  /**
   * Initialize wheel cache for different sizes
   */
  private initializeWheelCache(): void {
    // Pre-compute common wheels
    this.wheelCache.set(6, [4, 2]);    // Skip multiples of 2, 3
    this.wheelCache.set(30, [4, 6, 10, 12, 16, 18, 22, 24]); // Skip multiples of 2, 3, 5
  }
  
  /**
   * Get base acceleration factor for direct computation
   */
  protected getBaseAccelerationFactor(): number {
    return 2.5; // ULTRABASS band acceleration
  }
  
  /**
   * Estimate memory usage for direct computation
   */
  protected estimateMemoryUsage(): number {
    // Very low memory usage for direct computation
    return 64 * 1024; // 64KB
  }
}
