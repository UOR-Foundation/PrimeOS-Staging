/**
 * Memory Management Utilities
 * ===========================
 * 
 * Utilities for monitoring and managing memory usage in stream processing.
 */

import { MemoryStats } from '../types';

/**
 * Get current memory statistics
 */
export function getMemoryStats(): MemoryStats {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      used: usage.heapUsed,
      available: usage.heapTotal - usage.heapUsed,
      total: usage.heapTotal,
      bufferSize: 0, // Will be set by caller
      gcCollections: 0 // Would need to track this separately
    };
  }
  
  // Fallback for testing environments
  return {
    used: Math.floor(Math.random() * 1024 * 1024 * 50), // Random 0-50MB
    available: 1024 * 1024 * 100, // 100MB available
    total: 1024 * 1024 * 150, // 150MB total
    bufferSize: 0,
    gcCollections: 0
  };
}

/**
 * Check if memory usage is approaching limits
 */
export function isMemoryPressure(
  currentUsage: number,
  limit: number,
  threshold: number = 0.8
): boolean {
  return (currentUsage / limit) >= threshold;
}

/**
 * Calculate recommended buffer size based on available memory
 */
export function calculateBufferSize(
  availableMemory: number,
  itemSize: number,
  safetyFactor: number = 0.5
): number {
  const maxItems = Math.floor((availableMemory * safetyFactor) / itemSize);
  return Math.max(64, Math.min(8192, maxItems));
}

/**
 * Calculate current memory usage
 */
export function calculateMemoryUsage(): number {
  const stats = getMemoryStats();
  return stats.used;
}

/**
 * Monitor memory usage over time
 */
export class MemoryMonitor {
  private samples: number[] = [];
  private maxSamples: number;
  private interval?: NodeJS.Timeout;
  
  constructor(maxSamples: number = 100) {
    this.maxSamples = maxSamples;
  }
  
  start(intervalMs: number = 1000): void {
    this.interval = setInterval(() => {
      const stats = getMemoryStats();
      this.addSample(stats.used);
    }, intervalMs);
  }
  
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
  
  addSample(usage: number): void {
    this.samples.push(usage);
    
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }
  
  getAverageUsage(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((sum, usage) => sum + usage, 0) / this.samples.length;
  }
  
  getPeakUsage(): number {
    return this.samples.length > 0 ? Math.max(...this.samples) : 0;
  }
  
  getTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.samples.length < 10) return 'stable';
    
    const recent = this.samples.slice(-10);
    const earlier = this.samples.slice(-20, -10);
    
    if (earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    
    const difference = (recentAvg - earlierAvg) / earlierAvg;
    
    if (difference > 0.1) return 'increasing';
    if (difference < -0.1) return 'decreasing';
    return 'stable';
  }
  
  reset(): void {
    this.samples = [];
  }
}

/**
 * Estimate memory usage for a given data structure
 */
export function estimateMemoryUsage(data: any): number {
  // Simplified memory estimation
  if (data === null || data === undefined) return 0;
  
  if (typeof data === 'string') {
    return data.length * 2; // Assuming UTF-16
  }
  
  if (typeof data === 'number') {
    return 8; // 64-bit number
  }
  
  if (typeof data === 'boolean') {
    return 4;
  }
  
  if (typeof data === 'bigint') {
    return Math.ceil(data.toString().length / 2); // Rough estimate
  }
  
  if (Array.isArray(data)) {
    let total = 24; // Array overhead
    for (const item of data) {
      total += estimateMemoryUsage(item);
    }
    return total;
  }
  
  if (typeof data === 'object') {
    let total = 24; // Object overhead
    for (const [key, value] of Object.entries(data)) {
      total += estimateMemoryUsage(key);
      total += estimateMemoryUsage(value);
    }
    return total;
  }
  
  return 8; // Default estimate
}

/**
 * Force garbage collection if available (for testing)
 */
export function forceGarbageCollection(): boolean {
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
    return true;
  }
  return false;
}
