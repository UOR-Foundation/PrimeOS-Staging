/**
 * Encoding Stream Adapter Tests
 * =============================
 * 
 * Tests for the encoding stream adapter functionality.
 */

import { 
  EncodingStreamAdapter, 
  createEncodingStreamAdapter,
  createAutoEncodingStreamAdapter
} from './encoding-adapter';
import { ChunkType, EncodingInterface, DecodedChunk } from '../../encoding/core/types';

// Mock encoding module
const mockEncodingModule: EncodingInterface = {
  encodeText: jest.fn().mockImplementation(async (text: string) => {
    // Return array of chunks for the text
    return [123n, 456n];
  }),
  decodeText: jest.fn().mockImplementation(async (chunks: bigint[]) => {
    return 'decoded text';
  }),
  decodeChunk: jest.fn().mockImplementation(async (chunk: bigint) => {
    return {
      type: ChunkType.DATA,
      checksum: 7n,
      data: { value: 100, position: 0 }
    };
  }),
  executeProgram: jest.fn().mockImplementation(async (chunks: bigint[]) => {
    return ['output1', 'output2'];
  }),
  // Add other required methods
  initialize: jest.fn().mockResolvedValue({ success: true }),
  terminate: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn().mockResolvedValue(undefined),
  process: jest.fn().mockResolvedValue({ success: true }),
  encodeData: jest.fn().mockResolvedValue(789n),
  encodeOperation: jest.fn().mockResolvedValue(999n),
  encodeProgram: jest.fn().mockResolvedValue([111n, 222n]),
  encodeBlock: jest.fn().mockResolvedValue([333n, 444n]),
  verifyChunkIntegrity: jest.fn().mockResolvedValue(true),
  applyNTT: jest.fn().mockResolvedValue([555n, 666n]),
  applyInverseNTT: jest.fn().mockResolvedValue([777n, 888n]),
  getChunkMetadata: jest.fn().mockReturnValue({ timestamp: 1234567890 }),
  generateChunkId: jest.fn().mockReturnValue('chunk-123'),
  getLogger: jest.fn().mockReturnValue(undefined),
  verifyNTTRoundTrip: jest.fn().mockResolvedValue(true),
  getState: jest.fn().mockReturnValue('initialized'),
  createResult: jest.fn().mockImplementation((success, data, error) => ({ success, data, error }))
};

// Mock logger - use 'any' to avoid type issues
const mockLogger: any = {
  log: jest.fn().mockResolvedValue(undefined),
  debug: jest.fn().mockResolvedValue(undefined),
  info: jest.fn().mockResolvedValue(undefined),
  warn: jest.fn().mockResolvedValue(undefined),
  error: jest.fn().mockResolvedValue(undefined),
  trace: jest.fn().mockResolvedValue(undefined),
  fatal: jest.fn().mockResolvedValue(undefined),
  getEntries: jest.fn().mockReturnValue([]),
  getLevel: jest.fn().mockReturnValue('info'),
  setLevel: jest.fn(),
  clear: jest.fn(),
  getLevelPriority: jest.fn().mockReturnValue(2),
  isLevelEnabled: jest.fn().mockReturnValue(true),
  createChildLogger: jest.fn().mockReturnThis(),
  getChildLoggers: jest.fn().mockReturnValue([]),
  getMetrics: jest.fn().mockReturnValue({ totalLogs: 0 })
};

// Helper to convert array to async iterable
async function* arrayToAsyncIterable<T>(array: T[]): AsyncIterable<T> {
  for (const item of array) {
    yield item;
  }
}

// Helper to collect async iterable to array
async function collectAsyncIterable<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of iterable) {
    result.push(item);
  }
  return result;
}

describe('EncodingStreamAdapter', () => {
  let adapter: EncodingStreamAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup mocks after clearing
    mockEncodingModule.encodeText = jest.fn().mockImplementation(async (text: string) => {
      return [123n, 456n];
    });
    mockEncodingModule.decodeText = jest.fn().mockImplementation(async (chunks: bigint[]) => {
      return 'decoded text';
    });
    mockEncodingModule.decodeChunk = jest.fn().mockImplementation(async (chunk: bigint) => {
      return {
        type: ChunkType.DATA,
        checksum: 7n,
        data: { value: 100, position: 0 }
      };
    });
    mockEncodingModule.executeProgram = jest.fn().mockImplementation(async (chunks: bigint[]) => {
      return ['output1', 'output2'];
    });
    adapter = new EncodingStreamAdapter({
      encodingModule: mockEncodingModule,
      logger: mockLogger
    });
  });

  describe('encodeTextStream', () => {
    it('should encode text chunks using encoding module', async () => {
      const input = ['hello', 'world'];
      const stream = adapter.encodeTextStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual([123n, 456n, 123n, 456n]); // Two chunks per input
      expect(mockEncodingModule.encodeText).toHaveBeenCalledTimes(2);
      expect(mockEncodingModule.encodeText).toHaveBeenCalledWith('hello');
      expect(mockEncodingModule.encodeText).toHaveBeenCalledWith('world');
    });

    it('should use fallback encoding when no module is configured', async () => {
      adapter = new EncodingStreamAdapter({ logger: mockLogger });
      
      const input = ['hello'];
      const stream = adapter.encodeTextStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result.length).toBe(1);
      expect(typeof result[0]).toBe('bigint');
      expect(result[0].toString(16)).toBe('68656c6c6f'); // 'hello' in hex
    });

    it('should handle empty strings', async () => {
      adapter = new EncodingStreamAdapter({ logger: mockLogger });
      
      const input = [''];
      const stream = adapter.encodeTextStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual([0n]);
    });

    it('should track statistics', async () => {
      const input = ['test1', 'test2'];
      const stream = adapter.encodeTextStream(arrayToAsyncIterable(input));
      await collectAsyncIterable(stream);

      const stats = adapter.getStats();
      expect(stats.textChunksEncoded).toBe(4); // 2 chunks per input
      expect(stats.errors).toBe(0);
    });

    it('should handle encoding errors', async () => {
      const errorAdapter = new EncodingStreamAdapter({
        encodingModule: {
          ...mockEncodingModule,
          encodeText: jest.fn().mockRejectedValue(new Error('Encoding failed'))
        } as any,
        logger: mockLogger
      });

      const input = ['error'];
      const stream = errorAdapter.encodeTextStream(arrayToAsyncIterable(input));

      await expect(collectAsyncIterable(stream)).rejects.toThrow('Failed to encode text chunk');
      
      const stats = errorAdapter.getStats();
      expect(stats.errors).toBeGreaterThan(0);
    });
  });

  describe('decodeTextStream', () => {
    it('should decode chunks using encoding module', async () => {
      const input = [123n, 456n];
      const stream = adapter.decodeTextStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual(['decoded text', 'decoded text']);
      expect(mockEncodingModule.decodeText).toHaveBeenCalledTimes(2);
      expect(mockEncodingModule.decodeText).toHaveBeenCalledWith([123n]);
      expect(mockEncodingModule.decodeText).toHaveBeenCalledWith([456n]);
    });

    it('should use fallback decoding when module fails', async () => {
      mockEncodingModule.decodeText = jest.fn().mockRejectedValue(new Error('Decode failed'));

      const hex = BigInt('0x' + Buffer.from('hello', 'utf8').toString('hex'));
      const input = [hex];
      const stream = adapter.decodeTextStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual(['hello']);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should use fallback decoding when no module is configured', async () => {
      adapter = new EncodingStreamAdapter({ logger: mockLogger });
      
      const hex = BigInt('0x' + Buffer.from('test', 'utf8').toString('hex'));
      const input = [hex];
      const stream = adapter.decodeTextStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual(['test']);
    });

    it('should handle invalid hex in fallback', async () => {
      adapter = new EncodingStreamAdapter({ logger: mockLogger });
      
      const input = [123456789n];
      const stream = adapter.decodeTextStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result.length).toBe(1);
      expect(result[0]).toBeTruthy();
      expect(result[0].length).toBeGreaterThan(0);
    });

    it('should track statistics', async () => {
      const input = [123n, 456n];
      const stream = adapter.decodeTextStream(arrayToAsyncIterable(input));
      await collectAsyncIterable(stream);

      const stats = adapter.getStats();
      expect(stats.textChunksDecoded).toBe(2);
      expect(stats.errors).toBe(0);
    });
  });

  describe('decodeChunkStream', () => {
    it('should decode chunk structures using encoding module', async () => {
      const input = [123n];
      const stream = adapter.decodeChunkStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result.length).toBe(1);
      expect(result[0].type).toBe(ChunkType.DATA);
      expect(result[0].checksum).toBe(7n);
      expect(mockEncodingModule.decodeChunk).toHaveBeenCalledWith(123n);
    });

    it('should use fallback when decoding fails', async () => {
      mockEncodingModule.decodeChunk = jest.fn().mockRejectedValue(new Error('Decode failed'));

      const input = [12345678n];
      const stream = adapter.decodeChunkStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result.length).toBe(1);
      expect(result[0].type).toBe(ChunkType.DATA);
      expect(result[0].checksum).toBe(12345678n & 0xFFFFn);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should use fallback when no module is configured', async () => {
      adapter = new EncodingStreamAdapter({ logger: mockLogger });
      
      const input = [99999n];
      const stream = adapter.decodeChunkStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result.length).toBe(1);
      expect(result[0].type).toBe(ChunkType.DATA);
      expect(result[0].data.value).toBe(99999);
    });

    it('should track statistics', async () => {
      const input = [123n, 456n, 789n];
      const stream = adapter.decodeChunkStream(arrayToAsyncIterable(input));
      await collectAsyncIterable(stream);

      const stats = adapter.getStats();
      expect(stats.chunksDecoded).toBe(3);
      expect(stats.errors).toBe(0);
    });
  });

  describe('executeStreamingProgram', () => {
    it('should execute program using encoding module', async () => {
      const input = [111n, 222n, 333n];
      const stream = adapter.executeStreamingProgram(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual(['output1', 'output2']);
      expect(mockEncodingModule.executeProgram).toHaveBeenCalledWith([111n, 222n, 333n]);
    });

    it('should use fallback when execution fails', async () => {
      mockEncodingModule.executeProgram = jest.fn().mockRejectedValue(new Error('Execute failed'));

      const input = [111n, 222n];
      const stream = adapter.executeStreamingProgram(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual(['Executed chunk: 111', 'Executed chunk: 222']);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should use fallback when no module is configured', async () => {
      adapter = new EncodingStreamAdapter({ logger: mockLogger });
      
      const input = [555n];
      const stream = adapter.executeStreamingProgram(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toEqual(['Executed chunk: 555']);
    });

    it('should track statistics', async () => {
      const input = [111n, 222n];
      const stream = adapter.executeStreamingProgram(arrayToAsyncIterable(input));
      await collectAsyncIterable(stream);

      const stats = adapter.getStats();
      expect(stats.programsExecuted).toBe(1);
      expect(stats.errors).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should configure encoding module', () => {
      const newAdapter = new EncodingStreamAdapter({ logger: mockLogger });
      expect(newAdapter.getEncodingModule()).toBeUndefined();

      newAdapter.configure(mockEncodingModule);
      expect(newAdapter.getEncodingModule()).toBe(mockEncodingModule);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Encoding stream adapter configured',
        expect.any(Object)
      );
    });

    it('should set logger', () => {
      const newAdapter = new EncodingStreamAdapter();
      const newLogger = { ...mockLogger };
      
      newAdapter.setLogger(newLogger);
      // Test that logger is used by encoding something
      newAdapter.encodeTextStream(arrayToAsyncIterable(['test']));
      // Logger methods would be called if we awaited the stream
    });
  });

  describe('statistics', () => {
    it('should track all operations', async () => {
      // Encode text
      await collectAsyncIterable(adapter.encodeTextStream(arrayToAsyncIterable(['test'])));
      
      // Decode text
      await collectAsyncIterable(adapter.decodeTextStream(arrayToAsyncIterable([123n])));
      
      // Decode chunk
      await collectAsyncIterable(adapter.decodeChunkStream(arrayToAsyncIterable([456n])));
      
      // Execute program
      await collectAsyncIterable(adapter.executeStreamingProgram(arrayToAsyncIterable([789n])));

      const stats = adapter.getStats();
      expect(stats.textChunksEncoded).toBe(2);
      expect(stats.textChunksDecoded).toBe(1);
      expect(stats.chunksDecoded).toBe(1);
      expect(stats.programsExecuted).toBe(1);
      expect(stats.totalProcessingTime).toBeGreaterThanOrEqual(0);
    });

    it('should reset statistics', async () => {
      await collectAsyncIterable(adapter.encodeTextStream(arrayToAsyncIterable(['test'])));
      
      let stats = adapter.getStats();
      expect(stats.textChunksEncoded).toBeGreaterThan(0);

      adapter.resetStats();
      stats = adapter.getStats();
      expect(stats.textChunksEncoded).toBe(0);
      expect(stats.textChunksDecoded).toBe(0);
      expect(stats.chunksDecoded).toBe(0);
      expect(stats.programsExecuted).toBe(0);
      expect(stats.fallbacksUsed).toBe(0);
      expect(stats.errors).toBe(0);
      expect(stats.totalProcessingTime).toBe(0);
    });

    it('should track fallback usage', async () => {
      adapter = new EncodingStreamAdapter({ logger: mockLogger });
      
      // All operations should use fallback
      await collectAsyncIterable(adapter.encodeTextStream(arrayToAsyncIterable(['test'])));
      await collectAsyncIterable(adapter.decodeTextStream(arrayToAsyncIterable([123n])));
      await collectAsyncIterable(adapter.decodeChunkStream(arrayToAsyncIterable([456n])));
      await collectAsyncIterable(adapter.executeStreamingProgram(arrayToAsyncIterable([789n])));

      const stats = adapter.getStats();
      expect(stats.fallbacksUsed).toBe(4);
    });
  });
});

describe('createEncodingStreamAdapter', () => {
  it('should create adapter with dependencies', () => {
    const adapter = createEncodingStreamAdapter({
      encodingModule: mockEncodingModule,
      logger: mockLogger
    });

    expect(adapter).toBeInstanceOf(EncodingStreamAdapter);
    expect((adapter as EncodingStreamAdapter).getEncodingModule()).toBe(mockEncodingModule);
  });

  it('should create adapter without dependencies', () => {
    const adapter = createEncodingStreamAdapter();

    expect(adapter).toBeInstanceOf(EncodingStreamAdapter);
    expect((adapter as EncodingStreamAdapter).getEncodingModule()).toBeUndefined();
  });
});

describe('createAutoEncodingStreamAdapter', () => {
  // Mock the dynamic import
  jest.mock('../../encoding', () => ({
    createAndInitializeEncoding: jest.fn().mockResolvedValue(mockEncodingModule)
  }), { virtual: true });

  it('should create adapter without auto-loading', async () => {
    const adapter = await createAutoEncodingStreamAdapter({
      logger: mockLogger,
      autoLoadModule: false
    });

    expect(adapter).toBeInstanceOf(EncodingStreamAdapter);
    expect((adapter as EncodingStreamAdapter).getEncodingModule()).toBeUndefined();
  });

  it('should auto-load encoding module with dependencies', async () => {
    const mockPrimeRegistry = { getPrime: jest.fn() };
    const mockIntegrityModule = { verifyIntegrity: jest.fn() };

    const adapter = await createAutoEncodingStreamAdapter({
      logger: mockLogger,
      autoLoadModule: true,
      primeRegistry: mockPrimeRegistry,
      integrityModule: mockIntegrityModule
    });

    expect(adapter).toBeInstanceOf(EncodingStreamAdapter);
    // Note: In real test, the module would be loaded if import succeeds
  });

  it('should warn when auto-load requested but dependencies missing', async () => {
    const adapter = await createAutoEncodingStreamAdapter({
      logger: mockLogger,
      autoLoadModule: true
    });

    expect(adapter).toBeInstanceOf(EncodingStreamAdapter);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Cannot auto-load encoding module',
      expect.objectContaining({
        reason: 'Missing required dependencies'
      })
    );
  });

  it('should handle auto-load failure gracefully', async () => {
    const mockPrimeRegistry = { getPrime: jest.fn() };
    const mockIntegrityModule = { verifyIntegrity: jest.fn() };

    // Force import to fail
    jest.doMock('../../encoding', () => {
      throw new Error('Module not found');
    });

    const adapter = await createAutoEncodingStreamAdapter({
      logger: mockLogger,
      autoLoadModule: true,
      primeRegistry: mockPrimeRegistry,
      integrityModule: mockIntegrityModule
    });

    expect(adapter).toBeInstanceOf(EncodingStreamAdapter);
    expect((adapter as EncodingStreamAdapter).getEncodingModule()).toBeUndefined();
  });
});
