import {
  CacheEntryMetadata
} from '../types';

import {
  EvictionStrategy,
  LFUStrategyOptions
} from './types';

/**
 * LFU (Least Frequently Used) eviction strategy implementation
 */
export class LFUStrategy<K = any, V = any> implements EvictionStrategy<K, V> {
  readonly type = 'lfu';
  readonly weight: number;
  private readonly agingFactor: number;
  
  // Maps from frequency counts to sets of keys with that frequency
  private frequencyMap = new Map<number, Set<K>>();
  
  // Maps keys to their current frequency count
  private keyFrequency = new Map<K, number>();
  
  // Track the minimum frequency for O(1) operations
  private minFrequency = 0;
  
  /**
   * Create a new LFU strategy
   */
  constructor(options: LFUStrategyOptions = {}) {
    this.weight = options.weight || 1.0;
    this.agingFactor = options.agingFactor || 1.0;
  }
  
  /**
   * Handle entry access (increase frequency count)
   */
  onAccess(key: K, metadata: CacheEntryMetadata): void {
    // Get current frequency, defaulting to 0 if not found
    const frequency = this.keyFrequency.get(key) || 0;
    
    // Remove the key from its current frequency list
    this.removeFromFrequency(key, frequency);
    
    // Calculate new frequency with aging factor applied
    const newFrequency = frequency * this.agingFactor + 1;
    
    // Update the key's frequency
    this.keyFrequency.set(key, newFrequency);
    
    // Add the key to its new frequency list
    this.addToFrequency(key, newFrequency);
    
    // Update minimum frequency if needed
    if (frequency === this.minFrequency && !this.frequencyMap.get(frequency)?.size) {
      this.minFrequency = newFrequency;
    }
  }
  
  /**
   * Handle entry addition
   */
  onAdd(key: K, metadata: CacheEntryMetadata): void {
    // Initialize with frequency 1
    const initialFrequency = 1;
    
    // Add the key to the frequency map
    this.keyFrequency.set(key, initialFrequency);
    this.addToFrequency(key, initialFrequency);
    
    // Set minimum frequency to 1
    this.minFrequency = 1;
  }
  
  /**
   * Select an entry to evict based on least frequency
   */
  selectEvictionCandidate(entries: Map<K, CacheEntryMetadata>): K | null {
    // Iterate through frequencies from min to max
    for (let frequency = this.minFrequency; 
         this.frequencyMap.has(frequency); 
         frequency++) {
      
      const keys = this.frequencyMap.get(frequency);
      if (!keys || keys.size === 0) continue;
      
      // Find the first key that exists in the entries map
      for (const key of keys) {
        if (entries.has(key)) {
          return key;
        }
      }
    }
    
    // Clean up data structures to remove keys that don't exist anymore
    this.cleanupFrequencyMaps(entries);
    
    // If no valid candidate is found, return null
    return null;
  }
  
  /**
   * Remove a key from its frequency level
   */
  private removeFromFrequency(key: K, frequency: number): void {
    const keysWithFrequency = this.frequencyMap.get(frequency);
    if (keysWithFrequency) {
      keysWithFrequency.delete(key);
      
      // Clean up empty sets
      if (keysWithFrequency.size === 0) {
        this.frequencyMap.delete(frequency);
      }
    }
  }
  
  /**
   * Add a key to a frequency level
   */
  private addToFrequency(key: K, frequency: number): void {
    if (!this.frequencyMap.has(frequency)) {
      this.frequencyMap.set(frequency, new Set());
    }
    
    this.frequencyMap.get(frequency)!.add(key);
  }
  
  /**
   * Clean up frequency maps to remove keys that don't exist in entries
   */
  private cleanupFrequencyMaps(entries: Map<K, CacheEntryMetadata>): void {
    // Clean up keyFrequency
    for (const [key] of this.keyFrequency) {
      if (!entries.has(key)) {
        const frequency = this.keyFrequency.get(key)!;
        this.removeFromFrequency(key, frequency);
        this.keyFrequency.delete(key);
      }
    }
    
    // Reset minimum frequency
    this.minFrequency = 0;
    for (const frequency of this.frequencyMap.keys()) {
      if (this.frequencyMap.get(frequency)!.size > 0) {
        if (this.minFrequency === 0 || frequency < this.minFrequency) {
          this.minFrequency = frequency;
        }
      }
    }
    
    // If no frequencies remain, reset to 0
    if (this.frequencyMap.size === 0) {
      this.minFrequency = 0;
    }
  }
}

/**
 * Create an LFU strategy
 */
export function createLFUStrategy<K = any, V = any>(
  options?: LFUStrategyOptions
): EvictionStrategy<K, V> {
  return new LFUStrategy<K, V>(options);
}
