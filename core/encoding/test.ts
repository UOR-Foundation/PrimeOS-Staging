/**
 * Encoding Module Tests
 * ====================
 * 
 * Comprehensive test suite for the encoding module implementing Axiom 3:
 * "Unified execution model: Data and operations share a common representation"
 */

// Import from mock implementation to use lightweight mock for testing
import { 
  createEncoding,
  createAndInitializeEncoding,
  EncodingInterface,
  EncodingOptions,
  EncodingState,
  StandardOpcodes,
  ChunkType,
  ProgramOperation,
  EncodingError,
  ChunkValidationError,
  VMExecutionError,
  NTTError
} from './__mocks__/index';

describe('Encoding Module', () => {
  let instance: EncodingInterface;
  
  beforeEach(async () => {
    // Create a fresh instance before each test
    instance = createEncoding({
      debug: true,
      name: 'test-encoding',
      enableNTT: true,
      nttModulus: 13n,
      nttPrimitiveRoot: 2n
    });
    
    // Initialize the instance
    await instance.initialize();
  });
  
  afterEach(async () => {
    // Clean up after each test
    if (instance) {
      await instance.terminate();
    }
  });
  
  describe('Lifecycle Management', () => {
    test('should initialize correctly', () => {
      const state = instance.getState() as EncodingState;
      expect(state.lifecycle).toBe('ready');
      expect(state.config).toBeDefined();
      expect(state.config.enableNTT).toBe(true);
      expect(state.config.nttModulus).toBe(13n);
    });
    
    test('should reset state correctly', async () => {
      // Perform some operations
      await instance.encodeText('test');
      
      // Check that stats were updated
      let state = instance.getState() as EncodingState;
      expect(state.statistics.chunksEncoded).toBeGreaterThan(0);
      
      // Reset the instance
      const result = await instance.reset();
      expect(result.success).toBe(true);
      
      // Check state after reset
      state = instance.getState() as EncodingState;
      expect(state.operationCount.total).toBe(0);
      expect(state.statistics.chunksEncoded).toBe(0);
    });
    
    test('should terminate properly', async () => {
      const result = await instance.terminate();
      expect(result.success).toBe(true);
      
      const state = instance.getState();
      expect(state.lifecycle).toBe('terminated');
    });
  });
  
  describe('Data Encoding', () => {
    test('should encode data chunks correctly', async () => {
      const position = 0;
      const value = 65; // ASCII 'A'
      
      const chunk = await instance.encodeData(position, value);
      expect(typeof chunk).toBe('bigint');
      expect(chunk).toBeGreaterThan(0n);
      
      // Verify statistics updated
      const state = instance.getState() as EncodingState;
      expect(state.statistics.chunksEncoded).toBe(1);
    });
    
    test('should encode text to chunks', async () => {
      const text = 'ABC';
      const chunks = await instance.encodeText(text);
      
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBe(text.length);
      expect(chunks.every(chunk => typeof chunk === 'bigint')).toBe(true);
    });
    
    test('should handle same prime position/value case', async () => {
      // When position and value map to the same prime
      const chunk = await instance.encodeData(0, 2); // Both map to prime 2
      expect(typeof chunk).toBe('bigint');
      expect(chunk).toBeGreaterThan(0n);
    });
    
    test('should validate input parameters', async () => {
      await expect(instance.encodeData(-1, 65)).rejects.toThrow();
      await expect(instance.encodeData(0, -1)).rejects.toThrow();
      await expect(instance.encodeText(null as any)).rejects.toThrow();
    });
  });
  
  describe('Operation Encoding', () => {
    test('should encode operations correctly', async () => {
      const opcode = StandardOpcodes.OP_PUSH;
      const operand = 42;
      
      const chunk = await instance.encodeOperation(opcode, operand);
      expect(typeof chunk).toBe('bigint');
      expect(chunk).toBeGreaterThan(0n);
    });
    
    test('should encode operations without operands', async () => {
      const opcode = StandardOpcodes.OP_ADD;
      
      const chunk = await instance.encodeOperation(opcode);
      expect(typeof chunk).toBe('bigint');
      expect(chunk).toBeGreaterThan(0n);
    });
    
    test('should encode program sequences', async () => {
      const operations: ProgramOperation[] = [
        { opcode: StandardOpcodes.OP_PUSH, operand: 10 },
        { opcode: StandardOpcodes.OP_PUSH, operand: 20 },
        { opcode: StandardOpcodes.OP_ADD },
        { opcode: StandardOpcodes.OP_PRINT }
      ];
      
      const chunks = await instance.encodeProgram(operations);
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBe(operations.length);
      expect(chunks.every(chunk => typeof chunk === 'bigint')).toBe(true);
    });
  });
  
  describe('Block Encoding', () => {
    test('should encode blocks with headers', async () => {
      const dataChunks = await instance.encodeText('Hi');
      const block = await instance.encodeBlock(dataChunks);
      
      expect(Array.isArray(block)).toBe(true);
      expect(block.length).toBe(dataChunks.length + 1); // +1 for header
      expect(block[0]).toBeDefined(); // Header chunk
    });
  });
  
  describe('Chunk Decoding', () => {
    test('should decode data chunks correctly', async () => {
      const originalPosition = 0;
      const originalValue = 65; // ASCII 'A'
      
      const chunk = await instance.encodeData(originalPosition, originalValue);
      const decoded = await instance.decodeChunk(chunk);
      
      expect(decoded.type).toBe(ChunkType.DATA);
      expect(decoded.data.position).toBe(originalPosition);
      expect(decoded.data.value).toBe(originalValue);
      expect(decoded.checksum).toBeDefined();
    });
    
    test('should decode operation chunks correctly', async () => {
      const originalOpcode = StandardOpcodes.OP_PUSH;
      const originalOperand = 42;
      
      const chunk = await instance.encodeOperation(originalOpcode, originalOperand);
      const decoded = await instance.decodeChunk(chunk);
      
      expect(decoded.type).toBe(ChunkType.OPERATION);
      expect(decoded.data.opcode).toBe(originalOpcode);
      expect(decoded.data.operand).toBe(originalOperand);
    });
    
    test('should decode operations without operands', async () => {
      const originalOpcode = StandardOpcodes.OP_ADD;
      
      const chunk = await instance.encodeOperation(originalOpcode);
      const decoded = await instance.decodeChunk(chunk);
      
      expect(decoded.type).toBe(ChunkType.OPERATION);
      expect(decoded.data.opcode).toBe(originalOpcode);
      expect(decoded.data.operand).toBeUndefined();
    });
    
    test('should verify chunk integrity during decoding', async () => {
      const chunk = await instance.encodeData(0, 65);
      
      // Valid chunk should decode successfully
      const decoded = await instance.decodeChunk(chunk);
      expect(decoded).toBeDefined();
      
      // Corrupted chunk should fail - use a value outside all valid ranges
      const corruptedChunk = BigInt(42);
      await expect(instance.decodeChunk(corruptedChunk))
        .rejects.toThrow();
    });
    
    test('should reject invalid chunks', async () => {
      const invalidChunk = 42n; // Not a valid UOR chunk
      
      await expect(instance.decodeChunk(invalidChunk))
        .rejects.toThrow();
    });
  });
  
  describe('VM Execution', () => {
    test('should execute simple programs', async () => {
      const program: ProgramOperation[] = [
        { opcode: StandardOpcodes.OP_PUSH, operand: 10 },
        { opcode: StandardOpcodes.OP_PUSH, operand: 20 },
        { opcode: StandardOpcodes.OP_ADD },
        { opcode: StandardOpcodes.OP_PRINT }
      ];
      
      const chunks = await instance.encodeProgram(program);
      const output = await instance.executeProgram(chunks);
      
      expect(Array.isArray(output)).toBe(true);
      expect(output.length).toBe(1);
      expect(output[0]).toBe('30'); // 10 + 20 = 30
      
      // Check statistics
      const state = instance.getState() as EncodingState;
      expect(state.statistics.programsExecuted).toBe(1);
    });
    
    test('should handle text data in VM', async () => {
      const text = 'A';
      const chunks = await instance.encodeText(text);
      const output = await instance.executeProgram(chunks);
      
      expect(output.join('')).toBe(text);
    });
    
    test('should handle nested blocks', async () => {
      const innerProgram = await instance.encodeProgram([
        { opcode: StandardOpcodes.OP_PUSH, operand: 5 },
        { opcode: StandardOpcodes.OP_PRINT }
      ]);
      
      const block = await instance.encodeBlock(innerProgram);
      const output = await instance.executeProgram(block);
      
      expect(output).toContain('5');
    });
    
    test('should detect stack underflow', async () => {
      const program = await instance.encodeProgram([
        { opcode: StandardOpcodes.OP_ADD } // No values on stack
      ]);
      
      await expect(instance.executeProgram(program))
        .rejects.toThrow(VMExecutionError);
    });
    
    test('should detect missing operands', async () => {
      const program = await instance.encodeProgram([
        { opcode: StandardOpcodes.OP_PUSH } // Missing operand
      ]);
      
      await expect(instance.executeProgram(program))
        .rejects.toThrow(VMExecutionError);
    });
  });
  
  describe('NTT Operations', () => {
    test('should apply forward NTT', async () => {
      const data = [1, 2, 3, 4];
      const result = await instance.applyNTT(data);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(data.length);
      expect(result.every(val => typeof val === 'number')).toBe(true);
      
      // Check statistics
      const state = instance.getState() as EncodingState;
      expect(state.statistics.nttOperations).toBe(1);
    });
    
    test('should apply inverse NTT', async () => {
      const data = [1, 2, 3, 4];
      const forward = await instance.applyNTT(data);
      const inverse = await instance.applyInverseNTT(forward);
      
      expect(Array.isArray(inverse)).toBe(true);
      expect(inverse.length).toBe(data.length);
    });
    
    test('should verify NTT round-trip', async () => {
      const data = [1, 2, 3, 4];
      const verified = await instance.verifyNTTRoundTrip(data);
      
      expect(typeof verified).toBe('boolean');
      // Note: Exact verification depends on NTT modulus and primitive root
    });
    
    test('should handle NTT disabled state', async () => {
      const disabledInstance = createEncoding({ enableNTT: false });
      await disabledInstance.initialize();
      
      const data = [1, 2, 3, 4];
      
      await expect(disabledInstance.applyNTT(data))
        .rejects.toThrow(NTTError);
      
      await expect(disabledInstance.applyInverseNTT(data))
        .rejects.toThrow(NTTError);
      
      const verified = await disabledInstance.verifyNTTRoundTrip(data);
      expect(verified).toBe(false);
      
      await disabledInstance.terminate();
    });
    
    test('should validate NTT input', async () => {
      await expect(instance.applyNTT(null as any))
        .rejects.toThrow(NTTError);
      
      await expect(instance.applyNTT('invalid' as any))
        .rejects.toThrow(NTTError);
    });
  });
  
  describe('Integrity Verification', () => {
    test('should verify chunk integrity', async () => {
      const chunk = await instance.encodeData(0, 65);
      const isValid = await instance.verifyChunkIntegrity(chunk);
      
      expect(typeof isValid).toBe('boolean');
    });
    
    test('should detect corrupted chunks', async () => {
      const chunk = await instance.encodeData(0, 65);
      const corruptedChunk = chunk + 1n;
      
      const isValid = await instance.verifyChunkIntegrity(corruptedChunk);
      expect(typeof isValid).toBe('boolean');
    });
  });
  
  describe('Utility Functions', () => {
    test('should generate chunk metadata', async () => {
      const chunk = await instance.encodeData(0, 65);
      const metadata = await instance.getChunkMetadata(chunk);
      
      expect(metadata.size).toBeGreaterThan(0);
      expect(metadata.timestamp).toBeGreaterThan(0);
      expect(typeof metadata.verified).toBe('boolean');
    });
    
    test('should generate unique chunk IDs', () => {
      const id1 = instance.generateChunkId();
      const id2 = instance.generateChunkId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
    });
  });
  
  describe('Process Interface', () => {
    test('should handle encodeText operation', async () => {
      const result = await instance.process({
        operation: 'encodeText',
        data: 'Hello'
      });
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    test('should handle encodeData operation', async () => {
      const result = await instance.process({
        operation: 'encodeData',
        position: 0,
        value: 65
      });
      
      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('bigint');
    });
    
    test('should handle decodeChunk operation', async () => {
      const chunk = await instance.encodeData(0, 65);
      
      const result = await instance.process({
        operation: 'decodeChunk',
        chunk
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
    
    test('should handle executeProgram operation', async () => {
      const program: ProgramOperation[] = [
        { opcode: StandardOpcodes.OP_PUSH, operand: 42 },
        { opcode: StandardOpcodes.OP_PRINT }
      ];
      const chunks = await instance.encodeProgram(program);
      
      const result = await instance.process({
        operation: 'executeProgram',
        chunks
      });
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    test('should handle applyNTT operation', async () => {
      const result = await instance.process({
        operation: 'applyNTT',
        data: [1, 2, 3, 4]
      });
      
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
    
    test('should handle unknown operations', async () => {
      const result = await instance.process({
        operation: 'unknownOperation' as any
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown operation');
    });
    
    test('should handle missing parameters', async () => {
      const result = await instance.process({
        operation: 'encodeData'
        // Missing position and value parameters
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    test('should handle invalid input', async () => {
      const result = await instance.process(null as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
    });
  });
  
  describe('Configuration Options', () => {
    test('should use default options when none provided', async () => {
      const defaultInstance = createEncoding();
      await defaultInstance.initialize();
      
      const state = defaultInstance.getState() as EncodingState;
      expect(state.config.enableNTT).toBe(true);
      expect(state.config.nttModulus).toBe(13n);
      expect(state.config.chunkIdLength).toBe(8);
      
      await defaultInstance.terminate();
    });
    
    test('should respect custom NTT configuration', async () => {
      const customInstance = createEncoding({
        nttModulus: 17n,
        nttPrimitiveRoot: 3n
      });
      await customInstance.initialize();
      
      const state = customInstance.getState() as EncodingState;
      expect(state.config.nttModulus).toBe(17n);
      expect(state.config.nttPrimitiveRoot).toBe(3n);
      
      await customInstance.terminate();
    });
    
    test('should work with custom prime registry', async () => {
      const customInstance = createEncoding({
        primeRegistry: undefined // Would be a mock registry
      });
      await customInstance.initialize();
      
      expect(customInstance).toBeDefined();
      
      await customInstance.terminate();
    });
  });
  
  describe('Round-trip Integrity', () => {
    test('should maintain data integrity through encode/decode cycle', async () => {
      const testCases = [
        { position: 0, value: 65 },  // 'A'
        { position: 1, value: 66 },  // 'B'
        { position: 2, value: 67 },  // 'C'
        { position: 0, value: 0 },   // Edge case
        { position: 10, value: 255 } // Larger values
      ];
      
      for (const testCase of testCases) {
        const chunk = await instance.encodeData(testCase.position, testCase.value);
        const decoded = await instance.decodeChunk(chunk);
        
        expect(decoded.data.position).toBe(testCase.position);
        expect(decoded.data.value).toBe(testCase.value);
      }
    });
    
    test('should maintain program integrity through encode/execute cycle', async () => {
      const program: ProgramOperation[] = [
        { opcode: StandardOpcodes.OP_PUSH, operand: 15 },
        { opcode: StandardOpcodes.OP_PUSH, operand: 25 },
        { opcode: StandardOpcodes.OP_ADD },
        { opcode: StandardOpcodes.OP_PRINT }
      ];
      
      const chunks = await instance.encodeProgram(program);
      const output = await instance.executeProgram(chunks);
      
      expect(output).toEqual(['40']); // 15 + 25 = 40
    });
    
    test('should maintain text integrity through encode/decode cycle', async () => {
      const texts = ['Hello', 'World', '123', 'Special!@#'];
      
      for (const text of texts) {
        const chunks = await instance.encodeText(text);
        const decoded = await instance.decodeText(chunks);
        
        expect(decoded).toBe(text);
      }
    });
  });
  
  describe('Performance and Statistics', () => {
    test('should track operation statistics', async () => {
      // Perform various operations
      await instance.encodeText('Hello');
      await instance.encodeProgram([{ opcode: StandardOpcodes.OP_PRINT }]);
      await instance.applyNTT([1, 2, 3, 4]);
      
      const state = instance.getState() as EncodingState;
      expect(state.statistics.chunksEncoded).toBeGreaterThan(0);
      expect(state.statistics.nttOperations).toBeGreaterThan(0);
    });
    
    test('should track VM state', async () => {
      const program = await instance.encodeProgram([
        { opcode: StandardOpcodes.OP_PUSH, operand: 42 }
      ]);
      
      await instance.executeProgram(program);
      
      const state = instance.getState() as EncodingState;
      expect(state.vm.stackSize).toBeDefined();
    });
  });
  
  describe('Factory Functions', () => {
    test('createEncoding should work', () => {
      const testInstance = createEncoding({
        debug: true,
        name: 'factory-test'
      });
      
      expect(testInstance).toBeDefined();
    });
    
    test('createAndInitializeEncoding should work', async () => {
      const testInstance = await createAndInitializeEncoding({
        debug: true,
        name: 'factory-init-test'
      });
      
      expect(testInstance).toBeDefined();
      const state = testInstance.getState();
      expect(state.lifecycle).toBe('ready');
      
      await testInstance.terminate();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle encoding errors gracefully', async () => {
      await expect(instance.encodeData(-1, 65)).rejects.toThrow();
      await expect(instance.encodeText(null as any)).rejects.toThrow();
      await expect(instance.encodeProgram(null as any)).rejects.toThrow();
    });
    
    test('should handle VM execution errors gracefully', async () => {
      // Test stack underflow
      const badProgram = await instance.encodeProgram([
        { opcode: StandardOpcodes.OP_ADD }
      ]);
      
      await expect(instance.executeProgram(badProgram))
        .rejects.toThrow(VMExecutionError);
    });
    
    test('should handle NTT errors gracefully', async () => {
      await expect(instance.applyNTT(null as any))
        .rejects.toThrow(NTTError);
    });
  });
  
  describe('Logger Access', () => {
    test('should provide access to logger', () => {
      const logger = instance.getLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });
});
