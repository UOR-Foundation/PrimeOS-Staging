# Verification Module

The Verification module provides data integrity verification capabilities for PrimeOS. It implements the PrimeOS Model interface pattern for consistent lifecycle management.

## Overview

This module is responsible for verifying the integrity of data by validating checksums. It works with the prime-based representation system of PrimeOS to ensure data correctness.

## Features

- **Checksum Verification**: Verify the integrity of values using their embedded checksums
- **Batch Verification**: Verify multiple values at once with configurable fail-fast behavior
- **Caching**: Optimize repeated verifications with multiple cache eviction policies (LRU, LFU, FIFO, Time-based)
- **Optimized Verifiers**: Create specialized verification functions for performance-critical applications
- **Error Handling**: Comprehensive error handling with detailed error information
- **Retry Mechanism**: Automatic retry for transient failures with configurable backoff strategy
- **Validation**: Input and configuration validation to ensure correct operation
- **Resilience**: Rate limiting and circuit breaking to prevent system overload and cascading failures
- **Metrics**: Collection and reporting of performance metrics
- **Events**: Event emission for monitoring and debugging
- **Model Interface**: Implements the PrimeOS Model interface for consistent lifecycle management

## Usage

### Basic Verification

```typescript
import { verifyValue } from 'core/precision/verification';
import { getPrimeRegistry } from 'core/prime';

// Get a prime registry
const primeRegistry = getPrimeRegistry();

// Verify a value
const result = verifyValue(42n, primeRegistry);

if (result.valid) {
  console.log('Value is valid!');
  console.log('Core factors:', result.coreFactors);
  console.log('Checksum prime:', result.checksumPrime);
} else {
  console.error('Verification failed:', result.error?.message);
  console.error('Expected:', result.error?.expected);
  console.error('Actual:', result.error?.actual);
}
```

### Batch Verification

```typescript
import { verifyValues } from 'core/precision/verification';
import { getPrimeRegistry } from 'core/prime';

// Get a prime registry
const primeRegistry = getPrimeRegistry();

// Verify multiple values
const values = [42n, 30n, 100n];
const results = verifyValues(values, primeRegistry);

// Check overall status
const allValid = results.every(r => r.valid);
console.log('All values valid:', allValid);

// Process individual results
results.forEach((result, index) => {
  console.log(`Value ${values[index]}: ${result.valid ? 'Valid' : 'Invalid'}`);
});
```

### Creating an Optimized Verifier

```typescript
import { createOptimizedVerifier } from 'core/precision/verification';
import { getPrimeRegistry } from 'core/prime';

// Get a prime registry
const primeRegistry = getPrimeRegistry();

// Create an optimized verifier function
const isValid = createOptimizedVerifier(primeRegistry);

// Use the optimized function for repeated checks
const values = [42n, 30n, 100n];
const validValues = values.filter(isValid);

console.log('Valid values:', validValues);
```

### Using the Model Interface

```typescript
import { createVerification } from 'core/precision/verification';
import { getPrimeRegistry } from 'core/prime';

async function verificationExample() {
  // Create and configure a verification instance
  const verification = createVerification({
    debug: true,
    failFast: true,
    cacheSize: 1000,
    enableCache: true
  });

  // Initialize the module
  await verification.initialize();

  // Get a prime registry
  const primeRegistry = getPrimeRegistry();

  // Verify values
  const values = [42n, 30n, 100n];
  for (const value of values) {
    const result = verification.verifyValue(value, primeRegistry);
    console.log(`Value ${value}: ${result.valid ? 'Valid' : 'Invalid'}`);
  }

  // Get verification status
  const status = verification.getStatus();
  console.log('Verification status:', status);

  // Get verification results
  const results = verification.getResults();
  console.log('Valid count:', results.filter(r => r.valid).length);
  console.log('Invalid count:', results.filter(r => !r.valid).length);

  // Get module state
  const state = verification.getState();
  console.log('Cache hits:', state.cache.hits);
  console.log('Cache misses:', state.cache.misses);

  // Clean up
  await verification.terminate();
}
```

### Using Retry Capabilities

```typescript
import { verifyValueWithRetry, createOptimizedVerifierWithRetry } from 'core/precision/verification';
import { getPrimeRegistry } from 'core/prime';

async function retryExample() {
  // Get a prime registry
  const primeRegistry = getPrimeRegistry();
  
  // Verify with retry for transient failures
  const result = await verifyValueWithRetry(42n, primeRegistry, {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 1000,
    backoffFactor: 2
  });
  
  console.log('Verification result:', result.valid);
  
  // Create an optimized verifier with retry capability
  const isValidWithRetry = createOptimizedVerifierWithRetry(primeRegistry);
  
  // Use the retry-capable verifier
  const isValid = await isValidWithRetry(42n);
  console.log('Is valid:', isValid);
}
```

### Error Handling

```typescript
import { 
  createVerification, 
  ValidationError, 
  ChecksumMismatchError,
  PrimeRegistryError
} from 'core/precision/verification';
import { getPrimeRegistry } from 'core/prime';

function errorHandlingExample() {
  const verification = createVerification({ debug: true });
  const primeRegistry = getPrimeRegistry();
  
  try {
    const result = verification.verifyValue(42n, primeRegistry);
    console.log('Verification result:', result.valid);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation error:', error.message);
      if (error.value) {
        console.error('Invalid value:', error.value);
      }
    } else if (error instanceof ChecksumMismatchError) {
      console.error('Checksum mismatch:', error.message);
      console.error('Expected:', error.expected);
      console.error('Actual:', error.actual);
    } else if (error instanceof PrimeRegistryError) {
      console.error('Prime registry error:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
    
    // Get detailed error information
    const details = verification.getErrorDetails(error);
    console.error('Error details:', details);
    
    // Log the error with context
    verification.logError(error, { context: 'verification example' });
  }
}
```

### Using Validation

```typescript
import { 
  validateBigInt, 
  validatePrimeRegistry, 
  validateRetryOptions, 
  validateVerificationOptions 
} from 'core/precision/verification/validation';
import { getPrimeRegistry } from 'core/prime';

function validationExample() {
  // Validate a bigint value
  const bigIntResult = validateBigInt(123n);
  if (!bigIntResult.valid) {
    console.error('Invalid bigint:', bigIntResult.error);
  }
  
  // Validate a prime registry
  const primeRegistry = getPrimeRegistry();
  const registryResult = validatePrimeRegistry(primeRegistry);
  if (!registryResult.valid) {
    console.error('Invalid prime registry:', registryResult.error);
  }
  
  // Validate retry options
  const retryOptions = {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 1000,
    backoffFactor: 2
  };
  const retryResult = validateRetryOptions(retryOptions);
  if (!retryResult.valid) {
    console.error('Invalid retry options:', retryResult.error);
  }
  
  // Validate verification options
  const verificationOptions = {
    debug: true,
    failFast: false,
    cacheSize: 1000,
    enableCache: true,
    enableRetry: true,
    retryOptions
  };
  const optionsResult = validateVerificationOptions(verificationOptions);
  if (!optionsResult.valid) {
    console.error('Invalid verification options:', optionsResult.error);
  }
}
```

### Using Resilience

```typescript
import { 
  createRateLimiter, 
  createCircuitBreaker, 
  RateLimitExceededError, 
  CircuitOpenError 
} from 'core/precision/verification/resilience';

async function resilienceExample() {
  // Create a rate limiter
  const rateLimiter = createRateLimiter({
    tokensPerSecond: 100,
    bucketSize: 10
  });
  
  // Use the rate limiter
  try {
    if (rateLimiter.tryAcquire()) {
      // Perform rate-limited operation
      console.log('Operation allowed');
    }
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      console.error('Rate limit exceeded');
    }
  }
  
  // Create a circuit breaker
  const circuitBreaker = createCircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenSuccessThreshold: 1
  });
  
  // Use the circuit breaker
  try {
    const result = await circuitBreaker.execute(async () => {
      // Perform operation that might fail
      return 'Operation result';
    });
    console.log('Operation succeeded:', result);
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      console.error('Circuit is open, failing fast');
    } else {
      console.error('Operation failed:', error);
    }
  }
}
```

### Using Advanced Caching

```typescript
import { 
  createCacheFactory, 
  CacheEvictionPolicy 
} from 'core/precision/verification/cache';

function cachingExample() {
  // Create a cache factory
  const cacheFactory = createCacheFactory();
  
  // Create an LRU cache
  const lruCache = cacheFactory.createCache<string, boolean>({
    maxSize: 1000,
    policy: CacheEvictionPolicy.LRU
  });
  
  // Create an LFU cache
  const lfuCache = cacheFactory.createCache<string, boolean>({
    maxSize: 1000,
    policy: CacheEvictionPolicy.LFU
  });
  
  // Create a FIFO cache
  const fifoCache = cacheFactory.createCache<string, boolean>({
    maxSize: 1000,
    policy: CacheEvictionPolicy.FIFO
  });
  
  // Create a time-based cache
  const timeCache = cacheFactory.createCache<string, boolean>({
    maxSize: 1000,
    policy: CacheEvictionPolicy.TIME,
    ttl: 60 * 60 * 1000 // 1 hour in milliseconds
  });
  
  // Use the cache
  lruCache.set('key1', true);
  const value = lruCache.get('key1');
  console.log('Cached value:', value);
  
  // Get cache metrics
  const metrics = lruCache.getMetrics();
  console.log(`Hits: ${metrics.hits}, Misses: ${metrics.misses}, Size: ${metrics.size}`);
}
```

## Configuration Options

The verification module accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debug` | boolean | `false` | Enable debug logging |
| `failFast` | boolean | `false` | Stop processing after first verification failure |
| `cacheSize` | number | `1000` | Maximum number of cached verification results |
| `enableCache` | boolean | `true` | Whether to enable caching of verification results |
| `enableRetry` | boolean | `false` | Enable automatic retry for transient failures |
| `retryOptions` | RetryOptions | See below | Configuration for retry behavior |
| `enableRateLimit` | boolean | `false` | Enable rate limiting to prevent resource exhaustion |
| `rateLimit` | number | `10000` | Maximum operations per second |
| `rateLimitBurst` | number | `100` | Maximum burst size for rate limiting |
| `enableCircuitBreaker` | boolean | `false` | Enable circuit breaker to prevent cascading failures |
| `circuitBreakerThreshold` | number | `5` | Number of failures before opening circuit |
| `circuitBreakerTimeout` | number | `30000` | Time to wait before trying half-open state (ms) |
| `name` | string | `'precision-verification'` | Module name |
| `version` | string | `'1.0.0'` | Module version |

### Retry Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxRetries` | number | `3` | Maximum number of retry attempts |
| `initialDelay` | number | `100` | Initial delay between retries in milliseconds |
| `maxDelay` | number | `1000` | Maximum delay between retries in milliseconds |
| `backoffFactor` | number | `2` | Factor by which to increase delay after each retry |

## API Reference

### Functions

#### Verification Functions

- `verifyValue(value: bigint, primeRegistry: PrimeRegistryForVerification): VerificationResult`
  Verify a single value's integrity using its checksum

- `verifyValueWithRetry(value: bigint, primeRegistry: PrimeRegistryForVerification, retryOptions?: RetryOptions): Promise<VerificationResult>`
  Verify a value with retry for transient failures

- `verifyValues(values: bigint[], primeRegistry: PrimeRegistryForVerification): VerificationResult[]`
  Verify multiple values

- `verifyValuesWithRetry(values: bigint[], primeRegistry: PrimeRegistryForVerification, retryOptions?: RetryOptions): Promise<VerificationResult[]>`
  Verify multiple values with retry for transient failures

#### Optimized Verifiers

- `createOptimizedVerifier(primeRegistry: PrimeRegistryForVerification): (value: bigint) => boolean`
  Create an optimized verification function for repeated use

- `createOptimizedVerifierWithRetry(primeRegistry: PrimeRegistryForVerification, retryOptions?: RetryOptions): (value: bigint) => Promise<boolean>`
  Create an optimized verification function with retry capability

#### Utility Functions

- `getStatus(): VerificationStatus`
  Get the overall verification status

- `getResults(): VerificationResult[]`
  Get all verification results

- `resetVerification(): void`
  Reset the verification context

- `clearCache(): void`
  Clear the verification cache

#### Error Handling Functions

- `getErrorDetails(error: Error): Record<string, any>`
  Get detailed error information for a given error

- `logError(error: Error, context?: Record<string, any>): void`
  Log an error with detailed information and optional context

#### Factory Functions

- `createVerification(options?: VerificationOptions): VerificationModelInterface`
  Create a verification context with the specified options

- `createAndInitializeVerification(options?: VerificationOptions): Promise<VerificationModelInterface>`
  Create and initialize a verification module in a single step

### Types

#### Core Types

- `VerificationStatus`: Enum representing the status of verification
  - `VALID`: All values verified successfully
  - `INVALID`: At least one value failed verification
  - `UNKNOWN`: No values have been verified yet

- `VerificationOptions`: Configuration options for verification operations
  - `debug?: boolean`: Enable debug logging
  - `failFast?: boolean`: Stop processing after first verification failure
  - `cacheSize?: number`: Maximum number of cached verification results
  - `enableCache?: boolean`: Whether to enable caching of verification results
  - `enableRetry?: boolean`: Enable automatic retry for transient failures
  - `retryOptions?: RetryOptions`: Configuration for retry behavior
  - `enableRateLimit?: boolean`: Enable rate limiting to prevent resource exhaustion
  - `rateLimit?: number`: Maximum operations per second
  - `rateLimitBurst?: number`: Maximum burst size for rate limiting
  - `enableCircuitBreaker?: boolean`: Enable circuit breaker to prevent cascading failures
  - `circuitBreakerThreshold?: number`: Number of failures before opening circuit
  - `circuitBreakerTimeout?: number`: Time to wait before trying half-open state (ms)
  - `name?: string`: Module name
  - `version?: string`: Module version

- `RetryOptions`: Configuration options for retry behavior
  - `maxRetries?: number`: Maximum number of retry attempts
  - `initialDelay?: number`: Initial delay between retries in milliseconds
  - `maxDelay?: number`: Maximum delay between retries in milliseconds
  - `backoffFactor?: number`: Factor by which to increase delay after each retry

- `VerificationResult`: Result of a verification operation
  - `coreFactors: Factor[]`: Core factors of the verified value
  - `checksumPrime: bigint`: Checksum prime used for verification
  - `valid: boolean`: Whether verification was successful
  - `error?: { expected: bigint, actual: bigint, message: string }`: Error information if verification failed

- `BasePrimeRegistry`: Base interface for a prime registry with required methods
  - `getPrime(idx: number): bigint`: Get prime at specific index
  - `getIndex(prime: bigint): number`: Get index of a prime in the registry
  - `factor(x: bigint): Factor[]`: Factor a number into its prime components

- `PrimeRegistryForVerification`: Interface for a prime registry used in verification
  - Extends `BasePrimeRegistry` with all required methods
  - `getPrimeFactors?(x: bigint): Factor[]`: Optional method to get prime factors of a number
  - `isPrime?(x: bigint): boolean`: Optional method to check if a number is prime

#### Interface Types

- `VerificationInterface`: Core interface for verification functionality
  - Includes all verification methods like `verifyValue`, `verifyValueWithRetry`, etc.

- `VerificationModelInterface`: Interface extending ModelInterface for Verification module
  - Includes all methods from `VerificationInterface` and `ModelInterface`
  - `getState(): VerificationState`: Get the module state including cache statistics

#### Error Types

- `VerificationError`: Base error class for all verification errors
  - `message: string`: Error message

- `ValidationError`: Error thrown when input validation fails
  - `message: string`: Error message
  - `value?: any`: The invalid value if available

- `ChecksumMismatchError`: Error thrown when checksums don't match
  - `message: string`: Error message
  - `expected: bigint`: Expected checksum
  - `actual: bigint`: Actual checksum

- `PrimeRegistryError`: Error thrown when there's an issue with the prime registry
  - `message: string`: Error message

- `CacheError`: Error thrown when there's an issue with the cache
  - `message: string`: Error message

- `TransientError`: Error that can be retried
  - `message: string`: Error message
  - `retryable: boolean`: Whether the error can be retried

## Integration with PrimeOS

The Verification module integrates with the PrimeOS Model system, providing a consistent interface for lifecycle management. It can be used as a standalone module or as part of a larger PrimeOS application.

## Implementation Details

The module uses the following components:

- **Checksums Module**: For extracting factors and checksums from values
- **Prime Registry**: For accessing prime numbers and factorization
- **Model Interface**: For lifecycle management and state tracking
- **Logging**: For debug and error logging
- **Error Handling**: Specialized error types for different failure scenarios
- **Retry Mechanism**: Exponential backoff retry for transient failures
- **Validation**: Input and configuration validation
- **Resilience**: Rate limiting and circuit breaking
- **Caching**: Multiple cache eviction policies
- **Metrics**: Performance metrics collection
- **Events**: Event emission for monitoring

### Validation Module

The validation module provides comprehensive validation for inputs and configurations:

- **Input Validation**: Ensures that inputs meet the required specifications
- **Configuration Validation**: Validates configuration options
- **Error Reporting**: Provides detailed error messages for validation failures
- **Factory Pattern**: Uses a factory pattern for creating validators

### Resilience Module

The resilience module provides mechanisms to improve system stability:

- **Rate Limiting**: Prevents resource exhaustion by limiting the rate of operations
- **Circuit Breaking**: Prevents cascading failures by failing fast when the system is under stress
- **Token Bucket Algorithm**: Implements the token bucket algorithm for rate limiting
- **State Machine**: Implements a state machine for circuit breaking (CLOSED, OPEN, HALF_OPEN)

### Cache Module

The cache module provides multiple cache eviction policies:

- **LRU (Least Recently Used)**: Evicts the least recently used items first
- **LFU (Least Frequently Used)**: Evicts the least frequently used items first
- **FIFO (First In, First Out)**: Evicts the oldest items first
- **Time-Based**: Evicts items based on a time-to-live (TTL) value
- **Factory Pattern**: Uses a factory pattern for creating caches

### Error Handling

The module implements a comprehensive error handling system with specialized error types:

- **ValidationError**: Thrown when input validation fails, such as null/undefined values or invalid prime registry
- **ChecksumMismatchError**: Thrown when the calculated checksum doesn't match the expected checksum
- **PrimeRegistryError**: Thrown when there's an issue with the prime registry operations
- **CacheError**: Thrown when there's an issue with the cache operations
- **TransientError**: Represents errors that are temporary and can be retried

Each error type provides specific information relevant to the error, making debugging and error handling more effective.

### Retry Mechanism

The retry mechanism uses an exponential backoff strategy to handle transient failures:

1. When a transient error occurs, the operation is retried after a delay
2. The delay increases exponentially with each retry attempt, up to a maximum delay
3. Retries continue until either the operation succeeds or the maximum number of retries is reached
4. The retry behavior is configurable through the `retryOptions` configuration

This approach improves resilience in distributed or network-dependent environments where temporary failures are common.

## Performance Considerations

### General Performance Tips

- Use the `createOptimizedVerifier` function for performance-critical applications
- Enable caching for repeated verifications of the same values
- Use batch verification with `verifyValues` when processing multiple values
- Only enable retry for operations that may experience transient failures
- Use `verifyValueWithRetry` and `verifyValuesWithRetry` selectively where needed

### Caching Considerations

- Choose the appropriate cache eviction policy based on your access patterns:
  - **LRU**: Best for general-purpose caching where recent items are likely to be accessed again
  - **LFU**: Best for workloads where frequency of access is more important than recency
  - **FIFO**: Best for sequential access patterns or when simplicity is preferred
  - **Time-based**: Best when data has a natural expiration time
- Set an appropriate cache size based on memory constraints and expected working set size
- Monitor cache metrics (hits, misses, size) to tune cache parameters

### Resilience Considerations

- Configure rate limiting based on system capacity and expected load:
  - Set `tokensPerSecond` to match the sustainable throughput of your system
  - Set `bucketSize` to allow for reasonable bursts while preventing overload
- Configure circuit breaker parameters based on failure patterns:
  - Set `failureThreshold` based on the number of failures that indicate a systemic issue
  - Set `resetTimeout` based on the expected recovery time of the system
  - Set `halfOpenSuccessThreshold` based on the confidence needed to resume normal operation

### Retry Considerations

- Configure retry options carefully to balance resilience and performance:
  - Set `maxRetries` based on expected failure rates
  - Use a reasonable `initialDelay` to avoid unnecessary waiting
  - Set `maxDelay` to prevent excessive backoff times
  - Adjust `backoffFactor` based on the nature of transient failures
