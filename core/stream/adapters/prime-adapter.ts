/**
 * Prime Stream Adapter
 * ===================
 * 
 * Adapter for integrating stream processing with prime number operations
 * from the core/prime module.
 */

import { PrimeRegistryInterface, Factor } from '../../prime/types';
import { LoggingInterface } from '../../../os/logging/types';
import { performance } from 'perf_hooks';
import { MathUtilities } from '../../precision';

/**
 * Statistics tracking for prime operations
 */
interface PrimeStats {
  primesGenerated: number;
  numbersFactorized: number;
  primalityTests: number;
  primalityTestsPassed: number;
  numbersReconstructed: number;
  primesFiltered: number;
  totalProcessingTime: number;
  errors: number;
  largestPrimeGenerated: bigint;
  largestNumberFactorized: bigint;
  cacheHits?: number;
  cacheMisses?: number;
}

/**
 * Cache entry for prime operations
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

/**
 * Prime operations adapter for stream processing
 */
export class PrimeStreamAdapter {
  private primeRegistry: PrimeRegistryInterface;
  private logger?: LoggingInterface;
  private stats: PrimeStats = {
    primesGenerated: 0,
    numbersFactorized: 0,
    primalityTests: 0,
    primalityTestsPassed: 0,
    numbersReconstructed: 0,
    primesFiltered: 0,
    totalProcessingTime: 0,
    errors: 0,
    largestPrimeGenerated: 0n,
    largestNumberFactorized: 0n
  };
  
  // Optional caching
  private cacheEnabled: boolean;
  private factorCache?: Map<string, CacheEntry<Factor[]>>;
  private primalityCache?: Map<string, CacheEntry<boolean>>;
  private cacheMaxSize: number;
  private cacheTTL: number;
  
  constructor(dependencies: {
    primeRegistry: PrimeRegistryInterface;
    logger?: LoggingInterface;
    enableCaching?: boolean;
    cacheMaxSize?: number;
    cacheTTL?: number;
  }) {
    this.primeRegistry = dependencies.primeRegistry;
    this.logger = dependencies.logger;
    this.cacheEnabled = dependencies.enableCaching ?? false;
    this.cacheMaxSize = dependencies.cacheMaxSize ?? 1000;
    this.cacheTTL = dependencies.cacheTTL ?? 60000; // 1 minute default
    
    if (this.cacheEnabled) {
      this.factorCache = new Map();
      this.primalityCache = new Map();
      this.stats.cacheHits = 0;
      this.stats.cacheMisses = 0;
    }
  }
  
  /**
   * Stream prime generation - generates consecutive primes
   */
  async *generatePrimeStream(startIndex: number = 0, count?: number): AsyncIterable<bigint> {
    // Validate inputs
    if (startIndex < 0 || !Number.isInteger(startIndex)) {
      throw new Error('startIndex must be a non-negative integer');
    }
    if (count !== undefined && (count < 0 || !Number.isInteger(count))) {
      throw new Error('count must be a non-negative integer');
    }
    
    const startTime = performance.now();
    let currentIndex = startIndex;
    let generated = 0;
    
    try {
      while (count === undefined || generated < count) {
        const chunkStartTime = performance.now();
        
        try {
          const prime = this.primeRegistry.getPrime(currentIndex);
          if (prime !== undefined && prime !== null) {
            yield prime;
            
            currentIndex++;
            generated++;
            this.stats.primesGenerated++;
            this.stats.totalProcessingTime += performance.now() - chunkStartTime;
            
            // Track largest prime
            if (prime > this.stats.largestPrimeGenerated) {
              this.stats.largestPrimeGenerated = prime;
            }
            
            if (this.logger && generated % 1000 === 0) {
              await this.logger.debug('Generated prime batch', {
                generated,
                currentIndex,
                latestPrime: prime.toString()
              });
            }
          } else {
            // If getPrime returns undefined/null, stop generation
            break;
          }
        } catch (error) {
          this.stats.errors++;
          if (this.logger) {
            await this.logger.warn('Failed to generate prime at index', {
              index: currentIndex,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          break;
        }
      }
      
      const totalTime = performance.now() - startTime;
      
      if (this.logger) {
        await this.logger.info('Prime generation stream completed', {
          totalGenerated: generated,
          finalIndex: currentIndex - 1,
          totalTime,
          averageGenerationTime: generated > 0 ? totalTime / generated : 0
        });
      }
    } catch (error) {
      this.stats.errors++;
      if (this.logger) {
        await this.logger.error('Prime generation stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Stream factorization - factors numbers as they come through
   */
  async *factorizeStream(numbers: AsyncIterable<bigint>): AsyncIterable<Factor[]> {
    const startTime = performance.now();
    let processed = 0;
    
    try {
      for await (const number of numbers) {
        const chunkStartTime = performance.now();
        
        try {
          let factors: Factor[];
          
          // Check cache first if enabled
          if (this.cacheEnabled && this.factorCache) {
            const cacheKey = number.toString();
            const cached = this.getCachedValue(this.factorCache, cacheKey);
            
            if (cached) {
              factors = cached;
              this.stats.cacheHits!++;
            } else {
              factors = this.primeRegistry.factor(number);
              this.setCachedValue(this.factorCache, cacheKey, factors);
              this.stats.cacheMisses!++;
            }
          } else {
            factors = this.primeRegistry.factor(number);
          }
          
          yield factors;
          
          processed++;
          this.stats.numbersFactorized++;
          this.stats.totalProcessingTime += performance.now() - chunkStartTime;
          
          // Track largest number factorized
          if (number > this.stats.largestNumberFactorized) {
            this.stats.largestNumberFactorized = number;
          }
          
          if (this.logger && processed % 100 === 0) {
            await this.logger.debug('Factorized number batch', {
              processed,
              latestNumber: number.toString(),
              factorCount: factors.length
            });
          }
        } catch (error) {
          this.stats.errors++;
          if (this.logger) {
            await this.logger.warn('Failed to factorize number', {
              number: number.toString(),
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          // Yield empty factorization on error
          yield [];
        }
      }
      
      const totalTime = performance.now() - startTime;
      
      if (this.logger) {
        await this.logger.info('Factorization stream completed', {
          totalProcessed: processed,
          totalTime,
          averageFactorizationTime: processed > 0 ? totalTime / processed : 0,
          cacheStats: this.cacheEnabled ? {
            hits: this.stats.cacheHits,
            misses: this.stats.cacheMisses,
            hitRate: this.stats.cacheHits! / (this.stats.cacheHits! + this.stats.cacheMisses!)
          } : undefined
        });
      }
    } catch (error) {
      this.stats.errors++;
      if (this.logger) {
        await this.logger.error('Factorization stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Stream primality testing - tests if numbers are prime
   */
  async *primalityTestStream(numbers: AsyncIterable<bigint>): AsyncIterable<{
    number: bigint;
    isPrime: boolean;
    testTime: number;
  }> {
    const startTime = performance.now();
    let tested = 0;
    let primeCount = 0;
    
    try {
      for await (const number of numbers) {
        const chunkStartTime = performance.now();
        
        try {
          let isPrime: boolean;
          
          // Check cache first if enabled
          if (this.cacheEnabled && this.primalityCache) {
            const cacheKey = number.toString();
            const cached = this.getCachedValue(this.primalityCache, cacheKey);
            
            if (cached !== undefined) {
              isPrime = cached;
              this.stats.cacheHits!++;
            } else {
              isPrime = this.primeRegistry.isPrime(number);
              this.setCachedValue(this.primalityCache, cacheKey, isPrime);
              this.stats.cacheMisses!++;
            }
          } else {
            isPrime = this.primeRegistry.isPrime(number);
          }
          
          const testTime = performance.now() - chunkStartTime;
          
          if (isPrime) {
            primeCount++;
            this.stats.primalityTestsPassed++;
          }
          
          yield {
            number,
            isPrime,
            testTime
          };
          
          tested++;
          this.stats.primalityTests++;
          this.stats.totalProcessingTime += testTime;
          
          if (this.logger && tested % 100 === 0) {
            await this.logger.debug('Primality test batch completed', {
              tested,
              primeCount,
              primeRatio: primeCount / tested,
              latestNumber: number.toString(),
              isPrime
            });
          }
        } catch (error) {
          this.stats.errors++;
          const testTime = performance.now() - chunkStartTime;
          
          if (this.logger) {
            await this.logger.warn('Failed to test primality', {
              number: number.toString(),
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          
          yield {
            number,
            isPrime: false,
            testTime
          };
        }
      }
      
      const totalTime = performance.now() - startTime;
      
      if (this.logger) {
        await this.logger.info('Primality testing stream completed', {
          totalTested: tested,
          primesFound: primeCount,
          primeRatio: tested > 0 ? primeCount / tested : 0,
          totalTime,
          averageTestTime: tested > 0 ? totalTime / tested : 0
        });
      }
    } catch (error) {
      this.stats.errors++;
      if (this.logger) {
        await this.logger.error('Primality testing stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Stream prime reconstruction - reconstructs numbers from their factors
   */
  async *reconstructStream(factorizations: AsyncIterable<Factor[]>): AsyncIterable<bigint> {
    const startTime = performance.now();
    let reconstructed = 0;
    
    try {
      for await (const factors of factorizations) {
        const chunkStartTime = performance.now();
        
        try {
          let result = BigInt(1);
          
          for (const factor of factors) {
            // Use regular exponentiation for reconstruction
            // Calculate prime^exponent
            let primeToExponent = BigInt(1);
            for (let i = 0; i < factor.exponent; i++) {
              primeToExponent = primeToExponent * factor.prime;
            }
            result = result * primeToExponent;
          }
          
          yield result;
          reconstructed++;
          this.stats.numbersReconstructed++;
          this.stats.totalProcessingTime += performance.now() - chunkStartTime;
          
          if (this.logger && reconstructed % 100 === 0) {
            await this.logger.debug('Reconstruction batch completed', {
              reconstructed,
              latestResult: result.toString(),
              factorCount: factors.length
            });
          }
        } catch (error) {
          this.stats.errors++;
          if (this.logger) {
            await this.logger.error('Failed to reconstruct from factors', {
              factorCount: factors.length,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          throw new Error(`Failed to reconstruct number from factors: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      const totalTime = performance.now() - startTime;
      
      if (this.logger) {
        await this.logger.info('Reconstruction stream completed', {
          totalReconstructed: reconstructed,
          totalTime,
          averageReconstructionTime: reconstructed > 0 ? totalTime / reconstructed : 0
        });
      }
    } catch (error) {
      this.stats.errors++;
      if (this.logger) {
        await this.logger.error('Reconstruction stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Stream prime filtering - filters numbers to only include primes
   */
  async *filterPrimesStream(numbers: AsyncIterable<bigint>): AsyncIterable<bigint> {
    const startTime = performance.now();
    let processed = 0;
    let primesFound = 0;
    
    try {
      for await (const number of numbers) {
        const chunkStartTime = performance.now();
        
        try {
          let isPrime: boolean;
          
          // Use cache if available
          if (this.cacheEnabled && this.primalityCache) {
            const cacheKey = number.toString();
            const cached = this.getCachedValue(this.primalityCache, cacheKey);
            
            if (cached !== undefined) {
              isPrime = cached;
              this.stats.cacheHits!++;
            } else {
              isPrime = this.primeRegistry.isPrime(number);
              this.setCachedValue(this.primalityCache, cacheKey, isPrime);
              this.stats.cacheMisses!++;
            }
          } else {
            isPrime = this.primeRegistry.isPrime(number);
          }
          
          if (isPrime) {
            yield number;
            primesFound++;
            this.stats.primesFiltered++;
          }
          
          processed++;
          this.stats.totalProcessingTime += performance.now() - chunkStartTime;
          
          if (this.logger && processed % 1000 === 0) {
            await this.logger.debug('Prime filtering batch completed', {
              processed,
              primesFound,
              ratio: primesFound / processed
            });
          }
        } catch (error) {
          this.stats.errors++;
          if (this.logger) {
            await this.logger.warn('Failed to test number in prime filter', {
              number: number.toString(),
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
      
      const totalTime = performance.now() - startTime;
      
      if (this.logger) {
        await this.logger.info('Prime filtering stream completed', {
          totalProcessed: processed,
          primesFound,
          primeRatio: processed > 0 ? primesFound / processed : 0,
          totalTime,
          averageFilterTime: processed > 0 ? totalTime / processed : 0
        });
      }
    } catch (error) {
      this.stats.errors++;
      if (this.logger) {
        await this.logger.error('Prime filtering stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Get the underlying prime registry
   */
  getPrimeRegistry(): PrimeRegistryInterface {
    return this.primeRegistry;
  }
  
  /**
   * Set logger for debugging
   */
  setLogger(logger: LoggingInterface): void {
    this.logger = logger;
  }
  
  /**
   * Get stream statistics for monitoring
   */
  getStreamStats(): Readonly<PrimeStats> & {
    registrySize: number;
    cacheUtilization: number;
  } {
    const cacheUtilization = this.cacheEnabled && this.stats.cacheHits !== undefined && 
      this.stats.cacheMisses !== undefined ?
      this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) : 0;
    
    // Registry size is approximated by the number of primes generated
    // since PrimeRegistryInterface doesn't expose a count method
    const registrySize = this.stats.primesGenerated;
    
    return {
      ...this.stats,
      registrySize,
      cacheUtilization
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      primesGenerated: 0,
      numbersFactorized: 0,
      primalityTests: 0,
      primalityTestsPassed: 0,
      numbersReconstructed: 0,
      primesFiltered: 0,
      totalProcessingTime: 0,
      errors: 0,
      largestPrimeGenerated: 0n,
      largestNumberFactorized: 0n
    };
    
    if (this.cacheEnabled) {
      this.stats.cacheHits = 0;
      this.stats.cacheMisses = 0;
    }
  }
  
  /**
   * Clear caches
   */
  clearCaches(): void {
    if (this.factorCache) {
      this.factorCache.clear();
    }
    if (this.primalityCache) {
      this.primalityCache.clear();
    }
    
    if (this.logger) {
      const logResult = this.logger.debug('Prime adapter caches cleared');
      if (logResult && typeof logResult.catch === 'function') {
        logResult.catch(() => {});
      }
    }
  }
  
  /**
   * Get cached value with TTL check
   */
  private getCachedValue<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
    const entry = cache.get(key);
    if (!entry) {
      return undefined;
    }
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * Set cached value with eviction if needed
   */
  private setCachedValue<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): void {
    // Evict oldest entries if cache is full
    if (cache.size >= this.cacheMaxSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }
    
    cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
}

/**
 * Create a prime stream adapter
 */
export function createPrimeStreamAdapter(dependencies: {
  primeRegistry: PrimeRegistryInterface;
  logger?: LoggingInterface;
}): PrimeStreamAdapter {
  return new PrimeStreamAdapter(dependencies);
}

/**
 * Create a prime stream adapter with enhanced capabilities
 */
export function createEnhancedPrimeStreamAdapter(dependencies: {
  primeRegistry: PrimeRegistryInterface;
  logger?: LoggingInterface;
  enableCaching?: boolean;
  cacheMaxSize?: number;
  cacheTTL?: number;
  batchSize?: number;
}): PrimeStreamAdapter {
  const adapter = new PrimeStreamAdapter({
    ...dependencies,
    enableCaching: dependencies.enableCaching ?? true,
    cacheMaxSize: dependencies.cacheMaxSize ?? 1000,
    cacheTTL: dependencies.cacheTTL ?? 60000
  });
  
  if (dependencies.logger) {
    const logResult = dependencies.logger.info('Enhanced prime stream adapter created', {
      enableCaching: dependencies.enableCaching ?? true,
      cacheMaxSize: dependencies.cacheMaxSize ?? 1000,
      cacheTTL: dependencies.cacheTTL ?? 60000,
      batchSize: dependencies.batchSize ?? 100
    });
    if (logResult && typeof logResult.catch === 'function') {
      logResult.catch(() => {});
    }
  }
  
  return adapter;
}
