# BigInt Module

Enhanced BigInt operations for PrimeOS precision system. This module provides extended functionality for working with arbitrarily large integers beyond JavaScript's native capabilities.

## Features

- **Enhanced Precision**: Work with integers of any size with consistent API
- **Bit Operations**: Efficient bit manipulation functions
- **Byte Conversion**: Convert between BigInt and byte arrays
- **Primality Testing**: Fast Miller-Rabin probabilistic primality testing
- **Random Generation**: Cryptographically secure random BigInt generation
- **Modular Arithmetic**: Efficient modular exponentiation and related operations
- **Caching System**: LRU cache for performance optimization

## Usage

The module can be used either through direct function calls or by creating a model instance:

### Direct Function Use

```typescript
import { 
  bitLength, 
  isProbablePrime, 
  getRandomBigInt,
  toByteArray,
  fromByteArray
} from '@primeos/core/precision/bigint';

// Calculate bit length
const bits = bitLength(1234567890n);  // 31

// Check primality
const isPrime = isProbablePrime(101n); // true

// Generate random BigInt
const random = getRandomBigInt(128); // 128-bit random number

// Convert to/from bytes
const bytes = toByteArray(42n);
const value = fromByteArray(bytes); // 42n
```

### Model Interface

```typescript
import { createBigInt, createAndInitializeBigInt } from '@primeos/core/precision/bigint';

// Create and initialize in separate steps
const bigint = createBigInt({
  debug: true,
  enableCache: true,
  cacheSize: 1000
});

await bigint.initialize();

// Or create and initialize in one step
const bigint = await createAndInitializeBigInt({
  debug: true,
  enableCache: true
});

// Use the instance methods
const bits = bigint.bitLength(1234567890n);

// Process operation through the standard interface
const result = await bigint.process({
  operation: 'isProbablePrime',
  params: [101n]
});

// Clean up resources
await bigint.terminate();
```

## Configuration Options

The module accepts the following configuration options:

- `strict` - Throw error on overflow instead of wrapping (default: false)
- `enableCache` - Enable caching for bit operations (default: true)
- `radix` - Default radix for string conversions (default: 10)
- `useOptimized` - Use optimized algorithm variants where available (default: true)
- `cacheSize` - Maximum size of the LRU cache (default: 1000)
- `debug` - Enable additional logging (default: false)

## API Reference

### Core Functions

- `bitLength(value: bigint): number` - Calculate the bit length of a BigInt
- `exactlyEquals(a: bigint | number, b: bigint | number): boolean` - Check if two values are exactly equal
- `toByteArray(value: bigint): Uint8Array` - Convert a BigInt to a byte array (little-endian format)
- `fromByteArray(bytes: Uint8Array): bigint` - Convert a byte array to a BigInt (little-endian format)
- `getRandomBigInt(bits: number): bigint` - Generate a cryptographically secure random BigInt
- `isProbablePrime(value: bigint, iterations?: number): boolean` - Test if a BigInt is probably prime
- `countLeadingZeros(value: bigint): number` - Count the number of leading zero bits
- `countTrailingZeros(value: bigint): number` - Count the number of trailing zero bits
- `getBit(value: bigint, position: number): 0 | 1` - Get a specific bit from a BigInt
- `setBit(value: bigint, position: number, bitValue: 0 | 1): bigint` - Set a specific bit in a BigInt
- `modPow(base: bigint, exponent: bigint, modulus: bigint): bigint` - Perform modular exponentiation

### Factory Functions

- `createBigIntOperations(options?: BigIntOptions): BigIntOperations` - Create a custom operations object
- `createBigInt(options?: BigIntOptions): BigIntInterface` - Create a BigInt model instance
- `createAndInitializeBigInt(options?: BigIntOptions): Promise<BigIntInterface>` - Create and initialize in one step

## Integration with PrimeOS

This module is part of the PrimeOS precision system and follows the standard Model interface pattern:

- Implements `ModelInterface` for lifecycle management
- Uses the standard state tracking system
- Provides process() for operation requests
- Follows the standardized error handling

The BigInt module can be used as a dependency by other PrimeOS modules that require high-precision integer operations.
