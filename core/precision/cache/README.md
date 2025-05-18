# Precision Cache Module

A high-performance caching system designed for PrimeOS precision operations, built on the PrimeOS Model architecture.

## Overview

The cache module provides a flexible, efficient memory caching solution that supports multiple eviction strategies for optimal performance across different use cases. The implementation is framework-agnostic and designed to handle high-throughput operations with minimal overhead.

## Features

- **Multiple Eviction Strategies**:
  - **LRU (Least Recently Used)**: Removes the least recently accessed items when the cache reaches capacity
  - **LFU (Least Frequently Used)**: Removes the least frequently accessed items
  - **Time-Based**: Automatically expires items after a defined time period
  - **Composite**: Combines multiple strategies with weighted prioritization

- **Performance Optimized**:
  - O(1) lookup times for common operations
  - Efficient memory management
  - Low overhead for high-throughput environments

- **Metrics Collection**:
  - Hit/miss rates
  - Eviction statistics
  - Access timings
  - Cache size tracking

- **Utility Functions**:
  - Built-in memoization for function results
  - Async memoization for Promise-based functions

## API Reference

### Basic Usage

```typescript
import { createCache } from './index';

// Create a cache with default options (LRU strategy, max size 1000)
const cache = createCache();
await cache.initialize();

// Set a value
cache.set('key', 'value');

// Get a value
const value = cache.get('key');

// Check if a key exists
const exists = cache.has('key');

// Delete a key
cache.delete('key');

// Clear the cache
cache.clear();

// Get cache metrics
const metrics = cache.getMetrics();
```

### Using Specialized Caches

```typescript
import { 
  createLRUCache, 
  createLFUCache, 
  createTimeBasedCache, 
  createCompositeCache 
} from './index';

// Create an LRU cache
const lruCache = createLRUCache(500); // max size 500

// Create an LFU cache
const lfuCache = createLFUCache(500); // max size 500

// Create a time-based cache (5 minute TTL)
const timeCache = createTimeBasedCache(5 * 60 * 1000, 500);

// Create a composite cache
const compositeCache = createCompositeCache(
  [
    { type: 'lru', weight: 0.7 },
    { type: 'lfu', weight: 0.3 }
  ],
  500 // max size
);
```

### Using Memoization

```typescript
import { memoize, memoizeAsync } from './index';

// Memoize a synchronous function
const expensiveCalculation = (a, b) => { 
  // complex calculation
  return a + b; 
};
const memoizedCalculation = memoize(expensiveCalculation);

// Use it like the original function
const result = memoizedCalculation(1, 2); // Calculated
const cachedResult = memoizedCalculation(1, 2); // Returned from cache

// Memoize an asynchronous function
const fetchData = async (id) => {
  // fetch data from server
  return { id, data: 'some data' };
};
const memoizedFetch = memoizeAsync(fetchData);

// Use it like the original function
const data = await memoizedFetch('user-1'); // Fetched
const cachedData = await memoizedFetch('user-1'); // Returned from cache
```

## Integration with OS Model

The cache module extends the BaseModel class from the PrimeOS Model system, following the standard lifecycle patterns:

```typescript
// Initialize the cache
const cache = createCache();
await cache.initialize();

// Process an operation
const result = await cache.process({
  operation: 'set',
  key: 'myKey',
  value: 'myValue'
});

// Reset the cache
await cache.reset();

// Terminate the cache
await cache.terminate();
```

## Performance Considerations

- For large caches with frequent access patterns, LRU is generally the best choice
- For caches where some items are accessed much more frequently than others, LFU provides better hit rates
- For data with variable expiration needs, time-based caching is most appropriate
- Composite caching provides the best of multiple strategies but has slightly higher overhead

## Implementation Details

The cache is built using:

- TypeScript with strong typing
- ES6+ features for modern environments
- Efficient algorithms for minimum memory footprint
- PrimeOS Model architecture for lifecycle management

## Testing

The module includes comprehensive tests covering:

```bash
# Run tests
npm test -- --testPathPattern=core/precision/cache

# Coverage report
npm test -- --testPathPattern=core/precision/cache --coverage
