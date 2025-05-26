/**
 * Utility Functions - Main Entry Point
 * ===================================
 * 
 * This file is the main entry point for the utils module, which provides
 * mathematical utility functions with enhanced precision for the PrimeOS ecosystem.
 * 
 * The module has been split into logical components for better maintainability:
 * - core-functions.ts: Core utility function implementations
 * - math-utils.ts: MathUtils wrapper class and default exports
 * - model.ts: PrimeOS Model interface implementation
 */

// Import from core functions
import { createMathUtils } from './core-functions';

// Import from math utils wrapper
import {
  MathUtils,
  bitLength,
  exactlyEquals,
  toByteArray,
  fromByteArray,
  isSafeInteger,
  sign,
  abs,
  isPowerOfTwo,
  gcd,
  lcm,
  extendedGcd,
  integerSqrt,
  ceilDiv,
  floorDiv,
  countSetBits,
  leadingZeros,
  trailingZeros
} from './math-utils';

// Import from model implementation
import {
  MathUtilsImpl,
  createMathUtilsModel,
  createAndInitializeMathUtilsModel
} from './model';

// Import cache registry for cleanup
import { clearAllRegisteredCaches } from '../cache-registry';

// Re-export everything for external use
export { createMathUtils } from './core-functions';

export {
  MathUtils,
  bitLength,
  exactlyEquals,
  toByteArray,
  fromByteArray,
  isSafeInteger,
  sign,
  abs,
  isPowerOfTwo,
  gcd,
  lcm,
  extendedGcd,
  integerSqrt,
  ceilDiv,
  floorDiv,
  countSetBits,
  leadingZeros,
  trailingZeros
} from './math-utils';

export {
  MathUtilsImpl,
  createMathUtilsModel,
  createAndInitializeMathUtilsModel
} from './model';

// Re-export types and constants
export * from './types';
export { UTILITY_CONSTANTS } from './types';

/**
 * Create a unified math utilities object that combines all functionality
 */
export const MathUtilities = {
  // Core utility functions
  bitLength,
  exactlyEquals,
  toByteArray,
  fromByteArray,
  isSafeInteger,
  sign,
  abs,
  isPowerOfTwo,
  
  // Advanced mathematical functions
  gcd,
  lcm,
  extendedGcd,
  integerSqrt,
  ceilDiv,
  floorDiv,
  countSetBits,
  leadingZeros,
  trailingZeros,
  
  // Factory functions
  createMathUtils,
  createMathUtilsModel,
  createAndInitializeMathUtilsModel
};

/**
 * Clear all caches used by the utils module
 */
export async function clearAllCaches(): Promise<void> {
  // Clear all registered caches
  await clearAllRegisteredCaches();
  
  // Also clear any module-specific caches that might not be registered
  try {
    // The individual modules should handle their own cache clearing
    // This is a fallback for any unregistered caches
    console.debug('Utils module caches cleared');
  } catch (error) {
    console.error('Error clearing utils module caches:', error);
  }
}

/**
 * Return the version of the utils module
 */
export function getVersion(): string {
  return "1.0.0";
}

/**
 * Default utils module instance with standard configuration
 */
export const utils = {
  // Include all utilities
  ...MathUtilities,
  
  // Module management
  clearAllCaches,
  getVersion
};

// For backward compatibility, also export as default
export default utils;
