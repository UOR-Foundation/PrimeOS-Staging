# Encoding Module Mocks

Mock implementations for the Encoding module, providing simplified but consistent behavior for testing purposes.

## Overview

This directory contains mock implementations that follow the same interface as the real Encoding module but use predictable, lightweight implementations suitable for testing.

## Files

- `index.ts` - Main mock implementation with all exported functions and classes
- `test.ts` - Tests for the mock implementations themselves
- `test-mock.ts` - Test utilities and helpers for working with encoding mocks
- `os-logging-mock.ts` - Re-exports from os/logging module mocks
- `os-model-mock.ts` - Re-exports from os/model module mocks
- `README.md` - This documentation file

## Mock Features

### MockEncodingImplementation

A simplified implementation of the EncodingImplementation that:

- Uses predictable prime-based chunk encoding with simple patterns
- Implements all the same methods as the real EncodingImplementation
- Provides consistent, predictable behavior for testing
- Tracks basic metrics (chunks encoded/decoded, programs executed, NTT operations)
- Supports all core operations: text encoding, program execution, NTT transforms, integrity verification

### MockChunkVM

A simplified virtual machine that:

- Uses simple stack operations for PUSH, ADD, PRINT
- Provides predictable execution results
- Handles error conditions consistently
- Tracks execution metrics

### MockSimpleNTT

A mock Number Theoretic Transform implementation that:

- Uses simple array reversal as "transform" for predictable testing
- Supports forward and inverse operations
- Provides round-trip verification
- Works with configurable modulus and primitive root

### Mock Utility Functions

All utility functions from the real encoding module are implemented with simplified versions:

- `generateChunkId()` - Generates predictable test IDs
- `reconstructFromFactors()` - Factor reconstruction
- `determineChunkType()` - Chunk type classification
- `validateChunkStructure()` - Structure validation
- `calculateChunkSize()` - Bit size calculation
- All mathematical utilities with mock implementations

## Usage

### In Jest Tests

The mocks are automatically used when Jest encounters imports from the encoding module:

```typescript
// This will automatically use the mock
import { createEncoding } from 'core/encoding';

describe('My Test', () => {
  test('should use mock encoding', async () => {
    const encoder = createEncoding();
    await encoder.initialize();
    
    const chunks = await encoder.encodeText('Hello');
    expect(chunks).toBeDefined();
    expect(Array.isArray(chunks)).toBe(true);
  });
});
```

### Manual Mock Usage

You can also manually import the mocks:

```typescript
import { 
  MockEncodingImplementation,
  createEncoding 
} from 'core/encoding/__mocks__';

const mockEncoder = new MockEncodingImplementation({
  enableNTT: true,
  chunkIdLength: 8
});
```

## Mock Behavior

### Text Encoding/Decoding

The mock provides predictable text encoding:

```typescript
// "ABC" -> [BigInt(1001), BigInt(1002), BigInt(1003)]
const chunks = await encoder.encodeText('ABC');
const decoded = await encoder.decodeText(chunks);
// decoded === 'ABC'
```

### Program Execution

Mock VM execution with predictable results:

```typescript
const program = [
  { opcode: StandardOpcodes.OP_PUSH, operand: 10 },
  { opcode: StandardOpcodes.OP_PUSH, operand: 20 },
  { opcode: StandardOpcodes.OP_ADD },
  { opcode: StandardOpcodes.OP_PRINT }
];

const chunks = await encoder.encodeProgram(program);
const output = await encoder.executeProgram(chunks);
// output === ['30']
```

### NTT Operations

Simple array reversal as transform:

```typescript
const data = [1, 2, 3, 4];
const forward = await encoder.applyNTT(data);     // [4, 3, 2, 1]
const inverse = await encoder.applyInverseNTT(forward); // [1, 2, 3, 4]
const verified = await encoder.verifyNTTRoundTrip(data); // true
```

## Configuration Options

The mock supports the same configuration options as the real module:

- `enableNTT` - Enable NTT operations (default: true)
- `nttModulus` - NTT prime modulus (default: 13n)
- `nttPrimitiveRoot` - Primitive root (default: 2n)
- `chunkIdLength` - Chunk ID length (default: 8)
- `enableSpectralTransforms` - Enable spectral operations (default: true)
- `primeRegistry` - Custom prime registry (uses mock if not provided)
- `integrityModule` - Custom integrity module (uses mock if not provided)

## Testing the Mocks

Run the mock tests to ensure they work correctly:

```bash
cd core/encoding/__mocks__
npm test
```

## Limitations

The mock implementations have some limitations compared to the real module:

1. **Simplified Encoding**: Uses basic patterns rather than complex UOR encoding
2. **Mock VM**: Simple stack operations without advanced features
3. **Basic NTT**: Array reversal instead of mathematical transforms
4. **Predictable IDs**: Chunk IDs are predictable for testing consistency
5. **Mock Metrics**: Performance metrics are simulated rather than measured
6. **No Persistence**: No caching or persistence between test runs

These limitations are intentional to keep the mocks fast and predictable for testing.

## Mock Data Patterns

### Chunk Encoding Patterns

The mock uses predictable patterns for different chunk types:

- **Data Chunks**: `1000 + position * 100 + value`
- **Operation Chunks**: `2000 + opcode * 100 + (operand || 0)`
- **Block Headers**: `7000 + blockLength`
- **NTT Headers**: `11000 + blockLength`

### Error Patterns

The mock reproduces the same error conditions as the real module:

- Invalid input validation
- VM stack underflow/overflow
- Chunk structure validation
- NTT operation errors

## Integration with PrimeOS Testing

The mocks integrate seamlessly with the PrimeOS testing framework:

- Follow the same ModelInterface pattern as real modules
- Support the same lifecycle methods (initialize, process, reset, terminate)
- Provide consistent state tracking and metrics
- Work with the standard PrimeOS error handling patterns

## Extending the Mocks

To add new mock functionality:

1. Add the method to `MockEncodingImplementation`
2. Implement a simple, predictable version
3. Add corresponding tests in `test.ts`
4. Add test utilities in `test-mock.ts` if needed
5. Update this README with the new functionality

## Best Practices

When using these mocks in tests:

1. **Use Simple Data**: Stick to basic text and simple programs when possible
2. **Test Edge Cases**: The mocks handle the same edge cases as the real module
3. **Check Mock State**: Use `getState()` to verify internal mock state
4. **Reset Between Tests**: Use `reset()` to ensure clean state
5. **Mock External Dependencies**: The mocks provide their own prime registry and integrity module mocks

## Troubleshooting

Common issues and solutions:

- **Chunk Decoding Issues**: Ensure you're using chunks created by the same mock instance
- **VM Execution**: Mock VM has same stack requirements as real VM
- **NTT Operations**: Mock NTT uses array reversal - results may differ from real transforms
- **State Issues**: Always reset mock state between tests to avoid interference
- **Type Issues**: Mock types should match real module types exactly

## Performance Considerations

The mocks are designed for speed and predictability:

- Simple arithmetic operations instead of complex prime math
- In-memory operations without external dependencies
- Predictable timing for consistent test results
- Minimal memory allocation for large test suites
