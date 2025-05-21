# Verification Cache Module

This module provides caching capabilities for the verification system, improving performance by storing and reusing verification results. It leverages the precision/cache module for efficient caching.

## Overview

The cache module implements multiple cache eviction policies to optimize for different usage patterns:

1. **LRU (Least Recently Used)**: Evicts the least recently used items first
2. **LFU (Least Frequently Used)**: Evicts the least frequently used items first
3. **FIFO (First In, First Out)**: Currently mapped to LRU implementation
4. **Time-Based**: Evicts items based on a time-to-live (TTL) value

## Components

### Types

- `VerificationCache<K, V>`: Generic interface for caches
- `CacheEntry<V>`: Interface for cache entries
- `CacheEvictionPolicy`: Enum for cache eviction policies
- `VerificationCacheOptions`: Interface for cache options
- `VerificationCacheFactory`: Factory for creating caches

### Adapter

- `VerificationCacheAdapter`: Adapter that implements the VerificationCache interface but uses precision/cache under the hood
- `createVerificationCacheAdapter`: Function to create a verification cache adapter

### Factory

- `VerificationCacheFactoryImpl`: Implementation of the cache factory that uses precision/cache
- `createCacheFactory`: Function to create a cache factory
- `createDefaultCache`: Function to create a cache with default options

## Usage

### Creating Caches

```typescript
import { 
  createCacheFactory, 
  CacheEvictionPolicy 
} from '../cache';

// Create a cache factory
const cacheFactory = createCacheFactory(logger);

// Create an LRU cache with a maximum size of 1000
const lruCache = cacheFactory.createCache<string, boolean>({
  maxSize: 1000,
  policy: CacheEvictionPolicy.LRU
});

// Create an LFU cache with a maximum size of 1000
const lfuCache = cacheFactory.createCache<string, boolean>({
  maxSize: 1000,
  policy: CacheEvictionPolicy.LFU
});

// Create a FIFO cache with a maximum size of 1000
const fifoCache = cacheFactory.createCache<string, boolean>({
  maxSize: 1000,
  policy: CacheEvictionPolicy.FIFO
});

// Create a time-based cache with a maximum size of 1000 and a TTL of 1 hour
const timeCache = cacheFactory.createCache<string, boolean>({
  maxSize: 1000,
  policy: CacheEvictionPolicy.TIME,
  ttl: 60 * 60 * 1000 // 1 hour in milliseconds
});
```

### Using Caches

```typescript
// Set a value in the cache
cache.set('key', true);

// Get a value from the cache
const value = cache.get('key');

// Check if a key exists in the cache
const exists = cache.has('key');

// Delete a key from the cache
cache.delete('key');

// Clear the cache
cache.clear();

// Get cache size
const size = cache.size();

// Get cache metrics
const metrics = cache.getMetrics();
console.log(`Hits: ${metrics.hits}, Misses: ${metrics.misses}, Size: ${metrics.size}`);
```

### Using Default Cache

```typescript
import { createDefaultCache } from '../cache';

// Create a default cache with standard options (LRU policy, size from constants)
const cache = createDefaultCache<string, boolean>(logger);
```

## Integration with Verification System

The cache module is integrated with the verification system to improve performance by caching verification results. This reduces the need to perform expensive verification operations repeatedly for the same values.

### Configuration

The verification system can be configured to use caching through the verification options:

```typescript
import { createVerification } from '../verification';

const verification = createVerification({
  enableCache: true,
  cacheSize: 1000
});
```

## Implementation Details

The cache module is implemented using a combination of the factory pattern and the adapter pattern:

1. The factory creates caches with different eviction policies based on the options provided.
2. The adapter implements the VerificationCache interface but delegates to the precision/cache module.
3. The precision/cache module provides the actual caching functionality.

This approach provides several benefits:

1. **Code Reuse**: Leverages the existing precision/cache implementation
2. **Consistency**: Ensures consistent caching behavior across modules
3. **Maintainability**: Reduces duplicate code and centralizes cache logic
4. **Performance**: Takes advantage of optimizations in precision/cache
5. **Extensibility**: Makes it easier to add new features to all caches at once
