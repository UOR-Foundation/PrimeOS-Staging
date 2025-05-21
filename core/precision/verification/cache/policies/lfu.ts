/**
 * Verification LFU Cache Policy
 * =========================
 * 
 * Implementation of Least Frequently Used (LFU) cache eviction policy.
 */

import { LoggingInterface } from '../../../../../os/logging';
import { CacheEntry, VerificationCache } from '../types';
import { CacheError } from '../../errors';

/**
 * Frequency node for LFU cache
 */
interface FrequencyNode<K> {
  frequency: number;
  keys: Set<K>;
  prev: FrequencyNode<K> | null;
  next: FrequencyNode<K> | null;
}

/**
 * LFU Cache implementation
 */
export class LFUCache<K, V> implements VerificationCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private keyFrequency: Map<K, FrequencyNode<K>>;
  private minFrequency: number;
  private frequencyList: FrequencyNode<K> | null;
  private maxSize: number;
  private hits: number;
  private misses: number;
  private logger?: LoggingInterface;
  
  /**
   * Create a new LFU cache
   */
  constructor(maxSize: number, logger?: LoggingInterface) {
    this.cache = new Map<K, CacheEntry<V>>();
    this.keyFrequency = new Map<K, FrequencyNode<K>>();
    this.minFrequency = 0;
    this.frequencyList = null;
    this.maxSize = maxSize;
    this.hits = 0;
    this.misses = 0;
    this.logger = logger;
    
    if (this.logger) {
      this.logger.debug(`Created LFU cache with max size ${maxSize}`).catch(() => {});
    }
  }
  
  /**
   * Create a new frequency node
   */
  private createFrequencyNode(frequency: number): FrequencyNode<K> {
    return {
      frequency,
      keys: new Set<K>(),
      prev: null,
      next: null
    };
  }
  
  /**
   * Insert a frequency node after the given node
   */
  private insertAfter(node: FrequencyNode<K>, newNode: FrequencyNode<K>): void {
    newNode.prev = node;
    newNode.next = node.next;
    
    if (node.next) {
      node.next.prev = newNode;
    }
    
    node.next = newNode;
  }
  
  /**
   * Remove a frequency node from the list
   */
  private removeNode(node: FrequencyNode<K>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      // Node is the head of the list
      this.frequencyList = node.next;
    }
    
    if (node.next) {
      node.next.prev = node.prev;
    }
    
    node.prev = null;
    node.next = null;
  }
  
  /**
   * Get a value from the cache
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      
      if (this.logger) {
        this.logger.debug(`Cache miss for key: ${String(key)}`).catch(() => {});
      }
      
      return undefined;
    }
    
    // Update access information
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    
    // Update frequency
    this.incrementFrequency(key);
    
    this.hits++;
    
    if (this.logger) {
      this.logger.debug(`Cache hit for key: ${String(key)}`).catch(() => {});
    }
    
    return entry.value;
  }
  
  /**
   * Increment the frequency of a key
   */
  private incrementFrequency(key: K): void {
    // Get current frequency node
    const currentNode = this.keyFrequency.get(key);
    
    if (!currentNode) {
      return;
    }
    
    // Remove key from current frequency node
    currentNode.keys.delete(key);
    
    // Get or create next frequency node
    const nextFrequency = currentNode.frequency + 1;
    let nextNode: FrequencyNode<K>;
    
    if (currentNode.next && currentNode.next.frequency === nextFrequency) {
      // Use existing node
      nextNode = currentNode.next;
    } else {
      // Create new node and insert after current
      nextNode = this.createFrequencyNode(nextFrequency);
      this.insertAfter(currentNode, nextNode);
    }
    
    // Add key to next frequency node
    nextNode.keys.add(key);
    this.keyFrequency.set(key, nextNode);
    
    // If current node is empty, remove it
    if (currentNode.keys.size === 0) {
      this.removeNode(currentNode);
      
      // Update min frequency if needed
      if (this.minFrequency === currentNode.frequency) {
        this.minFrequency = nextFrequency;
      }
    }
  }
  
  /**
   * Set a value in the cache
   */
  set(key: K, value: V): void {
    const now = Date.now();
    
    // If key exists, update its value
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.lastAccessed = now;
      
      // Increment frequency
      this.incrementFrequency(key);
      
      return;
    }
    
    // If at capacity, remove least frequently used item
    if (this.cache.size === this.maxSize) {
      this.evictLFU();
    }
    
    // Add new entry
    this.cache.set(key, {
      value,
      created: now,
      lastAccessed: now,
      accessCount: 0
    });
    
    // Add to frequency list with frequency 1
    this.addToFrequencyList(key);
    
    if (this.logger) {
      this.logger.debug(`Set key in cache: ${String(key)}`).catch(() => {});
    }
  }
  
  /**
   * Add a key to the frequency list with frequency 1
   */
  private addToFrequencyList(key: K): void {
    // Set min frequency to 1
    this.minFrequency = 1;
    
    let node: FrequencyNode<K>;
    
    // Find or create frequency node for frequency 1
    if (this.frequencyList && this.frequencyList.frequency === 1) {
      // Use existing node
      node = this.frequencyList;
    } else {
      // Create new node
      node = this.createFrequencyNode(1);
      
      // Add to head of list
      if (this.frequencyList) {
        node.next = this.frequencyList;
        this.frequencyList.prev = node;
      }
      
      this.frequencyList = node;
    }
    
    // Add key to frequency node
    node.keys.add(key);
    this.keyFrequency.set(key, node);
  }
  
  /**
   * Evict the least frequently used item
   */
  private evictLFU(): void {
    if (!this.frequencyList) {
      return;
    }
    
    // Find the node with minimum frequency
    let minNode: FrequencyNode<K> | null = this.frequencyList;
    while (minNode && minNode.frequency !== this.minFrequency) {
      minNode = minNode.next;
    }
    
    if (!minNode || minNode.keys.size === 0) {
      return;
    }
    
    // Get the first key from the minimum frequency node
    const keyIterator = minNode.keys.values().next();
    if (keyIterator.done) {
      return;
    }
    
    const keyToRemove: K = keyIterator.value;
    
    // Remove key from frequency node
    minNode.keys.delete(keyToRemove);
    this.keyFrequency.delete(keyToRemove);
    
    // Remove from cache
    this.cache.delete(keyToRemove);
    
    // If node is empty, remove it
    if (minNode.keys.size === 0) {
      this.removeNode(minNode);
      
      // Update min frequency if needed
      if (this.frequencyList) {
        this.minFrequency = this.frequencyList.frequency;
      } else {
        this.minFrequency = 0;
      }
    }
    
    if (this.logger) {
      this.logger.debug(`Evicted LFU key: ${String(keyToRemove)}`).catch(() => {});
    }
  }
  
  /**
   * Check if a key exists in the cache
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  /**
   * Delete a key from the cache
   */
  delete(key: K): boolean {
    if (!this.cache.has(key)) {
      return false;
    }
    
    // Get frequency node
    const node = this.keyFrequency.get(key);
    
    if (node) {
      // Remove key from frequency node
      node.keys.delete(key);
      this.keyFrequency.delete(key);
      
      // If node is empty, remove it
      if (node.keys.size === 0) {
        this.removeNode(node);
        
        // Update min frequency if needed
        if (node.frequency === this.minFrequency) {
          if (this.frequencyList) {
            this.minFrequency = this.frequencyList.frequency;
          } else {
            this.minFrequency = 0;
          }
        }
      }
    }
    
    // Remove from cache
    this.cache.delete(key);
    
    if (this.logger) {
      this.logger.debug(`Deleted key from cache: ${String(key)}`).catch(() => {});
    }
    
    return true;
  }
  
  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.keyFrequency.clear();
    this.frequencyList = null;
    this.minFrequency = 0;
    
    if (this.logger) {
      this.logger.debug('Cache cleared').catch(() => {});
    }
  }
  
  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Get cache metrics
   */
  getMetrics(): { hits: number; misses: number; size: number } {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size
    };
  }
}

/**
 * Create a new LFU cache
 */
export function createLFUCache<K, V>(
  maxSize: number,
  logger?: LoggingInterface
): VerificationCache<K, V> {
  if (maxSize <= 0) {
    throw new CacheError('Cache size must be positive');
  }
  
  return new LFUCache<K, V>(maxSize, logger);
}
