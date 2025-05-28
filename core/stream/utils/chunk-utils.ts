/**
 * Chunk Processing Utilities
 * ==========================
 * 
 * Utilities for managing and processing data chunks efficiently.
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
  processingComplexity: number = 1
): number {
  // Base chunk size calculation
  const baseSize = Math.floor(memoryLimit / (processingComplexity * 10));
  
  // Adjust based on data size
  const adaptiveSize = Math.min(baseSize, Math.max(64, dataSize / 100));
  
  // Ensure power of 2 for efficiency
  return Math.pow(2, Math.floor(Math.log2(adaptiveSize)));
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
export function validateChunk<T>(chunk: T[], expectedSize?: number): boolean {
  if (!Array.isArray(chunk)) {
    return false;
  }
  
  if (expectedSize !== undefined && chunk.length !== expectedSize) {
    return false;
  }
  
  // Additional validation could be added here
  return true;
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
} {
  const totalItems = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const averageChunkSize = totalItems / chunks.length;
  const totalProcessingTime = processingTimes.reduce((sum, time) => sum + time, 0);
  const averageProcessingTime = totalProcessingTime / processingTimes.length;
  const throughput = totalItems / (totalProcessingTime / 1000); // items per second
  
  return {
    totalItems,
    averageChunkSize,
    totalProcessingTime,
    averageProcessingTime,
    throughput
  };
}
