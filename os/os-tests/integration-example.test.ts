/**
 * Integration Example Test
 * =======================
 * 
 * This file demonstrates how to use the mock implementations
 * to test a module that depends on both the model and logging systems.
 */

/// <reference types="jest" />

import { BaseModel, ModelInterface, ModelOptions, ModelLifecycleState } from './mocks/model-mock';
import { createLogging, LoggingInterface } from './mocks/logging-mock';

/**
 * Example module that implements the Model interface and uses logging
 */
class ExampleModule extends BaseModel {
  private counter: number = 0;
  protected logger: LoggingInterface;
  
  constructor(options: ModelOptions = {}) {
    super({
      name: 'example-module',
      version: '1.0.0',
      ...options
    });
    
    // Create logger
    this.logger = createLogging({ name: 'example-module-logger' });
  }
  
  protected async onInitialize(): Promise<void> {
    await this.logger.info('Example module initializing');
    this.counter = 0;
  }
  
  protected async onProcess<T, R>(input: T): Promise<R> {
    await this.logger.debug('Processing input', input);
    
    if (typeof input === 'number') {
      this.counter += input as number;
      return this.counter as unknown as R;
    }
    
    if (typeof input === 'string' && input === 'getCounter') {
      return this.counter as unknown as R;
    }
    
    throw new Error('Unsupported input type');
  }
  
  protected async onReset(): Promise<void> {
    await this.logger.info('Resetting example module');
    this.counter = 0;
  }
  
  protected async onTerminate(): Promise<void> {
    await this.logger.info('Example module terminating');
  }
  
  // Public method for testing
  public getCounter(): number {
    return this.counter;
  }
}

/**
 * Tests for the example module that demonstrate how mocks are used
 */
describe('Integration Example', () => {
  let module: ExampleModule;
  
  beforeEach(async () => {
    // Create and initialize the module
    module = new ExampleModule();
    await module.initialize();
  });
  
  afterEach(async () => {
    // Clean up
    await module.terminate();
  });
  
  test('module initializes correctly', () => {
    expect(module.getState().lifecycle).toBe(ModelLifecycleState.Ready);
    expect(module.getCounter()).toBe(0);
  });
  
  test('module processes numeric input', async () => {
    // Process some values
    let result = await module.process(5);
    expect(result).toBe(5);
    
    result = await module.process(10);
    expect(result).toBe(15);
    
    // Verify counter state
    expect(module.getCounter()).toBe(15);
  });
  
  test('module processes string commands', async () => {
    // Set counter value
    await module.process(7);
    
    // Get counter via command
    const result = await module.process('getCounter');
    expect(result).toBe(7);
  });
  
  test('module rejects invalid input', async () => {
    await expect(module.process({ invalid: true })).rejects.toThrow('Unsupported input type');
  });
  
  test('module resets state', async () => {
    // Set counter value
    await module.process(42);
    expect(module.getCounter()).toBe(42);
    
    // Reset the module
    const resetResult = await module.reset();
    expect(resetResult.success).toBe(true);
    
    // Verify counter is reset
    expect(module.getCounter()).toBe(0);
  });
  
  test('module operation counts are tracked', async () => {
    // Perform some operations
    await module.process(1);
    await module.process(2);
    await module.process(3);
    
    // Verify operation counts
    const state = module.getState();
    expect(state.operationCount.total).toBe(3);
    expect(state.operationCount.success).toBe(3);
    expect(state.operationCount.failed).toBe(0);
  });
  
  test('module error handling works correctly', async () => {
    // Trigger an error
    try {
      await module.process({ invalid: true });
    } catch (error) {
      // Expected error
    }
    
    // Verify operation counts
    const state = module.getState();
    expect(state.operationCount.total).toBe(1);
    expect(state.operationCount.success).toBe(0);
    expect(state.operationCount.failed).toBe(1);
    expect(state.lifecycle).toBe(ModelLifecycleState.Error);
  });
});
