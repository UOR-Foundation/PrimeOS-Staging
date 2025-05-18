# PrimeOS Template System

This template system provides a standardized way to create new modules within the PrimeOS ecosystem. It ensures consistency across all components and simplifies the development process.

## Concept

The template system follows a modular pattern where each directory implements a specific feature with a consistent structure. This approach enables:

1. **Uniformity**: All modules share the same structure
2. **Discoverability**: Developers can quickly understand any module
3. **Maintainability**: Separation of concerns is enforced by design
4. **Testability**: Each module comes with built-in test infrastructure

## Standard Module Structure

Every module in PrimeOS follows this standard structure:

```
module-name/
├── README.md         # Documentation specific to this module
├── package.json      # Module-specific dependencies and scripts
├── types.ts          # TypeScript interfaces and type definitions
├── index.ts          # Main implementation and public API
└── test.ts           # Test suite for the module
```

Additional files may be added as needed, but these five files are mandatory for every module.

## Usage

To create a new module using this template, use the provided npm script:

```bash
npm run create-module -- --name=your-module-name --path=path/to/parent/directory
```

This will:
1. Create a new directory with the specified name
2. Copy the template files into the new directory
3. Update the placeholder values with the appropriate module information
4. Install the module in the PrimeOS dependency tree

## Implementation Details

The template system is implemented as a set of template files that are used by the module creation script. The process works as follows:

1. The script reads the template files from this directory
2. It replaces placeholders with the actual module information
3. It writes the modified files to the new module directory
4. It updates package.json dependencies to include the new module

## Module Guidelines

When implementing a module:

1. **Single Responsibility Principle**: Each module should do one thing well
2. **Interface-First Design**: Define the interfaces before implementing functionality
3. **Documentation-Driven Development**: Document the feature before implementing it
4. **Test-Driven Development**: Write tests along with the implementation
5. **File Size Limit**: If index.ts exceeds 500 lines, split it into multiple modules

## Module Composition

Larger features can be composed of multiple sub-modules, each following the same template pattern. For example:

```
feature/
├── README.md
├── package.json
├── types.ts
├── index.ts
├── test.ts
├── sub-feature-1/
│   ├── README.md
│   ├── package.json
│   ├── types.ts
│   ├── index.ts
│   └── test.ts
└── sub-feature-2/
    ├── README.md
    ├── package.json
    ├── types.ts
    ├── index.ts
    └── test.ts
```

This approach allows for complex features while maintaining modularity and clarity.
