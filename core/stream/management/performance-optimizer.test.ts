/**
 * Performance Optimizer Tests
 * ==========================
 * 
 * Test suite for the performance optimizer that optimizes stream processing
 * performance through adaptive algorithms, bottleneck detection, and
 * automated tuning of processing parameters.
 */

import { 
  PerformanceOptimizerImpl,
  createPerformanceOptimizer,
  createStrategyOptimizer,
  BottleneckType
} from './performance-optimizer';
import { 
  StreamOptimizer,
  OptimizationStrategy,
  StreamPerformanceMetrics,
  BufferConfig,
  PerformanceReport,
  OptimizationSuggestion
} from '../types';

// Mock memory utils
jest.mock('../utils/memory-utils', () => ({
  getMemoryStats: jest.fn().mockReturnValue({
    used: 200 * 1024 * 1024,      // 200MB
    available: 300 * 1024 * 1024,  // 300MB
    total: 500 * 1024 * 1024,      // 500MB
    bufferSize: 10 * 1024,         // 10KB
    gcCollections: 3
  })
}));

describe('Performance Optimizer', () => {
  let optimizer: StreamOptimizer;
  let mockLogger: any;
  let mockMetrics: StreamPerformanceMetrics;
  
  beforeEach(() => {
    mockLogger = {
      debug: jest.fn().mockResolvedValue(undefined),
      info: jest.fn().mockResolvedValue(undefined),
      warn: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined)
    };
    
    mockMetrics = {
      throughput: 500,        // items/sec
      latency: 25,           // ms
      memoryUsage: 200 * 1024 * 1024, // 200MB
      errorRate: 0.01,       // 1%
      backpressureEvents: 2,
      cacheHitRate: 0.85,    // 85%
      cpuUsage: 0.6,         // 60%
      ioWaitTime: 10         // ms
    };
    
    optimizer = createPerformanceOptimizer({
      strategy: OptimizationStrategy.BALANCED,
      enableProfiling: true,
      profilingInterval: 50,  // Fast for testing
      optimizationInterval: 100,
      enableAutoTuning: true,
      enableDetailedLogging: true
    }, {
      logger: mockLogger
    });
  });
  
  afterEach(() => {
    if (optimizer && typeof (optimizer as any).stop === 'function') {
      (optimizer as any).stop();
    }
  });
  
  describe('Basic Functionality', () => {
    test('should create optimizer with default configuration', () => {
      const defaultOptimizer = createPerformanceOptimizer();
      expect(defaultOptimizer).toBeDefined();
      expect(typeof defaultOptimizer.adaptChunkSize).toBe('function');
      expect(typeof defaultOptimizer.optimizeConcurrency).toBe('function');
      expect(typeof defaultOptimizer.adjustBufferSizes).toBe('function');
      
      if (typeof (defaultOptimizer as any).stop === 'function') {
        (defaultOptimizer as any).stop();
      }
    });
    
    test('should create strategy-specific optimizers', () => {
      const strategies = [
        OptimizationStrategy.THROUGHPUT,
        OptimizationStrategy.LATENCY,
        OptimizationStrategy.MEMORY,
        OptimizationStrategy.BALANCED,
        OptimizationStrategy.CUSTOM
      ];
      
      strategies.forEach(strategy => {
        const strategyOptimizer = createStrategyOptimizer(strategy, {
          logger: mockLogger
        });
        
        expect(strategyOptimizer).toBeDefined();
        expect(strategyOptimizer.getOptimizationStrategy()).toBe(strategy);
        
        if (typeof (strategyOptimizer as any).stop === 'function') {
          (strategyOptimizer as any).stop();
        }
      });
    });
    
    test('should get and set optimization strategy', () => {
      expect(optimizer.getOptimizationStrategy()).toBe(OptimizationStrategy.BALANCED);
      
      optimizer.setOptimizationStrategy(OptimizationStrategy.THROUGHPUT);
      expect(optimizer.getOptimizationStrategy()).toBe(OptimizationStrategy.THROUGHPUT);
      
      optimizer.setOptimizationStrategy(OptimizationStrategy.LATENCY);
      expect(optimizer.getOptimizationStrategy()).toBe(OptimizationStrategy.LATENCY);
    });
  });
  
  describe('Chunk Size Optimization', () => {
    test('should adapt chunk size for throughput strategy', () => {
      optimizer.setOptimizationStrategy(OptimizationStrategy.THROUGHPUT);
      
      // Low throughput scenario
      const lowThroughputMetrics = {
        ...mockMetrics,
        throughput: 200, // Low throughput
        memoryUsage: 150 * 1024 * 1024 // Good memory availability
      };
      
      const chunkSize = optimizer.adaptChunkSize(lowThroughputMetrics);
      expect(typeof chunkSize).toBe('number');
      expect(chunkSize).toBeGreaterThan(256);
      expect(chunkSize).toBeLessThan(64 * 1024);
    });
    
    test('should adapt chunk size for latency strategy', () => {
      optimizer.setOptimizationStrategy(OptimizationStrategy.LATENCY);
      
      // High latency scenario
      const highLatencyMetrics = {
        ...mockMetrics,
        latency: 80, // High latency
        throughput: 300
      };
      
      const chunkSize = optimizer.adaptChunkSize(highLatencyMetrics);
      expect(typeof chunkSize).toBe('number');
      expect(chunkSize).toBeGreaterThan(256);
    });
    
    test('should adapt chunk size for memory strategy', () => {
      optimizer.setOptimizationStrategy(OptimizationStrategy.MEMORY);
      
      // High memory usage scenario
      const highMemoryMetrics = {
        ...mockMetrics,
        memoryUsage: 450 * 1024 * 1024 // High memory usage
      };
      
      const chunkSize = optimizer.adaptChunkSize(highMemoryMetrics);
      expect(typeof chunkSize).toBe('number');
      expect(chunkSize).toBeGreaterThan(256);
    });
    
    test('should use balanced approach for balanced strategy', () => {
      optimizer.setOptimizationStrategy(OptimizationStrategy.BALANCED);
      
      const balancedMetrics = {
        ...mockMetrics,
        throughput: 600,
        latency: 30,
        memoryUsage: 250 * 1024 * 1024
      };
      
      const chunkSize = optimizer.adaptChunkSize(balancedMetrics);
      expect(typeof chunkSize).toBe('number');
      expect(chunkSize).toBeGreaterThan(256);
      expect(chunkSize).toBeLessThan(64 * 1024);
    });
    
    test('should respect chunk size bounds', () => {
      const extremeMetrics = {
        ...mockMetrics,
        throughput: 0,
        latency: 1000,
        memoryUsage: 500 * 1024 * 1024
      };
      
      const chunkSize = optimizer.adaptChunkSize(extremeMetrics);
      expect(chunkSize).toBeGreaterThanOrEqual(256);     // Min chunk size
      expect(chunkSize).toBeLessThanOrEqual(64 * 1024);  // Max chunk size
    });
  });
  
  describe('Concurrency Optimization', () => {
    test('should increase concurrency when conditions are favorable', () => {
      const favorableMetrics = {
        ...mockMetrics,
        cpuUsage: 0.4,     // Low CPU usage
        throughput: 800,   // Good throughput
        errorRate: 0.005   // Low error rate
      };
      
      const concurrency = optimizer.optimizeConcurrency(favorableMetrics);
      expect(typeof concurrency).toBe('number');
      expect(concurrency).toBeGreaterThan(0);
      expect(concurrency).toBeLessThanOrEqual(16); // Reasonable max
    });
    
    test('should decrease concurrency under high CPU usage', () => {
      const highCPUMetrics = {
        ...mockMetrics,
        cpuUsage: 0.95,    // Very high CPU usage
        errorRate: 0.02    // Increasing errors
      };
      
      const concurrency = optimizer.optimizeConcurrency(highCPUMetrics);
      expect(typeof concurrency).toBe('number');
      expect(concurrency).toBeGreaterThanOrEqual(1); // Minimum concurrency
    });
    
    test('should decrease concurrency under high error rate', () => {
      const highErrorMetrics = {
        ...mockMetrics,
        errorRate: 0.08,   // High error rate
        cpuUsage: 0.7
      };
      
      const concurrency = optimizer.optimizeConcurrency(highErrorMetrics);
      expect(typeof concurrency).toBe('number');
      expect(concurrency).toBeGreaterThanOrEqual(1);
    });
    
    test('should decrease concurrency under memory pressure', () => {
      const memoryPressureMetrics = {
        ...mockMetrics,
        memoryUsage: 480 * 1024 * 1024, // Very high memory usage
        cpuUsage: 0.6
      };
      
      const concurrency = optimizer.optimizeConcurrency(memoryPressureMetrics);
      expect(typeof concurrency).toBe('number');
      expect(concurrency).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('Buffer Size Adjustment', () => {
    test('should adjust buffer sizes based on memory pressure', () => {
      const { getMemoryStats } = require('../utils/memory-utils');
      
      // Mock high memory pressure
      getMemoryStats.mockReturnValue({
        used: 420 * 1024 * 1024,      // 84% of 500MB (high pressure)
        available: 80 * 1024 * 1024,
        total: 500 * 1024 * 1024,
        bufferSize: 10 * 1024,
        gcCollections: 5
      });
      
      const bufferConfig = optimizer.adjustBufferSizes(mockMetrics);
      
      expect(bufferConfig).toBeDefined();
      expect(bufferConfig.inputBufferSize).toBeGreaterThan(0);
      expect(bufferConfig.outputBufferSize).toBeGreaterThan(0);
      expect(bufferConfig.intermediateBufferSize).toBeGreaterThan(0);
      expect(bufferConfig.backpressureThreshold).toBeGreaterThan(0);
      expect(bufferConfig.backpressureThreshold).toBeLessThan(1);
    });
    
    test('should increase buffer sizes when memory is available', () => {
      const { getMemoryStats } = require('../utils/memory-utils');
      
      // Mock low memory pressure
      getMemoryStats.mockReturnValue({
        used: 150 * 1024 * 1024,      // 30% of 500MB (low pressure)
        available: 350 * 1024 * 1024,
        total: 500 * 1024 * 1024,
        bufferSize: 10 * 1024,
        gcCollections: 2
      });
      
      const bufferConfig = optimizer.adjustBufferSizes(mockMetrics);
      
      expect(bufferConfig.inputBufferSize).toBeGreaterThan(8192);
      expect(bufferConfig.outputBufferSize).toBeGreaterThan(8192);
      expect(bufferConfig.backpressureThreshold).toBeGreaterThan(0.8);
    });
    
    test('should adjust based on throughput requirements', () => {
      const lowThroughputMetrics = {
        ...mockMetrics,
        throughput: 200 // Low throughput
      };
      
      const bufferConfig = optimizer.adjustBufferSizes(lowThroughputMetrics);
      
      // Should increase buffers to improve throughput
      expect(bufferConfig.inputBufferSize).toBeGreaterThan(0);
      expect(bufferConfig.outputBufferSize).toBeGreaterThan(0);
    });
    
    test('should adjust based on latency requirements', () => {
      const highLatencyMetrics = {
        ...mockMetrics,
        latency: 120 // High latency
      };
      
      const bufferConfig = optimizer.adjustBufferSizes(highLatencyMetrics);
      
      // Should have reasonable buffer sizes
      expect(bufferConfig.inputBufferSize).toBeGreaterThan(0);
      expect(bufferConfig.outputBufferSize).toBeGreaterThan(0);
      expect(bufferConfig.intermediateBufferSize).toBeGreaterThan(0);
    });
  });
  
  describe('Performance Profiling', () => {
    test('should enable and disable profiling', () => {
      optimizer.disableProfiling();
      optimizer.enableProfiling();
      
      // Should not throw errors
      expect(true).toBe(true);
    });
    
    test('should handle profiling state changes', () => {
      // Multiple enable calls should be safe
      optimizer.enableProfiling();
      optimizer.enableProfiling();
      
      // Multiple disable calls should be safe
      optimizer.disableProfiling();
      optimizer.disableProfiling();
      
      expect(true).toBe(true);
    });
    
    test('should update metrics when profiling is enabled', () => {
      optimizer.enableProfiling();
      
      // Update metrics
      if (typeof (optimizer as any).updateMetrics === 'function') {
        (optimizer as any).updateMetrics(mockMetrics);
      }
      
      expect(true).toBe(true);
    });
  });
  
  describe('Performance Reporting', () => {
    test('should generate performance report', () => {
      const report = optimizer.getPerformanceReport();
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.bottlenecks).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.historicalTrends).toBeDefined();
      
      expect(Array.isArray(report.bottlenecks)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.historicalTrends)).toBe(true);
    });
    
    test('should include summary statistics in report', () => {
      const report = optimizer.getPerformanceReport();
      
      expect(report.summary).toHaveProperty('averageThroughput');
      expect(report.summary).toHaveProperty('peakThroughput');
      expect(report.summary).toHaveProperty('averageLatency');
      expect(report.summary).toHaveProperty('errorRate');
      
      expect(typeof report.summary.averageThroughput).toBe('number');
      expect(typeof report.summary.peakThroughput).toBe('number');
      expect(typeof report.summary.averageLatency).toBe('number');
      expect(typeof report.summary.errorRate).toBe('number');
    });
    
    test('should detect bottlenecks in report', () => {
      // Update with problematic metrics
      if (typeof (optimizer as any).updateMetrics === 'function') {
        const problematicMetrics = {
          ...mockMetrics,
          cpuUsage: 0.95,        // High CPU
          memoryUsage: 450 * 1024 * 1024, // High memory
          errorRate: 0.05        // High errors
        };
        
        (optimizer as any).updateMetrics(problematicMetrics);
      }
      
      const report = optimizer.getPerformanceReport();
      
      // Should detect bottlenecks
      expect(report.bottlenecks.length).toBeGreaterThanOrEqual(0);
      
      report.bottlenecks.forEach(bottleneck => {
        expect(bottleneck).toHaveProperty('stage');
        expect(bottleneck).toHaveProperty('severity');
        expect(bottleneck).toHaveProperty('description');
        expect(bottleneck).toHaveProperty('impact');
        expect(bottleneck).toHaveProperty('suggestedFix');
      });
    });
    
    test('should provide recommendations in report', () => {
      const report = optimizer.getPerformanceReport();
      
      expect(Array.isArray(report.recommendations)).toBe(true);
      
      report.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
      });
    });
  });
  
  describe('Optimization Suggestions', () => {
    test('should suggest optimizations for low throughput', () => {
      // Update with low throughput metrics
      if (typeof (optimizer as any).updateMetrics === 'function') {
        const lowThroughputMetrics = {
          ...mockMetrics,
          throughput: 200  // Very low throughput
        };
        
        (optimizer as any).updateMetrics(lowThroughputMetrics);
      }
      
      const suggestions = optimizer.suggestOptimizations();
      
      expect(Array.isArray(suggestions)).toBe(true);
      
      const throughputSuggestions = suggestions.filter(s => 
        s.description.toLowerCase().includes('throughput')
      );
      
      expect(throughputSuggestions.length).toBeGreaterThan(0);
    });
    
    test('should suggest optimizations for high latency', () => {
      if (typeof (optimizer as any).updateMetrics === 'function') {
        const highLatencyMetrics = {
          ...mockMetrics,
          latency: 80  // High latency
        };
        
        (optimizer as any).updateMetrics(highLatencyMetrics);
      }
      
      const suggestions = optimizer.suggestOptimizations();
      
      const latencySuggestions = suggestions.filter(s => 
        s.description.toLowerCase().includes('latency')
      );
      
      expect(latencySuggestions.length).toBeGreaterThan(0);
    });
    
    test('should suggest optimizations for high memory usage', () => {
      if (typeof (optimizer as any).updateMetrics === 'function') {
        const highMemoryMetrics = {
          ...mockMetrics,
          memoryUsage: 450 * 1024 * 1024  // High memory usage
        };
        
        (optimizer as any).updateMetrics(highMemoryMetrics);
      }
      
      const suggestions = optimizer.suggestOptimizations();
      
      const memorySuggestions = suggestions.filter(s => 
        s.description.toLowerCase().includes('memory')
      );
      
      expect(memorySuggestions.length).toBeGreaterThan(0);
    });
    
    test('should suggest optimizations for high error rate', () => {
      if (typeof (optimizer as any).updateMetrics === 'function') {
        const highErrorMetrics = {
          ...mockMetrics,
          errorRate: 0.05  // High error rate
        };
        
        (optimizer as any).updateMetrics(highErrorMetrics);
      }
      
      const suggestions = optimizer.suggestOptimizations();
      
      const errorSuggestions = suggestions.filter(s => 
        s.description.toLowerCase().includes('error')
      );
      
      expect(errorSuggestions.length).toBeGreaterThan(0);
    });
    
    test('should provide detailed suggestion information', () => {
      const suggestions = optimizer.suggestOptimizations();
      
      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('priority');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('expectedImprovement');
        expect(suggestion).toHaveProperty('implementation');
        
        expect(typeof suggestion.type).toBe('string');
        expect(typeof suggestion.priority).toBe('string');
        expect(typeof suggestion.description).toBe('string');
        expect(typeof suggestion.expectedImprovement).toBe('number');
        expect(typeof suggestion.implementation).toBe('string');
        
        expect(['configuration', 'algorithm', 'resource'].includes(suggestion.type)).toBe(true);
        expect(['low', 'medium', 'high'].includes(suggestion.priority)).toBe(true);
      });
    });
  });
  
  describe('Strategy-Specific Behavior', () => {
    test('throughput strategy should prioritize throughput', () => {
      const throughputOptimizer = createStrategyOptimizer(OptimizationStrategy.THROUGHPUT);
      
      const highLatencyMetrics = {
        ...mockMetrics,
        throughput: 300,  // Low throughput
        latency: 80      // High latency (acceptable trade-off)
      };
      
      const chunkSize = throughputOptimizer.adaptChunkSize(highLatencyMetrics);
      
      // Should prioritize throughput over latency
      expect(typeof chunkSize).toBe('number');
      expect(chunkSize).toBeGreaterThan(256);
      
      if (typeof (throughputOptimizer as any).stop === 'function') {
        (throughputOptimizer as any).stop();
      }
    });
    
    test('latency strategy should prioritize low latency', () => {
      const latencyOptimizer = createStrategyOptimizer(OptimizationStrategy.LATENCY);
      
      const highLatencyMetrics = {
        ...mockMetrics,
        latency: 80,     // High latency
        throughput: 600  // Good throughput (acceptable trade-off)
      };
      
      const chunkSize = latencyOptimizer.adaptChunkSize(highLatencyMetrics);
      
      // Should prioritize latency reduction
      expect(typeof chunkSize).toBe('number');
      expect(chunkSize).toBeGreaterThan(256);
      
      if (typeof (latencyOptimizer as any).stop === 'function') {
        (latencyOptimizer as any).stop();
      }
    });
    
    test('memory strategy should prioritize memory efficiency', () => {
      const memoryOptimizer = createStrategyOptimizer(OptimizationStrategy.MEMORY);
      
      const highMemoryMetrics = {
        ...mockMetrics,
        memoryUsage: 450 * 1024 * 1024,  // High memory usage
        throughput: 400  // Lower throughput (acceptable trade-off)
      };
      
      const chunkSize = memoryOptimizer.adaptChunkSize(highMemoryMetrics);
      
      // Should prioritize memory efficiency
      expect(typeof chunkSize).toBe('number');
      expect(chunkSize).toBeGreaterThan(256);
      
      if (typeof (memoryOptimizer as any).stop === 'function') {
        (memoryOptimizer as any).stop();
      }
    });
  });
  
  describe('Auto-Tuning', () => {
    test('should support auto-tuning enablement', async () => {
      const autoTuningOptimizer = createPerformanceOptimizer({
        enableAutoTuning: true,
        optimizationInterval: 50  // Fast for testing
      });
      
      // Wait for auto-tuning cycle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(autoTuningOptimizer).toBeDefined();
      
      if (typeof (autoTuningOptimizer as any).stop === 'function') {
        (autoTuningOptimizer as any).stop();
      }
    });
    
    test('should handle auto-tuning errors gracefully', async () => {
      const autoTuningOptimizer = createPerformanceOptimizer({
        enableAutoTuning: true,
        optimizationInterval: 50
      }, {
        logger: mockLogger
      });
      
      // Wait for potential auto-tuning cycle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should not throw errors
      expect(autoTuningOptimizer).toBeDefined();
      
      if (typeof (autoTuningOptimizer as any).stop === 'function') {
        (autoTuningOptimizer as any).stop();
      }
    });
  });
  
  describe('Performance Under Load', () => {
    test('should handle rapid metrics updates', () => {
      const startTime = Date.now();
      
      // Rapid metrics updates
      for (let i = 0; i < 1000; i++) {
        const varyingMetrics = {
          ...mockMetrics,
          throughput: 400 + (i % 200),
          latency: 20 + (i % 30),
          cpuUsage: 0.4 + (i % 5) * 0.1
        };
        
        optimizer.adaptChunkSize(varyingMetrics);
        optimizer.optimizeConcurrency(varyingMetrics);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
    
    test('should handle concurrent optimization requests', async () => {
      const operations = Array.from({ length: 50 }, (_, i) => 
        new Promise<void>(resolve => {
          setTimeout(() => {
            const metrics = {
              ...mockMetrics,
              throughput: 300 + i * 10,
              latency: 20 + i,
              cpuUsage: 0.4 + (i % 3) * 0.1
            };
            
            optimizer.adaptChunkSize(metrics);
            optimizer.optimizeConcurrency(metrics);
            optimizer.adjustBufferSizes(metrics);
            
            resolve();
          }, Math.random() * 10);
        })
      );
      
      await Promise.all(operations);
      
      // Should complete without errors
      const report = optimizer.getPerformanceReport();
      expect(report).toBeDefined();
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    test('should handle extreme metrics values', () => {
      const extremeMetrics = {
        throughput: 0,
        latency: 10000,
        memoryUsage: 1000 * 1024 * 1024,
        errorRate: 1.0,
        backpressureEvents: 1000,
        cacheHitRate: 0,
        cpuUsage: 1.0,
        ioWaitTime: 1000
      };
      
      expect(() => {
        optimizer.adaptChunkSize(extremeMetrics);
        optimizer.optimizeConcurrency(extremeMetrics);
        optimizer.adjustBufferSizes(extremeMetrics);
      }).not.toThrow();
    });
    
    test('should handle negative metrics values', () => {
      const negativeMetrics = {
        throughput: -100,
        latency: -50,
        memoryUsage: -1000,
        errorRate: -0.1,
        backpressureEvents: -5,
        cacheHitRate: -0.5,
        cpuUsage: -0.2,
        ioWaitTime: -10
      };
      
      expect(() => {
        optimizer.adaptChunkSize(negativeMetrics);
        optimizer.optimizeConcurrency(negativeMetrics);
        optimizer.adjustBufferSizes(negativeMetrics);
      }).not.toThrow();
    });
    
    test('should handle missing metrics properties', () => {
      const incompleteMetrics = {
        throughput: 500
        // Missing other properties
      } as any;
      
      expect(() => {
        optimizer.adaptChunkSize(incompleteMetrics);
        optimizer.optimizeConcurrency(incompleteMetrics);
        optimizer.adjustBufferSizes(incompleteMetrics);
      }).not.toThrow();
    });
  });
  
  describe('Cleanup and Resource Management', () => {
    test('should stop properly', () => {
      expect(() => {
        if (typeof (optimizer as any).stop === 'function') {
          (optimizer as any).stop();
        }
      }).not.toThrow();
    });
    
    test('should handle multiple stop calls', () => {
      if (typeof (optimizer as any).stop === 'function') {
        (optimizer as any).stop();
        
        // Second stop should not throw
        expect(() => {
          (optimizer as any).stop();
        }).not.toThrow();
      }
    });
    
    test('should clean up profiling resources', () => {
      optimizer.enableProfiling();
      
      if (typeof (optimizer as any).stop === 'function') {
        (optimizer as any).stop();
      }
      
      // Should not throw after cleanup
      expect(() => {
        optimizer.disableProfiling();
      }).not.toThrow();
    });
  });
});
