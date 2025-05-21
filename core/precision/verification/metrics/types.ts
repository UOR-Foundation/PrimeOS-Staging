/**
 * Verification Metrics Types
 * ========================
 * 
 * Type definitions for verification metrics collection.
 */

/**
 * Metrics collection options
 */
export interface MetricsOptions {
  /**
   * Whether to enable metrics collection
   */
  enabled?: boolean;
  
  /**
   * Maximum number of timing samples to keep per operation
   */
  maxSamples?: number;
  
  /**
   * Whether to track detailed operation metrics
   */
  detailed?: boolean;
  
  /**
   * Maximum memory usage in bytes for metrics storage
   * Default: 1MB (1048576 bytes)
   */
  maxMemoryUsage?: number;
  
  /**
   * Percentage of maxMemoryUsage at which to start pruning metrics
   * Default: 0.8 (80%)
   */
  pruningThreshold?: number;
  
  /**
   * Whether to use a circular buffer for timing samples
   * Default: true
   */
  useCircularBuffer?: boolean;
}

/**
 * Verification operation metrics
 */
export interface OperationMetrics {
  /**
   * Total number of operations
   */
  total: number;
  
  /**
   * Number of successful operations
   */
  successful: number;
  
  /**
   * Number of failed operations
   */
  failed: number;
  
  /**
   * Average operation time (ms)
   */
  averageTime: number;
  
  /**
   * 95th percentile operation time (ms)
   */
  p95Time: number;
  
  /**
   * 99th percentile operation time (ms)
   */
  p99Time: number;
  
  /**
   * Recent operation times (ms)
   */
  recentTimes: number[];
}

/**
 * Retry metrics
 */
export interface RetryMetrics {
  /**
   * Total number of retry attempts
   */
  attempts: number;
  
  /**
   * Number of successful retries
   */
  successes: number;
  
  /**
   * Number of failed retries
   */
  failures: number;
  
  /**
   * Average number of retries per operation
   */
  averageRetries: number;
  
  /**
   * Maximum number of retries for any operation
   */
  maxRetries: number;
}

/**
 * Cache metrics
 */
export interface CacheMetrics {
  /**
   * Current cache size
   */
  size: number;
  
  /**
   * Number of cache hits
   */
  hits: number;
  
  /**
   * Number of cache misses
   */
  misses: number;
  
  /**
   * Cache hit ratio (hits / (hits + misses))
   */
  hitRatio: number;
  
  /**
   * Estimated memory usage (bytes)
   */
  memoryUsage: number;
}

/**
 * Complete verification metrics
 */
export interface VerificationMetrics {
  /**
   * Operation metrics by type
   */
  operations: {
    verifyValue: OperationMetrics;
    verifyValues: OperationMetrics;
    createOptimizedVerifier: OperationMetrics;
    [key: string]: OperationMetrics;
  };
  
  /**
   * Retry metrics
   */
  retry: RetryMetrics;
  
  /**
   * Cache metrics
   */
  cache: CacheMetrics;
  
  /**
   * Rate limiting metrics
   */
  rateLimit: {
    /**
     * Number of rate limit hits
     */
    hits: number;
    
    /**
     * Current operations per second
     */
    currentRate: number;
  };
  
  /**
   * Circuit breaker metrics
   */
  circuitBreaker: {
    /**
     * Current state (closed, open, half-open)
     */
    state: string;
    
    /**
     * Number of times circuit opened
     */
    openCount: number;
    
    /**
     * Time since last state change (ms)
     */
    timeSinceStateChange: number;
  };
  
  /**
   * Reset all metrics
   */
  reset(): void;
  
  /**
   * Get a snapshot of all metrics
   */
  getSnapshot(): Record<string, any>;
}

/**
 * Metrics collector interface
 */
export interface MetricsCollector {
  /**
   * Record the start of an operation
   */
  startOperation(operation: string): number;
  
  /**
   * Record the end of a successful operation
   */
  endOperation(operation: string, startTime: number): void;
  
  /**
   * Record a failed operation
   */
  recordFailure(operation: string, startTime: number): void;
  
  /**
   * Record a retry attempt
   */
  recordRetry(successful: boolean): void;
  
  /**
   * Record a cache hit
   */
  recordCacheHit(): void;
  
  /**
   * Record a cache miss
   */
  recordCacheMiss(): void;
  
  /**
   * Update cache size
   */
  updateCacheSize(size: number): void;
  
  /**
   * Record a rate limit hit
   */
  recordRateLimitHit(): void;
  
  /**
   * Update circuit breaker state
   */
  updateCircuitBreakerState(state: string): void;
  
  /**
   * Get current metrics
   */
  getMetrics(): VerificationMetrics;
}
