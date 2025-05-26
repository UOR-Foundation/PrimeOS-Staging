/**
 * Modular Arithmetic Mock Test
 * 
 * This file tests the functionality of the Modular Arithmetic mocks.
 * It verifies that the mocks are correctly exported and can be used as expected.
 */
/// <reference types="jest" />

import { describe, it, expect } from '@jest/globals';
import { BaseModel, ModelResult, ModelLifecycleState } from './os-model-mock';
import { createLogging } from './os-logging-mock';
import { createMockModularOperations, MODULAR_CONSTANTS } from './index';

describe('Modular Arithmetic Mocks', () => {
  it('correctly re-exports model and logging mocks', () => {
    // Test model mock
    expect(BaseModel).toBeDefined();
    expect(ModelLifecycleState).toBeDefined();
    
    // Test logging mock
    const logging = createLogging();
    expect(logging).toBeDefined();
    expect(typeof logging.debug).toBe('function');
    expect(typeof logging.info).toBe('function');
    expect(typeof logging.error).toBe('function');
  });
  
  it('creates a mock modular operations that implements ModularModelInterface', () => {
    const mockModular = createMockModularOperations({ name: 'test-mock-modular' });
    
    // Test basic interface implementation
    expect(mockModular).toBeDefined();
    expect(typeof mockModular.initialize).toBe('function');
    expect(typeof mockModular.terminate).toBe('function');
    expect(typeof mockModular.getState).toBe('function');
    expect(typeof mockModular.process).toBe('function');
    expect(typeof mockModular.reset).toBe('function');
    expect(typeof mockModular.createResult).toBe('function');
    
    // Test Modular specific functions
    expect(typeof mockModular.mod).toBe('function');
    expect(typeof mockModular.modPow).toBe('function');
    expect(typeof mockModular.modInverse).toBe('function');
    expect(typeof mockModular.modMul).toBe('function');
    expect(typeof mockModular.gcd).toBe('function');
    expect(typeof mockModular.lcm).toBe('function');
    expect(typeof mockModular.extendedGcd).toBe('function');
    expect(typeof mockModular.clearCache).toBe('function');
  });
  
  it('provides default mock functionality for modular operations', async () => {
    const mockModular = createMockModularOperations();
    
    // Test some key operations with their defaults
    expect(mockModular.mod(10, 3)).toBe(1);
    expect(mockModular.mod(-5, 3)).toBe(1); // Python compatible
    expect(mockModular.modPow(BigInt(2), BigInt(10), BigInt(1000))).toBe(BigInt(24));
    expect(mockModular.gcd(BigInt(48), BigInt(18))).toBe(BigInt(6));
    expect(mockModular.lcm(BigInt(4), BigInt(6))).toBe(BigInt(12));
    
    // Test extended GCD
    const [g, x, y] = mockModular.extendedGcd(BigInt(35), BigInt(15));
    expect(g).toBe(BigInt(5));
    expect(BigInt(35) * x + BigInt(15) * y).toBe(BigInt(5));
  });
  
  it('processes operations through the ModelInterface', async () => {
    const mockModular = createMockModularOperations();
    
    // Test with mod operation
    const modResult = await mockModular.process({
      operation: 'mod',
      params: [10, 3]
    });
    
    expect(modResult).toBe(1);
    
    // Test with modPow operation
    const powResult = await mockModular.process({
      operation: 'modPow',
      params: [2, 10, 1000]
    });
    
    expect(powResult).toBe(BigInt(24));
    
    // Test clear cache through process
    await mockModular.process({
      operation: 'clearCache',
      params: []
    });
    
    // Verify state is updated
    const state = mockModular.getState();
    expect(state.cache).toBeDefined();
  });
  
  it('can be initialized and terminated', async () => {
    const mockModular = createMockModularOperations({ name: 'test-init-modular' });
    
    // Test initialization
    const initResult = await mockModular.initialize();
    expect(initResult.success).toBe(true);
    expect(initResult.source).toBe('test-init-modular');
    
    // Test state retrieval
    const state = mockModular.getState();
    expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
    expect(state.config).toBeDefined();
    
    // Test reset
    const resetResult = await mockModular.reset();
    expect(resetResult.success).toBe(true);
    
    // Test termination
    const terminateResult = await mockModular.terminate();
    expect(terminateResult.success).toBe(true);
    
    // Check final state
    const finalState = mockModular.getState();
    expect(finalState.lifecycle).toBe(ModelLifecycleState.Terminated);
  });
  
  it('exports constants correctly', () => {
    // Test that constants are exported
    expect(MODULAR_CONSTANTS).toBeDefined();
    expect(MODULAR_CONSTANTS.MAX_NATIVE_BITS).toBe(50);
    expect(MODULAR_CONSTANTS.DEFAULT_CACHE_SIZE).toBe(1000);
    expect(MODULAR_CONSTANTS.MAX_SUPPORTED_BITS).toBe(4096);
  });
});
