/**
 * Chunk Utilities Tests
 * ====================
 * 
 * Comprehensive tests for chunk processing utilities.
 */

import {
  createProcessingContext,
  calculateOptimalChunkSize,
  chunkArray,
  mergeChunks,
  validateChunk,
  calculateChunkStats,
  adaptChunkSize,
  chunkArrayWithOverlap,
  partitionChunks,
  calculateChunkChecksum,
  compressChunk,
  decompressChunk
} from './chunk-utils';

describe('Chunk Processing Utilities', () => {
  describe('createProcessingContext', () => {
    it('should create context with default values', () => {
      const context = createProcessingContext(0);
      
      expect(context.index).toBe(0);
      expect(context.totalChunks).toBe(-1);
      expect(context.previousResult).toBeUndefined();
      expect(context.metadata).toBeInstanceOf(Map);
      expect(context.startTime).toBeGreaterThan(0);
      expect(context.processingTime).toBe(0);
      expect(context.memoryUsed).toBe(0);
    });
    
    it('should create context with custom values', () => {
      const previousResult = [1, 2, 3];
      const context = createProcessingContext(5, 10, previousResult);
      
      expect(context.index).toBe(5);
      expect(context.totalChunks).toBe(10);
      expect(context.previousResult).toBe(previousResult);
    });
  });
  
  describe('calculateOptimalChunkSize', () => {
    it('should calculate basic chunk size', () => {
      const size = calculateOptimalChunkSize(
        10 * 1024 * 1024, // 10MB data
        100 * 1024 * 1024 // 100MB memory
      );
      
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThanOrEqual(1048576); // Max 1MB
    });
    
    it('should respect minimum chunk size', () => {
      const size = calculateOptimalChunkSize(
        100, // 100 bytes data
        1024 // 1KB memory
      );
      
      expect(size).toBeGreaterThanOrEqual(64); // Min 64 bytes
    });
    
    it('should handle different processing complexities', () => {
      const simpleSize = calculateOptimalChunkSize(
        10 * 1024 * 1024,
        100 * 1024 * 1024,
        1
      );
      
      const complexSize = calculateOptimalChunkSize(
        10 * 1024 * 1024,
        100 * 1024 * 1024,
        5
      );
      
      expect(complexSize).toBeLessThan(simpleSize);
    });
    
    it('should optimize for CPU cache', () => {
      const size = calculateOptimalChunkSize(
        100 * 1024 * 1024,
        1024 * 1024 * 1024,
        1,
        { cacheLineSize: 64 }
      );
      
      expect(size % 64).toBe(0); // Should be multiple of cache line
    });
    
    it('should handle custom options', () => {
      const size = calculateOptimalChunkSize(
        10 * 1024 * 1024,
        100 * 1024 * 1024,
        1,
        {
          minChunkSize: 1024,
          maxChunkSize: 65536,
          cpuCores: 8,
          targetMemoryUsage: 0.5
        }
      );
      
      expect(size).toBeGreaterThanOrEqual(1024);
      expect(size).toBeLessThanOrEqual(65536);
    });
  });
  
  describe('chunkArray', () => {
    it('should split array into chunks', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const chunks = chunkArray(array, 3);
      
      expect(chunks).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ]);
    });
    
    it('should handle arrays not evenly divisible', () => {
      const array = [1, 2, 3, 4, 5];
      const chunks = chunkArray(array, 2);
      
      expect(chunks).toEqual([
        [1, 2],
        [3, 4],
        [5]
      ]);
    });
    
    it('should handle empty array', () => {
      const chunks = chunkArray([], 5);
      expect(chunks).toEqual([]);
    });
    
    it('should handle chunk size larger than array', () => {
      const array = [1, 2, 3];
      const chunks = chunkArray(array, 10);
      
      expect(chunks).toEqual([[1, 2, 3]]);
    });
  });
  
  describe('mergeChunks', () => {
    it('should merge chunks back together', () => {
      const chunks = [[1, 2], [3, 4], [5]];
      const merged = mergeChunks(chunks);
      
      expect(merged).toEqual([1, 2, 3, 4, 5]);
    });
    
    it('should handle empty chunks array', () => {
      const merged = mergeChunks([]);
      expect(merged).toEqual([]);
    });
    
    it('should handle chunks with empty arrays', () => {
      const chunks = [[1, 2], [], [3, 4]];
      const merged = mergeChunks(chunks);
      
      expect(merged).toEqual([1, 2, 3, 4]);
    });
  });
  
  describe('validateChunk', () => {
    it('should validate basic chunk structure', () => {
      expect(validateChunk([1, 2, 3])).toBe(true);
      expect(validateChunk(null as any)).toBe(false);
      expect(validateChunk({} as any)).toBe(false);
    });
    
    it('should validate chunk size', () => {
      const chunk = [1, 2, 3];
      
      expect(validateChunk(chunk, 3)).toBe(true);
      expect(validateChunk(chunk, 5)).toBe(false);
    });
    
    it('should validate empty chunks', () => {
      expect(validateChunk([])).toBe(true);
      expect(validateChunk([], undefined, { allowEmpty: false })).toBe(false);
    });
    
    it('should validate items with custom validator', () => {
      const chunk = [2, 4, 6];
      const isEven = (n: number) => n % 2 === 0;
      
      expect(validateChunk(chunk, undefined, { validateItems: isEven })).toBe(true);
      expect(validateChunk([1, 2, 3], undefined, { validateItems: isEven })).toBe(false);
    });
    
    it('should validate checksum', () => {
      const chunk = [1, 2, 3];
      const checksum = (c: number[]) => c.reduce((sum, n) => sum + n, 0);
      
      expect(validateChunk(chunk, undefined, {
        checksum,
        expectedChecksum: 6
      })).toBe(true);
      
      expect(validateChunk(chunk, undefined, {
        checksum,
        expectedChecksum: 10
      })).toBe(false);
    });
    
    it('should validate type consistency', () => {
      expect(validateChunk([1, 2, 3])).toBe(true);
      expect(validateChunk([1, '2', 3] as any)).toBe(false);
    });
    
    it('should validate max item size', () => {
      const chunk = ['short', 'medium string', 'very long string with lots of text'];
      
      expect(validateChunk(chunk, undefined, { maxItemSize: 50 })).toBe(false); // Longest string is 68 bytes
      expect(validateChunk(chunk, undefined, { maxItemSize: 100 })).toBe(true);
    });
  });
  
  describe('calculateChunkStats', () => {
    it('should calculate basic statistics', () => {
      const chunks = [[1, 2], [3, 4, 5], [6]];
      const times = [10, 15, 5];
      
      const stats = calculateChunkStats(chunks, times);
      
      expect(stats.totalItems).toBe(6);
      expect(stats.averageChunkSize).toBe(2);
      expect(stats.totalProcessingTime).toBe(30);
      expect(stats.averageProcessingTime).toBe(10);
      expect(stats.throughput).toBe(200); // 6 items / 0.03s
    });
    
    it('should calculate variance and standard deviation', () => {
      const chunks = [[1], [2], [3], [4]];
      const times = [10, 20, 10, 20];
      
      const stats = calculateChunkStats(chunks, times);
      
      expect(stats.variance).toBe(25);
      expect(stats.standardDeviation).toBe(5);
    });
    
    it('should calculate percentiles', () => {
      const chunks = Array(100).fill([1]);
      const times = Array.from({ length: 100 }, (_, i) => i + 1);
      
      const stats = calculateChunkStats(chunks, times);
      
      expect(stats.minProcessingTime).toBe(1);
      expect(stats.maxProcessingTime).toBe(100);
      expect(stats.p95ProcessingTime).toBe(95);
      expect(stats.p99ProcessingTime).toBe(99);
    });
    
    it('should handle empty chunks', () => {
      const stats = calculateChunkStats([], []);
      
      expect(stats.totalItems).toBe(0);
      expect(stats.averageChunkSize).toBeNaN();
      expect(stats.averageProcessingTime).toBeNaN();
    });
  });
  
  describe('adaptChunkSize', () => {
    it('should decrease size for low throughput', () => {
      const newSize = adaptChunkSize(1000, {
        throughput: 500,
        memoryUsage: 0.5,
        errorRate: 0.01,
        processingTime: 100
      });
      
      expect(newSize).toBeLessThan(1000);
    });
    
    it('should decrease size for high memory usage', () => {
      const newSize = adaptChunkSize(1000, {
        throughput: 2000,
        memoryUsage: 0.9,
        errorRate: 0.01,
        processingTime: 100
      });
      
      expect(newSize).toBeLessThan(1000);
    });
    
    it('should decrease size for high error rate', () => {
      const newSize = adaptChunkSize(1000, {
        throughput: 2000,
        memoryUsage: 0.5,
        errorRate: 0.1,
        processingTime: 100
      });
      
      expect(newSize).toBeLessThan(1000);
    });
    
    it('should increase size for good performance', () => {
      const newSize = adaptChunkSize(1000, {
        throughput: 3000,
        memoryUsage: 0.3,
        errorRate: 0.01,
        processingTime: 50
      });
      
      expect(newSize).toBeGreaterThan(1000);
    });
    
    it('should respect bounds', () => {
      const tinySize = adaptChunkSize(100, {
        throughput: 100,
        memoryUsage: 0.95,
        errorRate: 0.5,
        processingTime: 5000
      });
      
      expect(tinySize).toBeGreaterThanOrEqual(64);
      
      const hugeSize = adaptChunkSize(900000, {
        throughput: 10000,
        memoryUsage: 0.1,
        errorRate: 0,
        processingTime: 10
      });
      
      expect(hugeSize).toBeLessThanOrEqual(1048576);
    });
  });
  
  describe('chunkArrayWithOverlap', () => {
    it('should create overlapping chunks', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8];
      const chunks = chunkArrayWithOverlap(array, 4, 2);
      
      expect(chunks).toEqual([
        [1, 2, 3, 4],
        [3, 4, 5, 6],
        [5, 6, 7, 8]
      ]);
    });
    
    it('should handle no overlap', () => {
      const array = [1, 2, 3, 4, 5, 6];
      const chunks = chunkArrayWithOverlap(array, 3, 0);
      
      expect(chunks).toEqual([
        [1, 2, 3],
        [4, 5, 6]
      ]);
    });
    
    it('should include final partial chunk', () => {
      const array = [1, 2, 3, 4, 5];
      const chunks = chunkArrayWithOverlap(array, 3, 1);
      
      expect(chunks).toEqual([
        [1, 2, 3],
        [3, 4, 5]
      ]);
    });
    
    it('should throw for invalid overlap', () => {
      expect(() => {
        chunkArrayWithOverlap([1, 2, 3], 3, 3);
      }).toThrow('Overlap must be less than chunk size');
    });
  });
  
  describe('partitionChunks', () => {
    it('should partition chunks evenly', () => {
      const chunks = [[1], [2], [3], [4], [5], [6]];
      const partitions = partitionChunks(chunks, 3);
      
      expect(partitions).toEqual([
        [[1], [4]],
        [[2], [5]],
        [[3], [6]]
      ]);
    });
    
    it('should handle uneven distribution', () => {
      const chunks = [[1], [2], [3], [4], [5]];
      const partitions = partitionChunks(chunks, 3);
      
      expect(partitions).toEqual([
        [[1], [4]],
        [[2], [5]],
        [[3]]
      ]);
    });
    
    it('should handle single partition', () => {
      const chunks = [[1], [2], [3]];
      const partitions = partitionChunks(chunks, 1);
      
      expect(partitions).toEqual([chunks]);
    });
    
    it('should handle empty chunks', () => {
      const partitions = partitionChunks([], 3);
      
      expect(partitions).toEqual([[], [], []]);
    });
  });
  
  describe('calculateChunkChecksum', () => {
    it('should calculate consistent checksum', () => {
      const chunk = [1, 2, 3];
      const checksum1 = calculateChunkChecksum(chunk);
      const checksum2 = calculateChunkChecksum(chunk);
      
      expect(checksum1).toBe(checksum2);
      expect(checksum1).toBeGreaterThan(0);
    });
    
    it('should produce different checksums for different data', () => {
      const checksum1 = calculateChunkChecksum([1, 2, 3]);
      const checksum2 = calculateChunkChecksum([1, 2, 4]);
      
      expect(checksum1).not.toBe(checksum2);
    });
    
    it('should handle different data types', () => {
      const checksum1 = calculateChunkChecksum(['a', 'b', 'c']);
      const checksum2 = calculateChunkChecksum([{ a: 1 }, { b: 2 }]);
      
      expect(checksum1).toBeGreaterThan(0);
      expect(checksum2).toBeGreaterThan(0);
      expect(checksum1).not.toBe(checksum2);
    });
    
    it('should handle empty chunk', () => {
      const checksum = calculateChunkChecksum([]);
      expect(checksum).toBe(2166136261); // FNV offset basis
    });
  });
  
  describe('compressChunk and decompressChunk', () => {
    it('should compress duplicates', () => {
      const chunk = [1, 2, 3, 2, 1, 3, 3];
      const { compressed, indices } = compressChunk(chunk);
      
      expect(compressed).toEqual([1, 2, 3]);
      expect(indices).toEqual([0, 1, 2, 1, 0, 2, 2]);
    });
    
    it('should decompress correctly', () => {
      const chunk = [1, 2, 3, 2, 1, 3, 3];
      const { compressed, indices } = compressChunk(chunk);
      const decompressed = decompressChunk(compressed, indices);
      
      expect(decompressed).toEqual(chunk);
    });
    
    it('should preserve order', () => {
      const chunk = ['a', 'b', 'a', 'c', 'b', 'a'];
      const { compressed, indices } = compressChunk(chunk);
      
      expect(compressed).toEqual(['a', 'b', 'c']);
      const decompressed = decompressChunk(compressed, indices);
      expect(decompressed).toEqual(chunk);
    });
    
    it('should use custom key function', () => {
      const chunk = [
        { id: 1, value: 'a' },
        { id: 2, value: 'b' },
        { id: 1, value: 'c' },
        { id: 2, value: 'd' }
      ];
      
      const { compressed, indices } = compressChunk(chunk, item => item.id);
      
      expect(compressed).toHaveLength(2);
      expect(compressed[0].id).toBe(1);
      expect(compressed[1].id).toBe(2);
      expect(indices).toEqual([0, 1, 0, 1]);
    });
    
    it('should handle empty chunk', () => {
      const { compressed, indices } = compressChunk([]);
      
      expect(compressed).toEqual([]);
      expect(indices).toEqual([]);
      
      const decompressed = decompressChunk(compressed, indices);
      expect(decompressed).toEqual([]);
    });
    
    it('should handle no duplicates', () => {
      const chunk = [1, 2, 3, 4, 5];
      const { compressed, indices } = compressChunk(chunk);
      
      expect(compressed).toEqual(chunk);
      expect(indices).toEqual([0, 1, 2, 3, 4]);
    });
  });
});
