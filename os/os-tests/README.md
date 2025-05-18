# PrimeOS Testing Framework

A standardized testing framework for PrimeOS modules that integrates with the core model system.

## Overview

The PrimeOS Testing Framework provides a consistent way to test modules across the entire PrimeOS ecosystem. It defines a standard interface for testable modules and provides tools for running tests and generating reports.

Key features:
- Standardized test interface for all modules
- Automatic test discovery
- Detailed test reporting
- Supports filtering by tags or module names
- Multiple output formats (console, JSON, HTML)
- Seamless integration with the PrimeOS model system

## Usage

### Running Tests

The testing framework offers several ways to run tests:

```bash
# Run all tests across all modules
npm run test:all

# Run tests for specific modules
npm run test:module -- --modules=module1,module2

# Run tests with specific tags
npm run test:tags -- --tags=core,performance

# Generate HTML report
npm run test:report
```

### Command Line Options

| Option | Description |
|--------|-------------|
| `--modules=mod1,mod2` | Filter tests to specific modules |
| `--tags=tag1,tag2` | Filter tests by tags |
| `--verbose=true` | Enable verbose logging |
| `--failFast=true` | Stop testing after first failure |
| `--reportFormat=format` | Output format: console, json, html |
| `--reportPath=path` | Path to save the report file |

### Making Your Module Testable

To make your module testable, implement the `TestableInterface`:

```typescript
import { TestableInterface, TestResult, TestResults, TestMetadata, TestResultStatus } from '../os/os-tests';

export class YourModule implements TestableInterface {
  /**
   * Validate that the module meets base requirements
   */
  validateBase(): TestResult {
    return {
      id: 'base-validation',
      status: TestResultStatus.Passed, // or Failed, Error, etc.
      duration: 0,
      timestamp: Date.now(),
      source: 'your-module'
    };
  }
  
  /**
   * Run module-specific tests
   */
  async runTests(): Promise<TestResults> {
    const results: TestResults = {};
    
    // Example test
    results.test1 = {
      id: 'test1',
      status: TestResultStatus.Passed,
      duration: 10,
      timestamp: Date.now(),
      source: 'your-module'
    };
    
    // More tests...
    
    return results;
  }
  
  /**
   * Provide metadata about the module's tests
   */
  getTestMetadata(): TestMetadata {
    return {
      moduleName: 'your-module',
      version: '1.0.0',
      testCount: 5,  // Number of tests implemented
      tags: ['core', 'performance']  // Test categories
    };
  }
}
```

### Integration with the Model System

If your module extends `BaseModel`, you can use the `TestableModelMixin` helper to simplify integration:

```typescript
import { BaseModel } from '../os/model';
import { TestableInterface, modelResultToTestResult } from '../os/os-tests';

export class YourModule extends BaseModel implements TestableInterface {
  // ...your model implementation...
  
  validateBase(): TestResult {
    // Basic validation logic
    const timestamp = Date.now();
    
    try {
      // Validate the module
      // ...
      
      return {
        id: 'base-validation',
        status: TestResultStatus.Passed,
        duration: 0,
        timestamp,
        source: this.options?.name || 'unnamed-module'
      };
    } catch (error) {
      return {
        id: 'base-validation',
        status: TestResultStatus.Error,
        error: error instanceof Error ? error.message : String(error),
        duration: 0,
        timestamp,
        source: this.options?.name || 'unnamed-module'
      };
    }
  }
  
  async runTests(): Promise<TestResults> {
    const results: TestResults = {};
    const source = this.options?.name || 'unnamed-module';
    
    // Test initialization
    try {
      const initResult = await this.initialize();
      results.initialization = modelResultToTestResult(initResult, 'initialization', source);
      
      // Only continue if initialization passed
      if (initResult.success) {
        // Test processing logic
        const processResult = await this.process('test-input');
        results.processing = modelResultToTestResult(processResult, 'processing', source);
        
        // Test reset
        const resetResult = await this.reset();
        results.reset = modelResultToTestResult(resetResult, 'reset', source);
        
        // Terminate
        await this.terminate();
      }
    } catch (error) {
      results.unexpected = {
        id: 'unexpected-error',
        status: TestResultStatus.Error,
        error: error instanceof Error ? error.message : String(error),
        duration: 0,
        timestamp: Date.now(),
        source
      };
    }
    
    return results;
  }
  
  getTestMetadata(): TestMetadata {
    return {
      moduleName: this.options?.name || 'unnamed-module',
      version: this.options?.version || '0.1.0',
      testCount: 3, // Number of tests implemented
      tags: ['model'] // Test categories
    };
  }
}
```

## Test Results Format

The test framework uses a standardized format for test results:

```typescript
interface TestResult {
  id: string;            // Unique test identifier
  status: TestResultStatus; // Pass, fail, skip, etc.
  data?: any;            // Test result data
  error?: string;        // Error information if failed
  duration: number;      // Execution time in ms
  timestamp: number;     // When the test ran
  source: string;        // Module that produced the result
  traces?: any[];        // Optional execution traces
}

enum TestResultStatus {
  Passed = 'passed',
  Failed = 'failed', 
  Skipped = 'skipped',
  Timeout = 'timeout',
  Error = 'error'
}
```

## Programmatic API

You can also use the framework programmatically:

```typescript
import { createTestFramework } from '../os/os-tests';

async function runTests() {
  // Create framework instance
  const framework = createTestFramework({
    name: 'custom-tests',
    verbose: true,
    failFast: false
  });
  
  // Initialize
  await framework.initialize();
  
  // Register modules
  framework.register(module1);
  framework.register(module2);
  
  // Run tests
  const results = await framework.runAll();
  
  // Generate report
  const reportPath = await framework.generateReport(results);
  
  // Clean up
  await framework.terminate();
}
```

## Extending the Framework

The testing framework is designed to be extensible. You can add new report formats, test discovery mechanisms, or custom test runners by extending the core classes.
