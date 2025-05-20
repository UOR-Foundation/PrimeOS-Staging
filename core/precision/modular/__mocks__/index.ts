/**
 * Modular Arithmetic Module Mocks Export
 * 
 * This file exports mocks for the modular arithmetic module that can be used by other modules
 * in their tests.
 */

// Re-export model and logging mocks
export * from './os-model-mock';
export * from './os-logging-mock';
export * from './test-mock';

// Export constants
export { MODULAR_CONSTANTS } from './test-mock';

// Export factory function
export { createMockModularOperations } from './test-mock';
