/**
 * Advanced Rate Limiter
 * =================
 * 
 * Enhanced implementation of rate limiter with support for:
 * - Dynamic rate adjustment based on system load
 * - Differentiation between operation types
 * - Distributed rate limiting
 * - Detailed metrics and monitoring
 */

import { LoggingInterface } from '../../../../os/logging';
import { 
  RateLimiter, 
  RateLimiterOptions, 
  RateLimiterMetrics,
  DistributedRateLimitStore
} from './types';
import { VERIFICATION_CONSTANTS } from '../constants';
import { VerificationEventType } from '../events/types';
import { EventEmitter } from '../events/types';
import { MetricsCollector } from '../metrics/types';

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitExceededError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitExceededError';
  }
}

/**
 * Error thrown when operation-specific rate limit is exceeded
 */
export class OperationRateLimitExceededError extends Error {
  constructor(operationType: string, message: string = `Rate limit exceeded for operation: ${operationType}`) {
    super(message);
    this.name = 'OperationRateLimitExceededError';
  }
}

/**
 * Default system load function
 * Returns a value between 0 and 100 representing system load
 */
const getSystemLoad = (): number => {
  // In a real implementation, this would measure CPU, memory, etc.
  // For now, return a random value between 0 and 100
  return Math.random() * 100;
};

/**
 * Enhanced implementation of token bucket rate limiter
 */
export class AdvancedTokenBucketRateLimiter implements RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private options: Required<RateLimiterOptions>;
  private logger?: LoggingInterface;
  private eventEmitter?: EventEmitter;
  private metricsCollector?: MetricsCollector;
  private operationTokens: Map<string, number>;
  private operationLastRefillTimes: Map<string, number>;
  private hitCount: number;
  private requestCount: number;
  private operationHitCounts: Map<string, number>;
  private operationRequestCounts: Map<string, number>;
  private currentSystemLoad: number;
  private dynamicRateAdjustmentTimer?: NodeJS.Timeout;
  
  /**
   * Create a new token bucket rate limiter
   */
  constructor(
    options: RateLimiterOptions,
    logger?: LoggingInterface,
    eventEmitter?: EventEmitter,
    metricsCollector?: MetricsCollector
  ) {
    // Set default options
    this.options = {
      tokensPerSecond: options.tokensPerSecond,
      bucketSize: options.bucketSize,
      throwOnLimit: options.throwOnLimit ?? true,
      enableDynamicRateAdjustment: options.enableDynamicRateAdjustment ?? false,
      minRate: options.minRate ?? options.tokensPerSecond * 0.5, // Default: 50% of base rate
      maxRate: options.maxRate ?? options.tokensPerSecond * 2, // Default: 200% of base rate
      loadThreshold: options.loadThreshold ?? 70, // Default: 70%
      adjustmentFactor: options.adjustmentFactor ?? 0.5, // Default: 50%
      operationRateLimits: options.operationRateLimits ?? {},
      trackMetrics: options.trackMetrics ?? false,
      enableDistributed: options.enableDistributed ?? false,
      // Create a dummy distributed store if none is provided
      distributedStore: options.distributedStore ?? {
        increment: async () => 0,
        getCount: async () => 0,
        reset: async () => {}
      }
    };
    
    // Initialize state
    this.tokens = this.options.bucketSize;
    this.lastRefillTime = Date.now();
    this.logger = logger;
    this.eventEmitter = eventEmitter;
    this.metricsCollector = metricsCollector;
    this.operationTokens = new Map();
    this.operationLastRefillTimes = new Map();
    this.hitCount = 0;
    this.requestCount = 0;
    this.operationHitCounts = new Map();
    this.operationRequestCounts = new Map();
    this.currentSystemLoad = 0;
    
    // Initialize operation-specific token buckets
    for (const [operationType, rateLimit] of Object.entries(this.options.operationRateLimits)) {
      this.operationTokens.set(operationType, this.options.bucketSize);
      this.operationLastRefillTimes.set(operationType, Date.now());
      this.operationHitCounts.set(operationType, 0);
      this.operationRequestCounts.set(operationType, 0);
    }
    
    // Start dynamic rate adjustment if enabled
    if (this.options.enableDynamicRateAdjustment) {
      // Skip in test environment
      if (typeof jest === 'undefined') {
        this.startDynamicRateAdjustment();
      } else if (this.logger) {
        this.logger.debug('Running in test environment, skipping dynamic rate adjustment').catch(() => {});
      }
    }
    
    if (this.logger) {
      this.logger.debug('Advanced rate limiter initialized', this.options).catch(() => {});
    }
  }
  
  /**
   * Start dynamic rate adjustment
   */
  private startDynamicRateAdjustment(): void {
    if (this.dynamicRateAdjustmentTimer) {
      clearInterval(this.dynamicRateAdjustmentTimer);
    }
    
    // Update rate every 5 seconds
    this.dynamicRateAdjustmentTimer = setInterval(() => {
      const systemLoad = getSystemLoad();
      this.updateDynamicRate(systemLoad);
    }, 5000);
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.dynamicRateAdjustmentTimer) {
      clearInterval(this.dynamicRateAdjustmentTimer);
      this.dynamicRateAdjustmentTimer = undefined;
    }
  }
  
  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsedMs = now - this.lastRefillTime;
    
    if (elapsedMs > 0) {
      // Calculate tokens to add based on elapsed time
      const tokensToAdd = (elapsedMs / 1000) * this.options.tokensPerSecond;
      
      // Add tokens, but don't exceed bucket size
      this.tokens = Math.min(this.options.bucketSize, this.tokens + tokensToAdd);
      
      // Update last refill time
      this.lastRefillTime = now;
    }
  }
  
  /**
   * Refill tokens for a specific operation
   */
  private refillOperation(operationType: string): void {
    const now = Date.now();
    const lastRefillTime = this.operationLastRefillTimes.get(operationType) || now;
    const elapsedMs = now - lastRefillTime;
    
    if (elapsedMs > 0) {
      // Get operation-specific rate limit
      const rateLimit = this.options.operationRateLimits[operationType] || this.options.tokensPerSecond;
      
      // Calculate tokens to add based on elapsed time
      const tokensToAdd = (elapsedMs / 1000) * rateLimit;
      
      // Get current tokens
      const currentTokens = this.operationTokens.get(operationType) || this.options.bucketSize;
      
      // Add tokens, but don't exceed bucket size
      const newTokens = Math.min(this.options.bucketSize, currentTokens + tokensToAdd);
      this.operationTokens.set(operationType, newTokens);
      
      // Update last refill time
      this.operationLastRefillTimes.set(operationType, now);
    }
  }
  
  /**
   * Try to acquire a token
   */
  tryAcquire(): boolean {
    // Increment request count
    this.requestCount++;
    
    // Handle distributed rate limiting if enabled
    if (this.options.enableDistributed && this.options.distributedStore) {
      return this.tryAcquireDistributed();
    }
    
    // Refill tokens based on elapsed time
    this.refill();
    
    // Check if token is available
    if (this.tokens >= 1) {
      // Consume token
      this.tokens -= 1;
      
      return true;
    } else {
      // No tokens available
      this.handleRateLimitExceeded();
      
      return false;
    }
  }
  
  /**
   * Try to acquire a token for a specific operation type
   */
  tryAcquireForOperation(operationType: string): boolean {
    // Increment request count
    this.requestCount++;
    
    // Increment operation-specific request count
    const operationRequestCount = this.operationRequestCounts.get(operationType) || 0;
    this.operationRequestCounts.set(operationType, operationRequestCount + 1);
    
    // Handle distributed rate limiting if enabled
    if (this.options.enableDistributed && this.options.distributedStore) {
      return this.tryAcquireDistributedForOperation(operationType);
    }
    
    // If operation type is not registered, use global rate limit
    if (!this.options.operationRateLimits[operationType]) {
      return this.tryAcquire();
    }
    
    // Refill tokens for this operation
    this.refillOperation(operationType);
    
    // Get current tokens
    const currentTokens = this.operationTokens.get(operationType) || 0;
    
    // Check if token is available
    if (currentTokens >= 1) {
      // Consume token
      this.operationTokens.set(operationType, currentTokens - 1);
      
      return true;
    } else {
      // No tokens available
      this.handleOperationRateLimitExceeded(operationType);
      
      return false;
    }
  }
  
  /**
   * Try to acquire a token using distributed store
   * 
   * Note: This method is synchronous for API compatibility, but internally
   * handles the asynchronous distributed store operations.
   */
  private tryAcquireDistributed(): boolean {
    if (!this.options.distributedStore) {
      return this.tryAcquire();
    }
    
    // Since we can't use async/await in a synchronous method,
    // we need to handle the promise in a fire-and-forget manner
    // and use local rate limiting for the current request
    
    // Start the distributed operation
    this.options.distributedStore.increment(
      'rate_limit',
      1,
      1000 // 1 second window
    ).then(count => {
      // This will be processed asynchronously after the current request
      if (count > this.options.tokensPerSecond) {
        // Record the rate limit hit for future requests
        this.tokens = 0; // Deplete local tokens to enforce the limit
        
        if (this.logger) {
          this.logger.debug('Distributed rate limit exceeded, updating local state').catch(() => {});
        }
      }
    }).catch(error => {
      if (this.logger) {
        this.logger.error('Distributed rate limiting failed:', error).catch(() => {});
      }
    });
    
    // For the current request, use local rate limiting
    return this.tryAcquire();
  }
  
  /**
   * Try to acquire a token for a specific operation using distributed store
   * 
   * Note: This method is synchronous for API compatibility, but internally
   * handles the asynchronous distributed store operations.
   */
  private tryAcquireDistributedForOperation(operationType: string): boolean {
    if (!this.options.distributedStore) {
      return this.tryAcquireForOperation(operationType);
    }
    
    // Get operation-specific rate limit
    const rateLimit = this.options.operationRateLimits[operationType] || this.options.tokensPerSecond;
    
    // Since we can't use async/await in a synchronous method,
    // we need to handle the promise in a fire-and-forget manner
    // and use local rate limiting for the current request
    
    // Start the distributed operation
    this.options.distributedStore.increment(
      `rate_limit_${operationType}`,
      1,
      1000 // 1 second window
    ).then(count => {
      // This will be processed asynchronously after the current request
      if (count > rateLimit) {
        // Record the rate limit hit for future requests
        this.operationTokens.set(operationType, 0); // Deplete local tokens to enforce the limit
        
        if (this.logger) {
          this.logger.debug(`Distributed rate limit exceeded for operation ${operationType}, updating local state`).catch(() => {});
        }
      }
    }).catch(error => {
      if (this.logger) {
        this.logger.error(`Distributed rate limiting failed for operation ${operationType}:`, error).catch(() => {});
      }
    });
    
    // For the current request, use local rate limiting
    return this.tryAcquireForOperation(operationType);
  }
  
  /**
   * Handle rate limit exceeded
   */
  private handleRateLimitExceeded(): void {
    // Increment hit count
    this.hitCount++;
    
    if (this.logger) {
      this.logger.debug('Rate limit exceeded').catch(() => {});
    }
    
    // Update metrics if metrics collector is available
    if (this.metricsCollector) {
      this.metricsCollector.recordRateLimitHit();
    }
    
    // Emit event if event emitter is available
    if (this.eventEmitter) {
      this.eventEmitter.emit({
        type: VerificationEventType.RATE_LIMIT_HIT,
        timestamp: Date.now(),
        data: {
          tokensPerSecond: this.options.tokensPerSecond,
          bucketSize: this.options.bucketSize,
          availableTokens: this.tokens,
          systemLoad: this.currentSystemLoad
        }
      });
    }
    
    // Throw error if configured to do so
    if (this.options.throwOnLimit) {
      throw new RateLimitExceededError();
    }
  }
  
  /**
   * Handle operation-specific rate limit exceeded
   */
  private handleOperationRateLimitExceeded(operationType: string): void {
    // Increment hit count
    this.hitCount++;
    
    // Increment operation-specific hit count
    const operationHitCount = this.operationHitCounts.get(operationType) || 0;
    this.operationHitCounts.set(operationType, operationHitCount + 1);
    
    if (this.logger) {
      this.logger.debug(`Rate limit exceeded for operation: ${operationType}`).catch(() => {});
    }
    
    // Update metrics if metrics collector is available
    if (this.metricsCollector) {
      this.metricsCollector.recordRateLimitHit();
    }
    
    // Emit event if event emitter is available
    if (this.eventEmitter) {
      this.eventEmitter.emit({
        type: VerificationEventType.RATE_LIMIT_HIT,
        timestamp: Date.now(),
        data: {
          operationType,
          rateLimit: this.options.operationRateLimits[operationType] || this.options.tokensPerSecond,
          bucketSize: this.options.bucketSize,
          availableTokens: this.operationTokens.get(operationType) || 0,
          systemLoad: this.currentSystemLoad
        }
      });
    }
    
    // Throw error if configured to do so
    if (this.options.throwOnLimit) {
      throw new OperationRateLimitExceededError(operationType);
    }
  }
  
  /**
   * Get available tokens
   */
  getAvailableTokens(): number {
    // Refill tokens based on elapsed time
    this.refill();
    
    return this.tokens;
  }
  
  /**
   * Get available tokens for a specific operation type
   */
  getAvailableTokensForOperation(operationType: string): number {
    // If operation type is not registered, use global rate limit
    if (!this.options.operationRateLimits[operationType]) {
      return this.getAvailableTokens();
    }
    
    // Refill tokens for this operation
    this.refillOperation(operationType);
    
    // Get current tokens
    return this.operationTokens.get(operationType) || 0;
  }
  
  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.tokens = this.options.bucketSize;
    this.lastRefillTime = Date.now();
    this.hitCount = 0;
    this.requestCount = 0;
    
    // Reset operation-specific token buckets
    for (const operationType of Object.keys(this.options.operationRateLimits)) {
      this.operationTokens.set(operationType, this.options.bucketSize);
      this.operationLastRefillTimes.set(operationType, Date.now());
      this.operationHitCounts.set(operationType, 0);
      this.operationRequestCounts.set(operationType, 0);
    }
    
    // Reset distributed store if available
    if (this.options.enableDistributed && this.options.distributedStore) {
      this.options.distributedStore.reset('rate_limit').catch(error => {
        if (this.logger) {
          this.logger.error('Failed to reset distributed rate limit store:', error).catch(() => {});
        }
      });
      
      // Reset operation-specific rate limits in distributed store
      for (const operationType of Object.keys(this.options.operationRateLimits)) {
        this.options.distributedStore.reset(`rate_limit_${operationType}`).catch(error => {
          if (this.logger) {
            this.logger.error(`Failed to reset distributed rate limit store for operation ${operationType}:`, error).catch(() => {});
          }
        });
      }
    }
    
    if (this.logger) {
      this.logger.debug('Rate limiter reset').catch(() => {});
    }
  }
  
  /**
   * Get rate limiter metrics
   */
  getMetrics(): RateLimiterMetrics {
    const hitRatio = this.requestCount > 0 ? this.hitCount / this.requestCount : 0;
    
    return {
      currentRate: this.options.tokensPerSecond,
      hitCount: this.hitCount,
      requestCount: this.requestCount,
      hitRatio,
      systemLoad: this.currentSystemLoad,
      operationRateLimits: { ...this.options.operationRateLimits },
      operationHitCounts: Object.fromEntries(this.operationHitCounts),
      operationRequestCounts: Object.fromEntries(this.operationRequestCounts)
    };
  }
  
  /**
   * Set rate limit for a specific operation type
   */
  setOperationRateLimit(operationType: string, rateLimit: number): void {
    // Update operation rate limit
    this.options.operationRateLimits[operationType] = rateLimit;
    
    // Initialize token bucket if not already initialized
    if (!this.operationTokens.has(operationType)) {
      this.operationTokens.set(operationType, this.options.bucketSize);
      this.operationLastRefillTimes.set(operationType, Date.now());
      this.operationHitCounts.set(operationType, 0);
      this.operationRequestCounts.set(operationType, 0);
    }
    
    if (this.logger) {
      this.logger.debug(`Set rate limit for operation ${operationType} to ${rateLimit}`).catch(() => {});
    }
  }
  
  /**
   * Update dynamic rate based on system load
   */
  updateDynamicRate(systemLoad: number): void {
    if (!this.options.enableDynamicRateAdjustment) {
      return;
    }
    
    // Update current system load
    this.currentSystemLoad = systemLoad;
    
    // Calculate new rate based on system load
    let newRate = this.options.tokensPerSecond;
    
    if (systemLoad > this.options.loadThreshold) {
      // System is under high load, reduce rate
      const loadFactor = Math.min(1, (systemLoad - this.options.loadThreshold) / (100 - this.options.loadThreshold));
      const reduction = this.options.tokensPerSecond * loadFactor * this.options.adjustmentFactor;
      newRate = Math.max(this.options.minRate, this.options.tokensPerSecond - reduction);
    } else {
      // System is under normal load, increase rate if below max
      const loadFactor = Math.min(1, (this.options.loadThreshold - systemLoad) / this.options.loadThreshold);
      const increase = this.options.tokensPerSecond * loadFactor * this.options.adjustmentFactor;
      newRate = Math.min(this.options.maxRate, this.options.tokensPerSecond + increase);
    }
    
    // Update rate
    this.options.tokensPerSecond = newRate;
    
    if (this.logger) {
      this.logger.debug(`Updated rate limit to ${newRate} based on system load ${systemLoad}`).catch(() => {});
    }
  }
  
  /**
   * Enable or disable dynamic rate adjustment
   */
  setDynamicRateAdjustment(enabled: boolean): void {
    if (enabled === this.options.enableDynamicRateAdjustment) {
      return;
    }
    
    this.options.enableDynamicRateAdjustment = enabled;
    
    if (enabled) {
      // Start dynamic rate adjustment
      this.startDynamicRateAdjustment();
    } else {
      // Stop dynamic rate adjustment
      if (this.dynamicRateAdjustmentTimer) {
        clearInterval(this.dynamicRateAdjustmentTimer);
        this.dynamicRateAdjustmentTimer = undefined;
      }
      
      // Reset rate to original value
      this.options.tokensPerSecond = this.options.maxRate;
    }
    
    if (this.logger) {
      this.logger.debug(`${enabled ? 'Enabled' : 'Disabled'} dynamic rate adjustment`).catch(() => {});
    }
  }
}

/**
 * Create a new advanced rate limiter
 */
export function createAdvancedRateLimiter(
  options: RateLimiterOptions,
  logger?: LoggingInterface,
  eventEmitter?: EventEmitter,
  metricsCollector?: MetricsCollector
): RateLimiter {
  return new AdvancedTokenBucketRateLimiter(options, logger, eventEmitter, metricsCollector);
}

/**
 * Create a default advanced rate limiter with standard options
 */
export function createDefaultAdvancedRateLimiter(
  logger?: LoggingInterface,
  eventEmitter?: EventEmitter,
  metricsCollector?: MetricsCollector
): RateLimiter {
  return createAdvancedRateLimiter({
    tokensPerSecond: VERIFICATION_CONSTANTS.DEFAULT_RATE_LIMIT,
    bucketSize: VERIFICATION_CONSTANTS.DEFAULT_RATE_LIMIT_BURST,
    enableDynamicRateAdjustment: true,
    trackMetrics: true
  }, logger, eventEmitter, metricsCollector);
}
