/**
 * Model Test Adapter
 * =================
 * 
 * This file provides an adapter for making models testable using the os-tests framework.
 * It implements the TestableInterface from os-tests to allow models to be registered
 * and tested using the standard testing framework.
 */

import { 
  ModelInterface, 
  ModelState, 
  ModelLifecycleState, 
  ModelResult 
} from './types';
import { 
  TestableInterface, 
  TestResult, 
  TestResults, 
  TestResultStatus, 
  TestMetadata,
  modelResultToTestResult
} from '../os-tests';

/**
 * Test adapter for model instances
 * This class wraps a model instance and makes it testable using the os-tests framework
 */
export class ModelTestAdapter implements TestableInterface {
  private model: ModelInterface;
  private testCases: Array<{name: string, input: any, expectedResult?: any}> = [];
  private tags: string[] = ['model'];
  
  /**
   * Create a new model test adapter
   */
  constructor(model: ModelInterface, options?: {
    tags?: string[];
    testCases?: Array<{name: string, input: any, expectedResult?: any}>;
  }) {
    this.model = model;
    
    if (options?.tags) {
      this.tags = [...this.tags, ...options.tags];
    }
    
    if (options?.testCases) {
      this.testCases = [...this.testCases, ...options.testCases];
    }
    
    // Add default test cases if none provided
    if (this.testCases.length === 0) {
      this.testCases = [
        { name: 'model-initialization', input: null },
        { name: 'model-simple-process', input: 'test-data' },
        { name: 'model-reset', input: null },
      ];
    }
  }
  
  /**
   * Validate base requirements for the model
   */
  validateBase(): TestResult {
    try {
      // Check if model is initialized
      const state = this.model.getState();
      
      if (state.lifecycle === ModelLifecycleState.Error) {
        return {
          id: 'model-base-validation',
          status: TestResultStatus.Failed,
          error: 'Model is in error state',
          duration: 0,
          timestamp: Date.now(),
          source: 'model-test-adapter'
        };
      }
      
      if (state.lifecycle !== ModelLifecycleState.Ready) {
        return {
          id: 'model-base-validation',
          status: TestResultStatus.Failed,
          error: `Model is not ready (current state: ${state.lifecycle})`,
          duration: 0,
          timestamp: Date.now(),
          source: 'model-test-adapter'
        };
      }
      
      // All checks passed
      return {
        id: 'model-base-validation',
        status: TestResultStatus.Passed,
        duration: 0,
        timestamp: Date.now(),
        source: 'model-test-adapter'
      };
    } catch (error) {
      return {
        id: 'model-base-validation',
        status: TestResultStatus.Error,
        error: error instanceof Error ? error.message : String(error),
        duration: 0,
        timestamp: Date.now(),
        source: 'model-test-adapter'
      };
    }
  }
  
  /**
   * Run tests for the model
   */
  async runTests(): Promise<TestResults> {
    const results: TestResults = {};
    const startTime = Date.now();
    
    for (const testCase of this.testCases) {
      const caseStartTime = Date.now();
      
      try {
        // Special handling for initialization and reset test cases
        if (testCase.name === 'model-initialization') {
          // Model should already be initialized, so just check state
          const state = this.model.getState();
          
          results[testCase.name] = {
            id: testCase.name,
            status: state.lifecycle === ModelLifecycleState.Ready ? 
              TestResultStatus.Passed : TestResultStatus.Failed,
            error: state.lifecycle !== ModelLifecycleState.Ready ? 
              `Model not in ready state: ${state.lifecycle}` : undefined,
            duration: Date.now() - caseStartTime,
            timestamp: Date.now(),
            source: 'model-test-adapter'
          };
          continue;
        }
        
        if (testCase.name === 'model-reset') {
          // Test reset functionality
          const resetResult = await this.model.reset();
          
          results[testCase.name] = modelResultToTestResult(
            resetResult, 
            testCase.name, 
            'model-test-adapter'
          );
          
          continue;
        }
        
        // Standard process test
        const result = await this.model.process(testCase.input);
        
        // If expected result is provided, validate against it
        if (testCase.expectedResult !== undefined) {
          if (JSON.stringify(result.data) !== JSON.stringify(testCase.expectedResult)) {
            results[testCase.name] = {
              id: testCase.name,
              status: TestResultStatus.Failed,
              error: `Expected ${JSON.stringify(testCase.expectedResult)} but got ${JSON.stringify(result.data)}`,
              duration: Date.now() - caseStartTime,
              timestamp: Date.now(),
              source: 'model-test-adapter'
            };
            continue;
          }
        }
        
        // Default pass-through of result
        results[testCase.name] = modelResultToTestResult(
          result, 
          testCase.name, 
          'model-test-adapter'
        );
      } catch (error) {
        results[testCase.name] = {
          id: testCase.name,
          status: TestResultStatus.Error,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - caseStartTime,
          timestamp: Date.now(),
          source: 'model-test-adapter'
        };
      }
    }
    
    return results;
  }
  
  /**
   * Get metadata about the tests for this module
   */
  getTestMetadata(): TestMetadata {
    // Get the module name from the source property of a result
    // which will contain the module identifier (name@version or id)
    const testResult = this.model.createResult(true);
    const sourceParts = testResult.source.split('@');
    
    return {
      moduleName: `model-${sourceParts[0] || 'unnamed'}`,
      version: sourceParts.length > 1 ? sourceParts[1] : '0.1.0',
      testCount: this.testCases.length,
      tags: this.tags
    };
  }
}

/**
 * Create a test adapter for a model instance
 */
export function createModelTestAdapter(
  model: ModelInterface, 
  options?: {
    tags?: string[];
    testCases?: Array<{name: string, input: any, expectedResult?: any}>;
  }
): TestableInterface {
  return new ModelTestAdapter(model, options);
}
