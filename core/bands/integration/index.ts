/**
 * Integration Adapters
 * ===================
 * 
 * Integration adapters for seamless interoperability with other PrimeOS core modules.
 * Provides band-optimized integration with prime, encoding, stream, and precision modules.
 */

import {
  BandType,
  BandConfig,
  BandMetrics,
  ProcessingContext,
  ProcessingResult
} from '../types';

import {
  getBitSizeForBand,
  getExpectedAcceleration
} from '../utils/constants';

// Import and re-export all adapters
import { PrimeAdapter, createPrimeAdapter } from './prime-adapter';
import { EncodingAdapter, createEncodingAdapter } from './encoding-adapter';
import { StreamAdapter, createStreamAdapter } from './stream-adapter';
import { PrecisionAdapter, createPrecisionAdapter } from './precision-adapter';

// Import enhanced adapters
import { EnhancedPrimeAdapter, createEnhancedPrimeAdapter } from './prime-adapter-enhanced';
import { EnhancedEncodingAdapter, createEnhancedEncodingAdapter } from './encoding-adapter-enhanced';
import { EnhancedStreamAdapter, createEnhancedStreamAdapter } from './stream-adapter-enhanced';
import { EnhancedPrecisionAdapter, createEnhancedPrecisionAdapter } from './precision-adapter-enhanced';

// Re-export for external use
export { PrimeAdapter, createPrimeAdapter };
export { EncodingAdapter, createEncodingAdapter };
export { StreamAdapter, createStreamAdapter };
export { PrecisionAdapter, createPrecisionAdapter };

// Re-export enhanced adapters
export { EnhancedPrimeAdapter, createEnhancedPrimeAdapter };
export { EnhancedEncodingAdapter, createEnhancedEncodingAdapter };
export { EnhancedStreamAdapter, createEnhancedStreamAdapter };
export { EnhancedPrecisionAdapter, createEnhancedPrecisionAdapter };

/**
 * Integration manager coordinates all adapters
 */
export interface IntegrationManager {
  // Adapter management
  registerAdapter(name: string, adapter: any): void;
  getAdapter(name: string): any;
  listAdapters(): string[];
  
  // Cross-module optimization
  optimizeAcrossModules(data: any[], band: BandType): Promise<ProcessingResult>;
  
  // Unified processing
  processWithBestModule(data: any, context: ProcessingContext): Promise<ProcessingResult>;
}

/**
 * Integration configuration
 */
export interface IntegrationConfig {
  enablePrimeIntegration: boolean;
  enableEncodingIntegration: boolean;
  enableStreamIntegration: boolean;
  enablePrecisionIntegration: boolean;
  crossModuleOptimization: boolean;
  adaptiveSelection: boolean;
}

/**
 * Default integration configuration
 */
const DEFAULT_INTEGRATION_CONFIG: IntegrationConfig = {
  enablePrimeIntegration: true,
  enableEncodingIntegration: true,
  enableStreamIntegration: true,
  enablePrecisionIntegration: true,
  crossModuleOptimization: true,
  adaptiveSelection: true
};

/**
 * Integration manager implementation
 */
export class IntegrationManagerImpl implements IntegrationManager {
  private adapters = new Map<string, any>();
  private config: IntegrationConfig;
  
  constructor(config: Partial<IntegrationConfig> = {}) {
    this.config = { ...DEFAULT_INTEGRATION_CONFIG, ...config };
  }
  
  registerAdapter(name: string, adapter: any): void {
    this.adapters.set(name, adapter);
  }
  
  getAdapter(name: string): any {
    return this.adapters.get(name);
  }
  
  listAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }
  
  async optimizeAcrossModules(data: any[], band: BandType): Promise<ProcessingResult> {
    // Find best combination of modules for this band and data
    const candidates = [];
    
    if (this.config.enablePrimeIntegration && this.adapters.has('prime')) {
      const primeAdapter = this.adapters.get('prime');
      const score = await primeAdapter.evaluatePerformance(data, band);
      candidates.push({ module: 'prime', adapter: primeAdapter, score });
    }
    
    if (this.config.enableEncodingIntegration && this.adapters.has('encoding')) {
      const encodingAdapter = this.adapters.get('encoding');
      const score = await encodingAdapter.evaluatePerformance(data, band);
      candidates.push({ module: 'encoding', adapter: encodingAdapter, score });
    }
    
    // Select best candidate
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    
    if (best) {
      return await best.adapter.process(data, band);
    }
    
    throw new Error('No suitable adapter found for cross-module optimization');
  }
  
  async processWithBestModule(data: any, context: ProcessingContext): Promise<ProcessingResult> {
    // Adaptive selection of best module for the context
    const scores = new Map<string, number>();
    
    for (const [name, adapter] of this.adapters) {
      if (adapter.supportsContext && adapter.supportsContext(context)) {
        const score = await adapter.evaluateContext(context);
        scores.set(name, score);
      }
    }
    
    // Find highest scoring adapter
    let bestAdapter = null;
    let bestScore = -1;
    
    for (const [name, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestAdapter = this.adapters.get(name);
      }
    }
    
    if (bestAdapter) {
      return await bestAdapter.processInContext(data, context);
    }
    
    throw new Error('No adapter supports the given context');
  }
}

/**
 * Create integration manager with default adapters
 */
export function createIntegrationManager(
  config: Partial<IntegrationConfig> = {},
  modules: {
    primeRegistry?: any;
    encodingModule?: any;
    streamProcessor?: any;
    precisionModule?: any;
  } = {}
): IntegrationManager {
  const manager = new IntegrationManagerImpl(config);
  
  // Register available adapters
  if (modules.primeRegistry && config.enablePrimeIntegration !== false) {
    manager.registerAdapter('prime', createPrimeAdapter(modules.primeRegistry));
  }
  
  if (modules.encodingModule && config.enableEncodingIntegration !== false) {
    manager.registerAdapter('encoding', createEncodingAdapter(modules.encodingModule));
  }
  
  if (modules.streamProcessor && config.enableStreamIntegration !== false) {
    manager.registerAdapter('stream', createStreamAdapter(modules.streamProcessor));
  }
  
  if (modules.precisionModule && config.enablePrecisionIntegration !== false) {
    manager.registerAdapter('precision', createPrecisionAdapter(modules.precisionModule));
  }
  
  return manager;
}

/**
 * Integration utilities
 */
export const IntegrationUtils = {
  /**
   * Detect optimal band for cross-module processing
   */
  detectOptimalBand(data: any[], moduleCapabilities: Map<string, BandType[]>): BandType {
    // Advanced band selection using weighted scoring algorithm
    const bandScores = new Map<BandType, number>();
    
    // Initialize scores for all bands
    const allBands = [BandType.ULTRABASS, BandType.BASS, BandType.MIDRANGE, 
                     BandType.UPPER_MID, BandType.TREBLE, BandType.SUPER_TREBLE,
                     BandType.ULTRASONIC_1, BandType.ULTRASONIC_2];
    
    for (const band of allBands) {
      bandScores.set(band, 0);
    }
    
    // Module capability alignment (40% weight)
    for (const capabilities of moduleCapabilities.values()) {
      for (const band of capabilities) {
        bandScores.set(band, (bandScores.get(band) || 0) + 0.4);
      }
    }
    
    // Data size optimization (30% weight)
    const avgDataSize = data.length > 0 ? 
      data.reduce((sum, item) => sum + (typeof item === 'string' ? item.length : 
                                      typeof item === 'number' ? Math.abs(item) : 
                                      JSON.stringify(item).length), 0) / data.length : 0;
    
    for (const band of allBands) {
      const bitRange = getBitSizeForBand(band);
      const dataBits = Math.log2(avgDataSize + 1);
      const sizeScore = (dataBits >= bitRange.min && dataBits <= bitRange.max) ? 1.0 : 
                       Math.max(0.1, 1.0 - Math.abs(dataBits - (bitRange.min + bitRange.max) / 2) / bitRange.max);
      bandScores.set(band, (bandScores.get(band) || 0) + sizeScore * 0.3);
    }
    
    // Expected acceleration (20% weight)
    for (const band of allBands) {
      const acceleration = getExpectedAcceleration(band);
      const normalizedAccel = Math.min(acceleration / 10, 1);
      bandScores.set(band, (bandScores.get(band) || 0) + normalizedAccel * 0.2);
    }
    
    // Complexity alignment (10% weight)
    const complexity = Math.min(data.length / 1000, 1.0);
    for (const band of allBands) {
      const complexityScore = 1.0 - Math.abs(complexity - (allBands.indexOf(band) / allBands.length));
      bandScores.set(band, (bandScores.get(band) || 0) + complexityScore * 0.1);
    }
    
    // Find highest scoring band
    let bestBand = BandType.MIDRANGE;
    let maxScore = -1;
    
    for (const [band, score] of bandScores) {
      if (score > maxScore) {
        maxScore = score;
        bestBand = band;
      }
    }
    
    return bestBand;
  },
  
  /**
   * Combine processing results from multiple modules
   */
  combineResults(results: ProcessingResult[]): ProcessingResult {
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      const defaultMetrics: BandMetrics = {
        throughput: 0, latency: 0, memoryUsage: 0, cacheHitRate: 0,
        accelerationFactor: 0, errorRate: 1, primeGeneration: 0,
        factorizationRate: 0, spectralEfficiency: 0, distributionBalance: 0,
        precision: 0, stability: 0, convergence: 0
      };
      
      const defaultQuality = { precision: 0, accuracy: 0, completeness: 0, consistency: 0, reliability: 0 };
      
      const firstResult = results.length > 0 ? results[0] : null;
      
      return {
        success: false,
        metrics: (firstResult && firstResult.metrics) ? firstResult.metrics : defaultMetrics,
        quality: (firstResult && firstResult.quality) ? firstResult.quality : defaultQuality,
        error: 'All module processing failed'
      };
    }
    
    // Combine metrics by averaging
    const combinedMetrics: BandMetrics = {
      throughput: 0,
      latency: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      accelerationFactor: 0,
      errorRate: 0,
      primeGeneration: 0,
      factorizationRate: 0,
      spectralEfficiency: 0,
      distributionBalance: 0,
      precision: 0,
      stability: 0,
      convergence: 0
    };
    
    for (const result of successfulResults) {
      combinedMetrics.throughput += result.metrics.throughput;
      combinedMetrics.latency += result.metrics.latency;
      combinedMetrics.memoryUsage += result.metrics.memoryUsage;
      combinedMetrics.cacheHitRate += result.metrics.cacheHitRate;
      combinedMetrics.accelerationFactor += result.metrics.accelerationFactor;
      combinedMetrics.errorRate += result.metrics.errorRate;
      combinedMetrics.primeGeneration += result.metrics.primeGeneration;
      combinedMetrics.factorizationRate += result.metrics.factorizationRate;
      combinedMetrics.spectralEfficiency += result.metrics.spectralEfficiency;
      combinedMetrics.distributionBalance += result.metrics.distributionBalance;
      combinedMetrics.precision += result.metrics.precision;
      combinedMetrics.stability += result.metrics.stability;
      combinedMetrics.convergence += result.metrics.convergence;
    }
    
    const count = successfulResults.length;
    combinedMetrics.throughput /= count;
    combinedMetrics.latency /= count;
    combinedMetrics.memoryUsage /= count;
    combinedMetrics.cacheHitRate /= count;
    combinedMetrics.accelerationFactor /= count;
    combinedMetrics.errorRate /= count;
    combinedMetrics.primeGeneration /= count;
    combinedMetrics.factorizationRate /= count;
    combinedMetrics.spectralEfficiency /= count;
    combinedMetrics.distributionBalance /= count;
    combinedMetrics.precision /= count;
    combinedMetrics.stability /= count;
    combinedMetrics.convergence /= count;
    
    // Use first successful result's data and quality
    return {
      success: true,
      result: successfulResults[0].result,
      metrics: combinedMetrics,
      quality: successfulResults[0].quality
    };
  }
};
