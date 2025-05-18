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
    getIndex: (prime: bigint) => Number((prime - 1n) / 2n), // Inverse of above
    factor: (x: bigint): Factor[] => {
      if (x === 42n) {
        return [
          { prime: 2n, exponent: 1 },
          { prime: 3n, exponent: 1 },
          { prime: 7n, exponent: 1 }
        ];
      } else if (x === 60n) {
        return [
          { prime: 2n, exponent: 2 },
          { prime: 3n, exponent: 1 },
          { prime: 5n, exponent: 1 }
        ];
      } else if (x === 1000n) {
        return [
          { prime: 2n, exponent: 3 },
          { prime: 5n, exponent: 3 }
        ];
      } else if (x === 28n) {
        return [
          { prime: 2n, exponent: 2 },
          { prime: 7n, exponent: 1 }
        ];
      } else {
        // Simplified factorization for tests - not mathematically correct
        // but sufficient for testing
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
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
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
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 }
      ];
      const differentResult = cs.calculateXorSum(differentFactors);
      
      // Different factors should yield a different XOR sum
      expect(differentResult).not.toBe(result);
      
      // Test with registry for more accurate prime indices
      const withRegistryResult = cs.calculateXorSum(factors, mockPrimeRegistry);
      expect(typeof withRegistryResult).toBe('number');
    });
    
    test('calculateChecksum returns a prime for checksum', () => {
      const factors: Factor[] = [
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
      ];
      
      // Execute with the exported function
      const result = calculateChecksum(factors, mockPrimeRegistry);
      
      // Verify the result is a bigint 
      expect(typeof result).toBe('bigint');
      
      // Different factors should yield different checksums
      const otherFactors: Factor[] = [
        { prime: 2n, exponent: 2 },
        { prime: 3n, exponent: 1 }
      ];
      const otherResult = calculateChecksum(otherFactors, mockPrimeRegistry);
      expect(otherResult).not.toBe(result);
    });
    
    test('calculateChecksum caching works', () => {
      const factors: Factor[] = [
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
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
      expect(spy).not.toHaveBeenCalled();
      
      spy.mockRestore();
    });
    
    test('calculateChecksum disables caching when specified', () => {
      const factors: Factor[] = [
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
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
      expect(spy).toHaveBeenCalled();
      
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
      const value = 42n;
      const factors = mockPrimeRegistry.factor(value);
      
      // Calculate checksum and attach it
      const attachedValue = attachChecksum(value, factors, mockPrimeRegistry);
      
      // Verify the attached value is different from the original
      expect(attachedValue).not.toBe(value);
      
      // Check it's divisible by the original value
      expect(attachedValue % value).toBe(0n);
    });
    
    test('extractFactorsAndChecksum extracts and verifies checksums', () => {
      const value = 42n;
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
      const value = 42n;
      const factors = mockPrimeRegistry.factor(value);
      
      // Calculate checksum and attach it
      const attachedValue = attachChecksum(value, factors, mockPrimeRegistry);
      
      // Tamper with the value
      const tamperedValue = attachedValue + 1n;
      
      // Extraction should throw an error
      expect(() => {
        extractFactorsAndChecksum(tamperedValue, mockPrimeRegistry);
      }).toThrow();
    });
    
    test('round-trip checksum operation works', () => {
      const testValues = [42n, 60n, 1000n];
      
      for (const value of testValues) {
        const factors = mockPrimeRegistry.factor(value);
        
        // Attach checksum
        const attachedValue = attachChecksum(value, factors, mockPrimeRegistry);
        
        // Extract checksum and factors
        const extractionResult = extractFactorsAndChecksum(attachedValue, mockPrimeRegistry);
        
        // Reconstruct original value from core factors
        let reconstructed = 1n;
        for (const { prime, exponent } of extractionResult.coreFactors) {
          reconstructed *= prime ** BigInt(exponent);
        }
        
        // Verify we can reconstruct the original value
        expect(reconstructed).toBe(value);
      }
    });
    
    test('checksumPower affects the checksum size', () => {
      const value = 42n;
      const factors = mockPrimeRegistry.factor(value);
      
      // Create checksums with different powers
      const cs1 = createChecksums({ checksumPower: 2 });
      const cs2 = createChecksums({ checksumPower: 8 });
      
      // Attach checksums
      const attached1 = cs1.attachChecksum(value, factors, mockPrimeRegistry);
      const attached2 = cs2.attachChecksum(value, factors, mockPrimeRegistry);
      
      // The higher power should create a larger checksum
      expect(attached2).toBeGreaterThan(attached1);
    });
  });
  
  describe('Batch and Streaming Operations', () => {
    test('calculateBatchChecksum creates a single checksum for multiple values', () => {
      const values = [42n, 60n, 1000n];
      
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
      const values = [42n, 60n, 1000n];
      
      // Create checksummed values
      const checksummed = values.map(value => {
        const factors = mockPrimeRegistry.factor(value);
        return attachChecksum(value, factors, mockPrimeRegistry);
      });
      
      // Tamper with one value
      const tampered = [...checksummed];
      tampered[1] = tampered[1] + 1n;
      
      // Calculate batch checksums
      const originalChecksum = calculateBatchChecksum(checksummed, mockPrimeRegistry);
      const tamperedChecksum = calculateBatchChecksum(tampered, mockPrimeRegistry);
      
      // Should be different when a value is tampered with
      expect(tamperedChecksum).not.toBe(originalChecksum);
    });
    
    test('XorHash state can be updated incrementally', () => {
      const values = [42n, 60n, 1000n];
      
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
      const values = [42n, 60n, 1000n];
      
      // Create checksummed values
      const checksummed = values.map(value => {
        const factors = mockPrimeRegistry.factor(value);
        return attachChecksum(value, factors, mockPrimeRegistry);
      });
      
      // Add an invalid value
      const withInvalid = [...checksummed, 999n]; // 999n has no checksum
      
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
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
      ];
      
      const cs = createChecksums({ enableCache: true });
      
      // First calculation should be cached
      cs.calculateChecksum(factors, mockPrimeRegistry);
      
      // Spy on calculateXorSum
      const spy = jest.spyOn(cs, 'calculateXorSum');
      
      // Second calculation should use cache
      cs.calculateChecksum(factors, mockPrimeRegistry);
      expect(spy).not.toHaveBeenCalled();
      
      // Clear the cache
      cs.clearCache();
      
      // Third calculation should recompute
      cs.calculateChecksum(factors, mockPrimeRegistry);
      expect(spy).toHaveBeenCalled();
      
      spy.mockRestore();
    });
  });
});
