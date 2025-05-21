# Verification Resilience Module

This module provides resilience capabilities for the verification system, ensuring that operations can withstand transient failures and high load scenarios.

## Overview

The resilience module implements two key resilience patterns:

1. **Rate Limiting**: Prevents resource exhaustion by limiting the rate of operations
2. **Circuit Breaking**: Prevents cascading failures by failing fast when the system is under stress

## Components

### Rate Limiter

The rate limiter implements the token bucket algorithm to control the rate of operations:

- `RateLimiter`: Interface for rate limiting operations
- `TokenBucketRateLimiter`: Implementation of the token bucket algorithm
- `RateLimitExceededError`: Error thrown when rate limit is exceeded

### Circuit Breaker

The circuit breaker implements the circuit breaker pattern to prevent cascading failures:

- `CircuitBreaker`: Interface for circuit breaking operations
- `VerificationCircuitBreaker`: Implementation of the circuit breaker pattern
- `CircuitOpenError`: Error thrown when circuit is open
- `CircuitState`: Enum for circuit states (CLOSED, OPEN, HALF_OPEN)

## Usage

### Rate Limiter

```typescript
import { createRateLimiter, RateLimitExceededError } from '../resilience';

// Create a rate limiter with 100 operations per second and a burst size of 10
const rateLimiter = createRateLimiter({
  tokensPerSecond: 100,
  bucketSize: 10,
  throwOnLimit: true
}, logger);

// Use the rate limiter
try {
  if (rateLimiter.tryAcquire()) {
    // Perform operation
  }
} catch (error) {
  if (error instanceof RateLimitExceededError) {
    console.error('Rate limit exceeded');
  }
}

// Get available tokens
const availableTokens = rateLimiter.getAvailableTokens();

// Reset the rate limiter
rateLimiter.reset();
```

### Circuit Breaker

```typescript
import { createCircuitBreaker, CircuitOpenError } from '../resilience';

// Create a circuit breaker with 5 failures before opening, 30 second timeout, and 1 success to close
const circuitBreaker = createCircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000,
  halfOpenSuccessThreshold: 1
}, logger);

// Use the circuit breaker
try {
  const result = await circuitBreaker.execute(async () => {
    // Perform operation that might fail
    return await someAsyncOperation();
  });
} catch (error) {
  if (error instanceof CircuitOpenError) {
    console.error('Circuit is open, failing fast');
  } else {
    console.error('Operation failed:', error);
  }
}

// Get current circuit state
const state = circuitBreaker.getState();

// Reset the circuit breaker
circuitBreaker.reset();
```

### Using Default Instances

```typescript
import { createDefaultRateLimiter, createDefaultCircuitBreaker } from '../resilience';

// Create default rate limiter with standard options
const rateLimiter = createDefaultRateLimiter(logger);

// Create default circuit breaker with standard options
const circuitBreaker = createDefaultCircuitBreaker(logger);
```

## Integration with Verification System

The resilience module is integrated with the verification system to ensure that operations are resilient to transient failures and high load scenarios. This helps prevent system overload and cascading failures, improving the reliability of the verification system.

### Configuration

The verification system can be configured to use rate limiting and circuit breaking through the verification options:

```typescript
import { createVerification } from '../verification';

const verification = createVerification({
  // Rate limiting options
  enableRateLimit: true,
  rateLimit: 1000,
  rateLimitBurst: 100,
  
  // Circuit breaker options
  enableCircuitBreaker: true,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 30000
});
