/**
 * Advanced Circuit Breaker
 * ====================
 * 
 * Enhanced implementation of circuit breaker with support for:
 * - Partial failures and degraded states
 * - Configurable failure categorization
 * - Health check mechanism
 * - Detailed metrics and monitoring
 */

import { LoggingInterface } from '../../../../os/logging';
import { 
  CircuitBreaker, 
  CircuitBreakerOptions, 
  CircuitState,
  CircuitBreakerMetrics,
  FailureCategory,
  HealthCheckResult,
  HealthCheckFunction
} from './types';
import { VERIFICATION_CONSTANTS } from '../constants';
import { VerificationEventType } from '../events/types';
import { EventEmitter } from '../events/types';
import { MetricsCollector } from '../metrics/types';

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(message: string = 'Circuit is open') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Error thrown when circuit is in degraded state and operation is not allowed
 */
export class CircuitDegradedError extends Error {
  constructor(operationType: string, message: string = `Operation ${operationType} not allowed in degraded state`) {
    super(message);
    this.name = 'CircuitDegradedError';
  }
}

/**
 * Default health check function
 */
const defaultHealthCheck = async (): Promise<HealthCheckResult> => {
  return {
    healthy: true,
    status: {
      health: 100,
      resources: 100,
      dependencies: 100
    },
    timestamp: Date.now()
  };
};

/**
 * Default failure categorizer
 */
const defaultFailureCategorizer = (error: Error): FailureCategory => {
  // Check for known error types
  if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
    return FailureCategory.TRANSIENT;
  }
  
  if (error.name === 'ResourceError' || 
      error.message.includes('memory') || 
      error.message.includes('cpu')) {
    return FailureCategory.RESOURCE;
  }
  
  if (error.name === 'DependencyError' || 
      error.message.includes('service') || 
      error.message.includes('dependency')) {
    return FailureCategory.DEPENDENCY;
  }
  
  if (error.name === 'CriticalError' || 
      error.message.includes('critical')) {
    return FailureCategory.CRITICAL;
  }
  
  // Default to unknown
  return FailureCategory.UNKNOWN;
};

/**
 * Operation registration
 */
interface OperationRegistration {
  /**
   * Operation type
   */
  type: string;
  
  /**
   * Criticality level (0-100)
   * Higher criticality operations are blocked first in degraded state
   */
  criticality: number;
}

/**
 * Enhanced implementation of circuit breaker pattern
 */
export class AdvancedCircuitBreaker implements CircuitBreaker {
  private state: CircuitState;
  private failureCount: number;
  private successCount: number;
  private lastStateChangeTime: number;
  private options: Required<CircuitBreakerOptions>;
  private logger?: LoggingInterface;
  private eventEmitter?: EventEmitter;
  private metricsCollector?: MetricsCollector;
  private healthCheckTimer?: NodeJS.Timeout;
  private latestHealthCheck?: HealthCheckResult;
  private failuresByCategory: Map<FailureCategory, number>;
  private registeredOperations: Map<string, OperationRegistration>;
  private executionCount: number;
  private successfulExecutions: number;
  private failedExecutions: number;
  
  /**
   * Create a new circuit breaker
   */
  constructor(
    options: CircuitBreakerOptions,
    logger?: LoggingInterface,
    eventEmitter?: EventEmitter,
    metricsCollector?: MetricsCollector
  ) {
    // Set default options
    this.options = {
      failureThreshold: options.failureThreshold,
      resetTimeout: options.resetTimeout,
      halfOpenSuccessThreshold: options.halfOpenSuccessThreshold,
      failureCategorizer: options.failureCategorizer || defaultFailureCategorizer,
      healthCheck: options.healthCheck || defaultHealthCheck,
      healthCheckInterval: options.healthCheckInterval || 60000, // Default: 1 minute
      enableDegradedState: options.enableDegradedState || false,
      degradedStateThreshold: options.degradedStateThreshold || 50, // Default: 50%
      categoryThresholds: options.categoryThresholds || {},
      trackMetrics: options.trackMetrics || false
    };
    
    // Initialize state
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChangeTime = Date.now();
    this.logger = logger;
    this.eventEmitter = eventEmitter;
    this.metricsCollector = metricsCollector;
    this.failuresByCategory = new Map();
    this.registeredOperations = new Map();
    this.executionCount = 0;
    this.successfulExecutions = 0;
    this.failedExecutions = 0;
    
    // Initialize failure counts for each category
    Object.values(FailureCategory).forEach(category => {
      this.failuresByCategory.set(category, 0);
    });
    
    // Start health check timer if enabled
    if (this.options.healthCheckInterval > 0) {
      // Skip in test environment
      if (typeof jest === 'undefined') {
        this.startHealthCheckTimer();
      } else if (this.logger) {
        this.logger.debug('Running in test environment, skipping health check timer').catch(() => {});
      }
    }
    
    if (this.logger) {
      this.logger.debug('Advanced circuit breaker initialized', this.options).catch(() => {});
    }
  }
  
  /**
   * Start health check timer
   */
  private startHealthCheckTimer(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(
      async () => {
        try {
          await this.runHealthCheck();
        } catch (error) {
          if (this.logger) {
            this.logger.error('Health check failed:', error).catch(() => {});
          }
        }
      },
      this.options.healthCheckInterval
    );
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }
  
  /**
   * Change circuit state and emit event
   */
  private changeState(newState: CircuitState): void {
    if (this.state === newState) {
      return;
    }
    
    const oldState = this.state;
    this.state = newState;
    this.lastStateChangeTime = Date.now();
    
    // Reset counters
    if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.failuresByCategory.forEach((_, key) => {
        this.failuresByCategory.set(key, 0);
      });
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
    }
    
    if (this.logger) {
      this.logger.debug(`Circuit state changed from ${oldState} to ${newState}`).catch(() => {});
    }
    
    // Update metrics if metrics collector is available
    if (this.metricsCollector) {
      this.metricsCollector.updateCircuitBreakerState(newState);
    }
    
    // Emit event if event emitter is available
    if (this.eventEmitter) {
      let eventType: VerificationEventType;
      
      switch (newState) {
        case CircuitState.OPEN:
          eventType = VerificationEventType.CIRCUIT_OPEN;
          break;
        case CircuitState.CLOSED:
          eventType = VerificationEventType.CIRCUIT_CLOSE;
          break;
        case CircuitState.HALF_OPEN:
          eventType = VerificationEventType.CIRCUIT_HALF_OPEN;
          break;
        case CircuitState.DEGRADED:
          // Use CIRCUIT_OPEN for degraded state as well
          eventType = VerificationEventType.CIRCUIT_OPEN;
          break;
      }
      
      this.eventEmitter.emit({
        type: eventType,
        timestamp: Date.now(),
        data: {
          previousState: oldState,
          newState,
          failureCount: this.failureCount,
          successCount: this.successCount,
          failuresByCategory: Object.fromEntries(this.failuresByCategory),
          latestHealthCheck: this.latestHealthCheck
        }
      });
    }
  }
  
  /**
   * Check if reset timeout has elapsed
   */
  private isResetTimeoutElapsed(): boolean {
    const now = Date.now();
    return now - this.lastStateChangeTime >= this.options.resetTimeout;
  }
  
  /**
   * Execute an operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Increment execution count
    this.executionCount++;
    
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if reset timeout has elapsed
      if (this.isResetTimeoutElapsed()) {
        // Transition to half-open state
        this.changeState(CircuitState.HALF_OPEN);
      } else {
        // Circuit is still open, fast fail
        throw new CircuitOpenError();
      }
    }
    
    try {
      // Execute operation
      const result = await operation();
      
      // Handle success
      this.handleSuccess();
      
      // Increment successful executions
      this.successfulExecutions++;
      
      return result;
    } catch (error) {
      // Handle failure
      this.handleFailure(error as Error);
      
      // Increment failed executions
      this.failedExecutions++;
      
      // Re-throw the error
      throw error;
    }
  }
  
  /**
   * Handle successful operation
   */
  private handleSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      // Increment success count
      this.successCount++;
      
      // Check if success threshold reached
      if (this.successCount >= this.options.halfOpenSuccessThreshold) {
        // Transition to closed state
        this.changeState(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.DEGRADED) {
      // In degraded state, successful operations might help recover
      // Run a health check to see if we can transition back to closed state
      this.runHealthCheck().catch(error => {
        if (this.logger) {
          this.logger.error('Health check failed during degraded state recovery:', error).catch(() => {});
        }
      });
    }
  }
  
  /**
   * Handle failed operation
   */
  private handleFailure(error: Error): void {
    // Categorize the failure
    const category = this.options.failureCategorizer(error);
    
    // Increment failure count
    this.failureCount++;
    
    // Increment category-specific failure count
    const categoryCount = this.failuresByCategory.get(category) || 0;
    this.failuresByCategory.set(category, categoryCount + 1);
    
    if (this.logger) {
      this.logger.debug(`Circuit breaker recorded failure of category ${category} (${this.failureCount}/${this.options.failureThreshold})`, error).catch(() => {});
    }
    
    // Check if category-specific threshold is reached
    const categoryThreshold = this.options.categoryThresholds[category];
    if (categoryThreshold && categoryCount + 1 >= categoryThreshold) {
      if (this.logger) {
        this.logger.debug(`Category ${category} threshold reached (${categoryCount + 1}/${categoryThreshold})`).catch(() => {});
      }
      
      // For critical failures, immediately open the circuit
      if (category === FailureCategory.CRITICAL) {
        this.changeState(CircuitState.OPEN);
        return;
      }
      
      // For other categories, consider degraded state if enabled
      if (this.options.enableDegradedState && this.state === CircuitState.CLOSED) {
        this.changeState(CircuitState.DEGRADED);
        return;
      }
    }
    
    // Check if failure threshold reached
    if (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) {
      // Transition to open state
      this.changeState(CircuitState.OPEN);
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state should open the circuit
      this.changeState(CircuitState.OPEN);
    } else if (this.state === CircuitState.DEGRADED) {
      // In degraded state, check if we need to fully open the circuit
      const failureRate = (this.failureCount / this.executionCount) * 100;
      if (failureRate >= this.options.degradedStateThreshold) {
        this.changeState(CircuitState.OPEN);
      }
    }
  }
  
  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }
  
  /**
   * Reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChangeTime = Date.now();
    this.executionCount = 0;
    this.successfulExecutions = 0;
    this.failedExecutions = 0;
    
    // Reset failure counts for each category
    this.failuresByCategory.forEach((_, key) => {
      this.failuresByCategory.set(key, 0);
    });
    
    if (this.logger) {
      this.logger.debug('Circuit breaker reset').catch(() => {});
    }
  }
  
  /**
   * Run a health check
   */
  async runHealthCheck(): Promise<HealthCheckResult> {
    try {
      const result = await this.options.healthCheck();
      this.latestHealthCheck = result;
      
      if (this.logger) {
        this.logger.debug('Health check result:', result).catch(() => {});
      }
      
      // If in degraded or open state, check if we can recover
      if ((this.state === CircuitState.DEGRADED || this.state === CircuitState.OPEN) && result.healthy) {
        // If health check is successful, transition to half-open state
        this.changeState(CircuitState.HALF_OPEN);
      }
      
      return result;
    } catch (error) {
      if (this.logger) {
        this.logger.error('Health check failed:', error).catch(() => {});
      }
      
      // If health check fails, create a failed result
      const failedResult: HealthCheckResult = {
        healthy: false,
        status: {
          health: 0,
          resources: 0,
          dependencies: 0
        },
        timestamp: Date.now(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
      
      this.latestHealthCheck = failedResult;
      
      // If in closed state, consider transitioning to degraded or open state
      if (this.state === CircuitState.CLOSED) {
        if (this.options.enableDegradedState) {
          this.changeState(CircuitState.DEGRADED);
        } else {
          this.changeState(CircuitState.OPEN);
        }
      }
      
      return failedResult;
    }
  }
  
  /**
   * Get circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    const failureRate = this.executionCount > 0 
      ? (this.failedExecutions / this.executionCount) * 100 
      : 0;
    
    return {
      state: this.state,
      openCount: 0, // This would need to be tracked separately
      timeSinceStateChange: Date.now() - this.lastStateChangeTime,
      executionCount: this.executionCount,
      successCount: this.successfulExecutions,
      failureCount: this.failedExecutions,
      failuresByCategory: Object.fromEntries(this.failuresByCategory),
      latestHealthCheck: this.latestHealthCheck,
      failureRate
    };
  }
  
  /**
   * Force circuit to a specific state
   */
  forceState(state: CircuitState): void {
    this.changeState(state);
  }
  
  /**
   * Check if a specific operation is allowed in the current state
   */
  isOperationAllowed(operationType: string): boolean {
    // In closed state, all operations are allowed
    if (this.state === CircuitState.CLOSED) {
      return true;
    }
    
    // In open state, no operations are allowed
    if (this.state === CircuitState.OPEN) {
      return false;
    }
    
    // In half-open state, only allow a limited number of operations
    if (this.state === CircuitState.HALF_OPEN) {
      // Allow operations up to the success threshold
      return this.successCount < this.options.halfOpenSuccessThreshold;
    }
    
    // In degraded state, allow operations based on criticality
    if (this.state === CircuitState.DEGRADED) {
      const registration = this.registeredOperations.get(operationType);
      
      // If operation is not registered, use default behavior
      if (!registration) {
        // By default, allow read operations in degraded state
        return operationType.startsWith('get') || 
               operationType.startsWith('read') || 
               operationType.startsWith('find') || 
               operationType.startsWith('list') || 
               operationType.startsWith('query');
      }
      
      // Allow operations with criticality below threshold
      const healthPercentage = this.latestHealthCheck?.status.health || 0;
      return registration.criticality <= healthPercentage;
    }
    
    // Default to not allowed for unknown states
    return false;
  }
  
  /**
   * Register an operation type with its criticality level
   */
  registerOperation(operationType: string, criticality: number): void {
    this.registeredOperations.set(operationType, {
      type: operationType,
      criticality: Math.max(0, Math.min(100, criticality)) // Clamp to 0-100
    });
    
    if (this.logger) {
      this.logger.debug(`Registered operation ${operationType} with criticality ${criticality}`).catch(() => {});
    }
  }
}

/**
 * Create a new advanced circuit breaker
 */
export function createAdvancedCircuitBreaker(
  options: CircuitBreakerOptions,
  logger?: LoggingInterface,
  eventEmitter?: EventEmitter,
  metricsCollector?: MetricsCollector
): CircuitBreaker {
  return new AdvancedCircuitBreaker(options, logger, eventEmitter, metricsCollector);
}

/**
 * Create a default advanced circuit breaker with standard options
 */
export function createDefaultAdvancedCircuitBreaker(
  logger?: LoggingInterface,
  eventEmitter?: EventEmitter,
  metricsCollector?: MetricsCollector
): CircuitBreaker {
  return createAdvancedCircuitBreaker({
    failureThreshold: VERIFICATION_CONSTANTS.DEFAULT_FAILURE_THRESHOLD,
    resetTimeout: VERIFICATION_CONSTANTS.DEFAULT_RESET_TIMEOUT,
    halfOpenSuccessThreshold: VERIFICATION_CONSTANTS.DEFAULT_HALF_OPEN_SUCCESS_THRESHOLD,
    enableDegradedState: true,
    trackMetrics: true
  }, logger, eventEmitter, metricsCollector);
}
