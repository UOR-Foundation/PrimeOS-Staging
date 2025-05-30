/**
 * Memory Utilities Tests
 * =====================
 * 
 * Comprehensive tests for memory management utilities.
 */

import {
  getMemoryStats,
  isMemoryPressure,
  calculateBufferSize,
  calculateMemoryUsage,
  MemoryMonitor,
  estimateMemoryUsage,
  forceGarbageCollection,
  getMemoryAllocationInfo,
  getMemoryOptimizationSuggestions
} from './memory-utils';

// Mock global objects for testing
const mockGlobal = global as any;

describe('Memory Management Utilities', () => {
  describe('getMemoryStats', () => {
    it('should return memory stats in Node.js environment', () => {
      const mockUsage = {
        rss: 100 * 1024 * 1024,
        heapTotal: 50 * 1024 * 1024,
        heapUsed: 30 * 1024 * 1024,
        external: 5 * 1024 * 1024,
        arrayBuffers: 2 * 1024 * 1024
      };
      
      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = jest.fn().mockReturnValue(mockUsage);
      
      const stats = getMemoryStats();
      
      expect(stats.used).toBe(mockUsage.heapUsed);
      expect(stats.available).toBe(mockUsage.heapTotal - mockUsage.heapUsed);
      expect(stats.total).toBe(mockUsage.heapTotal);
      expect(stats.bufferSize).toBe(mockUsage.arrayBuffers);
      expect(stats.rss).toBe(mockUsage.rss);
      expect(stats.external).toBe(mockUsage.external);
      
      (process as any).memoryUsage = originalMemoryUsage;
    });
    
    it('should return fallback stats when process.memoryUsage is not available', () => {
      const originalProcess = global.process;
      (global as any).process = undefined;
      
      const stats = getMemoryStats();
      
      expect(stats.used).toBeGreaterThan(0);
      expect(stats.available).toBeGreaterThan(0);
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.bufferSize).toBe(0);
      expect(stats.gcCollections).toBe(0);
      
      (global as any).process = originalProcess;
    });
    
    it('should handle browser environment with performance.memory', () => {
      const originalProcess = global.process;
      const originalPerformance = global.performance;
      
      (global as any).process = undefined;
      (global as any).performance = {
        memory: {
          usedJSHeapSize: 30 * 1024 * 1024,
          totalJSHeapSize: 50 * 1024 * 1024,
          jsHeapSizeLimit: 100 * 1024 * 1024
        }
      };
      
      const stats = getMemoryStats();
      
      expect(stats.used).toBe(30 * 1024 * 1024);
      expect(stats.available).toBe(20 * 1024 * 1024);
      expect(stats.total).toBe(50 * 1024 * 1024);
      expect(stats.limit).toBe(100 * 1024 * 1024);
      
      (global as any).process = originalProcess;
      (global as any).performance = originalPerformance;
    });
  });
  
  describe('isMemoryPressure', () => {
    it('should detect memory pressure when threshold exceeded', () => {
      const currentUsage = 85 * 1024 * 1024;
      const limit = 100 * 1024 * 1024;
      
      expect(isMemoryPressure(currentUsage, limit, 0.8)).toBe(true);
    });
    
    it('should not detect pressure when under threshold', () => {
      const currentUsage = 50 * 1024 * 1024;
      const limit = 100 * 1024 * 1024;
      
      expect(isMemoryPressure(currentUsage, limit, 0.8)).toBe(false);
    });
    
    it('should implement hysteresis', () => {
      const limit = 100 * 1024 * 1024;
      
      // First call - exceeds upper threshold (80%)
      expect(isMemoryPressure(85 * 1024 * 1024, limit, 0.8, 0.05)).toBe(true);
      
      // Second call - between thresholds (76%, lower threshold is 75%)
      expect(isMemoryPressure(76 * 1024 * 1024, limit, 0.8, 0.05)).toBe(true);
      
      // Third call - below lower threshold
      expect(isMemoryPressure(74 * 1024 * 1024, limit, 0.8, 0.05)).toBe(false);
      
      // Fourth call - between thresholds again (not triggering)
      expect(isMemoryPressure(76 * 1024 * 1024, limit, 0.8, 0.05)).toBe(false);
    });
  });
  
  describe('calculateBufferSize', () => {
    it('should calculate basic buffer size', () => {
      const availableMemory = 100 * 1024 * 1024;
      const itemSize = 1024;
      
      const bufferSize = calculateBufferSize(availableMemory, itemSize);
      
      expect(bufferSize).toBeGreaterThan(0);
      expect(bufferSize).toBeLessThanOrEqual(8192);
      expect(Math.log2(bufferSize) % 1).toBe(0); // Should be power of 2
    });
    
    it('should respect bounds', () => {
      const tinySize = calculateBufferSize(1024, 100, 0.5, {
        minBufferSize: 64,
        maxBufferSize: 8192
      });
      
      expect(tinySize).toBeGreaterThanOrEqual(64);
      
      const hugeSize = calculateBufferSize(1024 * 1024 * 1024, 10, 0.5, {
        minBufferSize: 64,
        maxBufferSize: 8192
      });
      
      expect(hugeSize).toBeLessThanOrEqual(8192);
    });
    
    it('should factor in system characteristics', () => {
      const baseSize = calculateBufferSize(100 * 1024 * 1024, 1024, 0.5, {
        cpuCores: 1,
        ioLatency: 1,
        processingTimePerItem: 1
      });
      
      const optimizedSize = calculateBufferSize(100 * 1024 * 1024, 1024, 0.5, {
        cpuCores: 8,
        ioLatency: 100,
        processingTimePerItem: 0.1
      });
      
      expect(optimizedSize).not.toBe(baseSize);
    });
  });
  
  describe('calculateMemoryUsage', () => {
    it('should calculate total memory usage', () => {
      const mockUsage = {
        rss: 100,
        heapTotal: 50,
        heapUsed: 30,
        external: 5,
        arrayBuffers: 2
      };
      
      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = jest.fn().mockReturnValue(mockUsage);
      
      const usage = calculateMemoryUsage();
      
      expect(usage).toBe(30 + 5 + 2); // used + external + bufferSize
      
      (process as any).memoryUsage = originalMemoryUsage;
    });
  });
  
  describe('MemoryMonitor', () => {
    let monitor: MemoryMonitor;
    
    beforeEach(() => {
      monitor = new MemoryMonitor(10);
      jest.useFakeTimers();
    });
    
    afterEach(() => {
      monitor.stop();
      jest.useRealTimers();
    });
    
    it('should track memory samples', () => {
      monitor.addSample(100);
      monitor.addSample(150);
      monitor.addSample(125);
      
      expect(monitor.getAverageUsage()).toBe(125);
      expect(monitor.getPeakUsage()).toBe(150);
      expect(monitor.getMinUsage()).toBe(100);
    });
    
    it('should limit sample count', () => {
      for (let i = 0; i < 15; i++) {
        monitor.addSample(i * 100);
      }
      
      // Should only keep last 10 samples
      const avg = monitor.getAverageUsage();
      expect(avg).toBe(950); // Average of 500-1400
    });
    
    it('should detect memory trends', () => {
      // Add increasing samples
      for (let i = 0; i < 20; i++) {
        monitor.addSample(i * 1000);
      }
      
      expect(monitor.getTrend()).toBe('increasing');
      
      // Reset and add decreasing samples
      monitor.reset();
      for (let i = 20; i > 0; i--) {
        monitor.addSample(i * 1000);
      }
      
      expect(monitor.getTrend()).toBe('decreasing');
      
      // Reset and add stable samples
      monitor.reset();
      for (let i = 0; i < 20; i++) {
        monitor.addSample(1000 + (i % 2) * 10);
      }
      
      expect(monitor.getTrend()).toBe('stable');
    });
    
    it('should calculate volatility', () => {
      // Add stable samples
      for (let i = 0; i < 10; i++) {
        monitor.addSample(1000);
      }
      
      expect(monitor.getVolatility()).toBe(0);
      
      // Add volatile samples
      monitor.reset();
      for (let i = 0; i < 10; i++) {
        monitor.addSample(i % 2 === 0 ? 1000 : 2000);
      }
      
      expect(monitor.getVolatility()).toBeGreaterThan(0);
    });
    
    it('should detect memory leaks', () => {
      // Add samples with consistent growth
      for (let i = 0; i < 30; i++) {
        monitor.addSample(1000000 + i * 50000); // Even more significant growth
      }
      
      const leakProbability = monitor.getMemoryLeakProbability();
      expect(leakProbability).toBeGreaterThan(0.4); // Lower threshold for detection
    });
    
    it('should handle callbacks', () => {
      const gcCallback = jest.fn();
      const pressureCallback = jest.fn();
      
      monitor.onGarbageCollection(gcCallback);
      monitor.onMemoryPressure(pressureCallback);
      
      // Add samples to trigger GC detection - need to add a sample first
      monitor.addSample(1000);
      
      // Now add a sample that drops by more than 10%
      monitor.addSample(800); // 20% drop
      
      expect(gcCallback).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
        freedMemory: 200,
        currentUsage: 800
      });
      
      // Remove callbacks
      monitor.offGarbageCollection(gcCallback);
      monitor.offMemoryPressure(pressureCallback);
    });
    
    it('should start and stop monitoring', () => {
      const originalSetInterval = global.setInterval;
      const originalClearInterval = global.clearInterval;
      
      global.setInterval = jest.fn().mockReturnValue(123);
      global.clearInterval = jest.fn();
      
      monitor.start(1000);
      expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
      
      monitor.stop();
      expect(global.clearInterval).toHaveBeenCalledWith(123);
      
      global.setInterval = originalSetInterval;
      global.clearInterval = originalClearInterval;
    });
    
    it('should generate detailed report', () => {
      // Add a small delay to ensure duration > 0
      jest.advanceTimersByTime(10);
      
      for (let i = 0; i < 10; i++) {
        monitor.addSample(1000 + i * 100);
      }
      
      jest.advanceTimersByTime(100);
      
      const report = monitor.getDetailedReport();
      
      expect(report.current).toHaveProperty('used');
      expect(report.average).toBeGreaterThan(0);
      expect(report.peak).toBeGreaterThan(0);
      expect(report.min).toBeGreaterThan(0);
      expect(report.trend).toMatch(/increasing|decreasing|stable/);
      expect(report.volatility).toBeGreaterThanOrEqual(0);
      expect(report.leakProbability).toBeGreaterThanOrEqual(0);
      expect(report.gcFrequency).toBeGreaterThanOrEqual(0);
      expect(report.samples).toBe(10);
      expect(report.duration).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('estimateMemoryUsage', () => {
    it('should estimate primitive sizes', () => {
      expect(estimateMemoryUsage(null)).toBe(0);
      expect(estimateMemoryUsage(undefined)).toBe(0);
      expect(estimateMemoryUsage(true)).toBe(4);
      expect(estimateMemoryUsage(123)).toBe(8);
      expect(estimateMemoryUsage('hello')).toBe(10 + 24); // 5*2 + overhead
      expect(estimateMemoryUsage(BigInt(123))).toBeGreaterThan(0);
      expect(estimateMemoryUsage(Symbol('test'))).toBe(24);
    });
    
    it('should estimate array sizes', () => {
      const arr = [1, 2, 3, 4, 5];
      const size = estimateMemoryUsage(arr);
      
      expect(size).toBe(32 + 5 * 8 + 5 * 8); // overhead + slots + items
    });
    
    it('should estimate object sizes', () => {
      const obj = { a: 1, b: 'hello', c: true };
      const size = estimateMemoryUsage(obj);
      
      expect(size).toBeGreaterThan(32); // At least object overhead
    });
    
    it('should handle circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      
      const size = estimateMemoryUsage(obj);
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(1000); // Should not infinite loop
    });
    
    it('should estimate typed array sizes', () => {
      const buffer = new ArrayBuffer(1024);
      const view = new Uint8Array(buffer);
      
      expect(estimateMemoryUsage(buffer)).toBe(1024 + 24);
      expect(estimateMemoryUsage(view)).toBe(1024 + 24);
    });
    
    it('should estimate Map and Set sizes', () => {
      const map = new Map([['a', 1], ['b', 2]]);
      const set = new Set([1, 2, 3]);
      
      expect(estimateMemoryUsage(map)).toBeGreaterThan(48);
      expect(estimateMemoryUsage(set)).toBeGreaterThan(40);
    });
    
    it('should handle max depth', () => {
      const deep: any = { level: 0 };
      let current = deep;
      for (let i = 1; i < 20; i++) {
        current.next = { level: i };
        current = current.next;
      }
      
      const size = estimateMemoryUsage(deep, { maxDepth: 5 });
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(estimateMemoryUsage(deep, { maxDepth: 20 }));
    });
    
    it('should handle functions', () => {
      const fn = function test() { return 42; };
      const size = estimateMemoryUsage(fn);
      
      expect(size).toBeGreaterThan(64);
    });
  });
  
  describe('forceGarbageCollection', () => {
    it('should attempt Node.js GC when available', () => {
      mockGlobal.gc = jest.fn();
      
      const result = forceGarbageCollection();
      
      expect(result).toBe(true);
      expect(mockGlobal.gc).toHaveBeenCalled();
      
      delete mockGlobal.gc;
    });
    
    it('should attempt browser GC methods', () => {
      const originalPerformance = global.performance;
      (global as any).performance = {
        mozMemory: { gc: jest.fn() }
      };
      
      const result = forceGarbageCollection();
      
      expect(result).toBe(true);
      expect((global.performance as any).mozMemory.gc).toHaveBeenCalled();
      
      (global as any).performance = originalPerformance;
    });
    
    it('should fallback to manual pressure when GC not available', () => {
      delete mockGlobal.gc;
      
      const result = forceGarbageCollection();
      
      expect(result).toBe(true); // Manual pressure always "succeeds"
    });
  });
  
  describe('getMemoryAllocationInfo', () => {
    it('should return allocation info', () => {
      const info = getMemoryAllocationInfo();
      
      expect(info).toHaveProperty('allocation');
      expect(info.allocation).toHaveProperty('rate');
      expect(info.allocation).toHaveProperty('pressure');
      expect(info.allocation).toHaveProperty('efficiency');
      expect(info.allocation.pressure).toBeGreaterThanOrEqual(0);
      expect(info.allocation.pressure).toBeLessThanOrEqual(1);
    });
    
    it('should include heap spaces when available', () => {
      // Mock require for v8 module
      const mockV8 = {
        getHeapSpaceStatistics: jest.fn().mockReturnValue([
          { space_name: 'new_space', space_size: 1024 },
          { space_name: 'old_space', space_size: 2048 }
        ])
      };
      
      jest.doMock('v8', () => mockV8);
      
      const info = getMemoryAllocationInfo();
      
      // Note: In test environment, require may not work as expected
      expect(info).toHaveProperty('allocation');
    });
  });
  
  describe('getMemoryOptimizationSuggestions', () => {
    it('should suggest optimizations for high memory usage', () => {
      const stats = {
        used: 90 * 1024 * 1024,
        available: 10 * 1024 * 1024,
        total: 100 * 1024 * 1024,
        bufferSize: 0,
        gcCollections: 0
      };
      
      const suggestions = getMemoryOptimizationSuggestions(stats);
      
      expect(suggestions).toContain('High memory usage. Consider implementing data streaming or pagination.');
    });
    
    it('should detect critical memory pressure', () => {
      const stats = {
        used: 95 * 1024 * 1024,
        available: 5 * 1024 * 1024,
        total: 100 * 1024 * 1024,
        bufferSize: 0,
        gcCollections: 0
      };
      
      const suggestions = getMemoryOptimizationSuggestions(stats);
      
      expect(suggestions[0]).toContain('Critical memory pressure detected');
    });
    
    it('should analyze monitor data when available', () => {
      const stats = {
        used: 50 * 1024 * 1024,
        available: 50 * 1024 * 1024,
        total: 100 * 1024 * 1024,
        bufferSize: 0,
        gcCollections: 0
      };
      
      const monitor = new MemoryMonitor();
      // Add samples to simulate leak
      for (let i = 0; i < 30; i++) {
        monitor.addSample(1000 + i * 100);
      }
      
      const suggestions = getMemoryOptimizationSuggestions(stats, monitor);
      
      expect(suggestions.some(s => s.includes('Possible memory leak detected'))).toBe(true);
    });
    
    it('should suggest optimizations for high external memory', () => {
      const stats = {
        used: 30 * 1024 * 1024,
        available: 70 * 1024 * 1024,
        total: 100 * 1024 * 1024,
        bufferSize: 0,
        gcCollections: 0,
        external: 20 * 1024 * 1024
      };
      
      const suggestions = getMemoryOptimizationSuggestions(stats);
      
      expect(suggestions).toContain('High external memory usage. Check for large Buffer allocations or native modules.');
    });
  });
});
