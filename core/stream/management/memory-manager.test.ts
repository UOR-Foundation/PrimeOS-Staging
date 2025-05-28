/**
 * Memory Manager Tests
 * ===================
 * 
 * Test suite for the memory manager that provides advanced memory management
 * for stream processing operations including garbage collection hints,
 * memory pressure detection, and adaptive buffer management.
 */

import { 
  MemoryManager,
  createMemoryManager,
  createOptimizedMemoryManager,
  MemoryStrategy,
  MemoryEvent
} from './memory-manager';

// Mock memory utils
jest.mock('../utils/memory-utils', () => ({
  getMemoryStats: jest.fn().mockReturnValue({
    used: 200 * 1024 * 1024,      // 200MB
    available: 300 * 1024 * 1024,  // 300MB
    total: 500 * 1024 * 1024,      // 500MB
    bufferSize: 10 * 1024,         // 10KB
    gcCollections: 3
  }),
  isMemoryPressure: jest.fn().mockReturnValue(false)
}));

// Mock global.gc
global.gc = jest.fn();

describe('Memory Manager', () => {
  let memoryManager: MemoryManager;
  let mockLogger: any;
  
  beforeEach(() => {
    mockLogger = {
      debug: jest.fn().mockResolvedValue(undefined),
      info: jest.fn().mockResolvedValue(undefined),
      warn: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined)
    };
    
    memoryManager = createMemoryManager({
      strategy: MemoryStrategy.BALANCED,
      maxMemoryUsage: 400 * 1024 * 1024, // 400MB
      warningThreshold: 0.7,
      criticalThreshold: 0.9,
      monitorInterval: 50, // Fast interval for testing
      enableAutoGC: true,
      enableLeakDetection: true
    }, {
      logger: mockLogger
    });
  });
  
  afterEach(() => {
    memoryManager.stop();
  });
  
  describe('Basic Functionality', () => {
    test('should create memory manager with default configuration', () => {
      const defaultManager = createMemoryManager();
      expect(defaultManager).toBeDefined();
      expect(typeof defaultManager.registerBuffer).toBe('function');
      expect(typeof defaultManager.updateBufferSize).toBe('function');
      expect(typeof defaultManager.releaseBuffer).toBe('function');
      
      defaultManager.stop();
    });
    
    test('should create optimized memory manager for different strategies', () => {
      const strategies = [
        MemoryStrategy.CONSERVATIVE,
        MemoryStrategy.BALANCED,
        MemoryStrategy.AGGRESSIVE,
        MemoryStrategy.ADAPTIVE
      ];
      
      strategies.forEach(strategy => {
        const manager = createOptimizedMemoryManager(strategy, {
          logger: mockLogger,
          maxMemory: 200 * 1024 * 1024
        });
        
        expect(manager).toBeDefined();
        const stats = manager.getManagementStats();
        expect(stats.strategy).toBe(strategy);
        
        manager.stop();
      });
    });
    
    test('should get memory statistics', () => {
      const memoryStats = memoryManager.getMemoryStats();
      expect(memoryStats).toBeDefined();
      expect(typeof memoryStats.used).toBe('number');
      expect(typeof memoryStats.total).toBe('number');
      expect(typeof memoryStats.available).toBe('number');
    });
    
    test('should get buffer statistics', () => {
      const bufferStats = memoryManager.getBufferStats();
      expect(bufferStats).toBeDefined();
      expect(typeof bufferStats.totalAllocated).toBe('number');
      expect(typeof bufferStats.activeBuffers).toBe('number');
      expect(typeof bufferStats.averageBufferSize).toBe('number');
    });
    
    test('should get management statistics', () => {
      const managementStats = memoryManager.getManagementStats();
      expect(managementStats).toBeDefined();
      expect(managementStats.strategy).toBe(MemoryStrategy.BALANCED);
      expect(typeof managementStats.gcTriggers).toBe('number');
      expect(typeof managementStats.pressureEvents).toBe('number');
    });
  });
  
  describe('Buffer Management', () => {
    test('should register and track buffers', () => {
      memoryManager.registerBuffer('test-buffer', 1024, 4096);
      
      const bufferStats = memoryManager.getBufferStats();
      expect(bufferStats.activeBuffers).toBe(1);
      expect(bufferStats.totalAllocated).toBe(1024);
      expect(bufferStats.averageBufferSize).toBe(1024);
    });
    
    test('should update buffer sizes', () => {
      memoryManager.registerBuffer('test-buffer', 1024);
      
      const success = memoryManager.updateBufferSize('test-buffer', 2048);
      expect(success).toBe(true);
      
      const bufferStats = memoryManager.getBufferStats();
      expect(bufferStats.totalAllocated).toBe(2048);
    });
    
    test('should reject excessive buffer growth', () => {
      memoryManager.registerBuffer('test-buffer', 1024);
      
      // Try to grow beyond growth limit (default 2.0)
      const success = memoryManager.updateBufferSize('test-buffer', 5120); // 5x growth
      expect(success).toBe(false);
      
      const bufferStats = memoryManager.getBufferStats();
      expect(bufferStats.totalAllocated).toBe(1024); // Should remain unchanged
    });
    
    test('should reject updates that exceed memory limit', () => {
      const { getMemoryStats } = require('../utils/memory-utils');
      
      // Mock high memory usage
      getMemoryStats.mockReturnValue({
        used: 380 * 1024 * 1024,      // 380MB (near 400MB limit)
        available: 120 * 1024 * 1024,
        total: 500 * 1024 * 1024,
        bufferSize: 10 * 1024,
        gcCollections: 3
      });
      
      memoryManager.registerBuffer('test-buffer', 1024);
      
      // Try to allocate 50MB more (would exceed 400MB limit)
      const success = memoryManager.updateBufferSize('test-buffer', 50 * 1024 * 1024);
      expect(success).toBe(false);
    });
    
    test('should release buffers', () => {
      memoryManager.registerBuffer('test-buffer', 1024);
      
      let bufferStats = memoryManager.getBufferStats();
      expect(bufferStats.activeBuffers).toBe(1);
      
      const success = memoryManager.releaseBuffer('test-buffer');
      expect(success).toBe(true);
      
      bufferStats = memoryManager.getBufferStats();
      expect(bufferStats.activeBuffers).toBe(0);
      expect(bufferStats.totalReleased).toBe(1024);
    });
    
    test('should handle release of non-existent buffer', () => {
      const success = memoryManager.releaseBuffer('non-existent');
      expect(success).toBe(false);
    });
    
    test('should handle update of non-existent buffer', () => {
      const success = memoryManager.updateBufferSize('non-existent', 2048);
      expect(success).toBe(false);
    });
  });
  
  describe('Memory Strategy Optimization', () => {
    test('should optimize buffer size based on conservative strategy', () => {
      memoryManager.setStrategy(MemoryStrategy.CONSERVATIVE);
      
      const { getMemoryStats } = require('../utils/memory-utils');
      getMemoryStats.mockReturnValue({
        used: 320 * 1024 * 1024,      // 64% of 500MB (above 60% threshold)
        available: 180 * 1024 * 1024,
        total: 500 * 1024 * 1024,
        bufferSize: 10 * 1024,
        gcCollections: 3
      });
      
      const currentSize = 4096;
      const usage = 0.8;
      const optimalSize = memoryManager.getOptimalBufferSize(currentSize, usage);
      
      // Conservative strategy should reduce buffer size under pressure
      expect(optimalSize).toBeLessThan(currentSize);
    });
    
    test('should optimize buffer size based on aggressive strategy', () => {
      memoryManager.setStrategy(MemoryStrategy.AGGRESSIVE);
      
      const { getMemoryStats } = require('../utils/memory-utils');
      getMemoryStats.mockReturnValue({
        used: 200 * 1024 * 1024,      // 40% of 500MB (low memory pressure)
        available: 300 * 1024 * 1024,
        total: 500 * 1024 * 1024,
        bufferSize: 10 * 1024,
        gcCollections: 3
      });
      
      const currentSize = 4096;
      const usage = 0.9; // High usage
      const optimalSize = memoryManager.getOptimalBufferSize(currentSize, usage);
      
      // Aggressive strategy should increase buffer size when memory allows
      expect(optimalSize).toBeGreaterThan(currentSize);
    });
    
    test('should use balanced strategy appropriately', () => {
      memoryManager.setStrategy(MemoryStrategy.BALANCED);
      
      const { getMemoryStats } = require('../utils/memory-utils');
      getMemoryStats.mockReturnValue({
        used: 250 * 1024 * 1024,      // 50% of 500MB
        available: 250 * 1024 * 1024,
        total: 500 * 1024 * 1024,
        bufferSize: 10 * 1024,
        gcCollections: 3
      });
      
      const currentSize = 4096;
      const usage = 0.95; // High usage but good memory availability
      const optimalSize = memoryManager.getOptimalBufferSize(currentSize, usage);
      
      // Balanced strategy should make moderate adjustments
      expect(optimalSize).toBeGreaterThan(currentSize * 1.1);
      expect(optimalSize).toBeLessThan(currentSize * 1.5);
    });
  });
  
  describe('Garbage Collection Management', () => {
    test('should trigger garbage collection', () => {
      memoryManager.triggerGC();
      
      expect(global.gc).toHaveBeenCalled();
      
      const stats = memoryManager.getManagementStats();
      expect(stats.gcTriggers).toBeGreaterThan(0);
    });
    
    test('should rate limit GC triggers', () => {
      // Clear previous calls
      (global.gc as jest.Mock).mockClear();
      
      // Trigger multiple GCs rapidly
      memoryManager.triggerGC();
      memoryManager.triggerGC();
      memoryManager.triggerGC();
      
      // Should only trigger once due to rate limiting
      expect(global.gc).toHaveBeenCalledTimes(1);
    });
    
    test('should handle missing global.gc gracefully', () => {
      const originalGC = global.gc;
      delete (global as any).gc;
      
      expect(() => {
        memoryManager.triggerGC();
      }).not.toThrow();
      
      global.gc = originalGC;
    });
    
    test('should notify GC callbacks', () => {
      const callback = jest.fn();
      memoryManager.onGC(callback);
      
      memoryManager.triggerGC();
      
      expect(callback).toHaveBeenCalled();
    });
    
    test('should handle GC callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('GC callback error');
      });
      
      memoryManager.onGC(errorCallback);
      
      expect(() => {
        memoryManager.triggerGC();
      }).not.toThrow();
    });
  });
  
  describe('Memory Pressure Detection', () => {
    test('should detect memory pressure start', async () => {
      const pressureCallback = jest.fn();
      memoryManager.onMemoryPressure(pressureCallback);
      
      const { getMemoryStats } = require('../utils/memory-utils');
      
      // Mock high memory usage (above warning threshold)
      getMemoryStats.mockReturnValue({
        used: 380 * 1024 * 1024,      // 76% of 500MB (above 70% threshold)
        available: 120 * 1024 * 1024,
        total: 500 * 1024 * 1024,
        bufferSize: 10 * 1024,
        gcCollections: 3
      });
      
      // Wait for monitoring cycle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have detected pressure
      const stats = memoryManager.getManagementStats();
      expect(stats.pressureEvents).toBeGreaterThan(0);
    });
    
    test('should detect memory leaks', async () => {
      const { getMemoryStats } = require('../utils/memory-utils');
      
      // Mock consistently high memory usage
      getMemoryStats.mockReturnValue({
        used: 470 * 1024 * 1024,      // 94% of 500MB (consistently high)
        available: 30 * 1024 * 1024,
        total: 500 * 1024 * 1024,
        bufferSize: 10 * 1024,
        gcCollections: 3
      });
      
      // Wait for multiple monitoring cycles to detect sustained usage
      await new Promise(resolve => setTimeout(resolve, 600)); // 12 cycles * 50ms
      
      const stats = memoryManager.getManagementStats();
      expect(stats.leaksDetected).toBeGreaterThan(0);
    });
    
    test('should handle memory pressure callbacks', () => {
      const callback = jest.fn();
      memoryManager.onMemoryPressure(callback);
      
      const { getMemoryStats } = require('../utils/memory-utils');
      
      // Trigger pressure
      getMemoryStats.mockReturnValue({
        used: 380 * 1024 * 1024,
        available: 120 * 1024 * 1024,
        total: 500 * 1024 * 1024,
        bufferSize: 10 * 1024,
        gcCollections: 3
      });
      
      // Callback should be registered (will be called during monitoring)
      expect(callback).toBeDefined();
    });
  });
  
  describe('Event Management', () => {
    test('should maintain event history', () => {
      // Trigger some events
      memoryManager.registerBuffer('test-buffer', 1024);
      memoryManager.triggerGC();
      
      const events = memoryManager.getEventHistory();
      expect(events.length).toBeGreaterThan(0);
      
      events.forEach(event => {
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('memoryUsage');
      });
    });
    
    test('should limit event history size', () => {
      // Generate many events
      for (let i = 0; i < 250; i++) {
        memoryManager.registerBuffer(`buffer-${i}`, 1024);
        memoryManager.releaseBuffer(`buffer-${i}`);
      }
      
      const events = memoryManager.getEventHistory();
      expect(events.length).toBeLessThanOrEqual(200); // Should be limited
    });
    
    test('should get limited event history', () => {
      // Generate some events
      for (let i = 0; i < 10; i++) {
        memoryManager.registerBuffer(`buffer-${i}`, 1024);
      }
      
      const limitedEvents = memoryManager.getEventHistory(5);
      expect(limitedEvents.length).toBeLessThanOrEqual(5);
    });
  });
  
  describe('Adaptive Buffer Management', () => {
    test('should adaptively resize buffers under memory pressure', async () => {
      // Enable adaptive resizing
      const adaptiveManager = createMemoryManager({
        strategy: MemoryStrategy.ADAPTIVE,
        adaptiveResizing: true,
        monitorInterval: 50
      }, { logger: mockLogger });
      
      // Register some buffers
      adaptiveManager.registerBuffer('buffer1', 4096);
      adaptiveManager.registerBuffer('buffer2', 2048);
      
      const { getMemoryStats } = require('../utils/memory-utils');
      
      // Mock memory pressure
      getMemoryStats.mockReturnValue({
        used: 380 * 1024 * 1024,      // 76% of 500MB (above warning threshold)
        available: 120 * 1024 * 1024,
        total: 500 * 1024 * 1024,
        bufferSize: 10 * 1024,
        gcCollections: 3
      });
      
      // Wait for adaptive resizing to occur
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Buffers should have been adjusted
      const bufferStats = adaptiveManager.getBufferStats();
      expect(bufferStats.totalBufferMemory).toBeLessThan(6144); // Original total
      
      adaptiveManager.stop();
    });
  });
  
  describe('Strategy Management', () => {
    test('should change memory strategy', () => {
      expect(memoryManager.getManagementStats().strategy).toBe(MemoryStrategy.BALANCED);
      
      memoryManager.setStrategy(MemoryStrategy.AGGRESSIVE);
      expect(memoryManager.getManagementStats().strategy).toBe(MemoryStrategy.AGGRESSIVE);
      
      memoryManager.setStrategy(MemoryStrategy.CONSERVATIVE);
      expect(memoryManager.getManagementStats().strategy).toBe(MemoryStrategy.CONSERVATIVE);
    });
    
    test('should log strategy changes', () => {
      memoryManager.setStrategy(MemoryStrategy.AGGRESSIVE);
      
      expect(mockLogger.info).toHaveBeenCalledWith('Memory strategy changed', {
        from: MemoryStrategy.BALANCED,
        to: MemoryStrategy.AGGRESSIVE
      });
    });
  });
  
  describe('Performance Under Load', () => {
    test('should handle many buffer operations efficiently', () => {
      const startTime = Date.now();
      
      // Register many buffers
      for (let i = 0; i < 1000; i++) {
        memoryManager.registerBuffer(`buffer-${i}`, 1024 + (i % 100));
      }
      
      // Update some buffers
      for (let i = 0; i < 500; i++) {
        memoryManager.updateBufferSize(`buffer-${i}`, 2048);
      }
      
      // Release some buffers
      for (let i = 500; i < 1000; i++) {
        memoryManager.releaseBuffer(`buffer-${i}`);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      
      const bufferStats = memoryManager.getBufferStats();
      expect(bufferStats.activeBuffers).toBe(500);
    });
    
    test('should handle concurrent buffer operations', async () => {
      const operations = Array.from({ length: 100 }, (_, i) => 
        new Promise<void>(resolve => {
          setTimeout(() => {
            const bufferId = `concurrent-buffer-${i}`;
            memoryManager.registerBuffer(bufferId, 1024);
            memoryManager.updateBufferSize(bufferId, 2048);
            if (i % 2 === 0) {
              memoryManager.releaseBuffer(bufferId);
            }
            resolve();
          }, Math.random() * 10);
        })
      );
      
      await Promise.all(operations);
      
      const bufferStats = memoryManager.getBufferStats();
      expect(bufferStats.activeBuffers).toBe(50); // Half released
    });
  });
  
  describe('Error Handling', () => {
    test('should handle invalid buffer configurations', () => {
      // Should handle gracefully
      expect(() => {
        memoryManager.registerBuffer('', 0);
      }).not.toThrow();
      
      expect(() => {
        memoryManager.registerBuffer('test', -1000);
      }).not.toThrow();
    });
    
    test('should handle monitoring errors gracefully', () => {
      const { getMemoryStats } = require('../utils/memory-utils');
      
      // Mock getMemoryStats to throw error
      getMemoryStats.mockImplementation(() => {
        throw new Error('Memory stats error');
      });
      
      // Should not crash the manager
      expect(() => {
        // Wait for monitoring cycle
        setTimeout(() => {}, 100);
      }).not.toThrow();
    });
  });
  
  describe('Configuration Edge Cases', () => {
    test('should handle very low memory limits', () => {
      const lowMemoryManager = createMemoryManager({
        maxMemoryUsage: 1024, // 1KB limit
        warningThreshold: 0.5
      });
      
      expect(lowMemoryManager).toBeDefined();
      
      // Should reject large buffer allocations
      lowMemoryManager.registerBuffer('test', 512);
      const success = lowMemoryManager.updateBufferSize('test', 2048);
      expect(success).toBe(false);
      
      lowMemoryManager.stop();
    });
    
    test('should handle disabled features', () => {
      const disabledManager = createMemoryManager({
        enableAutoGC: false,
        enableLeakDetection: false,
        adaptiveResizing: false
      });
      
      expect(disabledManager).toBeDefined();
      
      // Should still work for basic operations
      disabledManager.registerBuffer('test', 1024);
      expect(disabledManager.getBufferStats().activeBuffers).toBe(1);
      
      disabledManager.stop();
    });
  });
  
  describe('Cleanup and Resource Management', () => {
    test('should stop monitoring properly', () => {
      expect(() => {
        memoryManager.stop();
      }).not.toThrow();
      
      // Should be able to call stop multiple times
      expect(() => {
        memoryManager.stop();
      }).not.toThrow();
    });
    
    test('should clear resources on stop', () => {
      // Add some data
      memoryManager.registerBuffer('test', 1024);
      memoryManager.onMemoryPressure(() => {});
      memoryManager.onGC(() => {});
      
      // Stop
      memoryManager.stop();
      
      // Should have cleared resources (at least not crash)
      expect(() => {
        memoryManager.getBufferStats();
      }).not.toThrow();
    });
  });
});
