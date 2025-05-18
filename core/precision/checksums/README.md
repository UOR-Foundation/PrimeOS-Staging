# Checksums Package
==================

The checksums package provides integrity verification mechanisms through prime-based checksums, implementing the second axiom of the UOR kernel: "Integrity Through Structure."

## Purpose

This package implements a checksum system with the following capabilities:

- Calculation of checksums from prime factors
- Attachment of checksums to raw values
- Extraction and verification of checksums
- Batch checksum calculation for multiple values
- Running XOR hash maintenance for incremental verification

Checksums are particularly important for ensuring data integrity throughout the PrimeOS system, providing a built-in mechanism for detecting data corruption or manipulation.

## Features

- **Self-Verification**: Data carries its own validation mechanism
- **XOR-Based Checksums**: Efficient computation based on XOR patterns
- **Caching**: Optional caching for improved performance
- **Batch Operations**: Process multiple values efficiently
- **Incremental Hashing**: Support for processing data streams
- **Stateless Operation**: Core functions don't require maintained state

## Core Operations

### Checksum Calculation

```typescript
// Calculate a checksum from prime factors
const checksum = calculateChecksum(factors, primeRegistry);
```

### Checksum Attachment

```typescript
// Attach a checksum to a raw value with its factors
const checksummed = attachChecksum(rawValue, factors, primeRegistry);
```

### Checksum Extraction and Verification

```typescript
// Extract and verify a checksummed value
const { coreFactors, checksum } = extractFactorsAndChecksum(checksummedValue, primeRegistry);
```

### Batch Checksum Calculation

```typescript
// Calculate a single checksum for multiple values
const batchChecksum = calculateBatchChecksum(values, primeRegistry);
```

## Usage Examples

```typescript
import { 
  calculateChecksum, 
  attachChecksum, 
  extractFactorsAndChecksum,
  createChecksums 
} from '@primeos/core/precision/checksums';
import { createPrimeRegistry } from '@primeos/core/prime';

// Create a prime registry
const primeRegistry = createPrimeRegistry();

// Example 1: Calculate a checksum for a factorized number
const factorsOf42 = primeRegistry.factor(42n);
const checksum = calculateChecksum(factorsOf42, primeRegistry);

// Example 2: Attach a checksum to a value
const checksummed = attachChecksum(42n, factorsOf42, primeRegistry);

// Example 3: Extract and verify a checksummed value
const { coreFactors, checksum: extractedChecksum } = extractFactorsAndChecksum(checksummed, primeRegistry);

// Example 4: Create a custom checksum implementation with different options
const customChecksums = createChecksums({ 
  checksumPower: 8,
  debug: true
});

// Use the custom implementation
const customChecksummed = customChecksums.attachChecksum(42n, factorsOf42, primeRegistry);
```

## Integration with Other Modules

This module integrates with:

- **Prime Registry**: Provides the prime factorization and prime lookup
- **Modular Arithmetic**: Used for checksum calculation
- **Verification**: Builds upon checksums for high-level verification
- **BigInt**: Depends on arbitrary precision operations

## Mathematical Background

The checksum calculation is based on the following principles:

1. Every value is represented as a product of prime factors
2. Checksums are derived from the XOR pattern of prime indices
3. The checksum itself is a prime raised to a specific power (default: 6)
4. When extracting a checksum, the prime with the highest exponent ≥ checksumPower is used

This approach ensures that:
- Any change to a value will invalidate its checksum
- The checksum is efficiently calculable
- The checksum itself uses minimal additional space

## Performance Considerations

Checksumming performance depends on several factors:

- **Prime Factorization**: The most computationally intensive operation
- **Caching**: Enabled by default, significantly improves performance for repeated operations
- **Batch Processing**: More efficient for multiple values
- **Checksum Power**: Higher powers provide more security but take more space

For very large values, the prime factorization can become a bottleneck. In these cases, consider:
- Using the accelerated prime registry
- Employing batch operations where possible
- Utilizing the incremental XOR hash for streaming operations
