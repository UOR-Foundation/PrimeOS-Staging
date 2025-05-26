/**
 * Utility Mocks Tests
 * =================
 * 
 * Tests for the mock implementations of the utility module.
 */

import {
  createMathUtils,
  MathUtils,
  BaseModel,
  ModelLifecycleState,
  createLogging
} from './index';

describe('Utility Mocks', () => {
  describe('MathUtils Mock', () => {
    test('creates a mock with all required methods', () => {
      const mock = createMathUtils();
      
      expect(typeof mock.bitLength).toBe('function');
      expect(typeof mock.exactlyEquals).toBe('function');
      expect(typeof mock.toByteArray).toBe('function');
      expect(typeof mock.fromByteArray).toBe('function');
      expect(typeof mock.isSafeInteger).toBe('function');
      expect(typeof mock.sign).toBe('function');
      expect(typeof mock.abs).toBe('function');
      expect(typeof mock.isPowerOfTwo).toBe('function');
    });
    
    test('provides default mock functionality', () => {
      const mock = createMathUtils();
      
      expect(mock.bitLength(BigInt(8))).toBe(4);
      expect(mock.exactlyEquals(1, 1)).toBe(true);
      expect(mock.exactlyEquals(1, 2)).toBe(false);
      expect(mock.isSafeInteger(123)).toBe(true);
      expect(mock.sign(-5)).toBe(-1);
      expect(mock.abs(-BigInt(10))).toBe(BigInt(10));
      expect(mock.isPowerOfTwo(8)).toBe(true);
      expect(mock.isPowerOfTwo(7)).toBe(false);
      
      // Verify byte array methods return expected types
      const bytes = mock.toByteArray(BigInt(123));
      expect(bytes instanceof Uint8Array).toBe(true);
      
      const value = mock.fromByteArray(bytes);
      expect(typeof value).toBe('bigint');
    });
  });
  
  describe('MathUtils Model Mock', () => {
    test('creates a mock that implements both MathUtils and ModelInterface', () => {
      const mock = createMathUtils();
      
      // Check MathUtils methods
      expect(typeof mock.bitLength).toBe('function');
      expect(typeof mock.exactlyEquals).toBe('function');
      expect(typeof mock.toByteArray).toBe('function');
      expect(typeof mock.fromByteArray).toBe('function');
      expect(typeof mock.isSafeInteger).toBe('function');
      expect(typeof mock.sign).toBe('function');
      expect(typeof mock.abs).toBe('function');
      expect(typeof mock.isPowerOfTwo).toBe('function');
      
      // Check ModelInterface methods
      expect(typeof mock.initialize).toBe('function');
      expect(typeof mock.process).toBe('function');
      expect(typeof mock.getState).toBe('function');
      expect(typeof mock.reset).toBe('function');
      expect(typeof mock.terminate).toBe('function');
      expect(typeof mock.createResult).toBe('function');
    });
    
    test('getState returns MathUtilsModelState', () => {
      const mock = createMathUtils({ name: 'test-utils', version: '1.0.0' });
      const state = mock.getState();
      
      expect(state.lifecycle).toBeDefined();
      expect(state.lastStateChangeTime).toBeDefined();
      expect(state.uptime).toBeDefined();
      expect(state.operationCount).toBeDefined();
      expect(state.config).toBeDefined();
      expect(state.cache).toBeDefined();
      
      expect(state.config.enableCache).toBeDefined();
      expect(state.config.useOptimized).toBeDefined();
      expect(state.config.strict).toBeDefined();
      expect(state.config.name).toBe('test-utils');
      expect(state.config.version).toBe('1.0.0');
      
      if (state.cache) {
        expect(state.cache.bitLengthCacheSize).toBeDefined();
        expect(state.cache.bitLengthCacheHits).toBeDefined();
        expect(state.cache.bitLengthCacheMisses).toBeDefined();
      }
    });
    
    test('process method handles operations', async () => {
      const mock = createMathUtils();
      
      const result = await mock.process({
        operation: 'bitLength',
        params: [BigInt(123)]
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.source).toBeDefined();
    });
    
    test('lifecycle methods return expected results', async () => {
      const mock = createMathUtils();
      
      const initResult = await mock.initialize();
      expect(initResult.success).toBe(true);
      
      const resetResult = await mock.reset();
      expect(resetResult.success).toBe(true);
      
      const terminateResult = await mock.terminate();
      expect(terminateResult.success).toBe(true);
    });
  });
  
  describe('Exported Instances', () => {
    test('exports pre-created instances', () => {
      expect(MathUtils).toBeDefined();
      expect(BaseModel).toBeDefined();
      expect(ModelLifecycleState).toBeDefined();
      
      const logging = createLogging();
      expect(logging).toBeDefined();
    });
  });
});
