/**
 * Test file for the Encoding module mock
 * =====================================
 * 
 * This file tests that the mock implementation works correctly
 * and can be used in place of the real module.
 */

// Import from the mock
import {
  MockEncodingImplementation,
  createEncoding,
  createAndInitializeEncoding,
  generateChunkId,
  reconstructFromFactors,
  determineChunkType,
  getFactorsByExponent,
  validateChunkStructure,
  calculateChunkSize,
  extractCoreFactors,
  createTimestamp,
  validatePositiveInteger,
  validatePositiveBigInt,
  ChunkType,
  StandardOpcodes,
  ChunkExponent,
  EncodingError,
  ChunkValidationError,
  VMExecutionError,
  NTTError
} from './index';

import {
  createMockEncoding,
  createTestChunkFactors,
  createTestProgram,
  createTestChunks,
  verifyMockCalls,
  resetEncodingMocks,
  createTestEncodingConfig,
  testWithTimeout,
  expectAsyncError,
  createMockChunkVM,
  createMockSimpleNTT,
  createStreamingChunks,
  mockPerformanceNow,
  spyOnConsole
} from './test-mock';

import { Factor } from '../../prime/types';

describe('Encoding Module Mock', () => {
  beforeEach(() => {
    // Clear all mock function calls before each test
    jest.clearAllMocks();
  });

  describe('Mock Structure', () => {
    test('should export MockEncodingImplementation', () => {
      expect(MockEncodingImplementation).toBeDefined();
      expect(typeof MockEncodingImplementation).toBe('function');
    });

    test('should export factory functions', () => {
      expect(createEncoding).toBeDefined();
      expect(typeof createEncoding).toBe('function');
      
      expect(createAndInitializeEncoding).toBeDefined();
      expect(typeof createAndInitializeEncoding).toBe('function');
    });

    test('should export utility functions', () => {
      expect(generateChunkId).toBeDefined();
      expect(reconstructFromFactors).toBeDefined();
      expect(determineChunkType).toBeDefined();
      expect(validateChunkStructure).toBeDefined();
      expect(calculateChunkSize).toBeDefined();
    });

    test('should export error classes', () => {
      expect(EncodingError).toBeDefined();
      expect(ChunkValidationError).toBeDefined();
      expect(VMExecutionError).toBeDefined();
      expect(NTTError).toBeDefined();
    });
  });

  describe('MockEncodingImplementation', () => {
    test('should create instance with default options', () => {
      const encoder = new MockEncodingImplementation();
      expect(encoder).toBeDefined();
      expect(encoder.encodeText).toBeDefined();
      expect(encoder.encodeProgram).toBeDefined();
      expect(encoder.decodeChunk).toBeDefined();
      expect(encoder.executeProgram).toBeDefined();
    });

    test('should create instance with custom options', () => {
      const options = {
        enableNTT: false,
        chunkIdLength: 16,
        debug: true
      };
      
      const encoder = new MockEncodingImplementation(options);
      expect(encoder).toBeDefined();
    });

    test('should initialize correctly', async () => {
      const encoder = new MockEncodingImplementation();
      const result = await encoder.initialize();
      
      expect(result.success).toBe(true);
      
      const state = encoder.getState();
      expect(state.lifecycle).toBe('ready');
    });

    test('should handle text encoding', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const text = 'Hi';
      const chunks = await encoder.encodeText(text);
      
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toBe(BigInt(100072)); // H = 72 at position 0: 100000 + 0*1000 + 72
      expect(chunks[1]).toBe(BigInt(101105)); // i = 105 at position 1: 100000 + 1*1000 + 105
    });

    test('should handle text decoding', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const chunks = [BigInt(100072), BigInt(101105)]; // "Hi"
      const decoded = await encoder.decodeText(chunks);
      
      expect(decoded).toBe('Hi');
    });

    test('should handle program encoding', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const program = [
        { opcode: StandardOpcodes.OP_PUSH, operand: 10 },
        { opcode: StandardOpcodes.OP_PRINT }
      ];
      
      const chunks = await encoder.encodeProgram(program);
      
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toBe(BigInt(202010)); // OP_PUSH (2) with operand 10: 200000 + 2*1000 + 10
      expect(chunks[1]).toBe(BigInt(205000)); // OP_PRINT (5) with no operand: 200000 + 5*1000 + 0
    });

    test('should handle program execution', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const chunks = [
        BigInt(202010), // OP_PUSH 10
        BigInt(205000)  // OP_PRINT
      ];
      
      const output = await encoder.executeProgram(chunks);
      
      expect(Array.isArray(output)).toBe(true);
      expect(output).toEqual(['10']);
    });

    test('should handle chunk decoding', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      // Test data chunk
      const dataChunk = BigInt(100072); // H at position 0
      const decoded = await encoder.decodeChunk(dataChunk);
      
      expect(decoded.type).toBe(ChunkType.DATA);
      expect(decoded.data.position).toBe(0);
      expect(decoded.data.value).toBe(72);
      
      // Test operation chunk
      const opChunk = BigInt(202010); // OP_PUSH 10
      const decodedOp = await encoder.decodeChunk(opChunk);
      
      expect(decodedOp.type).toBe(ChunkType.OPERATION);
      expect(decodedOp.data.opcode).toBe(StandardOpcodes.OP_PUSH);
      expect(decodedOp.data.operand).toBe(10);
    });

    test('should handle NTT operations', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const data = [1, 2, 3, 4];
      
      const forward = await encoder.applyNTT(data);
      expect(forward).toEqual([4, 3, 2, 1]); // Mock reverses array
      
      const inverse = await encoder.applyInverseNTT(forward);
      expect(inverse).toEqual([1, 2, 3, 4]); // Back to original
      
      const verified = await encoder.verifyNTTRoundTrip(data);
      expect(verified).toBe(true);
    });

    test('should handle block encoding', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const chunks = [BigInt(100000), BigInt(200000)];
      const block = await encoder.encodeBlock(chunks);
      
      expect(Array.isArray(block)).toBe(true);
      expect(block).toHaveLength(3);
      expect(block[0]).toBe(BigInt(700002)); // Header with length 2: 700000 + 2
      expect(block[1]).toBe(BigInt(100000));
      expect(block[2]).toBe(BigInt(200000));
    });

    test('should handle integrity verification', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const validChunk = BigInt(100072);
      const valid = await encoder.verifyChunkIntegrity(validChunk);
      expect(valid).toBe(true);
      
      const invalidChunk = BigInt(42);
      const invalid = await encoder.verifyChunkIntegrity(invalidChunk);
      expect(invalid).toBe(false);
    });

    test('should provide chunk metadata', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const chunk = BigInt(100072);
      const metadata = await encoder.getChunkMetadata(chunk);
      
      expect(metadata).toBeDefined();
      expect(typeof metadata.size).toBe('number');
      expect(typeof metadata.timestamp).toBe('number');
      expect(typeof metadata.verified).toBe('boolean');
    });

    test('should generate chunk IDs', () => {
      const encoder = new MockEncodingImplementation();
      
      const id1 = encoder.generateChunkId();
      const id2 = encoder.generateChunkId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^mock-/);
    });

    test('should provide logger', () => {
      const encoder = new MockEncodingImplementation();
      const logger = encoder.getLogger();
      
      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });
  });

  describe('Factory Functions', () => {
    test('createEncoding should return instance', () => {
      const encoder = createEncoding();
      expect(encoder).toBeInstanceOf(MockEncodingImplementation);
    });

    test('createEncoding should accept options', () => {
      const options = {
        enableNTT: false,
        chunkIdLength: 12
      };
      
      const encoder = createEncoding(options);
      expect(encoder).toBeInstanceOf(MockEncodingImplementation);
    });

    test('createAndInitializeEncoding should return initialized instance', async () => {
      const encoder = await createAndInitializeEncoding();
      expect(encoder).toBeInstanceOf(MockEncodingImplementation);
      
      const state = encoder.getState();
      expect(state.lifecycle).toBe('ready');
    });
  });

  describe('Utility Functions', () => {
    test('generateChunkId should create unique IDs', () => {
      const id1 = generateChunkId();
      const id2 = generateChunkId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^mock-/);
    });

    test('reconstructFromFactors should reconstruct values', () => {
      const factors: Factor[] = [
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 1 }
      ];
      
      expect(reconstructFromFactors(factors)).toBe(6n);
      
      const factors2: Factor[] = [
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 }
      ];
      
      expect(reconstructFromFactors(factors2)).toBe(12n);
    });

    test('determineChunkType should classify chunks', () => {
      const dataFactors: Factor[] = [
        { prime: 2n, exponent: 4 }, // ChunkExponent.DATA_POSITION
        { prime: 3n, exponent: 68 } // ChunkExponent.DATA_VALUE
      ];
      
      expect(determineChunkType(dataFactors)).toBe(ChunkType.DATA);
      
      const opFactors: Factor[] = [
        { prime: 5n, exponent: 4 } // ChunkExponent.OPERATION
      ];
      
      expect(determineChunkType(opFactors)).toBe(ChunkType.OPERATION);
    });

    test('getFactorsByExponent should filter correctly', () => {
      const factors: Factor[] = [
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 2 },
        { prime: 5n, exponent: 1 },
        { prime: 7n, exponent: 3 }
      ];
      
      const ones = getFactorsByExponent(factors, 1);
      expect(ones).toHaveLength(2);
      expect(ones[0].prime).toBe(2n);
      expect(ones[1].prime).toBe(5n);
    });

    test('validateChunkStructure should validate correctly', () => {
      const validFactors: Factor[] = [
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 2 }
      ];
      
      expect(validateChunkStructure(validFactors)).toBe(true);
      expect(validateChunkStructure([])).toBe(false);
      
      const invalidFactors: Factor[] = [
        { prime: 0n, exponent: 1 } // Invalid prime
      ];
      
      expect(validateChunkStructure(invalidFactors)).toBe(false);
    });

    test('calculateChunkSize should return bit size', () => {
      expect(calculateChunkSize(1n)).toBe(1);
      expect(calculateChunkSize(2n)).toBe(2);
      expect(calculateChunkSize(4n)).toBe(3);
      expect(calculateChunkSize(8n)).toBe(4);
      expect(calculateChunkSize(255n)).toBe(8);
    });

    test('extractCoreFactors should filter checksums', () => {
      const factors: Factor[] = [
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 2 },
        { prime: 5n, exponent: 100 } // Checksum factor
      ];
      
      const core = extractCoreFactors(factors);
      expect(core).toHaveLength(2);
      expect(core[0].prime).toBe(2n);
      expect(core[1].prime).toBe(3n);
    });

    test('createTimestamp should return valid timestamp', () => {
      const timestamp = createTimestamp();
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    test('validatePositiveInteger should validate correctly', () => {
      expect(() => validatePositiveInteger(5, 'test')).not.toThrow();
      expect(() => validatePositiveInteger(0, 'test')).not.toThrow();
      expect(() => validatePositiveInteger(-1, 'test')).toThrow();
      expect(() => validatePositiveInteger(1.5, 'test')).toThrow();
      expect(() => validatePositiveInteger('5', 'test')).toThrow();
    });

    test('validatePositiveBigInt should validate correctly', () => {
      expect(() => validatePositiveBigInt(5n, 'test')).not.toThrow();
      expect(() => validatePositiveBigInt(0n, 'test')).toThrow();
      expect(() => validatePositiveBigInt(-1n, 'test')).toThrow();
      expect(() => validatePositiveBigInt(5, 'test')).toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid text encoding', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      await expect(encoder.encodeText(null as any)).rejects.toThrow(EncodingError);
      await expect(encoder.encodeText(123 as any)).rejects.toThrow(EncodingError);
    });

    test('should handle invalid program encoding', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      await expect(encoder.encodeProgram(null as any)).rejects.toThrow(EncodingError);
      await expect(encoder.encodeProgram('invalid' as any)).rejects.toThrow(EncodingError);
    });

    test('should handle invalid chunk decoding', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      await expect(encoder.decodeChunk(0n)).rejects.toThrow(ChunkValidationError);
      await expect(encoder.decodeChunk(-1n)).rejects.toThrow(ChunkValidationError);
      await expect(encoder.decodeChunk(42n)).rejects.toThrow(ChunkValidationError);
    });

    test('should handle VM execution errors', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      // Stack underflow - ADD without enough operands
      const invalidProgram = [BigInt(203000)]; // OP_ADD (3) without operands: 200000 + 3*1000 + 0
      
      await expect(encoder.executeProgram(invalidProgram)).rejects.toThrow(VMExecutionError);
    });

    test('should handle NTT errors when disabled', async () => {
      const encoder = new MockEncodingImplementation({ enableNTT: false });
      await encoder.initialize();
      
      await expect(encoder.applyNTT([1, 2, 3])).rejects.toThrow(NTTError);
      await expect(encoder.applyInverseNTT([1, 2, 3])).rejects.toThrow(NTTError);
    });

    test('should handle invalid data encoding', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      await expect(encoder.encodeData(-1, 5)).rejects.toThrow(EncodingError);
      await expect(encoder.encodeData(5, -1)).rejects.toThrow(EncodingError);
      await expect(encoder.encodeData('invalid' as any, 5)).rejects.toThrow(EncodingError);
    });
  });

  describe('Process Interface', () => {
    test('should handle encodeText operation', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const result = await encoder.process({
        operation: 'encodeText',
        data: 'Hi'
      });
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should handle encodeProgram operation', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const program = [
        { opcode: StandardOpcodes.OP_PUSH, operand: 5 },
        { opcode: StandardOpcodes.OP_PRINT }
      ];
      
      const result = await encoder.process({
        operation: 'encodeProgram',
        program
      });
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('should handle unknown operations', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const result = await encoder.process({
        operation: 'unknownOperation' as any
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown operation');
    });

    test('should handle missing parameters', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const result = await encoder.process({
        operation: 'encodeText'
        // Missing data parameter
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing data');
    });
  });

  describe('State Management', () => {
    test('should track statistics', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      // Perform operations to update stats  
      await encoder.encodeText('Hello');
      
      // Use valid program chunks with proper operations 
      const program = [
        { opcode: StandardOpcodes.OP_PUSH, operand: 5 },
        { opcode: StandardOpcodes.OP_PUSH, operand: 3 },
        { opcode: StandardOpcodes.OP_ADD },
        { opcode: StandardOpcodes.OP_PRINT }
      ];
      const chunks = await encoder.encodeProgram(program);
      await encoder.executeProgram(chunks);
      await encoder.applyNTT([1, 2, 3, 4]);
      
      const state = encoder.getState();
      expect(state.statistics.chunksEncoded).toBeGreaterThan(0);
      expect(state.statistics.programsExecuted).toBeGreaterThan(0);
      expect(state.statistics.nttOperations).toBeGreaterThan(0);
    });

    test('should provide VM state', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      // Use valid program that won't cause stack underflow
      const program = [
        { opcode: StandardOpcodes.OP_PUSH, operand: 5 },
        { opcode: StandardOpcodes.OP_PRINT }
      ];
      const chunks = await encoder.encodeProgram(program);
      await encoder.executeProgram(chunks);
      
      const state = encoder.getState();
      expect(state.vm).toBeDefined();
      expect(typeof state.vm.stackSize).toBe('number');
      if (state.vm.outputLength !== undefined) {
        expect(typeof state.vm.outputLength).toBe('number');
      }
    });

    test('should reset correctly', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      // Perform operations
      await encoder.encodeText('Hello');
      
      // Check stats were updated
      let state = encoder.getState();
      expect(state.statistics.chunksEncoded).toBeGreaterThan(0);
      
      // Reset
      const result = await encoder.reset();
      expect(result.success).toBe(true);
      
      // Check stats were reset
      state = encoder.getState();
      expect(state.statistics.chunksEncoded).toBe(0);
    });

    test('should terminate properly', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const result = await encoder.terminate();
      expect(result.success).toBe(true);
      
      const state = encoder.getState();
      expect(state.lifecycle).toBe('terminated');
    });
  });

  describe('Test Utilities', () => {
    test('createMockEncoding should create mock instance', () => {
      const mockEncoder = createMockEncoding();
      expect(mockEncoder).toBeDefined();
      expect(mockEncoder.encodeText).toBeDefined();
      expect(mockEncoder.encodeProgram).toBeDefined();
      expect(mockEncoder.executeProgram).toBeDefined();
    });

    test('createTestChunkFactors should create test factors', () => {
      const dataFactors = createTestChunkFactors('data');
      expect(Array.isArray(dataFactors)).toBe(true);
      expect(dataFactors.length).toBeGreaterThan(0);
      
      const opFactors = createTestChunkFactors('operation');
      expect(Array.isArray(opFactors)).toBe(true);
      expect(opFactors.length).toBeGreaterThan(0);
    });

    test('createTestProgram should create test programs', () => {
      const simple = createTestProgram('simple');
      expect(Array.isArray(simple)).toBe(true);
      expect(simple.length).toBeGreaterThan(0);
      
      const complex = createTestProgram('complex');
      expect(Array.isArray(complex)).toBe(true);
      expect(complex.length).toBeGreaterThan(simple.length);
    });

    test('createTestChunks should create test chunks', () => {
      const textChunks = createTestChunks('text');
      expect(Array.isArray(textChunks)).toBe(true);
      expect(textChunks.length).toBeGreaterThan(0);
      
      const programChunks = createTestChunks('program');
      expect(Array.isArray(programChunks)).toBe(true);
      expect(programChunks.length).toBeGreaterThan(0);
    });

    test('verifyMockCalls should verify calls', () => {
      const mockFn = jest.fn();
      mockFn('arg1', 'arg2');
      mockFn('arg3', 'arg4');
      
      verifyMockCalls(mockFn, [
        ['arg1', 'arg2'],
        ['arg3', 'arg4']
      ]);
    });

    test('createTestEncodingConfig should create config', () => {
      const config = createTestEncodingConfig();
      expect(config).toBeDefined();
      expect(config.enableNTT).toBe(true);
      expect(config.chunkIdLength).toBe(8);
      
      const customConfig = createTestEncodingConfig({ enableNTT: false });
      expect(customConfig.enableNTT).toBe(false);
    });
  });

  describe('Round-trip Operations', () => {
    test('should maintain integrity through encode/decode cycle', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const originalText = 'Hello World';
      const chunks = await encoder.encodeText(originalText);
      const decodedText = await encoder.decodeText(chunks);
      
      expect(decodedText).toBe(originalText);
    });

    test('should execute programs correctly', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      // Create a program that pushes 5 and 3, adds them, and prints result
      const program = [
        { opcode: StandardOpcodes.OP_PUSH, operand: 5 },
        { opcode: StandardOpcodes.OP_PUSH, operand: 3 },
        { opcode: StandardOpcodes.OP_ADD },
        { opcode: StandardOpcodes.OP_PRINT }
      ];
      
      const chunks = await encoder.encodeProgram(program);
      const output = await encoder.executeProgram(chunks);
      
      expect(output).toEqual(['8']);
    });

    test('should verify NTT round-trip', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const data = [1, 2, 3, 4, 5];
      const verified = await encoder.verifyNTTRoundTrip(data);
      
      expect(verified).toBe(true);
    });
  });

  describe('Performance and Concurrency', () => {
    test('should handle multiple operations concurrently', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const operations = [
        encoder.encodeText('Hello'),
        encoder.encodeText('World'),
        encoder.encodeData(0, 65),
        encoder.encodeOperation(StandardOpcodes.OP_PUSH, 10)
      ];
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    test('should handle large text encoding', async () => {
      const encoder = new MockEncodingImplementation();
      await encoder.initialize();
      
      const largeText = 'A'.repeat(1000);
      const chunks = await encoder.encodeText(largeText);
      
      expect(chunks).toHaveLength(1000);
      expect(chunks.every(chunk => typeof chunk === 'bigint')).toBe(true);
    });
  });
});
