# PrimeOS Core Precision Module

The Precision module provides enhanced mathematical operations with exact precision for the PrimeOS ecosystem. This implementation focuses on ensuring correct handling of large numbers, modular arithmetic, and data integrity through checksums and verification.

## Overview

This module implements mathematical operations with the following key features:

1. **Python-compatible modular arithmetic** - Ensures modular operations behave the same as they would in Python, particularly for negative numbers
2. **BigInt precision operations** - Provides specialized operations for handling large integers beyond JavaScript's native number limits
3. **Checksum and integrity tools** - Offers utilities for verifying mathematical correctness and data integrity
4. **Utility functions** - Common mathematical operations with precise implementations for numbers of any size

## Installation

```bash
npm install @primeos/core/precision
```

## Structure

The precision module is organized into several submodules:

```
precision/
├── README.md          # This documentation file
├── index.ts           # Main entry point and integration
├── types.ts           # Core type definitions
├── bigint/            # BigInt precision enhancements
├── checksums/         # Checksum operations
├── modular/           # Modular arithmetic functions
├── utils/             # Mathematical utility functions
├── verification/      # Data verification utilities
└── test.ts            # Test suite
```

## Components

### Modular Arithmetic

The `modular` module provides Python-compatible modular operations:

```typescript
import { mod, modPow, modInverse } from '@primeos/core/precision';

// Correct handling of negative numbers (like Python)
mod(-5, 13);       // Returns 8 (not -5)

// Modular exponentiation
modPow(2, 15, 13); // Returns 8 (2^15 mod 13)

// Modular inverse
modInverse(3, 11); // Returns 4 (3*4 ≡ 1 mod 11)
```

### BigInt Precision

The `bigint` module enhances operations for large integers:

```typescript
import { bitLength, exactlyEquals, toByteArray } from '@primeos/core/precision';

// Calculate bit length of large numbers
bitLength(123456789012345678901234567890n); // Returns accurate bit count

// Compare numbers exactly
exactlyEquals(123n, 123); // true
exactlyEquals(123n, 123.5); // false

// Convert between BigInt and byte arrays
const bytes = toByteArray(1234567890n);
```

### Verification & Checksums

The `verification` module provides data integrity checking:

```typescript
import {
  verifyValue,
  createVerification,
  VerificationStatus
} from '@primeos/core/precision';

// Verify a value's integrity
const result = verifyValue(checksummedValue, primeRegistry);

// Create a verification context for batch operations
const verification = createVerification();
verification.verifyValues([value1, value2, value3], primeRegistry);

// Check the overall status
if (verification.getStatus() === VerificationStatus.VALID) {
  console.log('All values verified successfully');
}
```

### Utility Functions

The `utils` module provides common mathematical operations:

```typescript
import { mathUtils } from '@primeos/core/precision';

// Check if a value is a safe integer
mathUtils.isSafeInteger(9007199254740991n); // true

// Get the sign of a number
mathUtils.sign(-123n); // -1

// Calculate absolute value
mathUtils.abs(-456n); // 456n

// Check if a number is a power of 2
mathUtils.isPowerOfTwo(64n); // true
```

## Integrated Usage

The precision module provides a unified interface:

```typescript
import { precision, MathUtilities } from '@primeos/core/precision';

// Use the consolidated utilities
MathUtilities.mod(-5, 13); // 8
MathUtilities.bitLength(12345n); // 14

// Access specific modules
precision.modular.mod(-5, 13); // 8
precision.utils.bitLength(12345n); // 14
```

## Configuration

Create a customized precision module with specific configuration:

```typescript
import { createPrecision } from '@primeos/core/precision';

const customPrecision = createPrecision({
  debug: true,
  enableCaching: true,
  pythonCompatible: true,
  checksumPower: 8
});
```

## Constants

The module provides useful mathematical constants:

```typescript
import { PRECISION_CONSTANTS } from '@primeos/core/precision';

// Maximum safe integer values
PRECISION_CONSTANTS.MAX_SAFE_INTEGER; // 9007199254740991
PRECISION_CONSTANTS.MAX_SAFE_BIGINT;  // 9007199254740991n

// Default configuration values
PRECISION_CONSTANTS.DEFAULT_CHECKSUM_POWER; // 6
```

## Integration with Other Modules

The precision module is designed to be used by other PrimeOS components:

```typescript
import { mod, integerSqrt } from '@primeos/core/precision';

export class PrimeRegistry {
  // Use precision functions for exact arithmetic
  isPrime(n: bigint): boolean {
    if (n < 2n) return false;
    const sqrt = integerSqrt(n);
    
    for (const p of this.primes) {
      if (p > sqrt) break;
      if (mod(n, p) === 0n) return false;
    }
    return true;
  }
}
```

## Testing

Run the test suite to verify the functionality:

```bash
npm test
```

This runs comprehensive tests to ensure all components work correctly.

## Building

To build the project:

```bash
npm run build
```

## API Documentation

For detailed API documentation:

```bash
npm run docs
```

This will generate documentation in the `docs` directory.

## License

MIT
