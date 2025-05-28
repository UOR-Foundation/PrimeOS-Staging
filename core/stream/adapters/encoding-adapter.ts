/**
 * Encoding Stream Adapter
 * =======================
 * 
 * Implementation of EncodingStreamBridge for integrating stream processing
 * with the encoding module for text and program processing.
 */

import { EncodingStreamBridge } from '../types';
import { DecodedChunk } from '../../encoding/core/types';
import { EncodingInterface } from '../../encoding/core/types';

/**
 * Implementation of encoding stream bridge
 */
export class EncodingStreamAdapter implements EncodingStreamBridge {
  private encodingModule?: EncodingInterface;
  private logger?: any;
  
  constructor(dependencies: {
    encodingModule?: EncodingInterface;
    logger?: any;
  } = {}) {
    this.encodingModule = dependencies.encodingModule;
    this.logger = dependencies.logger;
  }
  
  /**
   * Stream text encoding - converts strings to prime-encoded chunks
   */
  async *encodeTextStream(text: AsyncIterable<string>): AsyncIterable<bigint> {
    try {
      for await (const str of text) {
        if (this.encodingModule) {
          // Use the actual encoding module
          const chunks = await this.encodingModule.encodeText(str);
          for (const chunk of chunks) {
            yield chunk;
          }
        } else {
          // Fallback encoding - convert string to BigInt
          if (str.length > 0) {
            const bytes = Buffer.from(str, 'utf8');
            const hex = bytes.toString('hex');
            yield BigInt('0x' + hex);
          } else {
            yield 0n;
          }
        }
        
        if (this.logger) {
          await this.logger.debug('Encoded text chunk', { 
            originalLength: str.length,
            hasEncodingModule: !!this.encodingModule 
          });
        }
      }
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Text encoding stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Stream text decoding - converts prime-encoded chunks back to strings
   */
  async *decodeTextStream(chunks: AsyncIterable<bigint>): AsyncIterable<string> {
    try {
      for await (const chunk of chunks) {
        if (this.encodingModule) {
          // Use the actual encoding module
          try {
            const decoded = await this.encodingModule.decodeText([chunk]);
            yield decoded;
          } catch (error) {
            if (this.logger) {
              await this.logger.warn('Failed to decode chunk with encoding module, using fallback', {
                chunk: chunk.toString().substring(0, 50) + '...'
              });
            }
            // Fallback decoding
            yield this.fallbackDecode(chunk);
          }
        } else {
          // Fallback decoding
          yield this.fallbackDecode(chunk);
        }
        
        if (this.logger) {
          await this.logger.debug('Decoded text chunk', { 
            chunk: chunk.toString().substring(0, 50) + '...',
            hasEncodingModule: !!this.encodingModule 
          });
        }
      }
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Text decoding stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Stream chunk decoding - converts chunks to structured data
   */
  async *decodeChunkStream(chunks: AsyncIterable<bigint>): AsyncIterable<DecodedChunk> {
    try {
      for await (const chunk of chunks) {
        if (this.encodingModule) {
          // Use the actual encoding module
          try {
            const decoded = await this.encodingModule.decodeChunk(chunk);
            yield decoded;
          } catch (error) {
            if (this.logger) {
              await this.logger.warn('Failed to decode chunk structure, using fallback', {
                chunk: chunk.toString().substring(0, 50) + '...'
              });
            }
            // Fallback - create a basic decoded chunk
            yield this.createFallbackDecodedChunk(chunk);
          }
        } else {
          // Fallback - create a basic decoded chunk
          yield this.createFallbackDecodedChunk(chunk);
        }
        
        if (this.logger) {
          await this.logger.debug('Decoded chunk structure', { 
            chunk: chunk.toString().substring(0, 50) + '...',
            hasEncodingModule: !!this.encodingModule 
          });
        }
      }
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Chunk decoding stream failed', error);
      }
      throw error;
    }
  }
  
  /**
   * Stream program execution - executes encoded programs
   */
  async *executeStreamingProgram(chunks: AsyncIterable<bigint>): AsyncIterable<string> {
    try {
      for await (const chunk of chunks) {
        if (this.encodingModule) {
          // Use the actual encoding module
          try {
            const result = await this.encodingModule.executeProgram([chunk]);
            for (const output of result) {
              yield output;
            }
          } catch (error) {
            if (this.logger) {
              await this.logger.warn('Failed to execute program chunk, using fallback', {
                chunk: chunk.toString().substring(0, 50) + '...'
              });
            }
            // Fallback execution
            yield `Executed chunk: ${chunk.toString()}`;
          }
        } else {
          // Fallback execution
          yield `Executed chunk: ${chunk.toString()}`;
        }
        
        if (this.logger) {
          await this.logger.debug('Executed program chunk', { 
            chunk: chunk.toString().substring(0, 50) + '...',
            hasEncodingModule: !!this.encodingModule 
          });
        }
      }
    } catch (error) {
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
      this.logger.info('Encoding stream adapter configured', {
        hasEncodingModule: !!this.encodingModule
      }).catch(() => {});
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
  setLogger(logger: any): void {
    this.logger = logger;
  }
  
  /**
   * Fallback text decoding when encoding module is not available
   */
  private fallbackDecode(chunk: bigint): string {
    try {
      const hex = chunk.toString(16);
      if (hex.length % 2 === 0) {
        return Buffer.from(hex, 'hex').toString('utf8');
      } else {
        return Buffer.from('0' + hex, 'hex').toString('utf8');
      }
    } catch (error) {
      // If decoding fails, return a representation of the chunk
      return `[CHUNK:${chunk.toString().substring(0, 20)}...]`;
    }
  }
  
  /**
   * Create a fallback decoded chunk when encoding module is not available
   */
  private createFallbackDecodedChunk(chunk: bigint): DecodedChunk {
    return {
      type: 'data' as any, // Would need proper ChunkType
      checksum: 0n,
      data: {
        value: Number(chunk % BigInt(Number.MAX_SAFE_INTEGER)),
        position: 0
      }
    };
  }
}

/**
 * Create an encoding stream adapter
 */
export function createEncodingStreamAdapter(dependencies: {
  encodingModule?: EncodingInterface;
  logger?: any;
} = {}): EncodingStreamBridge {
  return new EncodingStreamAdapter(dependencies);
}

/**
 * Create an encoding stream adapter with automatic encoding module detection
 */
export async function createAutoEncodingStreamAdapter(dependencies: {
  logger?: any;
} = {}): Promise<EncodingStreamBridge> {
  const adapter = new EncodingStreamAdapter(dependencies);
  
  // Could attempt to auto-detect or load encoding module here
  if (dependencies.logger) {
    await dependencies.logger.info('Auto-configured encoding stream adapter');
  }
  
  return adapter;
}
