/**
 * Prime Stream Processor Implementation
 * ====================================
 * 
 * Handles streaming operations on prime-encoded data with integration to core/prime module.
 */

import {
  PrimeStreamProcessor,
  PrimeStreamOptions,
  PrimeStreamMetrics,
  ProcessedChunk,
  VerificationResult
} from '../types';

// Import types from prime module
import { PrimeRegistryInterface, Factor } from '../../prime/types';
import { DecodedChunk, ChunkType } from '../../encoding/core/types';

/**
 * Default options for prime stream processing
 */
const DEFAULT_OPTIONS: PrimeStreamOptions = {
  chunkSize: 1024,
  maxConcurrency: 4,
  enableIntegrityCheck: true,
  factorizationStrategy: 'adaptive',
  memoryLimit: 100 * 1024 * 1024 // 100MB
};

/**
 * Implementation of prime stream processor
 */
export class PrimeStreamProcessorImpl implements PrimeStreamProcessor {
  private config: PrimeStreamOptions;
  private primeRegistry: PrimeRegistryInterface;
  private logger?: any;
  private metrics: PrimeStreamMetrics = {
    chunksProcessed: 0,
    numbersFactorized: 0,
    integrityChecksPerformed: 0,
    averageProcessingTime: 0,
    memoryUsage: 0,
    errorRate: 0
  };
  private stats = {
    totalProcessingTime: 0,
    errors: 0,
    operations: 0
  };
  
  constructor(dependencies: {
    primeRegistry: PrimeRegistryInterface;
    chunkSize?: number;
    logger?: any;
  }) {
    this.primeRegistry = dependencies.primeRegistry;
    this.config = {
      ...DEFAULT_OPTIONS,
      chunkSize: dependencies.chunkSize || DEFAULT_OPTIONS.chunkSize
    };
    this.logger = dependencies.logger;
  }
  
  async processPrimeStream(chunks: AsyncIterable<bigint>): Promise<ProcessedChunk[]> {
    const results: ProcessedChunk[] = [];
    
    try {
      for await (const chunk of chunks) {
        const startTime = performance.now();
        
        try {
          // Decode the chunk (simplified - would need encoding module integration)
          const decodedData: DecodedChunk = await this.decodeChunk(chunk);
          
          // Verify integrity if enabled
          let verified = true;
          if (this.config.enableIntegrityCheck) {
            verified = await this.verifyChunkIntegrity(chunk);
            this.metrics.integrityChecksPerformed++;
          }
          
          const processingTime = performance.now() - startTime;
          
          const processedChunk: ProcessedChunk = {
            originalChunk: chunk,
            decodedData,
            processingTime,
            verified,
            errors: []
          };
          
          results.push(processedChunk);
          this.metrics.chunksProcessed++;
          this.stats.totalProcessingTime += processingTime;
          this.stats.operations++;
          
          if (this.logger) {
            await this.logger.debug('Processed prime chunk', {
              chunkSize: chunk.toString().length,
              processingTime,
              verified
            });
          }
          
        } catch (error) {
          this.stats.errors++;
          this.stats.operations++; // Count failed operations
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          const processedChunk: ProcessedChunk = {
            originalChunk: chunk,
            decodedData: { 
              type: ChunkType.DATA, 
              checksum: 0n, 
              data: { value: 0, position: 0 } 
            },
            processingTime: performance.now() - startTime,
            verified: false,
            errors: [errorMessage]
          };
          
          results.push(processedChunk);
          this.metrics.chunksProcessed++; // Still count failed chunks
          
          if (this.logger) {
            await this.logger.error('Prime chunk processing failed', {
              error: errorMessage,
              chunk: chunk.toString().substring(0, 50) + '...'
            });
          }
        }
      }
      
      // Update metrics
      this.updateMetrics();
      
      return results;
      
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Prime stream processing failed', error);
      }
      throw error;
    }
  }
  
  async streamFactorization(numbers: AsyncIterable<bigint>): Promise<AsyncIterable<Factor[]>> {
    const self = this;
    
    return {
      async *[Symbol.asyncIterator]() {
        try {
          for await (const number of numbers) {
            const startTime = performance.now();
            
            try {
              const factors = self.primeRegistry.factor(number);
              self.metrics.numbersFactorized++;
              self.stats.totalProcessingTime += performance.now() - startTime;
              self.stats.operations++;
              
              if (self.logger) {
                await self.logger.debug('Factorized number', {
                  number: number.toString(),
                  factorCount: factors.length,
                  processingTime: performance.now() - startTime
                });
              }
              
              yield factors;
              
            } catch (error) {
              self.stats.errors++;
              self.stats.operations++; // Count failed operations
              if (self.logger) {
                await self.logger.error('Factorization failed', {
                  number: number.toString(),
                  error: error instanceof Error ? error.message : 'Unknown error'
                });
              }
              
              // Yield empty factorization on error
              yield [];
            }
          }
          
          // Update metrics after processing
          self.updateMetrics();
          
        } catch (error) {
          if (self.logger) {
            await self.logger.error('Stream factorization failed', error);
          }
          throw error;
        }
      }
    };
  }
  
  async verifyStreamIntegrity(chunks: AsyncIterable<bigint>): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];
    
    try {
      for await (const chunk of chunks) {
        const startTime = performance.now();
        
        try {
          const valid = await this.verifyChunkIntegrity(chunk);
          const verificationTime = performance.now() - startTime;
          
          const result: VerificationResult = {
            chunk,
            valid,
            checksum: valid ? this.extractChecksum(chunk) : 0n,
            errors: valid ? [] : ['Integrity verification failed'],
            verificationTime
          };
          
          results.push(result);
          this.metrics.integrityChecksPerformed++;
          this.stats.totalProcessingTime += verificationTime;
          this.stats.operations++;
          
          if (this.logger) {
            await this.logger.debug('Verified chunk integrity', {
              chunk: chunk.toString().substring(0, 50) + '...',
              valid,
              verificationTime
            });
          }
          
        } catch (error) {
          this.stats.errors++;
          this.stats.operations++; // Count failed operations
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          const result: VerificationResult = {
            chunk,
            valid: false,
            checksum: 0n,
            errors: [errorMessage],
            verificationTime: performance.now() - startTime
          };
          
          results.push(result);
          
          if (this.logger) {
            await this.logger.error('Integrity verification failed', {
              error: errorMessage,
              chunk: chunk.toString().substring(0, 50) + '...'
            });
          }
        }
      }
      
      // Update metrics
      this.updateMetrics();
      
      return results;
      
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Stream integrity verification failed', error);
      }
      throw error;
    }
  }
  
  configure(options: PrimeStreamOptions): void {
    this.config = { ...this.config, ...options };
    
    if (this.logger) {
      this.logger.debug('Prime stream processor configured', { config: this.config }).catch(() => {});
    }
  }
  
  getMetrics(): PrimeStreamMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }
  
  private async decodeChunk(chunk: bigint): Promise<DecodedChunk> {
    // Simplified decoding - in production would integrate with encoding module
    try {
      // Simulate potential prime registry errors by checking for invalid inputs
      if (chunk <= 0n) {
        throw new Error('Invalid chunk: must be positive');
      }
      
      const factors = this.primeRegistry.factor(chunk);
      
      return {
        type: ChunkType.DATA,
        checksum: 0n, // Would extract actual checksum
        data: {
          value: factors.length, // Simplified representation
          position: 0
        }
      };
    } catch (error) {
      // Re-throw to be caught by caller for proper error tracking
      throw error;
    }
  }
  
  private async verifyChunkIntegrity(chunk: bigint): Promise<boolean> {
    try {
      // Simplified integrity check - in production would integrate with integrity module
      const factors = this.primeRegistry.factor(chunk);
      
      // Basic verification: check if factorization is valid
      const reconstructed = factors.reduce(
        (acc, factor) => acc * (factor.prime ** BigInt(factor.exponent)),
        1n
      );
      
      return reconstructed === chunk;
      
    } catch (error) {
      return false;
    }
  }
  
  private extractChecksum(chunk: bigint): bigint {
    try {
      // Simplified checksum extraction
      const factors = this.primeRegistry.factor(chunk);
      
      // Find the largest prime factor as a simple checksum
      return factors.length > 0 ? factors[factors.length - 1].prime : 0n;
      
    } catch (error) {
      return 0n;
    }
  }
  
  private updateMetrics(): void {
    // Update average processing time
    if (this.stats.operations > 0) {
      this.metrics.averageProcessingTime = this.stats.totalProcessingTime / this.stats.operations;
    }
    
    // Update error rate
    if (this.stats.operations > 0) {
      this.metrics.errorRate = this.stats.errors / this.stats.operations;
    }
    
    // Update memory usage (simplified)
    this.metrics.memoryUsage = this.estimateMemoryUsage();
  }
  
  private estimateMemoryUsage(): number {
    // Simplified memory estimation
    return this.metrics.chunksProcessed * 1024; // Rough estimate: 1KB per chunk
  }
}
