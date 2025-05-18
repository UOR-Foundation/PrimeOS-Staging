#!/usr/bin/env node
"use strict";
/**
 * Model Module Generator
 * ======================
 *
 * This module provides functionality to dynamically generate new modules
 * based on the PrimeOS model pattern, ensuring consistent structure and behavior.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createModule = createModule;
var fs = require("fs");
var path = require("path");
var child_process_1 = require("child_process");
/**
 * Create a new module with the PrimeOS model pattern
 */
function createModule(options) {
    return __awaiter(this, void 0, void 0, function () {
        var startTime, moduleName, moduleNameCamel, moduleNamePascal, moduleNameUnderline, modulePrefix, moduleDescription, parentModule, targetDir, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    startTime = Date.now();
                    // Validate required options
                    if (!options.name) {
                        return [2 /*return*/, {
                                success: false,
                                error: 'Module name is required',
                                timestamp: Date.now(),
                                source: 'model:createModule'
                            }];
                    }
                    moduleName = options.name;
                    moduleNameCamel = moduleName.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
                    moduleNamePascal = moduleNameCamel.charAt(0).toUpperCase() + moduleNameCamel.slice(1);
                    moduleNameUnderline = '='.repeat(moduleName.length);
                    modulePrefix = moduleNamePascal;
                    moduleDescription = options.description || "".concat(moduleNamePascal, " implementation for PrimeOS");
                    parentModule = options.parent || 'primeos';
                    targetDir = path.join(process.cwd(), options.path || '.', moduleName);
                    // Create target directory if it doesn't exist
                    if (!fs.existsSync(targetDir)) {
                        fs.mkdirSync(targetDir, { recursive: true });
                        console.log("Created directory: ".concat(targetDir));
                    }
                    else {
                        console.log("Directory already exists: ".concat(targetDir));
                    }
                    // Create files
                    return [4 /*yield*/, Promise.all([
                            generateReadme(targetDir, { moduleName: moduleName, moduleDescription: moduleDescription, moduleNameUnderline: moduleNameUnderline, modulePrefix: modulePrefix }),
                            generatePackageJson(targetDir, { moduleName: moduleName, moduleDescription: moduleDescription, parentModule: parentModule }),
                            generateTypesTs(targetDir, { moduleName: moduleName, moduleNameUnderline: moduleNameUnderline, modulePrefix: modulePrefix }),
                            generateIndexTs(targetDir, { moduleName: moduleName, moduleNameUnderline: moduleNameUnderline, moduleDescription: moduleDescription, modulePrefix: modulePrefix }),
                            generateTestTs(targetDir, { moduleName: moduleName, moduleNameUnderline: moduleNameUnderline, modulePrefix: modulePrefix })
                        ])];
                case 1:
                    // Create files
                    _a.sent();
                    if (!(options.install === true)) return [3 /*break*/, 4];
                    return [4 /*yield*/, updateMainPackageJson(process.cwd(), targetDir, moduleName)];
                case 2:
                    _a.sent();
                    if (!(options.npm === true)) return [3 /*break*/, 4];
                    return [4 /*yield*/, runNpmInstall(process.cwd())];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, {
                        success: true,
                        data: "Module \"".concat(moduleName, "\" created successfully at ").concat(targetDir),
                        timestamp: Date.now(),
                        duration: Date.now() - startTime,
                        source: 'model:createModule'
                    }];
                case 5:
                    error_1 = _a.sent();
                    return [2 /*return*/, {
                            success: false,
                            error: error_1 instanceof Error ? error_1.message : String(error_1),
                            timestamp: Date.now(),
                            source: 'model:createModule'
                        }];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Generate README.md file
 */
function generateReadme(targetDir, data) {
    return __awaiter(this, void 0, void 0, function () {
        var content;
        return __generator(this, function (_a) {
            content = "# ".concat(data.moduleName, "\n\n").concat(data.moduleDescription, "\n\n## Overview\n\nThis module follows the standard PrimeOS module pattern, implementing the PrimeOS Model interface for consistent lifecycle management, state tracking, error handling, and integrated logging.\n\n## Features\n\n- Fully integrates with the PrimeOS model system\n- Built-in logging capabilities\n- Standard lifecycle management (initialize, process, reset, terminate)\n- Automatic error handling and result formatting\n\n## Installation\n\n```bash\nnpm install ").concat(data.moduleName, "\n```\n\n## Usage\n\n```typescript\nimport { create").concat(data.modulePrefix, " } from '").concat(data.moduleName, "';\n\n// Create an instance\nconst instance = create").concat(data.modulePrefix, "({\n  debug: true,\n  name: '").concat(data.moduleName, "-instance',\n  version: '1.0.0'\n});\n\n// Initialize the module\nawait instance.initialize();\n\n// Process data\nconst result = await instance.process('example-input');\nconsole.log(result);\n\n// Clean up when done\nawait instance.terminate();\n```\n\n## API\n\n### `create").concat(data.modulePrefix, "(options)`\n\nCreates a new ").concat(data.moduleName, " instance with the specified options.\n\nParameters:\n- `options` - Optional configuration options\n\nReturns:\n- A ").concat(data.moduleName, " instance implementing ").concat(data.modulePrefix, "Interface\n\n### ").concat(data.modulePrefix, "Interface\n\nThe main interface implemented by ").concat(data.moduleName, ". Extends the ModelInterface.\n\nMethods:\n- `initialize()` - Initialize the module (required before processing)\n- `process<T, R>(input: T)` - Process the input data and return a result\n- `reset()` - Reset the module to its initial state\n- `terminate()` - Release resources and shut down the module\n- `getState()` - Get the current module state\n- `getLogger()` - Get the module's logger instance\n\n### Options\n\nConfiguration options for ").concat(data.moduleName, ":\n\n```typescript\ninterface ").concat(data.modulePrefix, "Options {\n  // Enable debug mode\n  debug?: boolean;\n  \n  // Module name\n  name?: string;\n  \n  // Module version\n  version?: string;\n  \n  // Module-specific options\n  // ...\n}\n```\n\n### Result Format\n\nAll operations return a standardized result format:\n\n```typescript\n{\n  success: true,          // Success indicator\n  data: { ... },          // Operation result data\n  timestamp: 1620000000,  // Operation timestamp\n  source: 'module-name'   // Source module\n}\n```\n\n## Lifecycle Management\n\nThe module follows a defined lifecycle:\n\n1. **Uninitialized**: Initial state when created\n2. **Initializing**: During setup and resource allocation\n3. **Ready**: Available for processing\n4. **Processing**: Actively handling an operation\n5. **Error**: Encountered an issue\n6. **Terminating**: During resource cleanup\n7. **Terminated**: Final state after cleanup\n\nAlways follow this sequence:\n1. Create the module with `create").concat(data.modulePrefix, "`\n2. Initialize with `initialize()`\n3. Process data with `process()`\n4. Clean up with `terminate()`\n\n## Custom Implementation\n\nYou can extend the functionality by adding module-specific methods to the implementation.\n\n## Error Handling\n\nErrors are automatically caught and returned in a standardized format:\n\n```typescript\n{\n  success: false,\n  error: \"Error message\",\n  timestamp: 1620000000,\n  source: \"module-name\"\n}\n```");
            fs.writeFileSync(path.join(targetDir, 'README.md'), content);
            console.log("Created README.md");
            return [2 /*return*/];
        });
    });
}
/**
 * Generate package.json file
 */
function generatePackageJson(targetDir, data) {
    return __awaiter(this, void 0, void 0, function () {
        var content;
        var _a;
        return __generator(this, function (_b) {
            content = {
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
                "dependencies": (_a = {},
                    _a[data.parentModule] = "^0.1.0",
                    _a),
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
            console.log("Created package.json");
            return [2 /*return*/];
        });
    });
}
/**
 * Generate types.ts file
 */
function generateTypesTs(targetDir, data) {
    return __awaiter(this, void 0, void 0, function () {
        var content;
        return __generator(this, function (_a) {
            content = "/**\n * ".concat(data.moduleName, " Types\n * ").concat(data.moduleNameUnderline, "\n * \n * Type definitions for the ").concat(data.moduleName, " module.\n */\n\nimport {\n  ModelOptions,\n  ModelInterface,\n  ModelResult,\n  ModelState,\n  ModelLifecycleState\n} from '../os/model/types';\nimport { LoggingInterface } from '../os/logging';\n\n/**\n * Configuration options for ").concat(data.moduleName, "\n */\nexport interface ").concat(data.modulePrefix, "Options extends ModelOptions {\n  /**\n   * Module-specific options go here\n   */\n  // Add module-specific options here\n}\n\n/**\n * Core interface for ").concat(data.moduleName, " functionality\n */\nexport interface ").concat(data.modulePrefix, "Interface extends ModelInterface {\n  /**\n   * Module-specific methods go here\n   */\n  // Add module-specific methods here\n  \n  /**\n   * Access the module logger\n   */\n  getLogger(): LoggingInterface;\n}\n\n/**\n * Result of ").concat(data.moduleName, " operations\n */\nexport type ").concat(data.modulePrefix, "Result<T = unknown> = ModelResult<T>;\n\n/**\n * Extended state for ").concat(data.moduleName, " module\n */\nexport interface ").concat(data.modulePrefix, "State extends ModelState {\n  /**\n   * Module-specific state properties go here\n   */\n  // Add module-specific state properties here\n}");
            fs.writeFileSync(path.join(targetDir, 'types.ts'), content);
            console.log("Created types.ts");
            return [2 /*return*/];
        });
    });
}
/**
 * Generate index.ts file
 */
function generateIndexTs(targetDir, data) {
    return __awaiter(this, void 0, void 0, function () {
        var content;
        return __generator(this, function (_a) {
            content = "/**\n * ".concat(data.moduleName, " Implementation\n * ").concat(data.moduleNameUnderline, "\n * \n * This module implements ").concat(data.moduleDescription, ".\n * It follows the standard PrimeOS model pattern.\n */\n\nimport {\n  BaseModel,\n  ModelResult,\n  ModelLifecycleState,\n  createAndInitializeModel\n} from '../os/model';\nimport {\n  ").concat(data.modulePrefix, "Options,\n  ").concat(data.modulePrefix, "Interface,\n  ").concat(data.modulePrefix, "State\n} from './types';\n\n/**\n * Default options for ").concat(data.moduleName, "\n */\nconst DEFAULT_OPTIONS: ").concat(data.modulePrefix, "Options = {\n  debug: false,\n  name: '").concat(data.moduleName, "',\n  version: '0.1.0'\n};\n\n/**\n * Main implementation of ").concat(data.moduleName, "\n */\nexport class ").concat(data.modulePrefix, "Implementation extends BaseModel implements ").concat(data.modulePrefix, "Interface {\n  /**\n   * Create a new ").concat(data.moduleName, " instance\n   */\n  constructor(options: ").concat(data.modulePrefix, "Options = {}) {\n    // Initialize BaseModel with options\n    super({ ...DEFAULT_OPTIONS, ...options });\n    \n    // Add any custom initialization here\n  }\n  \n  /**\n   * Module-specific initialization logic\n   */\n  protected async onInitialize(): Promise<void> {\n    // Custom initialization logic goes here\n    \n    // Add custom state if needed\n    this.state.custom = {\n      // Add module-specific state properties here\n    };\n    \n    // Log initialization\n    await this.logger.debug('").concat(data.modulePrefix, " initialized with options', this.options);\n  }\n  \n  /**\n   * Process input data with module-specific logic\n   */\n  protected async onProcess<T = unknown, R = unknown>(input: T): Promise<R> {\n    await this.logger.debug('Processing input in ").concat(data.modulePrefix, "', input);\n    \n    // TODO: Implement actual processing logic here\n    // This is just a placeholder - replace with real implementation\n    const result = input as unknown as R;\n    \n    return result;\n  }\n  \n  /**\n   * Clean up resources when module is reset\n   */\n  protected async onReset(): Promise<void> {\n    // Clean up any module-specific resources\n    await this.logger.debug('Resetting ").concat(data.modulePrefix, "');\n  }\n  \n  /**\n   * Clean up resources when module is terminated\n   */\n  protected async onTerminate(): Promise<void> {\n    // Release any module-specific resources\n    await this.logger.debug('Terminating ").concat(data.modulePrefix, "');\n  }\n}\n\n/**\n * Create a ").concat(data.moduleName, " instance with the specified options\n */\nexport function create").concat(data.modulePrefix, "(options: ").concat(data.modulePrefix, "Options = {}): ").concat(data.modulePrefix, "Interface {\n  return new ").concat(data.modulePrefix, "Implementation(options);\n}\n\n/**\n * Create and initialize a ").concat(data.moduleName, " instance in a single step\n */\nexport async function createAndInitialize").concat(data.modulePrefix, "(options: ").concat(data.modulePrefix, "Options = {}): Promise<").concat(data.modulePrefix, "Interface> {\n  const instance = create").concat(data.modulePrefix, "(options);\n  const result = await instance.initialize();\n  \n  if (!result.success) {\n    throw new Error(`Failed to initialize ").concat(data.moduleName, ": ${result.error}`);\n  }\n  \n  return instance;\n}\n\n// Export types\nexport * from './types';");
            fs.writeFileSync(path.join(targetDir, 'index.ts'), content);
            console.log("Created index.ts");
            return [2 /*return*/];
        });
    });
}
/**
 * Generate test.ts file
 */
function generateTestTs(targetDir, data) {
    return __awaiter(this, void 0, void 0, function () {
        var content;
        return __generator(this, function (_a) {
            content = "/**\n * ".concat(data.moduleName, " Tests\n * ").concat(data.moduleNameUnderline, "\n * \n * Test suite for the ").concat(data.moduleName, " module.\n */\n\nimport { \n  create").concat(data.modulePrefix, ",\n  ").concat(data.modulePrefix, "Interface,\n  ").concat(data.modulePrefix, "Options,\n  ").concat(data.modulePrefix, "State\n} from './index';\nimport { ModelLifecycleState } from '../os/model';\n\ndescribe('").concat(data.moduleName, "', () => {\n  let instance: ").concat(data.modulePrefix, "Interface;\n  \n  beforeEach(async () => {\n    // Create a fresh instance before each test\n    instance = create").concat(data.modulePrefix, "({\n      debug: true,\n      name: 'test-").concat(data.moduleName, "'\n    });\n    \n    // Initialize the instance\n    await instance.initialize();\n  });\n  \n  afterEach(async () => {\n    // Clean up after each test\n    await instance.terminate();\n  });\n  \n  describe('Lifecycle Management', () => {\n    test('should initialize correctly', () => {\n      const state = instance.getState();\n      expect(state.lifecycle).toBe(ModelLifecycleState.Ready);\n    });\n    \n    test('should reset state', async () => {\n      // Perform some operations\n      await instance.process('test-data');\n      \n      // Reset the instance\n      const result = await instance.reset();\n      expect(result.success).toBe(true);\n      \n      // Check state after reset\n      const state = instance.getState();\n      expect(state.operationCount.total).toBe(0);\n    });\n    \n    test('should terminate properly', async () => {\n      const result = await instance.terminate();\n      expect(result.success).toBe(true);\n      \n      const state = instance.getState();\n      expect(state.lifecycle).toBe(ModelLifecycleState.Terminated);\n    });\n  });\n  \n  describe('Basic functionality', () => {\n    test('should process input data', async () => {\n      const testInput = 'test-data';\n      const result = await instance.process(testInput);\n      \n      expect(result.success).toBe(true);\n      expect(result.data).toBeDefined();\n      expect(result.timestamp).toBeDefined();\n    });\n    \n    test('should access logger', () => {\n      const logger = instance.getLogger();\n      expect(logger).toBeDefined();\n      expect(typeof logger.info).toBe('function');\n    });\n    \n    test('should handle custom state', async () => {\n      const state = instance.getState();\n      expect(state.custom).toBeDefined();\n      \n      // Add assertions specific to module's custom state\n    });\n  });\n  \n  describe('Configuration options', () => {\n    test('should use default options when none provided', async () => {\n      const defaultInstance = create").concat(data.modulePrefix, "();\n      await defaultInstance.initialize();\n      \n      expect(defaultInstance).toBeDefined();\n      \n      await defaultInstance.terminate();\n    });\n    \n    test('should respect custom options', async () => {\n      const customOptions: ").concat(data.modulePrefix, "Options = {\n        debug: true,\n        name: 'custom-").concat(data.moduleName, "',\n        version: '1.2.3',\n        // Add more custom options as needed\n      };\n      \n      const customInstance = create").concat(data.modulePrefix, "(customOptions);\n      await customInstance.initialize();\n      \n      // Process something to get a result with source\n      const result = await customInstance.process('test');\n      expect(result.source).toContain('custom-").concat(data.moduleName, "');\n      expect(result.source).toContain('1.2.3');\n      \n      await customInstance.terminate();\n    });\n  });\n  \n  describe('Error handling', () => {\n    test('should handle processing errors gracefully', async () => {\n      // Create a bad input that will cause an error\n      // This is just a placeholder - you may need to adjust for your specific module\n      const badInput = undefined;\n      \n      // Process should not throw but return error result\n      const result = await instance.process(badInput as any);\n      expect(result.success).toBe(false);\n      expect(result.error).toBeDefined();\n    });\n  });\n  \n  // Template placeholder: Add more test suites specific to the module\n  describe('Module-specific functionality', () => {\n    test('should implement module-specific features', () => {\n      // This is a placeholder for module-specific tests\n      // Replace with actual tests for the module's features\n      expect(true).toBe(true);\n    });\n  });\n});");
            fs.writeFileSync(path.join(targetDir, 'test.ts'), content);
            console.log("Created test.ts");
            return [2 /*return*/];
        });
    });
}
/**
 * Update main package.json dependencies
 */
function updateMainPackageJson(cwd, targetDir, moduleName) {
    return __awaiter(this, void 0, void 0, function () {
        var mainPackageJsonPath, mainPackageJson;
        return __generator(this, function (_a) {
            mainPackageJsonPath = path.join(cwd, 'package.json');
            if (fs.existsSync(mainPackageJsonPath)) {
                mainPackageJson = JSON.parse(fs.readFileSync(mainPackageJsonPath, 'utf8'));
                // Add the new module to dependencies
                if (!mainPackageJson.dependencies) {
                    mainPackageJson.dependencies = {};
                }
                mainPackageJson.dependencies[moduleName] = "file:".concat(path.relative(cwd, targetDir));
                // Write updated package.json
                fs.writeFileSync(mainPackageJsonPath, JSON.stringify(mainPackageJson, null, 2));
                console.log("Updated dependencies in main package.json");
            }
            else {
                console.warn('Main package.json not found, skipping dependency update');
            }
            return [2 /*return*/];
        });
    });
}
/**
 * Run npm install
 */
function runNpmInstall(cwd) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    console.log('Running npm install...');
                    (0, child_process_1.exec)('npm install', { cwd: cwd }, function (error, stdout, stderr) {
                        if (error) {
                            console.error("Error running npm install: ".concat(error.message));
                            reject(error);
                            return;
                        }
                        if (stderr) {
                            console.error("npm install stderr: ".concat(stderr));
                        }
                        console.log("npm install stdout: ".concat(stdout));
                        console.log('Module installed successfully!');
                        resolve();
                    });
                })];
        });
    });
}
/**
 * Command-line interface for module creation
 */
if (require.main === module) {
    // Parse command line arguments
    var args = process.argv.slice(2).reduce(function (acc, arg) {
        if (arg.startsWith('--')) {
            var _a = arg.slice(2).split('='), key = _a[0], value = _a[1];
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
    }).then(function (result) {
        if (result.success) {
            console.log(result.data);
            process.exit(0);
        }
        else {
            console.error("Error: ".concat(result.error));
            process.exit(1);
        }
    }).catch(function (error) {
        console.error("Unexpected error: ".concat(error));
        process.exit(1);
    });
}
