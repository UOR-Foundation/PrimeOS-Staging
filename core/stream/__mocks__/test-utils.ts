/**
 * Stream Testing Utilities
 * ========================
 * 
 * Utility functions for testing stream processing components.
 */

import {
  StreamPerformanceMetrics,
  ProcessingContext,
  MemoryStats,
  OptimizationResult
} from '../types';

/**
 * Create a simple async iterable from array for testing
 */
export async function* createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  for (const item of items) {
    yield item;
  }
}

/**
 * Create test data for stream processing
 */
export function createTestData(count: number): number[] {
  return Array.from({ length: count }, (_, i) => i + 1);
}

/**
 * Create test bigint data for prime processing
 */
export function createTestBigIntData(count: number): bigint[] {
  return Array.from({ length: count }, (_, i) => BigInt(i + 2));
}

/**
 * Create a mock processing context
 */
export function createMockProcessingContext<T>(
  index: number = 0,
  totalChunks: number = 10
): ProcessingContext<T> {
  return {
    index,
    totalChunks,
    metadata: new Map(),
    startTime: Date.now(),
    processingTime: 0,
    memoryUsed: 1024
  };
}

/**
 * Create mock performance metrics
 */
export function createMockPerformanceMetrics(): StreamPerformanceMetrics {
  return {
    throughput: 100 + Math.random() * 400,
    latency: 10 + Math.random() * 30,
    memoryUsage: (50 + Math.random() * 50) * 1024 * 1024,
    errorRate: Math.random() * 0.02,
    backpressureEvents: Math.floor(Math.random() * 3),
    cacheHitRate: 0.85 + Math.random() * 0.15,
    cpuUsage: 0.3 + Math.random() * 0.4,
    ioWaitTime: Math.random() * 15
  };
}

/**
 * Create mock memory stats
 */
export function createMockMemoryStats(): MemoryStats {
  const total = 1024 * 1024 * 1024; // 1GB
  const used = Math.random() * total * 0.8;
  
  return {
    used,
    available: total - used,
    total,
    bufferSize: 8192,
    gcCollections: Math.floor(Math.random() * 20)
  };
}

/**
 * Simulate processing delay
 */
export function simulateDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create test factors for prime operations
 */
export function createTestFactors(): Array<{ prime: bigint; exponent: number }> {
  return [
    { prime: 2n, exponent: 3 },
    { prime: 3n, exponent: 2 },
    { prime: 5n, exponent: 1 }
  ];
}

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; executionTime: number }> {
  const start = performance.now();
  const result = await fn();
  const executionTime = performance.now() - start;
  
  return { result, executionTime };
}

/**
 * Create mock optimization result
 */
export function createMockOptimizationResult(): OptimizationResult {
  return {
    success: true,
    improvementPercentage: 5 + Math.random() * 20,
    newConfiguration: {
      chunkSize: 1024 + Math.floor(Math.random() * 2048),
      maxConcurrency: 4 + Math.floor(Math.random() * 4)
    },
    benchmarkResults: [],
    recommendations: [
      {
        type: 'configuration',
        priority: 'medium',
        description: 'Consider adjusting chunk size for better performance',
        expectedImprovement: 10,
        implementation: 'Set chunkSize to optimal value'
      }
    ]
  };
}

/**
 * Validate stream processing results
 */
export function validateStreamResults<T>(
  input: T[],
  output: T[],
  transformation?: (item: T) => T
): boolean {
  if (transformation) {
    const expected = input.map(transformation);
    return JSON.stringify(expected) === JSON.stringify(output);
  }
  
  return JSON.stringify(input) === JSON.stringify(output);
}

/**
 * Create test chunk configuration
 */
export function createTestChunkConfig() {
  return {
    chunkSize: 100,
    maxBufferSize: 1000,
    enableBackpressure: true,
    backpressureThreshold: 0.8,
    errorTolerance: 0.05,
    retryAttempts: 3,
    retryDelay: 100
  };
}

/**
 * Mock logger for testing
 */
export const mockLogger = {
  debug: jest.fn().mockResolvedValue(undefined),
  info: jest.fn().mockResolvedValue(undefined),
  warn: jest.fn().mockResolvedValue(undefined),
  error: jest.fn().mockResolvedValue(undefined)
};

/**
 * Reset mock logger calls
 */
export function resetMockLogger(): void {
  Object.values(mockLogger).forEach(fn => fn.mockClear());
}
