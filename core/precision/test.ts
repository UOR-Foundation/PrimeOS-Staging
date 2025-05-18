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
  
  // Utilities
  bitLength,
  exactlyEquals,
  toByteArray,
  fromByteArray,
  isPowerOfTwo,
  
  // Modular arithmetic
  mod,
  modPow,
  modInverse,
  
  // Verification
  verifyValue,
  createVerification,
  VerificationStatus,
  
  // Types
  PrecisionConfig,
  Factor,
  PrecisionInterface,
  PrecisionResult,
  PrecisionStatus
} from './index';

describe('Precision Module', () => {
  // Setup mock prime registry for testing
  const mockPrimeRegistry = {
    getPrime: (index: number) => BigInt(index * 2 + 1),
    getIndex: (prime: bigint) => Number((prime - 1n) / 2n),
    factor: (n: bigint): Factor[] => {
      // Simple factorization for testing
      const factors: Factor[] = [];
      
      // Special case for testing
      if (n === 42n) {
        factors.push({ prime: 2n, exponent: 1 });
        factors.push({ prime: 3n, exponent: 1 });
        factors.push({ prime: 7n, exponent: 1 });
      } else if (n === 60n) {
        factors.push({ prime: 2n, exponent: 2 });
        factors.push({ prime: 3n, exponent: 1 });
        factors.push({ prime: 5n, exponent: 1 });
      } else {
        // Simple prime check
        if (n > 1n) {
          let isPrime = true;
          for (let i = 2n; i * i <= n; i++) {
            if (n % i === 0n) {
              isPrime = false;
              break;
            }
          }
          
          if (isPrime) {
            factors.push({ prime: n, exponent: 1 });
          } else {
            // Simple factorization for test cases
            factors.push({ prime: 2n, exponent: 1 });
            factors.push({ prime: n / 2n, exponent: 1 });
          }
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
      expect(PRECISION_CONSTANTS.MAX_SAFE_BIGINT).toBe(9007199254740991n);
      expect(PRECISION_CONSTANTS.DEFAULT_CHECKSUM_POWER).toBe(6);
    });
  });
  
  describe('Utility Functions', () => {
    test('bitLength should calculate correct bit length', () => {
      expect(bitLength(0n)).toBe(1);
      expect(bitLength(1n)).toBe(1);
      expect(bitLength(2n)).toBe(2);
      expect(bitLength(255n)).toBe(8);
      expect(bitLength(256n)).toBe(9);
      expect(bitLength(-42n)).toBe(6); // Should handle negative numbers
    });
    
    test('exactlyEquals should compare values properly', () => {
      expect(exactlyEquals(42n, 42n)).toBe(true);
      expect(exactlyEquals(42, 42)).toBe(true);
      expect(exactlyEquals(42n, 42)).toBe(true);
      expect(exactlyEquals(42, 42n)).toBe(true);
      expect(exactlyEquals(42n, 43n)).toBe(false);
      expect(exactlyEquals(42, 42.5)).toBe(false);
    });
    
    test('should convert between BigInt and byte arrays', () => {
      const testValue = 12345678n;
      const bytes = toByteArray(testValue);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBeGreaterThan(0);
      
      const roundTrip = fromByteArray(bytes);
      expect(roundTrip).toEqual(testValue);
      
      // Test with negative number
      const negativeValue = -98765n;
      const negativeBytes = toByteArray(negativeValue);
      const negativeRoundTrip = fromByteArray(negativeBytes);
      expect(negativeRoundTrip).toEqual(negativeValue);
    });
    
    test('isPowerOfTwo should identify powers of 2', () => {
      expect(isPowerOfTwo(1n)).toBe(true);
      expect(isPowerOfTwo(2n)).toBe(true);
      expect(isPowerOfTwo(4n)).toBe(true);
      expect(isPowerOfTwo(8n)).toBe(true);
      expect(isPowerOfTwo(16n)).toBe(true);
      expect(isPowerOfTwo(1024n)).toBe(true);
      
      expect(isPowerOfTwo(0n)).toBe(false);
      expect(isPowerOfTwo(3n)).toBe(false);
      expect(isPowerOfTwo(6n)).toBe(false);
      expect(isPowerOfTwo(10n)).toBe(false);
      expect(isPowerOfTwo(-4n)).toBe(false); // Negative numbers should return false
    });
  });
  
  describe('Modular Arithmetic', () => {
    test('mod should behave like Python for negative numbers', () => {
      // JavaScript: -5 % 13 = -5
      // Python:     -5 % 13 = 8
      expect(mod(-5n, 13n)).toBe(8n);
      expect(mod(-25n, 7n)).toBe(3n);
      
      // Should also work with regular JavaScript numbers
      expect(mod(-5, 13)).toBe(8);
    });
    
    test('modPow should calculate correct modular exponentiation', () => {
      expect(modPow(2n, 10n, 1000n)).toBe(24n); // 2^10 % 1000 = 1024 % 1000 = 24
      expect(modPow(5n, 3n, 13n)).toBe(8n);     // 5^3 % 13 = 125 % 13 = 8
      
      // With negative exponent (should use modular inverse)
      expect(modPow(2n, -1n, 11n)).toBe(6n);    // 2^(-1) mod 11 = 6 (inverse)
    });
    
    test('modInverse should calculate modular multiplicative inverse', () => {
      expect(modInverse(3n, 11n)).toBe(4n);     // 3*4 ≡ 1 (mod 11)
      expect(modInverse(7n, 20n)).toBe(3n);     // 7*3 ≡ 1 (mod 20)
      
      // Throw error when inverse doesn't exist
      expect(() => modInverse(2n, 4n)).toThrow(); // gcd(2, 4) = 2, not coprime
    });
  });
  
  describe('Verification Features', () => {
    // Skip detailed tests for verification module as they are in their own test file
    test('should expose verification functions', () => {
      expect(verifyValue).toBeDefined();
      expect(createVerification).toBeDefined();
      expect(VerificationStatus).toBeDefined();
    });
  });
  
  describe('MathUtilities integration', () => {
    test('MathUtilities should provide direct access to functions', () => {
      expect(MathUtilities.mod(-5n, 13n)).toBe(8n);
      expect(MathUtilities.bitLength(42n)).toBe(6);
      expect(MathUtilities.isPowerOfTwo(64n)).toBe(true);
    });
  });
  
  describe('Configuration', () => {
    test('should create precision module with custom config', () => {
      const custom = createPrecision({
        debug: true,
        enableCaching: true,
        pythonCompatible: true,
        checksumPower: 8
      });
      
      expect(custom).toBeDefined();
      expect(custom.config).toEqual({
        debug: true,
        enableCaching: true,
        pythonCompatible: true,
        checksumPower: 8
      });
    });
    
    test('should work with default options', () => {
      const defaultModule = createPrecision();
      expect(defaultModule).toBeDefined();
      expect(defaultModule.config).toEqual({});
    });
  });
  
  describe('Implementation interface', () => {
    // Test the core interface methods
    let instance: ReturnType<typeof createPrecision>;
    
    beforeEach(() => {
      instance = createPrecision({
        debug: true
      });
    });
    
    test('should provide access to all submodules', () => {
      expect(instance.bigint).toBeDefined();
      expect(instance.modular).toBeDefined();
      expect(instance.checksums).toBeDefined();
      expect(instance.verification).toBeDefined();
      expect(instance.utils).toBeDefined();
      expect(instance.MathUtilities).toBeDefined();
    });
    
    // Other implementation tests would go here
  });
});
