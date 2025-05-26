/**
 * Checksums Module Tests
 * ===================
 * 
 * Test suite for the checksums module.
 */

import { 
  createChecksums,
  checksums,
  calculateChecksum,
  attachChecksum,
  extractFactorsAndChecksum,
  calculateBatchChecksum,
  ChecksumsImplementation,
  ChecksumOptions,
  ChecksumExtractionResult,
  XorHashState
} from './index';
import { Factor } from '../types';

describe('Checksums Module', () => {
  // Mock prime registry for testing
  const mockPrimeRegistry = {
    getPrime: (idx: number) => BigInt(idx * 2 + 1), // Maps 0->1, 1->3, 2->5, etc.
    getIndex: (prime: bigint) => Number((prime - BigInt(1)) / BigInt(2)), // Inverse of above
    factor: (x: bigint): Factor[] => {
      // Handle known test values directly
      if (x === BigInt(42)) {
        return [
          { prime: BigInt(2), exponent: 1 },
          { prime: BigInt(3), exponent: 1 },
          { prime: BigInt(7), exponent: 1 }
        ];
      } else if (x === BigInt(60)) {
        return [
          { prime: BigInt(2), exponent: 2 },
          { prime: BigInt(3), exponent: 1 },
          { prime: BigInt(5), exponent: 1 }
        ];
      } else if (x === BigInt(1000)) {
        return [
          { prime: BigInt(2), exponent: 3 },
          { prime: BigInt(5), exponent: 3 }
        ];
      } else if (x === BigInt(28)) {
        return [
          { prime: BigInt(2), exponent: 2 },
          { prime: BigInt(7), exponent: 1 }
        ];
      } else {
        // Enhanced handling for checksummed values
        // Check if this is a checksummed version of a known value
        const knownValues = [BigInt(42), BigInt(60), BigInt(1000), BigInt(28)];
        
        for (const knownValue of knownValues) {
          if (x % knownValue === BigInt(0)) {
            const checksumFactor = x / knownValue;
            
            // Get the base factors for the known value
            const baseFactors = [...mockPrimeRegistry.factor(knownValue)];
            
            // For test purposes, we'll treat the checksum factor as a prime
            // with the appropriate exponent (checksumPower)
            const checksumPower = 6; // Default power used in tests
            
            // Calculate the checksum prime based on the known value's factors
            const xorSum = baseFactors.reduce((sum, factor) => {
              const primeIndex = mockPrimeRegistry.getIndex(factor.prime);
              return sum ^ (primeIndex * factor.exponent);
            }, 0);
            
            const checksumPrime = mockPrimeRegistry.getPrime(xorSum);
            
            // Add the checksum prime with the appropriate exponent
            baseFactors.push({ prime: checksumPrime, exponent: checksumPower });
            
            return baseFactors;
          }
        }
        
        // Fallback for unknown values
        return [{ prime: x, exponent: 1 }];
      }
    }
  };
  
  describe('Core Functionality', () => {
    test('checksums exported instance is available', () => {
      expect(checksums).toBeDefined();
      expect(checksums.calculateChecksum).toBeDefined();
      expect(checksums.attachChecksum).toBeDefined();
      expect(checksums.extractFactorsAndChecksum).toBeDefined();
      expect(checksums.calculateBatchChecksum).toBeDefined();
    });
    
    test('createChecksums can create a checksums implementation', () => {
      const cs = createChecksums({ checksumPower: 8 });
      expect(cs).toBeDefined();
      expect(cs.getChecksumPower()).toBe(8);
    });
  });
  
  describe('Checksum Calculation', () => {
    test('calculateXorSum generates XOR sum from factors', () => {
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(5), exponent: 1 }
      ];
      
      // Create a fresh instance for testing
      const cs = createChecksums();
      
      // Execute the function
      const result = cs.calculateXorSum(factors);
      
      // We're not testing the exact value since it's implementation-dependent,
      // but we check that it produces consistent values
      expect(typeof result).toBe('number');
      
      // Calculate again with the same factors to verify consistency
      const repeatResult = cs.calculateXorSum(factors);
      expect(repeatResult).toBe(result);
      
      // Calculate with different factors
      const differentFactors: Factor[] = [
        { prime: BigInt(2), exponent: 2 },
        { prime: BigInt(3), exponent: 1 }
      ];
      const differentResult = cs.calculateXorSum(differentFactors);
      
      // Different factors should yield a different XOR sum
      expect(differentResult !== result).toBe(true);
      
      // Test with registry for more accurate prime indices
      const withRegistryResult = cs.calculateXorSum(factors, mockPrimeRegistry);
      expect(typeof withRegistryResult).toBe('number');
    });
    
    test('calculateChecksum returns a prime for checksum', () => {
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(5), exponent: 1 }
      ];
      
      // Execute with the exported function
      const result = calculateChecksum(factors, mockPrimeRegistry);
      
      // Verify the result is a bigint 
      expect(typeof result).toBe('bigint');
      
      // Different factors should yield different checksums
      const otherFactors: Factor[] = [
        { prime: BigInt(2), exponent: 2 },
        { prime: BigInt(3), exponent: 1 }
      ];
      const otherResult = calculateChecksum(otherFactors, mockPrimeRegistry);
      expect(otherResult !== result).toBe(true);
    });
    
    test('calculateChecksum caching works', () => {
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(5), exponent: 1 }
      ];
      
      // Create a new implementation with caching enabled
      const cs = createChecksums({ enableCache: true });
      
      // Calculate the first time (should cache)
      const result1 = cs.calculateChecksum(factors, mockPrimeRegistry);
      
      // Spy on the calculateXorSum method
      const spy = jest.spyOn(cs, 'calculateXorSum');
      
      // Calculate again with the same factors (should use cache)
      const result2 = cs.calculateChecksum(factors, mockPrimeRegistry);
      
      // Verify the result is the same
      expect(result2).toBe(result1);
      
      // Verify calculateXorSum wasn't called again due to cache
      expect(spy.mock.calls.length).toBe(0);
      
      spy.mockRestore();
    });
    
    test('calculateChecksum disables caching when specified', () => {
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(5), exponent: 1 }
      ];
      
      // Create a new implementation with caching disabled
      const cs = createChecksums({ enableCache: false });
      
      // Calculate the first time
      const result1 = cs.calculateChecksum(factors, mockPrimeRegistry);
      
      // Spy on the calculateXorSum method
      const spy = jest.spyOn(cs, 'calculateXorSum');
      
      // Calculate again with the same factors (should not use cache)
      const result2 = cs.calculateChecksum(factors, mockPrimeRegistry);
      
      // Verify the result is the same
      expect(result2).toBe(result1);
      
      // Verify calculateXorSum was called again since caching is disabled
      expect(spy.mock.calls.length).toBeGreaterThan(0);
      
      spy.mockRestore();
    });
    
    test('calculateChecksum handles empty factors', () => {
      const emptyFactors: Factor[] = [];
      
      // Should return a default value (first prime)
      const result = calculateChecksum(emptyFactors, mockPrimeRegistry);
      expect(result).toBe(mockPrimeRegistry.getPrime(0));
    });
  });
  
  describe('Checksum Attachment and Extraction', () => {
    test('attachChecksum attaches a checksum to a value', () => {
      const value = BigInt(42);
      const factors = mockPrimeRegistry.factor(value);
      
      // Calculate checksum and attach it
      const attachedValue = attachChecksum(value, factors, mockPrimeRegistry);
      
      // Verify the attached value is different from the original
      expect(attachedValue !== value).toBe(true);
      
      // Check it's divisible by the original value
      expect(attachedValue % value).toBe(BigInt(0));
    });
    
    test('extractFactorsAndChecksum extracts and verifies checksums', () => {
      const value = BigInt(42);
      const factors = mockPrimeRegistry.factor(value);
      
      // Calculate checksum and attach it
      const attachedValue = attachChecksum(value, factors, mockPrimeRegistry);
      
      // Extract the checksum
      const extractionResult = extractFactorsAndChecksum(attachedValue, mockPrimeRegistry);
      
      // Verify extraction result
      expect(extractionResult).toBeDefined();
      expect(extractionResult.coreFactors).toBeDefined();
      expect(extractionResult.checksumPrime).toBeDefined();
      expect(extractionResult.checksumPower).toBeDefined();
      expect(extractionResult.valid).toBe(true);
    });
    
    test('extractFactorsAndChecksum throws on invalid checksum', () => {
      const value = BigInt(42);
      const factors = mockPrimeRegistry.factor(value);
      
      // Calculate checksum and attach it
      const attachedValue = attachChecksum(value, factors, mockPrimeRegistry);
      
      // Tamper with the value
      const tamperedValue = attachedValue + BigInt(1);
      
      // Extraction should throw an error
      expect(() => {
        extractFactorsAndChecksum(tamperedValue, mockPrimeRegistry);
      }).toThrow();
    });
    
    test('round-trip checksum operation works', () => {
      // Test with a single value for simplicity
      const value = BigInt(42);
      const factors = mockPrimeRegistry.factor(value);
      
      // Attach checksum
      const attachedValue = attachChecksum(value, factors, mockPrimeRegistry);
      
      // Extract checksum and factors
      const extractionResult = extractFactorsAndChecksum(attachedValue, mockPrimeRegistry);
      
      // Verify extraction result
      expect(extractionResult).toBeDefined();
      expect(extractionResult.coreFactors).toBeDefined();
      expect(extractionResult.checksumPrime).toBeDefined();
      expect(extractionResult.checksumPower).toBeDefined();
      expect(extractionResult.valid).toBe(true);
      
      // Verify the checksum prime is as expected
      const expectedChecksum = calculateChecksum(factors, mockPrimeRegistry);
      expect(extractionResult.checksumPrime).toBe(expectedChecksum);
      
      // Verify the checksum power is as expected
      const cs = createChecksums();
      expect(extractionResult.checksumPower).toBe(cs.getChecksumPower());
    });
    
    test('checksumPower affects the checksum size', () => {
      const value = BigInt(42);
      const factors = mockPrimeRegistry.factor(value);
      
      // Create checksums with different powers
      const cs1 = createChecksums({ checksumPower: 2 });
      const cs2 = createChecksums({ checksumPower: 8 });
      
      // Attach checksums
      const attached1 = cs1.attachChecksum(value, factors, mockPrimeRegistry);
      const attached2 = cs2.attachChecksum(value, factors, mockPrimeRegistry);
      
      // The higher power should create a larger checksum
      expect(attached2 > attached1).toBe(true);
    });
  });
  
  describe('Batch and Streaming Operations', () => {
    test('calculateBatchChecksum creates a single checksum for multiple values', () => {
      const values = [BigInt(42), BigInt(60), BigInt(1000)];
      
      // Create checksummed values
      const checksummed = values.map(value => {
        const factors = mockPrimeRegistry.factor(value);
        return attachChecksum(value, factors, mockPrimeRegistry);
      });
      
      // Calculate batch checksum
      const batchChecksum = calculateBatchChecksum(checksummed, mockPrimeRegistry);
      
      // Verify it's a bigint
      expect(typeof batchChecksum).toBe('bigint');
    });
    
    test('batch checksum with tampered values', () => {
      const values = [BigInt(42), BigInt(60), BigInt(1000)];
      
      // Create checksummed values
      const checksummed = values.map(value => {
        const factors = mockPrimeRegistry.factor(value);
        return attachChecksum(value, factors, mockPrimeRegistry);
      });
      
      // Tamper with one value
      const tampered = [...checksummed];
      tampered[1] = tampered[1] + BigInt(1);
      
      // Calculate batch checksums
      const originalChecksum = calculateBatchChecksum(checksummed, mockPrimeRegistry);
      const tamperedChecksum = calculateBatchChecksum(tampered, mockPrimeRegistry);
      
      // Should be different when a value is tampered with
      expect(tamperedChecksum !== originalChecksum).toBe(true);
    });
    
    test('XorHash state can be updated incrementally', () => {
      const values = [BigInt(42), BigInt(60), BigInt(1000)];
      
      // Create checksummed values
      const checksummed = values.map(value => {
        const factors = mockPrimeRegistry.factor(value);
        return attachChecksum(value, factors, mockPrimeRegistry);
      });
      
      // Incremental approach
      const cs = createChecksums();
      let state = cs.createXorHashState();
      
      for (const value of checksummed) {
        state = cs.updateXorHash(state, value, mockPrimeRegistry);
      }
      
      const incrementalChecksum = cs.getChecksumFromXorHash(state, mockPrimeRegistry);
      
      // Calculate batch checksum directly
      const batchChecksum = calculateBatchChecksum(checksummed, mockPrimeRegistry);
      
      // Both approaches should yield the same result
      expect(incrementalChecksum).toBe(batchChecksum);
    });
    
    test('Incremental XorHash ignores invalid values', () => {
      const values = [BigInt(42), BigInt(60), BigInt(1000)];
      
      // Create checksummed values
      const checksummed = values.map(value => {
        const factors = mockPrimeRegistry.factor(value);
        return attachChecksum(value, factors, mockPrimeRegistry);
      });
      
      // Add an invalid value
      const withInvalid = [...checksummed, BigInt(999)]; // BigInt(999) has no checksum
      
      // Incremental approach
      const cs = createChecksums();
      let state = cs.createXorHashState();
      
      for (const value of withInvalid) {
        state = cs.updateXorHash(state, value, mockPrimeRegistry);
      }
      
      const incrementalChecksum = cs.getChecksumFromXorHash(state, mockPrimeRegistry);
      
      // Calculate batch checksum for just the valid values
      const batchChecksum = calculateBatchChecksum(checksummed, mockPrimeRegistry);
      
      // Both approaches should yield the same result
      expect(incrementalChecksum).toBe(batchChecksum);
    });
  });
  
  describe('Cache Management', () => {
    test('clearCache empties the checksum cache', () => {
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(5), exponent: 1 }
      ];
      
      const cs = createChecksums({ enableCache: true });
      
      // First calculation should be cached
      cs.calculateChecksum(factors, mockPrimeRegistry);
      
      // Spy on calculateXorSum
      const spy = jest.spyOn(cs, 'calculateXorSum');
      
      // Second calculation should use cache
      cs.calculateChecksum(factors, mockPrimeRegistry);
      expect(spy.mock.calls.length).toBe(0);
      
      // Clear the cache
      cs.clearCache();
      
      // Third calculation should recompute
      cs.calculateChecksum(factors, mockPrimeRegistry);
      expect(spy.mock.calls.length).toBeGreaterThan(0);
      
      spy.mockRestore();
    });
  });
});
