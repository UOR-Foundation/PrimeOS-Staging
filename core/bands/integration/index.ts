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

// Re-export all adapters
export { PrimeAdapter, createPrimeAdapter } from './prime-adapter';
export { EncodingAdapter, createEncodingAdapter } from './encoding-adapter';
export { StreamAdapter, createStreamAdapter } from './stream-adapter';
export { PrecisionAdapter, createPrecisionAdapter } from './precision-adapter';

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
    // Simple majority voting for now
    const bandVotes = new Map<BandType, number>();
    
    for (const capabilities of moduleCapabilities.values()) {
      for (const band of capabilities) {
        bandVotes.set(band, (bandVotes.get(band) || 0) + 1);
      }
    }
    
    let bestBand = BandType.MIDRANGE;
    let maxVotes = 0;
    
    for (const [band, votes] of bandVotes) {
      if (votes > maxVotes) {
        maxVotes = votes;
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
      return {
        success: false,
        metrics: results[0]?.metrics || {} as BandMetrics,
        quality: results[0]?.quality || { precision: 0, accuracy: 0, completeness: 0, consistency: 0, reliability: 0 },
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
