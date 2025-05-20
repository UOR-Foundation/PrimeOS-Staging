/**
 * Modular Arithmetic Algorithms
 * ==========================
 * 
 * Exports all modular arithmetic algorithm implementations.
 */

// Export basic operations
export * from './basic';

// Export GCD and LCM operations
export * from './gcd';

// Export exponentiation operations
export * from './exponentiation';

// Export advanced algorithms
export * from './advanced';

/**
 * Create a comprehensive set of modular arithmetic operations
 * with consistent options
 */
import { 
  createMemoizedBasicOperations, 
  BasicModularOptions 
} from './basic';

import { 
  createMemoizedGcdLcmOperations, 
  GcdLcmOptions 
} from './gcd';

import { 
  createMemoizedExponentiationOperations, 
  ExponentiationOptions 
} from './exponentiation';

import { 
  createMemoizedAdvancedOperations, 
  AdvancedModularOptions 
} from './advanced';

/**
 * Combined options for all modular operations
 */
export interface ModularAlgorithmOptions extends 
  BasicModularOptions, 
  GcdLcmOptions, 
  ExponentiationOptions, 
  AdvancedModularOptions {}

/**
 * Create a comprehensive set of modular arithmetic operations
 */
export function createModularAlgorithms(
  options: Partial<ModularAlgorithmOptions> = {}
) {
  // Create operations with consistent options
  const basicOps = createMemoizedBasicOperations(options);
  const gcdLcmOps = createMemoizedGcdLcmOperations(options);
  const expOps = createMemoizedExponentiationOperations(options);
  const advancedOps = createMemoizedAdvancedOperations(options);
  
  // Combine all operations
  return {
    ...basicOps,
    ...gcdLcmOps,
    ...expOps,
    ...advancedOps
  };
}
