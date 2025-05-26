/**
 * BigInt Module Mock Exports
 * 
 * This file exports mocks for the bigint module that can be used by other modules
 * in their tests.
 */

// Re-export model and logging mocks
export * from '../__mocks__/os-model-mock';
export * from '../__mocks__/os-logging-mock';

// Import types for mocking
import { BigIntInterface, BigIntOptions, BigIntState } from '../types';
import { ModelResult, ModelLifecycleState } from '../__mocks__/os-model-mock';
import { createLogging } from '../__mocks__/os-logging-mock';

/**
 * Create a mock BigInt implementation
 */
export function createBigInt(options: BigIntOptions = {}): BigIntInterface {
  const state: BigIntState = {
    lifecycle: ModelLifecycleState.Uninitialized,
    lastStateChangeTime: Date.now(),
    uptime: 0,
    operationCount: {
      total: 0,
      success: 0,
      failed: 0
    },
    config: {
      strict: options.strict || false,
      enableCache: options.enableCache || true,
      radix: options.radix || 10,
      useOptimized: options.useOptimized || true,
      cacheSize: options.cacheSize || 1000
    },
    cache: {
      size: 0,
      hits: 0,
      misses: 0
    }
  };

  return {
    // BigInt operations interface methods
    bitLength: jest.fn().mockImplementation((value: bigint) => {
      state.cache.hits += 1;
      return value.toString(2).length;
    }),
    
    exactlyEquals: jest.fn().mockImplementation((a: bigint | number, b: bigint | number) => {
      return BigInt(a) === BigInt(b);
    }),
    
    toByteArray: jest.fn().mockImplementation((value: bigint) => {
      const hex = value.toString(16);
      const bytes = new Uint8Array(Math.ceil(hex.length / 2));
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
      }
      return bytes;
    }),
    
    fromByteArray: jest.fn().mockImplementation((bytes: Uint8Array) => {
      let hex = '';
      for (const byte of bytes) {
        hex += byte.toString(16).padStart(2, '0');
      }
      return BigInt('0x' + hex);
    }),
    
    getRandomBigInt: jest.fn().mockImplementation((bits: number) => {
      return BigInt(Math.floor(Math.random() * (2 ** Math.min(bits, 32))));
    }),
    
    isProbablePrime: jest.fn().mockImplementation((value: bigint, iterations?: number) => {
      // Simple mock - just check if odd and > 1
      return value > 1n && value % 2n === 1n;
    }),
    
    countLeadingZeros: jest.fn().mockImplementation((value: bigint) => {
      const bitStr = value.toString(2);
      let count = 0;
      for (const bit of bitStr) {
        if (bit === '0') count++;
        else break;
      }
      return count;
    }),
    
    countTrailingZeros: jest.fn().mockImplementation((value: bigint) => {
      const bitStr = value.toString(2);
      let count = 0;
      for (let i = bitStr.length - 1; i >= 0; i--) {
        if (bitStr[i] === '0') count++;
        else break;
      }
      return count;
    }),
    
    getBit: jest.fn().mockImplementation((value: bigint, position: number) => {
      return ((value >> BigInt(position)) & 1n) === 1n ? 1 : 0;
    }),
    
    setBit: jest.fn().mockImplementation((value: bigint, position: number, bitValue: 0 | 1) => {
      if (bitValue === 1) {
        return value | (1n << BigInt(position));
      } else {
        return value & ~(1n << BigInt(position));
      }
    }),
    
    modPow: jest.fn().mockImplementation((base: bigint, exponent: bigint, modulus: bigint) => {
      // Simple mock implementation
      let result = 1n;
      base = base % modulus;
      while (exponent > 0n) {
        if (exponent % 2n === 1n) {
          result = (result * base) % modulus;
        }
        exponent = exponent >> 1n;
        base = (base * base) % modulus;
      }
      return result;
    }),
    
    clearCache: jest.fn().mockImplementation(() => {
      state.cache = { size: 0, hits: 0, misses: 0 };
    }),
    
    // Model interface methods
    async initialize() {
      state.lifecycle = ModelLifecycleState.Ready;
      state.lastStateChangeTime = Date.now();
      return {
        success: true,
        timestamp: Date.now(),
        source: options.name || 'mock-bigint'
      };
    },
    
    async process(input: any): Promise<any> {
      state.operationCount.total += 1;
      state.operationCount.success += 1;
      return {
        success: true,
        data: input,
        timestamp: Date.now(),
        source: options.name || 'mock-bigint'
      };
    },
    
    getState() {
      return { ...state };
    },
    
    async reset() {
      state.operationCount = { total: 0, success: 0, failed: 0 };
      state.cache = { size: 0, hits: 0, misses: 0 };
      state.lastStateChangeTime = Date.now();
      return {
        success: true,
        timestamp: Date.now(),
        source: options.name || 'mock-bigint'
      };
    },
    
    async terminate() {
      state.lifecycle = ModelLifecycleState.Terminated;
      state.lastStateChangeTime = Date.now();
      return {
        success: true,
        timestamp: Date.now(),
        source: options.name || 'mock-bigint'
      };
    },
    
    createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T> {
      return {
        success,
        data,
        error,
        timestamp: Date.now(),
        source: options.name || 'mock-bigint'
      };
    }
  };
}

// Export default implementation
export const BigIntImplementation = createBigInt();

// Re-export types
export * from '../types';
