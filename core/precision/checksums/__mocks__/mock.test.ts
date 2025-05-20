/**
 * Checksums Mock Test
 * 
 * This file tests the functionality of the Checksums mocks.
 * It verifies that the mocks are correctly exported and can be used as expected.
 */
/// <reference types="jest" />

import { describe, it, expect } from '@jest/globals';
import { BaseModel, ModelResult, ModelLifecycleState } from './os-model-mock';
import { createLogging } from './os-logging-mock';
import { createMockChecksums, CHECKSUM_CONSTANTS } from './index';
import * as types from '../types';
import { Factor } from '../../types';

// No need for jest.mock() calls as we're importing the mocks directly above

describe('Checksums Mocks', () => {
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
  
  it('creates a mock checksums that implements ChecksumsModelInterface', () => {
    const mockChecksums = createMockChecksums({ name: 'test-mock-checksums' });
    
    // Test basic interface implementation
    expect(mockChecksums).toBeDefined();
    expect(typeof mockChecksums.initialize).toBe('function');
    expect(typeof mockChecksums.terminate).toBe('function');
    expect(typeof mockChecksums.getState).toBe('function');
    expect(typeof mockChecksums.process).toBe('function');
    expect(typeof mockChecksums.reset).toBe('function');
    expect(typeof mockChecksums.createResult).toBe('function');
    
    // Test Checksums specific functions
    expect(typeof mockChecksums.calculateXorSum).toBe('function');
    expect(typeof mockChecksums.calculateChecksum).toBe('function');
    expect(typeof mockChecksums.attachChecksum).toBe('function');
    expect(typeof mockChecksums.extractFactorsAndChecksum).toBe('function');
    expect(typeof mockChecksums.calculateBatchChecksum).toBe('function');
    expect(typeof mockChecksums.getChecksumPower).toBe('function');
    expect(typeof mockChecksums.createXorHashState).toBe('function');
    expect(typeof mockChecksums.updateXorHash).toBe('function');
    expect(typeof mockChecksums.getChecksumFromXorHash).toBe('function');
    expect(typeof mockChecksums.clearCache).toBe('function');
  });
  
  it('provides default mock functionality for checksums operations', async () => {
    const mockChecksums = createMockChecksums();
    
    // Mock prime registry for testing
    const mockPrimeRegistry = {
      getPrime: function(idx) { return BigInt(idx * 2 + 1); }, // Maps 0->1, 1->3, 2->5, etc.
      getIndex: function(prime) { return Number((prime - BigInt(1)) / BigInt(2)); }, // Inverse of above
      factor: function(x) { return [{ prime: BigInt(2), exponent: 1 }]; }
    };
    
    // Test some key operations with their defaults
    const factors = [
      { prime: BigInt(2), exponent: 1 },
      { prime: BigInt(3), exponent: 1 },
      { prime: BigInt(5), exponent: 1 }
    ];
    
    // Test XOR sum calculation
    const xorSum = mockChecksums.calculateXorSum(factors);
    expect(typeof xorSum).toBe('number');
    
    // Test checksum calculation
    const checksum = mockChecksums.calculateChecksum(factors, mockPrimeRegistry);
    expect(typeof checksum).toBe('bigint');
    
    // Test attachment
    const value = BigInt(42);
    const attached = mockChecksums.attachChecksum(value, factors, mockPrimeRegistry);
    expect(typeof attached).toBe('bigint');
    expect(attached % value).toBe(BigInt(0)); // Should be divisible by original value
    
    // Test extraction
    const extraction = mockChecksums.extractFactorsAndChecksum(attached, mockPrimeRegistry);
    expect(extraction).toBeDefined();
    expect(extraction.valid).toBe(true);
    expect(extraction.checksumPower).toBe(CHECKSUM_CONSTANTS.DEFAULT_CHECKSUM_POWER);
    
    // Test XOR hash state
    const state = mockChecksums.createXorHashState();
    expect(state.xorSum).toBe(0);
    expect(state.count).toBe(0);
    
    const updatedState = mockChecksums.updateXorHash(state, value, mockPrimeRegistry);
    expect(updatedState.count).toBe(1);
  });
  
  it('processes operations through the ModelInterface', async () => {
    const mockChecksums = createMockChecksums();
    
    // Mock prime registry for testing
    const mockPrimeRegistry = {
      getPrime: function(idx) { return BigInt(idx * 2 + 1); },
      getIndex: function(prime) { return Number((prime - BigInt(1)) / BigInt(2)); },
      factor: function(x) { return [{ prime: BigInt(2), exponent: 1 }]; }
    };
    
    const factors = [
      { prime: BigInt(2), exponent: 1 },
      { prime: BigInt(3), exponent: 1 }
    ];
    
    // Test handling different operation types through the process method
    const checksumResult = await mockChecksums.process({
      operation: 'calculateChecksum',
      params: [factors, mockPrimeRegistry]
    });
    
    expect(typeof checksumResult).toBe('bigint');
    
    // Test with attachChecksum operation
    const attachResult = await mockChecksums.process({
      operation: 'attachChecksum',
      params: [BigInt(42), factors, mockPrimeRegistry]
    });
    
    expect(typeof attachResult).toBe('bigint');
    
    // Test clear cache through process
    await mockChecksums.process({
      operation: 'clearCache',
      params: []
    });
    
    // Verify state is updated
    const state = mockChecksums.getState();
    expect(state.cache).toBeDefined();
    if (state.cache) {
      expect(state.cache.size).toBe(0);
    }
  });
  
  it('can be initialized and terminated', async () => {
    const mockChecksums = createMockChecksums({ name: 'test-init-checksums' });
    
    // Test initialization
    const initResult = await mockChecksums.initialize();
    expect(initResult.success).toBe(true);
    expect(initResult.source).toBe('test-init-checksums');
    
    // Test state retrieval
    const state = mockChecksums.getState();
    expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
    expect(state.config).toBeDefined();
    expect(state.cache).toBeDefined();
    
    // Test reset
    const resetResult = await mockChecksums.reset();
    expect(resetResult.success).toBe(true);
    
    // Test termination
    const terminateResult = await mockChecksums.terminate();
    expect(terminateResult.success).toBe(true);
    
    // Check final state
    const finalState = mockChecksums.getState();
    expect(finalState.lifecycle).toBe(ModelLifecycleState.Terminated);
  });
  
  it('exports constants correctly', () => {
    // Test that constants are exported
    expect(CHECKSUM_CONSTANTS).toBeDefined();
    expect(CHECKSUM_CONSTANTS.DEFAULT_CHECKSUM_POWER).toBe(6);
    expect(CHECKSUM_CONSTANTS.DEFAULT_CACHE_SIZE).toBe(1000);
  });
});
