#!/usr/bin/env node

/**
 * Model Module Generator
 * ======================
 * 
 * This module provides functionality to dynamically generate new modules
 * based on the PrimeOS model pattern, ensuring consistent structure and behavior.
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { ModelResult } from './types';

/**
 * Options for creating a new module
 */
export interface CreateModuleOptions {
  /**
   * Module name in kebab-case (required)
   */
  name: string;
  
  /**
   * Target directory for the new module (optional, defaults to current directory)
   */
  path?: string;
  
  /**
   * Module description (optional)
   */
  description?: string;
  
  /**
   * Parent module name for dependencies (optional, defaults to 'primeos')
   */
  parent?: string;
  
  /**
   * Whether to install the module in the main package.json (optional)
   */
  install?: boolean;
  
  /**
   * Whether to run npm install after creating module (optional)
   */
  npm?: boolean;
}

/**
 * Create a new module with the PrimeOS model pattern
 */
export async function createModule(options: CreateModuleOptions): Promise<ModelResult<string>> {
  try {
    const startTime = Date.now();
    
    // Validate required options
    if (!options.name) {
      return {
        success: false,
        error: 'Module name is required',
        timestamp: Date.now(),
        source: 'model:createModule'
      };
    }

    // Setup variables
    const moduleName = options.name;
    const moduleNameCamel = moduleName.replace(/-([a-z])/g, g => g[1].toUpperCase());
    const moduleNamePascal = moduleNameCamel.charAt(0).toUpperCase() + moduleNameCamel.slice(1);
    const moduleNameUnderline = '='.repeat(moduleName.length);
    const modulePrefix = moduleNamePascal;
    const moduleDescription = options.description || `${moduleNamePascal} implementation for PrimeOS`;
    const parentModule = options.parent || 'primeos';
    
    // Target directory
    const targetDir = path.join(process.cwd(), options.path || '.', moduleName);

    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`Created directory: ${targetDir}`);
    } else {
      console.log(`Directory already exists: ${targetDir}`);
    }

    // Create files
    await Promise.all([
      generateReadme(targetDir, { moduleName, moduleDescription, moduleNameUnderline, modulePrefix }),
      generatePackageJson(targetDir, { moduleName, moduleDescription, parentModule }),
      generateTypesTs(targetDir, { moduleName, moduleNameUnderline, modulePrefix }),
      generateIndexTs(targetDir, { moduleName, moduleNameUnderline, moduleDescription, modulePrefix }),
      generateTestTs(targetDir, { moduleName, moduleNameUnderline, modulePrefix })
    ]);

    // Update main package.json dependencies if requested
    if (options.install === true) {
      await updateMainPackageJson(process.cwd(), targetDir, moduleName);
      
      // Run npm install if requested
      if (options.npm === true) {
        await runNpmInstall(process.cwd());
      }
    }

    return {
      success: true,
      data: `Module "${moduleName}" created successfully at ${targetDir}`,
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      source: 'model:createModule'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: Date.now(),
      source: 'model:createModule'
    };
  }
}

/**
 * Generate README.md file
 */
async function generateReadme(targetDir: string, data: any): Promise<void> {
  const content = `# ${data.moduleName}

${data.moduleDescription}

## Overview

This module follows the standard PrimeOS module pattern, implementing the PrimeOS Model interface for consistent lifecycle management, state tracking, error handling, and integrated logging.

## Features

- Fully integrates with the PrimeOS model system
- Built-in logging capabilities
- Standard lifecycle management (initialize, process, reset, terminate)
- Automatic error handling and result formatting

## Installation

\`\`\`bash
npm install ${data.moduleName}
\`\`\`

## Usage

\`\`\`typescript
import { create${data.modulePrefix} } from '${data.moduleName}';

// Create an instance
const instance = create${data.modulePrefix}({
  debug: true,
  name: '${data.moduleName}-instance',
  version: '1.0.0'
});

// Initialize the module
await instance.initialize();

// Process data
const result = await instance.process('example-input');
console.log(result);

// Clean up when done
await instance.terminate();
\`\`\`

## API

### \`create${data.modulePrefix}(options)\`

Creates a new ${data.moduleName} instance with the specified options.

Parameters:
- \`options\` - Optional configuration options

Returns:
- A ${data.moduleName} instance implementing ${data.modulePrefix}Interface

### ${data.modulePrefix}Interface

The main interface implemented by ${data.moduleName}. Extends the ModelInterface.

Methods:
- \`initialize()\` - Initialize the module (required before processing)
- \`process<T, R>(input: T)\` - Process the input data and return a result
- \`reset()\` - Reset the module to its initial state
- \`terminate()\` - Release resources and shut down the module
- \`getState()\` - Get the current module state
- \`getLogger()\` - Get the module's logger instance

### Options

Configuration options for ${data.moduleName}:

\`\`\`typescript
interface ${data.modulePrefix}Options {
  // Enable debug mode
  debug?: boolean;
  
  // Module name
  name?: string;
  
  // Module version
  version?: string;
  
  // Module-specific options
  // ...
}
\`\`\`

### Result Format

All operations return a standardized result format:

\`\`\`typescript
{
  success: true,          // Success indicator
  data: { ... },          // Operation result data
  timestamp: 1620000000,  // Operation timestamp
  source: 'module-name'   // Source module
}
\`\`\`

## Lifecycle Management

The module follows a defined lifecycle:

1. **Uninitialized**: Initial state when created
2. **Initializing**: During setup and resource allocation
3. **Ready**: Available for processing
4. **Processing**: Actively handling an operation
5. **Error**: Encountered an issue
6. **Terminating**: During resource cleanup
7. **Terminated**: Final state after cleanup

Always follow this sequence:
1. Create the module with \`create${data.modulePrefix}\`
2. Initialize with \`initialize()\`
3. Process data with \`process()\`
4. Clean up with \`terminate()\`

## Custom Implementation

You can extend the functionality by adding module-specific methods to the implementation.

## Error Handling

Errors are automatically caught and returned in a standardized format:

\`\`\`typescript
{
  success: false,
  error: "Error message",
  timestamp: 1620000000,
  source: "module-name"
}
\`\`\``;

  fs.writeFileSync(path.join(targetDir, 'README.md'), content);
  console.log(`Created README.md`);
}

/**
 * Generate package.json file
 */
async function generatePackageJson(targetDir: string, data: any): Promise<void> {
  const content = {
    "name": data.moduleName,
    "version": "0.1.0",
    "description": data.moduleDescription,
    "main": "index.js",
    "types": "index.d.ts",
    "scripts": {
      "test": "jest",
      "build": "tsc",
      "lint": "eslint . --ext .ts",
      "format": "prettier --write \"**/*.ts\""
    },
    "keywords": [
      "primeos",
      data.moduleName
    ],
    "author": "",
    "license": "MIT",
    "dependencies": {
      [data.parentModule]: "^0.1.0"
    },
    "devDependencies": {
      "@types/jest": "^29.5.3",
      "jest": "^29.6.2",
      "ts-jest": "^29.1.1",
      "typescript": "^5.1.6"
    },
    "jest": {
      "preset": "ts-jest",
      "testEnvironment": "node"
    }
  };

  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(content, null, 2));
  console.log(`Created package.json`);
}

/**
 * Generate types.ts file
 */
async function generateTypesTs(targetDir: string, data: any): Promise<void> {
  const content = `/**
 * ${data.moduleName} Types
 * ${data.moduleNameUnderline}
 * 
 * Type definitions for the ${data.moduleName} module.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState,
  ModelLifecycleState
} from '../os/model/types';
import { LoggingInterface } from '../os/logging';

/**
 * Configuration options for ${data.moduleName}
 */
export interface ${data.modulePrefix}Options extends ModelOptions {
  /**
   * Module-specific options go here
   */
  // Add module-specific options here
}

/**
 * Core interface for ${data.moduleName} functionality
 */
export interface ${data.modulePrefix}Interface extends ModelInterface {
  /**
   * Module-specific methods go here
   */
  // Add module-specific methods here
  
  /**
   * Access the module logger
   */
  getLogger(): LoggingInterface;
}

/**
 * Result of ${data.moduleName} operations
 */
export type ${data.modulePrefix}Result<T = unknown> = ModelResult<T>;

/**
 * Extended state for ${data.moduleName} module
 */
export interface ${data.modulePrefix}State extends ModelState {
  /**
   * Module-specific state properties go here
   */
  // Add module-specific state properties here
}`;

  fs.writeFileSync(path.join(targetDir, 'types.ts'), content);
  console.log(`Created types.ts`);
}

/**
 * Generate index.ts file
 */
async function generateIndexTs(targetDir: string, data: any): Promise<void> {
  const content = `/**
 * ${data.moduleName} Implementation
 * ${data.moduleNameUnderline}
 * 
 * This module implements ${data.moduleDescription}.
 * It follows the standard PrimeOS model pattern.
 */

import {
  BaseModel,
  ModelResult,
  ModelLifecycleState,
  createAndInitializeModel
} from '../os/model';
import {
  ${data.modulePrefix}Options,
  ${data.modulePrefix}Interface,
  ${data.modulePrefix}State
} from './types';

/**
 * Default options for ${data.moduleName}
 */
const DEFAULT_OPTIONS: ${data.modulePrefix}Options = {
  debug: false,
  name: '${data.moduleName}',
  version: '0.1.0'
};

/**
 * Main implementation of ${data.moduleName}
 */
export class ${data.modulePrefix}Implementation extends BaseModel implements ${data.modulePrefix}Interface {
  /**
   * Create a new ${data.moduleName} instance
   */
  constructor(options: ${data.modulePrefix}Options = {}) {
    // Initialize BaseModel with options
    super({ ...DEFAULT_OPTIONS, ...options });
    
    // Add any custom initialization here
  }
  
  /**
   * Module-specific initialization logic
   */
  protected async onInitialize(): Promise<void> {
    // Custom initialization logic goes here
    
    // Add custom state if needed
    this.state.custom = {
      // Add module-specific state properties here
    };
    
    // Log initialization
    await this.logger.debug('${data.modulePrefix} initialized with options', this.options);
  }
  
  /**
   * Process input data with module-specific logic
   */
  protected async onProcess<T = unknown, R = unknown>(input: T): Promise<R> {
    await this.logger.debug('Processing input in ${data.modulePrefix}', input);
    
    // TODO: Implement actual processing logic here
    // This is just a placeholder - replace with real implementation
    const result = input as unknown as R;
    
    return result;
  }
  
  /**
   * Clean up resources when module is reset
   */
  protected async onReset(): Promise<void> {
    // Clean up any module-specific resources
    await this.logger.debug('Resetting ${data.modulePrefix}');
  }
  
  /**
   * Clean up resources when module is terminated
   */
  protected async onTerminate(): Promise<void> {
    // Release any module-specific resources
    await this.logger.debug('Terminating ${data.modulePrefix}');
  }
}

/**
 * Create a ${data.moduleName} instance with the specified options
 */
export function create${data.modulePrefix}(options: ${data.modulePrefix}Options = {}): ${data.modulePrefix}Interface {
  return new ${data.modulePrefix}Implementation(options);
}

/**
 * Create and initialize a ${data.moduleName} instance in a single step
 */
export async function createAndInitialize${data.modulePrefix}(options: ${data.modulePrefix}Options = {}): Promise<${data.modulePrefix}Interface> {
  const instance = create${data.modulePrefix}(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(\`Failed to initialize ${data.moduleName}: \${result.error}\`);
  }
  
  return instance;
}

// Export types
export * from './types';`;

  fs.writeFileSync(path.join(targetDir, 'index.ts'), content);
  console.log(`Created index.ts`);
}

/**
 * Generate test.ts file
 */
async function generateTestTs(targetDir: string, data: any): Promise<void> {
  const content = `/**
 * ${data.moduleName} Tests
 * ${data.moduleNameUnderline}
 * 
 * Test suite for the ${data.moduleName} module.
 */

import { 
  create${data.modulePrefix},
  ${data.modulePrefix}Interface,
  ${data.modulePrefix}Options,
  ${data.modulePrefix}State
} from './index';
import { ModelLifecycleState } from '../os/model';

describe('${data.moduleName}', () => {
  let instance: ${data.modulePrefix}Interface;
  
  beforeEach(async () => {
    // Create a fresh instance before each test
    instance = create${data.modulePrefix}({
      debug: true,
      name: 'test-${data.moduleName}'
    });
    
    // Initialize the instance
    await instance.initialize();
  });
  
  afterEach(async () => {
    // Clean up after each test
    await instance.terminate();
  });
  
  describe('Lifecycle Management', () => {
    test('should initialize correctly', () => {
      const state = instance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
    });
    
    test('should reset state', async () => {
      // Perform some operations
      await instance.process('test-data');
      
      // Reset the instance
      const result = await instance.reset();
      expect(result.success).toBe(true);
      
      // Check state after reset
      const state = instance.getState();
      expect(state.operationCount.total).toBe(0);
    });
    
    test('should terminate properly', async () => {
      const result = await instance.terminate();
      expect(result.success).toBe(true);
      
      const state = instance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Terminated);
    });
  });
  
  describe('Basic functionality', () => {
    test('should process input data', async () => {
      const testInput = 'test-data';
      const result = await instance.process(testInput);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
    
    test('should access logger', () => {
      const logger = instance.getLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });
    
    test('should handle custom state', async () => {
      const state = instance.getState();
      expect(state.custom).toBeDefined();
      
      // Add assertions specific to module's custom state
    });
  });
  
  describe('Configuration options', () => {
    test('should use default options when none provided', async () => {
      const defaultInstance = create${data.modulePrefix}();
      await defaultInstance.initialize();
      
      expect(defaultInstance).toBeDefined();
      
      await defaultInstance.terminate();
    });
    
    test('should respect custom options', async () => {
      const customOptions: ${data.modulePrefix}Options = {
        debug: true,
        name: 'custom-${data.moduleName}',
        version: '1.2.3',
        // Add more custom options as needed
      };
      
      const customInstance = create${data.modulePrefix}(customOptions);
      await customInstance.initialize();
      
      // Process something to get a result with source
      const result = await customInstance.process('test');
      expect(result.source).toContain('custom-${data.moduleName}');
      expect(result.source).toContain('1.2.3');
      
      await customInstance.terminate();
    });
  });
  
  describe('Error handling', () => {
    test('should handle processing errors gracefully', async () => {
      // Create a bad input that will cause an error
      // This is just a placeholder - you may need to adjust for your specific module
      const badInput = undefined;
      
      // Process should not throw but return error result
      const result = await instance.process(badInput as any);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  // Template placeholder: Add more test suites specific to the module
  describe('Module-specific functionality', () => {
    test('should implement module-specific features', () => {
      // This is a placeholder for module-specific tests
      // Replace with actual tests for the module's features
      expect(true).toBe(true);
    });
  });
});`;

  fs.writeFileSync(path.join(targetDir, 'test.ts'), content);
  console.log(`Created test.ts`);
}

/**
 * Update main package.json dependencies
 */
async function updateMainPackageJson(cwd: string, targetDir: string, moduleName: string): Promise<void> {
  const mainPackageJsonPath = path.join(cwd, 'package.json');
  
  if (fs.existsSync(mainPackageJsonPath)) {
    const mainPackageJson = JSON.parse(fs.readFileSync(mainPackageJsonPath, 'utf8'));
    
    // Add the new module to dependencies
    if (!mainPackageJson.dependencies) {
      mainPackageJson.dependencies = {};
    }
    
    mainPackageJson.dependencies[moduleName] = `file:${path.relative(cwd, targetDir)}`;
    
    // Write updated package.json
    fs.writeFileSync(mainPackageJsonPath, JSON.stringify(mainPackageJson, null, 2));
    console.log(`Updated dependencies in main package.json`);
  } else {
    console.warn('Main package.json not found, skipping dependency update');
  }
}

/**
 * Run npm install
 */
async function runNpmInstall(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Running npm install...');
    exec('npm install', { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running npm install: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`npm install stderr: ${stderr}`);
      }
      console.log(`npm install stdout: ${stdout}`);
      console.log('Module installed successfully!');
      resolve();
    });
  });
}

/**
 * Command-line interface for module creation
 */
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2).reduce((acc: Record<string, any>, arg) => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      acc[key] = value || true;
    }
    return acc;
  }, {});

  // Validate required arguments
  if (!args.name) {
    console.error('Error: Module name is required (--name=your-module-name)');
    process.exit(1);
  }

  // Create the module
  createModule({
    name: args.name,
    path: args.path,
    description: args.description,
    parent: args.parent,
    install: args.install === 'true' || args.install === true,
    npm: args.npm === 'true' || args.npm === true
  }).then(result => {
    if (result.success) {
      console.log(result.data);
      process.exit(0);
    } else {
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }
  }).catch(error => {
    console.error(`Unexpected error: ${error}`);
    process.exit(1);
  });
}
