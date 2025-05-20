/**
 * Bit Manipulation Operations
 * ========================
 * 
 * Exports for bit manipulation operations.
 */

import { createBitCountingFunctions } from './counting';
import { UtilityOptions } from '../../types';

/**
 * Create all bit manipulation operations with the specified options
 */
export function createBitOperations(options: UtilityOptions = {}) {
  const bitCountingFunctions = createBitCountingFunctions(options);
  
  return {
    ...bitCountingFunctions
  };
}

// Re-export individual function creators for direct use
export { createBitCountingFunctions };
