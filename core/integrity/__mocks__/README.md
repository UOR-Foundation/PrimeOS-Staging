# Integrity Module Mocks

This directory contains mock implementations for the integrity module that are compatible with the PrimeOS Model interface pattern.

## Overview

The mocks provide a simplified version of the integrity module functionality for use in tests, ensuring that:

1. Tests run quickly without the overhead of full implementations
2. The module correctly implements the os/model interface pattern
3. All exported functions and types are available for testing

## Files

### `index.ts`
Main mock implementation that exports all the same functions and types as the real integrity module, but with Jest mock functions.

### `os-model-mock.ts`
Mock implementation of the BaseModel class from `os/model`. This provides the lifecycle management and state tracking functionality.

### `os-logging-mock.ts`
Mock implementation of the logging system from `os/logging`. This captures log messages during tests.

### `test.ts`
Tests for the mock implementation itself, ensuring the mocks work correctly.

### `mock.test.ts`
Integration tests showing how the integrity module mocks work with the os/model interface pattern.

### `test-mock.ts`
Utility functions and helpers for writing tests with the integrity module mocks.

## Usage

### Basic Mock Usage

```typescript
// Import from the mock
import { createIntegrity, IntegrityInterface } from '../__mocks__';

// All functions are Jest mocks
const integrity = createIntegrity();
await integrity.generateChecksum(factors); // Returns mocked value
expect(integrity.generateChecksum).toHaveBeenCalledWith(factors);
```

### Using with BaseModel

```typescript
import { BaseModel } from '../__mocks__/os-model-mock';
import { createIntegrity } from '../__mocks__';

class MyIntegrityModel extends BaseModel {
  private integrity = createIntegrity();
  
  protected async onProcess(input: any) {
    // Use integrity functions
    return this.integrity.verifyIntegrity(input.value);
  }
}
```

### Test Utilities

```typescript
import { 
  createMockPrimeRegistry,
  createTestFactors,
  verifyMockCalls 
} from '../__mocks__/test-mock';

// Create a mock prime registry
const registry = createMockPrimeRegistry();

// Create test factors
const factors = createTestFactors('simple');

// Verify mock calls
verifyMockCalls(someMock, [
  [arg1, arg2],
  [arg3, arg4]
]);
```

## Configuration

The mocks respect the same configuration options as the real module:

```typescript
const integrity = createIntegrity({
  debug: true,
  enableCache: true,
  checksumPower: 8
});
```

## Resetting Mocks

Always reset mocks between tests:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Type Safety

The mocks maintain full TypeScript type compatibility with the real module, ensuring that:

1. Tests will catch type errors
2. IDE autocomplete works correctly
3. Refactoring tools work across tests and implementation

## Integration with Jest

The mocks are automatically used when running tests via the Jest configuration in `jest.config.js`. The module name mapper ensures that imports of `os/model` and `os/logging` are redirected to the mock implementations.
