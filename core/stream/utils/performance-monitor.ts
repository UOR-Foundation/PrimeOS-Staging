/**
 * Performance Monitoring Utilities
 * ================================
 * 
 * Production-grade performance monitoring for stream processing,
 * replacing placeholder metrics with actual measurements.
 */

import { performance, PerformanceObserver } from 'perf_hooks';
import * as os from 'os';
import { EventEmitter } from 'events';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  cpuUsage: number;               // CPU usage percentage (0-100)
  memoryUsage: number;            // Memory usage in bytes
  memoryPercentage: number;       // Memory usage percentage (0-100)
  ioWaitTime: number;            // I/O wait time in milliseconds
  throughput: number;            // Operations per second
  latency: number;               // Average operation latency in ms
  errorRate: number;             // Error rate (0-1)
  backpressureEvents: number;    // Number of backpressure events
  cacheHitRate: number;          // Cache hit rate (0-1)
}

/**
 * CPU usage tracking
 */
interface CPUUsage {
  user: number;
  system: number;
  idle: number;
  timestamp: number;
}

/**
 * Performance event types
 */
export enum PerformanceEventType {
  OPERATION_START = 'operation:start',
  OPERATION_END = 'operation:end',
  BACKPRESSURE = 'backpressure',
  CACHE_HIT = 'cache:hit',
  CACHE_MISS = 'cache:miss',
  ERROR = 'error',
  IO_START = 'io:start',
  IO_END = 'io:end'
}

/**
 * Production performance monitor with real measurements
 */
export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetrics;
  private operationCount = 0;
  private errorCount = 0;
  private backpressureCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private latencies: number[] = [];
  private ioStartTimes = new Map<string, number>();
  private totalIoTime = 0;
  private startTime: number;
  private lastCpuUsage?: CPUUsage;
  private performanceObserver?: PerformanceObserver;
  private updateInterval?: NodeJS.Timeout;
  
  constructor(private updateIntervalMs: number = 1000) {
    super();
    this.startTime = Date.now();
    this.metrics = this.getInitialMetrics();
    this.setupPerformanceObserver();
    this.startMonitoring();
  }
  
  /**
   * Get initial metrics
   */
  private getInitialMetrics(): PerformanceMetrics {
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      memoryPercentage: 0,
      ioWaitTime: 0,
      throughput: 0,
      latency: 0,
      errorRate: 0,
      backpressureEvents: 0,
      cacheHitRate: 0
    };
  }
  
  /**
   * Setup performance observer for detailed measurements
   */
  private setupPerformanceObserver(): void {
    this.performanceObserver = new PerformanceObserver((items) => {
      items.getEntries().forEach((entry) => {
        if (entry.name.startsWith('stream-operation')) {
          this.latencies.push(entry.duration);
          // Keep only last 1000 latencies
          if (this.latencies.length > 1000) {
            this.latencies.shift();
          }
        }
      });
    });
    
    this.performanceObserver.observe({ entryTypes: ['measure'] });
  }
  
  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    // Initial CPU measurement
    this.lastCpuUsage = this.measureCPU();
    
    // Update metrics periodically
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, this.updateIntervalMs);
  }
  
  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
  
  /**
   * Record operation start
   */
  recordOperationStart(operationId: string): void {
    performance.mark(`stream-operation-${operationId}-start`);
    this.emit(PerformanceEventType.OPERATION_START, operationId);
  }
  
  /**
   * Record operation end
   */
  recordOperationEnd(operationId: string): void {
    const endMark = `stream-operation-${operationId}-end`;
    const startMark = `stream-operation-${operationId}-start`;
    
    performance.mark(endMark);
    
    try {
      performance.measure(
        `stream-operation-${operationId}`,
        startMark,
        endMark
      );
      this.operationCount++;
    } catch (error) {
      // Start mark might not exist
      console.warn(`Missing start mark for operation ${operationId}`);
    }
    
    // Clean up marks
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    
    this.emit(PerformanceEventType.OPERATION_END, operationId);
  }
  
  /**
   * Record I/O operation start
   */
  recordIoStart(ioId: string): void {
    this.ioStartTimes.set(ioId, performance.now());
    this.emit(PerformanceEventType.IO_START, ioId);
  }
  
  /**
   * Record I/O operation end
   */
  recordIoEnd(ioId: string): void {
    const startTime = this.ioStartTimes.get(ioId);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.totalIoTime += duration;
      this.ioStartTimes.delete(ioId);
    }
    this.emit(PerformanceEventType.IO_END, ioId);
  }
  
  /**
   * Record backpressure event
   */
  recordBackpressure(): void {
    this.backpressureCount++;
    this.emit(PerformanceEventType.BACKPRESSURE);
  }
  
  /**
   * Record cache hit
   */
  recordCacheHit(): void {
    this.cacheHits++;
    this.emit(PerformanceEventType.CACHE_HIT);
  }
  
  /**
   * Record cache miss
   */
  recordCacheMiss(): void {
    this.cacheMisses++;
    this.emit(PerformanceEventType.CACHE_MISS);
  }
  
  /**
   * Record error
   */
  recordError(): void {
    this.errorCount++;
    this.emit(PerformanceEventType.ERROR);
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Reset metrics
   */
  reset(): void {
    this.operationCount = 0;
    this.errorCount = 0;
    this.backpressureCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.latencies = [];
    this.totalIoTime = 0;
    this.startTime = Date.now();
    this.metrics = this.getInitialMetrics();
  }
  
  /**
   * Update all metrics
   */
  private updateMetrics(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.startTime) / 1000;
    
    // CPU usage
    const currentCpu = this.measureCPU();
    if (this.lastCpuUsage) {
      this.metrics.cpuUsage = this.calculateCpuUsage(this.lastCpuUsage, currentCpu);
    }
    this.lastCpuUsage = currentCpu;
    
    // Memory usage
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage = memUsage.heapUsed;
    this.metrics.memoryPercentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    // Throughput
    this.metrics.throughput = elapsedSeconds > 0 ? this.operationCount / elapsedSeconds : 0;
    
    // Average latency
    if (this.latencies.length > 0) {
      const sum = this.latencies.reduce((a, b) => a + b, 0);
      this.metrics.latency = sum / this.latencies.length;
    } else {
      this.metrics.latency = 0;
    }
    
    // Error rate
    this.metrics.errorRate = this.operationCount > 0 ? 
      this.errorCount / this.operationCount : 0;
    
    // Backpressure events
    this.metrics.backpressureEvents = this.backpressureCount;
    
    // Cache hit rate
    const totalCacheAccess = this.cacheHits + this.cacheMisses;
    this.metrics.cacheHitRate = totalCacheAccess > 0 ? 
      this.cacheHits / totalCacheAccess : 0;
    
    // I/O wait time (average per operation)
    this.metrics.ioWaitTime = this.operationCount > 0 ? 
      this.totalIoTime / this.operationCount : 0;
  }
  
  /**
   * Measure current CPU usage
   */
  private measureCPU(): CPUUsage {
    const cpus = os.cpus();
    let user = 0;
    let nice = 0;
    let sys = 0;
    let idle = 0;
    let irq = 0;
    
    for (const cpu of cpus) {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
      irq += cpu.times.irq;
    }
    
    const total = user + nice + sys + idle + irq;
    
    return {
      user: user / total,
      system: sys / total,
      idle: idle / total,
      timestamp: Date.now()
    };
  }
  
  /**
   * Calculate CPU usage percentage
   */
  private calculateCpuUsage(previous: CPUUsage, current: CPUUsage): number {
    const idleDiff = current.idle - previous.idle;
    const totalDiff = 1 - idleDiff;
    
    // Convert to percentage and clamp between 0-100
    return Math.max(0, Math.min(100, totalDiff * 100));
  }
}

/**
 * Global performance monitor instance
 */
let globalMonitor: PerformanceMonitor | null = null;

/**
 * Get or create global performance monitor
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
  }
  return globalMonitor;
}

/**
 * Helper class for scoped performance measurements
 */
export class PerformanceScope {
  private operationId: string;
  private monitor: PerformanceMonitor;
  
  constructor(operationName: string, monitor?: PerformanceMonitor) {
    this.operationId = `${operationName}-${Date.now()}-${Math.random()}`;
    this.monitor = monitor || getPerformanceMonitor();
    this.monitor.recordOperationStart(this.operationId);
  }
  
  /**
   * Complete the operation measurement
   */
  end(): void {
    this.monitor.recordOperationEnd(this.operationId);
  }
  
  /**
   * Record an error for this operation
   */
  error(): void {
    this.monitor.recordError();
    this.end();
  }
}

/**
 * Decorator for automatic performance tracking
 */
export function trackPerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    const scope = new PerformanceScope(`${target.constructor.name}.${propertyName}`);
    
    try {
      const result = await originalMethod.apply(this, args);
      scope.end();
      return result;
    } catch (error) {
      scope.error();
      throw error;
    }
  };
  
  return descriptor;
}

/**
 * Utility to format metrics for logging
 */
export function formatMetrics(metrics: PerformanceMetrics): string {
  return [
    `CPU: ${metrics.cpuUsage.toFixed(1)}%`,
    `Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB (${metrics.memoryPercentage.toFixed(1)}%)`,
    `Throughput: ${metrics.throughput.toFixed(0)} ops/s`,
    `Latency: ${metrics.latency.toFixed(2)}ms`,
    `I/O Wait: ${metrics.ioWaitTime.toFixed(2)}ms`,
    `Errors: ${(metrics.errorRate * 100).toFixed(1)}%`,
    `Cache Hit: ${(metrics.cacheHitRate * 100).toFixed(1)}%`,
    `Backpressure: ${metrics.backpressureEvents}`
  ].join(' | ');
}
