/**
 * Utility Mocks Tests
 * =================
 * 
 * Tests for the mock implementations of the utility module.
 */

import {
  createMockMathUtils,
  createMockMathUtilsModel,
  mockMathUtils,
  mockMathUtilsModel,
  loggingMock,
  modelMock
} from './index';

describe('Utility Mocks', () => {
  describe('MathUtils Mock', () => {
    test('creates a mock with all required methods', () => {
      const mock = createMockMathUtils();
      
      expect(mock).toHaveProperty('bitLength');
      expect(mock).toHaveProperty('exactlyEquals');
      expect(mock).toHaveProperty('toByteArray');
      expect(mock).toHaveProperty('fromByteArray');
      expect(mock).toHaveProperty('isSafeInteger');
      expect(mock).toHaveProperty('sign');
      expect(mock).toHaveProperty('abs');
      expect(mock).toHaveProperty('isPowerOfTwo');
    });
    
    test('provides default mock functionality', () => {
      const mock = createMockMathUtils();
      
      expect(mock.bitLength(8n)).toBe(4);
      expect(mock.exactlyEquals(1, 1)).toBe(true);
      expect(mock.exactlyEquals(1, 2)).toBe(false);
      expect(mock.isSafeInteger(123)).toBe(true);
      expect(mock.sign(-5)).toBe(-1);
      expect(mock.abs(-10n)).toBe(10n);
      expect(mock.isPowerOfTwo(8)).toBe(true);
      expect(mock.isPowerOfTwo(7)).toBe(false);
      
      // Verify byte array methods return expected types
      const bytes = mock.toByteArray(123n);
      expect(bytes).toBeInstanceOf(Uint8Array);
      
      const value = mock.fromByteArray(bytes);
      expect(typeof value).toBe('bigint');
    });
  });
  
  describe('MathUtils Model Mock', () => {
    test('creates a mock that implements both MathUtils and ModelInterface', () => {
      const mock = createMockMathUtilsModel();
      
      // Check MathUtils methods
      expect(mock).toHaveProperty('bitLength');
      expect(mock).toHaveProperty('exactlyEquals');
      expect(mock).toHaveProperty('toByteArray');
      expect(mock).toHaveProperty('fromByteArray');
      expect(mock).toHaveProperty('isSafeInteger');
      expect(mock).toHaveProperty('sign');
      expect(mock).toHaveProperty('abs');
      expect(mock).toHaveProperty('isPowerOfTwo');
      
      // Check ModelInterface methods
      expect(mock).toHaveProperty('initialize');
      expect(mock).toHaveProperty('process');
      expect(mock).toHaveProperty('getState');
      expect(mock).toHaveProperty('reset');
      expect(mock).toHaveProperty('terminate');
      expect(mock).toHaveProperty('createResult');
    });
    
    test('getState returns MathUtilsModelState', () => {
      const mock = createMockMathUtilsModel();
      const state = mock.getState();
      
      expect(state).toHaveProperty('lifecycle');
      expect(state).toHaveProperty('lastStateChangeTime');
      expect(state).toHaveProperty('uptime');
      expect(state).toHaveProperty('operationCount');
      expect(state).toHaveProperty('config');
      expect(state).toHaveProperty('cache');
      
      expect(state.config).toHaveProperty('enableCache');
      expect(state.config).toHaveProperty('useOptimized');
      expect(state.config).toHaveProperty('strict');
      expect(state.config).toHaveProperty('name');
      expect(state.config).toHaveProperty('version');
      
      expect(state.cache).toHaveProperty('bitLengthCacheSize');
      expect(state.cache).toHaveProperty('bitLengthCacheHits');
      expect(state.cache).toHaveProperty('bitLengthCacheMisses');
    });
    
    test('process method handles operations', async () => {
      const mock = createMockMathUtilsModel();
      
      const result = await mock.process({
        operation: 'bitLength',
        params: [123n]
      });
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('source');
    });
    
    test('lifecycle methods return expected results', async () => {
      const mock = createMockMathUtilsModel();
      
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
      expect(mockMathUtils).toBeDefined();
      expect(mockMathUtilsModel).toBeDefined();
      expect(loggingMock).toBeDefined();
      expect(modelMock).toBeDefined();
    });
  });
});
