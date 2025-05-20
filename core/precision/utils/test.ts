/**
 * Utility Module Tests
 * =================
 * 
 * Tests for the utility functions in the precision module.
 */

import {
  bitLength,
  exactlyEquals,
  toByteArray,
  fromByteArray,
  isSafeInteger,
  sign,
  abs,
  isPowerOfTwo,
  gcd,
  lcm,
  extendedGcd,
  integerSqrt,
  ceilDiv,
  floorDiv,
  countSetBits,
  leadingZeros,
  trailingZeros,
  createMathUtils,
  createMathUtilsModel,
  createAndInitializeMathUtilsModel,
  MathUtilsImpl,
  UTILITY_CONSTANTS
} from './index';
import { ModelLifecycleState } from '../../../os/model/types';

// Mock the os/model, os/logging, and cache modules to use our mock implementations
jest.mock('../../../os/model', () => require('./__mocks__/os-model-mock'));
jest.mock('../../../os/logging', () => require('./__mocks__/logging'));
jest.mock('../cache');

describe('Utility Functions', () => {
  // New tests for GCD and LCM
  describe('gcd', () => {
    test('calculates greatest common divisor correctly', () => {
      expect(gcd(48, 18)).toBe(6n);
      expect(gcd(48n, 18n)).toBe(6n);
      expect(gcd(101, 13)).toBe(1n);
      expect(gcd(0, 5)).toBe(5n);
      expect(gcd(5, 0)).toBe(5n);
    });
    
    test('handles negative numbers', () => {
      expect(gcd(-48, 18)).toBe(6n);
      expect(gcd(48, -18)).toBe(6n);
      expect(gcd(-48, -18)).toBe(6n);
    });
    
    test('handles deep recursion correctly', () => {
      // Test with Fibonacci numbers which require deep recursion
      expect(gcd(610, 987)).toBe(1n);
      expect(gcd(610n, 987n)).toBe(1n);
      
      // Test with large numbers
      expect(gcd(123456789, 987654321)).toBe(9n);
      expect(gcd(123456789n, 987654321n)).toBe(9n);
      
      // Test with mixed number and BigInt
      expect(gcd(123456789, 987654321n)).toBe(9n);
      expect(gcd(123456789n, 987654321)).toBe(9n);
    });
    
    test('handles stack overflow prevention', () => {
      // These numbers would cause a stack overflow with naive recursion
      const a = 2n ** 100n - 1n;
      const b = 2n ** 99n - 1n;
      expect(() => gcd(a, b)).not.toThrow();
      expect(gcd(a, b)).toBe(1n);
    });
  });
  
  describe('lcm', () => {
    test('calculates least common multiple correctly', () => {
      expect(lcm(4, 6)).toBe(12n);
      expect(lcm(4n, 6n)).toBe(12n);
      expect(lcm(15, 20)).toBe(60n);
      expect(lcm(7, 11)).toBe(77n);
    });
    
    test('handles zero inputs', () => {
      expect(lcm(0, 5)).toBe(0n);
      expect(lcm(5, 0)).toBe(0n);
      expect(lcm(0, 0)).toBe(0n);
    });
  });
  
  describe('extendedGcd', () => {
    test('calculates correct Bézout coefficients', () => {
      // gcd(35, 15) = 5 = 35*(-1) + 15*3
      const [g, x, y] = extendedGcd(35, 15);
      expect(g).toBe(5n);
      expect(35n * x + 15n * y).toBe(5n);
      
      // Another example: gcd(101, 13) = 1 = 101*4 + 13*(-31)
      const [g2, x2, y2] = extendedGcd(101, 13);
      expect(g2).toBe(1n);
      expect(101n * x2 + 13n * y2).toBe(1n);
    });
    
    test('works with one zero input', () => {
      // gcd(0, 5) = 5, with coefficients (0, 1)
      const [g, x, y] = extendedGcd(0, 5);
      expect(g).toBe(5n);
      expect(x).toBe(0n);
      expect(y).toBe(1n);
      
      // gcd(7, 0) = 7, with coefficients (1, 0)
      const [g2, x2, y2] = extendedGcd(7, 0);
      expect(g2).toBe(7n);
      expect(x2).toBe(1n);
      expect(y2).toBe(0n);
    });
  });
  
  describe('integerSqrt', () => {
    test('calculates integer square root correctly', () => {
      expect(integerSqrt(0)).toBe(0n);
      expect(integerSqrt(1)).toBe(1n);
      expect(integerSqrt(4)).toBe(2n);
      expect(integerSqrt(9)).toBe(3n);
      expect(integerSqrt(16)).toBe(4n);
      expect(integerSqrt(25)).toBe(5n);
    });
    
    test('rounds down for non-perfect squares', () => {
      expect(integerSqrt(2)).toBe(1n);
      expect(integerSqrt(3)).toBe(1n);
      expect(integerSqrt(5)).toBe(2n);
      expect(integerSqrt(8)).toBe(2n);
      expect(integerSqrt(10)).toBe(3n);
      expect(integerSqrt(99)).toBe(9n);
    });
    
    test('works with large numbers', () => {
      expect(integerSqrt(10000n)).toBe(100n);
      expect(integerSqrt(1000000n)).toBe(1000n);
      expect(integerSqrt(10000000000n)).toBe(100000n);
    });
  });
  
  describe('ceilDiv and floorDiv', () => {
    test('ceilDiv rounds up division results', () => {
      expect(ceilDiv(10, 3)).toBe(4n);
      expect(ceilDiv(9, 3)).toBe(3n);
      expect(ceilDiv(11, 3)).toBe(4n);
      expect(ceilDiv(0, 5)).toBe(0n);
    });
    
    test('floorDiv rounds down division results', () => {
      expect(floorDiv(10, 3)).toBe(3n);
      expect(floorDiv(9, 3)).toBe(3n);
      expect(floorDiv(11, 3)).toBe(3n);
      expect(floorDiv(0, 5)).toBe(0n);
    });
    
    test('handles negative numbers correctly', () => {
      expect(ceilDiv(-10, 3)).toBe(-3n);
      expect(floorDiv(-10, 3)).toBe(-4n);
      expect(ceilDiv(10, -3)).toBe(-3n);
      expect(floorDiv(10, -3)).toBe(-4n);
    });
    
    test('throws on division by zero', () => {
      expect(() => ceilDiv(10, 0)).toThrow();
      expect(() => floorDiv(10, 0)).toThrow();
    });
  });
  
  describe('bit counting functions', () => {
    test('countSetBits counts 1 bits correctly', () => {
      expect(countSetBits(0)).toBe(0);
      expect(countSetBits(1)).toBe(1);
      expect(countSetBits(2)).toBe(1);
      expect(countSetBits(3)).toBe(2);
      expect(countSetBits(7)).toBe(3);
      expect(countSetBits(15)).toBe(4);
      expect(countSetBits(255)).toBe(8);
    });
    
    test('leadingZeros counts leading zeros correctly', () => {
      expect(leadingZeros(0)).toBe(64);
      expect(leadingZeros(1)).toBe(63);
      expect(leadingZeros(2)).toBe(62);
      expect(leadingZeros(4)).toBe(61);
      expect(leadingZeros(8)).toBe(60);
      expect(leadingZeros(16)).toBe(59);
    });
    
    test('trailingZeros counts trailing zeros correctly', () => {
      expect(trailingZeros(0)).toBe(64);
      expect(trailingZeros(1)).toBe(0);
      expect(trailingZeros(2)).toBe(1);
      expect(trailingZeros(4)).toBe(2);
      expect(trailingZeros(8)).toBe(3);
      expect(trailingZeros(16)).toBe(4);
      expect(trailingZeros(32)).toBe(5);
    });
  });
  describe('bitLength', () => {
    test('calculates bit length for positive numbers', () => {
      expect(bitLength(0)).toBe(1);
      expect(bitLength(1)).toBe(1);
      expect(bitLength(2)).toBe(2);
      expect(bitLength(3)).toBe(2);
      expect(bitLength(4)).toBe(3);
      expect(bitLength(7)).toBe(3);
      expect(bitLength(8)).toBe(4);
      expect(bitLength(255)).toBe(8);
      expect(bitLength(256)).toBe(9);
    });
    
    test('calculates bit length for negative numbers', () => {
      expect(bitLength(-1)).toBe(1);
      expect(bitLength(-2)).toBe(2);
      expect(bitLength(-3)).toBe(2);
      expect(bitLength(-4)).toBe(3);
      expect(bitLength(-7)).toBe(3);
      expect(bitLength(-8)).toBe(4);
      expect(bitLength(-255)).toBe(8);
      expect(bitLength(-256)).toBe(9);
    });
    
    test('calculates bit length for BigInt values', () => {
      expect(bitLength(0n)).toBe(1);
      expect(bitLength(1n)).toBe(1);
      expect(bitLength(2n)).toBe(2);
      expect(bitLength(3n)).toBe(2);
      expect(bitLength(4n)).toBe(3);
      expect(bitLength(7n)).toBe(3);
      expect(bitLength(8n)).toBe(4);
      expect(bitLength(255n)).toBe(8);
      expect(bitLength(256n)).toBe(9);
      expect(bitLength(BigInt(Number.MAX_SAFE_INTEGER))).toBe(54);
      
      // Test large BigInt values
      expect(bitLength(1n << 100n)).toBe(101);
      expect(bitLength(1n << 1000n)).toBe(1001);
    });
    
    test('calculates bit length for negative BigInt values', () => {
      expect(bitLength(-1n)).toBe(1);
      expect(bitLength(-2n)).toBe(2);
      expect(bitLength(-3n)).toBe(2);
      expect(bitLength(-4n)).toBe(3);
      expect(bitLength(-7n)).toBe(3);
      expect(bitLength(-8n)).toBe(4);
      expect(bitLength(-255n)).toBe(8);
      expect(bitLength(-256n)).toBe(9);
      expect(bitLength(-BigInt(Number.MAX_SAFE_INTEGER))).toBe(54);
      
      // Test large negative BigInt values
      expect(bitLength(-(1n << 100n))).toBe(101);
      expect(bitLength(-(1n << 1000n))).toBe(1001);
    });
  });
  
  describe('exactlyEquals', () => {
    test('compares same-type values', () => {
      expect(exactlyEquals(0, 0)).toBe(true);
      expect(exactlyEquals(1, 1)).toBe(true);
      expect(exactlyEquals(1, 2)).toBe(false);
      expect(exactlyEquals(0n, 0n)).toBe(true);
      expect(exactlyEquals(1n, 1n)).toBe(true);
      expect(exactlyEquals(1n, 2n)).toBe(false);
      expect(exactlyEquals('a', 'a')).toBe(true);
      expect(exactlyEquals('a', 'b')).toBe(false);
    });
    
    test('compares number and BigInt values', () => {
      expect(exactlyEquals(0, 0n)).toBe(true);
      expect(exactlyEquals(1, 1n)).toBe(true);
      expect(exactlyEquals(2, 2n)).toBe(true);
      expect(exactlyEquals(1, 2n)).toBe(false);
      expect(exactlyEquals(2, 1n)).toBe(false);
      expect(exactlyEquals(0n, 0)).toBe(true);
      expect(exactlyEquals(1n, 1)).toBe(true);
      expect(exactlyEquals(2n, 2)).toBe(true);
      expect(exactlyEquals(1n, 2)).toBe(false);
      expect(exactlyEquals(2n, 1)).toBe(false);
    });
    
    test('handles non-integer number to BigInt comparisons', () => {
      expect(exactlyEquals(1.5, 1n)).toBe(false);
      expect(exactlyEquals(1n, 1.5)).toBe(false);
    });
    
    test('handles different types that cannot be compared', () => {
      expect(exactlyEquals(1, '1')).toBe(false);
      expect(exactlyEquals(1n, '1')).toBe(false);
      expect(exactlyEquals('1', 1)).toBe(false);
      expect(exactlyEquals('1', 1n)).toBe(false);
      expect(exactlyEquals(null, undefined)).toBe(false);
      expect(exactlyEquals([], {})).toBe(false);
    });
  });
  
  describe('toByteArray and fromByteArray', () => {
    test('converts numbers to byte arrays and back', () => {
      const testCases = [
        0, 1, 255, 256, 65535, 65536, 16777215, 16777216,
        -1, -255, -256, -65535, -65536
      ];
      
      for (const value of testCases) {
        const bytes = toByteArray(value);
        const result = fromByteArray(bytes);
        expect(result).toBe(BigInt(value));
      }
    });
    
    test('converts BigInt values to byte arrays and back', () => {
      const testCases = [
        0n, 1n, 255n, 256n, 65535n, 65536n, 16777215n, 16777216n,
        -1n, -255n, -256n, -65535n, -65536n,
        1n << 100n, -(1n << 100n)
      ];
      
      for (const value of testCases) {
        const bytes = toByteArray(value);
        const result = fromByteArray(bytes);
        expect(result).toBe(value);
      }
    });
    
    test('handles zero correctly', () => {
      const bytes = toByteArray(0);
      expect(bytes.length).toBe(1);
      expect(bytes[0]).toBe(0);
      expect(fromByteArray(bytes)).toBe(0n);
    });
    
    test('handles negative values correctly', () => {
      const bytes = toByteArray(-123);
      expect(bytes[bytes.length - 1]).toBe(0xFF); // Sign byte
      expect(fromByteArray(bytes)).toBe(-123n);
    });
  });
  
  describe('isSafeInteger', () => {
    test('identifies safe integers', () => {
      expect(isSafeInteger(0)).toBe(true);
      expect(isSafeInteger(1)).toBe(true);
      expect(isSafeInteger(-1)).toBe(true);
      expect(isSafeInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(isSafeInteger(Number.MIN_SAFE_INTEGER)).toBe(true);
      expect(isSafeInteger(0n)).toBe(true);
      expect(isSafeInteger(1n)).toBe(true);
      expect(isSafeInteger(-1n)).toBe(true);
      expect(isSafeInteger(BigInt(Number.MAX_SAFE_INTEGER))).toBe(true);
      expect(isSafeInteger(BigInt(Number.MIN_SAFE_INTEGER))).toBe(true);
    });
    
    test('identifies unsafe integers', () => {
      expect(isSafeInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
      expect(isSafeInteger(Number.MIN_SAFE_INTEGER - 1)).toBe(false);
      expect(isSafeInteger(BigInt(Number.MAX_SAFE_INTEGER) + 1n)).toBe(false);
      expect(isSafeInteger(BigInt(Number.MIN_SAFE_INTEGER) - 1n)).toBe(false);
      expect(isSafeInteger(1.5)).toBe(false);
    });
  });
  
  describe('sign', () => {
    test('returns correct sign for numbers', () => {
      expect(sign(0)).toBe(0);
      expect(sign(1)).toBe(1);
      expect(sign(100)).toBe(1);
      expect(sign(-1)).toBe(-1);
      expect(sign(-100)).toBe(-1);
    });
    
    test('returns correct sign for BigInt values', () => {
      expect(sign(0n)).toBe(0);
      expect(sign(1n)).toBe(1);
      expect(sign(100n)).toBe(1);
      expect(sign(-1n)).toBe(-1);
      expect(sign(-100n)).toBe(-1);
    });
  });
  
  describe('abs', () => {
    test('returns absolute value for numbers', () => {
      expect(abs(0)).toBe(0);
      expect(abs(1)).toBe(1);
      expect(abs(-1)).toBe(1);
      expect(abs(100)).toBe(100);
      expect(abs(-100)).toBe(100);
    });
    
    test('returns absolute value for BigInt values', () => {
      expect(abs(0n)).toBe(0n);
      expect(abs(1n)).toBe(1n);
      expect(abs(-1n)).toBe(1n);
      expect(abs(100n)).toBe(100n);
      expect(abs(-100n)).toBe(100n);
    });
  });
  
  describe('isPowerOfTwo', () => {
    test('identifies powers of two for numbers', () => {
      expect(isPowerOfTwo(1)).toBe(true);
      expect(isPowerOfTwo(2)).toBe(true);
      expect(isPowerOfTwo(4)).toBe(true);
      expect(isPowerOfTwo(8)).toBe(true);
      expect(isPowerOfTwo(16)).toBe(true);
      expect(isPowerOfTwo(32)).toBe(true);
      expect(isPowerOfTwo(64)).toBe(true);
      expect(isPowerOfTwo(128)).toBe(true);
      expect(isPowerOfTwo(256)).toBe(true);
      expect(isPowerOfTwo(512)).toBe(true);
      expect(isPowerOfTwo(1024)).toBe(true);
      expect(isPowerOfTwo(2048)).toBe(true);
      expect(isPowerOfTwo(4096)).toBe(true);
      expect(isPowerOfTwo(8192)).toBe(true);
      expect(isPowerOfTwo(16384)).toBe(true);
      expect(isPowerOfTwo(32768)).toBe(true);
      expect(isPowerOfTwo(65536)).toBe(true);
    });
    
    test('identifies non-powers of two for numbers', () => {
      expect(isPowerOfTwo(0)).toBe(false);
      expect(isPowerOfTwo(3)).toBe(false);
      expect(isPowerOfTwo(5)).toBe(false);
      expect(isPowerOfTwo(6)).toBe(false);
      expect(isPowerOfTwo(7)).toBe(false);
      expect(isPowerOfTwo(9)).toBe(false);
      expect(isPowerOfTwo(10)).toBe(false);
      expect(isPowerOfTwo(15)).toBe(false);
      expect(isPowerOfTwo(-1)).toBe(false);
      expect(isPowerOfTwo(-2)).toBe(false);
      expect(isPowerOfTwo(-4)).toBe(false);
    });
    
    test('identifies powers of two for BigInt values', () => {
      expect(isPowerOfTwo(1n)).toBe(true);
      expect(isPowerOfTwo(2n)).toBe(true);
      expect(isPowerOfTwo(4n)).toBe(true);
      expect(isPowerOfTwo(8n)).toBe(true);
      expect(isPowerOfTwo(16n)).toBe(true);
      expect(isPowerOfTwo(32n)).toBe(true);
      expect(isPowerOfTwo(64n)).toBe(true);
      expect(isPowerOfTwo(128n)).toBe(true);
      expect(isPowerOfTwo(256n)).toBe(true);
      expect(isPowerOfTwo(512n)).toBe(true);
      expect(isPowerOfTwo(1024n)).toBe(true);
      expect(isPowerOfTwo(1n << 100n)).toBe(true);
    });
    
    test('identifies non-powers of two for BigInt values', () => {
      expect(isPowerOfTwo(0n)).toBe(false);
      expect(isPowerOfTwo(3n)).toBe(false);
      expect(isPowerOfTwo(5n)).toBe(false);
      expect(isPowerOfTwo(6n)).toBe(false);
      expect(isPowerOfTwo(7n)).toBe(false);
      expect(isPowerOfTwo(9n)).toBe(false);
      expect(isPowerOfTwo(10n)).toBe(false);
      expect(isPowerOfTwo(15n)).toBe(false);
      expect(isPowerOfTwo(-1n)).toBe(false);
      expect(isPowerOfTwo(-2n)).toBe(false);
      expect(isPowerOfTwo(-4n)).toBe(false);
      expect(isPowerOfTwo((1n << 100n) + 1n)).toBe(false);
    });
  });
  
  describe('Factory Function', () => {
    test('createMathUtils returns object with all expected methods', () => {
      const utils = createMathUtils();
      
      expect(utils).toHaveProperty('bitLength');
      expect(utils).toHaveProperty('exactlyEquals');
      expect(utils).toHaveProperty('toByteArray');
      expect(utils).toHaveProperty('fromByteArray');
      expect(utils).toHaveProperty('isSafeInteger');
      expect(utils).toHaveProperty('sign');
      expect(utils).toHaveProperty('abs');
      expect(utils).toHaveProperty('isPowerOfTwo');
    });
    
    test('createMathUtils with custom options', () => {
      const utils = createMathUtils({
        enableCache: false,
        useOptimized: false,
        strict: true
      });
      
      // Test functionality with custom options
      expect(utils.bitLength(1234)).toBe(11);
    });
  });
  
  describe('Constants', () => {
    test('UTILITY_CONSTANTS are defined', () => {
      expect(UTILITY_CONSTANTS).toBeDefined();
      expect(UTILITY_CONSTANTS.MAX_SAFE_INTEGER).toBe(Number.MAX_SAFE_INTEGER);
      expect(UTILITY_CONSTANTS.MIN_SAFE_INTEGER).toBe(Number.MIN_SAFE_INTEGER);
      expect(UTILITY_CONSTANTS.MAX_SAFE_BIGINT).toBe(BigInt(Number.MAX_SAFE_INTEGER));
      expect(UTILITY_CONSTANTS.MIN_SAFE_BIGINT).toBe(BigInt(Number.MIN_SAFE_INTEGER));
    });
  });
});

describe('MathUtils Model Implementation', () => {
  describe('Model Interface', () => {
    test('createMathUtilsModel returns object implementing ModelInterface', async () => {
      const model = createMathUtilsModel();
      
      expect(model).toHaveProperty('initialize');
      expect(model).toHaveProperty('process');
      expect(model).toHaveProperty('getState');
      expect(model).toHaveProperty('reset');
      expect(model).toHaveProperty('terminate');
      expect(model).toHaveProperty('createResult');
      
      // Also check for MathUtilsInterface methods
      expect(model).toHaveProperty('bitLength');
      expect(model).toHaveProperty('exactlyEquals');
      expect(model).toHaveProperty('toByteArray');
      expect(model).toHaveProperty('fromByteArray');
      expect(model).toHaveProperty('isSafeInteger');
      expect(model).toHaveProperty('sign');
      expect(model).toHaveProperty('abs');
      expect(model).toHaveProperty('isPowerOfTwo');
    });
    
    test('createAndInitializeMathUtilsModel initializes the module', async () => {
      const model = await createAndInitializeMathUtilsModel();
      
      const state = model.getState();
      expect(state.lifecycle).toBe('ready');
      
      await model.terminate();
    });
    
    test('process method handles operations correctly', async () => {
      const model = await createAndInitializeMathUtilsModel();
      
      const result1 = await model.process({
        operation: 'bitLength',
        params: [1234n]
      });
      
      expect(result1).toBe(11);
      
      const result2 = await model.process({
        operation: 'exactlyEquals',
        params: [123, 123n]
      });
      
      expect(result2).toBe(true);
      
      await model.terminate();
    });
    
    test('getState returns correct state information', async () => {
      const model = await createAndInitializeMathUtilsModel({
        enableCache: true,
        name: 'test-utils',
        version: '1.0.0'
      });
      
      // Perform some operations to update state
      model.bitLength(1234n);
      model.bitLength(5678n);
      model.bitLength(1234n); // Cache hit
      
      const state = model.getState();
      
      expect(state.lifecycle).toBe('ready');
      expect(state.config.name).toBe('test-utils');
      expect(state.config.version).toBe('1.0.0');
      expect(state.config.enableCache).toBe(true);
      expect(state.cache).toBeDefined();
      expect(state.cache?.bitLengthCacheSize).toBeGreaterThan(0);
      expect(state.cache?.bitLengthCacheHits).toBe(1);
      expect(state.cache?.bitLengthCacheMisses).toBe(2);
      
      await model.terminate();
    });
    
    test('reset method clears caches', async () => {
      const model = await createAndInitializeMathUtilsModel({
        enableCache: true
      });
      
      // Perform some operations to populate cache
      model.bitLength(1234n);
      model.bitLength(5678n);
      
      // Verify cache is populated
      let state = model.getState();
      expect(state.cache?.bitLengthCacheSize).toBeGreaterThan(0);
      
      // Reset the model
      await model.reset();
      
      // Verify cache is cleared
      state = model.getState();
      expect(state.cache?.bitLengthCacheSize).toBe(0);
      expect(state.cache?.bitLengthCacheHits).toBe(0);
      expect(state.cache?.bitLengthCacheMisses).toBe(0);
      
      await model.terminate();
    });
    
    test('terminate method cleans up resources', async () => {
      const model = await createAndInitializeMathUtilsModel();
      
      const result = await model.terminate();
      
      expect(result.success).toBe(true);
      
      const state = model.getState();
      expect(state.lifecycle).toBe('terminated');
    });
  });
  
  describe('Caching', () => {
    test('caching improves performance for repeated operations', async () => {
      const model = await createAndInitializeMathUtilsModel({
        enableCache: true
      });
      
      // First call (cache miss)
      model.bitLength(1234567890n);
      
      // Second call (cache hit)
      model.bitLength(1234567890n);
      
      const state = model.getState();
      expect(state.cache?.bitLengthCacheHits).toBe(1);
      expect(state.cache?.bitLengthCacheMisses).toBe(1);
      
      await model.terminate();
    });
    
    test('disabling cache works correctly', async () => {
      const model = await createAndInitializeMathUtilsModel({
        enableCache: false
      });
      
      // First call
      model.bitLength(1234567890n);
      
      // Second call
      model.bitLength(1234567890n);
      
      const state = model.getState();
      expect(state.cache?.bitLengthCacheHits).toBe(0);
      
      await model.terminate();
    });
  });
});
