# PrimeOS

A next-generation operating system based on the UOR (Universal Object Representation) kernel axioms. PrimeOS provides a foundation for high-throughput, content-agnostic processing using prime-based representation.

## Project Structure

```
PrimeOS/
├── core/                  # Foundational axioms and abstract interfaces
│   ├── prime/             # Prime foundation (from modulus1)
│   ├── integrity/         # Integrity system (from modulus2)
│   ├── encoding/          # Unified execution model (from modulus3)
│   ├── stream/            # High-throughput streaming primitives
│   └── bands/             # Band-optimized operations (from modulus-bands)
│       ├── registry/      # Band registry and configuration
│       ├── optimizer/     # Band selection and optimization logic
│       ├── spectral/      # Spectral transformation components
│       └── crossover/     # Band transition handling
│
├── kernel/               # Implementation extending core abstractions
│   ├── media/            # Media-specific operations
│   ├── execution/        # Execution environment
│   └── transform/        # Domain transformations 
│
└── os/                   # High-level system capabilities
    ├── io/               # Input/output subsystem
    ├── scheduler/        # Operation scheduling
    └── apps/             # Application interfaces
```

## Core Package

The `core` package contains the foundational axioms and abstractions:

1. **Prime Foundation**: Mathematical primitives using prime numbers as the basis for all representation
2. **Integrity System**: Self-verification mechanisms to ensure data correctness
3. **Encoding System**: Unified representation of data and operations
4. **Stream Processing**: High-throughput streaming primitives for efficient data processing
5. **Band Optimization**: Bit-size based optimization for prime operations across different magnitude ranges

## Kernel Package

The `kernel` package extends the core abstractions with concrete implementations:

1. **Media Operations**: Content-specific adapters for various media types
2. **Execution Environment**: Runtime for executing operations
3. **Transform Systems**: Domain transformations for different processing approaches

## OS Package

The `os` package provides high-level system capabilities:

1. **I/O Subsystem**: Input/output management for external communication
2. **Scheduler**: Operation scheduling and resource allocation
3. **Application Interfaces**: Integration points for applications

## Design Philosophy

PrimeOS is designed with the following principles:

- **Content-Agnostic**: Core operations work with any data type without specialization
- **High Throughput**: Optimized for performance across all bit size ranges
- **Axiom-Driven**: Built on mathematically rigorous axioms derived from UOR
- **Multi-Scale**: Efficient from small to astronomically large numbers

## Module Template System

PrimeOS includes a standardized template system for creating new modules with consistent structure. Each module follows the same pattern:

```
module-name/
├── README.md         # Documentation specific to this module
├── package.json      # Module-specific dependencies and scripts
├── types.ts          # TypeScript interfaces and type definitions
├── index.ts          # Main implementation and public API
└── test.ts           # Test suite for the module
```

To create a new module:

```bash
# Basic usage
npm run create-module -- --name=your-module-name --path=path/to/parent/directory

# With description
npm run create-module -- --name=your-module-name --description="Your module description"

# Install as dependency in main package.json
npm run create-module -- --name=your-module-name --install=true

# Install and run npm install
npm run create-module -- --name=your-module-name --install=true --npm=true
```

This approach ensures consistency across the project and simplifies the development process. See the `template/README.md` file for more detailed documentation on the module template system.

## Current Status

This project is in the initial setup phase. The directory structure has been established, along with the module template system. Implementation will proceed with the core foundational components first.
