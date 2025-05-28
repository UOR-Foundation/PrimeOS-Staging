/**
 * Test utilities for Encoding module mocks
 * ========================================
 * 
 * This file provides test utilities and helpers for working with
 * the encoding module mocks.
 */

import { 
  ChunkType,
  StandardOpcodes,
  ProgramOperation,
  DecodedChunk,
  ChunkData,
  EncodingOptions
} from '../core/types';

import { Factor } from '../../prime/types';

/**
 * Create a mock encoding instance for testing
 */
export function createMockEncoding(options: Partial<EncodingOptions> = {}) {
  return {
    encodeText: jest.fn(async (text: string): Promise<bigint[]> => {
      // Mock encoding: create predictable chunks for each character
      return text.split('').map((char, index) => {
        const charCode = char.charCodeAt(0);
        return BigInt(1000 + index * 100 + charCode);
      });
    }),
    
    encodeProgram: jest.fn(async (operations: ProgramOperation[]): Promise<bigint[]> => {
      // Mock encoding: create predictable chunks for operations
      return operations.map((op, index) => {
        return BigInt(2000 + op.opcode * 100 + (op.operand || 0));
      });
    }),
    
    encodeData: jest.fn(async (position: number, value: number): Promise<bigint> => {
      return BigInt(1000 + position * 100 + value);
    }),
    
    encodeOperation: jest.fn(async (opcode: StandardOpcodes, operand?: number): Promise<bigint> => {
      return BigInt(2000 + opcode * 100 + (operand || 0));
    }),
    
    encodeBlock: jest.fn(async (chunks: bigint[]): Promise<bigint[]> => {
      const header = BigInt(7000 + chunks.length);
      return [header, ...chunks];
    }),
    
    decodeChunk: jest.fn(async (chunk: bigint): Promise<DecodedChunk> => {
      const chunkNum = Number(chunk);
      
      if (chunkNum >= 7000) {
        // Block header
        return {
          type: ChunkType.BLOCK_HEADER,
          checksum: 0n,
          data: {
            blockType: StandardOpcodes.BLOCK_TAG,
            blockLength: chunkNum - 7000
          }
        };
      } else if (chunkNum >= 2000) {
        // Operation chunk
        const opcode = Math.floor((chunkNum - 2000) / 100);
        const operand = (chunkNum - 2000) % 100;
        return {
          type: ChunkType.OPERATION,
          checksum: 0n,
          data: {
            opcode: opcode as StandardOpcodes,
            operand: operand > 0 ? operand : undefined
          }
        };
      } else if (chunkNum >= 1000) {
        // Data chunk
        const position = Math.floor((chunkNum - 1000) / 100);
        const value = (chunkNum - 1000) % 100;
        return {
          type: ChunkType.DATA,
          checksum: 0n,
          data: {
            position,
            value
          }
        };
      } else {
        throw new Error(`Invalid chunk: ${chunk}`);
      }
    }),
    
    decodeText: jest.fn(async (chunks: bigint[]): Promise<string> => {
      // Decode chunks back to text
      const chars: Array<{ position: number; char: string }> = [];
      
      for (const chunk of chunks) {
        const chunkNum = Number(chunk);
        if (chunkNum >= 1000 && chunkNum < 2000) {
          const position = Math.floor((chunkNum - 1000) / 100);
          const charCode = (chunkNum - 1000) % 100;
          chars.push({ position, char: String.fromCharCode(charCode) });
        }
      }
      
      chars.sort((a, b) => a.position - b.position);
      return chars.map(c => c.char).join('');
    }),
    
    executeProgram: jest.fn(async (chunks: bigint[]): Promise<string[]> => {
      // Mock VM execution
      const stack: number[] = [];
      const output: string[] = [];
      
      for (const chunk of chunks) {
        const chunkNum = Number(chunk);
        
        if (chunkNum >= 2000 && chunkNum < 3000) {
          // Operation chunk
          const opcode = Math.floor((chunkNum - 2000) / 100);
          const operand = (chunkNum - 2000) % 100;
          
          switch (opcode) {
            case StandardOpcodes.OP_PUSH:
              if (operand > 0) stack.push(operand);
              break;
            case StandardOpcodes.OP_ADD:
              if (stack.length >= 2) {
                const b = stack.pop()!;
                const a = stack.pop()!;
                stack.push(a + b);
              }
              break;
            case StandardOpcodes.OP_PRINT:
              if (stack.length >= 1) {
                output.push(stack.pop()!.toString());
              }
              break;
          }
        } else if (chunkNum >= 1000 && chunkNum < 2000) {
          // Data chunk - push character to output
          const charCode = (chunkNum - 1000) % 100;
          output.push(String.fromCharCode(charCode));
        }
      }
      
      return output;
    }),
    
    applyNTT: jest.fn(async (data: number[]): Promise<number[]> => {
      // Mock NTT: simple array reversal
      return [...data].reverse();
    }),
    
    applyInverseNTT: jest.fn(async (data: number[]): Promise<number[]> => {
      // Mock inverse NTT: reverse again to get original
      return [...data].reverse();
    }),
    
    verifyNTTRoundTrip: jest.fn(async (data: number[]): Promise<boolean> => {
      // Always return true for mock
      return true;
    }),
    
    verifyChunkIntegrity: jest.fn(async (chunk: bigint): Promise<boolean> => {
      // Simple validation: chunk should be >= 1000
      return chunk >= 1000n;
    }),
    
    getChunkMetadata: jest.fn(async (chunk: bigint) => {
      return {
        size: chunk.toString(2).length,
        timestamp: Date.now(),
        verified: chunk >= 1000n
      };
    }),
    
    generateChunkId: jest.fn((): string => {
      return `mock-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
    }),
    
    getLogger: jest.fn(() => ({
      debug: jest.fn().mockResolvedValue(undefined),
      info: jest.fn().mockResolvedValue(undefined),
      warn: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined)
    })),
    
    initialize: jest.fn().mockResolvedValue({ success: true }),
    reset: jest.fn().mockResolvedValue({ success: true }),
    terminate: jest.fn().mockResolvedValue({ success: true }),
    
    getState: jest.fn(() => ({
      lifecycle: 'ready',
      config: {
        enableNTT: true,
        nttModulus: 13n,
        nttPrimitiveRoot: 2n,
        chunkIdLength: 8
      },
      statistics: {
        chunksEncoded: 0,
        chunksDecoded: 0,
        programsExecuted: 0,
        nttOperations: 0,
        integrityFailures: 0
      },
      vm: {
        stackSize: 0,
        lastExecution: undefined
      }
    }))
  };
}

/**
 * Create test factors for common test cases
 */
export function createTestChunkFactors(type: 'data' | 'operation' | 'block' | 'ntt'): Factor[] {
  switch (type) {
    case 'data':
      return [
        { prime: 2n, exponent: 4 }, // Position factor
        { prime: 3n, exponent: 68 }, // Value factor (A = 65)
        { prime: 5n, exponent: 1 },  // High position bits
        { prime: 7n, exponent: 1 }   // High value bits
      ];
      
    case 'operation':
      return [
        { prime: 2n, exponent: 4 },  // OP_PUSH
        { prime: 5n, exponent: 15 }  // Operand 10
      ];
      
    case 'block':
      return [
        { prime: 7n, exponent: 10 }, // Block header with 3 chunks
        { prime: 11n, exponent: 3 }
      ];
      
    case 'ntt':
      return [
        { prime: 11n, exponent: 10 }, // NTT header
        { prime: 13n, exponent: 4 }
      ];
      
    default:
      return [];
  }
}

/**
 * Create test program operations
 */
export function createTestProgram(type: 'simple' | 'complex' | 'error'): ProgramOperation[] {
  switch (type) {
    case 'simple':
      return [
        { opcode: StandardOpcodes.OP_PUSH, operand: 10 },
        { opcode: StandardOpcodes.OP_PRINT }
      ];
      
    case 'complex':
      return [
        { opcode: StandardOpcodes.OP_PUSH, operand: 5 },
        { opcode: StandardOpcodes.OP_PUSH, operand: 3 },
        { opcode: StandardOpcodes.OP_ADD },
        { opcode: StandardOpcodes.OP_PRINT },
        { opcode: StandardOpcodes.OP_PUSH, operand: 2 },
        { opcode: StandardOpcodes.OP_ADD },
        { opcode: StandardOpcodes.OP_PRINT }
      ];
      
    case 'error':
      return [
        { opcode: StandardOpcodes.OP_ADD } // Stack underflow
      ];
      
    default:
      return [];
  }
}

/**
 * Create test chunks with predictable patterns
 */
export function createTestChunks(type: 'text' | 'program' | 'mixed'): bigint[] {
  switch (type) {
    case 'text':
      // "Hi" -> [BigInt(1072), BigInt(1105)]
      return [
        BigInt(1072), // H = 72
        BigInt(1105)  // i = 105
      ];
      
    case 'program':
      return [
        BigInt(2210), // OP_PUSH 10
        BigInt(2305)  // OP_PRINT
      ];
      
    case 'mixed':
      return [
        BigInt(7002), // Block header for 2 chunks
        BigInt(2210), // OP_PUSH 10
        BigInt(2305)  // OP_PRINT
      ];
      
    default:
      return [];
  }
}

/**
 * Test helper to verify mock function calls
 */
export function verifyMockCalls(mockFn: jest.Mock, expectedCalls: any[][]) {
  expect(mockFn).toHaveBeenCalledTimes(expectedCalls.length);
  
  expectedCalls.forEach((expectedArgs, index) => {
    expect(mockFn).toHaveBeenNthCalledWith(index + 1, ...expectedArgs);
  });
}

/**
 * Reset all mocks in an encoding instance
 */
export function resetEncodingMocks(mockEncoding: any) {
  Object.values(mockEncoding).forEach((value: any) => {
    if (jest.isMockFunction(value)) {
      value.mockClear();
    }
  });
}

/**
 * Create a test configuration for encoding module
 */
export function createTestEncodingConfig(overrides: Partial<EncodingOptions> = {}): EncodingOptions {
  return {
    enableNTT: true,
    nttModulus: 13n,
    nttPrimitiveRoot: 2n,
    chunkIdLength: 8,
    enableSpectralTransforms: true,
    debug: false,
    name: 'test-encoding',
    version: '1.0.0',
    ...overrides
  };
}

/**
 * Helper to test async functions with timeout
 */
export async function testWithTimeout<T>(
  fn: () => Promise<T>,
  timeout: number = 5000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Test timeout')), timeout)
    )
  ]);
}

/**
 * Helper to test error cases
 */
export async function expectAsyncError(
  fn: () => Promise<any>,
  errorMessage?: string | RegExp
) {
  let error: Error | undefined;
  
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }
  
  expect(error).toBeDefined();
  
  if (errorMessage) {
    if (typeof errorMessage === 'string') {
      expect(error!.message).toBe(errorMessage);
    } else {
      expect(error!.message).toMatch(errorMessage);
    }
  }
  
  return error;
}

/**
 * Mock ChunkVM for testing
 */
export function createMockChunkVM() {
  return {
    stack: [],
    output: [],
    operations: 0,
    
    reset: jest.fn(function(this: any) {
      this.stack = [];
      this.output = [];
      this.operations = 0;
    }),
    
    execute: jest.fn(function(this: any, chunks: DecodedChunk[]): string[] {
      this.reset();
      
      for (const chunk of chunks) {
        this.operations++;
        
        if (chunk.type === ChunkType.OPERATION) {
          switch (chunk.data.opcode) {
            case StandardOpcodes.OP_PUSH:
              if (chunk.data.operand !== undefined) {
                this.stack.push(chunk.data.operand);
              }
              break;
            case StandardOpcodes.OP_ADD:
              if (this.stack.length >= 2) {
                const b = this.stack.pop();
                const a = this.stack.pop();
                this.stack.push(a + b);
              }
              break;
            case StandardOpcodes.OP_PRINT:
              if (this.stack.length >= 1) {
                this.output.push(this.stack.pop().toString());
              }
              break;
          }
        } else if (chunk.type === ChunkType.DATA) {
          if (chunk.data.value !== undefined) {
            this.output.push(String.fromCharCode(chunk.data.value));
          }
        }
      }
      
      return [...this.output];
    }),
    
    getState: jest.fn(function(this: any) {
      return {
        stackSize: this.stack.length,
        outputLength: this.output.length,
        operations: this.operations
      };
    })
  };
}

/**
 * Mock SimpleNTT for testing
 */
export function createMockSimpleNTT(modulus: bigint = 13n, primitiveRoot: bigint = 2n) {
  return {
    modulus,
    primitiveRoot,
    
    forward: jest.fn((data: number[]): number[] => {
      // Simple mock: reverse array
      return [...data].reverse();
    }),
    
    inverse: jest.fn((data: number[]): number[] => {
      // Simple mock: reverse again
      return [...data].reverse();
    }),
    
    verify: jest.fn((original: number[]): boolean => {
      // Always return true for mock
      return true;
    })
  };
}

/**
 * Create streaming chunks for testing
 */
export function createStreamingChunks(data: any[]) {
  return data.map((item, index) => ({
    data: item,
    position: index,
    final: index === data.length - 1,
    metadata: {
      timestamp: Date.now(),
      sequence: index
    }
  }));
}

/**
 * Mock performance.now for consistent timing tests
 */
export function mockPerformanceNow() {
  let currentTime = 0;
  
  const mock = jest.spyOn(performance, 'now').mockImplementation(() => {
    return currentTime;
  });
  
  return {
    advance: (ms: number) => {
      currentTime += ms;
    },
    reset: () => {
      currentTime = 0;
    },
    restore: () => {
      mock.mockRestore();
    }
  };
}

/**
 * Create a spy on console methods for testing logging
 */
export function spyOnConsole() {
  const spies = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation()
  };
  
  return {
    ...spies,
    restore: () => {
      Object.values(spies).forEach(spy => spy.mockRestore());
    }
  };
}

/**
 * Helper to create test chunk metadata
 */
export function createTestChunkMetadata(overrides: any = {}) {
  return {
    size: 32,
    timestamp: Date.now(),
    verified: true,
    ...overrides
  };
}

/**
 * Helper to create test VM state
 */
export function createTestVMState(overrides: any = {}) {
  return {
    stackSize: 0,
    outputLength: 0,
    operations: 0,
    ...overrides
  };
}

/**
 * Utility to create predictable chunk IDs for testing
 */
export function createTestChunkId(suffix: string = ''): string {
  return `test-chunk-${suffix || Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Helper to validate chunk structure in tests
 */
export function validateTestChunk(chunk: bigint, expectedType: ChunkType): boolean {
  const chunkNum = Number(chunk);
  
  switch (expectedType) {
    case ChunkType.DATA:
      return chunkNum >= 1000 && chunkNum < 2000;
    case ChunkType.OPERATION:
      return chunkNum >= 2000 && chunkNum < 3000;
    case ChunkType.BLOCK_HEADER:
      return chunkNum >= 7000 && chunkNum < 8000;
    case ChunkType.NTT_HEADER:
      return chunkNum >= 11000 && chunkNum < 12000;
    default:
      return false;
  }
}

/**
 * Create mock process input for testing
 */
export function createMockProcessInput(operation: string, data: any = {}) {
  return {
    operation,
    ...data
  };
}

/**
 * Mock integrity module for testing
 */
export function createMockIntegrityModule() {
  return {
    generateChecksum: jest.fn(async (factors: Factor[]): Promise<bigint> => {
      // Simple mock: return sum of prime indices
      return BigInt(factors.length * 100);
    }),
    
    verifyIntegrity: jest.fn(async (value: bigint) => {
      return {
        valid: value >= 1000n,
        checksum: BigInt(100)
      };
    })
  };
}

/**
 * Mock prime registry for testing
 */
export function createMockPrimeRegistry() {
  const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
  
  return {
    getPrime: jest.fn((index: number) => {
      return index < primes.length ? primes[index] : BigInt(index * 2 + 1);
    }),
    
    getIndex: jest.fn((prime: bigint) => {
      const index = primes.indexOf(prime);
      return index >= 0 ? index : Number(prime - 1n) / 2;
    }),
    
    factor: jest.fn((n: bigint): Factor[] => {
      // Simple mock factorization
      if (n === 1n) return [];
      if (n <= 0n) throw new Error('Cannot factor non-positive numbers');
      
      // Provide some test factorizations
      const factorizations: Record<string, Factor[]> = {
        '2': [{ prime: 2n, exponent: 1 }],
        '4': [{ prime: 2n, exponent: 2 }],
        '6': [{ prime: 2n, exponent: 1 }, { prime: 3n, exponent: 1 }],
        '12': [{ prime: 2n, exponent: 2 }, { prime: 3n, exponent: 1 }]
      };
      
      return factorizations[n.toString()] || [{ prime: n, exponent: 1 }];
    })
  };
}
