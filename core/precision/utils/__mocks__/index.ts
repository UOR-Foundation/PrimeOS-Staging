/**
 * Utility Module Mocks Export
 * ==========================
 * 
 * This file exports mocks for the utility module that can be used by other modules
 * in their tests. It follows the PrimeOS module pattern for mocking.
 */

// Re-export model and logging mocks
export * from './os-model-mock';
export * from './os-logging-mock';

// Export utility specific mocks
export * from './test-mock';

// Import the original types from the utility module
import { 
  MathUtilsInterface, 
  MathUtilsModelInterface,
  MathUtilsModelOptions,
  MathUtilsModelState,
  MathUtilsProcessInput,
  UTILITY_CONSTANTS
} from '../types';

// Re-export the types for convenience
export {
  MathUtilsInterface, 
  MathUtilsModelInterface,
  MathUtilsModelOptions,
  MathUtilsModelState,
  MathUtilsProcessInput,
  UTILITY_CONSTANTS
};

// Re-export the main createMockMathUtils function as the default factory
export { 
  createMockMathUtils, 
  createMockMathUtilsModel,
  mockMathUtils,
  mockMathUtilsModel,
  UTILS_MOCK_CONSTANTS
} from './test-mock';

// Import Jest globals to use in the test function
import { describe, it, expect } from '@jest/globals';

// Create a convenient test function to run all tests in this directory
export function runUtilsMockTests() {
  describe('Utility Mocks Test Runner', () => {
    it('successfully loads mock tests', () => {
      // This is just a simple test to verify the test runner works
      expect(true).toBe(true);
    });
  });
  
  // Import and run the mock tests
  require('./mock.test.ts');
}
