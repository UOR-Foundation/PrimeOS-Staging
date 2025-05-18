# Getting Started with PrimeOS Development

This guide will help you get started with developing PrimeOS components.

## Prerequisites

- Node.js (v16+)
- TypeScript (v4.5+)
- npm or yarn

## Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd PrimeOS
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the project:
   ```
   npm run build
   ```

## Creating a New Module

The easiest way to create a new module is to use the built-in template system:

```bash
# Basic usage
npm run create-module -- --name=your-module-name --path=path/to/parent/directory

# Example: Create a prime module in the core directory
npm run create-module -- --name=prime --path=core
```

This will:
1. Create the module directory with all necessary files
2. Set up proper type definitions
3. Create a boilerplate implementation
4. Add testing infrastructure

## Module Structure

Each module follows this structure:

```
module-name/
├── README.md         # Documentation
├── package.json      # Module-specific dependencies and scripts
├── types.ts          # TypeScript interfaces and type definitions
├── index.ts          # Main implementation and public API
└── test.ts           # Test suite for the module
```

## Development Workflow

1. **Create a module**: Use the template system to create your module
2. **Define interfaces**: Start by defining your interfaces in types.ts
3. **Implement functionality**: Implement your module in index.ts
4. **Write tests**: Add tests in test.ts to verify functionality
5. **Document features**: Update README.md with module documentation

## Testing

Run tests for all modules:

```bash
npm test
```

Test a specific module:

```bash
cd path/to/module
npm test
```

## Core Module Development

When developing core modules, remember these principles:

1. **Prime Foundation**: All representation derives from prime numbers
2. **Integrity System**: Data carries self-verification via checksums
3. **Unified Execution Model**: Data and operations share a common representation
4. **Stream Processing**: High-throughput streaming for efficient data handling
5. **Band Optimization**: Bit-size based optimization for prime operations

## Next Steps

1. Implement the `core/prime` module
2. Implement the `core/integrity` module
3. Implement the `core/encoding` module
4. Implement the `core/stream` module
5. Implement the `core/bands` module

See the `IMPLEMENTATION-PLAN.md` for the full development roadmap.

## Example: Creating and Using the Prime Module

```bash
# Create the module
npm run create-module -- --name=prime --path=core

# Implement the module following the prime foundation axiom
# (See modulus1 for implementation reference)

# Use the module in your code
import { createPrimeRegistry } from './core/prime';

const registry = createPrimeRegistry();
const primeNumber = registry.getPrime(10); // Get the 11th prime (31)
```

## Troubleshooting

- **Module not found**: Ensure the module is properly created with all required files
- **TypeScript errors**: Check interface definitions in types.ts
- **Test failures**: Run tests with '--verbose' flag for detailed output
