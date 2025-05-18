# PrimeOS Testing Mocks

This directory contains standardized mock implementations of core PrimeOS modules for use in testing across the project.

## Overview

Testing complex systems like PrimeOS requires isolated testing environments where dependencies can be controlled. These mocks provide consistent implementations of core system components, allowing module-specific tests to run without depending on actual implementations.

## Available Mocks

### `model-mock.ts`

Mock implementation of the core Model system:

- Provides `BaseModel` implementation with all lifecycle methods
- Implements `ModelInterface` with proper typing
- Tracks state and operations
- Simulates the complete model lifecycle (initialize, process, terminate)

### `logging-mock.ts`

Mock implementation of the logging system:

- No-op logger that doesn't actually output logs
- Implements full `LoggingInterface` with proper typing
- Can be used in tests as a drop-in replacement for the real logger

## How to Use

### Direct Import

You can import these mocks directly in test files:

```typescript
import { BaseModel, ModelLifecycleState } from '../../os/os-tests/mocks/model-mock';
import { createLogging } from '../../os/os-tests/mocks/logging-mock';

// Use the mocks in your test
const mockLogger = createLogging({ name: 'test-logger' });
```

### Jest Auto-mocking

The preferred approach is to let Jest auto-mock the dependencies. Create a `__mocks__` directory in your module and copy these mock implementations:

1. Create `__mocks__` directory in your module
2. Copy these mocks into your module's `__mocks__` directory
3. Jest will automatically use these mocks when you import the real modules

For example, in a module:

```
my-module/
├── __mocks__/
│   ├── os-model-mock.ts    # Copy from this directory
│   └── os-logging-mock.ts  # Copy from this directory
├── index.ts
└── test.ts
```

Then in your test file, you don't need to do anything special:

```typescript
// Jest will automatically use the mocks from __mocks__ directory
import { BaseModel } from '../../../os/model';
import { createLogging } from '../../../os/logging';
```

## Extending the Mocks

If your tests require specialized mock behavior:

1. Import the base mocks
2. Extend or enhance them with module-specific test behavior
3. Use the enhanced version in your tests

```typescript
import { BaseModel } from '../../os/os-tests/mocks/model-mock';

// Extend with specialized behavior
class MySpecializedMockModel extends BaseModel {
  // Add specialized test methods or overrides
}
```

## Adding New Mocks

When adding new core system mocks:

1. Follow the pattern of existing mocks
2. Implement the full interface of the real module
3. Export the mock using the same exports as the real module
4. Add the mock to the index.ts file to make it available through the os-tests package
