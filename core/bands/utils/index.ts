/**
 * Band Optimization Utilities
 * ===========================
 * 
 * Shared utilities for band optimization operations.
 */

// Export all constants
export * from './constants';

// Export all helper functions
export * from './helpers';

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
