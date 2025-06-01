/**
 * Enhanced Band Optimization Utilities
 * ====================================
 * 
 * Complete utility suite with core module integration and enhanced functionality.
 * Replaces primitive utils with production-quality implementations.
 */

// Export enhanced constants with core module integration
export * from './constants-enhanced';

// Export enhanced helper functions with real mathematical analysis
export * from './helpers-enhanced';

// Re-export common types for convenience
export type {
  BandType,
  ProcessingStrategy,
  WindowFunction,
  BandClassification,
  NumberCharacteristics,
  BandMetrics,
  QualityMetrics
} from '../types';

// Import initialization functions
import { initializeConstants } from './constants-enhanced';
import { initializeHelpers } from './helpers-enhanced';

// Export initialization functions for easy setup
export { initializeConstants, initializeHelpers };

/**
 * Initialize all enhanced utilities with core modules
 */
export async function initializeEnhancedUtils(modules: {
  primeRegistry?: any;
  precisionModule?: any;
  encodingModule?: any;
  streamProcessor?: any;
}): Promise<void> {
  // Initialize enhanced constants
  await initializeConstants(modules);
  
  // Initialize enhanced helpers
  initializeHelpers(modules);
}

/**
 * Utility to check if enhanced utils are properly initialized
 */
export function validateEnhancedUtilsIntegration(): {
  constants: boolean;
  helpers: boolean;
  coreModules: {
    primeRegistry: boolean;
    precisionModule: boolean;
    encodingModule: boolean;
    streamProcessor: boolean;
  };
  overallHealth: number;
} {
  const { validateCoreModuleIntegration } = require('./helpers-enhanced');
  const integration = validateCoreModuleIntegration();
  
  return {
    constants: true, // Enhanced constants are always available
    helpers: true,   // Enhanced helpers are always available
    coreModules: {
      primeRegistry: integration.primeRegistry,
      precisionModule: integration.precisionModule,
      encodingModule: integration.encodingModule,
      streamProcessor: integration.streamProcessor
    },
    overallHealth: integration.overallHealth
  };
}
