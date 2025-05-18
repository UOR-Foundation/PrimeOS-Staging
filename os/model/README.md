# PrimeOS Model System

The Model System is the core architecture pattern for all PrimeOS modules. It provides a standardized way to create modules with consistent lifecycle management, state tracking, error handling, and integrated logging.

## Features

- **Standardized Lifecycle**: All modules follow the same initialize/process/reset/terminate lifecycle
- **Unified State Management**: Consistent approach to tracking module state
- **Integrated Logging**: Built-in logging capabilities with multiple log levels
- **Error Handling**: Standardized error reporting and recovery
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Module Generation**: Dynamic code generation to create new modules

## Module Structure

Every module in PrimeOS follows this standard structure:

```
module-name/
├── README.md         # Documentation specific to this module
├── package.json      # Module-specific dependencies and scripts
├── types.ts          # TypeScript interfaces and type definitions
├── index.ts          # Main implementation and public API
└── test.ts           # Test suite for the module
```

## Creating New Modules

You can create new modules using the provided script:

```bash
npm run create-module -- --name=your-module-name --path=path/to/parent/directory
```

Options:
- `--name`: (Required) Module name in kebab-case
- `--path`: (Optional) Target directory, defaults to current directory
- `--description`: (Optional) Module description
- `--parent`: (Optional) Parent module name for dependencies
- `--install`: (Optional) Install module in main package.json
- `--npm`: (Optional) Run npm install after creation

## Using Modules

### Basic Usage

```typescript
import { createModule } from '@primeos/yourmodule';

// Create an instance
const module = createModule({
  debug: true,
  name: 'module-instance'
});

// Initialize
await module.initialize();

// Process data
const result = await module.process(inputData);

// Clean up
await module.terminate();
```

### One-Step Creation and Initialization

```typescript
import { createAndInitializeModule } from '@primeos/yourmodule';

// Create and initialize in one step
const module = await createAndInitializeModule({
  debug: true,
  name: 'module-instance'
});

// Process data
const result = await module.process(inputData);

// Clean up
await module.terminate();
```

## Module Lifecycle

1. **Uninitialized**: Initial state when created
2. **Initializing**: During setup and resource allocation
3. **Ready**: Available for processing
4. **Processing**: Actively handling an operation
5. **Error**: Encountered an issue
6. **Terminating**: During resource cleanup
7. **Terminated**: Final state after cleanup

## Extending the Model System

To extend or customize the model system:

1. Extend the `BaseModel` class
2. Override the lifecycle hooks as needed
3. Add module-specific methods and properties

Example:

```typescript
export class CustomModel extends BaseModel {
  protected async onInitialize(): Promise<void> {
    // Custom initialization logic
    this.state.custom = {
      // Module-specific state
    };
  }
  
  protected async onProcess<T = unknown, R = unknown>(input: T): Promise<R> {
    // Custom processing logic
    return processedResult as R;
  }
  
  protected async onReset(): Promise<void> {
    // Custom reset logic
  }
  
  protected async onTerminate(): Promise<void> {
    // Custom cleanup logic
  }
  
  // Add module-specific methods
  public async customMethod(): Promise<ModelResult> {
    // Implementation
  }
}
```

## Programmatic Module Creation

For advanced use cases, you can also create modules programmatically:

```typescript
import { createModule } from '../os/model/create-module';

const result = await createModule({
  name: 'my-module',
  path: './modules',
  description: 'Custom module for PrimeOS',
  install: true
});

if (result.success) {
  console.log(result.data); // Module created successfully
} else {
  console.error(result.error); // Error message
}
```

## Testing Framework Integration

The Model module integrates with the PrimeOS Testing Framework (`os-tests`) to provide standardized testing capabilities for all modules.

### Key Features

- **Test Adapters**: Convert any model into a testable module
- **Comprehensive Testing**: Test lifecycle, processing, error handling
- **Custom Test Cases**: Define specific test cases for your modules
- **Unified Reporting**: Standardized test results and reporting

### Usage Example

```typescript
import { createModel, createModelTestAdapter } from '@primeos/os-model';
import { createTestFramework } from '@primeos/os-tests';

// Create and initialize a model
const model = createModel({ name: 'test-model' });
await model.initialize();

// Create a test adapter for the model with custom test cases
const testAdapter = createModelTestAdapter(model, {
  tags: ['unit-test', 'model'],
  testCases: [
    { name: 'string-process', input: 'Hello, PrimeOS!' },
    { name: 'object-process', input: { key: 'value' } },
    { name: 'expected-match', input: 'data', expectedResult: 'data' }
  ]
});

// Create and initialize test framework
const testFramework = createTestFramework({
  debug: true,
  verbose: true
});
await testFramework.initialize();

// Register the model with the test framework
testFramework.register(testAdapter);

// Run all tests
const results = await testFramework.runAll();

// Cleanup
await testFramework.terminate();
await model.terminate();
```

### Running the Demo

A demo file is provided to showcase the integration between the model module and the testing framework:

```bash
# In the PrimeOS root directory
npx ts-node os/model/run-model-tests.ts
```

This demo creates a model, registers it with the testing framework, runs a series of tests, and displays the results.

### Extending with Custom Test Cases

You can define custom test cases specific to your model:

```typescript
const testAdapter = createModelTestAdapter(model, {
  testCases: [
    // Test basic functionality
    { name: 'basic-process', input: 'basic' },
    
    // Test with specific input/output expectations
    { 
      name: 'transform-case',
      input: 'lowercase', 
      expectedResult: 'LOWERCASE' // Will fail if result doesn't match
    },
    
    // Test with complex data structures
    { 
      name: 'process-object', 
      input: { nested: { data: true } } 
    }
  ]
});
```

The testing framework helps ensure that all PrimeOS modules maintain a consistent quality level and adhere to the design principles of the system.
