# PrimeOS: System Overview & Testing Infrastructure

## System Architecture

PrimeOS is a next-generation operating system based on the UOR (Universal Object Representation) kernel axioms, providing a foundation for high-throughput, content-agnostic processing using prime-based representation.

### Core Components

The system is organized into three main packages:

#### 1. Core Package
Contains the foundational axioms and abstractions:

- **Prime Foundation**: Mathematical primitives using prime numbers as the basis for all representation
- **Integrity System**: Self-verification mechanisms to ensure data correctness
- **Encoding System**: Unified representation of data and operations
- **Stream Processing**: High-throughput streaming primitives for efficient data processing
- **Band Optimization**: Bit-size based optimization for prime operations across different magnitude ranges

#### 2. Kernel Package
Extends the core abstractions with concrete implementations:

- **Media Operations**: Content-specific adapters for various media types
- **Execution Environment**: Runtime for executing operations
- **Transform Systems**: Domain transformations for different processing approaches

#### 3. OS Package
Provides high-level system capabilities:

- **I/O Subsystem**: Input/output management for external communication
- **Scheduler**: Operation scheduling and resource allocation
- **Application Interfaces**: Integration points for applications

### Module Organization

Each module in PrimeOS follows a standardized template:

```
module-name/
├── README.md         # Documentation specific to this module
├── package.json      # Module-specific dependencies and scripts
├── types.ts          # TypeScript interfaces and type definitions
├── index.ts          # Main implementation and public API
└── test.ts           # Test suite for the module
```

### Design Philosophy

PrimeOS is designed with the following principles:

- **Content-Agnostic**: Core operations work with any data type without specialization
- **High Throughput**: Optimized for performance across all bit size ranges
- **Axiom-Driven**: Built on mathematically rigorous axioms derived from UOR
- **Multi-Scale**: Efficient from small to astronomically large numbers

## Testing Infrastructure

A crucial part of PrimeOS is its testing framework, which enables isolated testing of modules while maintaining standardized interfaces across the system.

### Core Testing Components

The testing infrastructure includes:

1. **Model System**: Base model interface that all modules implement, providing a standardized lifecycle:
   - Initialization
   - Processing
   - State management
   - Termination

2. **Logging System**: Unified logging interface used across all modules

3. **Centralized Mocks**: Standardized mock implementations of core system components:
   - Located in `os/os-tests/mocks/`
   - Allow isolated testing of modules without dependencies on actual implementations

### Mock Usage Patterns

Modules can use the mocks in two ways:

1. **Jest Auto-mocking**: Modules can define local `__mocks__` directories:
   ```
   module-name/
   ├── __mocks__/
   │   ├── os-model-mock.ts
   │   └── os-logging-mock.ts
   ```

2. **Direct Import**: Modules can import the mocks directly from os-tests:
   ```typescript
   import { BaseModel } from '../../os/os-tests/mocks/model-mock';
   ```

### Integration with Module Template

The testing framework integrates with the module template system, ensuring that each module is testable in isolation while maintaining compatibility with the broader system.

## Modular Independence

A key feature of PrimeOS's architecture is that modules export their mocks through the central os/model and os-tests systems. This creates a dependency inversion where:

1. Modules define their testing interfaces centrally
2. Tests import these shared mocks
3. Modules can be tested in isolation
4. Modules importing other modules use the imported modules' exported mocks

This pattern ensures that:
- Changes to one module don't break tests of dependent modules
- Integration tests can verify compatibility across module boundaries
- The system remains flexible and maintainable as it grows
