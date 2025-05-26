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
      expect(mockPrimeRegistry.getPrime(0)).toBe(BigInt(3));
      expect(mockPrimeRegistry.getPrime(1)).toBe(BigInt(5));
      expect(mockPrimeRegistry.getPrime(2)).toBe(BigInt(7));
      expect(mockPrimeRegistry.getPrime(3)).toBe(BigInt(9));
    });
    
    test('getIndex returns expected values', () => {
      expect(mockPrimeRegistry.getIndex(BigInt(3))).toBe(0);
      expect(mockPrimeRegistry.getIndex(BigInt(5))).toBe(1);
      expect(mockPrimeRegistry.getIndex(BigInt(7))).toBe(2);
    });
    
    test('factor returns expected factors', () => {
      const factors42 = mockPrimeRegistry.factor(BigInt(42));
      expect(factors42).toHaveLength(3);
      expect(factors42[0].prime).toBe(BigInt(2));
      expect(factors42[0].exponent).toBe(1);
      expect(factors42[1].prime).toBe(BigInt(3));
      expect(factors42[1].exponent).toBe(1);
      expect(factors42[2].prime).toBe(BigInt(7));
      expect(factors42[2].exponent).toBe(1);
      
      const factors30 = mockPrimeRegistry.factor(BigInt(30));
      expect(factors30).toHaveLength(3);
      expect(factors30[0].prime).toBe(BigInt(2));
      expect(factors30[0].exponent).toBe(1);
      expect(factors30[1].prime).toBe(BigInt(3));
      expect(factors30[1].exponent).toBe(1);
      expect(factors30[2].prime).toBe(BigInt(5));
      expect(factors30[2].exponent).toBe(1);
      
      // Unknown value returns empty array
      const factorsUnknown = mockPrimeRegistry.factor(BigInt(99));
      expect(factorsUnknown).toHaveLength(0);
    });
  });
  
  describe('Mock Checksums', () => {
    test('extractFactorsAndChecksum returns expected values', () => {
      const result42 = mockChecksums.extractFactorsAndChecksum(BigInt(42));
      expect(result42.coreFactors).toHaveLength(3);
      expect(result42.checksumPrime).toBe(BigInt(11));
      
      const result30 = mockChecksums.extractFactorsAndChecksum(BigInt(30));
      expect(result30.coreFactors).toHaveLength(3);
      expect(result30.checksumPrime).toBe(BigInt(7));
      
      const result100 = mockChecksums.extractFactorsAndChecksum(BigInt(100));
      expect(result100.coreFactors).toHaveLength(2);
      expect(result100.checksumPrime).toBe(BigInt(13));
    });
    
    test('extractFactorsAndChecksum throws for unknown values', () => {
      expect(() => mockChecksums.extractFactorsAndChecksum(BigInt(99))).toThrow();
    });
    
    test('calculateChecksum returns expected values', () => {
      const checksum1 = mockChecksums.calculateChecksum([
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(7), exponent: 1 }
      ]);
      expect(checksum1).toBe(BigInt(11));
      
      const checksum2 = mockChecksums.calculateChecksum([
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(5), exponent: 1 }
      ]);
      expect(checksum2).toBe(BigInt(7));
      
      const checksum3 = mockChecksums.calculateChecksum([
        { prime: BigInt(2), exponent: 2 },
        { prime: BigInt(5), exponent: 2 }
      ]);
      expect(checksum3).toBe(BigInt(13));
      
      // Unknown combination returns BigInt(0)
      const checksumUnknown = mockChecksums.calculateChecksum([
        { prime: BigInt(11), exponent: 1 },
        { prime: BigInt(13), exponent: 1 }
      ]);
      expect(checksumUnknown).toBe(BigInt(0));
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
      expect(mockErrorResult.error?.expected).toBe(BigInt(11));
      expect(mockErrorResult.error?.actual).toBe(BigInt(13));
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
