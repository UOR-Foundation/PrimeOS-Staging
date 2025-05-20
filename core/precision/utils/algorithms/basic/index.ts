/**
 * Basic Mathematical Operations
 * ==========================
 * 
 * Exports for basic mathematical operations.
 */

import { createGcdFunctions } from './gcd';
import { createSqrtFunctions } from './sqrt';
import { createDivisionFunctions } from './division';
import { UtilityOptions } from '../../types';

/**
 * Create all basic mathematical operations with the specified options
 */
export function createBasicOperations(options: UtilityOptions = {}) {
  const gcdFunctions = createGcdFunctions(options);
  const sqrtFunctions = createSqrtFunctions(options);
  const divisionFunctions = createDivisionFunctions(options);
  
  return {
    ...gcdFunctions,
    ...sqrtFunctions,
    ...divisionFunctions
  };
}

// Re-export individual function creators for direct use
export { createGcdFunctions, createSqrtFunctions, createDivisionFunctions };
