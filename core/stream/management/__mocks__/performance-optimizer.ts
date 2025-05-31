/**
 * Mock Performance Optimizer
 * ==========================
 */

export const mockOptimizer = {
  adaptChunkSize: jest.fn().mockReturnValue(4096),
  optimizeConcurrency: jest.fn().mockReturnValue(8),
  adjustBufferSizes: jest.fn().mockReturnValue({
    inputBufferSize: 8192,
    outputBufferSize: 8192,
    intermediateBufferSize: 4096,
    backpressureThreshold: 0.8
  }),
  enableProfiling: jest.fn(),
  disableProfiling: jest.fn(),
  getPerformanceReport: jest.fn().mockReturnValue({
    summary: {
      averageThroughput: 750,
      peakThroughput: 1200,
      averageLatency: 25,
      errorRate: 0.01
    },
    bottlenecks: [],
    recommendations: ['Increase buffer sizes for better throughput'],
    historicalTrends: []
  }),
  suggestOptimizations: jest.fn().mockReturnValue([]),
  setOptimizationStrategy: jest.fn(),
  getOptimizationStrategy: jest.fn().mockReturnValue('balanced'),
  updateMetrics: jest.fn(),
  stop: jest.fn()
};

export const PerformanceOptimizerImpl = jest.fn(() => mockOptimizer);
export const createPerformanceOptimizer = jest.fn(() => mockOptimizer);
export const createStrategyOptimizer = jest.fn(() => mockOptimizer);

export enum OptimizationStrategy {
  THROUGHPUT = 'throughput',
  LATENCY = 'latency',
  MEMORY = 'memory',
  BALANCED = 'balanced',
  CUSTOM = 'custom'
}
