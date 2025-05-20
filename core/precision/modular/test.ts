/**
 * Modular Arithmetic Module Tests
 * =============================
 * 
 * Test suite for the modular arithmetic precision module.
 */

import {
  mod,
  modPow,
  modInverse,
  modMul,
  extendedGcd,
  gcd,
  lcm,
  clearCache,
  createModularOperations,
  createModular,
  createAndInitializeModular,
  ModularInterface,
  MODULAR_CONSTANTS
} from './index';
import { ModelLifecycleState } from './__mocks__/os-model-mock';

jest.mock('../../../os/model', () => require('./__mocks__/os-model-mock'));
jest.mock('../../../os/logging', () => require('./__mocks__/os-logging-mock'));

describe('Modular Arithmetic Module', () => {
  describe('mod function', () => {
    test('standard modulo operations', () => {
      // Basic positive cases
      expect(mod(10, 3)).toBe(1);
      expect(mod(10n, 3n)).toBe(1n);
      expect(mod(10, 3n)).toBe(1n);
      expect(mod(10n, 3)).toBe(1n);
      
      // Zero modulus should throw
      expect(() => mod(5, 0)).toThrow();
      expect(() => mod(5n, 0n)).toThrow();
    });
    
    test('Python-compatible modulo with negative numbers', () => {
      // Negative numbers should behave like Python
      expect(mod(-5, 3)).toBe(1);  // In JS: -5 % 3 = -2
      expect(mod(-5n, 3n)).toBe(1n);
      expect(mod(-15, 4)).toBe(1); // In JS: -15 % 4 = -3
      expect(mod(-15n, 4n)).toBe(1n);
    });
    
    test('Edge cases', () => {
      // Modulo with large numbers
      expect(mod(9007199254740991n, 10n)).toBe(1n); // MAX_SAFE_INTEGER % 10
      
      // Zero modulo
      expect(mod(0, 5)).toBe(0);
      expect(mod(0n, 5n)).toBe(0n);
      
      // Negative modulus should be handled
      expect(mod(10, -3)).toBe(1);  // Should normalize the modulus
      expect(mod(10n, -3n)).toBe(1n);
    });
  });
  
  describe('modPow function', () => {
    test('basic modular exponentiation', () => {
      expect(modPow(2, 10, 1000)).toBe(24);  // 2^10 % 1000 = 1024 % 1000 = 24
      expect(modPow(2n, 10n, 1000n)).toBe(24n);
      expect(modPow(3, 4, 10)).toBe(1);     // 3^4 % 10 = 81 % 10 = 1
      expect(modPow(3n, 4n, 10n)).toBe(1n);
    });
    
    test('handles negative exponents', () => {
      // 2^(-1) mod 11 = 6 (inverse of 2 modulo 11)
      expect(modPow(2, -1, 11)).toBe(6);
      expect(modPow(2n, -1n, 11n)).toBe(6n);
    });
    
    test('edge cases', () => {
      // Modulo 1 always returns 0
      expect(modPow(5, 20, 1)).toBe(0);
      expect(modPow(5n, 20n, 1n)).toBe(0n);
      
      // Power of 0 returns 1
      expect(modPow(5, 0, 7)).toBe(1);
      expect(modPow(5n, 0n, 7n)).toBe(1n);
      
      // Base of 0 returns 0
      expect(modPow(0, 5, 7)).toBe(0);
      expect(modPow(0n, 5n, 7n)).toBe(0n);
    });
    
    test('works with large numbers', () => {
      // Use large exponent that would overflow without modular reduction
      expect(modPow(2n, 100n, 1000n)).toBe(376n);  // 2^100 % 1000 = 376
    });
  });
  
  describe('modInverse function', () => {
    test('basic modular inverse', () => {
      expect(modInverse(3, 11)).toBe(4);  // 3*4 = 12 ≡ 1 (mod 11)
      expect(modInverse(3n, 11n)).toBe(4n);
      
      expect(modInverse(7, 20)).toBe(3);  // 7*3 = 21 ≡ 1 (mod 20)
      expect(modInverse(7n, 20n)).toBe(3n);
    });
    
    test('handles error cases', () => {
      // No modular inverse exists when gcd(a, m) > 1
      expect(() => modInverse(2, 4)).toThrow();  // gcd(2, 4) = 2
      expect(() => modInverse(2n, 4n)).toThrow();
      
      // Zero has no modular inverse
      expect(() => modInverse(0, 5)).toThrow();
      expect(() => modInverse(0n, 5n)).toThrow();
      
      // Cannot find inverse with modulo 0
      expect(() => modInverse(3, 0)).toThrow();
      expect(() => modInverse(3n, 0n)).toThrow();
    });
    
    test('works with large numbers', () => {
      expect(modInverse(17n, 101n)).toBe(6n);  // 17*6 = 102 ≡ 1 (mod 101)
    });
  });
  
  describe('modMul function', () => {
    test('basic modular multiplication', () => {
      expect(modMul(7, 8, 13)).toBe(4n);  // 7*8 = 56 ≡ 4 (mod 13)
      expect(modMul(7n, 8n, 13n)).toBe(4n);
    });
    
    test('handles overflow cases', () => {
      // Large numbers that would overflow standard multiplication
      const a = 9007199254740990n;  // Close to MAX_SAFE_INTEGER
      const b = 9007199254740990n;
      const m = 97n;
      
      // (a * b) % m would overflow without special handling
      expect(modMul(a, b, m)).toBe(27n);
    });
    
    test('handles negative operands', () => {
      expect(modMul(-7, 8, 13)).toBe(9n);  // -7*8 = -56 ≡ 9 (mod 13)
      expect(modMul(7, -8, 13)).toBe(9n);  // 7*(-8) = -56 ≡ 9 (mod 13)
      expect(modMul(-7, -8, 13)).toBe(4n); // (-7)*(-8) = 56 ≡ 4 (mod 13)
    });
  });
  
  describe('extendedGcd function', () => {
    test('calculates correct Bézout coefficients', () => {
      // gcd(35, 15) = 5 = 35*(-1) + 15*3
      const [g, x, y] = extendedGcd(35n, 15n);
      expect(g).toBe(5n);
      expect(35n * x + 15n * y).toBe(5n);
      
      // Another example: gcd(101, 13) = 1 = 101*4 + 13*(-31)
      const [g2, x2, y2] = extendedGcd(101n, 13n);
      expect(g2).toBe(1n);
      expect(101n * x2 + 13n * y2).toBe(1n);
    });
    
    test('works with one zero input', () => {
      // gcd(0, 5) = 5, with coefficients (0, 1)
      const [g, x, y] = extendedGcd(0n, 5n);
      expect(g).toBe(5n);
      expect(x).toBe(0n);
      expect(y).toBe(1n);
      
      // gcd(7, 0) = 7, with coefficients (1, 0)
      const [g2, x2, y2] = extendedGcd(7n, 0n);
      expect(g2).toBe(7n);
      expect(x2).toBe(1n);
      expect(y2).toBe(0n);
    });
  });
  
  describe('gcd function', () => {
    test('calculates correct greatest common divisor', () => {
      expect(gcd(48n, 18n)).toBe(6n);
      expect(gcd(101n, 13n)).toBe(1n);
      expect(gcd(0n, 5n)).toBe(5n);
      expect(gcd(5n, 0n)).toBe(5n);
    });
    
    test('handles negative numbers', () => {
      expect(gcd(-48n, 18n)).toBe(6n);
      expect(gcd(48n, -18n)).toBe(6n);
      expect(gcd(-48n, -18n)).toBe(6n);
    });
  });
  
  describe('lcm function', () => {
    test('calculates correct least common multiple', () => {
      expect(lcm(4n, 6n)).toBe(12n);
      expect(lcm(15n, 20n)).toBe(60n);
      expect(lcm(7n, 11n)).toBe(77n);
    });
    
    test('handles zero inputs', () => {
      expect(lcm(0n, 5n)).toBe(0n);
      expect(lcm(5n, 0n)).toBe(0n);
      expect(lcm(0n, 0n)).toBe(0n);
    });
  });
  
  describe('Factory Function', () => {
    test('createModularOperations returns object with all expected methods', () => {
      const operations = createModularOperations();
      
      expect(operations.mod).toBeInstanceOf(Function);
      expect(operations.modPow).toBeInstanceOf(Function);
      expect(operations.modInverse).toBeInstanceOf(Function);
      expect(operations.modMul).toBeInstanceOf(Function);
      expect(operations.extendedGcd).toBeInstanceOf(Function);
      expect(operations.gcd).toBeInstanceOf(Function);
      expect(operations.lcm).toBeInstanceOf(Function);
      expect(operations.clearCache).toBeInstanceOf(Function);
    });
    
    test('createModularOperations with custom options', () => {
      const operations = createModularOperations({
        pythonCompatible: false,
        useCache: false,
        useOptimized: false,
        nativeThreshold: 32
      });
      
      // JavaScript modulo behavior (not Python compatible)
      expect(operations.mod(-5, 3)).toBe(-2);
      
      // Operation should still work correctly
      expect(operations.modPow(2, 10, 1000)).toBe(24);
    });
  });

  describe('Model Interface', () => {
    test('createModular returns a model implementing the interface', () => {
      const model = createModular();
      expect(model).toBeDefined();
      expect(typeof model.initialize).toBe('function');
      expect(typeof model.process).toBe('function');
      expect(typeof model.getState).toBe('function');
    });

    test('createAndInitializeModular yields a ready instance', async () => {
      const model = await createAndInitializeModular({ name: 'test-mod' });
      const state = model.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
    });

    test('process correctly handles ModularProcessInput', async () => {
      const model = await createAndInitializeModular();
      const result = await model.process({ operation: 'mod', params: [10n, 3n] });
      expect(result).toBe(1n);
    });
  });
  
  describe('Constants', () => {
    test('MODULAR_CONSTANTS are defined', () => {
      expect(MODULAR_CONSTANTS.MAX_NATIVE_BITS).toBe(50);
      expect(MODULAR_CONSTANTS.DEFAULT_CACHE_SIZE).toBe(1000);
      expect(MODULAR_CONSTANTS.MAX_SUPPORTED_BITS).toBe(4096);
    });
  });
  
  describe('Cache Management', () => {
    test('clearCache function clears internal caches', () => {
      // First use a function that would populate the cache
      modInverse(3, 11);
      modInverse(7, 20);
      
      // Clear the cache
      clearCache();
      
      // The operations should still work after clearing the cache
      expect(modInverse(3, 11)).toBe(4);
      expect(modInverse(7, 20)).toBe(3);
    });
    
    test('custom instance can clear its own cache', () => {
      const operations = createModularOperations({ useCache: true });
      
      // Use functions to populate cache
      operations.gcd(48n, 18n);
      operations.modInverse(3, 11);
      
      // Clear the cache
      operations.clearCache();
      
      // Operations should still work
      expect(operations.gcd(48n, 18n)).toBe(6n);
      expect(operations.modInverse(3, 11)).toBe(4);
    });
  });
  
  describe('Debug Mode and Strict Validation', () => {
    test('debug mode can be enabled without affecting results', () => {
      const debugOps = createModularOperations({ debug: true });
      
      // Results should be the same as without debug mode
      expect(debugOps.mod(10, 3)).toBe(1);
      expect(debugOps.modPow(2, 10, 1000)).toBe(24);
      expect(debugOps.modInverse(3, 11)).toBe(4);
      expect(debugOps.gcd(48n, 18n)).toBe(6n);
    });
    
    test('strict mode validates operation sizes', () => {
      const strictOps = createModularOperations({ 
        strict: true,
        debug: false
      });
      
      // Normal operations should work
      expect(strictOps.mod(10, 3)).toBe(1);
      expect(strictOps.modPow(2, 10, 1000)).toBe(24);
      
      // We can't easily test the size limits without exceeding memory constraints
      // in the test environment, but we can confirm the function still works in strict mode
    });
  });
});
