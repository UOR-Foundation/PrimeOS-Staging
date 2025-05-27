# Core Integrity Module

The integrity system implementing **Axiom 2**: Data carries self-verification via checksums.

## Overview

The integrity module provides mathematical foundations for data self-verification using prime-based checksums. Based on analysis of the UOR CPU implementation, this system ensures data correctness through intrinsic verification mechanisms that are embedded directly into the data representation.

## Mathematical Foundation

The integrity system is built on prime number theory, specifically using the unique properties of prime factorization to create self-verifying data structures.

### Checksum Algorithm

The core checksum algorithm follows this pattern:

```typescript
// XOR-based checksum generation
function generateChecksum(factors: Factor[]): bigint {
  let xor = 0;
  for (const {prime, exponent} of factors) {
    xor ^= primeRegistry.getIndex(prime) * exponent;
  }
  return primeRegistry.getPrime(xor);
}

// Attach checksum as 6th power
function attachChecksum(raw: bigint, factors: Factor[]): bigint {
  const checksum = generateChecksum(factors);
  return raw * (checksum ** 6n);  // 6th power attachment
}
```

### Key Properties

1. **XOR-Based Checksums**: Uses XOR of (prime index × exponent) for each factor
2. **6th Power Attachment**: Checksums are attached as the 6th power of checksum primes
3. **Verification During Processing**: Checksums are "peeled" and verified during operations
4. **Self-Verification**: Data carries its own integrity proof intrinsically

## Features

- **Checksum Generation**: Prime-pattern based checksum calculation
- **Integrity Verification**: Automated verification of data integrity
- **Error Detection**: Detection of data corruption or tampering
- **Prime Registry Integration**: Seamless integration with core prime foundation
- **Model Interface**: Standard PrimeOS model lifecycle management

## Installation

```bash
npm install @primeos/core/integrity
```

## Usage

### Basic Checksum Operations

```typescript
import { createIntegrity } from '@primeos/core/integrity';

// Create integrity system
const integrity = await createIntegrity({
  debug: true,
  checksumPower: 6  // Default 6th power attachment
});

await integrity.initialize();

// Generate checksum for prime factors
const factors = [
  { prime: 2n, exponent: 3 },
  { prime: 3n, exponent: 2 },
  { prime: 5n, exponent: 1 }
];

const checksum = await integrity.process({
  operation: 'generateChecksum',
  factors: factors
});

// Attach checksum to raw value
const rawValue = 8n * 9n * 5n;  // 2³ × 3² × 5¹ = 360
const withChecksum = await integrity.process({
  operation: 'attachChecksum',
  value: rawValue,
  factors: factors
});

// Verify integrity
const verification = await integrity.process({
  operation: 'verifyIntegrity',
  value: withChecksum
});

console.log(verification.data.valid);  // true if integrity maintained
```

### Batch Processing

```typescript
// Process multiple values
const values = [value1, value2, value3];
const batchResult = await integrity.process({
  operation: 'verifyBatch',
  values: values
});

console.log(batchResult.data.results);  // Array of verification results
```

## API Reference

### Core Operations

#### `generateChecksum(factors: Factor[]): bigint`
Generate a checksum from prime factorization using XOR pattern.

#### `attachChecksum(value: bigint, factors: Factor[]): bigint`
Attach a checksum to a value as the 6th power of the checksum prime.

#### `verifyIntegrity(value: bigint): VerificationResult`
Verify the integrity of a value by extracting and validating its checksum.

#### `extractChecksum(value: bigint): ChecksumExtraction`
Extract the checksum and core factors from a checksummed value.

### Configuration Options

```typescript
interface IntegrityOptions extends ModelOptions {
  // Checksum power (default: 6)
  checksumPower?: number;
  
  // Enable caching for checksum calculations
  enableCache?: boolean;
  
  // Cache size for verification results
  cacheSize?: number;
  
  // Prime registry to use
  primeRegistry?: PrimeRegistry;
}
```

### Result Types

```typescript
interface VerificationResult {
  valid: boolean;
  coreFactors?: Factor[];
  checksum?: bigint;
  error?: string;
}

interface ChecksumExtraction {
  coreFactors: Factor[];
  checksumPrime: bigint;
  checksumExponent: number;
  valid: boolean;
}
```

## Integration with Core Systems

### Prime Foundation Integration

The integrity system builds directly on the prime foundation:

```typescript
import { createPrimeRegistry } from '@primeos/core/prime';
import { createIntegrity } from '@primeos/core/integrity';

const primeRegistry = await createPrimeRegistry();
const integrity = await createIntegrity({
  primeRegistry: primeRegistry
});
```

### Precision Module Compatibility

Seamlessly integrates with the precision module for large number operations:

```typescript
import { mod, modPow } from '@primeos/core/precision';

// Use precision operations within integrity calculations
const result = mod(largeChecksummedValue, somePrime);
```

## Error Detection Capabilities

The integrity system can detect various types of errors:

1. **Bit Flips**: Single or multiple bit corruption
2. **Factor Corruption**: Changes to prime factorization
3. **Checksum Tampering**: Deliberate checksum modification
4. **Missing Checksums**: Values without proper checksum attachment

## Performance Characteristics

- **Checksum Generation**: O(log n) where n is the number of distinct prime factors
- **Verification**: O(log n) for checksum extraction and validation
- **Memory Usage**: Minimal overhead with optional caching
- **Throughput**: Optimized for high-volume verification scenarios

## Mathematical Properties

### Uniqueness
Each unique prime factorization produces a unique checksum due to the properties of XOR operations on prime indices.

### Error Sensitivity
Small changes in factors result in completely different checksums, providing high sensitivity to corruption.

### Distributive Properties
Checksums can be composed and decomposed following mathematical laws, enabling hierarchical verification.

## Implementation Details

### Checksum Power Selection

The default 6th power attachment provides:
- Sufficient separation from data factors
- Efficient computation
- Clear identification during extraction

### Prime Index Mapping

The system relies on a consistent prime index mapping:
```
prime: 2  3  5  7  11 13 17 19 23 29 ...
index: 0  1  2  3  4  5  6  7  8  9  ...
```

### XOR Pattern Benefits

XOR operations provide:
- Commutativity: Order independence
- Self-inverse: Easy checksum removal
- Linear complexity: O(n) generation

## Testing and Validation

The integrity module includes comprehensive tests for:

- Checksum generation correctness
- Round-trip verification (attach → verify)
- Error detection sensitivity
- Performance under load
- Integration with other core modules

## Future Enhancements

- **Hierarchical Checksums**: Multi-level verification for complex structures
- **Adaptive Powers**: Dynamic selection of checksum attachment powers
- **Parallel Verification**: Concurrent processing for large datasets
- **Cryptographic Upgrades**: Enhanced security for sensitive applications

## Model Interface Compliance

This module follows the standard PrimeOS model pattern with lifecycle management:

1. **Initialize**: Set up prime registry and cache systems
2. **Process**: Handle checksum and verification operations
3. **Reset**: Clear caches and reset state
4. **Terminate**: Clean up resources

All operations return standardized `ModelResult` objects with success indicators, data payloads, and error information.

## Error Handling

Errors are automatically caught and returned in a standardized format:

```typescript
{
  success: false,
  error: "Error message",
  timestamp: 1620000000,
  source: "core-integrity"
}
