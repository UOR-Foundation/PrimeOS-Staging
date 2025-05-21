/**
 * Verification Resilience Types
 * ==========================
 * 
 * Type definitions for verification resilience mechanisms.
 */

/**
 * Rate limiter options
 */
export interface RateLimiterOptions {
  /**
   * Maximum operations per second
   */
  tokensPerSecond: number;
  
  /**
   * Maximum burst size
   */
  bucketSize: number;
  
  /**
   * Whether to throw an error when rate limit is exceeded
   */
  throwOnLimit?: boolean;
  
  /**
   * Enable dynamic rate adjustment based on system load
   */
  enableDynamicRateAdjustment?: boolean;
  
  /**
   * Minimum rate limit (operations per second)
   * Used when dynamic rate adjustment is enabled
   */
  minRate?: number;
  
  /**
   * Maximum rate limit (operations per second)
   * Used when dynamic rate adjustment is enabled
   */
  maxRate?: number;
  
  /**
   * System load threshold for rate adjustment (0-100)
   * When system load exceeds this threshold, rate is reduced
   */
  loadThreshold?: number;
  
  /**
   * Rate adjustment factor (0-1)
   * How aggressively to adjust rate based on system load
   */
  adjustmentFactor?: number;
  
  /**
   * Rate limits by operation type
   * Allows different rate limits for different operation types
   */
  operationRateLimits?: {
    [operationType: string]: number;
  };
  
  /**
   * Whether to track metrics
   */
  trackMetrics?: boolean;
  
  /**
   * Whether to enable distributed rate limiting
   * Requires a distributed store implementation
   */
  enableDistributed?: boolean;
  
  /**
   * Distributed store implementation
   * Used for distributed rate limiting
   */
  distributedStore?: DistributedRateLimitStore;
}

/**
 * Distributed rate limit store interface
 * Used for distributed rate limiting across multiple instances
 */
export interface DistributedRateLimitStore {
  /**
   * Increment token count and return new count
   */
  increment(key: string, count: number, windowSizeMs: number): Promise<number>;
  
  /**
   * Get current token count
   */
  getCount(key: string): Promise<number>;
  
  /**
   * Reset token count
   */
  reset(key: string): Promise<void>;
}

/**
 * Rate limiter metrics
 */
export interface RateLimiterMetrics {
  /**
   * Current rate limit (operations per second)
   */
  currentRate: number;
  
  /**
   * Number of rate limit hits
   */
  hitCount: number;
  
  /**
   * Total number of requests
   */
  requestCount: number;
  
  /**
   * Rate limit hit ratio (hits / requests)
   */
  hitRatio: number;
  
  /**
   * Current system load (0-100)
   * Only available when dynamic rate adjustment is enabled
   */
  systemLoad?: number;
  
  /**
   * Rate limits by operation type
   */
  operationRateLimits?: {
    [operationType: string]: number;
  };
  
  /**
   * Hit counts by operation type
   */
  operationHitCounts?: {
    [operationType: string]: number;
  };
  
  /**
   * Request counts by operation type
   */
  operationRequestCounts?: {
    [operationType: string]: number;
  };
}

/**
 * Rate limiter interface
 */
export interface RateLimiter {
  /**
   * Try to acquire a token
   */
  tryAcquire(): boolean;
  
  /**
   * Try to acquire a token for a specific operation type
   */
  tryAcquireForOperation(operationType: string): boolean;
  
  /**
   * Get available tokens
   */
  getAvailableTokens(): number;
  
  /**
   * Get available tokens for a specific operation type
   */
  getAvailableTokensForOperation(operationType: string): number;
  
  /**
   * Reset the rate limiter
   */
  reset(): void;
  
  /**
   * Get rate limiter metrics
   */
  getMetrics(): RateLimiterMetrics;
  
  /**
   * Set rate limit for a specific operation type
   */
  setOperationRateLimit(operationType: string, rateLimit: number): void;
  
  /**
   * Update dynamic rate based on system load
   */
  updateDynamicRate(systemLoad: number): void;
  
  /**
   * Enable or disable dynamic rate adjustment
   */
  setDynamicRateAdjustment(enabled: boolean): void;
}

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failing, fast-fail
  HALF_OPEN = 'half-open', // Testing if system has recovered
  DEGRADED = 'degraded'  // Partial functionality available
}

/**
 * Failure category for circuit breaker
 */
export enum FailureCategory {
  // Transient failures that might resolve on retry
  TRANSIENT = 'transient',
  
  // Resource-related failures (e.g., memory, CPU)
  RESOURCE = 'resource',
  
  // Dependency failures (e.g., external service)
  DEPENDENCY = 'dependency',
  
  // Critical failures that require immediate attention
  CRITICAL = 'critical',
  
  // Unknown failures that can't be categorized
  UNKNOWN = 'unknown'
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /**
   * Whether the health check was successful
   */
  healthy: boolean;
  
  /**
   * Detailed status information
   */
  status: {
    /**
     * Overall system health (0-100)
     */
    health: number;
    
    /**
     * Resource availability (0-100)
     */
    resources: number;
    
    /**
     * Dependency health (0-100)
     */
    dependencies: number;
  };
  
  /**
   * Timestamp of the health check
   */
  timestamp: number;
  
  /**
   * Additional details about the health check
   */
  details?: Record<string, any>;
}

/**
 * Health check function
 */
export type HealthCheckFunction = () => Promise<HealthCheckResult>;

/**
 * Circuit breaker options
 */
export interface CircuitBreakerOptions {
  /**
   * Number of failures before opening circuit
   */
  failureThreshold: number;
  
  /**
   * Time to wait before trying half-open state (ms)
   */
  resetTimeout: number;
  
  /**
   * Number of successful operations in half-open state to close circuit
   */
  halfOpenSuccessThreshold: number;
  
  /**
   * Function to categorize failures
   */
  failureCategorizer?: (error: Error) => FailureCategory;
  
  /**
   * Health check function to determine if system is healthy
   */
  healthCheck?: HealthCheckFunction;
  
  /**
   * Health check interval in milliseconds
   */
  healthCheckInterval?: number;
  
  /**
   * Whether to enable degraded state
   */
  enableDegradedState?: boolean;
  
  /**
   * Threshold for entering degraded state (0-100)
   * Represents the percentage of failures that trigger degraded state
   */
  degradedStateThreshold?: number;
  
  /**
   * Failure thresholds by category
   * Allows different thresholds for different failure categories
   */
  categoryThresholds?: {
    [key in FailureCategory]?: number;
  };
  
  /**
   * Whether to track metrics
   */
  trackMetrics?: boolean;
}

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  /**
   * Current state of the circuit
   */
  state: CircuitState;
  
  /**
   * Number of times the circuit has been opened
   */
  openCount: number;
  
  /**
   * Time since last state change in milliseconds
   */
  timeSinceStateChange: number;
  
  /**
   * Total number of executions
   */
  executionCount: number;
  
  /**
   * Number of successful executions
   */
  successCount: number;
  
  /**
   * Number of failed executions
   */
  failureCount: number;
  
  /**
   * Failure counts by category
   */
  failuresByCategory: {
    [key in FailureCategory]?: number;
  };
  
  /**
   * Latest health check result
   */
  latestHealthCheck?: HealthCheckResult;
  
  /**
   * Failure rate (0-100)
   */
  failureRate: number;
}

/**
 * Circuit breaker interface
 */
export interface CircuitBreaker {
  /**
   * Execute an operation with circuit breaker protection
   */
  execute<T>(operation: () => Promise<T>): Promise<T>;
  
  /**
   * Get current circuit state
   */
  getState(): CircuitState;
  
  /**
   * Reset the circuit breaker
   */
  reset(): void;
  
  /**
   * Run a health check
   */
  runHealthCheck(): Promise<HealthCheckResult>;
  
  /**
   * Get circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics;
  
  /**
   * Force circuit to a specific state
   */
  forceState(state: CircuitState): void;
  
  /**
   * Check if a specific operation is allowed in the current state
   * This is useful for degraded state where some operations might be allowed
   */
  isOperationAllowed(operationType: string): boolean;
  
  /**
   * Register an operation type with its criticality level (0-100)
   * Higher criticality operations are blocked first in degraded state
   */
  registerOperation(operationType: string, criticality: number): void;
}
