# Precision Modular Arithmetic Module

## Overview

The Precision Modular Arithmetic module provides high-precision, overflow-protected modular arithmetic operations for the PrimeOS system. It implements Python-compatible modular operations with a focus on performance, correctness, and memory efficiency.

This module is designed to handle arbitrarily large integers using the native BigInt type, with specialized algorithms for different bit-size ranges to optimize performance. It includes comprehensive error handling, efficient caching strategies, and follows the PrimeOS Model interface pattern for consistent lifecycle management.

## Key Features

- **Python-compatible modular operations**: Consistent behavior with Python's modulo semantics for negative numbers
- **Overflow protection**: Safe operations for extremely large numbers
- **Efficient caching**: Memory-efficient caching with configurable strategies
- **Advanced algorithms**: Specialized algorithms for different bit-size ranges
- **Comprehensive error handling**: Detailed error messages with mathematical context
- **PrimeOS Model interface**: Consistent lifecycle management (initialize, process, reset, terminate)

## Module Structure

```
modular/
├── algorithms/            # Algorithm implementations
│   ├── basic/            # Basic modular operations (mod, modMul)
│   ├── gcd/              # GCD and LCM algorithms
│   ├── exponentiation/   # Modular exponentiation and inverse
│   ├── advanced/         # Advanced algorithms (Karatsuba, NTT, etc.)
│   └── index.ts          # Algorithm exports
├── cache/                # Caching implementation
├── errors/               # Error handling
├── __mocks__/            # Test mocks
├── constants.ts          # Module constants
├── index.ts              # Main module entry point
├── types.ts              # Type definitions
└── README.md             # This documentation
```

## Core Operations

### Basic Operations

- **mod(a, b)**: Python-compatible modulo operation
- **modMul(a, b, m)**: Modular multiplication with overflow protection

### GCD and LCM Operations

- **gcd(a, b)**: Greatest common divisor
- **lcm(a, b)**: Least common multiple with overflow protection
- **extendedGcd(a, b)**: Extended Euclidean algorithm returning [gcd, x, y] where ax + by = gcd(a, b)
- **binaryGcd(a, b)**: Binary GCD algorithm (Stein's algorithm)

### Exponentiation Operations

- **modPow(base, exponent, modulus)**: Modular exponentiation (base^exponent mod modulus)
- **modInverse(a, m)**: Modular multiplicative inverse (a^-1 mod m)
- **slidingWindowModPow(base, exponent, modulus, windowSize)**: Optimized modular exponentiation for large exponents

### Advanced Algorithms

- **karatsubaMultiply(a, b)**: Karatsuba multiplication for large integers
- **karatsubaModMul(a, b, m)**: Modular multiplication using Karatsuba algorithm
- **montgomeryReduction(a, m)**: Montgomery reduction for efficient modular arithmetic
- **numberTheoreticTransform(a, modulus, inverse)**: Number-theoretic transform for very large modular operations

## Usage Examples

### Basic Usage

```typescript
import { mod, modPow, modInverse } from 'core/precision/modular';

// Basic modulo operation (Python-compatible)
const result1 = mod(-5n, 3n); // 1n

// Modular exponentiation
const result2 = modPow(2n, 10n, 1000n); // 24n (2^10 mod 1000)

// Modular inverse
const result3 = modInverse(3n, 11n); // 4n (3 * 4 ≡ 1 mod 11)
```

### Using the Model Interface

```typescript
import { createModularOperations } from 'core/precision/modular';

// Create a modular operations instance
const modular = createModularOperations({
  pythonCompatible: true,
  useCache: true,
  strict: true,
  debug: false
});

// Initialize the module
await modular.initialize();

// Use operations
const result = modular.modPow(2n, 10n, 1000n);

// Clean up resources
await modular.terminate();
```

### Advanced Usage with Custom Options

```typescript
import { createModularOperations } from 'core/precision/modular';

// Create a modular operations instance with custom options
const modular = createModularOperations({
  pythonCompatible: true,
  useCache: true,
  useOptimized: true,
  nativeThreshold: 128, // Use native operations for numbers up to 128 bits
  strict: true,
  debug: true,
  name: 'custom-modular',
  version: '1.0.0'
});

// Initialize the module
await modular.initialize();

// Use advanced algorithms
const result1 = modular.karatsubaMultiply(
  12345678901234567890n,
  98765432109876543210n
);

const result2 = modular.slidingWindowModPow(
  2n, 
  1000000n, 
  1000000007n, 
  8 // Window size
);

// Clean up resources
await modular.terminate();
```

## Configuration Options

The module can be configured with the following options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `pythonCompatible` | boolean | `true` | Use Python-compatible modulo semantics for negative numbers |
| `useCache` | boolean | `true` | Enable caching of intermediate results |
| `useOptimized` | boolean | `true` | Use optimized algorithms where available |
| `nativeThreshold` | number | `50` | Maximum bit size to use native operations |
| `strict` | boolean | `false` | Enable strict validation and detailed errors |
| `debug` | boolean | `false` | Enable debug logging |
| `name` | string | `'precision-modular'` | Module name for logging |
| `version` | string | `'1.0.0'` | Module version |

## Error Handling

The module provides detailed error messages for various error conditions:

- **Division by zero**: Thrown when attempting to perform modulo operations with a zero modulus
- **No modular inverse**: Thrown when a modular inverse does not exist
- **Bit size exceeded**: Thrown in strict mode when operations exceed the maximum supported bit size
- **Overflow**: Thrown when an operation would result in overflow

## Performance Considerations

- **Bit Size Thresholds**: The module automatically selects the most efficient algorithm based on the bit size of the operands.
- **Caching**: Memoization is used for expensive operations like modular inverse and GCD.
- **Algorithm Selection**: Different algorithms are used for different bit size ranges:
  - Small numbers: Native operations
  - Medium numbers: Standard algorithms
  - Large numbers: Specialized algorithms (Karatsuba, sliding window, etc.)

## Integration with PrimeOS

This module follows the PrimeOS Model interface pattern, providing consistent lifecycle management:

- **initialize()**: Set up resources and prepare the module for use
- **process()**: Process operations through a standardized interface
- **reset()**: Reset the module state
- **terminate()**: Clean up resources

## Testing

The module includes comprehensive tests for all operations, including:

- Basic operations
- Edge cases
- Large numbers
- Error conditions
- Performance benchmarks

To run the tests:

```bash
cd core/precision/modular
npm test
```

For test coverage:

```bash
npm test -- --coverage
```

## Future Improvements

- **Additional Algorithms**: Implementation of more specialized algorithms for specific use cases
- **WASM Integration**: Integration with WebAssembly for performance-critical operations
- **Parallel Processing**: Support for parallel processing of large operations
- **Custom Number Types**: Support for custom number types beyond BigInt
