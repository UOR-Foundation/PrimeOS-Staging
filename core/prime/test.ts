/**
 * Prime Module Tests
 * =================
 * 
 * Test suite for the prime module that implements the first axiom of the UOR kernel:
 * "Prime Number Foundation: All representation derives from prime numbers"
 */

import { 
  createPrimeRegistry,
  PrimeRegistryInterface,
  PrimeRegistryOptions,
  Factor,
  Stream,
  integerSqrt,
  reconstructFromFactors
} from './index';

describe('Prime Registry', () => {
  let registry: PrimeRegistryInterface;
  
  beforeEach(() => {
    // Create a fresh registry before each test
    registry = createPrimeRegistry({
      preloadCount: 100, // Preload a reasonable number of primes for testing
      enableLogs: false
    });
  });
  
  describe('Basic Functionality', () => {
    test('should initialize correctly', () => {
      expect(registry).toBeDefined();
      expect(registry.getPrime(0)).toBe(2n);
    });
    
    test('should test primality correctly', () => {
      // Test known prime numbers
      expect(registry.isPrime(2n)).toBe(true);
      expect(registry.isPrime(3n)).toBe(true);
      expect(registry.isPrime(5n)).toBe(true);
      expect(registry.isPrime(7n)).toBe(true);
      expect(registry.isPrime(11n)).toBe(true);
      expect(registry.isPrime(13n)).toBe(true);
      expect(registry.isPrime(17n)).toBe(true);
      expect(registry.isPrime(19n)).toBe(true);
      expect(registry.isPrime(23n)).toBe(true);
      expect(registry.isPrime(29n)).toBe(true);
      
      // Test non-prime numbers
      expect(registry.isPrime(1n)).toBe(false);
      expect(registry.isPrime(4n)).toBe(false);
      expect(registry.isPrime(6n)).toBe(false);
      expect(registry.isPrime(8n)).toBe(false);
      expect(registry.isPrime(9n)).toBe(false);
      expect(registry.isPrime(10n)).toBe(false);
      expect(registry.isPrime(12n)).toBe(false);
      expect(registry.isPrime(14n)).toBe(false);
      expect(registry.isPrime(15n)).toBe(false);
      expect(registry.isPrime(16n)).toBe(false);
      
      // Test negative numbers
      expect(registry.isPrime(-5n)).toBe(false);
    });
    
    test('should get correct primes by index', () => {
      // First few prime numbers by index
      expect(registry.getPrime(0)).toBe(2n);
      expect(registry.getPrime(1)).toBe(3n);
      expect(registry.getPrime(2)).toBe(5n);
      expect(registry.getPrime(3)).toBe(7n);
      expect(registry.getPrime(4)).toBe(11n);
      expect(registry.getPrime(5)).toBe(13n);
      expect(registry.getPrime(6)).toBe(17n);
      expect(registry.getPrime(7)).toBe(19n);
      expect(registry.getPrime(8)).toBe(23n);
      expect(registry.getPrime(9)).toBe(29n);
    });
    
    test('should get correct indices for primes', () => {
      // Indices of first few primes
      expect(registry.getIndex(2n)).toBe(0);
      expect(registry.getIndex(3n)).toBe(1);
      expect(registry.getIndex(5n)).toBe(2);
      expect(registry.getIndex(7n)).toBe(3);
      expect(registry.getIndex(11n)).toBe(4);
      expect(registry.getIndex(13n)).toBe(5);
      expect(registry.getIndex(17n)).toBe(6);
      expect(registry.getIndex(19n)).toBe(7);
      expect(registry.getIndex(23n)).toBe(8);
      expect(registry.getIndex(29n)).toBe(9);
      
      // Should throw for non-primes
      expect(() => registry.getIndex(4n)).toThrow();
    });
    
    test('should calculate integer square root correctly', () => {
      expect(registry.integerSqrt(0n)).toBe(0n);
      expect(registry.integerSqrt(1n)).toBe(1n);
      expect(registry.integerSqrt(4n)).toBe(2n);
      expect(registry.integerSqrt(9n)).toBe(3n);
      expect(registry.integerSqrt(16n)).toBe(4n);
      expect(registry.integerSqrt(25n)).toBe(5n);
      
      // Non-perfect squares should round down
      expect(registry.integerSqrt(2n)).toBe(1n);
      expect(registry.integerSqrt(3n)).toBe(1n);
      expect(registry.integerSqrt(5n)).toBe(2n);
      expect(registry.integerSqrt(8n)).toBe(2n);
      expect(registry.integerSqrt(15n)).toBe(3n);
      expect(registry.integerSqrt(24n)).toBe(4n);
      expect(registry.integerSqrt(99n)).toBe(9n);
      
      // Should throw for negative numbers
      expect(() => registry.integerSqrt(-1n)).toThrow();
    });
  });
  
  describe('Factorization', () => {
    test('should factor numbers correctly', () => {
      // Test factorization of small numbers
      expect(registry.factor(1n)).toEqual([]);
      
      // Simple prime
      expect(registry.factor(2n)).toEqual([
        { prime: 2n, exponent: 1 }
      ]);
      
      // Prime powers
      expect(registry.factor(4n)).toEqual([
        { prime: 2n, exponent: 2 }
      ]);
      expect(registry.factor(8n)).toEqual([
        { prime: 2n, exponent: 3 }
      ]);
      expect(registry.factor(9n)).toEqual([
        { prime: 3n, exponent: 2 }
      ]);
      
      // Multiple prime factors
      expect(registry.factor(6n)).toEqual([
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 1 }
      ]);
      expect(registry.factor(12n)).toEqual([
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 }
      ]);
      expect(registry.factor(15n)).toEqual([
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
      ]);
      
      // Larger composite
      expect(registry.factor(60n)).toEqual([
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
      ]);
      
      // Larger prime
      expect(registry.factor(101n)).toEqual([
        { prime: 101n, exponent: 1 }
      ]);
      
      // Should throw for non-positive numbers
      expect(() => registry.factor(0n)).toThrow();
      expect(() => registry.factor(-5n)).toThrow();
    });
    
    test('should reconstruct numbers from their factors', () => {
      // Test reconstruction for various numbers
      const testCases = [2n, 3n, 4n, 8n, 9n, 10n, 15n, 16n, 30n, 60n, 100n, 101n, 1000n];
      
      for (const n of testCases) {
        const factors = registry.factor(n);
        const reconstructed = reconstructFromFactors(factors);
        expect(reconstructed).toBe(n);
      }
    });
  });
  
  describe('Stream Operations', () => {
    test('should create prime streams that work correctly', async () => {
      // Create a stream of primes
      const stream = registry.createPrimeStream();
      
      // Get the first 10 primes
      const first10 = await stream.take(10).toArray();
      expect(first10).toEqual([2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n]);
      
      // Test skip operation
      const skipped = registry.createPrimeStream();
      const nextPrimes = await skipped.skip(5).take(5).toArray();
      expect(nextPrimes).toEqual([13n, 17n, 19n, 23n, 29n]);
      
      // Test filtering
      const filtered = registry.createPrimeStream();
      const evenDigitPrimes = await filtered
        .take(20)
        .filter(p => p.toString().split('').every(d => parseInt(d) % 2 === 0))
        .toArray();
      
      // The first primes with even digits only should be 2
      expect(evenDigitPrimes).toContain(2n);
    });
    
    test('should create factor streams that work correctly', async () => {
      // Create a factor stream for a number
      const factorStream = registry.createFactorStream(60n);
      
      // Get all factors
      const factors = await factorStream.toArray();
      expect(factors).toEqual([
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
      ]);
      
      // Test transformations
      const primeOnlyStream = registry.createFactorStream(60n);
      const primes = await primeOnlyStream.map(f => f.prime).toArray();
      expect(primes).toEqual([2n, 3n, 5n]);
      
      // Test filtering
      const filterStream = registry.createFactorStream(60n);
      const evenPrimeFactors = await filterStream
        .filter(f => f.prime % 2n === 0n)
        .toArray();
      expect(evenPrimeFactors).toEqual([{ prime: 2n, exponent: 2 }]);
    });
  });
  
  describe('Streaming Operations', () => {
    test('should factorize numbers using streaming interface', async () => {
      // Create a simple streaming chunk
      const chunk = {
        data: 60n,
        position: 0,
        final: true
      };
      
      // Factorize using streaming interface
      const streamingProcessor = registry.createStreamProcessor();
      const factors = await streamingProcessor.factorizeStreaming([chunk]);
      
      expect(factors).toEqual([
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
      ]);
      
      // Test the higher-level interface
      const directFactors = await registry.factorizeStreaming([chunk]);
      expect(directFactors).toEqual([
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
      ]);
    });
  });
  
  describe('Configuration Options', () => {
    test('should use default options when none provided', () => {
      const defaultRegistry = createPrimeRegistry();
      expect(defaultRegistry).toBeDefined();
      expect(defaultRegistry.getPrime(0)).toBe(2n);
    });
    
    test('should respect custom options', () => {
      // Test with custom preload count
      const customRegistry = createPrimeRegistry({
        preloadCount: 20,
        enableLogs: false
      });
      
      // Should have preloaded at least 20 primes
      expect(customRegistry.getPrime(19)).toBeDefined();
      
      // Test with custom initial primes
      const customPrimes = [2n, 3n, 5n, 7n, 11n];
      const customPrimeRegistry = createPrimeRegistry({
        initialPrimes: customPrimes
      });
      
      // Should have the custom primes
      for (let i = 0; i < customPrimes.length; i++) {
        expect(customPrimeRegistry.getPrime(i)).toBe(customPrimes[i]);
      }
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle very large primes', () => {
      // A known large prime
      const largePrime = 1000000007n; // A billion and 7
      
      // Should correctly identify as prime
      expect(registry.isPrime(largePrime)).toBe(true);
      
      // Should correctly factor numbers with large prime factors
      const withLargePrime = largePrime * 2n;
      const factors = registry.factor(withLargePrime);
      
      expect(factors).toEqual([
        { prime: 2n, exponent: 1 },
        { prime: largePrime, exponent: 1 }
      ]);
    });
    
    test('should handle perfect squares and powers of primes', () => {
      // Perfect squares
      expect(registry.factor(4n)).toEqual([{ prime: 2n, exponent: 2 }]);
      expect(registry.factor(9n)).toEqual([{ prime: 3n, exponent: 2 }]);
      expect(registry.factor(25n)).toEqual([{ prime: 5n, exponent: 2 }]);
      
      // Higher powers of primes
      expect(registry.factor(8n)).toEqual([{ prime: 2n, exponent: 3 }]);
      expect(registry.factor(27n)).toEqual([{ prime: 3n, exponent: 3 }]);
      expect(registry.factor(32n)).toEqual([{ prime: 2n, exponent: 5 }]);
    });
  });
});
