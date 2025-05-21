/**
 * Verification Metrics Collectors
 * ============================
 * 
 * Implementation of metrics collection for verification operations.
 */

import { LoggingInterface } from '../../../../os/logging';
import { 
  MetricsOptions, 
  MetricsCollector, 
  VerificationMetrics,
  OperationMetrics,
  RetryMetrics,
  CacheMetrics
} from './types';

/**
 * Default metrics options
 */
const DEFAULT_METRICS_OPTIONS: MetricsOptions = {
  enabled: true,
  maxSamples: 100,
  detailed: false,
  maxMemoryUsage: 1048576, // 1MB
  pruningThreshold: 0.8,   // 80%
  useCircularBuffer: true
};

/**
 * Circular buffer implementation for storing timing samples
 */
class CircularBuffer<T> {
  private buffer: T[];
  private capacity: number;
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;
  
  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array<T>(capacity);
  }
  
  /**
   * Add an item to the buffer
   */
  push(item: T): void {
    // If buffer is full, overwrite oldest item
    if (this.size === this.capacity) {
      this.buffer[this.head] = item;
      this.head = (this.head + 1) % this.capacity;
      this.tail = (this.tail + 1) % this.capacity;
    } else {
      // Otherwise, add to tail
      this.buffer[this.tail] = item;
      this.tail = (this.tail + 1) % this.capacity;
      this.size++;
    }
  }
  
  /**
   * Get all items in the buffer
   */
  getAll(): T[] {
    const result: T[] = [];
    
    if (this.size === 0) {
      return result;
    }
    
    // Collect items from head to tail
    let index = this.head;
    for (let i = 0; i < this.size; i++) {
      result.push(this.buffer[index]);
      index = (index + 1) % this.capacity;
    }
    
    return result;
  }
  
  /**
   * Clear the buffer
   */
  clear(): void {
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }
  
  /**
   * Get the current size of the buffer
   */
  getSize(): number {
    return this.size;
  }
  
  /**
   * Get the capacity of the buffer
   */
  getCapacity(): number {
    return this.capacity;
  }
  
  /**
   * Resize the buffer
   */
  resize(newCapacity: number): void {
    if (newCapacity === this.capacity) {
      return;
    }
    
    // Get current items
    const items = this.getAll();
    
    // Create new buffer
    this.buffer = new Array<T>(newCapacity);
    this.capacity = newCapacity;
    this.head = 0;
    this.size = 0;
    this.tail = 0;
    
    // Add items back to buffer, up to new capacity
    for (let i = 0; i < Math.min(items.length, newCapacity); i++) {
      this.push(items[i]);
    }
  }
}

/**
 * Create a new empty operation metrics object
 */
function createEmptyOperationMetrics(): OperationMetrics {
  return {
    total: 0,
    successful: 0,
    failed: 0,
    averageTime: 0,
    p95Time: 0,
    p99Time: 0,
    recentTimes: []
  };
}

/**
 * Create a new empty retry metrics object
 */
function createEmptyRetryMetrics(): RetryMetrics {
  return {
    attempts: 0,
    successes: 0,
    failures: 0,
    averageRetries: 0,
    maxRetries: 0
  };
}

/**
 * Create a new empty cache metrics object
 */
function createEmptyCacheMetrics(): CacheMetrics {
  return {
    size: 0,
    hits: 0,
    misses: 0,
    hitRatio: 0,
    memoryUsage: 0
  };
}

/**
 * Calculate percentile from an array of values
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  // Sort values
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Calculate index
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  
  // Return percentile value
  return sortedValues[Math.max(0, index)];
}

/**
 * Implementation of metrics collector for verification operations
 */
export class VerificationMetricsCollector implements MetricsCollector {
  private options: MetricsOptions;
  private logger?: LoggingInterface;
  private startTime: number;
  private metrics: VerificationMetrics;
  private timingBuffers: Map<string, CircularBuffer<number>> = new Map();
  private totalMemoryUsage: number = 0;
  
  /**
   * Create a new metrics collector
   */
  constructor(options?: MetricsOptions, logger?: LoggingInterface) {
    this.options = { ...DEFAULT_METRICS_OPTIONS, ...options };
    this.logger = logger;
    this.startTime = Date.now();
    
    // Initialize metrics
    this.metrics = {
      operations: {
        verifyValue: createEmptyOperationMetrics(),
        verifyValues: createEmptyOperationMetrics(),
        createOptimizedVerifier: createEmptyOperationMetrics(),
        verifyValueWithRetry: createEmptyOperationMetrics(),
        verifyValuesWithRetry: createEmptyOperationMetrics(),
        createOptimizedVerifierWithRetry: createEmptyOperationMetrics(),
        getErrorDetails: createEmptyOperationMetrics(),
        logError: createEmptyOperationMetrics()
      },
      retry: createEmptyRetryMetrics(),
      cache: createEmptyCacheMetrics(),
      rateLimit: {
        hits: 0,
        currentRate: 0
      },
      circuitBreaker: {
        state: 'closed',
        openCount: 0,
        timeSinceStateChange: 0
      },
      reset: this.reset.bind(this),
      getSnapshot: this.getSnapshot.bind(this)
    };
    
    // Initialize circular buffers for each operation if enabled
    if (this.options.useCircularBuffer) {
      for (const operation in this.metrics.operations) {
        this.timingBuffers.set(
          operation, 
          new CircularBuffer<number>(this.options.maxSamples || DEFAULT_METRICS_OPTIONS.maxSamples!)
        );
      }
    }
    
    if (this.options.detailed && this.logger) {
      this.logger.debug('Verification metrics collector initialized with detailed tracking').catch(() => {});
    }
  }
  
  /**
   * Estimate memory usage of metrics data
   */
  private estimateMemoryUsage(): number {
    let totalBytes = 0;
    
    // Estimate size of operation metrics
    for (const operation in this.metrics.operations) {
      const opMetrics = this.metrics.operations[operation];
      
      // Base size of operation metrics (counters, averages, etc.)
      totalBytes += 100; // Approximate size of primitive fields
      
      // Size of recent times array
      if (this.options.useCircularBuffer) {
        const buffer = this.timingBuffers.get(operation);
        if (buffer) {
          // Each number is 8 bytes, plus overhead
          totalBytes += buffer.getSize() * 8 + 40;
        }
      } else {
        // Each number is 8 bytes, plus array overhead
        totalBytes += opMetrics.recentTimes.length * 8 + 40;
      }
    }
    
    // Estimate size of retry metrics
    totalBytes += 50;
    
    // Estimate size of cache metrics
    totalBytes += 50;
    
    // Estimate size of rate limit metrics
    totalBytes += 30;
    
    // Estimate size of circuit breaker metrics
    totalBytes += 50;
    
    // Update total memory usage
    this.totalMemoryUsage = totalBytes;
    
    return totalBytes;
  }
  
  /**
   * Check if memory usage exceeds threshold and prune if necessary
   */
  private checkAndPruneMemory(): void {
    const memoryUsage = this.estimateMemoryUsage();
    const maxMemoryUsage = this.options.maxMemoryUsage || DEFAULT_METRICS_OPTIONS.maxMemoryUsage!;
    const pruningThreshold = this.options.pruningThreshold || DEFAULT_METRICS_OPTIONS.pruningThreshold!;
    
    // Check if memory usage exceeds threshold
    if (memoryUsage > maxMemoryUsage * pruningThreshold) {
      if (this.options.detailed && this.logger) {
        this.logger.debug(`Memory usage (${memoryUsage} bytes) exceeds threshold (${maxMemoryUsage * pruningThreshold} bytes), pruning metrics data`).catch(() => {});
      }
      
      this.pruneMetricsData();
    }
  }
  
  /**
   * Prune metrics data to reduce memory usage
   */
  private pruneMetricsData(): void {
    // Strategy 1: Reduce size of timing buffers for less frequently used operations
    if (this.options.useCircularBuffer) {
      // Get operations sorted by usage (total count)
      const operations = Object.entries(this.metrics.operations)
        .sort((a, b) => b[1].total - a[1].total);
      
      // Reduce buffer size for least used operations
      for (let i = Math.floor(operations.length / 2); i < operations.length; i++) {
        const operation = operations[i][0];
        const buffer = this.timingBuffers.get(operation);
        
        if (buffer && buffer.getCapacity() > 10) {
          // Reduce buffer size by half, but keep at least 10 samples
          const newCapacity = Math.max(10, Math.floor(buffer.getCapacity() / 2));
          buffer.resize(newCapacity);
          
          if (this.options.detailed && this.logger) {
            this.logger.debug(`Reduced timing buffer for operation ${operation} from ${buffer.getCapacity()} to ${newCapacity}`).catch(() => {});
          }
        }
      }
    } 
    // Strategy 2: If not using circular buffers, trim recentTimes arrays
    else {
      for (const operation in this.metrics.operations) {
        const opMetrics = this.metrics.operations[operation];
        
        if (opMetrics.recentTimes.length > 10) {
          // Keep only the most recent samples
          const keepCount = Math.max(10, Math.floor(opMetrics.recentTimes.length / 2));
          opMetrics.recentTimes = opMetrics.recentTimes.slice(-keepCount);
          
          if (this.options.detailed && this.logger) {
            this.logger.debug(`Trimmed recentTimes for operation ${operation} to ${keepCount} samples`).catch(() => {});
          }
        }
      }
    }
    
    // Re-estimate memory usage after pruning
    this.estimateMemoryUsage();
  }
  
  /**
   * Record the start of an operation
   */
  startOperation(operation: string): number {
    if (!this.options.enabled) return 0;
    
    // Ensure operation metrics exist
    if (!this.metrics.operations[operation]) {
      this.metrics.operations[operation] = createEmptyOperationMetrics();
    }
    
    // Increment total count
    this.metrics.operations[operation].total++;
    
    // Return current time for duration tracking
    return performance.now();
  }
  
  /**
   * Record the end of a successful operation
   */
  endOperation(operation: string, startTime: number): void {
    if (!this.options.enabled || startTime === 0) return;
    
    // Ensure operation metrics exist
    if (!this.metrics.operations[operation]) {
      this.metrics.operations[operation] = createEmptyOperationMetrics();
    }
    
    // Calculate duration
    const duration = performance.now() - startTime;
    
    // Update metrics
    const opMetrics = this.metrics.operations[operation];
    opMetrics.successful++;
    
    // Update timing metrics
    this.updateTimingMetrics(opMetrics, duration);
    
    if (this.options.detailed && this.logger) {
      this.logger.debug(`Operation ${operation} completed in ${duration.toFixed(2)}ms`).catch(() => {});
    }
  }
  
  /**
   * Record a failed operation
   */
  recordFailure(operation: string, startTime: number): void {
    if (!this.options.enabled) return;
    
    // Ensure operation metrics exist
    if (!this.metrics.operations[operation]) {
      this.metrics.operations[operation] = createEmptyOperationMetrics();
    }
    
    // Calculate duration if startTime is provided
    const duration = startTime > 0 ? performance.now() - startTime : 0;
    
    // Update metrics
    const opMetrics = this.metrics.operations[operation];
    opMetrics.failed++;
    
    // Update timing metrics if duration is available
    if (duration > 0) {
      this.updateTimingMetrics(opMetrics, duration);
    }
    
    if (this.options.detailed && this.logger) {
      this.logger.debug(`Operation ${operation} failed${duration > 0 ? ` after ${duration.toFixed(2)}ms` : ''}`).catch(() => {});
    }
  }
  
  /**
   * Update timing metrics for an operation
   */
  private updateTimingMetrics(metrics: OperationMetrics, duration: number): void {
    if (this.options.useCircularBuffer) {
      // Get or create circular buffer for this operation
      const operationName = Object.entries(this.metrics.operations)
        .find(([_, m]) => m === metrics)?.[0] || '';
      
      if (operationName) {
        let buffer = this.timingBuffers.get(operationName);
        
        if (!buffer) {
          buffer = new CircularBuffer<number>(
            this.options.maxSamples || DEFAULT_METRICS_OPTIONS.maxSamples!
          );
          this.timingBuffers.set(operationName, buffer);
        }
        
        // Add duration to buffer
        buffer.push(duration);
        
        // Update recentTimes array for compatibility
        metrics.recentTimes = buffer.getAll();
      } else {
        // Fallback if operation name not found
        metrics.recentTimes.push(duration);
        
        // Trim if exceeding max samples
        if (metrics.recentTimes.length > (this.options.maxSamples || DEFAULT_METRICS_OPTIONS.maxSamples!)) {
          metrics.recentTimes.shift();
        }
      }
    } else {
      // Traditional array-based approach
      metrics.recentTimes.push(duration);
      
      // Trim if exceeding max samples
      if (metrics.recentTimes.length > (this.options.maxSamples || DEFAULT_METRICS_OPTIONS.maxSamples!)) {
        metrics.recentTimes.shift();
      }
    }
    
    // Calculate average
    const total = metrics.recentTimes.reduce((sum, time) => sum + time, 0);
    metrics.averageTime = total / metrics.recentTimes.length;
    
    // Calculate percentiles
    metrics.p95Time = calculatePercentile(metrics.recentTimes, 95);
    metrics.p99Time = calculatePercentile(metrics.recentTimes, 99);
    
    // Check and prune memory if needed
    this.checkAndPruneMemory();
  }
  
  /**
   * Record a retry attempt
   */
  recordRetry(successful: boolean): void {
    if (!this.options.enabled) return;
    
    // Update retry metrics
    this.metrics.retry.attempts++;
    
    if (successful) {
      this.metrics.retry.successes++;
    } else {
      this.metrics.retry.failures++;
    }
    
    // Calculate average retries
    const totalOperations = this.metrics.operations.verifyValueWithRetry.total + 
                           this.metrics.operations.verifyValuesWithRetry.total;
    
    if (totalOperations > 0) {
      this.metrics.retry.averageRetries = this.metrics.retry.attempts / totalOperations;
    }
    
    if (this.options.detailed && this.logger) {
      this.logger.debug(`Retry attempt ${successful ? 'succeeded' : 'failed'}`).catch(() => {});
    }
  }
  
  /**
   * Record a cache hit
   */
  recordCacheHit(): void {
    if (!this.options.enabled) return;
    
    // Update cache metrics
    this.metrics.cache.hits++;
    this.updateCacheHitRatio();
    
    if (this.options.detailed && this.logger) {
      this.logger.debug('Cache hit').catch(() => {});
    }
  }
  
  /**
   * Record a cache miss
   */
  recordCacheMiss(): void {
    if (!this.options.enabled) return;
    
    // Update cache metrics
    this.metrics.cache.misses++;
    this.updateCacheHitRatio();
    
    if (this.options.detailed && this.logger) {
      this.logger.debug('Cache miss').catch(() => {});
    }
  }
  
  /**
   * Update cache hit ratio
   */
  private updateCacheHitRatio(): void {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    if (total > 0) {
      this.metrics.cache.hitRatio = this.metrics.cache.hits / total;
    }
  }
  
  /**
   * Update cache size
   */
  updateCacheSize(size: number): void {
    if (!this.options.enabled) return;
    
    // Update cache size
    this.metrics.cache.size = size;
    
    // Estimate memory usage (rough approximation)
    // Assuming each entry takes about 100 bytes on average
    this.metrics.cache.memoryUsage = size * 100;
    
    if (this.options.detailed && this.logger) {
      this.logger.debug(`Cache size updated to ${size} entries`).catch(() => {});
    }
  }
  
  /**
   * Record a rate limit hit
   */
  recordRateLimitHit(): void {
    if (!this.options.enabled) return;
    
    // Update rate limit metrics
    this.metrics.rateLimit.hits++;
    
    if (this.options.detailed && this.logger) {
      this.logger.debug('Rate limit hit').catch(() => {});
    }
  }
  
  /**
   * Update circuit breaker state
   */
  updateCircuitBreakerState(state: string): void {
    if (!this.options.enabled) return;
    
    // Check if state changed
    const stateChanged = this.metrics.circuitBreaker.state !== state;
    
    // Update circuit breaker metrics
    this.metrics.circuitBreaker.state = state;
    
    if (stateChanged) {
      // Reset time since state change
      this.metrics.circuitBreaker.timeSinceStateChange = 0;
      
      // Increment open count if transitioning to open
      if (state === 'open') {
        this.metrics.circuitBreaker.openCount++;
      }
      
      if (this.options.detailed && this.logger) {
        this.logger.debug(`Circuit breaker state changed to ${state}`).catch(() => {});
      }
    }
  }
  
  /**
   * Reset all metrics
   */
  reset(): void {
    // Reset start time
    this.startTime = Date.now();
    
    // Reset operation metrics
    for (const key in this.metrics.operations) {
      this.metrics.operations[key] = createEmptyOperationMetrics();
    }
    
    // Reset circular buffers if using them
    if (this.options.useCircularBuffer) {
      for (const buffer of this.timingBuffers.values()) {
        buffer.clear();
      }
    }
    
    // Reset retry metrics
    this.metrics.retry = createEmptyRetryMetrics();
    
    // Reset cache metrics
    this.metrics.cache = createEmptyCacheMetrics();
    
    // Reset rate limit metrics
    this.metrics.rateLimit.hits = 0;
    this.metrics.rateLimit.currentRate = 0;
    
    // Reset circuit breaker metrics
    this.metrics.circuitBreaker.openCount = 0;
    this.metrics.circuitBreaker.timeSinceStateChange = 0;
    
    // Reset memory usage estimate
    this.totalMemoryUsage = 0;
    
    if (this.options.detailed && this.logger) {
      this.logger.debug('Metrics reset').catch(() => {});
    }
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): VerificationMetrics {
    // Update time since state change
    this.metrics.circuitBreaker.timeSinceStateChange = Date.now() - this.startTime;
    
    return this.metrics;
  }
  
  /**
   * Get a snapshot of all metrics
   */
  getSnapshot(): Record<string, any> {
    const metrics = this.getMetrics();
    
    // Create a plain object snapshot
    return {
      operations: Object.fromEntries(
        Object.entries(metrics.operations).map(([key, value]) => [
          key,
          {
            total: value.total,
            successful: value.successful,
            failed: value.failed,
            averageTime: value.averageTime,
            p95Time: value.p95Time,
            p99Time: value.p99Time
          }
        ])
      ),
      retry: { ...metrics.retry },
      cache: { ...metrics.cache },
      rateLimit: { ...metrics.rateLimit },
      circuitBreaker: { ...metrics.circuitBreaker }
    };
  }
}

/**
 * Create a new metrics collector
 */
export function createMetricsCollector(
  options?: MetricsOptions,
  logger?: LoggingInterface
): MetricsCollector {
  return new VerificationMetricsCollector(options, logger);
}
