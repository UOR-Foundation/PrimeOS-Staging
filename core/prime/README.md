# Prime Module

The Prime module implements the first axiom of the Universal Object Representation (UOR) kernel:

> **Prime Number Foundation**: All representation derives from prime numbers

This foundational module provides the primitives for working with prime numbers, which form the basis for all data representation in the PrimeOS system.

## Overview

The Prime module offers a registry for prime number operations, including:

- Prime number generation and caching
- Primality testing
- Prime number retrieval by index
- Prime factorization
- Efficient operations for large numbers
- Streaming capabilities for high-throughput processing

## Core Concepts

### Prime Registry

The `PrimeRegistry` is the central component that manages prime numbers. It:

- Maintains a cache of precomputed prime numbers
- Provides O(1) lookup for known primes
- Automatically extends the cache when needed
- Ensures mathematical correctness for all operations

### Factorization

Factorization decomposes a number into its prime components:
```
60 = 2² × 3¹ × 5¹
```

The module represents factorizations as arrays of `Factor` objects, each containing:
- `prime`: The prime number
- `exponent`: How many times the prime appears in the factorization

### Streaming Support

For extremely large numbers, the module provides streaming interfaces that enable:
- Processing numbers beyond the limits of JavaScript's BigInt
- Chunk-based factorization
- Efficient memory usage for large operations

## API Reference

### Creation

```typescript
// Create a standard registry
const registry = createPrimeRegistry();

// Create a registry with custom options
const configuredRegistry = createPrimeRegistry({
  preloadCount: 1000,  // Preload 1000 primes
  useStreaming: true   // Enable streaming capabilities
});
```

### Basic Operations

```typescript
// Test if a number is prime
const isPrime = registry.isPrime(17n);  // true

// Get a prime by index (0-based)
const thirdPrime = registry.getPrime(2);  // 5n (0=2, 1=3, 2=5)

// Get index of a prime
const indexOfSeven = registry.getIndex(7n);  // 3

// Factor a number
const factors = registry.factor(60n);  
// Returns: [
//   { prime: 2n, exponent: 2 },
//   { prime: 3n, exponent: 1 },
//   { prime: 5n, exponent: 1 }
// ]
```

### Streaming Operations

```typescript
// Create a stream of consecutive primes
const primeStream = registry.createPrimeStream(1000);  // Start from 1000th prime
const next10Primes = await primeStream.take(10).toArray();

// Stream factorization of large numbers
const factorStream = registry.createFactorStream(largeNumber);
const factors = await factorStream.toArray();
```

## Implementation Notes

The Prime module is implemented with:

- Pure JavaScript/TypeScript for maximum compatibility
- Efficient algorithms for primality testing and factorization
- Support for BigInt to handle arbitrary-precision integers
- Memory-efficient strategies for caching and retrieval
- Optimizations for common operations

## Usage in the PrimeOS Ecosystem

The Prime module serves as the foundation for other core modules:

- **Integrity Module**: Uses prime-based checksums for data verification
- **Encoding Module**: Represents data and operations using prime number patterns
- **Stream Module**: Extends streaming capabilities for high-throughput processing
- **Bands Module**: Optimizes prime operations across different magnitude ranges

## Examples

### Generating Prime Sequences

```typescript
const registry = createPrimeRegistry();
const stream = registry.createPrimeStream();

// Get the first 10 primes
const first10 = await stream.take(10).toArray();
console.log(first10);  // [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n]

// Skip the first 1000 primes and take the next 5
const next5 = await stream.skip(1000).take(5).toArray();
console.log(next5);  // The 1001st through 1005th primes
```

### Prime Factorization

```typescript
const registry = createPrimeRegistry();

// Factor a number
const factors = registry.factor(840n);
// Returns: [
//   { prime: 2n, exponent: 3 },  // 2³
//   { prime: 3n, exponent: 1 },  // 3¹
//   { prime: 5n, exponent: 1 },  // 5¹
//   { prime: 7n, exponent: 1 }   // 7¹
// ]

// Reconstruct the number from its factors
const reconstructed = factors.reduce(
  (acc, { prime, exponent }) => acc * prime ** BigInt(exponent),
  1n
);
console.log(reconstructed === 840n);  // true
```
