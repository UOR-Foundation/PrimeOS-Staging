/**
 * Model Tests
 * ==========
 * 
 * Test suite for the model module that implements the standard pattern for PrimeOS modules.
 */

import { 
  createModel,
  ModelInterface,
  ModelOptions,
  ModelResult,
  ModelState,
  ModelLifecycleState,
  BaseModel,
  StandardModel,
  createModelTestAdapter
} from './index';
import { LoggingInterface, LogLevel } from '../logging';
import * as logging from '../logging';

describe('Model Module', () => {
  let instance: ModelInterface;
  // Mock logger functions for testing
  let originalCreateLogging: any;
  let mockLoggerFunctions: any = {
    initialize: jest.fn().mockResolvedValue({ success: true }),
    info: jest.fn().mockResolvedValue({ success: true }),
    debug: jest.fn().mockResolvedValue({ success: true }),
    warn: jest.fn().mockResolvedValue({ success: true }),
    error: jest.fn().mockResolvedValue({ success: true }),
    log: jest.fn().mockResolvedValue({ success: true }),
    terminate: jest.fn().mockResolvedValue({ success: true }),
    getState: jest.fn().mockReturnValue({ lifecycle: ModelLifecycleState.Ready }),
    process: jest.fn().mockResolvedValue({ success: true }),
    reset: jest.fn().mockResolvedValue({ success: true }),
    getEntries: jest.fn().mockReturnValue([]),
    clearHistory: jest.fn().mockResolvedValue({ success: true }),
    trace: jest.fn().mockResolvedValue({ success: true }),
    fatal: jest.fn().mockResolvedValue({ success: true })
  };
  
  beforeEach(async () => {
    // Mock the createLogging function
    originalCreateLogging = logging.createLogging;
    const mockLogger = {
      ...mockLoggerFunctions,
      createResult: jest.fn().mockImplementation((success, data) => ({ success, data }))
    };
    
    (logging as any).createLogging = jest.fn().mockReturnValue(mockLogger);
    
    // Reset mock function counts
    Object.values(mockLoggerFunctions).forEach((fn: any) => fn.mockClear());
    
    // Create a fresh instance before each test
    instance = createModel({
      debug: true,
      name: 'test-model',
      version: '1.0.0'
    });
    
    // Initialize the instance
    await instance.initialize();
  });
  
  afterEach(async () => {
    // Clean up after each test
    await instance.terminate();
    
    // Restore original createLogging function
    (logging as any).createLogging = originalCreateLogging;
  });
  
  describe('Logging Integration', () => {
    test('should initialize logger during model initialization', async () => {
      expect(logging.createLogging).toHaveBeenCalled();
      expect(mockLoggerFunctions.initialize).toHaveBeenCalled();
      expect(mockLoggerFunctions.info).toHaveBeenCalledWith('Initializing module', expect.anything());
    });
    
    test('should log state transitions', async () => {
      // Process an item which causes state transition
      await instance.process('test-data');
      
      // Should have logged debug information
      expect(mockLoggerFunctions.debug).toHaveBeenCalledWith('Processing input', 'test-data');
      expect(mockLoggerFunctions.debug).toHaveBeenCalledWith('Processing completed successfully', expect.anything());
    });
    
    test('should log errors', async () => {
      // Create a test model that deliberately throws an error
      class ErrorModel extends StandardModel {
        protected async onProcess(): Promise<any> {
          throw new Error('Test error');
        }
      }
      
      const errorModel = new ErrorModel();
      await errorModel.initialize();
      
      // Reset mock counts after initialization
      mockLoggerFunctions.error.mockClear();
      
      // Process should cause an error
      await errorModel.process('data');
      
      // Should have logged the error
      expect(mockLoggerFunctions.error).toHaveBeenCalledWith('Processing error', expect.anything());
      
      await errorModel.terminate();
    });
    
    test('should terminate logger when model terminates', async () => {
      mockLoggerFunctions.terminate.mockClear();
      await instance.terminate();
      expect(mockLoggerFunctions.terminate).toHaveBeenCalled();
    });
    
    test('should expose logger through getLogger method', async () => {
      const model = instance as any;
      const logger = model.getLogger();
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
    });
  });
  
  describe('Lifecycle Management', () => {
    test('should initialize correctly', async () => {
      const newInstance = createModel();
      const result = await newInstance.initialize();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('initialized', true);
      
      const state = newInstance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
    });
    
    test('should reset to initial state', async () => {
      // Perform some operations to change the state
      await instance.process('test-data');
      await instance.process('more-data');
      
      // Reset the state
      const result = await instance.reset();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('reset', true);
      
      const state = instance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
      expect(state.operationCount.total).toBe(0);
    });
    
    test('should terminate properly', async () => {
      const result = await instance.terminate();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('terminated', true);
      
      const state = instance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Terminated);
    });
    
    test('should track state transitions', async () => {
      // After initialization in beforeEach, should be Ready
      let state = instance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
      
      // Process should change state to Processing and back to Ready
      const processPromise = instance.process('test-data');
      
      // We can't easily check the Processing state as it's async and transitions quickly
      const result = await processPromise;
      
      // After processing completes, should be back to Ready
      state = instance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
      
      // Terminate should change state to Terminating and then Terminated
      await instance.terminate();
      state = instance.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Terminated);
    });
  });
  
  describe('Processing Functionality', () => {
    test('should process input data correctly', async () => {
      const testInput = 'test-data';
      const result = await instance.process(testInput);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(testInput); // The StandardModel passes through data
      expect(result.timestamp).toBeDefined();
      expect(result.source).toContain('test-model');
    });
    
    test('should handle typed data processing', async () => {
      interface TestData {
        id: number;
        name: string;
      }
      
      const testInput: TestData = { id: 1, name: 'test' };
      const result = await instance.process<TestData, TestData>(testInput);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(testInput);
    });
    
    test('should reject processing if not in Ready state', async () => {
      // Terminate the instance to change its state
      await instance.terminate();
      
      // Try to process data after termination
      const result = await instance.process('test-data');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot process');
    });
  });
  
  describe('Configuration Options', () => {
    test('should use default options when none provided', async () => {
      const defaultInstance = createModel();
      await defaultInstance.initialize();
      
      const state = defaultInstance.getState();
      expect(state).toBeDefined();
      
      // Clean up
      await defaultInstance.terminate();
    });
    
    test('should respect custom options', async () => {
      const customOptions: ModelOptions = {
        debug: true,
        name: 'custom-model',
        version: '2.0.0',
        id: 'custom-id-123'
      };
      
      const customInstance = createModel(customOptions);
      await customInstance.initialize();
      
      // Process something to generate a result with source
      const result = await customInstance.process('test');
      
      // The source should match our custom ID
      expect(result.source).toBe('custom-id-123');
      
      // Clean up
      await customInstance.terminate();
    });
  });
  
  describe('State and Statistics', () => {
    test('should track operation counts', async () => {
      // Process several items
      await instance.process('item1');
      await instance.process('item2');
      
      // Deliberately cause an error
      const errorResult = await instance.process(undefined as any);
      expect(errorResult.success).toBe(false);
      
      // Check operation counts
      const state = instance.getState();
      expect(state.operationCount.total).toBe(3);
      expect(state.operationCount.success).toBe(2);
      expect(state.operationCount.failed).toBe(1);
    });
    
    test('should track uptime', async () => {
      // Get initial state
      const initialState = instance.getState();
      
      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Get updated state
      const updatedState = instance.getState();
      
      // Uptime should have increased
      expect(updatedState.uptime).toBeGreaterThan(initialState.uptime);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle processing errors gracefully', async () => {
      // Create a test model that deliberately throws an error
      class ErroringModel extends StandardModel {
        protected async onProcess(): Promise<any> {
          throw new Error('Deliberate test error');
        }
      }
      
      const errorModel = new ErroringModel({ debug: true });
      await errorModel.initialize();
      
      const result = await errorModel.process('test-data');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Deliberate test error');
      
      // Clean up
      await errorModel.terminate();
    });
    
    test('should create proper error results', async () => {
      // Test the createResult method directly
      const errorResult = instance.createResult(false, undefined, 'Test error message');
      
      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBe('Test error message');
      expect(errorResult.timestamp).toBeDefined();
      expect(errorResult.data).toBeUndefined();
    });
  });
  
  describe('Extensibility', () => {
    test('should allow extending BaseModel with custom implementation', async () => {
      // Create a custom model implementation
      class CustomModel extends BaseModel {
        protected async onProcess<T, R>(input: T): Promise<R> {
          // Custom processing logic - convert to uppercase if string
          if (typeof input === 'string') {
            return input.toUpperCase() as unknown as R;
          }
          return input as unknown as R;
        }
        
        // Override initialization to add custom state
        protected async onInitialize(): Promise<void> {
          // Add custom state
          this.state.custom = {
            initialized: true,
            customData: 'test-value'
          };
        }
      }
      
      const customModel = new CustomModel({ name: 'custom-extension' });
      await customModel.initialize();
      
      // Test custom processing logic
      const result = await customModel.process('hello world');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('HELLO WORLD');
      
      // Test custom state
      const state = customModel.getState();
      expect(state.custom).toBeDefined();
      expect(state.custom?.initialized).toBe(true);
      expect(state.custom?.customData).toBe('test-value');
      
      // Clean up
      await customModel.terminate();
    });
  });
  
  describe('Testing Framework Integration', () => {
    // Import tests module
    const { createTestFramework, TestResultStatus } = require('../os-tests');
    
    test('should work with the testing framework', async () => {
      // Create a model to be tested
      const testModel = createModel({
        name: 'test-subject-model',
        version: '1.0.0',
        debug: true
      });
      
      // Initialize the model
      await testModel.initialize();
      
      // Create test adapter for the model
      const modelAdapter = createModelTestAdapter(testModel, {
        tags: ['unit-test'],
        testCases: [
          { name: 'basic-process', input: 'test-data' },
          { name: 'object-process', input: { key: 'value' } },
          { name: 'expected-result-match', input: 'expected', expectedResult: 'expected' },
          { name: 'expected-result-mismatch', input: 'actual', expectedResult: 'expected' }
        ]
      });
      
      // Create and initialize test framework
      const testFramework = createTestFramework({
        debug: true,
        name: 'model-test',
        verbose: true
      });
      
      await testFramework.initialize();
      
      // Register the model with the test framework
      testFramework.register(modelAdapter);
      
      // Run tests
      const results = await testFramework.runAll();
      
      // Get the key for our test subject (changes based on model name detection)
      const testSubjectKey = Object.keys(results)[0];
      expect(testSubjectKey).toContain('model-test-subject-model');
      
      // Verify the test results
      const testResults = results[testSubjectKey];
      expect(testResults).toBeDefined();
      
      // Basic process test should pass
      expect(testResults['basic-process']).toBeDefined();
      expect(testResults['basic-process'].status).toBe(TestResultStatus.Passed);
      
      // Object process test should pass
      expect(testResults['object-process']).toBeDefined();
      expect(testResults['object-process'].status).toBe(TestResultStatus.Passed);
      
      // Expected result match test should pass
      expect(testResults['expected-result-match']).toBeDefined();
      expect(testResults['expected-result-match'].status).toBe(TestResultStatus.Passed);
      
      // Expected result mismatch test should fail
      expect(testResults['expected-result-mismatch']).toBeDefined();
      expect(testResults['expected-result-mismatch'].status).toBe(TestResultStatus.Failed);
      
      // Cleanup
      await testFramework.terminate();
      await testModel.terminate();
    });
    
    test('should handle model in error state', async () => {
      // Create a model that will be in error state
      class ErrorModel extends StandardModel {
        getState(): ModelState {
          const state = super.getState();
          state.lifecycle = ModelLifecycleState.Error;
          return state;
        }
      }
      
      const errorModel = new ErrorModel({ name: 'error-model' });
      await errorModel.initialize();
      
      // Create test adapter for the model
      const modelAdapter = createModelTestAdapter(errorModel);
      
      // Create and initialize test framework
      const testFramework = createTestFramework({ debug: true });
      await testFramework.initialize();
      
      // Register the model with the test framework
      testFramework.register(modelAdapter);
      
      // Run tests
      const results = await testFramework.runAll();
      
      // Get the key for our test subject
      const testSubjectKey = Object.keys(results)[0];
      
      // Verify the base validation fails
      expect(results[testSubjectKey].baseValidation).toBeDefined();
      expect(results[testSubjectKey].baseValidation.status).toBe(TestResultStatus.Failed);
      expect(results[testSubjectKey].baseValidation.error).toContain('error state');
      
      // Cleanup
      await testFramework.terminate();
      await errorModel.terminate();
    });
  });
});
