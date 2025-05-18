# Utility Functions Module

This module provides common mathematical utility functions for precision operations in the PrimeOS ecosystem.

## Overview

The utility module provides foundational mathematical operations with consistent behavior across different number types (JavaScript Number and BigInt). These utilities ensure correct handling of edge cases and maintain precision throughout calculations.

## Features

- **Bit operations** - Calculate bit length, check for powers of two
- **Type handling** - Exact equality checking across number types
- **Byte array conversion** - Convert between numbers and byte arrays
- **Safe integer checks** - Determine if values are within safe integer range
- **Value manipulation** - Sign detection, absolute value calculation

## Usage

```typescript
import { 
  bitLength,
  exactlyEquals,
  toByteArray,
  fromByteArray,
  isSafeInteger,
  sign,
  abs,
  isPowerOfTwo,
  UTILITY_CONSTANTS
} from '@primeos/core/precision/utils';

// Calculate bit length
bitLength(255n);      // 8
bitLength(256n);      // 9
bitLength(-42n);      // 6 (sign bit not counted)
bitLength(1000);      // 10 (converts to BigInt internally)

// Check equality across types
exactlyEquals(42n, 42);         // true
exactlyEquals(42n, 42.5);       // false
exactlyEquals(42, 42);          // true
exactlyEquals("42", 42);        // false

// Convert between numbers and byte arrays
const bytes = toByteArray(1234n);
const value = fromByteArray(bytes);  // 1234n

// Check if a value is a safe integer
isSafeInteger(123);             // true
isSafeInteger(9007199254740991n); // true (MAX_SAFE_INTEGER)
isSafeInteger(9007199254740992n); // false (beyond MAX_SAFE_INTEGER)

// Get sign of a number
sign(-42n);   // -1
sign(0n);     // 0
sign(42n);    // 1

// Get absolute value
abs(-42n);    // 42n
abs(-123);    // 123

// Check if a number is a power of two
isPowerOfTwo(64n);    // true
isPowerOfTwo(63n);    // false
isPowerOfTwo(0n);     // false
```

## Creating Custom Instances

You can create a custom utility instance with specific options:

```typescript
import { createMathUtils } from '@primeos/core/precision/utils';

const customUtils = createMathUtils({
  // Enable caching for expensive operations
  enableCache: true,
  
  // Use optimized implementations where available
  useOptimized: true,
  
  // Throw on overflow/underflow instead of silent wrapping
  strict: false
});

// Use your custom instance
customUtils.bitLength(123456789n);
```

## Detailed API

### Core Functions

- **bitLength(value: bigint | number): number**  
  Calculate the number of bits required to represent a value.

- **exactlyEquals(a: any, b: any): boolean**  
  Check if two values are exactly equal, handling type conversions when appropriate.

- **toByteArray(value: bigint | number): Uint8Array**  
  Convert a number to a byte array (little-endian format).

- **fromByteArray(bytes: Uint8Array): bigint**  
  Convert a byte array to a number (little-endian format).

- **isSafeInteger(value: bigint | number): boolean**  
  Check if a value is within the safe integer range.

- **sign(value: bigint | number): number**  
  Get the sign of a number (-1, 0, or 1).

- **abs(value: bigint | number): bigint | number**  
  Get the absolute value of a number.

- **isPowerOfTwo(value: bigint | number): boolean**  
  Check if a number is a power of 2.

### Constants

- `UTILITY_CONSTANTS.MAX_SAFE_INTEGER` - Maximum safe integer in JavaScript
- `UTILITY_CONSTANTS.MIN_SAFE_INTEGER` - Minimum safe integer in JavaScript
- `UTILITY_CONSTANTS.MAX_SAFE_BIGINT` - Maximum safe integer as BigInt
- `UTILITY_CONSTANTS.MIN_SAFE_BIGINT` - Minimum safe integer as BigInt

## Implementation Details

- Works with both JavaScript Number and BigInt types
- Handles edge cases like zero and negative numbers consistently
- Uses caching for expensive operations like bit length calculations
- Provides consistent behavior across different environments and number representations
- Implements efficient algorithms for common mathematical operations

## Integration with Other Modules

The utility module serves as a foundation for other PrimeOS modules:

```typescript
import { bitLength, isPowerOfTwo } from '@primeos/core/precision/utils';
import { mod } from '@primeos/core/precision/modular';

// Calculate the Hamming weight (population count) of a number
function hammingWeight(n: bigint): number {
  let count = 0;
  
  for (let i = 0; i < bitLength(n); i++) {
    if ((n >> BigInt(i)) & 1n) {
      count++;
    }
  }
  
  return count;
}
