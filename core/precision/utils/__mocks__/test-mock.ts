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
import { createLogging } from './os-logging-mock';

/**
 * Default constants for MathUtils mock implementation
 */
export const UTILS_MOCK_CONSTANTS = {
  DEFAULT_BIT_LENGTH: 32,
  DEFAULT_EQUALS_RESULT: true,
  DEFAULT_ZERO: BigInt(0),
  DEFAULT_ONE: BigInt(1)
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
  
  const mockUtils: MockMathUtilsInterface = {
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
        view.setBigUint64(0, value > BigInt(0) ? value : -value);
      } else {
        view.setFloat64(0, value);
      }
      
      return new Uint8Array(buffer);
    }),
    
    fromByteArray: jest.fn().mockImplementation((bytes) => {
      metrics.operationCount++;
      
      // Simple implementation for mock
      if (bytes.length === 0) {
        return BigInt(0);
      }
      
      // Check if this is a negative value (has an extra 0xFF byte at the end)
      const isNegative = bytes.length >= 2 && bytes[bytes.length - 1] === 0xFF;
      
      // For simplicity, return a fixed value based on negativity
      return isNegative ? -BigInt(1) : BigInt(1);
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
      if (value < BigInt(0)) return -1;
      if (value > BigInt(0)) return 1;
      return 0;
    }),
    
    abs: jest.fn().mockImplementation((value) => {
      metrics.operationCount++;
      
      if (typeof value === 'number') {
        return Math.abs(value);
      }
      return value < BigInt(0) ? -value : value;
    }),
    
    isPowerOfTwo: jest.fn().mockImplementation((value) => {
      metrics.operationCount++;
      
      if (typeof value === 'number') {
        return value > 0 && (value & (value - 1)) === 0;
      }
      return value > BigInt(0) && (value & (value - BigInt(1))) === BigInt(0);
    }),
    
    // Additional math utilities
    gcd: jest.fn().mockImplementation((a, b) => {
      metrics.operationCount++;
      // Simple GCD implementation for mock
      while (b !== BigInt(0)) {
        const temp = b;
        b = a % b;
        a = temp;
      }
      return a;
    }),
    
    lcm: jest.fn().mockImplementation((a, b) => {
      metrics.operationCount++;
      const gcdResult = mockUtils.gcd(a, b);
      
      // Ensure type consistency for division
      if (typeof a === 'bigint' || typeof b === 'bigint') {
        const bigA = typeof a === 'bigint' ? a : BigInt(a);
        const bigB = typeof b === 'bigint' ? b : BigInt(b);
        const bigGcd = typeof gcdResult === 'bigint' ? gcdResult : BigInt(gcdResult);
        return (bigA * bigB) / bigGcd;
      } else {
        const numGcd = typeof gcdResult === 'number' ? gcdResult : Number(gcdResult);
        return (a * b) / numGcd;
      }
    }),
    
    extendedGcd: jest.fn().mockImplementation((a, b) => {
      metrics.operationCount++;
      // Simple implementation for mock
      return [mockUtils.gcd(a, b), BigInt(1), BigInt(0)];
    }),
    
    integerSqrt: jest.fn().mockImplementation((n) => {
      metrics.operationCount++;
      // Simple implementation for mock
      if (n < BigInt(0)) throw new Error('Cannot compute square root of negative number');
      if (n === BigInt(0)) return BigInt(0);
      return BigInt(1); // Simplified for mock
    }),
    
    ceilDiv: jest.fn().mockImplementation((a, b) => {
      metrics.operationCount++;
      return (a + b - BigInt(1)) / b;
    }),
    
    floorDiv: jest.fn().mockImplementation((a, b) => {
      metrics.operationCount++;
      return a / b;
    }),
    
    countSetBits: jest.fn().mockImplementation((n) => {
      metrics.operationCount++;
      let count = 0;
      while (n > BigInt(0)) {
        count += Number(n & BigInt(1));
        n >>= BigInt(1);
      }
      return count;
    }),
    
    leadingZeros: jest.fn().mockImplementation((n) => {
      metrics.operationCount++;
      // Simplified for mock - assume 64-bit
      return 64 - mockUtils.bitLength(n);
    }),
    
    trailingZeros: jest.fn().mockImplementation((n) => {
      metrics.operationCount++;
      if (n === BigInt(0)) return 64; // Assume 64-bit
      let count = 0;
      while ((n & BigInt(1)) === BigInt(0)) {
        count++;
        n >>= BigInt(1);
      }
      return count;
    }),
    
    // Additional testing utilities
    _getMetrics: () => ({ ...metrics })
  };
  
  return mockUtils;
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
  const logger = createLogging({ name: options.name || 'mock-utils' });
  
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
