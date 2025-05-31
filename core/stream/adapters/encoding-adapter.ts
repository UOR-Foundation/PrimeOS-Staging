/**
 * Encoding Stream Adapter
 * =======================
 * 
 * Implementation of EncodingStreamBridge for integrating stream processing
 * with the encoding module for text and program processing.
 */

import { EncodingStreamBridge } from '../types';
import { 
  DecodedChunk, 
  EncodingInterface, 
  ChunkType,
  ChunkData,
  EncodingError 
} from '../../encoding/core/types';
import { LoggingInterface } from '../../../os/logging/types';

/**
 * Statistics tracking for encoding operations
 */
interface EncodingStats {
  textChunksEncoded: number;
  textChunksDecoded: number;
  chunksDecoded: number;
  programsExecuted: number;
  errors: number;
  totalProcessingTime: number;
}

/**
 * Implementation of encoding stream bridge
 */
export class EncodingStreamAdapter implements EncodingStreamBridge {
  private encodingModule?: EncodingInterface;
  private logger?: LoggingInterface;
  private stats: EncodingStats = {
    textChunksEncoded: 0,
    textChunksDecoded: 0,
    chunksDecoded: 0,
    programsExecuted: 0,
    errors: 0,
    totalProcessingTime: 0
  };
  
  constructor(dependencies: {
    encodingModule?: EncodingInterface;
    logger?: LoggingInterface;
  } = {}) {
    this.encodingModule = dependencies.encodingModule;
    this.logger = dependencies.logger;
  }
  
  /**
   * Stream text encoding - converts strings to prime-encoded chunks
   */
  async *encodeTextStream(text: AsyncIterable<string>): AsyncIterable<bigint> {
    const startTime = performance.now();
    
    try {
      for await (const str of text) {
        const chunkStartTime = performance.now();
        
        try {
          if (!this.encodingModule) {
            throw new EncodingError('Encoding module is required for text encoding');
          }
          
          const chunks = await this.encodingModule.encodeText(str);
          if (chunks === undefined || chunks === null) {
            throw new EncodingError('Encoding module returned invalid result');
          }
          
          if (Array.isArray(chunks)) {
            for (const chunk of chunks) {
              if (chunk !== undefined && chunk !== null) {
                yield chunk;
                this.stats.textChunksEncoded++;
              }
            }
          } else {
            yield chunks;
            this.stats.textChunksEncoded++;
          }
          
          const chunkTime = performance.now() - chunkStartTime;
          this.stats.totalProcessingTime += chunkTime;
          
          if (this.logger) {
            await this.logger.debug('Encoded text chunk', { 
              originalLength: str.length,
              hasEncodingModule: !!this.encodingModule,
              processingTime: chunkTime
            });
          }
        } catch (error) {
          this.stats.errors++;
          if (this.logger) {
            await this.logger.error('Failed to encode text chunk', {
              error: error instanceof Error ? error.message : 'Unknown error',
              chunkLength: str.length
            });
          }
          throw new EncodingError(`Failed to encode text chunk: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      this.stats.errors++;
      if (this.logger) {
        await this.logger.error('Text encoding stream failed', error);
      }
      throw error;
    } finally {
      const totalTime = performance.now() - startTime;
      if (this.logger) {
        await this.logger.info('Text encoding stream completed', {
          chunksEncoded: this.stats.textChunksEncoded,
          totalTime,
          averageChunkTime: this.stats.textChunksEncoded > 0 ? 
            this.stats.totalProcessingTime / this.stats.textChunksEncoded : 0
        });
      }
    }
  }
  
  /**
   * Stream text decoding - converts prime-encoded chunks back to strings
   */
  async *decodeTextStream(chunks: AsyncIterable<bigint>): AsyncIterable<string> {
    const startTime = performance.now();
    
    try {
      for await (const chunk of chunks) {
        const chunkStartTime = performance.now();
        
        try {
          let decoded: string;
          
          if (!this.encodingModule) {
            throw new EncodingError('Encoding module is required for text decoding');
          }
          
          const result = await this.encodingModule.decodeText([chunk]);
          if (result === undefined || result === null) {
            throw new EncodingError('Encoding module returned invalid result');
          }
          
          decoded = result;
          this.stats.textChunksDecoded++;
          
          yield decoded;
          
          const chunkTime = performance.now() - chunkStartTime;
          this.stats.totalProcessingTime += chunkTime;
          
          if (this.logger) {
            await this.logger.debug('Decoded text chunk', { 
              chunk: chunk.toString().substring(0, 50) + '...',
              hasEncodingModule: !!this.encodingModule,
              processingTime: chunkTime
            });
          }
        } catch (error) {
          this.stats.errors++;
          if (this.logger) {
            await this.logger.error('Failed to decode text chunk', {
              error: error instanceof Error ? error.message : 'Unknown error',
              chunk: chunk.toString().substring(0, 50) + '...'
            });
          }
          throw new EncodingError(`Failed to decode text chunk: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      this.stats.errors++;
      if (this.logger) {
        await this.logger.error('Text decoding stream failed', error);
      }
      throw error;
    } finally {
      const totalTime = performance.now() - startTime;
      if (this.logger) {
        await this.logger.info('Text decoding stream completed', {
          chunksDecoded: this.stats.textChunksDecoded,
          totalTime,
          averageChunkTime: this.stats.textChunksDecoded > 0 ? 
            this.stats.totalProcessingTime / this.stats.textChunksDecoded : 0
        });
      }
    }
  }
  
  /**
   * Stream chunk decoding - converts chunks to structured data
   */
  async *decodeChunkStream(chunks: AsyncIterable<bigint>): AsyncIterable<DecodedChunk> {
    const startTime = performance.now();
    
    try {
      for await (const chunk of chunks) {
        const chunkStartTime = performance.now();
        
        try {
          let decoded: DecodedChunk;
          
          if (!this.encodingModule) {
            throw new EncodingError('Encoding module is required for chunk decoding');
          }
          
          const result = await this.encodingModule.decodeChunk(chunk);
          if (result === undefined || result === null) {
            throw new EncodingError('Encoding module returned invalid result');
          }
          
          decoded = result;
          this.stats.chunksDecoded++;
          
          yield decoded;
          
          const chunkTime = performance.now() - chunkStartTime;
          this.stats.totalProcessingTime += chunkTime;
          
          if (this.logger) {
            await this.logger.debug('Decoded chunk structure', { 
              chunk: chunk.toString().substring(0, 50) + '...',
              type: decoded.type,
              hasEncodingModule: !!this.encodingModule,
              processingTime: chunkTime
            });
          }
        } catch (error) {
          this.stats.errors++;
          if (this.logger) {
            await this.logger.error('Failed to decode chunk structure', {
              error: error instanceof Error ? error.message : 'Unknown error',
              chunk: chunk.toString().substring(0, 50) + '...'
            });
          }
          throw new EncodingError(`Failed to decode chunk structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      this.stats.errors++;
      if (this.logger) {
        await this.logger.error('Chunk decoding stream failed', error);
      }
      throw error;
    } finally {
      const totalTime = performance.now() - startTime;
      if (this.logger) {
        await this.logger.info('Chunk decoding stream completed', {
          chunksDecoded: this.stats.chunksDecoded,
          totalTime,
          averageChunkTime: this.stats.chunksDecoded > 0 ? 
            this.stats.totalProcessingTime / this.stats.chunksDecoded : 0
        });
      }
    }
  }
  
  /**
   * Stream program execution - executes encoded programs
   */
  async *executeStreamingProgram(chunks: AsyncIterable<bigint>): AsyncIterable<string> {
    const startTime = performance.now();
    const programChunks: bigint[] = [];
    
    try {
      // Collect all chunks first (programs need complete chunk set)
      for await (const chunk of chunks) {
        programChunks.push(chunk);
      }
      
      if (!this.encodingModule) {
        throw new EncodingError('Encoding module is required for program execution');
      }
      
      const result = await this.encodingModule.executeProgram(programChunks);
      for (const output of result) {
        yield output;
      }
      this.stats.programsExecuted++;
      
      const totalTime = performance.now() - startTime;
      this.stats.totalProcessingTime += totalTime;
      
      if (this.logger) {
        await this.logger.debug('Executed program', { 
          chunkCount: programChunks.length,
          hasEncodingModule: !!this.encodingModule,
          executionTime: totalTime
        });
      }
    } catch (error) {
      this.stats.errors++;
      if (this.logger) {
        await this.logger.error('Program execution stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Configure the adapter with an encoding module
   */
  configure(encodingModule: EncodingInterface): void {
    this.encodingModule = encodingModule;
    
    if (this.logger) {
      const logPromise = this.logger.info('Encoding stream adapter configured', {
        hasEncodingModule: !!this.encodingModule
      });
      if (logPromise && typeof logPromise.catch === 'function') {
        logPromise.catch(() => {});
      }
    }
  }
  
  /**
   * Get the current encoding module
   */
  getEncodingModule(): EncodingInterface | undefined {
    return this.encodingModule;
  }
  
  /**
   * Set logger for debugging
   */
  setLogger(logger: LoggingInterface): void {
    this.logger = logger;
  }
  
  /**
   * Get adapter statistics
   */
  getStats(): Readonly<EncodingStats> {
    return { ...this.stats };
  }
  
  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      textChunksEncoded: 0,
      textChunksDecoded: 0,
      chunksDecoded: 0,
      programsExecuted: 0,
      errors: 0,
      totalProcessingTime: 0
    };
  }
  

}

/**
 * Create an encoding stream adapter
 */
export function createEncodingStreamAdapter(dependencies: {
  encodingModule?: EncodingInterface;
  logger?: LoggingInterface;
} = {}): EncodingStreamBridge {
  return new EncodingStreamAdapter(dependencies);
}

/**
 * Create an encoding stream adapter with automatic encoding module detection
 */
export async function createAutoEncodingStreamAdapter(dependencies: {
  logger?: LoggingInterface;
  autoLoadModule?: boolean;
  primeRegistry?: any;
  integrityModule?: any;
} = {}): Promise<EncodingStreamBridge> {
  const adapter = new EncodingStreamAdapter(dependencies);
  
  if (dependencies.autoLoadModule && dependencies.primeRegistry && dependencies.integrityModule) {
    // Attempt to dynamically load encoding module
    try {
      const encodingModule = await import('../../encoding');
      if (encodingModule.createAndInitializeEncoding) {
        // Create and initialize the encoding module with provided dependencies
        const encoding = await encodingModule.createAndInitializeEncoding({
          primeRegistry: dependencies.primeRegistry,
          integrityModule: dependencies.integrityModule
        });
        adapter.configure(encoding);
        if (dependencies.logger) {
          await dependencies.logger.info('Auto-configured encoding stream adapter with loaded module');
        }
      }
    } catch (error) {
      if (dependencies.logger) {
        await dependencies.logger.warn('Failed to auto-load encoding module', {
          error: error instanceof Error ? error.message : 'Unknown error',
          note: 'Encoding module initialization failed'
        });
      }
    }
  } else if (dependencies.autoLoadModule) {
    if (dependencies.logger) {
      await dependencies.logger.warn('Cannot auto-load encoding module', {
        reason: 'Missing required dependencies',
        hasPrimeRegistry: !!dependencies.primeRegistry,
        hasIntegrityModule: !!dependencies.integrityModule
      });
    }
  }
  
  if (dependencies.logger) {
    await dependencies.logger.info('Created encoding stream adapter', {
      autoLoadAttempted: dependencies.autoLoadModule ?? false,
      hasEncodingModule: !!adapter.getEncodingModule()
    });
  }
  
  return adapter;
}
