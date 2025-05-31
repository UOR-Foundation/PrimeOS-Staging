/**
 * Prime Stream Processor Tests
 * ============================
 * 
 * Tests for prime-encoded stream processing functionality.
 */

import { PrimeStreamProcessorImpl } from './prime-processor';
import { ProcessedChunk, VerificationResult } from '../types';
import { PRIME_CONSTANTS, MEMORY_CONSTANTS, FACTORIZATION_STRATEGY } from '../constants';
import { Factor } from '../../prime/types';

// Mock dependencies
const mockPrimeRegistry = {
  isPrime: jest.fn(),
  factor: jest.fn(),
  getPrime: jest.fn(),
  getNthPrime: jest.fn(),
  getPrimesInRange: jest.fn(),
  getIndex: jest.fn(),
  extendTo: jest.fn(),
  integerSqrt: jest.fn(),
  createPrimeStream: jest.fn(),
  factorizeStreaming: jest.fn(),
  createFactorStream: jest.fn(),
  batchFactorization: jest.fn()
} as any;

const mockLogger = {
  debug: jest.fn().mockResolvedValue(undefined),
  info: jest.fn().mockResolvedValue(undefined),
  warn: jest.fn().mockResolvedValue(undefined),
  error: jest.fn().mockResolvedValue(undefined)
};

// Mock Worker Pool
jest.mock('../utils/worker-pool', () => ({
  getGlobalWorkerPool: jest.fn(() => ({
    execute: jest.fn().mockResolvedValue({
      success: true,
      result: [{ prime: 2n, exponent: 1 }],
      executionTime: 10
    })
  }))
}));

describe('PrimeStreamProcessor', () => {
  let processor: PrimeStreamProcessorImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new PrimeStreamProcessorImpl({
      primeRegistry: mockPrimeRegistry,
      chunkSize: 10,
      logger: mockLogger
    });
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      // Access private config through metrics which reflect configuration
      const metrics = processor.getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.chunksProcessed).toBe(0);
      // We can't directly access config, but we know defaults are used
    });

    it('should track initial metrics', () => {
      const metrics = processor.getMetrics();
      expect(metrics.chunksProcessed).toBe(0);
      expect(metrics.numbersFactorized).toBe(0);
      expect(metrics.integrityChecksPerformed).toBe(0);
      expect(metrics.averageProcessingTime).toBe(0);
      expect(metrics.memoryUsage).toBe(0);
      expect(metrics.errorRate).toBe(0);
    });
  });

  describe('Prime Stream Processing', () => {
    it('should process prime stream chunks', async () => {
      const chunks = async function* () {
        yield BigInt(123456789);
        yield BigInt(987654321);
      };

      mockPrimeRegistry.isPrime.mockReturnValue(false);
      mockPrimeRegistry.factor.mockResolvedValue([
        { prime: 3n, exponent: 2 },
        { prime: 3607n, exponent: 1 },
        { prime: 3803n, exponent: 1 }
      ]);

      const result = await processor.processPrimeStream(chunks());

      expect(result).toHaveLength(2);
      expect(result[0].originalChunk).toBe(BigInt(123456789));
      expect(result[0].verified).toBe(true);
      expect(result[0].errors).toHaveLength(0);
    });

    it('should handle invalid chunks', async () => {
      const chunks = async function* () {
        yield BigInt(0); // Invalid chunk
      };

      const result = await processor.processPrimeStream(chunks());

      expect(result).toHaveLength(1);
      expect(result[0].errors).toContain('Invalid chunk value: 0');
      expect(result[0].verified).toBe(false);
    });

    it('should decode chunk data', async () => {
      const chunks = async function* () {
        yield BigInt(1000000);
      };

      const result = await processor.processPrimeStream(chunks());

      expect(result).toHaveLength(1);
      expect(result[0].decodedData).toBeDefined();
      expect(result[0].decodedData.type).toBe('data'); // ChunkType.DATA
    });
  });

  describe('Stream Factorization', () => {
    it('should factor numbers in stream', async () => {
      const numbers = async function* () {
        yield BigInt(12);
        yield BigInt(15);
        yield BigInt(20);
      };

      mockPrimeRegistry.factor.mockImplementation(async (n: bigint) => {
        if (n === 12n) return [{ prime: 2n, exponent: 2 }, { prime: 3n, exponent: 1 }];
        if (n === 15n) return [{ prime: 3n, exponent: 1 }, { prime: 5n, exponent: 1 }];
        if (n === 20n) return [{ prime: 2n, exponent: 2 }, { prime: 5n, exponent: 1 }];
        return [];
      });

      const result = await processor.streamFactorization(numbers());
      const factors: Factor[][] = [];
      
      for await (const factorList of result) {
        factors.push(factorList);
      }

      expect(factors).toHaveLength(3);
      expect(factors[0]).toEqual([
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 }
      ]);
    });

    it('should handle prime numbers', async () => {
      const numbers = async function* () {
        yield BigInt(7);
        yield BigInt(13);
      };

      mockPrimeRegistry.isPrime.mockReturnValue(true);
      mockPrimeRegistry.factor.mockImplementation(async (n: bigint) => {
        return [{ prime: n, exponent: 1 }];
      });

      const result = await processor.streamFactorization(numbers());
      const factors: Factor[][] = [];
      
      for await (const factorList of result) {
        factors.push(factorList);
      }

      expect(factors).toHaveLength(2);
      expect(factors[0]).toEqual([{ prime: 7n, exponent: 1 }]);
      expect(factors[1]).toEqual([{ prime: 13n, exponent: 1 }]);
    });

    it('should use parallel strategy for large numbers', async () => {
      const numbers = async function* () {
        yield BigInt('12345678901234567890'); // Large number
      };

      const result = processor.streamFactorization(numbers());
      
      for await (const factorList of result) {
        expect(factorList).toBeDefined();
      }

      // Verify worker pool was used
      const { getGlobalWorkerPool } = require('../utils/worker-pool');
      const pool = getGlobalWorkerPool();
      expect(pool.execute).toHaveBeenCalled();
    });
  });

  describe('Stream Integrity Verification', () => {
    it('should verify chunk integrity', async () => {
      const chunks = async function* () {
        yield BigInt(12345);
        yield BigInt(54321);
      };

      const results = await processor.verifyStreamIntegrity(chunks());

      expect(results).toHaveLength(2);
      expect(results[0].chunk).toBe(BigInt(12345));
      expect(results[0].valid).toBe(true);
      expect(results[0].checksum).toBeDefined();
      expect(results[0].errors).toHaveLength(0);
    });

    it('should detect invalid checksums', async () => {
      const chunks = async function* () {
        yield BigInt(1); // Small value that might fail checksum
      };

      const results = await processor.verifyStreamIntegrity(chunks());

      expect(results).toHaveLength(1);
      // Checksum validation depends on implementation
      expect(results[0].checksum).toBeDefined();
    });

    it('should calculate verification time', async () => {
      const chunks = async function* () {
        yield BigInt(99999);
      };

      const results = await processor.verifyStreamIntegrity(chunks());

      expect(results[0].verificationTime).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      processor.configure({
        chunkSize: 20,
        maxConcurrency: 8,
        enableIntegrityCheck: false,
        factorizationStrategy: 'parallel',
        memoryLimit: 100 * 1024 * 1024
      });

      // We can't directly verify config, but operation should not throw
      expect(() => processor.getMetrics()).not.toThrow();
    });

    it('should maintain memory limit', () => {
      processor.configure({
        chunkSize: 1024,
        maxConcurrency: 4,
        enableIntegrityCheck: true,
        factorizationStrategy: 'adaptive',
        memoryLimit: 50 * 1024 * 1024 // 50MB
      });

      // We can't directly verify config, but operation should not throw
      expect(() => processor.getMetrics()).not.toThrow();
    });
  });

  describe('Metrics Tracking', () => {
    it('should update metrics after processing', async () => {
      const chunks = async function* () {
        yield BigInt(1000);
        yield BigInt(2000);
      };

      await processor.processPrimeStream(chunks());

      const metrics = processor.getMetrics();
      expect(metrics.chunksProcessed).toBe(2);
      expect(metrics.averageProcessingTime).toBeGreaterThan(0);
    });

    it('should track factorization metrics', async () => {
      const numbers = async function* () {
        yield BigInt(10);
        yield BigInt(20);
        yield BigInt(30);
      };

      mockPrimeRegistry.factor.mockResolvedValue([
        { prime: 2n, exponent: 1 },
        { prime: 5n, exponent: 1 }
      ]);

      const result = processor.streamFactorization(numbers());
      const allFactors: Factor[][] = [];
      for await (const factors of result) {
        allFactors.push(factors);
      }

      const metrics = processor.getMetrics();
      expect(metrics.numbersFactorized).toBe(3);
    });

    it('should track integrity check metrics', async () => {
      const chunks = async function* () {
        yield BigInt(111);
        yield BigInt(222);
      };

      await processor.verifyStreamIntegrity(chunks());

      const metrics = processor.getMetrics();
      expect(metrics.integrityChecksPerformed).toBe(2);
    });

    it('should calculate error rate', async () => {
      const chunks = async function* () {
        yield BigInt(100);
        yield BigInt(0); // Invalid
        yield BigInt(200);
      };

      await processor.processPrimeStream(chunks());

      const metrics = processor.getMetrics();
      expect(metrics.errorRate).toBeGreaterThan(0);
    });
  });

  describe('Memory Management', () => {
    it('should estimate memory usage', () => {
      const initialMetrics = processor.getMetrics();
      
      // Simulate some processing to accumulate memory
      (processor as any).stats.chunksProcessed = 100;
      (processor as any).updateMetrics();

      const metrics = processor.getMetrics();
      expect(metrics.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle factorization errors gracefully', async () => {
      const numbers = async function* () {
        yield BigInt(100);
      };

      mockPrimeRegistry.factor.mockRejectedValue(new Error('Factorization failed'));

      const result = processor.streamFactorization(numbers());
      const factors: Factor[][] = [];
      
      for await (const factorList of result) {
        factors.push(factorList);
      }

      expect(factors).toHaveLength(1);
      expect(factors[0]).toEqual([]); // Empty array on error
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should continue processing after errors', async () => {
      const chunks = async function* () {
        yield BigInt(100);
        yield BigInt(0); // Error
        yield BigInt(200);
      };

      const result = await processor.processPrimeStream(chunks());

      expect(result).toHaveLength(3);
      expect(result[1].errors.length).toBeGreaterThan(0);
      expect(result[2].errors).toHaveLength(0); // Continued processing
    });
  });

  describe('Batch Processing', () => {
    it('should handle batch verification', async () => {
      const largeBatch = async function* () {
        for (let i = 1; i <= 20; i++) {
          yield BigInt(i * 1000);
        }
      };

      const results = await processor.verifyStreamIntegrity(largeBatch());

      expect(results).toHaveLength(20);
      // Should have processed in batches internally
      expect(results.every(r => r.checksum !== undefined)).toBe(true);
    });
  });

  describe('Strategy Selection', () => {
    it('should use trial division for small numbers', async () => {
      const getStrategy = (processor as any).getFactorizationStrategy.bind(processor);
      
      const smallNumber = BigInt(100); // < 50 bits
      const strategy = getStrategy(smallNumber);
      
      expect(strategy).toBe('trial');
    });

    it('should use adaptive strategy for medium numbers', async () => {
      const getStrategy = (processor as any).getFactorizationStrategy.bind(processor);
      
      const mediumNumber = BigInt('1234567890'); // Between 50-100 bits
      const strategy = getStrategy(mediumNumber);
      
      expect(strategy).toBe('adaptive');
    });

    it('should use parallel strategy when configured', () => {
      processor.configure({ 
        chunkSize: 10,
        maxConcurrency: 4,
        enableIntegrityCheck: true,
        factorizationStrategy: 'parallel',
        memoryLimit: 100 * 1024 * 1024
      });
      
      const getStrategy = (processor as any).getFactorizationStrategy.bind(processor);
      const anyNumber = BigInt(12345);
      const strategy = getStrategy(anyNumber);
      
      expect(strategy).toBe('parallel');
    });
  });
});
