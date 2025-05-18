/**
 * BigInt Mock Test
 * 
 * This file tests the functionality of the BigInt mocks.
 * It verifies that the mocks are correctly exported and can be used as expected.
 */
/// <reference types="jest" />

import { describe, it, expect } from '@jest/globals';
import { createMockBigInt, BIGINT_MOCK_CONSTANTS, MockBigIntInterface } from './test-mock';
import { ModelLifecycleState } from './os-model-mock';
import * as types from '../types';

// No need for jest.mock calls as we're directly importing from the mocks

describe('BigInt Mocks', () => {
  it('creates a mock BigInt module that implements the BigIntInterface', () => {
    const mockBigInt = createMockBigInt();
    
    // Test basic interface implementation
    expect(mockBigInt).toBeDefined();
    expect(typeof mockBigInt.initialize).toBe('function');
    expect(typeof mockBigInt.terminate).toBe('function');
    expect(typeof mockBigInt.getState).toBe('function');
    expect(typeof mockBigInt.process).toBe('function');
    expect(typeof mockBigInt.reset).toBe('function');
    
    // Test BigInt specific functions
    expect(typeof mockBigInt.bitLength).toBe('function');
    expect(typeof mockBigInt.exactlyEquals).toBe('function');
    expect(typeof mockBigInt.toByteArray).toBe('function');
    expect(typeof mockBigInt.fromByteArray).toBe('function');
    expect(typeof mockBigInt.getRandomBigInt).toBe('function');
    expect(typeof mockBigInt.isProbablePrime).toBe('function');
    expect(typeof mockBigInt.countLeadingZeros).toBe('function');
    expect(typeof mockBigInt.countTrailingZeros).toBe('function');
    expect(typeof mockBigInt.getBit).toBe('function');
    expect(typeof mockBigInt.setBit).toBe('function');
    expect(typeof mockBigInt.modPow).toBe('function');
    expect(typeof mockBigInt.clearCache).toBe('function');
  });
  
  it('provides default mock responses for BigInt operations', async () => {
    const mockBigInt = createMockBigInt();
    
    // Test some key operations with their default responses
    expect(mockBigInt.bitLength(123456789n)).toBe(64);
    expect(mockBigInt.exactlyEquals(42n, 42n)).toBe(true);
    expect(mockBigInt.isProbablePrime(7n)).toBe(true);
    
    // Test byte array conversion
    const bytes = mockBigInt.toByteArray(123n);
    expect(bytes).toBeInstanceOf(Uint8Array);
    
    // Test random generation
    const random = mockBigInt.getRandomBigInt(128);
    expect(typeof random).toBe('bigint');
    
    // Test bit operations
    expect(mockBigInt.countLeadingZeros(16n)).toBe(32);
    expect(mockBigInt.countTrailingZeros(16n)).toBe(0);
    expect(mockBigInt.getBit(5n, 0)).toBe(0);
    expect(typeof mockBigInt.setBit(5n, 3, 1)).toBe('bigint');
    
    // Test modular exponentiation
    const result = mockBigInt.modPow(2n, 10n, 1000n);
    expect(typeof result).toBe('bigint');
  });
  
  it('processes operations through the ModelInterface', async () => {
    const mockBigInt = createMockBigInt();
    
    // Test handling different operation types through the process method
    const bitLengthResult = await mockBigInt.process({
      operation: 'bitLength',
      params: [42n]
    });
    
    expect(bitLengthResult.success).toBe(true);
    expect(bitLengthResult.data).toBe(64);
    
    const primalityResult = await mockBigInt.process({
      operation: 'isProbablePrime',
      params: [17n]
    });
    
    expect(primalityResult.success).toBe(true);
    expect(primalityResult.data).toBe(true);
    
    // Test default operation
    const unknownResult = await mockBigInt.process({
      operation: 'someUnknownOperation',
      params: []
    });
    
    expect(unknownResult.success).toBe(true);
    expect(unknownResult.data).toBe(0n);
  });
  
  it('can be initialized and terminated', async () => {
    const mockBigInt = createMockBigInt({ name: 'test-mock-bigint' });
    
    // Test initialization
    const initResult = await mockBigInt.initialize();
    expect(initResult.success).toBe(true);
    expect(initResult.source).toBe('test-mock-bigint');
    
    // Test state retrieval
    const state = mockBigInt.getState();
    expect(state.config).toBeDefined();
    expect(state.cache).toBeDefined();
    
    // Test reset
    const resetResult = await mockBigInt.reset();
    expect(resetResult.success).toBe(true);
    
    // Test termination
    const terminateResult = await mockBigInt.terminate();
    expect(terminateResult.success).toBe(true);
    
    // Test final state
    const finalState = mockBigInt.getState();
    expect(finalState.lifecycle).toBe(ModelLifecycleState.Terminated);
  });
  
  it('exports constants correctly', () => {
    // Test that constants are exported
    expect(BIGINT_MOCK_CONSTANTS).toBeDefined();
    expect(BIGINT_MOCK_CONSTANTS.DEFAULT_ZERO).toBe(0n);
    expect(BIGINT_MOCK_CONSTANTS.DEFAULT_ONE).toBe(1n);
    expect(BIGINT_MOCK_CONSTANTS.DEFAULT_TWO).toBe(2n);
  });
  
  it('tracks metrics for testing', () => {
    const mockBigInt = createMockBigInt();
    
    // Perform some operations
    mockBigInt.bitLength(123n);
    mockBigInt.isProbablePrime(17n);
    mockBigInt.isProbablePrime(19n);
    
    // Check metrics
    const metrics = mockBigInt._getMetrics();
    expect(metrics.operationCount).toBeGreaterThan(0);
    expect(metrics.primalityTestCount).toBe(2);
  });
});
