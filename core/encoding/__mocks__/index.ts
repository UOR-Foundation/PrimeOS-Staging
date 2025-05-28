/**
 * Encoding Module Mocks
 * =====================
 * 
 * Mock implementations for the encoding module, providing simplified but consistent
 * behavior for testing purposes. These mocks follow the same interface as the
 * real encoding module but use predictable, lightweight implementations.
 */

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
} from '../core/types';

import { Factor } from '../../prime/types';

import {
  ModelLifecycleState,
  ModelResult,
  ModelOptions,
  ModelState
} from '../../../os/model/types';

/**
 * Mock BaseModel for testing
 */
class MockBaseModel {
  protected options: ModelOptions;
  protected state: ModelState;
  protected logger: any;

  constructor(options: ModelOptions) {
    this.options = options;
    this.state = {
      lifecycle: ModelLifecycleState.Uninitialized,
      lastStateChangeTime: Date.now(),
      uptime: 0,
      operationCount: {
        total: 0,
        success: 0,
        failed: 0
      },
      custom: {}
    };
    
    this.logger = {
      info: jest.fn().mockResolvedValue(undefined),
      debug: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined),
      warn: jest.fn().mockResolvedValue(undefined)
    };
  }

  createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T> {
    return {
      success,
      data,
      error,
      timestamp: Date.now(),
      source: this.options.name || 'mock-model'
    };
  }

  async initialize(): Promise<ModelResult> {
    this.state.lifecycle = ModelLifecycleState.Ready;
    await this.onInitialize();
    return this.createResult(true);
  }

  async process<T, R>(input: T): Promise<ModelResult<R>> {
    this.state.operationCount.total++;
    try {
      const result = await this.onProcess(input);
      this.state.operationCount.success++;
      return this.createResult<R>(true, result as R);
    } catch (error) {
      this.state.operationCount.failed++;
      return this.createResult<R>(false, undefined, error instanceof Error ? error.message : String(error));
    }
  }

  async reset(): Promise<ModelResult> {
    await this.onReset();
    this.state.operationCount = { total: 0, success: 0, failed: 0 };
    return this.createResult(true);
  }

  async terminate(): Promise<ModelResult> {
    this.state.lifecycle = ModelLifecycleState.Terminated;
    await this.onTerminate();
    return this.createResult(true);
  }

  getState(): ModelState {
    return { ...this.state };
  }

  protected async onInitialize(): Promise<void> {}
  protected async onProcess<T, R>(input: T): Promise<R | undefined> { 
    return input as unknown as R | undefined; 
  }
  protected async onReset(): Promise<void> {}
  protected async onTerminate(): Promise<void> {}
}

/**
 * Mock ChunkVM for testing
 */
class MockChunkVM {
  private stack: number[] = [];
  private output: string[] = [];
  private operations = 0;
  
  reset(): void {
    this.stack = [];
    this.output = [];
    this.operations = 0;
  }
  
  execute(chunks: DecodedChunk[]): string[] {
    this.reset();
    
    for (const chunk of chunks) {
      this.operations++;
      
      try {
        switch (chunk.type) {
          case ChunkType.OPERATION:
            this.executeOperation(chunk.data);
            break;
            
          case ChunkType.DATA:
            this.executeData(chunk.data);
            break;
            
          case ChunkType.BLOCK_HEADER:
            // Block headers are metadata, skip execution
            break;
            
          default:
            // Unknown chunk types are skipped
            break;
        }
      } catch (error) {
        if (error instanceof VMExecutionError) {
          throw error;
        }
        throw new VMExecutionError(
          chunk.type,
          error instanceof Error ? error.message : 'Unknown execution error'
        );
      }
    }
    
    return [...this.output];
  }
  
  private executeOperation(data: ChunkData): void {
    if (!data.opcode) {
      throw new VMExecutionError('UNKNOWN', 'Missing opcode in operation chunk');
    }
    
    switch (data.opcode) {
      case StandardOpcodes.OP_PUSH:
        if (data.operand === undefined) {
          throw new VMExecutionError('PUSH', 'Missing operand for PUSH operation');
        }
        this.stack.push(data.operand);
        break;
        
      case StandardOpcodes.OP_ADD:
        if (this.stack.length < 2) {
          throw new VMExecutionError('ADD', 'Stack underflow: ADD requires 2 operands');
        }
        const b = this.stack.pop()!;
        const a = this.stack.pop()!;
        this.stack.push(a + b);
        break;
        
      case StandardOpcodes.OP_PRINT:
        if (this.stack.length < 1) {
          throw new VMExecutionError('PRINT', 'Stack underflow: PRINT requires 1 operand');
        }
        this.output.push(this.stack.pop()!.toString());
        break;
        
      default:
        throw new VMExecutionError('UNKNOWN', `Unknown opcode: ${data.opcode}`);
    }
  }
  
  private executeData(data: ChunkData): void {
    if (data.value !== undefined) {
      this.output.push(String.fromCharCode(data.value));
    }
  }
  
  getState() {
    return {
      stackSize: this.stack.length,
      outputLength: this.output.length,
      operations: this.operations,
      programCounter: 0,
      memorySize: this.stack.length,
      halted: false,
      executionTime: 0,
      instructionsExecuted: this.operations
    };
  }
}

/**
 * Mock SimpleNTT for testing
 */
class MockSimpleNTT {
  constructor(private modulus: bigint, private primitiveRoot: bigint) {}
  
  forward(data: number[]): number[] {
    // Mock NTT: simple array reversal for predictable testing
    return [...data].reverse();
  }
  
  inverse(data: number[]): number[] {
    // Mock inverse NTT: reverse again to get back original
    return [...data].reverse();
  }
  
  verify(original: number[]): boolean {
    try {
      const forward = this.forward(original);
      const inverse = this.inverse(forward);
      return original.every((val: number, i: number) => val === inverse[i]);
    } catch {
      return false;
    }
  }
}

/**
 * Mock prime registry for encoding tests
 */
class MockPrimeRegistry {
  private primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n];
  
  getPrime(index: number): bigint {
    if (index < 0) throw new Error('Index must be non-negative');
    if (index < this.primes.length) return this.primes[index];
    return BigInt(index * 2 + 1); // Simple approximation
  }
  
  getIndex(prime: bigint): number {
    const index = this.primes.findIndex(p => p === prime);
    return index >= 0 ? index : Number((prime - 1n) / 2n);
  }
  
  factor(n: bigint): Array<{prime: bigint; exponent: number}> {
    if (n <= 0n) throw new Error('Cannot factor non-positive numbers');
    if (n === 1n) return [];
    
    const factors: Array<{prime: bigint; exponent: number}> = [];
    let remaining = n;
    
    for (const prime of this.primes) {
      let exponent = 0;
      while (remaining % prime === 0n) {
        exponent++;
        remaining = remaining / prime;
      }
      if (exponent > 0) {
        factors.push({ prime, exponent });
      }
      if (remaining === 1n) break;
      if (prime * prime > remaining) {
        if (remaining > 1n) {
          factors.push({ prime: remaining, exponent: 1 });
        }
        break;
      }
    }
    
    return factors;
  }
}

/**
 * Mock integrity module for encoding tests
 */
class MockIntegrityModule {
  async generateChecksum(factors: Factor[]): Promise<bigint> {
    // Simple mock: return a predictable checksum
    let sum = 0;
    for (const factor of factors) {
      sum += Number(factor.prime % 100n) * factor.exponent;
    }
    return BigInt(sum % 1000 + 100); // Ensure it's a reasonable size
  }
  
  async verifyIntegrity(value: bigint) {
    return {
      valid: value >= 100000n, // Simple validation for our new ranges
      checksum: BigInt(100)
    };
  }
}

/**
 * Default options for encoding module mock
 */
const DEFAULT_OPTIONS = {
  primeRegistry: undefined as any,
  integrityModule: undefined as any,
  enableNTT: true,
  nttModulus: 13n,
  nttPrimitiveRoot: 2n,
  chunkIdLength: 8,
  enableSpectralTransforms: true
};

/**
 * Mock implementation of the encoding system
 */
export class MockEncodingImplementation extends MockBaseModel implements EncodingInterface {
  private config: {
    primeRegistry?: any;
    integrityModule?: any;
    enableNTT: boolean;
    nttModulus: bigint;
    nttPrimitiveRoot: bigint;
    chunkIdLength: number;
    enableSpectralTransforms: boolean;
  };
  private mockRegistry: MockPrimeRegistry;
  private mockIntegrity: MockIntegrityModule;
  private vm: MockChunkVM;
  private ntt: MockSimpleNTT;
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
      name: 'mock-encoding',
      version: '1.0.0',
      ...options
    });
    
    this.config = {
      primeRegistry: options.primeRegistry ?? DEFAULT_OPTIONS.primeRegistry,
      integrityModule: options.integrityModule ?? DEFAULT_OPTIONS.integrityModule,
      enableNTT: options.enableNTT ?? DEFAULT_OPTIONS.enableNTT,
      nttModulus: options.nttModulus ?? DEFAULT_OPTIONS.nttModulus,
      nttPrimitiveRoot: options.nttPrimitiveRoot ?? DEFAULT_OPTIONS.nttPrimitiveRoot,
      chunkIdLength: options.chunkIdLength ?? DEFAULT_OPTIONS.chunkIdLength,
      enableSpectralTransforms: options.enableSpectralTransforms ?? DEFAULT_OPTIONS.enableSpectralTransforms
    };
    
    this.mockRegistry = new MockPrimeRegistry();
    this.mockIntegrity = new MockIntegrityModule();
    this.vm = new MockChunkVM();
    this.ntt = new MockSimpleNTT(this.config.nttModulus, this.config.nttPrimitiveRoot);
  }
  
  protected async onInitialize(): Promise<void> {
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
  }
  
  protected async onProcess<T = EncodingProcessInput, R = unknown>(input: T): Promise<R | undefined> {
    if (!input || typeof input !== 'object') {
      throw new EncodingError('Invalid input: expected EncodingProcessInput object');
    }
    
    const request = input as unknown as EncodingProcessInput;
    
    switch (request.operation) {
      case 'encodeText':
        if (!request.data) throw new EncodingError('Missing data for text encoding');
        return await this.encodeText(request.data as string) as unknown as R;
        
      case 'encodeProgram':
        if (!request.program) throw new EncodingError('Missing program for encoding');
        return await this.encodeProgram(request.program) as unknown as R;
        
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
  }
  
  protected async onTerminate(): Promise<void> {
    this.vm.reset();
  }
  
  // FIXED: Core encoding methods with NON-OVERLAPPING ranges
  async encodeText(text: string): Promise<bigint[]> {
    if (typeof text !== 'string') {
      throw new EncodingError('Text must be a string');
    }
    
    this.stats.chunksEncoded += text.length;
    
    // FIXED: Use non-overlapping ranges
    const chunks: bigint[] = [];
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      // Data range: 100000-199999 
      const chunk = BigInt(100000 + i * 1000 + charCode);
      chunks.push(chunk);
    }
    
    return chunks;
  }
  
  async encodeProgram(operations: ProgramOperation[]): Promise<bigint[]> {
    if (!Array.isArray(operations)) {
      throw new EncodingError('Operations must be an array');
    }
    
    this.stats.chunksEncoded += operations.length;
    
    // FIXED: Use non-overlapping ranges
    const chunks: bigint[] = [];
    for (const operation of operations) {
      // Operations range: 200000-299999
      const chunk = BigInt(200000 + operation.opcode * 1000 + (operation.operand || 0));
      chunks.push(chunk);
    }
    
    return chunks;
  }
  
  async encodeBlock(chunks: bigint[]): Promise<bigint[]> {
    if (!Array.isArray(chunks)) {
      throw new EncodingError('Chunks must be an array');
    }
    
    // Create mock block header - blocks range: 700000-799999
    const headerChunk = BigInt(700000 + chunks.length);
    
    return [headerChunk, ...chunks];
  }
  
  async encodeData(position: number, value: number): Promise<bigint> {
    if (typeof position !== 'number' || position < 0) {
      throw new EncodingError('Position must be a non-negative number');
    }
    if (typeof value !== 'number' || value < 0) {
      throw new EncodingError('Value must be a non-negative number');
    }
    
    this.stats.chunksEncoded++;
    
    // FIXED: Use consistent pattern with non-overlapping ranges
    return BigInt(100000 + position * 1000 + value);
  }
  
  async encodeOperation(opcode: StandardOpcodes, operand?: number): Promise<bigint> {
    this.stats.chunksEncoded++;
    
    // FIXED: Use consistent pattern with non-overlapping ranges
    return BigInt(200000 + opcode * 1000 + (operand || 0));
  }
  
  // FIXED: Core decoding methods with NON-OVERLAPPING logic
  async decodeChunk(chunk: bigint): Promise<DecodedChunk> {
    if (typeof chunk !== 'bigint' || chunk <= 0n) {
      throw new ChunkValidationError(chunk, 'Invalid chunk value');
    }
    
    this.stats.chunksDecoded++;
    
    const chunkNum = Number(chunk);
    
    if (chunkNum >= 700000 && chunkNum < 800000) {
      // Block header range: 700000-799999
      return {
        type: ChunkType.BLOCK_HEADER,
        checksum: 0n,
        data: {
          blockType: StandardOpcodes.BLOCK_TAG,
          blockLength: chunkNum - 700000
        }
      };
    } else if (chunkNum >= 200000 && chunkNum < 300000) {
      // Operation chunk range: 200000-299999
      const opcode = Math.floor((chunkNum - 200000) / 1000);
      const operand = (chunkNum - 200000) % 1000;
      return {
        type: ChunkType.OPERATION,
        checksum: 0n,
        data: {
          opcode: opcode as StandardOpcodes,
          operand: operand > 0 ? operand : undefined
        }
      };
    } else if (chunkNum >= 100000 && chunkNum < 200000) {
      // Data chunk range: 100000-199999
      const position = Math.floor((chunkNum - 100000) / 1000);
      const value = (chunkNum - 100000) % 1000;
      return {
        type: ChunkType.DATA,
        checksum: 0n,
        data: {
          position,
          value
        }
      };
    } else {
      throw new ChunkValidationError(chunk, 'Chunk does not match any known pattern');
    }
  }
  
  // FIXED: Text decoding to handle all characters properly
  async decodeText(chunks: bigint[]): Promise<string> {
    if (!Array.isArray(chunks)) {
      throw new EncodingError('Chunks must be an array');
    }
    
    const chars: Array<{ position: number; char: string }> = [];
    
    for (const chunk of chunks) {
      try {
        const decoded = await this.decodeChunk(chunk);
        
        if (decoded.type === ChunkType.DATA && 
            decoded.data.position !== undefined && 
            decoded.data.value !== undefined) {
          chars.push({
            position: decoded.data.position,
            char: String.fromCharCode(decoded.data.value)
          });
        }
      } catch (error) {
        // Skip invalid chunks
        continue;
      }
    }
    
    // FIXED: Sort by position and reconstruct string properly
    chars.sort((a, b) => a.position - b.position);
    return chars.map(c => c.char).join('');
  }
  
  // VM execution
  async executeProgram(chunks: bigint[]): Promise<string[]> {
    if (!Array.isArray(chunks)) {
      throw new EncodingError('Chunks must be an array');
    }
    
    this.stats.programsExecuted++;
    
    const decodedChunks: DecodedChunk[] = [];
    
    for (const chunk of chunks) {
      try {
        const decoded = await this.decodeChunk(chunk);
        decodedChunks.push(decoded);
      } catch (error) {
        // Skip invalid chunks
        continue;
      }
    }
    
    const output = this.vm.execute(decodedChunks);
    
    this.state.custom = {
      ...this.state.custom,
      vm: this.vm.getState()
    };
    
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
    
    return this.ntt.forward(data);
  }
  
  async applyInverseNTT(data: number[]): Promise<number[]> {
    if (!this.config.enableNTT) {
      throw new NTTError('NTT', 'NTT operations are disabled');
    }
    
    if (!Array.isArray(data)) {
      throw new NTTError('NTT', 'Input must be an array of numbers');
    }
    
    this.stats.nttOperations++;
    
    return this.ntt.inverse(data);
  }
  
  async verifyNTTRoundTrip(data: number[]): Promise<boolean> {
    if (!this.config.enableNTT) {
      return false;
    }
    
    if (!Array.isArray(data)) {
      return false;
    }
    
    try {
      return this.ntt.verify(data);
    } catch (error) {
      return false;
    }
  }
  
  // FIXED: Integrity operations with proper corruption detection
  async verifyChunkIntegrity(chunk: bigint): Promise<boolean> {
    try {
      await this.decodeChunk(chunk);
      return true; // If decoding succeeds, consider it valid
    } catch (error) {
      this.stats.integrityFailures++;
      return false;
    }
  }
  
  // Utility methods
  async getChunkMetadata(chunk: bigint): Promise<ChunkMetadata> {
    const verified = await this.verifyChunkIntegrity(chunk);
    
    return {
      size: chunk.toString(2).length,
      timestamp: Date.now(),
      verified
    };
  }
  
  generateChunkId(): string {
    return `mock-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
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
}

/**
 * Mock factory function
 */
export function createEncoding(options: EncodingOptions = {}): MockEncodingImplementation {
  return new MockEncodingImplementation(options);
}

/**
 * Mock async factory function
 */
export async function createAndInitializeEncoding(
  options: EncodingOptions = {}
): Promise<MockEncodingImplementation> {
  const model = new MockEncodingImplementation(options);
  await model.initialize();
  return model;
}

/**
 * Mock utility functions
 */
export function generateChunkId(): string {
  return `mock-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}

export function reconstructFromFactors(factors: Factor[]): bigint {
  return factors.reduce(
    (acc, { prime, exponent }) => acc * (prime ** BigInt(exponent)),
    1n
  );
}

export function determineChunkType(factors: Factor[]): ChunkType {
  // Simple mock determination based on first factor
  if (factors.length === 0) {
    throw new Error('No factors provided');
  }
  
  const firstFactor = factors[0];
  
  if (firstFactor.prime === 2n && firstFactor.exponent >= ChunkExponent.DATA_POSITION) {
    return ChunkType.DATA;
  } else if (firstFactor.exponent === ChunkExponent.OPERATION) {
    return ChunkType.OPERATION;
  } else if (firstFactor.exponent === ChunkExponent.BLOCK_HEADER) {
    return ChunkType.BLOCK_HEADER;
  } else {
    return ChunkType.DATA; // Default fallback
  }
}

export function getFactorsByExponent(factors: Factor[], exponent: number): Factor[] {
  return factors.filter(f => f.exponent === exponent);
}

export function validateChunkStructure(factors: Factor[]): boolean {
  return factors.length > 0 && factors.every(f => f.prime > 0n && f.exponent > 0);
}

export function calculateChunkSize(value: bigint): number {
  return value.toString(2).length;
}

export function extractCoreFactors(factors: Factor[]): Factor[] {
  return factors.filter(f => f.exponent < ChunkExponent.CHECKSUM);
}

export function createTimestamp(): number {
  return Date.now();
}

export function validatePositiveInteger(value: any, name: string): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
}

export function validatePositiveBigInt(value: any, name: string): void {
  if (typeof value !== 'bigint' || value <= 0n) {
    throw new Error(`${name} must be a positive BigInt`);
  }
}

// Re-export all types
export * from '../core/types';

// Export the mock model as the default implementation
export const EncodingImplementation = MockEncodingImplementation;

// Mock Jest functions if not available
if (typeof jest === 'undefined') {
  global.jest = {
    fn: () => ({
      mockResolvedValue: (value: any) => () => Promise.resolve(value),
      mockReturnValue: (value: any) => () => value
    })
  } as any;
}
