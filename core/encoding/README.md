# Encoding System - Unified Execution Model

Implementation of **Axiom 3**: Data and operations share a common prime-based representation using the Universal Object Representation (UOR) specification.

## Overview

The encoding system is the foundational component that unifies data and operations into a common prime-based representation. It implements chunk-based encoding where both data values and program instructions are represented using prime factorization patterns, enabling seamless processing of arbitrary content types through a unified execution model.

## Core Architecture

### Mathematical Foundation

The encoding system is built on prime number theory with specific exponent patterns:

```typescript
enum ChunkExponent {
  DATA_POSITION = 2,    // Position in data stream
  DATA_VALUE = 3,       // Actual data value  
  OPERATION = 4,        // Operation opcode
  OPERAND = 5,          // Operation parameter
  CHECKSUM = 6,         // Integrity checksum (always present)
  BLOCK_HEADER = 7      // Block framing header
}

enum StandardOpcodes {
  OP_PUSH = 2,     // prime[0] - Push value to stack
  OP_ADD = 3,      // prime[1] - Add top two stack values  
  OP_PRINT = 5,    // prime[2] - Print top stack value
  BLOCK_TAG = 7,   // prime[3] - Block container
  NTT_TAG = 11     // prime[4] - NTT spectral transform
}
```

### Chunk Types

The system recognizes four fundamental chunk types:

1. **DATA**: Represents data values with position encoding
2. **OPERATION**: Represents executable operations with opcodes
3. **BLOCK_HEADER**: Structural framing for grouped chunks
4. **NTT_HEADER**: Spectral transform domain markers

## Core Capabilities

### 1. Text Encoding/Decoding

**Purpose**: Convert text strings to prime-encoded chunks and back

```typescript
// Encoding Process
async encodeText(text: string): Promise<bigint[]>
// For each character:
// - Extract position and ASCII value
// - Create factors: [2^(pos+2), 3^(val+3), 5^(pos_high+1), 7^(val_high+1)]
// - Add integrity checksum as 6th power
// - Reconstruct as BigInt from prime factorization

// Decoding Process  
async decodeText(chunks: bigint[]): Promise<string>
// For each chunk:
// - Factor the BigInt
// - Extract position and value from exponent patterns
// - Sort by position and reconstruct string
```

**Implementation Requirements**:
- Handle Unicode characters up to 16-bit values
- Preserve character ordering through position encoding
- Validate chunk integrity during decoding
- Gracefully handle malformed chunks

### 2. Program Encoding/Execution

**Purpose**: Encode program operations as prime chunks and execute via virtual machine

```typescript
// Program Definition
interface ProgramOperation {
  opcode: StandardOpcodes;
  operand?: number;
}

// Encoding Process
async encodeProgram(operations: ProgramOperation[]): Promise<bigint[]>
// For each operation:
// - Encode opcode as prime^OPERATION_EXPONENT
// - Encode operand (if present) as 5^(OPERAND_EXPONENT + value)
// - Add integrity checksum
// - Return array of encoded chunks

// Execution Process
async executeProgram(chunks: bigint[]): Promise<string[]>
// Decode chunks and execute via ChunkVM:
// - Stack-based virtual machine
// - Support PUSH, ADD, PRINT operations
// - Return program output as string array
```

**VM Architecture**:
- Stack-based execution model
- Error handling for stack underflow/overflow
- Operation counting and performance metrics
- Support for extensible instruction set

### 3. Block Composition

**Purpose**: Hierarchical composition of chunks into structured blocks

```typescript
// Block Creation
async encodeBlock(chunks: bigint[]): Promise<bigint[]>
// - Create block header with chunk count
// - Prepend header to chunk array
// - Support nested block structures

// NTT Block Creation  
async encodeNTTBlock(chunks: bigint[]): Promise<bigint[]>
// - Create NTT-specific header
// - Mark block for spectral domain processing
// - Enable domain switching capabilities
```

**Block Types**:
- **Standard Blocks**: General chunk containers
- **NTT Blocks**: Spectral transform domains
- **Nested Blocks**: Hierarchical structures

### 4. Number Theoretic Transform (NTT)

**Purpose**: Spectral domain transformations for lossless domain switching

```typescript
// NTT Operations
async applyNTT(data: number[]): Promise<number[]>
async applyInverseNTT(data: number[]): Promise<number[]>
async verifyNTTRoundTrip(data: number[]): Promise<boolean>

// Configuration
interface NTTOptions {
  modulus: bigint;        // Prime modulus for transform
  primitiveRoot: bigint;  // Primitive root for calculations
}
```

**NTT Requirements**:
- Forward and inverse transforms
- Round-trip verification
- Integration with chunk encoding
- Support for configurable modulus and primitive root

### 5. Integrity Verification

**Purpose**: Built-in data verification through prime-pattern checksums

```typescript
// Verification Process
async verifyChunkIntegrity(chunk: bigint): Promise<boolean>
// - Extract checksum from 6th power factors
// - Recalculate expected checksum from core factors
// - Compare calculated vs. embedded checksum
// - Return verification result

// Batch Verification
async verifyBatch(chunks: bigint[]): Promise<boolean[]>
// - Process multiple chunks efficiently
// - Return per-chunk verification results
```

**Integrity Features**:
- Automatic checksum generation during encoding
- Verification during decoding operations
- Error detection and reporting
- Integration with core integrity module

## Implementation Architecture

### Core Classes

#### 1. EncodingImplementation
**Purpose**: Main module implementing the PrimeOS Model interface

**Key Methods**:
```typescript
class EncodingImplementation extends BaseModel {
  // Lifecycle management
  protected async onInitialize(): Promise<void>
  protected async onProcess<T, R>(input: T): Promise<R>
  protected async onReset(): Promise<void>
  protected async onTerminate(): Promise<void>
  
  // Core encoding operations
  async encodeText(text: string): Promise<bigint[]>
  async encodeProgram(operations: ProgramOperation[]): Promise<bigint[]>
  async encodeData(position: number, value: number): Promise<bigint>
  async encodeOperation(opcode: StandardOpcodes, operand?: number): Promise<bigint>
  
  // Core decoding operations
  async decodeChunk(chunk: bigint): Promise<DecodedChunk>
  async decodeText(chunks: bigint[]): Promise<string>
  
  // Execution and verification
  async executeProgram(chunks: bigint[]): Promise<string[]>
  async verifyChunkIntegrity(chunk: bigint): Promise<boolean>
}
```

#### 2. ChunkVM
**Purpose**: Virtual machine for executing chunk-encoded programs

**Key Methods**:
```typescript
class ChunkVM {
  // Execution environment
  private stack: number[]
  private output: string[]
  private operations: number
  
  // Core operations
  execute(chunks: DecodedChunk[]): string[]
  private executeOperation(data: ChunkData): void
  private executeData(data: ChunkData): void
  reset(): void
  getState(): VMState
}
```

**VM Operations**:
- **OP_PUSH**: Push operand to stack
- **OP_ADD**: Pop two values, push sum
- **OP_PRINT**: Pop value, add to output
- Error handling for invalid operations

#### 3. SimpleNTT
**Purpose**: Number Theoretic Transform implementation

**Key Methods**:
```typescript
class SimpleNTT {
  constructor(modulus: bigint, primitiveRoot: bigint)
  
  forward(data: number[]): number[]
  inverse(data: number[]): number[]
  verify(original: number[]): boolean
}
```

### Integration Points

#### Prime Foundation Integration
```typescript
// Use core prime registry for factorization
const registry = this.config.primeRegistry || this.mockRegistry;
const factors = registry.factor(chunk);
```

#### Integrity System Integration
```typescript
// Generate checksums via integrity module
if (this.config.integrityModule) {
  const checksum = await this.config.integrityModule.generateChecksum(factors);
  factors.push({ prime: checksum, exponent: ChunkExponent.CHECKSUM });
}
```

#### Stream Processing Integration
```typescript
// Support streaming operations for large datasets
async processChunkStream(stream: AsyncIterable<bigint>): Promise<ProcessedChunk[]>
```

## Configuration Options

```typescript
interface EncodingOptions extends ModelOptions {
  // Core dependencies
  primeRegistry?: PrimeRegistryInterface;      // Prime operations
  integrityModule?: IntegrityInterface;        // Checksum generation
  
  // NTT configuration
  enableNTT?: boolean;                         // Enable spectral transforms
  nttModulus?: bigint;                         // NTT prime modulus
  nttPrimitiveRoot?: bigint;                   // Primitive root for NTT
  
  // Chunk configuration
  chunkIdLength?: number;                      // Chunk ID string length
  enableSpectralTransforms?: boolean;          // Enable domain switching
}
```

## Performance Characteristics

### Encoding Performance
- **Text Encoding**: O(n) where n is string length
- **Program Encoding**: O(m) where m is operation count
- **Chunk Decoding**: O(log k) where k is chunk magnitude

### Memory Usage
- **Streaming Support**: Constant memory for unlimited input sizes
- **Chunk Caching**: Configurable cache sizes for performance
- **VM Execution**: Stack-based with bounded memory usage

### Throughput Optimization
- **Batch Operations**: Efficient processing of chunk arrays
- **Parallel Verification**: Concurrent integrity checking
- **Band Integration**: Automatic optimization via bands module

## Error Handling

### Error Types
```typescript
class EncodingError extends Error              // General encoding errors
class ChunkValidationError extends EncodingError  // Invalid chunk structure
class VMExecutionError extends EncodingError    // VM runtime errors
class NTTError extends EncodingError           // Spectral transform errors
```

### Error Recovery
- Graceful handling of malformed chunks
- VM error recovery with stack preservation
- Partial processing with error reporting
- Integrity failure detection and reporting

## Testing Requirements

### Unit Tests
- Encoding/decoding round-trip verification
- VM operation correctness
- NTT transform verification
- Error condition handling

### Integration Tests
- Prime registry integration
- Integrity module integration
- Performance benchmarking
- Memory usage validation

### Examples

#### Basic Text Processing
```typescript
const encoder = createEncoding();
await encoder.initialize();

// Encode text to chunks
const chunks = await encoder.encodeText("Hello");
console.log(chunks); // [BigInt array]

// Decode back to text
const text = await encoder.decodeText(chunks);
console.log(text); // "Hello"
```

#### Program Execution
```typescript
// Define a simple program
const program = [
  { opcode: StandardOpcodes.OP_PUSH, operand: 5 },
  { opcode: StandardOpcodes.OP_PUSH, operand: 3 },
  { opcode: StandardOpcodes.OP_ADD },
  { opcode: StandardOpcodes.OP_PRINT }
];

// Encode and execute
const chunks = await encoder.encodeProgram(program);
const output = await encoder.executeProgram(chunks);
console.log(output); // ["8"]
```

#### NTT Spectral Operations
```typescript
// Apply spectral transform
const data = [1, 2, 3, 4];
const transformed = await encoder.applyNTT(data);
const restored = await encoder.applyInverseNTT(transformed);
const verified = await encoder.verifyNTTRoundTrip(data);
console.log(verified); // true
```

## Future Extensions

### Planned Features
- **Advanced VM Instructions**: Extended instruction set
- **Parallel Execution**: Multi-threaded chunk processing
- **Compression**: Optimized chunk representation
- **Streaming NTT**: Large-scale spectral processing

### Integration Opportunities
- **Band Optimization**: Automatic strategy selection
- **Stream Processing**: High-throughput pipelines
- **Cryptographic Extensions**: Secure chunk encoding
- **Domain-Specific Languages**: Custom opcode sets

This encoding system provides the foundation for unified data and operation representation in PrimeOS, enabling content-agnostic processing through mathematically rigorous prime-based encoding.
