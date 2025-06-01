/**
 * Band Registry Module
 * ===================
 * 
 * Central registry for band configurations and management with core module integration.
 */

export * from './band-registry';
export * from './band-registry-enhanced';

// Re-export for convenience
export { BandRegistryImpl as BandRegistry } from './band-registry-enhanced';
export { createBandRegistry, createAndInitializeBandRegistry } from './band-registry-enhanced';
