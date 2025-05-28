/**
 * Encoding Module Implementation
 * =============================
 * 
 * This module implements Axiom 3: Unified execution model where data and operations 
 * share a common representation using prime-based chunk encoding.
 * 
 * Production implementation requiring proper core module integration.
 * No fallbacks or simplifications - strict UOR compliance.
 */

import {
  BaseModel,
  ModelResult,
  ModelLifecycleState
} from '../../os/model';

import {
  EncodingOptions,
  EncodingInterface,
  EncodingState,
  ChunkType,
  ChunkExponent,
  StandardOpcodes,
  EncodedChunk,
  DecodedChunk,
  ChunkData,
  ChunkMetadata,
  ProgramOperation,
  NTTOptions,
  EncodingProcessInput,
  VMExecutionResult,
  NTTResult,
  EncodingError,
  ChunkValidationError,
  VMExecutionError,
  NTTError
} from './core';

import {
  generateChunkId,
  reconstructFromFactors,
  determineChunkType,
  getFactorsByExponent,
  validateChunkStructure,
  calculateChunkSize,
  extractCoreFactors,
  createTimestamp,
  validatePositiveInteger,
  validatePositiveBigInt
} from './utils';

import { EnhancedChunkVM } from './vm/vm-enhanced';
import { SimpleNTT } from './ntt';
import { PrimeRegistryAdapter, createPrimeAdapter, IntegrityAdapter, createIntegrityAdapter } from './adapters';

// Import precision module functions for enhanced mathematical operations
import { 
  mod as precisionMod, 
  modPow as precisionModPow, 
  integerSqrt as precisionIntegerSqrt,
} from '../precision';

/**
 * Default options for encoding module
 */
const DEFAULT_OPTIONS = {
  enableNTT: true,
  nttModulus: 13n,
  nttPrimitiveRoot: 2n,
  chunkIdLength: 8,
  enableSpectralTransforms: true
};

/**
 * Production implementation of the encoding system
 * Requires core/prime and core/integrity modules - no fallbacks
 */
export class EncodingImplementation extends BaseModel implements EncodingInterface {
  private config: {
    primeRegistry: any;
    integrityModule: any;
    enableNTT: boolean;
    nttModulus: bigint;
    nttPrimitiveRoot: bigint;
    chunkIdLength: number;
    enableSpectralTransforms: boolean;
  };
  private primeAdapter: PrimeRegistryAdapter;
  private integrityAdapter: IntegrityAdapter;
  private vm: EnhancedChunkVM;
  private ntt: SimpleNTT;
  private stats = {
    chunksEncoded: 0,
    chunksDecoded: 0,
    programsExecuted: 0,
    nttOperations: 0,
    integrityFailures: 0
  };
  
  constructor(options: EncodingOptions = {}) {
    super({
      debug: false,
      name: 'encoding',
      version: '1.0.0',
      ...options
    });
    
    // Require core modules - no fallbacks
    if (!options.primeRegistry) {
      throw new EncodingError('Prime registry is required for production encoding module');
    }
    if (!options.integrityModule) {
      throw new EncodingError('Integrity module is required for production encoding module');
    }
    
    this.config = {
      primeRegistry: options.primeRegistry,
      integrityModule: options.integrityModule,
      enableNTT: options.enableNTT ?? DEFAULT_OPTIONS.enableNTT,
      nttModulus: options.nttModulus ?? DEFAULT_OPTIONS.nttModulus,
      nttPrimitiveRoot: options.nttPrimitiveRoot ?? DEFAULT_OPTIONS.nttPrimitiveRoot,
      chunkIdLength: options.chunkIdLength ?? DEFAULT_OPTIONS.chunkIdLength,
      enableSpectralTransforms: options.enableSpectralTransforms ?? DEFAULT_OPTIONS.enableSpectralTransforms
    };
    
    // Initialize adapters for core modules
    this.primeAdapter = createPrimeAdapter(this.config.primeRegistry);
    this.integrityAdapter = createIntegrityAdapter(this.config.integrityModule);
    
    this.vm = new EnhancedChunkVM();
    this.ntt = new SimpleNTT(this.config.nttModulus, this.config.nttPrimitiveRoot);
  }
  
  protected async onInitialize(): Promise<void> {
    // Initialize core modules - fail if they don't work
    await this.primeAdapter.ensureInitialized();
    await this.integrityAdapter.ensureInitialized();
    
    await this.logger.info('Production encoding module initialized with core dependencies');
    
    this.state.custom = {
      config: {
        enableNTT: this.config.enableNTT,
        nttModulus: this.config.nttModulus,
        nttPrimitiveRoot: this.config.nttPrimitiveRoot,
        chunkIdLength: this.config.chunkIdLength
      },
      statistics: { ...this.stats },
      vm: this.vm.getState()
    };
    
    await this.logger.debug('Encoding module initialized', {
      enableNTT: this.config.enableNTT,
      chunkIdLength: this.config.chunkIdLength
    });
  }
  
  protected async onProcess<T = EncodingProcessInput, R = unknown>(input: T): Promise<R> {
    if (!input || typeof input !== 'object') {
      throw new EncodingError('Invalid input: expected EncodingProcessInput object');
    }
    
    const request = input as unknown as EncodingProcessInput;
    
    await this.logger.debug('Processing encoding operation', { operation: request.operation });
    
    switch (request.operation) {
      case 'encodeText':
        if (!request.data) throw new EncodingError('Missing data for text encoding');
        return await this.encodeText(request.data as string) as unknown as R;
        
      case 'encodeProgram':
        if (!request.program) throw new EncodingError('Missing program for encoding');
        return await this.encodeProgram(request.program) as unknown as R;
        
      case 'encodeBlock':
        if (!request.chunks) throw new EncodingError('Missing chunks for block encoding');
        return await this.encodeBlock(request.chunks) as unknown as R;
        
      case 'encodeData':
        if (request.position === undefined || request.value === undefined) {
          throw new EncodingError('Missing position or value for data encoding');
        }
        return await this.encodeData(request.position, request.value) as unknown as R;
        
      case 'encodeOperation':
        if (!request.opcode) throw new EncodingError('Missing opcode for operation encoding');
        return await this.encodeOperation(request.opcode, request.operand) as unknown as R;
        
      case 'decodeChunk':
        if (!request.chunk) throw new EncodingError('Missing chunk for decoding');
        return await this.decodeChunk(request.chunk) as unknown as R;
        
      case 'executeProgram':
        if (!request.chunks) throw new EncodingError('Missing chunks for program execution');
        return await this.executeProgram(request.chunks) as unknown as R;
        
      case 'applyNTT':
        if (!request.data) throw new EncodingError('Missing data for NTT');
        return await this.applyNTT(request.data as number[]) as unknown as R;
        
      case 'verifyIntegrity':
        if (!request.chunk) throw new EncodingError('Missing chunk for integrity verification');
        return await this.verifyChunkIntegrity(request.chunk) as unknown as R;
        
      default:
        throw new EncodingError(`Unknown operation: ${(request as any).operation}`);
    }
  }
  
  protected async onReset(): Promise<void> {
    this.stats = {
      chunksEncoded: 0,
      chunksDecoded: 0,
      programsExecuted: 0,
      nttOperations: 0,
      integrityFailures: 0
    };
    
    this.vm.reset();
    
    this.state.custom = {
      config: {
        enableNTT: this.config.enableNTT,
        nttModulus: this.config.nttModulus,
        nttPrimitiveRoot: this.config.nttPrimitiveRoot,
        chunkIdLength: this.config.chunkIdLength
      },
      statistics: { ...this.stats },
      vm: this.vm.getState()
    };
    
    await this.logger.debug('Encoding module reset');
  }
  
  protected async onTerminate(): Promise<void> {
    this.vm.reset();
    
    // Terminate adapters
    await this.primeAdapter.terminate();
    await this.integrityAdapter.terminate();
    
    await this.logger.debug('Encoding module terminated');
  }
  
  // Core encoding methods
  async encodeText(text: string): Promise<bigint[]> {
    validatePositiveInteger(text.length, 'Text length');
    
    this.stats.chunksEncoded += text.length;
    
    const chunks: bigint[] = [];
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const chunk = await this.encodeData(i, charCode);
      chunks.push(chunk);
    }
    
    await this.logger.debug('Encoded text', { 
      length: text.length, 
      chunks: chunks.length 
    });
    
    return chunks;
  }
  
  async encodeProgram(operations: ProgramOperation[]): Promise<bigint[]> {
    if (!Array.isArray(operations)) {
      throw new EncodingError('Operations must be an array');
    }
    
    this.stats.chunksEncoded += operations.length;
    
    const chunks: bigint[] = [];
    
    for (const operation of operations) {
      const chunk = await this.encodeOperation(operation.opcode, operation.operand);
      chunks.push(chunk);
    }
    
    await this.logger.debug('Encoded program', { 
      operations: operations.length, 
      chunks: chunks.length 
    });
    
    return chunks;
  }
  
  async encodeBlock(chunks: bigint[]): Promise<bigint[]> {
    if (!Array.isArray(chunks)) {
      throw new EncodingError('Chunks must be an array');
    }
    
    // Create block header
    const headerChunk = this.createBlockHeader(chunks.length);
    
    return [headerChunk, ...chunks];
  }

  async encodeNTTBlock(chunks: bigint[]): Promise<bigint[]> {
    if (!this.config.enableNTT) {
      throw new NTTError('NTT', 'NTT operations are disabled');
    }
    
    if (!Array.isArray(chunks)) {
      throw new EncodingError('Chunks must be an array');
    }
    
    // Create NTT header
    const nttHeaderChunk = this.createNTTHeader(chunks.length);
    
    return [nttHeaderChunk, ...chunks];
  }
  
  async encodeData(position: number, value: number): Promise<bigint> {
    validatePositiveInteger(position, 'Position');
    validatePositiveInteger(value, 'Value');
    
    this.stats.chunksEncoded++;
    
    // Production encoding with strict UOR patterns using precision module
    const factors = [
      { prime: 2n, exponent: ChunkExponent.DATA_POSITION + (position % 8) },
      { prime: 3n, exponent: ChunkExponent.DATA_VALUE + (value % 128) },
      { prime: 5n, exponent: Math.floor(position / 8) + 1 },
      { prime: 7n, exponent: Math.floor(value / 128) + 1 }
    ];
    
    // Generate integrity checksum (required in production)
    const checksum = await this.integrityAdapter.generateChecksum(factors, this.primeAdapter);
    factors.push({ prime: checksum, exponent: ChunkExponent.CHECKSUM });
    
    const chunk = reconstructFromFactors(factors);
    
    await this.logger.debug('Encoded data chunk', { 
      position, 
      value, 
      chunk: chunk.toString() 
    });
    
    return chunk;
  }
  
  async encodeOperation(opcode: StandardOpcodes, operand?: number): Promise<bigint> {
    this.stats.chunksEncoded++;
    
    const factors = [
      { prime: BigInt(opcode), exponent: ChunkExponent.OPERATION }
    ];
    
    if (operand !== undefined) {
      validatePositiveInteger(operand, 'Operand');
      factors.push({ prime: 5n, exponent: ChunkExponent.OPERAND + operand });
    }
    
    // Generate integrity checksum (required in production)
    const checksum = await this.integrityAdapter.generateChecksum(factors, this.primeAdapter);
    factors.push({ prime: checksum, exponent: ChunkExponent.CHECKSUM });
    
    const chunk = reconstructFromFactors(factors);
    
    await this.logger.debug('Encoded operation chunk', { 
      opcode, 
      operand, 
      chunk: chunk.toString() 
    });
    
    return chunk;
  }
  
  // Core decoding methods
  async decodeChunk(chunk: bigint): Promise<DecodedChunk> {
    validatePositiveBigInt(chunk, 'Chunk');
    
    this.stats.chunksDecoded++;
    
    try {
      // Use production prime factorization
      const factors = await this.primeAdapter.factor(chunk);
      
      // Strict validation - no invalid chunks allowed
      if (!validateChunkStructure(factors)) {
        throw new ChunkValidationError(chunk, 'Invalid chunk structure');
      }
      
      // Determine chunk type
      const type = determineChunkType(factors);
      
      // Extract checksum
      const checksumFactors = getFactorsByExponent(factors, ChunkExponent.CHECKSUM);
      const checksum = checksumFactors.length > 0 ? checksumFactors[0].prime : 0n;
      
      // Extract core data based on type
      const data = await this.extractChunkData(type, factors);
      
      const decoded: DecodedChunk = {
        type,
        checksum,
        data
      };
      
      await this.logger.debug('Decoded chunk', { 
        type, 
        checksum: checksum.toString(),
        chunk: chunk.toString()
      });
      
      return decoded;
      
    } catch (error) {
      await this.logger.error('Chunk decoding failed', error);
      throw new ChunkValidationError(chunk, error instanceof Error ? error.message : 'Unknown decoding error');
    }
  }
  
  async decodeText(chunks: bigint[]): Promise<string> {
    if (!Array.isArray(chunks)) {
      throw new EncodingError('Chunks must be an array');
    }
    
    // Collect all valid data chunks with their positions
    const dataChunks: Array<{ position: number; value: number }> = [];
    
    for (const chunk of chunks) {
      const decoded = await this.decodeChunk(chunk);
      
      if (decoded.type === ChunkType.DATA && 
          decoded.data.position !== undefined && 
          decoded.data.value !== undefined) {
        dataChunks.push({
          position: decoded.data.position,
          value: decoded.data.value
        });
      }
    }
    
    // Sort by position to ensure correct order
    dataChunks.sort((a, b) => a.position - b.position);
    
    // Convert to string
    let text = '';
    for (const { value } of dataChunks) {
      text += String.fromCharCode(value);
    }
    
    await this.logger.debug('Decoded text', { 
      chunks: chunks.length, 
      validDataChunks: dataChunks.length,
      length: text.length 
    });
    
    return text;
  }
  
  // VM execution
  async executeProgram(chunks: bigint[]): Promise<string[]> {
    if (!Array.isArray(chunks)) {
      throw new EncodingError('Chunks must be an array');
    }
    
    this.stats.programsExecuted++;
    
    const decodedChunks: DecodedChunk[] = [];
    
    for (const chunk of chunks) {
      const decoded = await this.decodeChunk(chunk);
      decodedChunks.push(decoded);
    }
    
    const output = this.vm.execute(decodedChunks);
    const vmState = this.vm.getState();
    
    this.state.custom = {
      ...this.state.custom,
      vm: vmState
    };
    
    await this.logger.debug('Executed program', { 
      chunks: chunks.length, 
      validChunks: decodedChunks.length,
      outputLength: output.length,
      operations: vmState.operations
    });
    
    return output;
  }
  
  // NTT spectral operations
  async applyNTT(data: number[]): Promise<number[]> {
    if (!this.config.enableNTT) {
      throw new NTTError('NTT', 'NTT operations are disabled');
    }
    
    if (!Array.isArray(data)) {
      throw new NTTError('NTT', 'Input must be an array of numbers');
    }
    
    this.stats.nttOperations++;
    
    const result = this.ntt.forward(data);
    
    await this.logger.debug('Applied NTT', { 
      inputLength: data.length, 
      outputLength: result.length 
    });
    
    return result;
  }
  
  async applyInverseNTT(data: number[]): Promise<number[]> {
    if (!this.config.enableNTT) {
      throw new NTTError('NTT', 'NTT operations are disabled');
    }
    
    if (!Array.isArray(data)) {
      throw new NTTError('NTT', 'Input must be an array of numbers');
    }
    
    this.stats.nttOperations++;
    
    const result = this.ntt.inverse(data);
    
    await this.logger.debug('Applied inverse NTT', { 
      inputLength: data.length, 
      outputLength: result.length 
    });
    
    return result;
  }
  
  async verifyNTTRoundTrip(data: number[]): Promise<boolean> {
    if (!this.config.enableNTT) {
      return false;
    }
    
    if (!Array.isArray(data)) {
      return false;
    }
    
    try {
      const verified = this.ntt.verify(data);
      
      await this.logger.debug('Verified NTT round-trip', { 
        inputLength: data.length, 
        verified 
      });
      
      return verified;
    } catch (error) {
      await this.logger.error('NTT verification failed', error);
      return false;
    }
  }
  
  // Integrity operations
  async verifyChunkIntegrity(chunk: bigint): Promise<boolean> {
    try {
      const decoded = await this.decodeChunk(chunk);
      
      if (decoded.checksum > 0n) {
        // Use production integrity verification
        const verification = await this.integrityAdapter.verifyIntegrity(chunk, this.primeAdapter);
        return verification.valid;
      }
      
      // Chunks without checksums are considered invalid in production
      return false;
      
    } catch (error) {
      this.stats.integrityFailures++;
      await this.logger.warn('Chunk integrity verification failed', { 
        chunk: chunk.toString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
  
  // Utility methods
  async getChunkMetadata(chunk: bigint): Promise<ChunkMetadata> {
    const verified = await this.verifyChunkIntegrity(chunk);
    
    return {
      size: calculateChunkSize(chunk),
      timestamp: createTimestamp(),
      verified
    };
  }
  
  generateChunkId(): string {
    return generateChunkId();
  }
  
  getLogger() {
    return this.logger;
  }
  
  getState(): EncodingState {
    const baseState = super.getState();
    
    return {
      ...baseState,
      config: {
        enableNTT: this.config.enableNTT,
        nttModulus: this.config.nttModulus,
        nttPrimitiveRoot: this.config.nttPrimitiveRoot,
        chunkIdLength: this.config.chunkIdLength
      },
      statistics: { ...this.stats },
      vm: this.vm.getState()
    } as EncodingState;
  }
  
  // Private helper methods
  private createBlockHeader(blockLength: number): bigint {
    const factors = [
      { prime: 7n, exponent: ChunkExponent.BLOCK_HEADER },
      { prime: 11n, exponent: blockLength }
    ];
    
    return reconstructFromFactors(factors);
  }

  private createNTTHeader(blockLength: number): bigint {
    const factors = [
      { prime: 11n, exponent: ChunkExponent.BLOCK_HEADER }, // Use NTT_TAG
      { prime: 13n, exponent: blockLength }
    ];
    
    return reconstructFromFactors(factors);
  }
  
  private async extractChunkData(type: ChunkType, factors: Array<{prime: bigint; exponent: number}>): Promise<ChunkData> {
    const data: ChunkData = {};
    
    switch (type) {
      case ChunkType.DATA:
        // Reconstruct position and value from the compact encoding
        let positionLow = 0;
        let valueLow = 0;
        let positionHigh = 0;
        let valueHigh = 0;
        
        for (const factor of factors) {
          if (factor.prime === 2n && factor.exponent >= ChunkExponent.DATA_POSITION) {
            positionLow = factor.exponent - ChunkExponent.DATA_POSITION;
          }
          if (factor.prime === 3n && factor.exponent >= ChunkExponent.DATA_VALUE) {
            valueLow = factor.exponent - ChunkExponent.DATA_VALUE;
          }
          if (factor.prime === 5n && factor.exponent >= 1) {
            positionHigh = factor.exponent - 1;
          }
          if (factor.prime === 7n && factor.exponent >= 1) {
            valueHigh = factor.exponent - 1;
          }
        }
        
        // Reconstruct original values
        data.position = positionHigh * 8 + positionLow;
        data.value = valueHigh * 128 + valueLow;
        break;
        
      case ChunkType.OPERATION:
        // Look for operation factors
        for (const factor of factors) {
          if (factor.exponent === ChunkExponent.OPERATION) {
            data.opcode = Number(factor.prime) as StandardOpcodes;
          }
          if (factor.prime === 5n && factor.exponent >= ChunkExponent.OPERAND) {
            data.operand = factor.exponent - ChunkExponent.OPERAND;
          }
        }
        break;
        
      case ChunkType.BLOCK_HEADER:
        // Look for block header factors
        for (const factor of factors) {
          if (factor.prime === 7n && factor.exponent >= ChunkExponent.BLOCK_HEADER) {
            data.blockType = StandardOpcodes.BLOCK_TAG;
            data.blockLength = factor.exponent - ChunkExponent.BLOCK_HEADER;
          }
          if (factor.prime === 11n && factor.exponent >= ChunkExponent.BLOCK_HEADER) {
            data.blockType = StandardOpcodes.NTT_TAG;
            data.blockLength = factor.exponent - ChunkExponent.BLOCK_HEADER;
          }
        }
        break;
        
      default:
        // Unknown chunk types are not allowed in production
        throw new ChunkValidationError(0n, `Unknown chunk type: ${type}`);
    }
    
    return data;
  }
  
  /**
   * Enhanced modular arithmetic using precision module
   */
  private mod(a: bigint, m: bigint): bigint {
    return precisionMod(a, m);
  }
  
  /**
   * Enhanced modular exponentiation using precision module
   */
  private modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    return precisionModPow(base, exponent, modulus);
  }
  
  /**
   * Enhanced integer square root using precision module
   */
  private integerSqrt(n: bigint): bigint {
    const result = precisionIntegerSqrt(n);
    return typeof result === 'bigint' ? result : BigInt(result);
  }
}

/**
 * Create an encoding instance with the specified options
 * Requires primeRegistry and integrityModule in production
 */
export function createEncoding(options: EncodingOptions = {}): EncodingInterface {
  return new EncodingImplementation(options);
}

/**
 * Create and initialize an encoding instance in a single step
 * Requires primeRegistry and integrityModule in production
 */
export async function createAndInitializeEncoding(
  options: EncodingOptions = {}
): Promise<EncodingInterface> {
  const instance = new EncodingImplementation(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize encoding: ${result.error}`);
  }
  
  return instance;
}

// Export types and utilities
export * from './core';
export * from './utils';
export * from './vm';
export * from './ntt';
export * from './adapters';
