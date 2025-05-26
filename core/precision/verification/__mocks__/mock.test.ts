/**
 * Verification Mock Test
 * 
 * This file tests the functionality of the Verification mocks.
 * It verifies that the mocks are correctly exported and can be used as expected.
 */
/// <reference types="jest" />

import { describe, it, expect } from '@jest/globals';
import { BaseModel, ModelLifecycleState } from './os-model-mock';
import { createLogging } from './os-logging-mock';
import { mockPrimeRegistry, mockChecksums, MockCache } from './test-mock';

describe('Verification Mocks', () => {
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
  
  it('provides mock prime registry for verification', () => {
    expect(mockPrimeRegistry).toBeDefined();
    expect(typeof mockPrimeRegistry.getPrime).toBe('function');
    expect(typeof mockPrimeRegistry.getIndex).toBe('function');
    expect(typeof mockPrimeRegistry.factor).toBe('function');
    
    // Test basic functionality
    expect(mockPrimeRegistry.getPrime(0)).toBe(BigInt(3));
    expect(mockPrimeRegistry.getPrime(1)).toBe(BigInt(5));
    expect(mockPrimeRegistry.getIndex(BigInt(3))).toBe(0);
    expect(mockPrimeRegistry.getIndex(BigInt(5))).toBe(1);
    
    // Test factorization
    const factors42 = mockPrimeRegistry.factor(BigInt(42));
    expect(factors42).toHaveLength(3);
    expect(factors42[0].prime).toBe(BigInt(2));
    expect(factors42[1].prime).toBe(BigInt(3));
    expect(factors42[2].prime).toBe(BigInt(7));
  });
  
  it('provides mock checksums for verification', () => {
    expect(mockChecksums).toBeDefined();
    expect(typeof mockChecksums.extractFactorsAndChecksum).toBe('function');
    expect(typeof mockChecksums.calculateChecksum).toBe('function');
    
    // Test extractFactorsAndChecksum
    const result42 = mockChecksums.extractFactorsAndChecksum(BigInt(42));
    expect(result42.coreFactors).toHaveLength(3);
    expect(result42.checksumPrime).toBe(BigInt(11));
    
    // Test calculateChecksum
    const checksum = mockChecksums.calculateChecksum([
      { prime: BigInt(2), exponent: 1 },
      { prime: BigInt(3), exponent: 1 },
      { prime: BigInt(7), exponent: 1 }
    ]);
    expect(checksum).toBe(BigInt(11));
  });
  
  it('provides a mock cache implementation', () => {
    const cache = new MockCache<string, number>(3);
    
    // Test basic cache operations
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBeUndefined();
    
    // Test cache eviction
    cache.set('d', 4);
    expect(cache.get('a')).toBeUndefined(); // 'a' should be evicted
    expect(cache.get('b')).toBe(2);
    
    // Test cache stats
    const stats = cache.getStats();
    expect(stats.size).toBe(3);
    expect(stats.hits).toBeGreaterThan(0);
    expect(stats.misses).toBeGreaterThan(0);
    
    // Test clear
    cache.clear();
    
    // Check stats immediately after clearing
    const statsAfterClear = cache.getStats();
    expect(statsAfterClear.size).toBe(0);
    expect(statsAfterClear.hits).toBe(0);
    expect(statsAfterClear.misses).toBe(0);
    
    // Verify cache is empty
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBeUndefined();
    expect(cache.get('d')).toBeUndefined();
  });
  
  it('can initialize and terminate a BaseModel', async () => {
    const model = new BaseModel({ name: 'test-verification-model' });
    
    // Test initialization
    const initResult = await model.initialize();
    expect(initResult.success).toBe(true);
    
    // Test state after initialization
    const state = model.getState();
    expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
    
    // Test reset
    const resetResult = await model.reset();
    expect(resetResult.success).toBe(true);
    
    // Test termination
    const terminateResult = await model.terminate();
    expect(terminateResult.success).toBe(true);
    
    // Test state after termination
    const finalState = model.getState();
    expect(finalState.lifecycle).toBe(ModelLifecycleState.Terminated);
  });
});
