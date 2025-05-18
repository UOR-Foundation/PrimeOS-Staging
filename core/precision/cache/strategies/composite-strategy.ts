import {
  CacheEntryMetadata
} from '../types';

import {
  EvictionStrategy,
  CompositeStrategyOptions
} from './types';

/**
 * Composite eviction strategy that combines multiple strategies
 */
export class CompositeStrategy<K = any, V = any> implements EvictionStrategy<K, V> {
  readonly type = 'composite';
  readonly weight = 1.0;
  private readonly strategies: EvictionStrategy<K, V>[];
  
  /**
   * Create a new composite strategy
   */
  constructor(options: CompositeStrategyOptions) {
    if (!options.strategies || options.strategies.length === 0) {
      throw new Error('Composite strategy requires at least one strategy');
    }
    
    this.strategies = options.strategies;
  }
  
  /**
   * Handle entry access by delegating to all strategies
   */
  onAccess(key: K, metadata: CacheEntryMetadata): void {
    for (const strategy of this.strategies) {
      strategy.onAccess(key, metadata);
    }
  }
  
  /**
   * Handle entry addition by delegating to all strategies
   */
  onAdd(key: K, metadata: CacheEntryMetadata): void {
    for (const strategy of this.strategies) {
      strategy.onAdd(key, metadata);
    }
  }
  
  /**
   * Select an entry to evict by combining strategy recommendations
   */
  selectEvictionCandidate(entries: Map<K, CacheEntryMetadata>): K | null {
    // Get candidates from each strategy
    const candidates: Map<K, number> = new Map();
    
    for (const strategy of this.strategies) {
      const candidate = strategy.selectEvictionCandidate(entries);
      if (candidate !== null) {
        // Increase score for each strategy that recommends this candidate
        const currentScore = candidates.get(candidate) || 0;
        candidates.set(candidate, currentScore + strategy.weight);
      }
    }
    
    // Select the candidate with the highest score
    let bestCandidate: K | null = null;
    let highestScore = -1;
    
    for (const [key, score] of candidates) {
      if (score > highestScore) {
        highestScore = score;
        bestCandidate = key;
      }
    }
    
    return bestCandidate;
  }
}

/**
 * Create a composite strategy
 */
export function createCompositeStrategy<K = any, V = any>(
  options: CompositeStrategyOptions
): EvictionStrategy<K, V> {
  // Convert strategy specs to strategy objects if needed
  if (options.strategies && Array.isArray(options.strategies)) {
    // Check if we received strategy type/weight objects instead of strategy instances
    const needsConversion = options.strategies.some(s => typeof s === 'object' && 'type' in s && !(s as any).onAdd);
    
    if (needsConversion) {
      const { createLRUStrategy } = require('./lru-strategy');
      const { createLFUStrategy } = require('./lfu-strategy');
      const { createTimeStrategy } = require('./time-strategy');
      
      // Convert strategy specs to actual strategy instances
      const strategyInstances = options.strategies.map((strategySpec: any) => {
        if (typeof strategySpec !== 'object') {
          throw new Error('Invalid strategy specification');
        }
        
        const { type, weight = 1.0 } = strategySpec;
        
        switch (type) {
          case 'lru':
            return createLRUStrategy({ weight });
          case 'lfu':
            return createLFUStrategy({ weight });
          case 'time':
            return createTimeStrategy({ weight });
          default:
            throw new Error(`Unknown strategy type: ${type}`);
        }
      });
      
      return new CompositeStrategy<K, V>({ strategies: strategyInstances });
    }
  }
  
  return new CompositeStrategy<K, V>(options);
}
