/**
 * Integrity Stream Adapter
 * ========================
 * 
 * Adapter for integrating stream processing with integrity verification
 * from the core/integrity module.
 */

import { IntegrityInterface, VerificationResult, Factor } from '../../integrity/types';

/**
 * Integrity verification result for streams
 */
export interface StreamVerificationResult {
  chunk: bigint;
  valid: boolean;
  checksum?: bigint;
  coreFactors?: Factor[];
  errors: string[];
  verificationTime: number;
  index: number;
}

/**
 * Integrity operations adapter for stream processing
 */
export class IntegrityStreamAdapter {
  private integrityModule: IntegrityInterface;
  private logger?: any;
  
  constructor(dependencies: {
    integrityModule: IntegrityInterface;
    logger?: any;
  }) {
    this.integrityModule = dependencies.integrityModule;
    this.logger = dependencies.logger;
  }
  
  /**
   * Stream integrity verification - verifies checksums for chunks
   */
  async *verifyIntegrityStream(chunks: AsyncIterable<bigint>): AsyncIterable<StreamVerificationResult> {
    try {
      let index = 0;
      let verified = 0;
      let failed = 0;
      
      for await (const chunk of chunks) {
        const startTime = performance.now();
        
        try {
          const result = await this.integrityModule.verifyIntegrity(chunk);
          const verificationTime = performance.now() - startTime;
          
          const streamResult: StreamVerificationResult = {
            chunk,
            valid: result.valid,
            checksum: result.checksum,
            coreFactors: result.coreFactors,
            errors: result.error ? [result.error] : [],
            verificationTime,
            index
          };
          
          if (result.valid) {
            verified++;
          } else {
            failed++;
          }
          
          yield streamResult;
          
          if (this.logger && (index + 1) % 100 === 0) {
            await this.logger.debug('Integrity verification batch completed', {
              processed: index + 1,
              verified,
              failed,
              successRate: verified / (verified + failed)
            });
          }
        } catch (error) {
          const verificationTime = performance.now() - startTime;
          failed++;
          
          yield {
            chunk,
            valid: false,
            errors: [error instanceof Error ? error.message : 'Unknown verification error'],
            verificationTime,
            index
          };
          
          if (this.logger) {
            await this.logger.warn('Integrity verification failed for chunk', {
              index,
              chunk: chunk.toString().substring(0, 50) + '...',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        index++;
      }
      
      if (this.logger) {
        await this.logger.info('Integrity verification stream completed', {
          totalProcessed: index,
          verified,
          failed,
          overallSuccessRate: index > 0 ? verified / index : 0
        });
      }
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Integrity verification stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Stream checksum generation - generates checksums for factor streams
   */
  async *generateChecksumsStream(factorStreams: AsyncIterable<Factor[]>): AsyncIterable<{
    factors: Factor[];
    checksum: bigint;
    generationTime: number;
    index: number;
  }> {
    try {
      let index = 0;
      let generated = 0;
      
      for await (const factors of factorStreams) {
        const startTime = performance.now();
        
        try {
          const checksum = await this.integrityModule.generateChecksum(factors);
          const generationTime = performance.now() - startTime;
          
          yield {
            factors,
            checksum,
            generationTime,
            index
          };
          
          generated++;
          
          if (this.logger && (index + 1) % 100 === 0) {
            await this.logger.debug('Checksum generation batch completed', {
              processed: index + 1,
              generated,
              averageTime: (performance.now() - startTime) / (index + 1)
            });
          }
        } catch (error) {
          if (this.logger) {
            await this.logger.warn('Checksum generation failed', {
              index,
              factorCount: factors.length,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          
          // Yield with zero checksum on error
          yield {
            factors,
            checksum: 0n,
            generationTime: performance.now() - startTime,
            index
          };
        }
        
        index++;
      }
      
      if (this.logger) {
        await this.logger.info('Checksum generation stream completed', {
          totalProcessed: index,
          successful: generated
        });
      }
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Checksum generation stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Stream checksum attachment - attaches checksums to values
   */
  async *attachChecksumsStream(
    valueFactorPairs: AsyncIterable<{ value: bigint; factors: Factor[] }>
  ): AsyncIterable<{
    originalValue: bigint;
    checksummedValue: bigint;
    factors: Factor[];
    attachmentTime: number;
    index: number;
  }> {
    try {
      let index = 0;
      let attached = 0;
      
      for await (const { value, factors } of valueFactorPairs) {
        const startTime = performance.now();
        
        try {
          const checksummedValue = await this.integrityModule.attachChecksum(value, factors);
          const attachmentTime = performance.now() - startTime;
          
          yield {
            originalValue: value,
            checksummedValue,
            factors,
            attachmentTime,
            index
          };
          
          attached++;
          
          if (this.logger && (index + 1) % 100 === 0) {
            await this.logger.debug('Checksum attachment batch completed', {
              processed: index + 1,
              attached,
              averageTime: (performance.now() - startTime) / (index + 1)
            });
          }
        } catch (error) {
          if (this.logger) {
            await this.logger.warn('Checksum attachment failed', {
              index,
              value: value.toString().substring(0, 50) + '...',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          
          // Yield original value on error
          yield {
            originalValue: value,
            checksummedValue: value,
            factors,
            attachmentTime: performance.now() - startTime,
            index
          };
        }
        
        index++;
      }
      
      if (this.logger) {
        await this.logger.info('Checksum attachment stream completed', {
          totalProcessed: index,
          successful: attached
        });
      }
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Checksum attachment stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Stream batch verification - verifies multiple chunks efficiently
   */
  async *verifyBatchStream(
    chunks: AsyncIterable<bigint>,
    batchSize: number = 10
  ): AsyncIterable<StreamVerificationResult[]> {
    try {
      let batch: bigint[] = [];
      let batchIndex = 0;
      let globalIndex = 0;
      
      for await (const chunk of chunks) {
        batch.push(chunk);
        
        if (batch.length >= batchSize) {
          const results = await this.processBatch(batch, globalIndex - batch.length + 1);
          yield results;
          
          if (this.logger) {
            await this.logger.debug('Processed verification batch', {
              batchIndex,
              batchSize: batch.length,
              globalIndex
            });
          }
          
          batch = [];
          batchIndex++;
        }
        
        globalIndex++;
      }
      
      // Process remaining items
      if (batch.length > 0) {
        const results = await this.processBatch(batch, globalIndex - batch.length);
        yield results;
        
        if (this.logger) {
          await this.logger.debug('Processed final verification batch', {
            batchIndex,
            batchSize: batch.length,
            globalIndex
          });
        }
      }
      
      if (this.logger) {
        await this.logger.info('Batch verification stream completed', {
          totalBatches: batchIndex + (batch.length > 0 ? 1 : 0),
          totalItems: globalIndex
        });
      }
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Batch verification stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Get the underlying integrity module
   */
  getIntegrityModule(): IntegrityInterface {
    return this.integrityModule;
  }
  
  /**
   * Set logger for debugging
   */
  setLogger(logger: any): void {
    this.logger = logger;
  }
  
  /**
   * Get integrity stream statistics
   */
  getIntegrityStats(): {
    totalVerifications: number;
    successRate: number;
    averageVerificationTime: number;
  } {
    // These would need to be tracked internally
    return {
      totalVerifications: 0,
      successRate: 0,
      averageVerificationTime: 0
    };
  }
  
  /**
   * Process a batch of chunks for verification
   */
  private async processBatch(chunks: bigint[], startIndex: number): Promise<StreamVerificationResult[]> {
    const results: StreamVerificationResult[] = [];
    
    try {
      const verificationResults = await this.integrityModule.verifyBatch(chunks);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const result = verificationResults[i];
        const index = startIndex + i;
        
        results.push({
          chunk,
          valid: result.valid,
          checksum: result.checksum,
          coreFactors: result.coreFactors,
          errors: result.error ? [result.error] : [],
          verificationTime: 0, // Would need to measure in batch processing
          index
        });
      }
    } catch (error) {
      // Create error results for all chunks in batch
      for (let i = 0; i < chunks.length; i++) {
        results.push({
          chunk: chunks[i],
          valid: false,
          errors: [error instanceof Error ? error.message : 'Batch verification error'],
          verificationTime: 0,
          index: startIndex + i
        });
      }
    }
    
    return results;
  }
}

/**
 * Create an integrity stream adapter
 */
export function createIntegrityStreamAdapter(dependencies: {
  integrityModule: IntegrityInterface;
  logger?: any;
}): IntegrityStreamAdapter {
  return new IntegrityStreamAdapter(dependencies);
}

/**
 * Create an integrity stream adapter with enhanced batch processing
 */
export function createBatchIntegrityStreamAdapter(dependencies: {
  integrityModule: IntegrityInterface;
  logger?: any;
  defaultBatchSize?: number;
  enableStatistics?: boolean;
}): IntegrityStreamAdapter {
  const adapter = new IntegrityStreamAdapter(dependencies);
  
  // Could add enhanced features for batch processing
  if (dependencies.logger) {
    dependencies.logger.info('Batch integrity stream adapter created', {
      defaultBatchSize: dependencies.defaultBatchSize ?? 10,
      enableStatistics: dependencies.enableStatistics ?? false
    }).catch(() => {});
  }
  
  return adapter;
}
