# Verification Validation Module

This module provides validation capabilities for the verification system, ensuring that inputs and configurations meet the required specifications before processing.

## Overview

The validation module implements a comprehensive validation system for verification operations, including:

- Input validation for bigint values
- Prime registry validation (ensuring required methods are present)
- Configuration validation for retry options
- Configuration validation for verification options

## Components

### Types

- `ValidationResult`: Represents the result of a validation operation
- `Validator<T>`: Generic interface for validators
- `ValidationFactory`: Factory for creating validators

### Validators

- `BigIntValidator`: Validates bigint values
- `PrimeRegistryValidator`: Validates prime registry interfaces
  - Checks for required methods from `BasePrimeRegistry`: `getPrime`, `getIndex`, `factor`
  - Validates optional methods from `PrimeRegistryForVerification` if they are provided: `getPrimeFactors`, `isPrime`
- `RetryOptionsValidator`: Validates retry configuration options
- `VerificationOptionsValidator`: Validates verification configuration options

## Usage

### Creating Validators

```typescript
import { createValidationFactory } from '../validation';

// Create a validation factory
const validationFactory = createValidationFactory(logger);

// Create specific validators
const bigIntValidator = validationFactory.createBigIntValidator();
const primeRegistryValidator = validationFactory.createPrimeRegistryValidator();
const retryOptionsValidator = validationFactory.createRetryOptionsValidator();
const verificationOptionsValidator = validationFactory.createVerificationOptionsValidator();
```

### Validating Values

```typescript
// Validate a bigint value
const bigIntResult = bigIntValidator.validate(123n);
if (!bigIntResult.valid) {
  console.error(bigIntResult.error);
}

// Validate and throw if invalid
try {
  bigIntValidator.validateAndThrow(123n);
} catch (error) {
  console.error('Validation failed:', error);
}
```

### Using Standalone Validation Functions

```typescript
import { 
  validateBigInt, 
  validatePrimeRegistry, 
  validateRetryOptions, 
  validateVerificationOptions 
} from '../validation';

// Validate a bigint value
const bigIntResult = validateBigInt(123n);

// Validate a prime registry
const primeRegistryResult = validatePrimeRegistry(primeRegistry);

// Validate retry options
const retryOptionsResult = validateRetryOptions({
  maxRetries: 3,
  initialDelay: 100,
  maxDelay: 1000,
  backoffFactor: 2
});

// Validate verification options
const verificationOptionsResult = validateVerificationOptions({
  debug: true,
  failFast: false,
  cacheSize: 1000,
  enableCache: true
});
```

### Prime Registry Validation Example

```typescript
import { validatePrimeRegistry } from '../validation';
import { BasePrimeRegistry, PrimeRegistryForVerification } from '../types';

// Example of a minimal valid prime registry (implements BasePrimeRegistry)
const minimalRegistry: BasePrimeRegistry = {
  getPrime: (idx: number) => BigInt(idx * 2 + 1),
  getIndex: (prime: bigint) => Number((prime - 1n) / 2n),
  factor: (x: bigint) => [{ prime: 2n, exponent: 1 }]
};

// Validate the minimal registry
const minimalResult = validatePrimeRegistry(minimalRegistry);
console.log('Minimal registry valid:', minimalResult.valid); // true

// Example of a full-featured prime registry (implements PrimeRegistryForVerification)
const fullRegistry: PrimeRegistryForVerification = {
  ...minimalRegistry,
  getPrimeFactors: (x: bigint) => [{ prime: 2n, exponent: 1 }],
  isPrime: (x: bigint) => x % 2n !== 0n
};

// Validate the full-featured registry
const fullResult = validatePrimeRegistry(fullRegistry);
console.log('Full registry valid:', fullResult.valid); // true

// Example of an invalid registry with incorrect method types
const invalidRegistry = {
  getPrime: "not a function",
  getIndex: (prime: bigint) => Number((prime - 1n) / 2n),
  factor: (x: bigint) => [{ prime: 2n, exponent: 1 }]
};

// Validate the invalid registry
const invalidResult = validatePrimeRegistry(invalidRegistry as any);
console.log('Invalid registry valid:', invalidResult.valid); // false
console.log('Error message:', invalidResult.error); // "Prime registry must have getPrime method"
```

## Integration with Verification System

The validation module is integrated with the verification system to ensure that all inputs and configurations are valid before processing. This helps prevent runtime errors and improves the reliability of the verification system.
