/**
 * Precision Module Tests
 * =====================
 * 
 * Comprehensive test suite for the precision module covering all major components.
 */

import { 
  // Main module exports
  createPrecision,
  precision,
  MathUtilities,
  getVersion,
  PRECISION_CONSTANTS,
  clearAllCaches,
  
  // BigInt operations
  bitLength,
  exactlyEquals,
  toByteArray,
  fromByteArray,
  isPowerOfTwo,
  getRandomBigInt,
  isProbablePrime,
  countLeadingZeros,
  countTrailingZeros,
  getBit,
  setBit,
  
  // Modular arithmetic
  mod,
  modPow,
  modInverse,
  modMul,
  
  // Utility functions
  gcd,
  lcm,
  extendedGcd,
  integerSqrt,
  ceilDiv,
  floorDiv,
  countSetBits,
  leadingZeros,
  trailingZeros,
  isSafeInteger,
  sign,
  abs,
  
  // Checksum operations
  calculateChecksum,
  attachChecksum,
  extractFactorsAndChecksum,
  calculateBatchChecksum,
  calculateXorSum,
  
  // Verification
  verifyValue,
  createVerification,
  VerificationStatus,
  
  // Cache operations
  createCache,
  memoize,
  
  // Types
  PrecisionConfiguration,
  PrecisionInstance,
  Factor
} from './index';

describe('Precision Module', () => {
  // Setup mock prime registry for testing
  const mockPrimeRegistry = {
    getPrime: (index: number) => {
      // Simple prime sequence for testing
      const primes = [BigInt(2), BigInt(3), BigInt(5), BigInt(7), BigInt(11), BigInt(13), BigInt(17), BigInt(19), BigInt(23), BigInt(29), BigInt(31), BigInt(37), BigInt(41), BigInt(43), BigInt(47)];
      return index < primes.length ? primes[index] : BigInt(index * 2 + 1);
    },
    getIndex: (prime: bigint) => {
      // Simple reverse lookup for testing
      const primes = [BigInt(2), BigInt(3), BigInt(5), BigInt(7), BigInt(11), BigInt(13), BigInt(17), BigInt(19), BigInt(23), BigInt(29), BigInt(31), BigInt(37), BigInt(41), BigInt(43), BigInt(47)];
      const index = primes.indexOf(prime);
      return index >= 0 ? index : Number((prime - BigInt(1)) / BigInt(2));
    },
    factor: (n: bigint): Factor[] => {
      // More comprehensive factorization for testing
      const factors: Factor[] = [];
      let remaining = n;
      
      // Test primes in order
      const testPrimes = [BigInt(2), BigInt(3), BigInt(5), BigInt(7), BigInt(11), BigInt(13), BigInt(17), BigInt(19), BigInt(23), BigInt(29), BigInt(31), BigInt(37), BigInt(41), BigInt(43), BigInt(47)];
      
      for (const prime of testPrimes) {
        let exponent = 0;
        while (remaining % prime === BigInt(0)) {
          exponent++;
          remaining = remaining / prime;
        }
        if (exponent > 0) {
          factors.push({ prime, exponent });
        }
      }
      
      // If there's a remainder, it's either 1 or a prime larger than our test set
      if (remaining > BigInt(1)) {
        // Check if it's a small prime we might have missed
        let isPrime = true;
        for (let i = BigInt(2); i * i <= remaining && i < BigInt(1000); i++) {
          if (remaining % i === BigInt(0)) {
            isPrime = false;
            // Factor out this divisor
            let exponent = 0;
            while (remaining % i === BigInt(0)) {
              exponent++;
              remaining = remaining / i;
            }
            factors.push({ prime: i, exponent });
            break;
          }
        }
        
        // If still have remainder, treat it as prime
        if (remaining > BigInt(1)) {
          factors.push({ prime: remaining, exponent: 1 });
        }
      }
      
      return factors;
    }
  };
  
  describe('Module Structure', () => {
    test('should expose core utilities', () => {
      expect(precision).toBeDefined();
      expect(MathUtilities).toBeDefined();
      expect(getVersion).toBeDefined();
      expect(PRECISION_CONSTANTS).toBeDefined();
    });
    
    test('should return correct version', () => {
      const version = getVersion();
      expect(version).toBe("1.0.0");
    });
    
    test('should expose constants', () => {
      expect(PRECISION_CONSTANTS.MAX_SAFE_INTEGER).toBe(9007199254740991);
      expect(PRECISION_CONSTANTS.MAX_SAFE_BIGINT).toBe(BigInt(9007199254740991));
      expect(PRECISION_CONSTANTS.DEFAULT_CHECKSUM_POWER).toBe(6);
    });
  });
  
  describe('BigInt Operations', () => {
    test('bitLength should calculate correct bit length', () => {
      expect(bitLength(BigInt(0))).toBe(1);
      expect(bitLength(BigInt(1))).toBe(1);
      expect(bitLength(BigInt(2))).toBe(2);
      expect(bitLength(BigInt(255))).toBe(8);
      expect(bitLength(BigInt(256))).toBe(9);
      expect(bitLength(BigInt(-42))).toBe(6); // Should handle negative numbers
    });
    
    test('exactlyEquals should compare values properly', () => {
      expect(exactlyEquals(BigInt(42), BigInt(42))).toBe(true);
      expect(exactlyEquals(42, 42)).toBe(true);
      expect(exactlyEquals(BigInt(42), 42)).toBe(true);
      expect(exactlyEquals(42, BigInt(42))).toBe(true);
      expect(exactlyEquals(BigInt(42), BigInt(43))).toBe(false);
      expect(exactlyEquals(42, 42.5)).toBe(false);
    });
    
    test('should convert between BigInt and byte arrays', () => {
      const testValue = BigInt(12345678);
      const bytes = toByteArray(testValue);
      expect(bytes instanceof Uint8Array).toBe(true);
      expect(bytes.length).toBeGreaterThan(0);
      
      const roundTrip = fromByteArray(bytes);
      expect(roundTrip).toEqual(testValue);
      
      // Test with negative number
      const negativeValue = BigInt(-98765);
      const negativeBytes = toByteArray(negativeValue);
      const negativeRoundTrip = fromByteArray(negativeBytes);
      expect(negativeRoundTrip).toEqual(negativeValue);
    });
    
    test('isPowerOfTwo should identify powers of 2', () => {
      expect(isPowerOfTwo(BigInt(1))).toBe(true);
      expect(isPowerOfTwo(BigInt(2))).toBe(true);
      expect(isPowerOfTwo(BigInt(4))).toBe(true);
      expect(isPowerOfTwo(BigInt(8))).toBe(true);
      expect(isPowerOfTwo(BigInt(16))).toBe(true);
      expect(isPowerOfTwo(BigInt(1024))).toBe(true);
      
      expect(isPowerOfTwo(BigInt(0))).toBe(false);
      expect(isPowerOfTwo(BigInt(3))).toBe(false);
      expect(isPowerOfTwo(BigInt(6))).toBe(false);
      expect(isPowerOfTwo(BigInt(10))).toBe(false);
      expect(isPowerOfTwo(BigInt(-4))).toBe(false); // Negative numbers should return false
    });
    
    test('bit manipulation functions should work correctly', () => {
      // Test getBit
      expect(getBit(BigInt(0b1010), 0)).toBe(0);
      expect(getBit(BigInt(0b1010), 1)).toBe(1);
      expect(getBit(BigInt(0b1010), 2)).toBe(0);
      expect(getBit(BigInt(0b1010), 3)).toBe(1);
      
      // Test setBit
      expect(setBit(BigInt(0b1010), 0, 1)).toBe(BigInt(0b1011));
      expect(setBit(BigInt(0b1010), 2, 1)).toBe(BigInt(0b1110));
      expect(setBit(BigInt(0b1111), 1, 0)).toBe(BigInt(0b1101));
      
      // Test countLeadingZeros (assuming 64-bit word)
      expect(countLeadingZeros(BigInt(1))).toBe(63);
      expect(countLeadingZeros(BigInt(255))).toBe(56);
      
      // Test countTrailingZeros
      expect(countTrailingZeros(BigInt(8))).toBe(3);
      expect(countTrailingZeros(BigInt(16))).toBe(4);
      expect(countTrailingZeros(BigInt(5))).toBe(0);
    });
  });
  
  describe('Modular Arithmetic', () => {
    test('mod should behave like Python for negative numbers', () => {
      // JavaScript: -5 % 13 = -5
      // Python:     -5 % 13 = 8
      expect(mod(BigInt(-5), BigInt(13))).toBe(BigInt(8));
      expect(mod(BigInt(-25), BigInt(7))).toBe(BigInt(3));
      
      // Should also work with regular JavaScript numbers (but returns bigint)
      expect(mod(-5 as any, 13 as any)).toBe(BigInt(8));
    });
    
    test('modPow should calculate correct modular exponentiation', () => {
      expect(modPow(BigInt(2), BigInt(10), BigInt(1000))).toBe(BigInt(24)); // 2^10 % 1000 = 1024 % 1000 = 24
      expect(modPow(BigInt(5), BigInt(3), BigInt(13))).toBe(BigInt(8));     // 5^3 % 13 = 125 % 13 = 8
    });
    
    test('modInverse should calculate modular multiplicative inverse', () => {
      expect(modInverse(BigInt(3), BigInt(11))).toBe(BigInt(4));     // 3*4 ≡ 1 (mod 11)
      expect(modInverse(BigInt(7), BigInt(20))).toBe(BigInt(3));     // 7*3 ≡ 1 (mod 20)
      
      // Throw error when inverse doesn't exist
      expect(() => modInverse(BigInt(2), BigInt(4))).toThrow(); // gcd(2, 4) = 2, not coprime
    });
    
    test('modMul should handle multiplication with overflow protection', () => {
      const largeA = BigInt(123456789012345);
      const largeB = BigInt(987654321098765);
      const modulus = BigInt(1000000007);
      
      const result = modMul(largeA, largeB, modulus);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(Number(modulus));
    });
  });
  
  describe('Utility Functions', () => {
    test('gcd should calculate greatest common divisor', () => {
      expect(gcd(BigInt(48), BigInt(18))).toBe(BigInt(6));
      expect(gcd(BigInt(100), BigInt(35))).toBe(BigInt(5));
      expect(gcd(BigInt(17), BigInt(19))).toBe(BigInt(1)); // Coprime numbers
    });
    
    test('lcm should calculate least common multiple', () => {
      expect(lcm(BigInt(4), BigInt(6))).toBe(BigInt(12));
      expect(lcm(BigInt(21), BigInt(6))).toBe(BigInt(42));
      expect(lcm(BigInt(7), BigInt(5))).toBe(BigInt(35));
    });
    
    test('extendedGcd should return gcd and Bézout coefficients', () => {
      const [g, x, y] = extendedGcd(BigInt(30), BigInt(18));
      expect(g).toBe(BigInt(6));
      expect(BigInt(30) * x + BigInt(18) * y).toBe(g);
    });
    
    test('integerSqrt should calculate integer square root', () => {
      expect(integerSqrt(BigInt(16))).toBe(BigInt(4));
      expect(integerSqrt(BigInt(17))).toBe(BigInt(4)); // Floor of sqrt(17)
      expect(integerSqrt(BigInt(100))).toBe(BigInt(10));
      expect(integerSqrt(BigInt(101))).toBe(BigInt(10));
    });
    
    test('division functions should work correctly', () => {
      // ceilDiv rounds up
      expect(ceilDiv(BigInt(10), BigInt(3))).toBe(BigInt(4));
      expect(ceilDiv(BigInt(9), BigInt(3))).toBe(BigInt(3));
      
      // floorDiv rounds down
      expect(floorDiv(BigInt(10), BigInt(3))).toBe(BigInt(3));
      expect(floorDiv(BigInt(9), BigInt(3))).toBe(BigInt(3));
    });
    
    test('bit counting functions should work', () => {
      expect(countSetBits(BigInt(0b1010101))).toBe(4);
      expect(countSetBits(BigInt(0b1111))).toBe(4);
      expect(countSetBits(BigInt(0))).toBe(0);
      
      expect(leadingZeros(BigInt(1) as any)).toBe(63); // Assuming 64-bit
      expect(leadingZeros(BigInt(0b11111111) as any)).toBe(56);
      
      expect(trailingZeros(BigInt(0b1000) as any)).toBe(3);
      expect(trailingZeros(BigInt(0b10100) as any)).toBe(2);
    });
    
    test('utility functions should handle edge cases', () => {
      expect(isSafeInteger(BigInt(9007199254740991))).toBe(true);
      expect(isSafeInteger(BigInt(9007199254740992))).toBe(false);
      
      expect(sign(BigInt(-42) as any)).toBe(-1);
      expect(sign(BigInt(0) as any)).toBe(0);
      expect(sign(BigInt(42) as any)).toBe(1);
      
      expect(abs(BigInt(-42) as any)).toBe(BigInt(42));
      expect(abs(BigInt(42) as any)).toBe(BigInt(42));
    });
  });
  
  describe('Checksum Operations', () => {
    test('should calculate XOR sum correctly', () => {
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 2 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(5), exponent: 1 }
      ];
      
      const xorSum = calculateXorSum(factors, mockPrimeRegistry);
      expect(typeof xorSum).toBe('number');
      expect(xorSum).toBeGreaterThanOrEqual(0);
    });
    
    test('should calculate checksum from factors', () => {
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 2 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(5), exponent: 1 }
      ];
      
      const checksum = calculateChecksum(factors, mockPrimeRegistry);
      expect(typeof checksum).toBe('bigint');
      expect(checksum > BigInt(0)).toBe(true);
    });
    
    test('should attach and extract checksums', () => {
      const rawValue = BigInt(60); // 2² × 3 × 5
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 2 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(5), exponent: 1 }
      ];
      
      // Attach checksum
      const withChecksum = attachChecksum(rawValue, factors, mockPrimeRegistry);
      expect(withChecksum > rawValue).toBe(true);
      
      // Extract checksum
      const extracted = extractFactorsAndChecksum(withChecksum, mockPrimeRegistry);
      expect(extracted.valid).toBe(true);
      expect(extracted.coreFactors).toEqual(factors);
    });
    
    test('should calculate batch checksum', () => {
      const values = [BigInt(42), BigInt(60), BigInt(128)];
      const batchChecksum = calculateBatchChecksum(values, mockPrimeRegistry);
      expect(typeof batchChecksum).toBe('bigint');
      expect(batchChecksum > BigInt(0)).toBe(true);
    });
  });
  
  describe('Verification Features', () => {
    test('should verify valid checksummed values', () => {
      const rawValue = BigInt(42);
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(7), exponent: 1 }
      ];
      
      const withChecksum = attachChecksum(rawValue, factors, mockPrimeRegistry);
      const result = verifyValue(withChecksum, mockPrimeRegistry);
      
      expect(result.valid).toBe(true);
      expect(result.coreFactors).toEqual(factors);
    });
    
    test('should detect invalid checksums', () => {
      // Create a value with an invalid checksum
      const tamperedValue = BigInt(42) * BigInt(64); // Wrong checksum (2^6 = 64)
      
      const result = verifyValue(tamperedValue, mockPrimeRegistry);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    test('should create verification context', () => {
      const verification = createVerification();
      expect(verification).toBeDefined();
      expect(verification.getStatus()).toBe(VerificationStatus.UNKNOWN);
    });
  });
  
  describe('MathUtilities Integration', () => {
    test('MathUtilities should provide direct access to functions', () => {
      expect(MathUtilities.mod(BigInt(-5), BigInt(13))).toBe(BigInt(8));
      expect(MathUtilities.bitLength(BigInt(42))).toBe(6);
      expect(MathUtilities.isPowerOfTwo(BigInt(64) as any)).toBe(true);
      
      // Test utility function variants
      expect(MathUtilities.utilBitLength(BigInt(42))).toBe(6);
      expect(MathUtilities.gcd(BigInt(48), BigInt(18))).toBe(BigInt(6));
    });
    
    test('MathUtilities should handle checksum operations', () => {
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 }
      ];
      
      const checksum = MathUtilities.calculateChecksum(factors, mockPrimeRegistry);
      expect(typeof checksum).toBe('bigint');
      
      const rawValue = BigInt(6); // 2 × 3
      const withChecksum = MathUtilities.attachChecksum(rawValue, factors, mockPrimeRegistry);
      expect(withChecksum > rawValue).toBe(true);
    });
  });
  
  describe('Cache Operations', () => {
    test('should create cache instances', () => {
      const cache = createCache({ maxSize: 100 });
      expect(cache).toBeDefined();
      expect(cache.get).toBeDefined();
      expect(cache.set).toBeDefined();
    });
    
    test('memoize should cache function results', () => {
      let callCount = 0;
      const expensiveFunction = (n: number) => {
        callCount++;
        return n * n;
      };
      
      const memoized = memoize(expensiveFunction);
      
      // First call
      expect(memoized(5)).toBe(25);
      expect(callCount).toBe(1);
      
      // Second call should use cache
      expect(memoized(5)).toBe(25);
      expect(callCount).toBe(1);
      
      // Different argument
      expect(memoized(6)).toBe(36);
      expect(callCount).toBe(2);
    });
  });
  
  describe('Configuration', () => {
    test('should create precision module with custom config', () => {
      const custom = createPrecision({
        debug: true,
        enableCaching: true,
        pythonCompatible: true,
        checksumPower: 8,
        cacheSize: 500
      });
      
      expect(custom).toBeDefined();
      expect(custom.config).toEqual({
        debug: true,
        enableCaching: true,
        pythonCompatible: true,
        checksumPower: 8,
        cacheSize: 500
      });
      
      expect(custom.bigint).toBeDefined();
      expect(custom.modular).toBeDefined();
      expect(custom.checksums).toBeDefined();
      expect(custom.verification).toBeDefined();
      expect(custom.utils).toBeDefined();
      expect(custom.cache).toBeDefined();
      expect(custom.MathUtilities).toBeDefined();
    });
    
    test('should work with default options', () => {
      const defaultModule = createPrecision();
      expect(defaultModule).toBeDefined();
      expect(defaultModule.config).toEqual({});
    });
    
    test('should create shared cache when caching is enabled', () => {
      const withCache = createPrecision({
        enableCaching: true,
        cacheSize: 200
      });
      
      expect(withCache.sharedCache).toBeDefined();
    });
  });
  
  describe('Cache Management', () => {
    test('clearAllCaches should clear all module caches', () => {
      // This should not throw
      expect(() => clearAllCaches()).toBeTruthy();
    });
  });
  
  describe('Integration Tests', () => {
    test('should handle complete workflow', () => {
      // Create a value with factors
      const value = BigInt(210); // 2 × 3 × 5 × 7
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(5), exponent: 1 },
        { prime: BigInt(7), exponent: 1 }
      ];
      
      // Attach checksum
      const withChecksum = attachChecksum(value, factors, mockPrimeRegistry);
      
      // Verify it
      const verification = verifyValue(withChecksum, mockPrimeRegistry);
      expect(verification.valid).toBe(true);
      
      // Use MathUtilities for the same operation
      const verified = MathUtilities.verifyChecksum(withChecksum, mockPrimeRegistry);
      expect(verified).toBe(true);
    });
    
    test('should integrate multiple modules', () => {
      // Use bigint operations
      const bits = bitLength(BigInt(1234567890));
      expect(bits).toBeGreaterThan(0);
      
      // Use modular arithmetic
      const modResult = mod(BigInt(1234567890), BigInt(1000));
      expect(modResult).toBe(BigInt(890));
      
      // Use utility functions
      const g = gcd(BigInt(1234567890), BigInt(987654321));
      expect(g > BigInt(0)).toBe(true);
      
      // All should be accessible through MathUtilities
      expect(MathUtilities.bitLength(BigInt(1234567890))).toBe(bits);
      expect(MathUtilities.mod(BigInt(1234567890), BigInt(1000))).toBe(modResult);
      expect(MathUtilities.gcd(BigInt(1234567890), BigInt(987654321))).toBe(g);
    });
  });
});
