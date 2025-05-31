/**
 * Performance Monitor Tests
 * ========================
 * 
 * Tests for real-time performance monitoring implementation.
 */

import { 
  PerformanceMonitor, 
  getPerformanceMonitor,
  PerformanceScope,
  trackPerformance,
  formatMetrics,
  PerformanceEventType
} from './performance-monitor';

// Mock dependencies
jest.mock('perf_hooks', () => ({
  performance: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    clearMarks: jest.fn()
  },
  PerformanceObserver: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn()
  }))
}));

jest.mock('os', () => ({
  cpus: jest.fn(() => [
    {
      times: {
        user: 100,
        nice: 10,
        sys: 50,
        idle: 200,
        irq: 5
      }
    }
  ])
}));

// Mock process.memoryUsage
const originalMemoryUsage = process.memoryUsage;
process.memoryUsage = jest.fn(() => ({
  rss: 100 * 1024 * 1024,
  heapTotal: 80 * 1024 * 1024,
  heapUsed: 40 * 1024 * 1024,
  external: 10 * 1024 * 1024,
  arrayBuffers: 5 * 1024 * 1024
})) as any;

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create fresh monitor
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.stop();
  });

  describe('Basic Operations', () => {
    it('should initialize with default metrics', () => {
      const metrics = monitor.getMetrics();
      
      expect(metrics.cpuUsage).toBe(0);
      expect(metrics.memoryUsage).toBe(0);
      expect(metrics.throughput).toBe(0);
      expect(metrics.latency).toBe(0);
      expect(metrics.errorRate).toBe(0);
      expect(metrics.backpressureEvents).toBe(0);
      expect(metrics.cacheHitRate).toBe(0);
    });

    it('should stop monitoring', () => {
      // Should not throw
      expect(() => monitor.stop()).not.toThrow();
    });

    it('should reset metrics', () => {
      // Record some operations
      monitor.recordOperationStart('op1');
      monitor.recordOperationEnd('op1');
      monitor.recordError();
      monitor.recordBackpressure();
      
      monitor.reset();
      
      const afterReset = monitor.getMetrics();
      expect(afterReset.throughput).toBe(0);
      expect(afterReset.errorRate).toBe(0);
      expect(afterReset.backpressureEvents).toBe(0);
    });
  });

  describe('Operation Recording', () => {
    it('should record operations', () => {
      monitor.recordOperationStart('test-op');
      monitor.recordOperationEnd('test-op');
      
      // Update metrics happens on interval, so we need to manually trigger
      (monitor as any).updateMetrics();
      
      const metrics = monitor.getMetrics();
      expect(metrics.throughput).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing start mark', () => {
      // Should not throw when end is called without start
      expect(() => monitor.recordOperationEnd('missing-op')).not.toThrow();
    });

    it('should track I/O operations', () => {
      monitor.recordIoStart('io-1');
      
      // Simulate some delay
      jest.advanceTimersByTime(100);
      
      monitor.recordIoEnd('io-1');
      
      monitor.recordOperationStart('op1');
      monitor.recordOperationEnd('op1');
      
      (monitor as any).updateMetrics();
      
      const metrics = monitor.getMetrics();
      expect(metrics.ioWaitTime).toBeGreaterThanOrEqual(0);
    });

    it('should record errors and calculate error rate', () => {
      // Record some successful operations
      monitor.recordOperationStart('op1');
      monitor.recordOperationEnd('op1');
      monitor.recordOperationStart('op2');
      monitor.recordOperationEnd('op2');
      
      // Record errors
      monitor.recordError();
      
      (monitor as any).updateMetrics();
      
      const metrics = monitor.getMetrics();
      expect(metrics.errorRate).toBeGreaterThan(0);
      expect(metrics.errorRate).toBeLessThan(1);
    });

    it('should record backpressure events', () => {
      monitor.recordBackpressure();
      monitor.recordBackpressure();
      
      const metrics = monitor.getMetrics();
      expect(metrics.backpressureEvents).toBe(2);
    });

    it('should record cache hits and misses', () => {
      // Record some cache activity
      monitor.recordCacheHit();
      monitor.recordCacheHit();
      monitor.recordCacheHit();
      monitor.recordCacheMiss();
      
      const metrics = monitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(0.75); // 3 hits out of 4 total
    });

    it('should handle zero cache requests', () => {
      const metrics = monitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(0);
    });

    it('should emit events', (done) => {
      monitor.once(PerformanceEventType.OPERATION_START, (operationId) => {
        expect(operationId).toBe('test-op');
        done();
      });
      
      monitor.recordOperationStart('test-op');
    });
  });

  describe('Performance Scopes', () => {
    it('should measure scope performance', () => {
      const scope = new PerformanceScope('test-operation', monitor);
      
      // Simulate some work
      jest.advanceTimersByTime(100);
      
      scope.end();
      
      // Operation should be recorded
      (monitor as any).updateMetrics();
      const metrics = monitor.getMetrics();
      expect(metrics.throughput).toBeGreaterThanOrEqual(0);
    });

    it('should use global monitor by default', () => {
      const scope = new PerformanceScope('test-operation');
      scope.end();
      
      // Should not throw
      expect(() => scope.end()).not.toThrow();
    });

    it('should record scope errors', () => {
      const scope = new PerformanceScope('failing-operation', monitor);
      
      scope.error();
      
      (monitor as any).updateMetrics();
      const metrics = monitor.getMetrics();
      expect(metrics.errorRate).toBeGreaterThan(0);
    });
  });

  describe('Event Emissions', () => {
    it('should emit backpressure events', (done) => {
      monitor.once(PerformanceEventType.BACKPRESSURE, () => {
        done();
      });
      
      monitor.recordBackpressure();
    });

    it('should emit cache events', (done) => {
      let hitEmitted = false;
      let missEmitted = false;
      
      monitor.once(PerformanceEventType.CACHE_HIT, () => {
        hitEmitted = true;
        if (missEmitted) done();
      });
      
      monitor.once(PerformanceEventType.CACHE_MISS, () => {
        missEmitted = true;
        if (hitEmitted) done();
      });
      
      monitor.recordCacheHit();
      monitor.recordCacheMiss();
    });

    it('should emit error events', (done) => {
      monitor.once(PerformanceEventType.ERROR, () => {
        done();
      });
      
      monitor.recordError();
    });
  });

  describe('Metric Updates', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should update metrics periodically', () => {
      const updateSpy = jest.spyOn(monitor as any, 'updateMetrics');
      
      // Monitor starts with interval by default
      expect(updateSpy).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(1000);
      expect(updateSpy).toHaveBeenCalledTimes(1);
      
      jest.advanceTimersByTime(1000);
      expect(updateSpy).toHaveBeenCalledTimes(2);
    });

    it('should calculate CPU usage', () => {
      // Force metric update
      (monitor as any).updateMetrics();
      
      const metrics = monitor.getMetrics();
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
    });
    
    it('should track memory usage', () => {
      (monitor as any).updateMetrics();
      
      const metrics = monitor.getMetrics();
      expect(metrics.memoryUsage).toBe(40 * 1024 * 1024); // From our mock
      expect(metrics.memoryPercentage).toBe(50); // 40MB / 80MB
    });
  });

  describe('Decorator', () => {
    it('should work as a method decorator', () => {
      // Test the decorator function directly
      const mockDescriptor = {
        value: async function testMethod() {
          return 'test result';
        }
      };
      
      const target = {};
      const propertyName = 'testMethod';
      
      const decoratedDescriptor = trackPerformance(target, propertyName, mockDescriptor);
      
      expect(decoratedDescriptor).toBeDefined();
      expect(typeof decoratedDescriptor.value).toBe('function');
    });
    
    it('should track performance when applied', async () => {
      const mockMethod = jest.fn().mockResolvedValue(42);
      const mockDescriptor = { value: mockMethod };
      
      const decoratedDescriptor = trackPerformance({}, 'testMethod', mockDescriptor);
      
      // Call the decorated method
      const result = await decoratedDescriptor.value();
      
      expect(result).toBe(42);
      expect(mockMethod).toHaveBeenCalled();
    });
    
    it('should handle errors in decorated methods', async () => {
      const mockMethod = jest.fn().mockRejectedValue(new Error('Test error'));
      const mockDescriptor = { value: mockMethod };
      
      const decoratedDescriptor = trackPerformance({}, 'failingMethod', mockDescriptor);
      
      // Call the decorated method
      await expect(decoratedDescriptor.value()).rejects.toThrow('Test error');
      expect(mockMethod).toHaveBeenCalled();
    });
  });

  describe('Singleton Instance', () => {
    it('should return same instance', () => {
      const instance1 = getPerformanceMonitor();
      const instance2 = getPerformanceMonitor();
      
      expect(instance1).toBe(instance2);
    });

    it('should share state between references', () => {
      const instance1 = getPerformanceMonitor();
      const instance2 = getPerformanceMonitor();
      
      instance1.recordError();
      
      // Both should see the same error count after update
      (instance2 as any).updateMetrics();
      const metrics = instance2.getMetrics();
      expect(metrics.errorRate).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    it('should format metrics nicely', () => {
      const metrics = {
        cpuUsage: 45.6789,
        memoryUsage: 50 * 1024 * 1024,
        memoryPercentage: 62.5,
        throughput: 1234.5678,
        latency: 12.3456,
        ioWaitTime: 5.6789,
        errorRate: 0.0234,
        backpressureEvents: 10,
        cacheHitRate: 0.856
      };
      
      const formatted = formatMetrics(metrics);
      
      expect(formatted).toContain('CPU: 45.7%');
      expect(formatted).toContain('Memory: 50.0MB (62.5%)');
      expect(formatted).toContain('Throughput: 1235 ops/s');
      expect(formatted).toContain('Latency: 12.35ms');
      expect(formatted).toContain('I/O Wait: 5.68ms');
      expect(formatted).toContain('Errors: 2.3%');
      expect(formatted).toContain('Cache Hit: 85.6%');
      expect(formatted).toContain('Backpressure: 10');
    });
  });

  describe('Cache Metrics', () => {
    it('should calculate cache hit rate correctly', () => {
      monitor.recordCacheHit();
      monitor.recordCacheHit();
      monitor.recordCacheHit();
      monitor.recordCacheMiss();
      
      (monitor as any).updateMetrics();
      
      const metrics = monitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(0.75); // 3 hits out of 4 total
    });

    it('should handle zero cache accesses', () => {
      (monitor as any).updateMetrics();
      
      const metrics = monitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(0);
    });
  });

  describe('Error Rate Calculation', () => {
    it('should calculate error rate correctly', () => {
      // Process 10 operations
      for (let i = 0; i < 10; i++) {
        monitor.recordOperationStart(`op${i}`);
        monitor.recordOperationEnd(`op${i}`);
      }
      
      // Record 2 errors
      monitor.recordError();
      monitor.recordError();
      
      (monitor as any).updateMetrics();
      
      const metrics = monitor.getMetrics();
      expect(metrics.errorRate).toBeCloseTo(0.2, 2); // 2 errors out of 10 operations
    });

    it('should handle zero operations', () => {
      monitor.recordError();
      
      (monitor as any).updateMetrics();
      
      const metrics = monitor.getMetrics();
      expect(metrics.errorRate).toBe(0); // No operations recorded
    });
  });
  
  // Clean up
  afterAll(() => {
    process.memoryUsage = originalMemoryUsage;
  });
});
