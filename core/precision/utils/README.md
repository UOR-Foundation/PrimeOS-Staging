# Precision Utility Module

## Overview

The Precision Utility module provides mathematical utility functions for working with numbers in the PrimeOS system. It offers consistent handling of both JavaScript numbers and BigInt values, with a focus on precision, correctness, and performance.

This module implements the PrimeOS Model interface pattern for consistent lifecycle management, allowing it to be used as a standard PrimeOS module with initialization, processing, and termination capabilities.

## Key Features

- **Consistent number handling**: Works with both JavaScript numbers and BigInt values
- **Bit length calculation**: Determine the bit length of any number
- **Byte array conversion**: Convert between numbers and byte arrays
- **Equality checking**: Exact equality comparison across different number types
- **Safe integer detection**: Check if a number is within the safe integer range
- **Mathematical utilities**: Sign, absolute value, power of two detection
- **Efficient caching**: Caching for expensive operations with configurable options
- **PrimeOS Model interface**: Consistent lifecycle management (initialize, process, reset, terminate)

## Module Structure

```
utils/
├── algorithms/                # Algorithm implementations
│   ├── basic/                # Basic mathematical operations
│   │   ├── gcd.ts            # GCD and LCM implementations
│   │   ├── sqrt.ts           # Integer square root implementation
│   │   ├── division.ts       # Ceiling and floor division
│   │   └── index.ts          # Exports from basic algorithms
│   ├── bit/                  # Bit manipulation operations
│   │   ├── counting.ts       # Bit counting operations
│   │   └── index.ts          # Exports from bit algorithms
│   └── index.ts              # Consolidated algorithm exports
├── cache/                    # Caching implementation
│   └── index.ts              # Cache exports
├── errors/                   # Error handling
│   └── index.ts              # Error exports
├── constants.ts              # Module constants
├── index.ts                  # Main implementation and exports
├── types.ts                  # Type definitions
├── README.md                 # This documentation
└── __mocks__/                # Test mocks
```

## Core Operations

### Number Properties

- **bitLength(value)**: Calculate the bit length of a number
- **isSafeInteger(value)**: Check if a value is within the safe integer range
- **isPowerOfTwo(value)**: Check if a number is a power of 2
- **countSetBits(value)**: Count the number of set bits (1s) in a number
- **leadingZeros(value)**: Count the number of leading zeros in the binary representation
- **trailingZeros(value)**: Count the number of trailing zeros in the binary representation

### Comparison Operations

- **exactlyEquals(a, b)**: Check if two values are exactly equal, handling cross-type comparisons

### Conversion Operations

- **toByteArray(value)**: Convert a number to a byte array (little-endian)
- **fromByteArray(bytes)**: Convert a byte array to a BigInt (little-endian)

### Mathematical Operations

- **sign(value)**: Get the sign of a number (-1, 0, or 1)
- **abs(value)**: Get the absolute value of a number
- **gcd(a, b)**: Calculate the greatest common divisor of two numbers
- **lcm(a, b)**: Calculate the least common multiple of two numbers
- **extendedGcd(a, b)**: Extended Euclidean algorithm returning [gcd, x, y] where ax + by = gcd(a, b)
- **integerSqrt(value)**: Calculate the integer square root of a number
- **ceilDiv(a, b)**: Ceiling division (rounds up the result of a/b)
- **floorDiv(a, b)**: Floor division (rounds down the result of a/b)

## Usage Examples

### Basic Usage

```typescript
import { 
  bitLength, 
  exactlyEquals, 
  toByteArray, 
  fromByteArray 
} from 'core/precision/utils';

// Calculate bit length
const bits = bitLength(12345n); // 14

// Check equality
const equal = exactlyEquals(123, 123n); // true

// Convert to byte array
const bytes = toByteArray(12345n); // Uint8Array [57, 48, 0, 0, ...]

// Convert from byte array
const value = fromByteArray(bytes); // 12345n
```

### Using the Model Interface

```typescript
import { createMathUtilsModel } from 'core/precision/utils';

// Create a MathUtils model instance
const mathUtils = createMathUtilsModel({
  enableCache: true,
  useOptimized: true,
  strict: true,
  debug: false
});

// Initialize the module
await mathUtils.initialize();

// Use operations
const bits = mathUtils.bitLength(12345n);
const equal = mathUtils.exactlyEquals(123, 123n);

// Process operations through the standard interface
const result = await mathUtils.process({
  operation: 'bitLength',
  params: [12345n]
});

// Get module state including cache statistics
const state = mathUtils.getState();
console.log(`Cache hits: ${state.cache.bitLengthCacheHits}`);

// Clean up resources
await mathUtils.terminate();
```

### One-Step Initialization

```typescript
import { createAndInitializeMathUtilsModel } from 'core/precision/utils';

// Create and initialize in one step
const mathUtils = await createAndInitializeMathUtilsModel({
  enableCache: true,
  strict: false
});

// Use operations
const bits = mathUtils.bitLength(12345n);

// Clean up resources
await mathUtils.terminate();
```

## Configuration Options

The module can be configured with the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableCache` | boolean | `true` | Enable caching for expensive operations |
| `useOptimized` | boolean | `true` | Use optimized implementations where available |
| `strict` | boolean | `false` | Throw on overflow/underflow instead of silent wrapping |
| `debug` | boolean | `false` | Enable debug logging |
| `name` | string | `'precision-utils'` | Module name for logging |
| `version` | string | `'1.0.0'` | Module version |

## Performance Considerations

- **Caching**: Bit length calculations are cached for better performance with repeated operations
- **Type Handling**: Different algorithms are used for JavaScript numbers and BigInt values
- **Memory Usage**: The cache size is limited to prevent excessive memory usage

## Integration with PrimeOS

This module follows the PrimeOS Model interface pattern, providing consistent lifecycle management:

- **initialize()**: Set up resources and prepare the module for use
- **process()**: Process operations through a standardized interface
- **reset()**: Reset the module state and clear caches
- **terminate()**: Clean up resources

## Implementation Notes

- The module uses a two-tier architecture:
  - A lightweight functional implementation (`createMathUtils`)
  - A full-featured model implementation (`MathUtilsImpl`)
- The default exports are simple functions for ease of use
- The model implementation provides additional features like caching statistics and lifecycle management
