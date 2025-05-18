# Modular Arithmetic Module

This module provides Python-compatible modular arithmetic operations for the PrimeOS precision ecosystem.

## Overview

The modular arithmetic module implements operations that preserve mathematical precision when working with modular arithmetic, particularly ensuring compatibility with Python's semantics for handling negative numbers in modulo operations.

## Features

- **Python-compatible modulo operation** - Correctly handles negative numbers like Python does
- **Modular exponentiation** - Efficiently computes large powers with modular reduction
- **Modular multiplicative inverse** - Finds a value's inverse in a modular field
- **Overflow-safe modular multiplication** - Handles large number multiplication without intermediate overflow
- **GCD and LCM operations** - Calculate greatest common divisor and least common multiple
- **Extended Euclidean algorithm** - Find Bézout coefficients for two integers
- **Strict mode validation** - Optional validation for operation sizes and more detailed error messages
- **Debug logging** - Comprehensive logging of operations for debugging complex calculations
- **Cache management** - Automatic caching of expensive operations with ability to clear caches

## Usage

```typescript
import { 
  mod, 
  modPow, 
  modInverse,
  modMul,
  gcd,
  lcm,
  extendedGcd,
  clearCache,
  MODULAR_CONSTANTS
} from '@primeos/core/precision/modular';

// Python-compatible modulo (handles negative numbers correctly)
mod(-5, 3);  // 1 (in JavaScript -5 % 3 would be -2)

// Modular exponentiation (a^b mod m)
modPow(2, 10, 1000);  // 24 (2^10 mod 1000)

// Modular multiplication with overflow protection
modMul(9007199254740990n, 9007199254740990n, 97n);  // 49n

// Modular multiplicative inverse (a^-1 mod m)
modInverse(3, 11);  // 4 (because 3 * 4 ≡ 1 mod 11)

// Greatest common divisor
gcd(48n, 18n);  // 6n

// Least common multiple
lcm(4n, 6n);  // 12n

// Extended Euclidean algorithm
const [g, x, y] = extendedGcd(35n, 15n);
// g = 5, x and y are Bézout coefficients where 35x + 15y = 5

// Clear caches (useful for memory management in long-running applications)
clearCache();
```

## Creating Custom Instances

You can create a customized modular arithmetic module with specific options:

```typescript
import { createModularOperations } from '@primeos/core/precision/modular';

const customModular = createModularOperations({
  // Use JavaScript's native modulo behavior instead of Python's
  pythonCompatible: false,  
  
  // Whether to cache expensive operations like modular inverse
  useCache: true,
  
  // Whether to use optimized algorithms for large numbers
  useOptimized: true,
  
  // Threshold (in bits) for using native operations vs specialized algorithms
  nativeThreshold: 50,
  
  // Enable strict validation for all operations
  strict: true,
  
  // Enable debug logging (useful for troubleshooting)
  debug: true
});

// Now use your custom instance
customModular.mod(-5, 3);  // -2 (JavaScript behavior with pythonCompatible: false)

// Clear caches from custom instance
customModular.clearCache();
```

## Detailed API

### Core Functions

- **mod(a: bigint | number, b: bigint | number): bigint | number**  
  Calculate a mod b with Python-compatible handling of negative numbers.

- **modPow(base: bigint | number, exponent: bigint | number, modulus: bigint | number): bigint | number**  
  Calculate (base^exponent) mod modulus efficiently using square-and-multiply algorithm.

- **modInverse(a: bigint | number, m: bigint | number): bigint | number**  
  Find the modular multiplicative inverse of a modulo m.

- **modMul(a: bigint | number, b: bigint | number, m: bigint | number): bigint**  
  Calculate (a * b) mod m without intermediate overflow.

### Additional Functions

- **gcd(a: bigint, b: bigint): bigint**  
  Calculate the greatest common divisor of a and b.

- **lcm(a: bigint, b: bigint): bigint**  
  Calculate the least common multiple of a and b.

- **extendedGcd(a: bigint, b: bigint): [bigint, bigint, bigint]**  
  Calculate the extended Euclidean algorithm, returning [gcd, x, y] where ax + by = gcd(a, b).

- **clearCache(): void**  
  Clear all internal caches used for memoization of expensive operations.

### Constants

- `MODULAR_CONSTANTS.MAX_NATIVE_BITS` - Maximum bit size for native operations
- `MODULAR_CONSTANTS.DEFAULT_CACHE_SIZE` - Default cache size for memoized operations
- `MODULAR_CONSTANTS.MAX_SUPPORTED_BITS` - Maximum supported bit length for operations

## Implementation Details

- Ensures consistent behavior between JavaScript and Python modular operations
- Implements efficient algorithms for large number arithmetic
- Provides cache mechanisms for improved performance on repeated operations
- Protects against integer overflow in intermediate calculations
- Handles edge cases like negative numbers, zero, and modular inverses that don't exist
- Detailed debug logging to trace operation execution and diagnose issues
- Strict mode to enforce size limits and provide enhanced error messages
- Memory management through explicit cache clearing

## Debug Mode

When enabled, debug mode provides detailed logging of:

- Input parameters and configuration options
- Operation execution paths and algorithm choices
- Intermediate calculation steps and results
- Cache hits and cache management operations
- Detailed error information with context

This is particularly useful when diagnosing issues with complex calculations or unexpected results.

## Strict Mode

Strict mode adds additional validation:

- Enforces bit size limits on all operations
- Prevents operations that might cause excessive memory use
- Provides more detailed error messages with context
- Verifies the integrity of intermediate calculations

## Integration with Other Modules

The modular module works seamlessly with other PrimeOS modules:

```typescript
import { modPow } from '@primeos/core/precision/modular';
import { bitLength } from '@primeos/core/precision/bigint';

// Check if a number is a Fermat pseudoprime
function isFermatPseudoprime(n: bigint, base: bigint = 2n): boolean {
  if (n <= 1n || !((n % 2n) === 1n)) return false; // Must be odd and > 1
  return modPow(base, n - 1n, n) === 1n;
}
```
