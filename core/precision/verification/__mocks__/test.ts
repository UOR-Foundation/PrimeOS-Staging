/**
 * Tests for the verification module mocks
 */

import { 
  mockPrimeRegistry,
  mockChecksums,
  mockVerificationResults,
  mockErrorResult,
  MockCache
} from './test-mock';

describe('Verification Module Test Mocks', () => {
  describe('Mock Prime Registry', () => {
    test('getPrime returns expected values', () => {
      expect(mockPrimeRegistry.getPrime(0)).toBe(3n);
      expect(mockPrimeRegistry.getPrime(1)).toBe(5n);
      expect(mockPrimeRegistry.getPrime(2)).toBe(7n);
      expect(mockPrimeRegistry.getPrime(3)).toBe(9n);
    });
    
    test('getIndex returns expected values', () => {
      expect(mockPrimeRegistry.getIndex(3n)).toBe(0);
      expect(mockPrimeRegistry.getIndex(5n)).toBe(1);
      expect(mockPrimeRegistry.getIndex(7n)).toBe(2);
    });
    
    test('factor returns expected factors', () => {
      const factors42 = mockPrimeRegistry.factor(42n);
      expect(factors42).toHaveLength(3);
      expect(factors42[0].prime).toBe(2n);
      expect(factors42[0].exponent).toBe(1);
      expect(factors42[1].prime).toBe(3n);
      expect(factors42[1].exponent).toBe(1);
      expect(factors42[2].prime).toBe(7n);
      expect(factors42[2].exponent).toBe(1);
      
      const factors30 = mockPrimeRegistry.factor(30n);
      expect(factors30).toHaveLength(3);
      expect(factors30[0].prime).toBe(2n);
      expect(factors30[0].exponent).toBe(1);
      expect(factors30[1].prime).toBe(3n);
      expect(factors30[1].exponent).toBe(1);
      expect(factors30[2].prime).toBe(5n);
      expect(factors30[2].exponent).toBe(1);
      
      // Unknown value returns empty array
      const factorsUnknown = mockPrimeRegistry.factor(99n);
      expect(factorsUnknown).toHaveLength(0);
    });
  });
  
  describe('Mock Checksums', () => {
    test('extractFactorsAndChecksum returns expected values', () => {
      const result42 = mockChecksums.extractFactorsAndChecksum(42n);
      expect(result42.coreFactors).toHaveLength(3);
      expect(result42.checksumPrime).toBe(11n);
      
      const result30 = mockChecksums.extractFactorsAndChecksum(30n);
      expect(result30.coreFactors).toHaveLength(3);
      expect(result30.checksumPrime).toBe(7n);
      
      const result100 = mockChecksums.extractFactorsAndChecksum(100n);
      expect(result100.coreFactors).toHaveLength(2);
      expect(result100.checksumPrime).toBe(13n);
    });
    
    test('extractFactorsAndChecksum throws for unknown values', () => {
      expect(() => mockChecksums.extractFactorsAndChecksum(99n)).toThrow();
    });
    
    test('calculateChecksum returns expected values', () => {
      const checksum1 = mockChecksums.calculateChecksum([
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 1 },
        { prime: 7n, exponent: 1 }
      ]);
      expect(checksum1).toBe(11n);
      
      const checksum2 = mockChecksums.calculateChecksum([
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 1 },
        { prime: 5n, exponent: 1 }
      ]);
      expect(checksum2).toBe(7n);
      
      const checksum3 = mockChecksums.calculateChecksum([
        { prime: 2n, exponent: 2 },
        { prime: 5n, exponent: 2 }
      ]);
      expect(checksum3).toBe(13n);
      
      // Unknown combination returns 0n
      const checksumUnknown = mockChecksums.calculateChecksum([
        { prime: 11n, exponent: 1 },
        { prime: 13n, exponent: 1 }
      ]);
      expect(checksumUnknown).toBe(0n);
    });
  });
  
  describe('Mock Verification Results', () => {
    test('mockVerificationResults contains expected results', () => {
      expect(mockVerificationResults).toHaveLength(3);
      expect(mockVerificationResults[0].valid).toBe(true);
      expect(mockVerificationResults[1].valid).toBe(true);
      expect(mockVerificationResults[2].valid).toBe(true);
    });
    
    test('mockErrorResult contains expected error information', () => {
      expect(mockErrorResult.valid).toBe(false);
      expect(mockErrorResult.error).toBeDefined();
      expect(mockErrorResult.error?.expected).toBe(11n);
      expect(mockErrorResult.error?.actual).toBe(13n);
      expect(mockErrorResult.error?.message).toBe('Checksum verification failed');
    });
  });
  
  describe('Mock Cache', () => {
    test('cache operations work correctly', () => {
      const cache = new MockCache<string, number>(3);
      
      // Set some values
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      
      // Get values (hits)
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      
      // Get non-existent value (miss)
      expect(cache.get('d')).toBeUndefined();
      
      // Check stats
      const stats = cache.getStats();
      expect(stats.size).toBe(3);
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(1);
      
      // Add one more value (should evict oldest)
      cache.set('d', 4);
      
      // 'a' should be evicted
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      
      // Clear cache
      cache.clear();
      
      // Stats should be reset
      const statsAfterClear = cache.getStats();
      expect(statsAfterClear.size).toBe(0);
      expect(statsAfterClear.hits).toBe(0);
      expect(statsAfterClear.misses).toBe(0);
    });
  });
});
