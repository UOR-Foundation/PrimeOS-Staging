/**
 * Mocks Tests
 * ===========
 * 
 * Test suite for the mock implementations.
 */

// Add Jest types reference to make TypeScript recognize test functions
/// <reference types="jest" />

import { 
  BaseModel, 
  ModelLifecycleState, 
  ModelResult,
  ModelOptions
} from './model-mock';

import {
  createLogging,
  LogLevel
} from './logging-mock';

describe('Model Mock Implementation', () => {
  // Simple model implementation for testing
  class TestModel extends BaseModel {
    constructor(options: ModelOptions = {}) {
      super({
        name: 'test-model',
        ...options
      });
    }
    
    protected async onInitialize(): Promise<void> {
      // Custom initialization logic
    }
    
    protected async onProcess<T, R>(input: T): Promise<R> {
      // Simple echo processor
      return input as unknown as R;
    }
    
    protected async onReset(): Promise<void> {
      // Custom reset logic
    }
    
    protected async onTerminate(): Promise<void> {
      // Custom termination logic
    }
  }
  
  let model: TestModel;
  
  beforeEach(() => {
    model = new TestModel();
  });
  
  describe('Lifecycle Management', () => {
    test('should initialize correctly', async () => {
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Uninitialized);
      
      const result = await model.initialize();
      expect(result.success).toBe(true);
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Ready);
    });
    
    test('should process data', async () => {
      await model.initialize();
      
      const input = { test: 'value' };
      const result = await model.process(input);
      
      expect(result).toEqual(input);
      expect(model.getState().operationCount.total).toBe(1);
      expect(model.getState().operationCount.success).toBe(1);
    });
    
    test('should handle process errors', async () => {
      await model.initialize();
      
      // Override onProcess to throw an error
      jest.spyOn(model as any, 'onProcess').mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      
      await expect(model.process({ test: 'value' })).rejects.toThrow('Test error');
      
      expect(model.getState().operationCount.total).toBe(1);
      expect(model.getState().operationCount.failed).toBe(1);
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Error);
    });
    
    test('should reset state', async () => {
      await model.initialize();
      await model.process({ test: 'value' });
      
      const result = await model.reset();
      expect(result.success).toBe(true);
      
      // Check that operation counts are reset
      expect(model.getState().operationCount.total).toBe(0);
      expect(model.getState().operationCount.success).toBe(0);
      expect(model.getState().operationCount.failed).toBe(0);
    });
    
    test('should terminate correctly', async () => {
      await model.initialize();
      
      const result = await model.terminate();
      expect(result.success).toBe(true);
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Terminated);
    });
  });
  
  describe('Utility Methods', () => {
    test('should create results correctly', () => {
      // Success result
      const successResult = model.createResult(true, { data: 'test' });
      expect(successResult.success).toBe(true);
      expect(successResult.data).toEqual({ data: 'test' });
      expect(successResult.error).toBeUndefined();
      expect(successResult.source).toBe('test-model');
      
      // Error result
      const errorResult = model.createResult(false, undefined, 'Test error');
      expect(errorResult.success).toBe(false);
      expect(errorResult.data).toBeUndefined();
      expect(errorResult.error).toBe('Test error');
      expect(errorResult.source).toBe('test-model');
    });
  });
});

describe('Logging Mock Implementation', () => {
  test('should create logging instance', () => {
    const logger = createLogging({ name: 'test-logger' });
    
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.fatal).toBe('function');
  });
  
  test('logging methods should resolve', async () => {
    const logger = createLogging();
    
    await expect(logger.debug('test')).resolves.toBeUndefined();
    await expect(logger.info('test')).resolves.toBeUndefined();
    await expect(logger.warn('test')).resolves.toBeUndefined();
    await expect(logger.error('test')).resolves.toBeUndefined();
    await expect(logger.fatal('test')).resolves.toBeUndefined();
  });
  
  test('should initialize and terminate', async () => {
    const logger = createLogging();
    
    await expect(logger.initialize()).resolves.toEqual({ success: true });
    await expect(logger.terminate()).resolves.toEqual({ success: true });
  });
  
  test('should get state', () => {
    const logger = createLogging();
    const state = logger.getState();
    
    expect(state).toEqual({ lifecycle: 'ready', logs: [] });
  });
});

describe('Mock Integration', () => {
  test('mocks should be compatible with each other', async () => {
    const model = new BaseModel({ name: 'integration-test' });
    const logger = createLogging({ name: 'integration-logger' });
    
    // We can use the logger in the model
    (model as any).logger = logger;
    
    // Everything should still work
    await model.initialize();
    expect(model.getState().lifecycle).toBe(ModelLifecycleState.Ready);
    
    // Logger methods should not throw
    await expect(logger.info('Using logger with model')).resolves.toBeUndefined();
    
    await model.terminate();
  });
});
