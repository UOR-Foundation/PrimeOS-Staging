/**
 * Integrity Stream Adapter
 * ========================
 * 
 * Adapter for integrating stream processing with integrity verification
 * from the core/integrity module.
 */

import { IntegrityInterface, VerificationResult, Factor, IntegrityError } from '../../integrity/types';
import { LoggingInterface } from '../../../os/logging/types';

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
 * Statistics tracking for integrity operations
 */
interface IntegrityStats {
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  totalChecksumsGenerated: number;
  totalChecksumsAttached: number;
  totalBatchesProcessed: number;
  totalProcessingTime: number;
  averageVerificationTime: number;
  errors: number;
}

/**
 * Integrity operations adapter for stream processing
 */
export class IntegrityStreamAdapter {
  private integrityModule: IntegrityInterface;
  private logger?: LoggingInterface;
  private stats: IntegrityStats = {
    totalVerifications: 0,
    successfulVerifications: 0,
    failedVerifications: 0,
    totalChecksumsGenerated: 0,
    totalChecksumsAttached: 0,
    totalBatchesProcessed: 0,
    totalProcessingTime: 0,
    averageVerificationTime: 0,
    errors: 0
  };
  
  constructor(dependencies: {
    integrityModule: IntegrityInterface;
    logger?: LoggingInterface;
  }) {
    this.integrityModule = dependencies.integrityModule;
    this.logger = dependencies.logger;
  }
  
  /**
   * Stream integrity verification - verifies checksums for chunks
   */
  async *verifyIntegrityStream(chunks: AsyncIterable<bigint>): AsyncIterable<StreamVerificationResult> {
    const startTime = performance.now();
    let localVerified = 0;
    let localFailed = 0;
    let localIndex = 0;
    
    try {
      for await (const chunk of chunks) {
        const chunkStartTime = performance.now();
        
        try {
          const result = await this.integrityModule.verifyIntegrity(chunk);
          const verificationTime = performance.now() - chunkStartTime;
          
          const streamResult: StreamVerificationResult = {
            chunk,
            valid: result?.valid ?? false,
            checksum: result?.checksum,
            coreFactors: result?.coreFactors,
            errors: result?.error ? [result.error] : [],
            verificationTime,
            index: localIndex
          };
          
          if (result?.valid) {
            localVerified++;
            this.stats.successfulVerifications++;
          } else {
            localFailed++;
            this.stats.failedVerifications++;
          }
          
          this.stats.totalVerifications++;
          this.stats.totalProcessingTime += verificationTime;
          this.updateAverageVerificationTime();
          
          yield streamResult;
          
          if (this.logger && (localIndex + 1) % 100 === 0) {
            await this.logger.debug('Integrity verification batch completed', {
              processed: localIndex + 1,
              verified: localVerified,
              failed: localFailed,
              successRate: localVerified / (localVerified + localFailed)
            });
          }
        } catch (error) {
          const verificationTime = performance.now() - chunkStartTime;
          localFailed++;
          this.stats.failedVerifications++;
          this.stats.totalVerifications++;
          this.stats.errors++;
          this.stats.totalProcessingTime += verificationTime;
          this.updateAverageVerificationTime();
          
          yield {
            chunk,
            valid: false,
            errors: [error instanceof Error ? error.message : 'Unknown verification error'],
            verificationTime,
            index: localIndex
          };
          
          if (this.logger) {
            await this.logger.warn('Integrity verification failed for chunk', {
              index: localIndex,
              chunk: chunk.toString().substring(0, 50) + '...',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
        
        localIndex++;
      }
      
      const totalTime = performance.now() - startTime;
      
      if (this.logger) {
        await this.logger.info('Integrity verification stream completed', {
          totalProcessed: localIndex,
          verified: localVerified,
          failed: localFailed,
          overallSuccessRate: localIndex > 0 ? localVerified / localIndex : 0,
          totalTime,
          averageVerificationTime: this.stats.averageVerificationTime
        });
      }
    } catch (error) {
      this.stats.errors++;
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
    const startTime = performance.now();
    let localIndex = 0;
    let localGenerated = 0;
    
    try {
      for await (const factors of factorStreams) {
        const chunkStartTime = performance.now();
        
        try {
          const checksum = await this.integrityModule.generateChecksum(factors);
          const generationTime = performance.now() - chunkStartTime;
          
          yield {
            factors,
            checksum: checksum ?? 0n,
            generationTime,
            index: localIndex
          };
          
          localGenerated++;
          this.stats.totalChecksumsGenerated++;
          this.stats.totalProcessingTime += generationTime;
          
          if (this.logger && (localIndex + 1) % 100 === 0) {
            await this.logger.debug('Checksum generation batch completed', {
              processed: localIndex + 1,
              generated: localGenerated,
              averageTime: this.stats.totalProcessingTime / this.stats.totalChecksumsGenerated
            });
          }
        } catch (error) {
          this.stats.errors++;
          const generationTime = performance.now() - chunkStartTime;
          this.stats.totalProcessingTime += generationTime;
          
          if (this.logger) {
            await this.logger.warn('Checksum generation failed', {
              index: localIndex,
              factorCount: factors.length,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          
          // Yield with zero checksum on error
          yield {
            factors,
            checksum: 0n,
            generationTime,
            index: localIndex
          };
        }
        
        localIndex++;
      }
      
      const totalTime = performance.now() - startTime;
      
      if (this.logger) {
        await this.logger.info('Checksum generation stream completed', {
          totalProcessed: localIndex,
          successful: localGenerated,
          totalTime,
          averageGenerationTime: this.stats.totalChecksumsGenerated > 0 ?
            this.stats.totalProcessingTime / this.stats.totalChecksumsGenerated : 0
        });
      }
    } catch (error) {
      this.stats.errors++;
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
    const startTime = performance.now();
    let localIndex = 0;
    let localAttached = 0;
    
    try {
      for await (const { value, factors } of valueFactorPairs) {
        const chunkStartTime = performance.now();
        
        try {
          const checksummedValue = await this.integrityModule.attachChecksum(value, factors);
          const attachmentTime = performance.now() - chunkStartTime;
          
          yield {
            originalValue: value,
            checksummedValue: checksummedValue ?? value,
            factors,
            attachmentTime,
            index: localIndex
          };
          
          localAttached++;
          this.stats.totalChecksumsAttached++;
          this.stats.totalProcessingTime += attachmentTime;
          
          if (this.logger && (localIndex + 1) % 100 === 0) {
            await this.logger.debug('Checksum attachment batch completed', {
              processed: localIndex + 1,
              attached: localAttached,
              averageTime: this.stats.totalProcessingTime / this.stats.totalChecksumsAttached
            });
          }
        } catch (error) {
          this.stats.errors++;
          const attachmentTime = performance.now() - chunkStartTime;
          this.stats.totalProcessingTime += attachmentTime;
          
          if (this.logger) {
            await this.logger.warn('Checksum attachment failed', {
              index: localIndex,
              value: value.toString().substring(0, 50) + '...',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          
          // Yield original value on error
          yield {
            originalValue: value,
            checksummedValue: value,
            factors,
            attachmentTime,
            index: localIndex
          };
        }
        
        localIndex++;
      }
      
      const totalTime = performance.now() - startTime;
      
      if (this.logger) {
        await this.logger.info('Checksum attachment stream completed', {
          totalProcessed: localIndex,
          successful: localAttached,
          totalTime,
          averageAttachmentTime: this.stats.totalChecksumsAttached > 0 ?
            this.stats.totalProcessingTime / this.stats.totalChecksumsAttached : 0
        });
      }
    } catch (error) {
      this.stats.errors++;
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
    // Validate inputs
    if (batchSize < 1 || !Number.isInteger(batchSize)) {
      throw new Error('batchSize must be a positive integer');
    }
    
    const startTime = performance.now();
    let batch: bigint[] = [];
    let batchIndex = 0;
    let globalIndex = 0;
    
    try {
      for await (const chunk of chunks) {
        batch.push(chunk);
        
        if (batch.length >= batchSize) {
          const results = await this.processBatch(batch, globalIndex - batch.length + 1);
          yield results;
          
          this.stats.totalBatchesProcessed++;
          
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
        
        this.stats.totalBatchesProcessed++;
        
        if (this.logger) {
          await this.logger.debug('Processed final verification batch', {
            batchIndex,
            batchSize: batch.length,
            globalIndex
          });
        }
      }
      
      const totalTime = performance.now() - startTime;
      
      if (this.logger) {
        await this.logger.info('Batch verification stream completed', {
          totalBatches: batchIndex + (batch.length > 0 ? 1 : 0),
          totalItems: globalIndex,
          totalTime,
          averageVerificationTime: this.stats.averageVerificationTime
        });
      }
    } catch (error) {
      this.stats.errors++;
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
  setLogger(logger: LoggingInterface): void {
    this.logger = logger;
  }
  
  /**
   * Get integrity stream statistics
   */
  getIntegrityStats(): Readonly<IntegrityStats> {
    return { ...this.stats };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalVerifications: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      totalChecksumsGenerated: 0,
      totalChecksumsAttached: 0,
      totalBatchesProcessed: 0,
      totalProcessingTime: 0,
      averageVerificationTime: 0,
      errors: 0
    };
  }
  
  /**
   * Process a batch of chunks for verification
   */
  private async processBatch(chunks: bigint[], startIndex: number): Promise<StreamVerificationResult[]> {
    const results: StreamVerificationResult[] = [];
    
    try {
      // Check if batch verification is available
      if (this.integrityModule.verifyBatch) {
        const verificationResults = await this.integrityModule.verifyBatch(chunks);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const result = verificationResults[i];
          const index = startIndex + i;
          
          if (result.valid) {
            this.stats.successfulVerifications++;
          } else {
            this.stats.failedVerifications++;
          }
          this.stats.totalVerifications++;
          
          results.push({
            chunk,
            valid: result.valid,
            checksum: result.checksum,
            coreFactors: result.coreFactors,
            errors: result.error ? [result.error] : [],
            verificationTime: 0, // Batch processing doesn't provide individual times
            index
          });
        }
      } else {
        // Fallback to individual verification
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const index = startIndex + i;
          const chunkStartTime = performance.now();
          
          try {
            const result = await this.integrityModule.verifyIntegrity(chunk);
            const verificationTime = performance.now() - chunkStartTime;
            
            if (result.valid) {
              this.stats.successfulVerifications++;
            } else {
              this.stats.failedVerifications++;
            }
            this.stats.totalVerifications++;
            this.stats.totalProcessingTime += verificationTime;
            this.updateAverageVerificationTime();
            
            results.push({
              chunk,
              valid: result.valid,
              checksum: result.checksum,
              coreFactors: result.coreFactors,
              errors: result.error ? [result.error] : [],
              verificationTime,
              index
            });
          } catch (error) {
            const verificationTime = performance.now() - chunkStartTime;
            this.stats.failedVerifications++;
            this.stats.totalVerifications++;
            this.stats.errors++;
            this.stats.totalProcessingTime += verificationTime;
            this.updateAverageVerificationTime();
            
            results.push({
              chunk,
              valid: false,
              errors: [error instanceof Error ? error.message : 'Verification error'],
              verificationTime,
              index
            });
          }
        }
      }
    } catch (error) {
      // Create error results for all chunks in batch
      for (let i = 0; i < chunks.length; i++) {
        this.stats.failedVerifications++;
        this.stats.totalVerifications++;
        this.stats.errors++;
        
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
  
  /**
   * Update average verification time
   */
  private updateAverageVerificationTime(): void {
    if (this.stats.totalVerifications > 0) {
      this.stats.averageVerificationTime = this.stats.totalProcessingTime / this.stats.totalVerifications;
    }
  }
}

/**
 * Create an integrity stream adapter
 */
export function createIntegrityStreamAdapter(dependencies: {
  integrityModule: IntegrityInterface;
  logger?: LoggingInterface;
}): IntegrityStreamAdapter {
  return new IntegrityStreamAdapter(dependencies);
}

/**
 * Create an integrity stream adapter with enhanced batch processing
 */
export function createBatchIntegrityStreamAdapter(dependencies: {
  integrityModule: IntegrityInterface;
  logger?: LoggingInterface;
  defaultBatchSize?: number;
  enableStatistics?: boolean;
}): IntegrityStreamAdapter {
  const adapter = new IntegrityStreamAdapter(dependencies);
  
  // Configure batch processing settings
  const batchSize = dependencies.defaultBatchSize ?? 10;
  const enableStats = dependencies.enableStatistics ?? true;
  
  if (dependencies.logger) {
    const logResult = dependencies.logger.info('Batch integrity stream adapter created', {
      defaultBatchSize: batchSize,
      enableStatistics: enableStats,
      hasBatchVerification: !!dependencies.integrityModule.verifyBatch
    });
    if (logResult && typeof logResult.catch === 'function') {
      logResult.catch(() => {});
    }
  }
  
  return adapter;
}
