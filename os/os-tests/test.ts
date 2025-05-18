/**
 * os-tests Tests
 * ========
 * 
 * Test suite for the Testing Framework module.
 */

// Add Jest types reference to make TypeScript recognize test functions
/// <reference types="jest" />

import * as fs from 'fs';
import * as path from 'path';
import { 
  createTestFramework,
  createAndInitializeTestFramework,
  TestFrameworkInterface,
  TestFrameworkOptions,
  TestFrameworkState,
  TestableInterface,
  TestResult,
  TestResults,
  TestResultStatus,
  TestMetadata,
  modelResultToTestResult
} from './index';
import { ModelLifecycleState, ModelResult } from '../model';

// Mock file system operations for tests
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('{}')
}));

// Create a mock testable module for testing
class MockTestableModule implements TestableInterface {
  private passed = true;
  private readonly _name: string;
  private readonly _tags: string[];
  private readonly _shouldThrow: boolean;
  
  constructor(options: {
    shouldPass?: boolean,
    name?: string,
    tags?: string[],
    shouldThrow?: boolean
  } = {}) {
    this.passed = options.shouldPass !== false;
    this._name = options.name || 'mock-module';
    this._tags = options.tags || ['mock', 'test'];
    this._shouldThrow = options.shouldThrow || false;
  }
  
  validateBase(): TestResult {
    return {
      id: 'mock-validation',
      status: this.passed ? TestResultStatus.Passed : TestResultStatus.Failed,
      error: this.passed ? undefined : 'Mock validation error',
      duration: 5,
      timestamp: Date.now(),
      source: this._name
    };
  }
  
  async runTests(): Promise<TestResults> {
    if (this._shouldThrow) {
      throw new Error('Mock test execution error');
    }
    
    const results: TestResults = {
      'test-1': {
        id: 'test-1',
        status: this.passed ? TestResultStatus.Passed : TestResultStatus.Failed,
        error: this.passed ? undefined : 'Mock test failure',
        duration: 10,
        timestamp: Date.now(),
        source: this._name
      },
      'test-2': {
        id: 'test-2',
        status: TestResultStatus.Passed,
        duration: 15,
        timestamp: Date.now(),
        source: this._name
      }
    };
    
    // Add a skipped test if not passed
    if (!this.passed) {
      results['test-3'] = {
        id: 'test-3',
        status: TestResultStatus.Skipped,
        duration: 0,
        timestamp: Date.now(),
        source: this._name
      };
    }
    
    return results;
  }
  
  getTestMetadata(): TestMetadata {
    return {
      moduleName: this._name,
      version: '1.0.0',
      testCount: this.passed ? 2 : 3,
      tags: this._tags
    };
  }
}

describe('Testing Framework', () => {
  let instance: TestFrameworkInterface;
  
  beforeEach(async () => {
    // Create a fresh instance before each test
    instance = createTestFramework({
      debug: true,
      name: 'test-framework'
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
      const state = instance.getState() as TestFrameworkState;
      expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
      expect(state.custom?.registeredModules).toEqual([]);
      expect(state.custom?.stats).toBeDefined();
    });
    
    test('should reset state', async () => {
      // Register a module
      instance.register(new MockTestableModule());
      
      // Reset the instance
      const result = await instance.reset();
      expect(result.success).toBe(true);
      
      // Check state after reset
      const state = instance.getState() as TestFrameworkState;
      expect(state.custom?.registeredModules).toEqual([]);
      expect(state.operationCount.total).toBe(0);
    });
    
    test('should terminate properly', async () => {
      const result = await instance.terminate();
      expect(result.success).toBe(true);
      
      const state = instance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Terminated);
    });
  });
  
  describe('Module Registration', () => {
    test('should register a module', () => {
      const mockModule = new MockTestableModule();
      instance.register(mockModule);
      
      const state = instance.getState() as TestFrameworkState;
      const registeredModules = state.custom?.registeredModules as string[];
      expect(registeredModules).toHaveLength(1);
      expect(registeredModules[0]).toBe('mock-module');
    });
    
    test('should register multiple modules', () => {
      // Create a mock module that returns a different name
      const mockModule1 = new MockTestableModule();
      
      // Create a custom module with a different name
      const mockModule2 = new MockTestableModule();
      const originalGetMetadata = mockModule2.getTestMetadata;
      mockModule2.getTestMetadata = function() {
        const metadata = originalGetMetadata.call(this);
        metadata.moduleName = 'mock-module-2';
        return metadata;
      };
      
      instance.register(mockModule1);
      instance.register(mockModule2);
      
      const state = instance.getState() as TestFrameworkState;
      const registeredModules = state.custom?.registeredModules as string[];
      expect(registeredModules).toHaveLength(2);
      expect(registeredModules).toContain('mock-module');
      expect(registeredModules).toContain('mock-module-2');
    });
  });
  
  describe('Test Execution', () => {
    test('should run tests for a registered module', async () => {
      const mockModule = new MockTestableModule();
      instance.register(mockModule);
      
      const results = await instance.runAll();
      expect(Object.keys(results)).toHaveLength(1);
      expect(results['mock-module']).toBeDefined();
      expect(Object.keys(results['mock-module'])).toHaveLength(2);
    });
    
    test('should handle module validation errors', async () => {
      const failingModule = new MockTestableModule({ shouldPass: false });
      instance.register(failingModule);
      
      const results = await instance.runAll();
      expect(results['mock-module']).toBeDefined();
      expect(Object.keys(results['mock-module'])).toHaveLength(1);
      expect(results['mock-module']['baseValidation']).toBeDefined();
      expect(results['mock-module']['baseValidation'].status).toBe(TestResultStatus.Failed);
    });
    
    test('should run tests for a specific module', async () => {
      const mockModule = new MockTestableModule();
      instance.register(mockModule);
      
      const results = await instance.runForModule('mock-module');
      expect(Object.keys(results)).toHaveLength(2);
      expect(results['test-1']).toBeDefined();
      expect(results['test-2']).toBeDefined();
    });
    
    test('should handle non-existent module', async () => {
      const results = await instance.runForModule('non-existent');
      expect(Object.keys(results)).toHaveLength(1);
      expect(results['module-not-found']).toBeDefined();
      expect(results['module-not-found'].status).toBe(TestResultStatus.Error);
    });
  });
  
  describe('Configuration options', () => {
    test('should use default options when none provided', async () => {
      const defaultInstance = createTestFramework();
      await defaultInstance.initialize();
      
      expect(defaultInstance).toBeDefined();
      
      await defaultInstance.terminate();
    });
    
    test('should respect custom options', async () => {
      const customOptions: TestFrameworkOptions = {
        debug: true,
        name: 'custom-test-framework',
        version: '1.2.3',
        verbose: true,
        failFast: true
      };
      
      const customInstance = createTestFramework(customOptions);
      await customInstance.initialize();
      
      // Process something to get a result with source
      const result = await customInstance.process('run-all');
      expect(result.source).toContain('custom-test-framework');
      
      await customInstance.terminate();
    });
  });
  
  describe('Reporting', () => {
    beforeEach(() => {
      // Reset mock for each test
      jest.clearAllMocks();
    });
    
    test('should generate console report', async () => {
      const mockModule = new MockTestableModule();
      instance.register(mockModule);
      
      const results = await instance.runAll();
      const reportPath = await instance.generateReport(results);
      
      expect(reportPath).toBeDefined();
      expect(typeof reportPath).toBe('string');
      // Console report doesn't write to file
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
    
    test('should generate JSON report', async () => {
      const customInstance = createTestFramework({
        name: 'json-report-test',
        reportFormat: 'json',
        reportPath: 'test-report.json'
      });
      
      await customInstance.initialize();
      
      const mockModule = new MockTestableModule();
      customInstance.register(mockModule);
      
      const results = await customInstance.runAll();
      const reportPath = await customInstance.generateReport(results);
      
      expect(reportPath).toBe('test-report.json');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'test-report.json', 
        expect.any(String)
      );
      
      await customInstance.terminate();
    });
    
    test('should generate HTML report', async () => {
      const customInstance = createTestFramework({
        name: 'html-report-test',
        reportFormat: 'html',
        reportPath: 'test-report.html'
      });
      
      await customInstance.initialize();
      
      const mockModule = new MockTestableModule();
      customInstance.register(mockModule);
      
      const results = await customInstance.runAll();
      const reportPath = await customInstance.generateReport(results);
      
      expect(reportPath).toBe('test-report.html');
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'test-report.html', 
        expect.stringContaining('<!DOCTYPE html>')
      );
      
      await customInstance.terminate();
    });
  });
  
  describe('Tag Filtering', () => {
    test('should filter tests by tags', async () => {
      // Register multiple modules with different tags
      const module1 = new MockTestableModule({
        name: 'module-1',
        tags: ['tag1', 'common']
      });
      
      const module2 = new MockTestableModule({
        name: 'module-2',
        tags: ['tag2', 'common']
      });
      
      const module3 = new MockTestableModule({
        name: 'module-3',
        tags: ['tag3']
      });
      
      instance.register(module1);
      instance.register(module2);
      instance.register(module3);
      
      // Run with specific tag
      const tag1Results = await instance.runWithTags(['tag1']);
      expect(Object.keys(tag1Results)).toHaveLength(1);
      expect(tag1Results['module-1']).toBeDefined();
      
      // Run with common tag
      const commonResults = await instance.runWithTags(['common']);
      expect(Object.keys(commonResults)).toHaveLength(2);
      expect(commonResults['module-1']).toBeDefined();
      expect(commonResults['module-2']).toBeDefined();
      
      // Run with multiple tags
      const multiTagResults = await instance.runWithTags(['tag1', 'tag3']);
      expect(Object.keys(multiTagResults)).toHaveLength(2);
      expect(multiTagResults['module-1']).toBeDefined();
      expect(multiTagResults['module-3']).toBeDefined();
    });
    
    test('should return empty results when no modules match tags', async () => {
      const module = new MockTestableModule({
        tags: ['existing-tag']
      });
      
      instance.register(module);
      
      const results = await instance.runWithTags(['non-existent-tag']);
      expect(Object.keys(results)).toHaveLength(0);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle thrown errors in module test execution', async () => {
      const throwingModule = new MockTestableModule({
        name: 'throwing-module',
        shouldThrow: true
      });
      
      instance.register(throwingModule);
      
      const results = await instance.runAll();
      expect(results['throwing-module']).toBeDefined();
      expect(results['throwing-module']['execution']).toBeDefined();
      expect(results['throwing-module']['execution'].status).toBe(TestResultStatus.Error);
      expect(results['throwing-module']['execution'].error).toContain('Mock test execution error');
    });
    
    test('should support fail-fast option', async () => {
      // Set up custom instance with failFast
      const fastFailInstance = createTestFramework({
        name: 'fail-fast-test',
        failFast: true
      });
      
      await fastFailInstance.initialize();
      
      // Register a failing module first
      const failingModule = new MockTestableModule({
        name: 'failing-module',
        shouldPass: false
      });
      
      // Then a passing module that should not be executed due to fail-fast
      const passingModule = new MockTestableModule({
        name: 'passing-module'
      });
      
      fastFailInstance.register(failingModule);
      fastFailInstance.register(passingModule);
      
      const results = await fastFailInstance.runAll();
      
      // Should only have results for the first module
      expect(Object.keys(results)).toHaveLength(1);
      expect(results['failing-module']).toBeDefined();
      expect(results['passing-module']).toBeUndefined();
      
      await fastFailInstance.terminate();
    });
  });
  
  describe('Helper Functions', () => {
    test('modelResultToTestResult should convert model results to test results', () => {
      // Success case
      const successResult: ModelResult = {
        success: true,
        data: { value: 'test-data' },
        timestamp: 1234567890,
        duration: 42,
        source: 'model-source'
      };
      
      const successTestResult = modelResultToTestResult(successResult, 'success-test', 'test-source');
      
      expect(successTestResult.id).toBe('success-test');
      expect(successTestResult.status).toBe(TestResultStatus.Passed);
      expect(successTestResult.data).toEqual({ value: 'test-data' });
      expect(successTestResult.error).toBeUndefined();
      expect(successTestResult.timestamp).toBe(1234567890);
      expect(successTestResult.duration).toBe(42);
      expect(successTestResult.source).toBe('test-source');
      
      // Failure case
      const failureResult: ModelResult = {
        success: false,
        error: 'Test error message',
        timestamp: 1234567890,
        duration: 42,
        source: 'model-source'
      };
      
      const failureTestResult = modelResultToTestResult(failureResult, 'failure-test', 'test-source');
      
      expect(failureTestResult.id).toBe('failure-test');
      expect(failureTestResult.status).toBe(TestResultStatus.Failed);
      expect(failureTestResult.data).toBeUndefined();
      expect(failureTestResult.error).toBe('Test error message');
      expect(failureTestResult.timestamp).toBe(1234567890);
      expect(failureTestResult.duration).toBe(42);
      expect(failureTestResult.source).toBe('test-source');
    });
  });
  
  describe('Factory Functions', () => {
    test('createAndInitializeTestFramework should create and initialize in one step', async () => {
      const instance = await createAndInitializeTestFramework({
        name: 'factory-test'
      });
      
      expect(instance).toBeDefined();
      expect(instance.getState().lifecycle).toBe(ModelLifecycleState.Ready);
      
      await instance.terminate();
    });
    
    test('createAndInitializeTestFramework should throw on initialization failure', async () => {
      // Mock a failure scenario - this isn't perfect but it's a way to test the failure path
      jest.spyOn(TestFrameworkImplementation.prototype, 'initialize').mockImplementationOnce(async () => {
        return {
          success: false,
          error: 'Mock initialization failure',
          timestamp: Date.now(),
          source: 'test'
        };
      });
      
      await expect(createAndInitializeTestFramework()).rejects.toThrow('Failed to initialize');
      
      // Restore original implementation
      jest.restoreAllMocks();
    });
  });
  
  describe('Input Processing', () => {
      test('should process string input as module name', async () => {
      const module = new MockTestableModule();
      instance.register(module);
      
      const result = await instance.process('mock-module');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
    
    test('should process tag prefix input', async () => {
      const module = new MockTestableModule({
        tags: ['special-tag']
      });
      instance.register(module);
      
      const result = await instance.process('tag:special-tag');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
    
    test('should process run-all command', async () => {
      const module = new MockTestableModule();
      instance.register(module);
      
      const result = await instance.process('run-all');
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
    
    test('should process array input as tags', async () => {
      const module = new MockTestableModule({
        tags: ['array-tag']
      });
      instance.register(module);
      
      const result = await instance.process(['array-tag']);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
    
    test('should process object input with moduleName', async () => {
      const module = new MockTestableModule();
      instance.register(module);
      
      const result = await instance.process({ moduleName: 'mock-module' });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
    
    test('should process object input with tags', async () => {
      const module = new MockTestableModule({
        tags: ['object-tag']
      });
      instance.register(module);
      
      const result = await instance.process({ tags: ['object-tag'] });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
    
    test('should update report options from object input', async () => {
      const module = new MockTestableModule();
      instance.register(module);
      
      // First check the default format
      expect((instance as any).options.reportFormat).toBe('console');
      
      // Update via process
      await instance.process({ 
        reportFormat: 'json',
        reportPath: 'custom-path.json',
        runAll: true
      });
      
      // Verify the options were updated
      expect((instance as any).options.reportFormat).toBe('json');
      expect((instance as any).options.reportPath).toBe('custom-path.json');
    });
    
    test('should default to running all tests for unknown input', async () => {
      const module = new MockTestableModule();
      instance.register(module);
      
      // Process with an unexpected input type
      const result = await instance.process(123 as any);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

// Access the TestFrameworkImplementation for some tests
import { TestFrameworkImplementation } from './index';
