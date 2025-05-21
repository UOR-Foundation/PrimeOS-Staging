/**
 * Verification Circuit Breaker
 * =========================
 * 
 * Implementation of circuit breaker for verification operations.
 */

import { LoggingInterface } from '../../../../os/logging';
import { 
  CircuitBreakerOptions, 
  CircuitBreaker, 
  CircuitState,
  CircuitBreakerMetrics,
  HealthCheckResult,
  FailureCategory
} from './types';
import { VERIFICATION_CONSTANTS } from '../constants';
import { VerificationEventType } from '../events/types';
import { EventEmitter } from '../events/types';

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
 * Default health check result
 */
const DEFAULT_HEALTH_CHECK_RESULT = {
  healthy: true,
  status: {
    health: 100,
    resources: 100,
    dependencies: 100
  },
  timestamp: Date.now()
};

/**
 * Implementation of circuit breaker pattern
 */
export class VerificationCircuitBreaker implements CircuitBreaker {
  private state: CircuitState;
  private failureCount: number;
  private successCount: number;
  private lastStateChangeTime: number;
  private options: Required<CircuitBreakerOptions>;
  private logger?: LoggingInterface;
  private eventEmitter?: EventEmitter;
  private executionCount: number = 0;
  private successfulExecutions: number = 0;
  private failedExecutions: number = 0;
  private openCount: number = 0;
  private latestHealthCheck?: any;
  
  /**
   * Create a new circuit breaker
   */
  constructor(
    options: CircuitBreakerOptions,
    logger?: LoggingInterface,
    eventEmitter?: EventEmitter
  ) {
    // Set default options for the new required properties
    this.options = {
      failureThreshold: options.failureThreshold,
      resetTimeout: options.resetTimeout,
      halfOpenSuccessThreshold: options.halfOpenSuccessThreshold,
      // Default values for new properties
      failureCategorizer: options.failureCategorizer || ((error: Error) => FailureCategory.UNKNOWN),
      healthCheck: options.healthCheck || (async () => DEFAULT_HEALTH_CHECK_RESULT),
      healthCheckInterval: options.healthCheckInterval || 60000,
      enableDegradedState: options.enableDegradedState || false,
      degradedStateThreshold: options.degradedStateThreshold || 50,
      categoryThresholds: options.categoryThresholds || {},
      trackMetrics: options.trackMetrics || false
    };
    
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateChangeTime = Date.now();
    this.logger = logger;
    this.eventEmitter = eventEmitter;
    
    if (this.logger) {
      this.logger.debug('Circuit breaker initialized', this.options).catch(() => {});
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
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
    }
    
    if (this.logger) {
      this.logger.debug(`Circuit state changed from ${oldState} to ${newState}`).catch(() => {});
    }
    
    // Emit event if event emitter is available
    if (this.eventEmitter) {
      // Initialize with a default value
      let eventType: VerificationEventType = VerificationEventType.CIRCUIT_OPEN;
      
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
          successCount: this.successCount
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
      if (this.state === CircuitState.HALF_OPEN) {
        // Increment success count
        this.successCount++;
        
        // Check if success threshold reached
        if (this.successCount >= this.options.halfOpenSuccessThreshold) {
          // Transition to closed state
          this.changeState(CircuitState.CLOSED);
        }
      } else if (this.state === CircuitState.CLOSED) {
        // Reset failure count on success in closed state
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      // Handle failure
      this.failureCount++;
      
      if (this.logger) {
        this.logger.debug(`Circuit breaker recorded failure (${this.failureCount}/${this.options.failureThreshold})`, error).catch(() => {});
      }
      
      // Check if failure threshold reached
      if (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) {
        // Transition to open state
        this.changeState(CircuitState.OPEN);
      } else if (this.state === CircuitState.HALF_OPEN) {
        // Any failure in half-open state should open the circuit
        this.changeState(CircuitState.OPEN);
      }
      
      // Re-throw the error
      throw error;
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
    
    if (this.logger) {
      this.logger.debug('Circuit breaker reset').catch(() => {});
    }
  }
  
  /**
   * Run a health check
   */
  async runHealthCheck(): Promise<HealthCheckResult> {
    try {
      // Run the health check function
      const result = await this.options.healthCheck();
      this.latestHealthCheck = result;
      
      if (this.logger) {
        this.logger.debug('Health check result:', result).catch(() => {});
      }
      
      return result;
    } catch (error) {
      if (this.logger) {
        this.logger.error('Health check failed:', error).catch(() => {});
      }
      
      // Return a failed health check result
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
      openCount: this.openCount,
      timeSinceStateChange: Date.now() - this.lastStateChangeTime,
      executionCount: this.executionCount,
      successCount: this.successfulExecutions,
      failureCount: this.failedExecutions,
      failuresByCategory: {},
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
    
    // Default to not allowed for unknown states
    return false;
  }
  
  /**
   * Register an operation type with its criticality level
   */
  registerOperation(operationType: string, criticality: number): void {
    // Basic implementation doesn't track operations by criticality
    if (this.logger) {
      this.logger.debug(`Registered operation ${operationType} with criticality ${criticality} (not used in basic circuit breaker)`).catch(() => {});
    }
  }
}

/**
 * Create a new circuit breaker
 */
export function createCircuitBreaker(
  options: CircuitBreakerOptions,
  logger?: LoggingInterface,
  eventEmitter?: EventEmitter
): CircuitBreaker {
  return new VerificationCircuitBreaker(options, logger, eventEmitter);
}

/**
 * Create a default circuit breaker with standard options
 */
export function createDefaultCircuitBreaker(
  logger?: LoggingInterface,
  eventEmitter?: EventEmitter
): CircuitBreaker {
  return createCircuitBreaker({
    failureThreshold: VERIFICATION_CONSTANTS.DEFAULT_FAILURE_THRESHOLD,
    resetTimeout: VERIFICATION_CONSTANTS.DEFAULT_RESET_TIMEOUT,
    halfOpenSuccessThreshold: VERIFICATION_CONSTANTS.DEFAULT_HALF_OPEN_SUCCESS_THRESHOLD
  }, logger, eventEmitter);
}
