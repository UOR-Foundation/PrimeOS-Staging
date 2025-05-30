/**
 * Integrity Stream Adapter Tests
 * ==============================
 * 
 * Tests for the integrity stream adapter functionality.
 */

import {
  IntegrityStreamAdapter,
  createIntegrityStreamAdapter,
  createBatchIntegrityStreamAdapter,
  StreamVerificationResult
} from './integrity-adapter';
import { IntegrityInterface, VerificationResult, Factor } from '../../integrity/types';

// Mock integrity module
const mockIntegrityModule: IntegrityInterface = {
  verifyIntegrity: jest.fn().mockImplementation(async (chunk: bigint) => {
    return {
      valid: true,
      checksum: 123n,
      coreFactors: [{ prime: 2n, exponent: 1 }, { prime: 3n, exponent: 1 }]
    };
  }),
  generateChecksum: jest.fn().mockImplementation(async (factors: Factor[]) => {
    return 456n;
  }),
  attachChecksum: jest.fn().mockImplementation(async (value: bigint, factors: Factor[]) => {
    return 789n;
  }),
  verifyBatch: jest.fn().mockResolvedValue([
    { valid: true, checksum: 111n },
    { valid: false, error: 'Invalid checksum' }
  ]),
  extractChecksum: jest.fn().mockResolvedValue({ value: 100n, checksum: 23n }),
  calculateXorSum: jest.fn().mockReturnValue(789n),
  getLogger: jest.fn().mockReturnValue(undefined),
  getState: jest.fn().mockReturnValue('initialized'),
  initialize: jest.fn().mockResolvedValue({ success: true }),
  terminate: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn().mockResolvedValue(undefined),
  process: jest.fn().mockResolvedValue({ success: true }),
  createResult: jest.fn().mockImplementation((success, data, error) => ({ success, data, error }))
};

// Mock logger
const mockLogger: any = {
  debug: jest.fn().mockImplementation(async () => undefined),
  info: jest.fn().mockImplementation(async () => undefined),
  warn: jest.fn().mockImplementation(async () => undefined),
  error: jest.fn().mockImplementation(async () => undefined)
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

describe('IntegrityStreamAdapter', () => {
  let adapter: IntegrityStreamAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-setup mocks after clearing
    mockIntegrityModule.verifyIntegrity = jest.fn().mockImplementation(async (chunk: bigint) => {
      return {
        valid: true,
        checksum: 123n,
        coreFactors: [{ prime: 2n, exponent: 1 }, { prime: 3n, exponent: 1 }]
      };
    });
    mockIntegrityModule.generateChecksum = jest.fn().mockImplementation(async (factors: Factor[]) => {
      return 456n;
    });
    mockIntegrityModule.attachChecksum = jest.fn().mockImplementation(async (value: bigint, factors: Factor[]) => {
      return 789n;
    });
    mockIntegrityModule.verifyBatch = jest.fn().mockResolvedValue([
      { valid: true, checksum: 111n },
      { valid: false, error: 'Invalid checksum' }
    ]);
    adapter = new IntegrityStreamAdapter({
      integrityModule: mockIntegrityModule,
      logger: mockLogger
    });
  });

  describe('verifyIntegrityStream', () => {
    it('should verify integrity of chunks', async () => {
      const input = [123n, 456n];
      const stream = adapter.verifyIntegrityStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        chunk: 123n,
        valid: true,
        checksum: 123n,
        coreFactors: [{ prime: 2n, exponent: 1 }, { prime: 3n, exponent: 1 }],
        errors: [],
        index: 0
      });
      expect(result[0].verificationTime).toBeGreaterThanOrEqual(0);
      expect(mockIntegrityModule.verifyIntegrity).toHaveBeenCalledTimes(2);
    });

    it('should handle verification failures', async () => {
      mockIntegrityModule.verifyIntegrity = jest.fn().mockResolvedValue({
        valid: false,
        error: 'Checksum mismatch'
      });

      const input = [123n];
      const stream = adapter.verifyIntegrityStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result[0]).toMatchObject({
        chunk: 123n,
        valid: false,
        errors: ['Checksum mismatch'],
        index: 0
      });
    });

    it('should handle verification errors', async () => {
      mockIntegrityModule.verifyIntegrity = jest.fn().mockRejectedValue(new Error('Verification error'));

      const input = [123n];
      const stream = adapter.verifyIntegrityStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result[0]).toMatchObject({
        chunk: 123n,
        valid: false,
        errors: ['Verification error'],
        index: 0
      });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should track statistics', async () => {
      mockIntegrityModule.verifyIntegrity = jest.fn()
        .mockResolvedValueOnce({ valid: true })
        .mockResolvedValueOnce({ valid: false });

      const input = [123n, 456n];
      await collectAsyncIterable(adapter.verifyIntegrityStream(arrayToAsyncIterable(input)));

      const stats = adapter.getIntegrityStats();
      expect(stats.totalVerifications).toBe(2);
      expect(stats.successfulVerifications).toBe(1);
      expect(stats.failedVerifications).toBe(1);
      expect(stats.totalProcessingTime).toBeGreaterThanOrEqual(0);
    });

    it('should log progress periodically', async () => {
      const input = Array(101).fill(123n);
      await collectAsyncIterable(adapter.verifyIntegrityStream(arrayToAsyncIterable(input)));

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Integrity verification batch completed',
        expect.objectContaining({
          processed: 100,
          verified: expect.any(Number),
          failed: expect.any(Number),
          successRate: expect.any(Number)
        })
      );
    });
  });

  describe('generateChecksumsStream', () => {
    it('should generate checksums for factor arrays', async () => {
      const factors1: Factor[] = [{ prime: 2n, exponent: 1 }];
      const factors2: Factor[] = [{ prime: 3n, exponent: 2 }];
      const input = [factors1, factors2];
      
      const stream = adapter.generateChecksumsStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        factors: factors1,
        checksum: 456n,
        index: 0
      });
      expect(result[0].generationTime).toBeGreaterThanOrEqual(0);
      expect(mockIntegrityModule.generateChecksum).toHaveBeenCalledTimes(2);
    });

    it('should handle generation errors', async () => {
      mockIntegrityModule.generateChecksum = jest.fn().mockRejectedValue(new Error('Generation error'));

      const factors: Factor[] = [{ prime: 2n, exponent: 1 }];
      const input = [factors];
      const stream = adapter.generateChecksumsStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result[0]).toMatchObject({
        factors,
        checksum: 0n, // Zero on error
        index: 0
      });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should track statistics', async () => {
      const input = [[], [], []];
      await collectAsyncIterable(adapter.generateChecksumsStream(arrayToAsyncIterable(input)));

      const stats = adapter.getIntegrityStats();
      expect(stats.totalChecksumsGenerated).toBe(3);
      expect(stats.totalProcessingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('attachChecksumsStream', () => {
    it('should attach checksums to values', async () => {
      const input = [
        { value: 100n, factors: [{ prime: 2n, exponent: 2 }] },
        { value: 200n, factors: [{ prime: 5n, exponent: 1 }] }
      ];
      
      const stream = adapter.attachChecksumsStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        originalValue: 100n,
        checksummedValue: 789n,
        factors: [{ prime: 2n, exponent: 2 }],
        index: 0
      });
      expect(result[0].attachmentTime).toBeGreaterThanOrEqual(0);
      expect(mockIntegrityModule.attachChecksum).toHaveBeenCalledTimes(2);
    });

    it('should handle attachment errors', async () => {
      mockIntegrityModule.attachChecksum = jest.fn().mockRejectedValue(new Error('Attachment error'));

      const input = [{ value: 100n, factors: [] }];
      const stream = adapter.attachChecksumsStream(arrayToAsyncIterable(input));
      const result = await collectAsyncIterable(stream);

      expect(result[0]).toMatchObject({
        originalValue: 100n,
        checksummedValue: 100n, // Original value on error
        factors: [],
        index: 0
      });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should track statistics', async () => {
      const input = [
        { value: 100n, factors: [] },
        { value: 200n, factors: [] }
      ];
      await collectAsyncIterable(adapter.attachChecksumsStream(arrayToAsyncIterable(input)));

      const stats = adapter.getIntegrityStats();
      expect(stats.totalChecksumsAttached).toBe(2);
      expect(stats.totalProcessingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('verifyBatchStream', () => {
    it('should verify chunks in batches', async () => {
      const input = [100n, 200n, 300n, 400n, 500n];
      const stream = adapter.verifyBatchStream(arrayToAsyncIterable(input), 2);
      const results = await collectAsyncIterable(stream);

      // Should yield 3 batches: [100n, 200n], [300n, 400n], [500n]
      expect(results).toHaveLength(3);
      expect(results[0]).toHaveLength(2);
      expect(results[1]).toHaveLength(2);
      expect(results[2]).toHaveLength(1);
      
      expect(results[0][0].chunk).toBe(100n);
      expect(results[0][0].index).toBe(0);
      expect(results[0][1].chunk).toBe(200n);
      expect(results[0][1].index).toBe(1);
    });

    it('should use batch verification when available', async () => {
      const input = [100n, 200n];
      const stream = adapter.verifyBatchStream(arrayToAsyncIterable(input), 2);
      await collectAsyncIterable(stream);

      expect(mockIntegrityModule.verifyBatch).toHaveBeenCalledWith([100n, 200n]);
      expect(mockIntegrityModule.verifyIntegrity).not.toHaveBeenCalled();
    });

    it('should fall back to individual verification when batch not available', async () => {
      // Create module without batch verification
      const moduleWithoutBatch: IntegrityInterface = {
        ...mockIntegrityModule,
        verifyBatch: undefined as any
      };
      
      adapter = new IntegrityStreamAdapter({
        integrityModule: moduleWithoutBatch,
        logger: mockLogger
      });

      const input = [100n, 200n];
      const stream = adapter.verifyBatchStream(arrayToAsyncIterable(input), 2);
      await collectAsyncIterable(stream);

      expect(mockIntegrityModule.verifyIntegrity).toHaveBeenCalledTimes(2);
    });

    it('should validate batchSize parameter', async () => {
      await expect(collectAsyncIterable(adapter.verifyBatchStream(arrayToAsyncIterable([]), 0)))
        .rejects.toThrow('positive integer');
      
      await expect(collectAsyncIterable(adapter.verifyBatchStream(arrayToAsyncIterable([]), -1)))
        .rejects.toThrow('positive integer');
      
      await expect(collectAsyncIterable(adapter.verifyBatchStream(arrayToAsyncIterable([]), 1.5)))
        .rejects.toThrow('positive integer');
    });

    it('should handle batch verification errors', async () => {
      mockIntegrityModule.verifyBatch = jest.fn().mockRejectedValue(new Error('Batch error'));

      const input = [100n, 200n];
      const stream = adapter.verifyBatchStream(arrayToAsyncIterable(input), 2);
      const results = await collectAsyncIterable(stream);

      expect(results[0]).toHaveLength(2);
      expect(results[0][0].valid).toBe(false);
      expect(results[0][0].errors).toContain('Batch error');
      expect(results[0][1].valid).toBe(false);
    });

    it('should track batch statistics', async () => {
      const input = [100n, 200n, 300n];
      await collectAsyncIterable(adapter.verifyBatchStream(arrayToAsyncIterable(input), 2));

      const stats = adapter.getIntegrityStats();
      expect(stats.totalBatchesProcessed).toBe(2); // Two batches: [100n, 200n] and [300n]
    });
  });

  describe('configuration and statistics', () => {
    it('should get integrity module', () => {
      expect(adapter.getIntegrityModule()).toBe(mockIntegrityModule);
    });

    it('should set logger', () => {
      const newLogger = { ...mockLogger };
      adapter.setLogger(newLogger);
      // Logger is now set and will be used in subsequent operations
    });

    it('should get comprehensive statistics', async () => {
      // Perform various operations
      await collectAsyncIterable(adapter.verifyIntegrityStream(arrayToAsyncIterable([123n])));
      await collectAsyncIterable(adapter.generateChecksumsStream(arrayToAsyncIterable([[]])));
      await collectAsyncIterable(adapter.attachChecksumsStream(arrayToAsyncIterable([{ value: 100n, factors: [] }])));
      await collectAsyncIterable(adapter.verifyBatchStream(arrayToAsyncIterable([123n, 456n]), 2));

      const stats = adapter.getIntegrityStats();
      expect(stats).toMatchObject({
        totalVerifications: expect.any(Number),
        successfulVerifications: expect.any(Number),
        failedVerifications: expect.any(Number),
        totalChecksumsGenerated: 1,
        totalChecksumsAttached: 1,
        totalBatchesProcessed: 1,
        totalProcessingTime: expect.any(Number),
        averageVerificationTime: expect.any(Number),
        errors: 0
      });
    });

    it('should reset statistics', async () => {
      await collectAsyncIterable(adapter.verifyIntegrityStream(arrayToAsyncIterable([123n])));
      
      let stats = adapter.getIntegrityStats();
      expect(stats.totalVerifications).toBeGreaterThan(0);

      adapter.resetStats();
      stats = adapter.getIntegrityStats();
      expect(stats).toMatchObject({
        totalVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        totalChecksumsGenerated: 0,
        totalChecksumsAttached: 0,
        totalBatchesProcessed: 0,
        totalProcessingTime: 0,
        averageVerificationTime: 0,
        errors: 0
      });
    });

    it('should update average verification time', async () => {
      const input = [123n, 456n, 789n];
      await collectAsyncIterable(adapter.verifyIntegrityStream(arrayToAsyncIterable(input)));

      const stats = adapter.getIntegrityStats();
      expect(stats.averageVerificationTime).toBeGreaterThanOrEqual(0);
      // Average should be less than or equal to total (equal when processing is very fast)
      expect(stats.averageVerificationTime).toBeLessThanOrEqual(stats.totalProcessingTime);
    });
  });
});

describe('createIntegrityStreamAdapter', () => {
  it('should create adapter with dependencies', () => {
    const adapter = createIntegrityStreamAdapter({
      integrityModule: mockIntegrityModule,
      logger: mockLogger
    });

    expect(adapter).toBeInstanceOf(IntegrityStreamAdapter);
    expect(adapter.getIntegrityModule()).toBe(mockIntegrityModule);
  });

  it('should create adapter without logger', () => {
    const adapter = createIntegrityStreamAdapter({
      integrityModule: mockIntegrityModule
    });

    expect(adapter).toBeInstanceOf(IntegrityStreamAdapter);
    expect(adapter.getIntegrityModule()).toBe(mockIntegrityModule);
  });
});

describe('createBatchIntegrityStreamAdapter', () => {
  it('should create adapter with batch configuration', async () => {
    const adapter = createBatchIntegrityStreamAdapter({
      integrityModule: mockIntegrityModule,
      logger: mockLogger,
      defaultBatchSize: 20,
      enableStatistics: true
    });

    expect(adapter).toBeInstanceOf(IntegrityStreamAdapter);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Batch integrity stream adapter created',
      expect.objectContaining({
        defaultBatchSize: 20,
        enableStatistics: true,
        hasBatchVerification: true
      })
    );
  });

  it('should use default values when not specified', () => {
    const adapter = createBatchIntegrityStreamAdapter({
      integrityModule: mockIntegrityModule
    });

    expect(adapter).toBeInstanceOf(IntegrityStreamAdapter);
    // Defaults are 10 for batch size and true for statistics
  });

  it('should detect batch verification capability', () => {
    const moduleWithoutBatch: IntegrityInterface = {
      ...mockIntegrityModule,
      verifyBatch: undefined as any
    };

    const adapter = createBatchIntegrityStreamAdapter({
      integrityModule: moduleWithoutBatch,
      logger: mockLogger
    });

    expect(adapter).toBeInstanceOf(IntegrityStreamAdapter);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Batch integrity stream adapter created',
      expect.objectContaining({
        hasBatchVerification: false
      })
    );
  });
});
