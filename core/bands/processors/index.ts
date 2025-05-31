/**
 * Band Processors - Main Entry Point
 * ==================================
 * 
 * This module provides processing strategies for all 8 band types,
 * each optimized for specific number ranges and characteristics.
 */

// Import base strategy processor
export { StrategyProcessor, BaseStrategyProcessor } from './strategy-processor';

// Import all strategy implementations
export { DirectComputationStrategy } from './strategies/direct-computation';
export { CacheOptimizedStrategy } from './strategies/cache-optimized';
export { SieveBasedStrategy } from './strategies/sieve-based';
export { ParallelSieveStrategy } from './strategies/parallel-sieve';
export { StreamingPrimeStrategy } from './strategies/streaming-prime';
export { DistributedSieveStrategy } from './strategies/distributed-sieve';
export { HybridStrategy } from './strategies/hybrid-strategy';
export { SpectralTransformStrategy } from './strategies/spectral-transform';

// Import types
import {
  BandType,
  ProcessingStrategy,
  StrategyProcessor,
  ProcessingContext,
  ProcessingResult
} from '../types';

import { DirectComputationStrategy } from './strategies/direct-computation';
import { CacheOptimizedStrategy } from './strategies/cache-optimized';
import { SieveBasedStrategy } from './strategies/sieve-based';
import { ParallelSieveStrategy } from './strategies/parallel-sieve';
import { StreamingPrimeStrategy } from './strategies/streaming-prime';
import { DistributedSieveStrategy } from './strategies/distributed-sieve';
import { HybridStrategy } from './strategies/hybrid-strategy';
import { SpectralTransformStrategy } from './strategies/spectral-transform';

/**
 * Strategy registry mapping band types to their processors
 */
const STRATEGY_REGISTRY = new Map<BandType, () => StrategyProcessor>([
  [BandType.ULTRABASS, () => new DirectComputationStrategy()],
  [BandType.BASS, () => new CacheOptimizedStrategy()],
  [BandType.MIDRANGE, () => new SieveBasedStrategy()],
  [BandType.UPPER_MID, () => new ParallelSieveStrategy()],
  [BandType.TREBLE, () => new StreamingPrimeStrategy()],
  [BandType.SUPER_TREBLE, () => new DistributedSieveStrategy()],
  [BandType.ULTRASONIC_1, () => new HybridStrategy()],
  [BandType.ULTRASONIC_2, () => new SpectralTransformStrategy()]
]);

/**
 * Strategy mapping from ProcessingStrategy enum to band types
 */
const PROCESSING_STRATEGY_MAP = new Map<ProcessingStrategy, BandType>([
  [ProcessingStrategy.DIRECT_COMPUTATION, BandType.ULTRABASS],
  [ProcessingStrategy.CACHE_OPTIMIZED, BandType.BASS],
  [ProcessingStrategy.SIEVE_BASED, BandType.MIDRANGE],
  [ProcessingStrategy.PARALLEL_SIEVE, BandType.UPPER_MID],
  [ProcessingStrategy.STREAMING_PRIME, BandType.TREBLE],
  [ProcessingStrategy.DISTRIBUTED_SIEVE, BandType.SUPER_TREBLE],
  [ProcessingStrategy.HYBRID_STRATEGY, BandType.ULTRASONIC_1],
  [ProcessingStrategy.SPECTRAL_TRANSFORM, BandType.ULTRASONIC_2]
]);

/**
 * Create a strategy processor for the specified band
 */
export function createStrategyProcessor(band: BandType): StrategyProcessor {
  const factory = STRATEGY_REGISTRY.get(band);
  if (!factory) {
    throw new Error(`No strategy processor available for band: ${band}`);
  }
  return factory();
}

/**
 * Create a strategy processor for the specified processing strategy
 */
export function createProcessorForStrategy(strategy: ProcessingStrategy): StrategyProcessor {
  const band = PROCESSING_STRATEGY_MAP.get(strategy);
  if (!band) {
    throw new Error(`No band mapping for strategy: ${strategy}`);
  }
  return createStrategyProcessor(band);
}

/**
 * Get the optimal strategy for a given band
 */
export function getOptimalStrategy(band: BandType): ProcessingStrategy {
  switch (band) {
    case BandType.ULTRABASS:
      return ProcessingStrategy.DIRECT_COMPUTATION;
    case BandType.BASS:
      return ProcessingStrategy.CACHE_OPTIMIZED;
    case BandType.MIDRANGE:
      return ProcessingStrategy.SIEVE_BASED;
    case BandType.UPPER_MID:
      return ProcessingStrategy.PARALLEL_SIEVE;
    case BandType.TREBLE:
      return ProcessingStrategy.STREAMING_PRIME;
    case BandType.SUPER_TREBLE:
      return ProcessingStrategy.DISTRIBUTED_SIEVE;
    case BandType.ULTRASONIC_1:
      return ProcessingStrategy.HYBRID_STRATEGY;
    case BandType.ULTRASONIC_2:
      return ProcessingStrategy.SPECTRAL_TRANSFORM;
    default:
      throw new Error(`Unknown band type: ${band}`);
  }
}

/**
 * Get all supported bands
 */
export function getSupportedBands(): BandType[] {
  return Array.from(STRATEGY_REGISTRY.keys());
}

/**
 * Get all available processing strategies
 */
export function getAvailableStrategies(): ProcessingStrategy[] {
  return Array.from(PROCESSING_STRATEGY_MAP.keys());
}

/**
 * Check if a band is supported
 */
export function isBandSupported(band: BandType): boolean {
  return STRATEGY_REGISTRY.has(band);
}

/**
 * Check if a strategy is supported
 */
export function isStrategySupported(strategy: ProcessingStrategy): boolean {
  return PROCESSING_STRATEGY_MAP.has(strategy);
}

/**
 * Get strategy information for a band
 */
export function getStrategyInfo(band: BandType): {
  strategy: ProcessingStrategy;
  processor: StrategyProcessor;
  description: string;
} {
  const strategy = getOptimalStrategy(band);
  const processor = createStrategyProcessor(band);
  
  const descriptions = {
    [BandType.ULTRABASS]: 'Direct computation for small numbers (16-32 bits)',
    [BandType.BASS]: 'Cache-optimized processing for medium numbers (33-64 bits)',
    [BandType.MIDRANGE]: 'Sieve-based algorithms for moderate numbers (65-128 bits)',
    [BandType.UPPER_MID]: 'Parallel sieve processing for large numbers (129-256 bits)',
    [BandType.TREBLE]: 'Streaming prime algorithms for very large numbers (257-512 bits)',
    [BandType.SUPER_TREBLE]: 'Distributed sieve for extremely large numbers (513-1024 bits)',
    [BandType.ULTRASONIC_1]: 'Hybrid strategies for massive numbers (1025-2048 bits)',
    [BandType.ULTRASONIC_2]: 'Spectral transform methods for enormous numbers (2049-4096 bits)'
  };
  
  return {
    strategy,
    processor,
    description: descriptions[band]
  };
}

/**
 * Create a batch processor that can handle multiple bands
 */
export function createBatchProcessor(): {
  processBatch: (
    items: Array<{ data: any; band: BandType; context: ProcessingContext }>
  ) => Promise<ProcessingResult[]>;
} {
  const processors = new Map<BandType, StrategyProcessor>();
  
  return {
    async processBatch(items) {
      const results: ProcessingResult[] = [];
      
      for (const item of items) {
        // Get or create processor for this band
        if (!processors.has(item.band)) {
          processors.set(item.band, createStrategyProcessor(item.band));
        }
        
        const processor = processors.get(item.band)!;
        const result = await processor.process(item.data, item.context);
        results.push(result);
      }
      
      return results;
    }
  };
}

/**
 * Factory function for creating strategy processors with dependency injection
 */
export function createStrategyProcessorFactory(dependencies: {
  primeRegistry?: any;
  integrityModule?: any;
  encodingModule?: any;
  streamModule?: any;
  precisionModule?: any;
}) {
  return {
    createProcessor: (band: BandType): StrategyProcessor => {
      const processor = createStrategyProcessor(band);
      
      // Configure processor with dependencies
      processor.updateConfiguration({
        ...dependencies,
        band
      });
      
      return processor;
    },
    
    createForStrategy: (strategy: ProcessingStrategy): StrategyProcessor => {
      const processor = createProcessorForStrategy(strategy);
      
      // Configure processor with dependencies
      processor.updateConfiguration({
        ...dependencies,
        strategy
      });
      
      return processor;
    }
  };
}
