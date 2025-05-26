/**
 * Utils Module Mock Exports
 * 
 * This file exports mocks for the utils module that can be used by other modules
 * in their tests. It leverages the cache mocks for proper integration.
 */

// Re-export model and logging mocks
export * from '../../__mocks__/os-model-mock';
export * from '../../__mocks__/os-logging-mock';

// Import cache mocks for integration
import { createMockCache } from '../../cache/__mocks__';

// Import types for mocking
import { 
  MathUtilsModelInterface, 
  MathUtilsModelOptions, 
  MathUtilsModelState 
} from '../types';
import { ModelResult, ModelLifecycleState } from '../../__mocks__/os-model-mock';
import { createLogging } from '../../__mocks__/os-logging-mock';

/**
 * Create a mock MathUtils implementation that integrates with cache mocks
 */
export function createMathUtils(options: MathUtilsModelOptions = {}): MathUtilsModelInterface {
  // Create a mock cache instance using the cache mocks
  const mockCache = options.enableCache !== false ? createMockCache({
    name: 'bitLength-cache',
    maxSize: 1000,
    metrics: true
  }) : null;

  const state: MathUtilsModelState = {
    lifecycle: ModelLifecycleState.Uninitialized,
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
      ...options
    },
    cache: {
      bitLengthCacheSize: 0,
      bitLengthCacheHits: 0,
      bitLengthCacheMisses: 0
    }
  };

  // Helper function for GCD calculation
  const calculateGcd = (a: bigint, b: bigint): bigint => {
    let bigA = a < 0n ? -a : a;
    let bigB = b < 0n ? -b : b;
    
    while (bigB !== 0n) {
      const temp = bigB;
      bigB = bigA % bigB;
      bigA = temp;
    }
    
    return bigA;
  };

  return {
    // Math utility interface methods with proper cache integration
    bitLength: jest.fn().mockImplementation((value: bigint | number) => {
      if (value === 0 || value === 0n) return 1;
      
      let result: number;
      if (typeof value === 'bigint') {
        const absValue = value < 0n ? -value : value;
        result = absValue.toString(2).length;
      } else {
        const absValue = Math.abs(value);
        result = absValue === 0 ? 1 : Math.floor(Math.log2(absValue)) + 1;
      }
      
      // Simulate cache behavior if enabled
      if (mockCache && state.config.enableCache) {
        const cacheKey = String(value);
        if (mockCache.has(cacheKey)) {
          state.cache!.bitLengthCacheHits += 1;
        } else {
          state.cache!.bitLengthCacheMisses += 1;
          mockCache.set(cacheKey, result);
        }
        
        // Update cache size from mock cache metrics
        const metrics = mockCache.getMetrics?.();
        if (metrics) {
          state.cache!.bitLengthCacheSize = metrics.currentSize;
        }
      }
      
      return result;
    }),
    
    exactlyEquals: jest.fn().mockImplementation((a: any, b: any) => {
      return a === b;
    }),
    
    toByteArray: jest.fn().mockImplementation((value: bigint | number) => {
      const bigintValue = typeof value === 'bigint' ? value : BigInt(value);
      let hex = bigintValue.toString(16);
      
      // Ensure even length for proper byte conversion
      if (hex.length % 2 !== 0) {
        hex = '0' + hex;
      }
      
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
      }
      return bytes;
    }),
    
    fromByteArray: jest.fn().mockImplementation((bytes: Uint8Array) => {
      if (bytes.length === 0) return 0n;
      
      let hex = '';
      for (const byte of bytes) {
        hex += byte.toString(16).padStart(2, '0');
      }
      return BigInt('0x' + hex);
    }),
    
    isSafeInteger: jest.fn().mockImplementation((value: bigint | number) => {
      if (typeof value === 'bigint') {
        return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER);
      }
      return Number.isSafeInteger(value);
    }),
    
    sign: jest.fn().mockImplementation((value: bigint | number) => {
      if (typeof value === 'bigint') {
        return value > 0n ? 1 : value < 0n ? -1 : 0;
      }
      return Math.sign(value);
    }),
    
    abs: jest.fn().mockImplementation((value: bigint | number) => {
      if (typeof value === 'bigint') {
        return value < 0n ? -value : value;
      }
      return Math.abs(value);
    }),
    
    isPowerOfTwo: jest.fn().mockImplementation((value: bigint | number) => {
      const bigintValue = typeof value === 'bigint' ? value : BigInt(value);
      return bigintValue > 0n && (bigintValue & (bigintValue - 1n)) === 0n;
    }),
    
    gcd: jest.fn().mockImplementation((a: bigint | number, b: bigint | number) => {
      const bigA = typeof a === 'bigint' ? a : BigInt(a);
      const bigB = typeof b === 'bigint' ? b : BigInt(b);
      const result = calculateGcd(bigA, bigB);
      
      return typeof a === 'number' && typeof b === 'number' ? Number(result) : result;
    }),
    
    lcm: jest.fn().mockImplementation((a: bigint | number, b: bigint | number) => {
      const bigA = typeof a === 'bigint' ? a : BigInt(a);
      const bigB = typeof b === 'bigint' ? b : BigInt(b);
      const gcdValue = calculateGcd(bigA, bigB);
      const result = (bigA * bigB) / gcdValue;
      
      return typeof a === 'number' && typeof b === 'number' ? Number(result) : result;
    }),
    
    extendedGcd: jest.fn().mockImplementation((a: bigint | number, b: bigint | number) => {
      let bigA = typeof a === 'bigint' ? a : BigInt(a);
      let bigB = typeof b === 'bigint' ? b : BigInt(b);
      
      let oldR = bigA, r = bigB;
      let oldS = 1n, s = 0n;
      let oldT = 0n, t = 1n;
      
      while (r !== 0n) {
        const quotient = oldR / r;
        [oldR, r] = [r, oldR - quotient * r];
        [oldS, s] = [s, oldS - quotient * s];
        [oldT, t] = [t, oldT - quotient * t];
      }
      
      return [oldR, oldS, oldT] as [bigint, bigint, bigint];
    }),
    
    integerSqrt: jest.fn().mockImplementation((value: bigint | number) => {
      const bigintValue = typeof value === 'bigint' ? value : BigInt(value);
      if (bigintValue < 0n) throw new Error('Cannot calculate square root of negative number');
      if (bigintValue === 0n) return typeof value === 'number' ? 0 : 0n;
      
      let x = bigintValue;
      let y = (x + 1n) / 2n;
      
      while (y < x) {
        x = y;
        y = (x + bigintValue / x) / 2n;
      }
      
      return typeof value === 'number' ? Number(x) : x;
    }),
    
    ceilDiv: jest.fn().mockImplementation((a: bigint | number, b: bigint | number) => {
      const bigA = typeof a === 'bigint' ? a : BigInt(a);
      const bigB = typeof b === 'bigint' ? b : BigInt(b);
      if (bigB === 0n) throw new Error('Division by zero');
      
      const result = (bigA + bigB - 1n) / bigB;
      return typeof a === 'number' && typeof b === 'number' ? Number(result) : result;
    }),
    
    floorDiv: jest.fn().mockImplementation((a: bigint | number, b: bigint | number) => {
      const bigA = typeof a === 'bigint' ? a : BigInt(a);
      const bigB = typeof b === 'bigint' ? b : BigInt(b);
      if (bigB === 0n) throw new Error('Division by zero');
      
      const result = bigA / bigB;
      return typeof a === 'number' && typeof b === 'number' ? Number(result) : result;
    }),
    
    countSetBits: jest.fn().mockImplementation((value: bigint | number) => {
      const bigintValue = typeof value === 'bigint' ? value : BigInt(value);
      const absValue = bigintValue < 0n ? -bigintValue : bigintValue;
      const binaryStr = absValue.toString(2);
      return (binaryStr.match(/1/g) || []).length;
    }),
    
    leadingZeros: jest.fn().mockImplementation((value: bigint | number) => {
      const bigintValue = typeof value === 'bigint' ? value : BigInt(value);
      const absValue = bigintValue < 0n ? -bigintValue : bigintValue;
      const binaryStr = absValue.toString(2);
      let count = 0;
      for (const bit of binaryStr) {
        if (bit === '0') count++;
        else break;
      }
      return count;
    }),
    
    trailingZeros: jest.fn().mockImplementation((value: bigint | number) => {
      const bigintValue = typeof value === 'bigint' ? value : BigInt(value);
      const absValue = bigintValue < 0n ? -bigintValue : bigintValue;
      const binaryStr = absValue.toString(2);
      let count = 0;
      for (let i = binaryStr.length - 1; i >= 0; i--) {
        if (binaryStr[i] === '0') count++;
        else break;
      }
      return count;
    }),
    
    // Model interface methods
    async initialize() {
      state.lifecycle = ModelLifecycleState.Ready;
      state.lastStateChangeTime = Date.now();
      
      // Initialize the mock cache if enabled
      if (mockCache) {
        await mockCache.initialize();
      }
      
      return {
        success: true,
        timestamp: Date.now(),
        source: options.name || 'mock-utils'
      };
    },
    
    async process(input: any): Promise<any> {
      state.operationCount.total += 1;
      state.operationCount.success += 1;
      return {
        success: true,
        data: input,
        timestamp: Date.now(),
        source: options.name || 'mock-utils'
      };
    },
    
    getState() {
      // Update cache metrics from mock cache if available
      if (mockCache && state.config.enableCache) {
        const cacheMetrics = mockCache.getMetrics?.();
        if (cacheMetrics) {
          state.cache = {
            bitLengthCacheSize: cacheMetrics.currentSize,
            bitLengthCacheHits: cacheMetrics.hitCount,
            bitLengthCacheMisses: cacheMetrics.missCount
          };
        }
      }
      
      return { ...state };
    },
    
    async reset() {
      state.operationCount = { total: 0, success: 0, failed: 0 };
      
      // Reset the mock cache if available
      if (mockCache) {
        await mockCache.reset();
      }
      
      state.cache = {
        bitLengthCacheSize: 0,
        bitLengthCacheHits: 0,
        bitLengthCacheMisses: 0
      };
      
      state.lastStateChangeTime = Date.now();
      return {
        success: true,
        timestamp: Date.now(),
        source: options.name || 'mock-utils'
      };
    },
    
    async terminate() {
      state.lifecycle = ModelLifecycleState.Terminated;
      state.lastStateChangeTime = Date.now();
      
      // Terminate the mock cache if available
      if (mockCache) {
        await mockCache.terminate();
      }
      
      return {
        success: true,
        timestamp: Date.now(),
        source: options.name || 'mock-utils'
      };
    },
    
    createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T> {
      return {
        success,
        data,
        error,
        timestamp: Date.now(),
        source: options.name || 'mock-utils'
      };
    }
  };
}

// Export default implementation
export const MathUtils = createMathUtils();

// Re-export types
export * from '../types';
