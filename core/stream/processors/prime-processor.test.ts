/**
 * Prime Stream Processor Tests
 * ===========================
 * 
 * Test suite for the prime stream processor that handles
 * prime-encoded data streams with factorization and integrity verification.
 */

import { 
  PrimeStreamProcessorImpl 
} from './prime-processor';
import { 
  PrimeStreamProcessor,
  PrimeStreamOptions,
  ProcessedChunk,
  VerificationResult
} from '../types';

// Import Factor from prime module
import { Factor } from '../../prime/types';

// Mock the os modules
jest.mock('../../../os/model', () => ({
  BaseModel: class MockBaseModel {
    protected logger = {
      debug: jest.fn().mockResolvedValue(undefined),
      info: jest.fn().mockResolvedValue(undefined),
      warn: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined)
    };
  }
}));

// Mock prime registry interface with all required methods
const mockPrimeRegistry = {
  factor: jest.fn().mockImplementation((n: bigint): Factor[] => {
    if (n === 60n) {
      return [
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
      ];
    }
    if (n === 12n) {
      return [
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 }
      ];
    }
    if (n === 17n) {
      return [{ prime: 17n, exponent: 1 }];
    }
    return [{ prime: n, exponent: 1 }];
  }),
  isPrime: jest.fn().mockImplementation((n: bigint): boolean => {
    const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
    return primes.includes(n);
  }),
  getPrime: jest.fn().mockImplementation((index: number): bigint => {
    const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
    return primes[index] || BigInt(index * 2 + 1);
  }),
  getIndex: jest.fn().mockImplementation((prime: bigint): number => {
    const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
    return primes.indexOf(prime);
  }),
  extendTo: jest.fn().mockImplementation((idx: number): void => {
    // Mock implementation
  }),
  integerSqrt: jest.fn().mockImplementation((n: bigint): bigint => {
    return BigInt(Math.floor(Math.sqrt(Number(n))));
  }),
  createPrimeStream: jest.fn().mockImplementation((startIdx?: number) => {
    return {
      async *[Symbol.asyncIterator]() {
        const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
        for (const prime of primes.slice(startIdx || 0)) {
          yield prime;
        }
      },
      async toArray() {
        const primes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
        return primes.slice(startIdx || 0);
      }
    };
  }),
  createFactorStream: jest.fn().mockImplementation((x: bigint) => {
    return {
      async *[Symbol.asyncIterator]() {
        yield [{ prime: x, exponent: 1 }];
      },
      async toArray() {
        return [{ prime: x, exponent: 1 }];
      }
    };
  }),
  factorizeStreaming: jest.fn().mockImplementation(async (stream: any) => {
    return [{ prime: 2n, exponent: 1 }];
  }),
  getVersion: jest.fn().mockReturnValue('1.0.0'),
  clearCache: jest.fn().mockImplementation(() => {})
};

describe('Prime Stream Processor', () => {
  let processor: PrimeStreamProcessor;
  let options: PrimeStreamOptions;
  
  beforeEach(() => {
    options = {
      chunkSize: 1024,
      maxConcurrency: 4,
      enableIntegrityCheck: true,
      factorizationStrategy: 'adaptive',
      memoryLimit: 100 * 1024 * 1024 // 100MB
    };
    
    processor = new PrimeStreamProcessorImpl({
      primeRegistry: mockPrimeRegistry as any,
      chunkSize: options.chunkSize,
      logger: null
    });
  });
  
  describe('Basic Functionality', () => {
    test('should create prime stream processor', () => {
      expect(processor).toBeDefined();
      expect(typeof processor.processPrimeStream).toBe('function');
      expect(typeof processor.streamFactorization).toBe('function');
      expect(typeof processor.verifyStreamIntegrity).toBe('function');
    });
    
    test('should configure with options', () => {
      processor.configure(options);
      const metrics = processor.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.chunksProcessed).toBe('number');
      expect(typeof metrics.numbersFactorized).toBe('number');
    });
  });
  
  describe('Prime Stream Processing', () => {
    test('should process prime stream chunks', async () => {
      const chunks = async function* () {
        yield 60n;
        yield 12n;
        yield 17n;
      };
      
      const results = await processor.processPrimeStream(chunks());
      
      expect(results).toHaveLength(3);
      expect(results[0]).toMatchObject({
        originalChunk: 60n,
        verified: expect.any(Boolean),
        errors: expect.any(Array)
      });
    });
    
    test('should handle empty streams', async () => {
      const emptyChunks = async function* (): AsyncGenerator<bigint> {
        // Empty stream
      };
      
      const results = await processor.processPrimeStream(emptyChunks());
      expect(results).toHaveLength(0);
    });
    
    test('should handle single chunk', async () => {
      const singleChunk = async function* () {
        yield 17n;
      };
      
      const results = await processor.processPrimeStream(singleChunk());
      expect(results).toHaveLength(1);
      expect(results[0].originalChunk).toBe(17n);
    });
  });
  
  describe('Factorization Streaming', () => {
    test('should stream factorization of numbers', async () => {
      const numbers = async function* () {
        yield 60n;
        yield 12n;
        yield 17n;
      };
      
      const factorStream = await processor.streamFactorization(numbers());
      const factors: Factor[][] = [];
      
      for await (const factorArray of factorStream) {
        factors.push(factorArray);
      }
      
      expect(factors).toHaveLength(3);
      expect(factors[0]).toEqual([
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
      ]);
      expect(factors[1]).toEqual([
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 }
      ]);
      expect(factors[2]).toEqual([
        { prime: 17n, exponent: 1 }
      ]);
    });
    
    test('should handle large numbers in factorization', async () => {
      const largeNumbers = async function* () {
        yield 1000000n;
        yield 999999n;
      };
      
      const factorStream = await processor.streamFactorization(largeNumbers());
      const factors: Factor[][] = [];
      
      for await (const factorArray of factorStream) {
        factors.push(factorArray);
      }
      
      expect(factors).toHaveLength(2);
      expect(factors[0]).toBeDefined();
      expect(factors[1]).toBeDefined();
    });
    
    test('should handle prime numbers in factorization', async () => {
      const primes = async function* () {
        yield 17n;
        yield 19n;
        yield 23n;
      };
      
      const factorStream = await processor.streamFactorization(primes());
      const factors: Factor[][] = [];
      
      for await (const factorArray of factorStream) {
        factors.push(factorArray);
      }
      
      expect(factors).toHaveLength(3);
      expect(factors[0]).toEqual([{ prime: 17n, exponent: 1 }]);
      expect(factors[1]).toEqual([{ prime: 19n, exponent: 1 }]);
      expect(factors[2]).toEqual([{ prime: 23n, exponent: 1 }]);
    });
  });
  
  describe('Integrity Verification', () => {
    test('should verify stream integrity', async () => {
      const chunks = async function* () {
        yield 60n;
        yield 12n;
        yield 17n;
      };
      
      const results = await processor.verifyStreamIntegrity(chunks());
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toMatchObject({
          chunk: expect.any(BigInt),
          valid: expect.any(Boolean),
          checksum: expect.any(BigInt),
          errors: expect.any(Array),
          verificationTime: expect.any(Number)
        });
      });
    });
    
    test('should detect integrity failures', async () => {
      // Mock a failure scenario by making factor return empty array
      mockPrimeRegistry.factor.mockImplementationOnce(() => {
        throw new Error('Factorization failed');
      });
      
      const chunks = async function* () {
        yield 60n;
      };
      
      const results = await processor.verifyStreamIntegrity(chunks());
      
      expect(results).toHaveLength(1);
      expect(results[0].valid).toBe(false);
      expect(results[0].errors.length).toBeGreaterThan(0);
    });
    
    test('should handle invalid chunks in verification', async () => {
      const chunks = async function* () {
        yield 0n; // Invalid input
        yield -5n; // Invalid input
      };
      
      const results = await processor.verifyStreamIntegrity(chunks());
      
      expect(results).toHaveLength(2);
      // Should handle gracefully without crashing
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
    });
  });
  
  describe('Performance Metrics', () => {
    test('should track processing metrics', async () => {
      const chunks = async function* () {
        yield 60n;
        yield 12n;
      };
      
      await processor.processPrimeStream(chunks());
      
      const metrics = processor.getMetrics();
      expect(metrics.chunksProcessed).toBeGreaterThan(0);
      expect(metrics.averageProcessingTime).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
    });
    
    test('should track factorization metrics', async () => {
      const numbers = async function* () {
        yield 60n;
        yield 12n;
        yield 17n;
      };
      
      const factorStream = await processor.streamFactorization(numbers());
      
      // Consume the stream
      for await (const factors of factorStream) {
        // Process factors
      }
      
      const metrics = processor.getMetrics();
      expect(metrics.numbersFactorized).toBeGreaterThan(0);
    });
    
    test('should track integrity check metrics', async () => {
      const chunks = async function* () {
        yield 60n;
        yield 12n;
      };
      
      await processor.verifyStreamIntegrity(chunks());
      
      const metrics = processor.getMetrics();
      expect(metrics.integrityChecksPerformed).toBeGreaterThan(0);
    });
  });
  
  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newOptions: PrimeStreamOptions = {
        chunkSize: 2048,
        maxConcurrency: 8,
        enableIntegrityCheck: false,
        factorizationStrategy: 'parallel',
        memoryLimit: 200 * 1024 * 1024
      };
      
      processor.configure(newOptions);
      
      // Verify configuration was applied
      const metrics = processor.getMetrics();
      expect(metrics).toBeDefined();
    });
    
    test('should handle partial configuration updates', () => {
      const partialOptions: Partial<PrimeStreamOptions> = {
        chunkSize: 512,
        enableIntegrityCheck: false
      };
      
      processor.configure(partialOptions as PrimeStreamOptions);
      
      // Should not throw error
      expect(processor).toBeDefined();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle prime registry errors gracefully', async () => {
      // Mock registry to throw error
      mockPrimeRegistry.factor.mockImplementationOnce(() => {
        throw new Error('Registry error');
      });
      
      const chunks = async function* () {
        yield 60n;
      };
      
      const results = await processor.processPrimeStream(chunks());
      
      expect(results).toHaveLength(1);
      expect(results[0].errors.length).toBeGreaterThan(0);
    });
    
    test('should handle stream processing errors', async () => {
      const errorChunks = async function* (): AsyncGenerator<bigint> {
        yield 60n;
        throw new Error('Stream error');
      };
      
      await expect(processor.processPrimeStream(errorChunks())).rejects.toThrow();
    });
    
    test('should recover from transient errors', async () => {
      let callCount = 0;
      mockPrimeRegistry.factor.mockImplementation((n: bigint) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Transient error');
        }
        return [{ prime: n, exponent: 1 }];
      });
      
      const chunks = async function* () {
        yield 60n;
        yield 12n;
      };
      
      const results = await processor.processPrimeStream(chunks());
      
      // Should have processed at least one chunk successfully
      expect(results.length).toBeGreaterThan(0);
    });
  });
  
  describe('Concurrency and Performance', () => {
    test('should handle concurrent processing', async () => {
      const largeStream = async function* () {
        for (let i = 10; i < 100; i++) {
          yield BigInt(i);
        }
      };
      
      const startTime = Date.now();
      const results = await processor.processPrimeStream(largeStream());
      const endTime = Date.now();
      
      expect(results.length).toBe(90);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
    
    test('should handle high-throughput factorization', async () => {
      const numbers = async function* () {
        for (let i = 2; i < 50; i++) {
          yield BigInt(i);
        }
      };
      
      const factorStream = await processor.streamFactorization(numbers());
      const factors: Factor[][] = [];
      
      const startTime = Date.now();
      for await (const factorArray of factorStream) {
        factors.push(factorArray);
      }
      const endTime = Date.now();
      
      expect(factors.length).toBe(48);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });
  
  describe('Memory Management', () => {
    test('should track memory usage', () => {
      const metrics = processor.getMetrics();
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    });
    
    test('should handle memory pressure', async () => {
      // Configure with low memory limit
      processor.configure({
        chunkSize: 1024,
        maxConcurrency: 4,
        enableIntegrityCheck: true,
        factorizationStrategy: 'adaptive',
        memoryLimit: 1024 // Very low limit
      });
      
      const chunks = async function* () {
        yield 60n;
        yield 12n;
      };
      
      // Should handle gracefully without crashing
      const results = await processor.processPrimeStream(chunks());
      expect(results).toBeDefined();
    });
  });
  
  describe('Strategy Testing', () => {
    test('should support parallel factorization strategy', () => {
      processor.configure({
        chunkSize: 1024,
        maxConcurrency: 4,
        enableIntegrityCheck: true,
        factorizationStrategy: 'parallel',
        memoryLimit: 100 * 1024 * 1024
      });
      
      expect(processor).toBeDefined();
    });
    
    test('should support sequential factorization strategy', () => {
      processor.configure({
        chunkSize: 1024,
        maxConcurrency: 1,
        enableIntegrityCheck: true,
        factorizationStrategy: 'sequential',
        memoryLimit: 100 * 1024 * 1024
      });
      
      expect(processor).toBeDefined();
    });
    
    test('should support adaptive factorization strategy', () => {
      processor.configure({
        chunkSize: 1024,
        maxConcurrency: 4,
        enableIntegrityCheck: true,
        factorizationStrategy: 'adaptive',
        memoryLimit: 100 * 1024 * 1024
      });
      
      expect(processor).toBeDefined();
    });
  });
  
  describe('Integration Testing', () => {
    test('should work with different prime registry implementations', () => {
      const alternativeRegistry = {
        factor: jest.fn().mockReturnValue([{ prime: 2n, exponent: 1 }]),
        isPrime: jest.fn().mockReturnValue(true),
        getPrime: jest.fn().mockReturnValue(2n),
        getIndex: jest.fn().mockReturnValue(0),
        extendTo: jest.fn(),
        integerSqrt: jest.fn().mockReturnValue(1n),
        createPrimeStream: jest.fn().mockReturnValue({
          async *[Symbol.asyncIterator]() { yield 2n; },
          async toArray() { return [2n]; }
        }),
        createFactorStream: jest.fn().mockReturnValue({
          async *[Symbol.asyncIterator]() { yield [{ prime: 2n, exponent: 1 }]; },
          async toArray() { return [{ prime: 2n, exponent: 1 }]; }
        }),
        factorizeStreaming: jest.fn().mockResolvedValue([{ prime: 2n, exponent: 1 }]),
        getVersion: jest.fn().mockReturnValue('1.0.0'),
        clearCache: jest.fn()
      };
      
      const altProcessor = new PrimeStreamProcessorImpl({
        primeRegistry: alternativeRegistry as any,
        chunkSize: 512,
        logger: null
      });
      
      expect(altProcessor).toBeDefined();
    });
    
    test('should handle logging integration', () => {
      const mockLogger = {
        debug: jest.fn().mockResolvedValue(undefined),
        info: jest.fn().mockResolvedValue(undefined),
        warn: jest.fn().mockResolvedValue(undefined),
        error: jest.fn().mockResolvedValue(undefined)
      };
      
      const loggedProcessor = new PrimeStreamProcessorImpl({
        primeRegistry: mockPrimeRegistry as any,
        chunkSize: 1024,
        logger: mockLogger
      });
      
      expect(loggedProcessor).toBeDefined();
    });
  });
});
