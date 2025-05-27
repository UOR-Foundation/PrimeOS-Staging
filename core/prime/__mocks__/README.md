# Prime Module Mocks

Mock implementations for the Prime module, providing simplified but consistent behavior for testing purposes.

## Overview

This directory contains mock implementations that follow the same interface as the real Prime module but use predictable, lightweight implementations suitable for testing.

## Files

- `index.ts` - Main mock implementation with all exported functions and classes
- `test.ts` - Tests for the mock implementations themselves
- `README.md` - This documentation file

## Mock Features

### MockPrimeRegistryModel

A simplified implementation of the PrimeRegistryModel that:

- Uses a predefined list of 100 prime numbers for fast lookups
- Implements all the same methods as the real PrimeRegistryModel
- Provides consistent, predictable behavior for testing
- Tracks basic metrics (factorizations, primality tests, stream operations)
- Supports streaming operations with mock implementations

### Mock Utility Functions

All utility functions from the real prime module are implemented with simplified versions:

- `mod()` - Python-compatible modular arithmetic
- `modPow()` - Simple modular exponentiation
- `integerSqrt()` - Newton's method approximation
- `isPerfectSquare()` - Perfect square checking
- `reconstructFromFactors()` - Factor reconstruction
- `createBasicStream()` - Stream creation

### Mock Stream Implementation

The mock streams:

- Use simple arrays as backing storage
- Support all standard stream operations (map, filter, take, skip, etc.)
- Provide predictable iteration behavior
- Work with both sync and async operations

## Usage

### In Jest Tests

The mocks are automatically used when Jest encounters imports from the prime module:

```typescript
// This will automatically use the mock
import { createPrimeRegistry } from 'core/prime';

describe('My Test', () => {
  test('should use mock prime registry', () => {
    const registry = createPrimeRegistry();
    expect(registry.isPrime(17n)).toBe(true);
  });
});
```

### Manual Mock Usage

You can also manually import the mocks:

```typescript
import { 
  MockPrimeRegistryModel,
  createPrimeRegistry 
} from 'core/prime/__mocks__';

const mockRegistry = new MockPrimeRegistryModel({
  preloadCount: 20,
  enableLogs: false
});
```

## Mock Data

The mock uses a predefined list of the first 100 prime numbers:

```
2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71,
73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157,
... (up to 547)
```

This provides sufficient coverage for most testing scenarios while maintaining fast performance.

## Configuration Options

The mock supports the same configuration options as the real module:

- `preloadCount` - Number of primes to preload (default: 10)
- `useStreaming` - Enable streaming features (default: false)
- `streamChunkSize` - Chunk size for streaming (default: 1024)
- `enableLogs` - Enable logging (default: false)
- `debug` - Enable debug mode (default: false)
- `initialPrimes` - Custom initial primes array

## Testing the Mocks

Run the mock tests to ensure they work correctly:

```bash
cd core/prime/__mocks__
npm test
```

## Limitations

The mock implementations have some limitations compared to the real module:

1. **Fixed Prime Set**: Only supports the predefined list of 100 primes
2. **Simplified Algorithms**: Uses basic algorithms rather than optimized versions
3. **No Real Streaming**: Streaming operations work on small, in-memory datasets
4. **Mock Metrics**: Performance metrics are simulated rather than measured
5. **No Persistence**: No caching or persistence between test runs

These limitations are intentional to keep the mocks fast and predictable for testing.

## Integration with PrimeOS Testing

The mocks integrate seamlessly with the PrimeOS testing framework:

- Follow the same ModelInterface pattern as real modules
- Support the same lifecycle methods (initialize, process, reset, terminate)
- Provide consistent state tracking and metrics
- Work with the standard PrimeOS error handling patterns

## Extending the Mocks

To add new mock functionality:

1. Add the method to `MockPrimeRegistryModel`
2. Implement a simple, predictable version
3. Add corresponding tests in `test.ts`
4. Update this README with the new functionality

## Best Practices

When using these mocks in tests:

1. **Use Small Numbers**: Stick to the predefined prime set when possible
2. **Test Edge Cases**: The mocks handle the same edge cases as the real module
3. **Check Mock State**: Use `getState()` to verify internal mock state
4. **Reset Between Tests**: Use `reset()` or `clearCache()` to ensure clean state
5. **Mock External Dependencies**: The mocks don't depend on external services

## Troubleshooting

Common issues and solutions:

- **Prime Not Found**: Ensure you're using primes from the predefined set
- **Stream Issues**: Mock streams work on small datasets - don't expect infinite streams
- **Performance**: Mocks may be slower for very large numbers due to simplified algorithms
- **State Issues**: Always reset mock state between tests to avoid interference
