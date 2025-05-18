# Verification Package
===================

The verification package provides high-level data integrity verification capabilities, building on the checksums package to implement complete integrity verification workflows.

## Purpose

This package implements verification mechanisms with the following capabilities:

- Single value verification
- Batch verification of multiple values
- Verification status tracking
- Highly optimized verification for performance-critical applications
- Caching for improved verification performance

Verification is a critical aspect of the PrimeOS system, ensuring that data maintains its integrity throughout processing and storage.

## Features

- **Comprehensive Verification**: Complete integrity checking of values
- **Caching**: Smart caching of verification results for better performance
- **Fail-Fast Mode**: Option to stop processing after first failure
- **Context Tracking**: Maintains history of verifications and overall status
- **Optimized Verifiers**: Creates specialized, efficient verification functions

## Core Operations

### Single Value Verification

```typescript
// Verify a single value
const result = verifyValue(checksummedValue, primeRegistry);
if (result.valid) {
  console.log('Value is valid');
} else {
  console.error('Value is invalid', result.error);
}
```

### Batch Verification

```typescript
// Verify multiple values
const context = createVerification();
const results = context.verifyValues(checksummedValues, primeRegistry);

// Get overall status
const status = context.getStatus();
if (status === VerificationStatus.VALID) {
  console.log('All values are valid');
}
```

### Optimized Verification

```typescript
// Create an optimized verification function for performance-critical code
const isValid = createOptimizedVerifier(primeRegistry);

// Check many values efficiently
if (isValid(checksummedValue1) && isValid(checksummedValue2)) {
  // Both values are valid
}
```

## Usage Examples

```typescript
import { 
  verifyValue, 
  createVerification, 
  createOptimizedVerifier,
  VerificationStatus
} from '@primeos/core/precision/verification';
import { createPrimeRegistry } from '@primeos/core/prime';

// Create a prime registry for verification
const primeRegistry = createPrimeRegistry();

// Example 1: Simple verification of a single value
const result = verifyValue(checksummedValue, primeRegistry);
console.log(`Value is ${result.valid ? 'valid' : 'invalid'}`);
if (!result.valid && result.error) {
  console.error(`Error: ${result.error.message}`);
}

// Example 2: Batch verification with context tracking
const verification = createVerification({ failFast: true });
verification.verifyValues([value1, value2, value3], primeRegistry);

const status = verification.getStatus();
console.log(`Verification status: ${status}`);

if (status === VerificationStatus.INVALID) {
  // Handle invalid data
  const results = verification.getResults();
  const invalidResults = results.filter(r => !r.valid);
  console.error(`Found ${invalidResults.length} invalid values`);
}

// Example 3: High-performance verification
const isValid = createOptimizedVerifier(primeRegistry);

// This is very efficient for checking many values in a loop
for (const value of largeDataset) {
  if (!isValid(value)) {
    console.error(`Invalid value detected: ${value}`);
    break;
  }
}
```

## Integration with Other Modules

This module integrates with:

- **Prime Registry**: Provides the prime factorization and prime lookup
- **Checksums**: Uses checksum extraction and calculation
- **Modular Arithmetic**: Indirectly depends on modular operations via checksums

## Performance Considerations

Verification performance depends on several factors:

- **Caching**: Enabled by default, significantly improves performance for repeated verifications
- **Prime Factorization**: The most computationally intensive operation, but only needed once per value
- **Batch Size**: The optimal batch size depends on the application

Performance can be optimized through:

- Using the optimized verifier for repeated checks
- Setting an appropriate cache size
- Using fail-fast mode when appropriate
- Using an accelerated prime registry implementation

For extremely performance-critical applications, the optimized verifier provides the best balance of correctness and speed, avoiding repeated factorization of the same values.
