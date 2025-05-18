/**
 * BigInt Module Test Mock Implementation
 * 
 * This file provides a mock implementation of the BigInt module
 * that can be used for testing purposes.
 */

import { BigIntInterface, BigIntOptions, BigIntState } from '../types';
import { ModelResult, ModelLifecycleState, BaseModel } from './os-model-mock';

/**
 * Default constants for BigInt mock implementation
 */
export const BIGINT_MOCK_CONSTANTS = {
  DEFAULT_BIT_LENGTH: 64,
  DEFAULT_PRIME_RESULT: true,
  DEFAULT_ZERO: 0n,
  DEFAULT_ONE: 1n,
  DEFAULT_TWO: 2n
};

/**
 * Extended BigIntInterface with testing utilities
 */
export interface MockBigIntInterface extends BigIntInterface {
  _getMetrics: () => {
    operationCount: number;
    cacheHits: number;
    cacheMisses: number;
    primalityTestCount: number;
  };
}

/**
 * Create a mock BigInt module for testing
 */
export function createMockBigInt(options: BigIntOptions = {}): MockBigIntInterface {
  // Setup storage for mocked values
  const storage = new Map<any, any>();
  
  // Track metrics
  const metrics = {
    operationCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    primalityTestCount: 0
  };
  
  // Default state with ready lifecycle
  const state: BigIntState = {
    lifecycle: ModelLifecycleState.Ready,
    lastStateChangeTime: Date.now(),
    uptime: 0,
    operationCount: {
      total: 0,
      success: 0,
      failed: 0
    },
    config: {
      strict: options.strict || false,
      enableCache: options.enableCache !== false,
      radix: options.radix || 10,
      useOptimized: options.useOptimized !== false,
      cacheSize: options.cacheSize || 1000
    },
    cache: {
      size: 0,
      hits: 0,
      misses: 0
    }
  };
  
  return {
    // ModelInterface implementation
    initialize: async () => ({
      success: true,
      timestamp: Date.now(),
      source: options.name || 'mock-bigint'
    }),
    
    process: async <T, R>(request: any): Promise<ModelResult<R>> => {
      state.operationCount.total++;
      metrics.operationCount++;
      
      try {
        // Process based on operation type
        if (request.operation === 'bitLength') {
          return {
            success: true,
            data: BIGINT_MOCK_CONSTANTS.DEFAULT_BIT_LENGTH as unknown as R,
            timestamp: Date.now(),
            source: options.name || 'mock-bigint'
          };
        } else if (request.operation === 'isProbablePrime') {
          metrics.primalityTestCount++;
          return {
            success: true,
            data: BIGINT_MOCK_CONSTANTS.DEFAULT_PRIME_RESULT as unknown as R,
            timestamp: Date.now(),
            source: options.name || 'mock-bigint'
          };
        } else if (request.operation === 'modPow') {
          return {
            success: true,
            data: BIGINT_MOCK_CONSTANTS.DEFAULT_ONE as unknown as R,
            timestamp: Date.now(),
            source: options.name || 'mock-bigint'
          };
        } else {
          // Default response for unknown operations
          return {
            success: true,
            data: BIGINT_MOCK_CONSTANTS.DEFAULT_ZERO as unknown as R,
            timestamp: Date.now(),
            source: options.name || 'mock-bigint'
          };
        }
      } catch (error) {
        state.operationCount.failed++;
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
          source: options.name || 'mock-bigint'
        };
      }
    },
    
    getState: () => ({ ...state }),
    
    reset: async () => {
      storage.clear();
      state.operationCount = { total: 0, success: 0, failed: 0 };
      state.cache = { size: 0, hits: 0, misses: 0 };
      return {
        success: true,
        timestamp: Date.now(),
        source: options.name || 'mock-bigint'
      };
    },
    
    terminate: async () => {
      state.lifecycle = ModelLifecycleState.Terminated;
      return {
        success: true,
        timestamp: Date.now(),
        source: options.name || 'mock-bigint'
      };
    },
    
    createResult: <T>(success: boolean, data?: T, error?: string): ModelResult<T> => ({
      success,
      data,
      error,
      timestamp: Date.now(),
      source: options.name || 'mock-bigint'
    }),
    
    // BigIntInterface specific functions
    bitLength: (value: bigint) => {
      metrics.operationCount++;
      return BIGINT_MOCK_CONSTANTS.DEFAULT_BIT_LENGTH;
    },
    
    exactlyEquals: (a: bigint | number, b: bigint | number) => {
      metrics.operationCount++;
      return true;
    },
    
    toByteArray: (value: bigint) => {
      metrics.operationCount++;
      return new Uint8Array([0]);
    },
    
    fromByteArray: (bytes: Uint8Array) => {
      metrics.operationCount++;
      return 0n;
    },
    
    getRandomBigInt: (bitLength?: number) => {
      metrics.operationCount++;
      return 42n;
    },
    
    isProbablePrime: (value: bigint) => {
      metrics.operationCount++;
      metrics.primalityTestCount++;
      return BIGINT_MOCK_CONSTANTS.DEFAULT_PRIME_RESULT;
    },
    
    countLeadingZeros: (value: bigint) => {
      metrics.operationCount++;
      return 32;
    },
    
    countTrailingZeros: (value: bigint) => {
      metrics.operationCount++;
      return 0;
    },
    
    getBit: (value: bigint, bitIndex: number) => {
      metrics.operationCount++;
      return 0 as 0;
    },
    
    setBit: (value: bigint, bitIndex: number, bitValue: 0 | 1) => {
      metrics.operationCount++;
      return 0n;
    },
    
    modPow: (base: bigint, exponent: bigint, modulus: bigint) => {
      metrics.operationCount++;
      return BIGINT_MOCK_CONSTANTS.DEFAULT_ONE;
    },
    
    clearCache: () => {
      state.cache.size = 0;
      state.cache.hits = 0;
      state.cache.misses = 0;
    },
    
    // Additional testing utilities
    _getMetrics: () => ({ ...metrics })
  };
}
