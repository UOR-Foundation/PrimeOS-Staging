/**
 * Cache Mock Test
 * 
 * This file tests the functionality of the Cache mocks.
 * It verifies that the mocks are correctly exported and can be used as expected.
 */
/// <reference types="jest" />

import { describe, it, expect } from '@jest/globals';
import { BaseModel, ModelResult, ModelLifecycleState } from './os-model-mock';
import { createLogging } from './os-logging-mock';
import { createMockCache, CACHE_CONSTANTS } from './index';
import * as types from '../types';

// No need for jest.mock() calls as we're importing the mocks directly above

describe('Cache Mocks', () => {
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
  
  it('creates a mock cache that implements CacheModelInterface', () => {
    const mockCache = createMockCache({ name: 'test-mock-cache' });
    
    // Test basic interface implementation
    expect(mockCache).toBeDefined();
    expect(typeof mockCache.initialize).toBe('function');
    expect(typeof mockCache.terminate).toBe('function');
    expect(typeof mockCache.getState).toBe('function');
    expect(typeof mockCache.process).toBe('function');
    expect(typeof mockCache.reset).toBe('function');
    expect(typeof mockCache.createResult).toBe('function');
    
    // Test Cache specific functions
    expect(typeof mockCache.get).toBe('function');
    expect(typeof mockCache.set).toBe('function');
    expect(typeof mockCache.has).toBe('function');
    expect(typeof mockCache.delete).toBe('function');
    expect(typeof mockCache.clear).toBe('function');
    expect(typeof mockCache.getMetrics).toBe('function');
    expect(typeof mockCache.optimize).toBe('function');
    expect(typeof mockCache.setMaxSize).toBe('function');
    expect(typeof mockCache.setMaxAge).toBe('function');
  });
  
  it('provides default mock functionality for cache operations', async () => {
    const mockCache = createMockCache();
    
    // Test some key operations with their defaults
    mockCache.set('key1', 'value1');
    expect(mockCache.get('key1')).toBe('value1');
    expect(mockCache.has('key1')).toBe(true);
    expect(mockCache.has('nonexistent')).toBe(false);
    
    // Test delete operation
    expect(mockCache.delete('key1')).toBe(true);
    expect(mockCache.has('key1')).toBe(false);
    
    // Test clear operation
    mockCache.set('key2', 'value2');
    mockCache.clear();
    expect(mockCache.has('key2')).toBe(false);
    
    // Test metrics
    const getMetricsMethod = mockCache.getMetrics;
    expect(getMetricsMethod).toBeDefined();
    if (getMetricsMethod) {
      const metrics = getMetricsMethod.call(mockCache);
      expect(metrics).toBeDefined();
      expect('hitCount' in metrics).toBe(true);
      expect('missCount' in metrics).toBe(true);
      expect('hitRate' in metrics).toBe(true);
    }
    
    // Test max size setting
    const setMaxSizeMethod = mockCache.setMaxSize;
    expect(setMaxSizeMethod).toBeDefined();
    if (setMaxSizeMethod) {
      setMaxSizeMethod.call(mockCache, 50);
    }
    const state = mockCache.getState();
    expect(state.config.maxSize).toBe(50);
  });
  
  it('processes operations through the ModelInterface', async () => {
    const mockCache = createMockCache();
    
    // Test handling different operation types through the process method
    await mockCache.process({
      operation: 'set',
      key: 'processKey',
      value: 'processValue'
    });
    
    const getResult = await mockCache.process({
      operation: 'get',
      key: 'processKey'
    });
    
    // Fix: The process method now returns a ModelResult object with the data inside
    expect(getResult.data).toBe('processValue');
    
    const hasResult = await mockCache.process({
      operation: 'has',
      key: 'processKey'
    });
    
    expect(hasResult.data).toBe(true);
    
    // Test clear through process
    await mockCache.process({
      operation: 'clear'
    });
    
    const hasAfterClear = await mockCache.process({
      operation: 'has',
      key: 'processKey'
    });
    
    expect(hasAfterClear.data).toBe(false);
  });
  
  it('can be initialized and terminated', async () => {
    const mockCache = createMockCache({ name: 'test-init-cache' });
    
    // Test initialization
    const initResult = await mockCache.initialize();
    expect(initResult.success).toBe(true);
    expect(initResult.source).toBe('test-init-cache');
    
    // Test state retrieval
    const state = mockCache.getState();
    expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
    expect(state.config).toBeDefined();
    expect(state.metrics).toBeDefined();
    
    // Test reset
    const resetResult = await mockCache.reset();
    expect(resetResult.success).toBe(true);
    
    // Test termination
    const terminateResult = await mockCache.terminate();
    expect(terminateResult.success).toBe(true);
    
    // Check final state
    const finalState = mockCache.getState();
    expect(finalState.lifecycle).toBe(ModelLifecycleState.Terminated);
  });
  
  it('exports constants correctly', () => {
    // Test that constants are exported
    expect(CACHE_CONSTANTS).toBeDefined();
    expect(CACHE_CONSTANTS.DEFAULT_MAX_SIZE).toBe(100);
    expect(CACHE_CONSTANTS.DEFAULT_MAX_AGE).toBe(3600000);
    expect(CACHE_CONSTANTS.DEFAULT_STRATEGY).toBe('lru');
  });
});
