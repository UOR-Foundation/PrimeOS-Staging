/**
 * Verification Rate Limiter
 * ======================
 * 
 * Implementation of rate limiting for verification operations.
 */

import { LoggingInterface } from '../../../../os/logging';
import { 
  RateLimiterOptions, 
  RateLimiter, 
  RateLimiterMetrics 
} from './types';
import { MetricsCollector } from '../metrics/types';
import { VERIFICATION_CONSTANTS } from '../constants';
import { VerificationEventType } from '../events/types';
import { EventEmitter } from '../events/types';

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
 * Implementation of token bucket rate limiter
 */
export class TokenBucketRateLimiter implements RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private options: Required<RateLimiterOptions>;
  private logger?: LoggingInterface;
  private eventEmitter?: EventEmitter;
  private operationTokens: Map<string, number> = new Map();
  private operationLastRefillTimes: Map<string, number> = new Map();
  private hitCount: number = 0;
  private requestCount: number = 0;
  private operationHitCounts: Map<string, number> = new Map();
  private operationRequestCounts: Map<string, number> = new Map();
  private currentSystemLoad: number = 0;
  
  /**
   * Create a new token bucket rate limiter
   */
  constructor(
    options: RateLimiterOptions,
    logger?: LoggingInterface,
    eventEmitter?: EventEmitter
  ) {
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
      distributedStore: options.distributedStore ?? {
        increment: async () => 0,
        getCount: async () => 0,
        reset: async () => {}
      }
    };
    
    this.tokens = this.options.bucketSize;
    this.lastRefillTime = Date.now();
    this.logger = logger;
    this.eventEmitter = eventEmitter;
    
    if (this.logger) {
      this.logger.debug('Rate limiter initialized', this.options).catch(() => {});
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
   * Try to acquire a token
   */
  tryAcquire(): boolean {
    // Refill tokens based on elapsed time
    this.refill();
    
    // Check if token is available
    if (this.tokens >= 1) {
      // Consume token
      this.tokens -= 1;
      
      return true;
    } else {
      // No tokens available
      if (this.logger) {
        this.logger.debug('Rate limit exceeded').catch(() => {});
      }
      
      // Emit event if event emitter is available
      if (this.eventEmitter) {
        this.eventEmitter.emit({
          type: VerificationEventType.RATE_LIMIT_HIT,
          timestamp: Date.now(),
          data: {
            tokensPerSecond: this.options.tokensPerSecond,
            bucketSize: this.options.bucketSize,
            availableTokens: this.tokens
          }
        });
      }
      
      // Throw error if configured to do so
      if (this.options.throwOnLimit) {
        throw new RateLimitExceededError();
      }
      
      return false;
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
    
    if (this.logger) {
      this.logger.debug('Rate limiter reset').catch(() => {});
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
   * Try to acquire a token for a specific operation type
   */
  tryAcquireForOperation(operationType: string): boolean {
    // Increment request count
    this.requestCount++;
    
    // Increment operation-specific request count
    const operationRequestCount = this.operationRequestCounts.get(operationType) || 0;
    this.operationRequestCounts.set(operationType, operationRequestCount + 1);
    
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
      // Increment hit count
      this.hitCount++;
      
      // Increment operation-specific hit count
      const operationHitCount = this.operationHitCounts.get(operationType) || 0;
      this.operationHitCounts.set(operationType, operationHitCount + 1);
      
      if (this.logger) {
        this.logger.debug(`Rate limit exceeded for operation: ${operationType}`).catch(() => {});
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
            availableTokens: this.operationTokens.get(operationType) || 0
          }
        });
      }
      
      // Throw error if configured to do so
      if (this.options.throwOnLimit) {
        throw new RateLimitExceededError(`Rate limit exceeded for operation: ${operationType}`);
      }
      
      return false;
    }
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
    this.options.enableDynamicRateAdjustment = enabled;
    
    if (this.logger) {
      this.logger.debug(`${enabled ? 'Enabled' : 'Disabled'} dynamic rate adjustment`).catch(() => {});
    }
  }
}

/**
 * Create a new rate limiter
 */
export function createRateLimiter(
  options: RateLimiterOptions,
  logger?: LoggingInterface,
  eventEmitter?: EventEmitter
): RateLimiter {
  return new TokenBucketRateLimiter(options, logger, eventEmitter);
}

/**
 * Create a default rate limiter with standard options
 */
export function createDefaultRateLimiter(
  logger?: LoggingInterface,
  eventEmitter?: EventEmitter
): RateLimiter {
  return createRateLimiter({
    tokensPerSecond: VERIFICATION_CONSTANTS.DEFAULT_RATE_LIMIT,
    bucketSize: VERIFICATION_CONSTANTS.DEFAULT_RATE_LIMIT_BURST
  }, logger, eventEmitter);
}
