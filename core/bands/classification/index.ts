/**
 * Band Classification Module
 * ==========================
 * 
 * Core band classification and selection functionality.
 */

// Import classes
import { BandClassifier } from './band-classifier';
import { BandSelectorImpl } from './band-selector';

// Export main classes
export { BandClassifier } from './band-classifier';
export { BandSelectorImpl as BandSelector } from './band-selector';

// Create factory functions
export function createBandClassifier(options?: { cacheSize?: number }) {
  return new BandClassifier(options);
}

export function createBandSelector(classifier?: BandClassifier, options?: any) {
  const bandClassifier = classifier || new BandClassifier();
  return new BandSelectorImpl(bandClassifier, options);
}

// Re-export types for convenience
export type {
  BandClassification,
  BandOptimizationResult,
  BandConfiguration,
  BandSelectorOptions,
  NumberCharacteristics
} from '../types';
