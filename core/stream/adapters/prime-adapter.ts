/**
 * Prime Stream Adapter
 * ===================
 * 
 * Adapter for integrating stream processing with prime number operations
 * from the core/prime module.
 */

import { PrimeRegistryInterface, Factor } from '../../prime/types';
import { createAsyncIterable } from '../utils';

/**
 * Prime operations adapter for stream processing
 */
export class PrimeStreamAdapter {
  private primeRegistry: PrimeRegistryInterface;
  private logger?: any;
  
  constructor(dependencies: {
    primeRegistry: PrimeRegistryInterface;
    logger?: any;
  }) {
    this.primeRegistry = dependencies.primeRegistry;
    this.logger = dependencies.logger;
  }
  
  /**
   * Stream prime generation - generates consecutive primes
   */
  async *generatePrimeStream(startIndex: number = 0, count?: number): AsyncIterable<bigint> {
    try {
      let currentIndex = startIndex;
      let generated = 0;
      
      while (count === undefined || generated < count) {
        try {
          const prime = this.primeRegistry.getPrime(currentIndex);
          yield prime;
          
          currentIndex++;
          generated++;
          
          if (this.logger && generated % 1000 === 0) {
            await this.logger.debug('Generated prime batch', {
              generated,
              currentIndex,
              latestPrime: prime.toString()
            });
          }
        } catch (error) {
          if (this.logger) {
            await this.logger.warn('Failed to generate prime at index', {
              index: currentIndex,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          break;
        }
      }
      
      if (this.logger) {
        await this.logger.info('Prime generation stream completed', {
          totalGenerated: generated,
          finalIndex: currentIndex - 1
        });
      }
    } catch (error) {
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
    try {
      let processed = 0;
      
      for await (const number of numbers) {
        try {
          const factors = this.primeRegistry.factor(number);
          yield factors;
          
          processed++;
          
          if (this.logger && processed % 100 === 0) {
            await this.logger.debug('Factorized number batch', {
              processed,
              latestNumber: number.toString(),
              factorCount: factors.length
            });
          }
        } catch (error) {
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
      
      if (this.logger) {
        await this.logger.info('Factorization stream completed', {
          totalProcessed: processed
        });
      }
    } catch (error) {
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
    try {
      let tested = 0;
      
      for await (const number of numbers) {
        const startTime = performance.now();
        
        try {
          const isPrime = this.primeRegistry.isPrime(number);
          const testTime = performance.now() - startTime;
          
          yield {
            number,
            isPrime,
            testTime
          };
          
          tested++;
          
          if (this.logger && tested % 100 === 0) {
            await this.logger.debug('Primality test batch completed', {
              tested,
              latestNumber: number.toString(),
              isPrime,
              testTime
            });
          }
        } catch (error) {
          if (this.logger) {
            await this.logger.warn('Failed to test primality', {
              number: number.toString(),
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          
          yield {
            number,
            isPrime: false,
            testTime: performance.now() - startTime
          };
        }
      }
      
      if (this.logger) {
        await this.logger.info('Primality testing stream completed', {
          totalTested: tested
        });
      }
    } catch (error) {
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
    try {
      let reconstructed = 0;
      
      for await (const factors of factorizations) {
        try {
          let result = 1n;
          
          for (const factor of factors) {
            result *= factor.prime ** BigInt(factor.exponent);
          }
          
          yield result;
          reconstructed++;
          
          if (this.logger && reconstructed % 100 === 0) {
            await this.logger.debug('Reconstruction batch completed', {
              reconstructed,
              latestResult: result.toString(),
              factorCount: factors.length
            });
          }
        } catch (error) {
          if (this.logger) {
            await this.logger.warn('Failed to reconstruct from factors', {
              factorCount: factors.length,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          // Yield 1 as fallback
          yield 1n;
        }
      }
      
      if (this.logger) {
        await this.logger.info('Reconstruction stream completed', {
          totalReconstructed: reconstructed
        });
      }
    } catch (error) {
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
    try {
      let processed = 0;
      let primesFound = 0;
      
      for await (const number of numbers) {
        try {
          if (this.primeRegistry.isPrime(number)) {
            yield number;
            primesFound++;
          }
          
          processed++;
          
          if (this.logger && processed % 1000 === 0) {
            await this.logger.debug('Prime filtering batch completed', {
              processed,
              primesFound,
              ratio: primesFound / processed
            });
          }
        } catch (error) {
          if (this.logger) {
            await this.logger.warn('Failed to test number in prime filter', {
              number: number.toString(),
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
      
      if (this.logger) {
        await this.logger.info('Prime filtering stream completed', {
          totalProcessed: processed,
          primesFound,
          primeRatio: processed > 0 ? primesFound / processed : 0
        });
      }
    } catch (error) {
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
  setLogger(logger: any): void {
    this.logger = logger;
  }
  
  /**
   * Get stream statistics for monitoring
   */
  getStreamStats(): {
    registrySize: number;
    largestKnownPrime: bigint;
    cacheUtilization: number;
  } {
    // These would need to be implemented in the prime registry interface
    return {
      registrySize: 0, // Would get from registry
      largestKnownPrime: 0n, // Would get from registry
      cacheUtilization: 0 // Would calculate from registry stats
    };
  }
}

/**
 * Create a prime stream adapter
 */
export function createPrimeStreamAdapter(dependencies: {
  primeRegistry: PrimeRegistryInterface;
  logger?: any;
}): PrimeStreamAdapter {
  return new PrimeStreamAdapter(dependencies);
}

/**
 * Create a prime stream adapter with enhanced capabilities
 */
export function createEnhancedPrimeStreamAdapter(dependencies: {
  primeRegistry: PrimeRegistryInterface;
  logger?: any;
  enableCaching?: boolean;
  batchSize?: number;
}): PrimeStreamAdapter {
  const adapter = new PrimeStreamAdapter(dependencies);
  
  // Could add enhanced features like caching, batching, etc.
  if (dependencies.logger) {
    dependencies.logger.info('Enhanced prime stream adapter created', {
      enableCaching: dependencies.enableCaching ?? false,
      batchSize: dependencies.batchSize ?? 100
    }).catch(() => {});
  }
  
  return adapter;
}
