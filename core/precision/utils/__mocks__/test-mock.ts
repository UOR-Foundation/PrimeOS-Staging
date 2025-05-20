/**
 * Utility Module Test Mock Implementation
 * =====================================
 * 
 * This file provides a mock implementation of the utility module
 * that can be used for testing purposes.
 */

import { 
  MathUtilsInterface, 
  MathUtilsModelInterface,
  MathUtilsModelOptions,
  MathUtilsModelState,
  MathUtilsProcessInput,
  UTILITY_CONSTANTS
} from '../types';

import { ModelLifecycleState, ModelResult } from '../../../../os/model/types';
import { createLoggingMock } from './os-logging-mock';

/**
 * Default constants for MathUtils mock implementation
 */
export const UTILS_MOCK_CONSTANTS = {
  DEFAULT_BIT_LENGTH: 32,
  DEFAULT_EQUALS_RESULT: true,
  DEFAULT_ZERO: 0n,
  DEFAULT_ONE: 1n
};

/**
 * Extended MathUtilsInterface with testing utilities
 */
export interface MockMathUtilsInterface extends MathUtilsInterface {
  _getMetrics: () => {
    operationCount: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

/**
 * Create a mock MathUtils implementation with metrics tracking
 */
export function createMockMathUtils(options: MathUtilsModelOptions = {}): MockMathUtilsInterface {
  // Track metrics
  const metrics = {
    operationCount: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  
  return {
    bitLength: jest.fn().mockImplementation((value) => {
      metrics.operationCount++;
      
      if (typeof value === 'bigint') {
        return value.toString(2).length;
      }
      return Math.floor(Math.log2(Math.abs(value))) + 1;
    }),
    
    exactlyEquals: jest.fn().mockImplementation((a, b) => {
      metrics.operationCount++;
      return a === b;
    }),
    
    toByteArray: jest.fn().mockImplementation((value) => {
      metrics.operationCount++;
      
      // Create a simple byte array representation
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      
      if (typeof value === 'bigint') {
        // Simplified implementation for mock
        view.setBigUint64(0, value > 0n ? value : -value);
      } else {
        view.setFloat64(0, value);
      }
      
      return new Uint8Array(buffer);
    }),
    
    fromByteArray: jest.fn().mockImplementation((bytes) => {
      metrics.operationCount++;
      
      // Simple implementation for mock
      if (bytes.length === 0) {
        return 0n;
      }
      
      // Check if this is a negative value (has an extra 0xFF byte at the end)
      const isNegative = bytes.length >= 2 && bytes[bytes.length - 1] === 0xFF;
      
      // For simplicity, return a fixed value based on negativity
      return isNegative ? -1n : 1n;
    }),
    
    isSafeInteger: jest.fn().mockImplementation((value) => {
      metrics.operationCount++;
      
      if (typeof value === 'number') {
        return Number.isSafeInteger(value);
      }
      return value >= UTILITY_CONSTANTS.MIN_SAFE_BIGINT && 
             value <= UTILITY_CONSTANTS.MAX_SAFE_BIGINT;
    }),
    
    sign: jest.fn().mockImplementation((value) => {
      metrics.operationCount++;
      
      if (typeof value === 'number') {
        return Math.sign(value);
      }
      if (value < 0n) return -1;
      if (value > 0n) return 1;
      return 0;
    }),
    
    abs: jest.fn().mockImplementation((value) => {
      metrics.operationCount++;
      
      if (typeof value === 'number') {
        return Math.abs(value);
      }
      return value < 0n ? -value : value;
    }),
    
    isPowerOfTwo: jest.fn().mockImplementation((value) => {
      metrics.operationCount++;
      
      if (typeof value === 'number') {
        return value > 0 && (value & (value - 1)) === 0;
      }
      return value > 0n && (value & (value - 1n)) === 0n;
    }),
    
    // Additional testing utilities
    _getMetrics: () => ({ ...metrics })
  };
}

/**
 * Create a mock MathUtils model implementation with metrics tracking
 */
export function createMockMathUtilsModel(options: MathUtilsModelOptions = {}): MathUtilsModelInterface {
  // Create the base utils implementation
  const mockUtils = createMockMathUtils(options);
  
  // Track metrics
  const metrics = {
    operationCount: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  
  // Default state with ready lifecycle
  const state: MathUtilsModelState = {
    lifecycle: ModelLifecycleState.Ready,
    lastStateChangeTime: Date.now(),
    uptime: 0,
    operationCount: {
      total: 0,
      success: 0,
      failed: 0
    },
    config: {
      enableCache: options.enableCache !== false,
      useOptimized: options.useOptimized !== false,
      strict: options.strict || false,
      debug: options.debug || false,
      name: options.name || 'mock-utils',
      version: options.version || '1.0.0'
    },
    cache: {
      bitLengthCacheSize: 0,
      bitLengthCacheHits: 0,
      bitLengthCacheMisses: 0
    }
  };
  
  // Create a logger
  const logger = createLoggingMock();
  
  return {
    // Include all MathUtils methods
    ...mockUtils,
    
    // ModelInterface implementation
    initialize: async () => {
      state.lifecycle = ModelLifecycleState.Ready;
      state.lastStateChangeTime = Date.now();
      
      return {
        success: true,
        data: { initialized: true },
        timestamp: Date.now(),
        source: options.name || 'mock-utils'
      };
    },
    
    process: async <T = MathUtilsProcessInput, R = unknown>(input: T): Promise<R> => {
      state.operationCount.total++;
      metrics.operationCount++;
      
      try {
        let result: any;
        
        if (typeof input === 'object' && input !== null && 'operation' in input && 'params' in input) {
          const request = input as unknown as MathUtilsProcessInput;
          
          switch (request.operation) {
            case 'bitLength':
              result = mockUtils.bitLength(request.params[0]);
              break;
              
            case 'exactlyEquals':
              result = mockUtils.exactlyEquals(
                request.params[0],
                request.params[1]
              );
              break;
              
            case 'toByteArray':
              result = mockUtils.toByteArray(request.params[0]);
              break;
              
            case 'fromByteArray':
              result = mockUtils.fromByteArray(request.params[0]);
              break;
              
            case 'isSafeInteger':
              result = mockUtils.isSafeInteger(request.params[0]);
              break;
              
            case 'sign':
              result = mockUtils.sign(request.params[0]);
              break;
              
            case 'abs':
              result = mockUtils.abs(request.params[0]);
              break;
              
            case 'isPowerOfTwo':
              result = mockUtils.isPowerOfTwo(request.params[0]);
              break;
              
            default:
              throw new Error(`Unknown operation: ${(request as any).operation}`);
          }
        } else {
          // For direct function calls without the operation wrapper
          result = input;
        }
        
        state.operationCount.success++;
        
        // Return a ModelResult object
        return {
          success: true,
          data: result,
          timestamp: Date.now(),
          source: options.name || 'mock-utils'
        } as unknown as R;
      } catch (error) {
        state.operationCount.failed++;
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now(),
          source: options.name || 'mock-utils'
        } as unknown as R;
      }
    },
    
    getState: () => {
      // Update uptime when state is requested
      state.uptime = Date.now() - state.lastStateChangeTime;
      
      // Update cache statistics from metrics
      state.cache = {
        bitLengthCacheSize: 0,
        bitLengthCacheHits: metrics.cacheHits,
        bitLengthCacheMisses: metrics.cacheMisses
      };
      
      return { ...state };
    },
    
    reset: async () => {
      // Reset metrics
      metrics.operationCount = 0;
      metrics.cacheHits = 0;
      metrics.cacheMisses = 0;
      
      // Reset state counters
      state.operationCount = {
        total: 0,
        success: 0,
        failed: 0
      };
      
      state.cache = {
        bitLengthCacheSize: 0,
        bitLengthCacheHits: 0,
        bitLengthCacheMisses: 0
      };
      
      state.lastStateChangeTime = Date.now();
      
      return {
        success: true,
        data: { reset: true },
        timestamp: Date.now(),
        source: options.name || 'mock-utils'
      };
    },
    
    terminate: async () => {
      state.lifecycle = ModelLifecycleState.Terminated;
      state.lastStateChangeTime = Date.now();
      
      return {
        success: true,
        data: { terminated: true },
        timestamp: Date.now(),
        source: options.name || 'mock-utils'
      };
    },
    
    createResult: <T>(success: boolean, data?: T, error?: string): ModelResult<T> => ({
      success,
      data,
      error,
      timestamp: Date.now(),
      source: options.name || 'mock-utils'
    })
  };
}

// Export default instances
export const mockMathUtils = createMockMathUtils();
export const mockMathUtilsModel = createMockMathUtilsModel();
