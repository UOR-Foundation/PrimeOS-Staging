# Precision Module for PrimeOS

A mathematical precision core for the PrimeOS ecosystem, ensuring accurate arithmetic operations and data integrity for large integer calculations.

## Overview

The precision module provides PrimeOS with:

1. **Python-compatible modular arithmetic** - Ensures modular operations behave the same as they would in Python, particularly for negative numbers and modular exponentiation.

2. **Arbitrary-precision operations** - Supports large numbers through optimized BigInt operations.

3. **Verification and checksum utilities** - Provides tools for ensuring mathematical correctness and data integrity.

## Module Structure

The precision module consists of these core components:

```
precision/
├── index.ts               # Main entry point
├── modular.ts             # Modular arithmetic functions
├── utils.ts               # Mathematical utility functions
├── verification.ts        # Data verification utilities
├── checksums.ts           # Checksum operations
├── bigint.ts              # BigInt precision enhancements
└── types.ts               # Core mathematical types
```

## Core Features

### Modular Arithmetic

Provides Python-compatible modular operations:

```typescript
import { mod, modPow, modInverse } from '@primeos/precision';

// Correct handling of negative numbers (like Python)
mod(-5, 13);       // Returns 8

// Modular exponentiation
modPow(2, 15, 13); // Returns 8 (2^15 mod 13)

// Modular inverse
modInverse(3, 11); // Returns 4 (3*4 ≡ 1 mod 11)
```

### BigInt Precision

Enhanced operations for large integers:

```typescript
import { toBigInt, integerSqrt, exactlyEquals } from '@primeos/precision';

// Safely convert various number formats to BigInt
const value = toBigInt("123456789012345678901234567890");

// Calculate precise square root of large numbers
const root = integerSqrt(value); 

// Check for exact equality, not reference equality
if (exactlyEquals(valueA, valueB)) {
  console.log("Values are mathematically equal");
}
```

### Data Integrity & Checksums

Utilities for ensuring mathematical correctness:

```typescript
import { calculateChecksum, verifyChecksum } from '@primeos/precision';

// Calculate a checksum for factors
const checksum = calculateChecksum(factors, primeRegistry);

// Verify data integrity
const isValid = verifyChecksum(value, primeRegistry);
```

### Mathematical Utilities

Common mathematical operations with precise implementations:

```typescript
import { MathUtils } from '@primeos/precision';

// GCD and LCM calculations
const gcdValue = MathUtils.gcd(bigintA, bigintB);
const lcmValue = MathUtils.lcm(bigintA, bigintB);

// Prime number testing
const isPrime = MathUtils.isProbablePrime(largeBigInt);

// Bit operations
const bitLength = MathUtils.bitLength(largeBigInt);
```

## Integration with PrimeOS

The precision module is designed to be used by other PrimeOS components:

```typescript
import { mod, modPow, integerSqrt } from '@primeos/precision';

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

Run the test suite to verify mathematical operations:

```bash
npm test
```

This runs a set of tests that verify the modular arithmetic, utility functions, and verification operations.
