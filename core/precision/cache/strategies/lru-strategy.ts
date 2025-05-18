import {
  CacheEntryMetadata
} from '../types';

import {
  EvictionStrategy,
  LRUStrategyOptions
} from './types';

import { DoublyLinkedList } from '../data-structures/linked-list';

/**
 * LRU (Least Recently Used) eviction strategy implementation
 */
export class LRUStrategy<K = any, V = any> implements EvictionStrategy<K, V> {
  readonly type = 'lru';
  readonly weight: number;
  
  // Use a more efficient doubly linked list for order tracking
  private list = new DoublyLinkedList<K>();
  
  /**
   * Create a new LRU strategy
   */
  constructor(options: LRUStrategyOptions = {}) {
    this.weight = options.weight || 1.0;
  }
  
  /**
   * Handle entry access (move to most recently used position)
   */
  onAccess(key: K, metadata: CacheEntryMetadata): void {
    // Move key to the front (most recently used)
    this.list.remove(key);
    this.list.addToFront(key);
  }
  
  /**
   * Handle entry addition
   */
  onAdd(key: K, metadata: CacheEntryMetadata): void {
    // Add key to the front (most recently used)
    this.list.remove(key); // Remove if exists
    this.list.addToFront(key);
  }
  
  /**
   * Select an entry to evict
   */
  selectEvictionCandidate(entries: Map<K, CacheEntryMetadata>): K | null {
    // Start from the back (least recently used)
    let current = this.list.getTail();
    
    while (current) {
      if (entries.has(current.value)) {
        return current.value;
      }
      current = current.prev;
    }
    
    // Clean up list to remove keys that no longer exist
    this.synchronizeList(entries);
    
    // If no valid candidate is found, return null
    return null;
  }
  
  /**
   * Remove keys from the list that don't exist in the entries
   */
  private synchronizeList(entries: Map<K, CacheEntryMetadata>): void {
    const keysToRemove: K[] = [];
    
    // Find all keys in list that don't exist in entries
    let current = this.list.getHead();
    while (current) {
      if (!entries.has(current.value)) {
        keysToRemove.push(current.value);
      }
      current = current.next;
    }
    
    // Remove those keys
    for (const key of keysToRemove) {
      this.list.remove(key);
    }
  }
}

/**
 * Create an LRU strategy
 */
export function createLRUStrategy<K = any, V = any>(
  options?: LRUStrategyOptions
): EvictionStrategy<K, V> {
  return new LRUStrategy<K, V>(options);
}
