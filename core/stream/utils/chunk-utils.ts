/**
 * Chunk Processing Utilities
 * ==========================
 * 
 * Complete production utilities for managing and processing data chunks efficiently.
 */

import { ProcessingContext } from '../types';

/**
 * Create a processing context for chunk operations
 */
export function createProcessingContext<T>(
  index: number,
  totalChunks: number = -1,
  previousResult?: T[]
): ProcessingContext<T> {
  return {
    index,
    totalChunks,
    previousResult,
    metadata: new Map(),
    startTime: performance.now(),
    processingTime: 0,
    memoryUsed: 0
  };
}

/**
 * Calculate optimal chunk size based on data characteristics
 */
export function calculateOptimalChunkSize(
  dataSize: number,
  memoryLimit: number,
  processingComplexity: number = 1,
  options: {
    minChunkSize?: number;
    maxChunkSize?: number;
    cacheLineSize?: number;
    cpuCores?: number;
    targetMemoryUsage?: number; // 0-1 percentage
  } = {}
): number {
  const {
    minChunkSize = 64,
    maxChunkSize = 1048576, // 1MB
    cacheLineSize = 64,      // Typical CPU cache line size
    cpuCores = 4,
    targetMemoryUsage = 0.3   // Use 30% of available memory
  } = options;
  
  // Calculate based on multiple factors
  
  // 1. Memory-based calculation
  const availableMemory = memoryLimit * targetMemoryUsage;
  const memoryBasedSize = Math.floor(availableMemory / (processingComplexity * cpuCores * 2));
  
  // 2. Data size based calculation
  // Aim for reasonable number of chunks (between 10 and 10000)
  const minChunks = 10;
  const maxChunks = 10000;
  const dataBasedMax = Math.floor(dataSize / minChunks);
  const dataBasedMin = Math.floor(dataSize / maxChunks);
  
  // 3. CPU cache optimization
  // Chunks should fit in L2/L3 cache for optimal performance
  const l2CacheSize = 256 * 1024;  // 256KB typical L2 cache
  const l3CacheSize = 8 * 1024 * 1024; // 8MB typical L3 cache
  const cacheOptimalSize = processingComplexity > 2 ? l2CacheSize : l3CacheSize;
  
  // 4. Combine all factors
  let optimalSize = Math.min(
    memoryBasedSize,
    dataBasedMax,
    cacheOptimalSize
  );
  
  // Ensure within bounds
  optimalSize = Math.max(dataBasedMin, optimalSize);
  optimalSize = Math.max(minChunkSize, optimalSize);
  optimalSize = Math.min(maxChunkSize, optimalSize);
  
  // 5. Align to cache line size for optimal memory access
  optimalSize = Math.floor(optimalSize / cacheLineSize) * cacheLineSize;
  
  // 6. Round to power of 2 for efficient memory allocation
  // But only if it doesn't deviate too much (within 25%)
  const powerOf2 = Math.pow(2, Math.floor(Math.log2(optimalSize)));
  const deviation = Math.abs(optimalSize - powerOf2) / optimalSize;
  
  if (deviation < 0.25) {
    return powerOf2;
  }
  
  // Otherwise, round to nearest multiple of cache line size
  return optimalSize;
}

/**
 * Split data into chunks of specified size
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  
  return chunks;
}

/**
 * Merge processed chunks back together
 */
export function mergeChunks<T>(chunks: T[][]): T[] {
  return chunks.reduce((acc, chunk) => acc.concat(chunk), []);
}

/**
 * Validate chunk structure and data integrity
 */
export function validateChunk<T>(
  chunk: T[], 
  expectedSize?: number,
  options: {
    validateItems?: (item: T) => boolean;
    checksum?: (chunk: T[]) => number;
    expectedChecksum?: number;
    allowEmpty?: boolean;
    maxItemSize?: number;
  } = {}
): boolean {
  const {
    validateItems,
    checksum,
    expectedChecksum,
    allowEmpty = true,
    maxItemSize
  } = options;
  
  // Basic structure validation
  if (!Array.isArray(chunk)) {
    return false;
  }
  
  // Size validation
  if (!allowEmpty && chunk.length === 0) {
    return false;
  }
  
  if (expectedSize !== undefined && chunk.length !== expectedSize) {
    return false;
  }
  
  // Item-level validation
  if (validateItems) {
    for (const item of chunk) {
      if (!validateItems(item)) {
        return false;
      }
    }
  }
  
  // Memory size validation
  if (maxItemSize !== undefined) {
    for (const item of chunk) {
      const itemSize = estimateItemSize(item);
      if (itemSize > maxItemSize) {
        return false;
      }
    }
  }
  
  // Checksum validation
  if (checksum && expectedChecksum !== undefined) {
    const actualChecksum = checksum(chunk);
    if (actualChecksum !== expectedChecksum) {
      return false;
    }
  }
  
  // Type consistency validation
  if (chunk.length > 1) {
    const firstType = getItemType(chunk[0]);
    for (let i = 1; i < chunk.length; i++) {
      if (getItemType(chunk[i]) !== firstType) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Estimate memory size of an item
 */
function estimateItemSize(item: any): number {
  if (item === null || item === undefined) return 0;
  
  if (typeof item === 'string') {
    return item.length * 2; // UTF-16
  }
  
  if (typeof item === 'number') {
    return 8;
  }
  
  if (typeof item === 'boolean') {
    return 4;
  }
  
  if (typeof item === 'bigint') {
    return Math.ceil(item.toString().length / 2);
  }
  
  if (ArrayBuffer.isView(item)) {
    return item.byteLength;
  }
  
  if (Array.isArray(item)) {
    return item.reduce((sum, el) => sum + estimateItemSize(el), 24);
  }
  
  if (typeof item === 'object') {
    let size = 24; // Object overhead
    for (const [key, value] of Object.entries(item)) {
      size += estimateItemSize(key) + estimateItemSize(value);
    }
    return size;
  }
  
  return 8; // Default
}

/**
 * Get the type of an item for consistency checking
 */
function getItemType(item: any): string {
  if (item === null) return 'null';
  if (item === undefined) return 'undefined';
  if (Array.isArray(item)) return 'array';
  if (ArrayBuffer.isView(item)) return 'typedarray';
  return typeof item;
}

/**
 * Calculate chunk processing statistics
 */
export function calculateChunkStats<T>(
  chunks: T[][],
  processingTimes: number[]
): {
  totalItems: number;
  averageChunkSize: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  throughput: number;
  variance: number;
  standardDeviation: number;
  minProcessingTime: number;
  maxProcessingTime: number;
  p95ProcessingTime: number;
  p99ProcessingTime: number;
} {
  const totalItems = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const averageChunkSize = totalItems / chunks.length;
  const totalProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0);
  const averageProcessingTime = totalProcessingTime / processingTimes.length;
  const throughput = totalItems / (totalProcessingTime / 1000); // items per second
  
  // Calculate variance and standard deviation
  const variance = processingTimes.reduce((sum, time) => {
    const diff = time - averageProcessingTime;
    return sum + (diff * diff);
  }, 0) / processingTimes.length;
  
  const standardDeviation = Math.sqrt(variance);
  
  // Calculate percentiles
  const sortedTimes = [...processingTimes].sort((a, b) => a - b);
  const minProcessingTime = sortedTimes[0] || 0;
  const maxProcessingTime = sortedTimes[sortedTimes.length - 1] || 0;
  const p95Index = Math.floor(sortedTimes.length * 0.95) - 1;
  const p99Index = Math.floor(sortedTimes.length * 0.99) - 1;
  const p95ProcessingTime = sortedTimes[Math.max(0, p95Index)] || maxProcessingTime;
  const p99ProcessingTime = sortedTimes[Math.max(0, p99Index)] || maxProcessingTime;
  
  return {
    totalItems,
    averageChunkSize,
    totalProcessingTime,
    averageProcessingTime,
    throughput,
    variance,
    standardDeviation,
    minProcessingTime,
    maxProcessingTime,
    p95ProcessingTime,
    p99ProcessingTime
  };
}

/**
 * Adaptive chunk size adjustment based on performance metrics
 */
export function adaptChunkSize(
  currentSize: number,
  metrics: {
    throughput: number;
    memoryUsage: number;
    errorRate: number;
    processingTime: number;
  },
  targets: {
    minThroughput?: number;
    maxMemoryUsage?: number;
    maxErrorRate?: number;
    maxProcessingTime?: number;
  } = {}
): number {
  const {
    minThroughput = 1000,
    maxMemoryUsage = 0.8,
    maxErrorRate = 0.05,
    maxProcessingTime = 1000
  } = targets;
  
  let adjustmentFactor = 1.0;
  
  // Adjust based on throughput
  if (metrics.throughput < minThroughput) {
    // Decrease chunk size to improve throughput
    adjustmentFactor *= 0.8;
  } else if (metrics.throughput > minThroughput * 2) {
    // Can increase chunk size
    adjustmentFactor *= 1.1;
  }
  
  // Adjust based on memory usage
  if (metrics.memoryUsage > maxMemoryUsage) {
    // Decrease chunk size to reduce memory pressure
    adjustmentFactor *= 0.7;
  }
  
  // Adjust based on error rate
  if (metrics.errorRate > maxErrorRate) {
    // Decrease chunk size to reduce errors
    adjustmentFactor *= 0.9;
  }
  
  // Adjust based on processing time
  if (metrics.processingTime > maxProcessingTime) {
    // Decrease chunk size to reduce latency
    adjustmentFactor *= 0.85;
  }
  
  // Apply adjustment with bounds
  const newSize = Math.round(currentSize * adjustmentFactor);
  const minSize = 64;
  const maxSize = 1048576; // 1MB
  
  return Math.max(minSize, Math.min(maxSize, newSize));
}

/**
 * Create chunks with overlap for sliding window operations
 */
export function chunkArrayWithOverlap<T>(
  array: T[],
  chunkSize: number,
  overlap: number
): T[][] {
  if (overlap >= chunkSize) {
    throw new Error('Overlap must be less than chunk size');
  }
  
  const chunks: T[][] = [];
  const step = chunkSize - overlap;
  
  for (let i = 0; i <= array.length - chunkSize; i += step) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  
  // Handle the last chunk if there's remaining data and it's the final chunk
  const lastIndex = chunks.length * step;
  if (lastIndex < array.length && array.length - lastIndex > overlap) {
    chunks.push(array.slice(lastIndex));
  }
  
  return chunks;
}

/**
 * Partition chunks for parallel processing
 */
export function partitionChunks<T>(
  chunks: T[][],
  partitions: number
): T[][][] {
  const result: T[][][] = Array.from({ length: partitions }, () => []);
  
  chunks.forEach((chunk, index) => {
    const partitionIndex = index % partitions;
    result[partitionIndex].push(chunk);
  });
  
  return result;
}

/**
 * Calculate checksum for a chunk (FNV-1a hash)
 */
export function calculateChunkChecksum<T>(chunk: T[]): number {
  const FNV_OFFSET_BASIS = 2166136261;
  const FNV_PRIME = 16777619;
  
  let hash = FNV_OFFSET_BASIS;
  
  for (const item of chunk) {
    const str = JSON.stringify(item);
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, FNV_PRIME);
    }
  }
  
  return hash >>> 0; // Convert to unsigned 32-bit
}

/**
 * Compress chunk by removing duplicates while preserving order
 */
export function compressChunk<T>(
  chunk: T[],
  keyFn?: (item: T) => any
): { compressed: T[]; indices: number[] } {
  const seen = new Map<any, number>();
  const compressed: T[] = [];
  const indices: number[] = [];
  
  chunk.forEach((item, index) => {
    const key = keyFn ? keyFn(item) : item;
    
    if (seen.has(key)) {
      indices.push(seen.get(key)!);
    } else {
      const compressedIndex = compressed.length;
      seen.set(key, compressedIndex);
      compressed.push(item);
      indices.push(compressedIndex);
    }
  });
  
  return { compressed, indices };
}

/**
 * Decompress chunk using compression indices
 */
export function decompressChunk<T>(
  compressed: T[],
  indices: number[]
): T[] {
  return indices.map(index => compressed[index]);
}
