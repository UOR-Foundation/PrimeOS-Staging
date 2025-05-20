/**
 * Mathematical Utility Algorithms
 * ============================
 * 
 * Consolidated exports of all algorithm implementations.
 */

import { UtilityOptions } from '../types';
import { createBasicOperations } from './basic';
import { createBitOperations } from './bit';

/**
 * Create all mathematical utility algorithms with the specified options
 */
export function createMathUtilsAlgorithms(options: UtilityOptions = {}) {
  // Create individual algorithm groups
  const basicOperations = createBasicOperations(options);
  const bitOperations = createBitOperations(options);
  
  // Return consolidated algorithms
  return {
    ...basicOperations,
    ...bitOperations
  };
}

// Re-export individual algorithm creators for direct use
export { createBasicOperations, createBitOperations };

// Re-export from basic
export * from './basic';

// Re-export from bit
export * from './bit';
