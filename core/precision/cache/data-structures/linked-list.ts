import { LinkedListNode } from './types';

/**
 * Doubly linked list implementation optimized for LRU cache
 */
export class DoublyLinkedList<T> {
  private head: LinkedListNode<T> | null = null;
  private tail: LinkedListNode<T> | null = null;
  private nodes = new Map<T, LinkedListNode<T>>();
  
  /**
   * Add a new value to the front of the list
   */
  addToFront(value: T): void {
    const newNode: LinkedListNode<T> = { value, prev: null, next: this.head };
    
    // Update existing head node
    if (this.head) {
      this.head.prev = newNode;
    } else {
      // If list was empty, this is also the tail
      this.tail = newNode;
    }
    
    // Update head pointer
    this.head = newNode;
    
    // Store node in map for O(1) access
    this.nodes.set(value, newNode);
  }
  
  /**
   * Remove a value from the list
   */
  remove(value: T): boolean {
    const node = this.nodes.get(value);
    
    if (!node) {
      return false;
    }
    
    // Update adjacent nodes
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      // This was the head
      this.head = node.next;
    }
    
    if (node.next) {
      node.next.prev = node.prev;
    } else {
      // This was the tail
      this.tail = node.prev;
    }
    
    // Remove from map
    this.nodes.delete(value);
    
    return true;
  }
  
  /**
   * Get the head node (most recently used)
   */
  getHead(): LinkedListNode<T> | null {
    return this.head;
  }
  
  /**
   * Get the tail node (least recently used)
   */
  getTail(): LinkedListNode<T> | null {
    return this.tail;
  }
  
  /**
   * Get all values in order (head to tail)
   */
  getValues(): T[] {
    const values: T[] = [];
    let current = this.head;
    
    while (current) {
      values.push(current.value);
      current = current.next;
    }
    
    return values;
  }
  
  /**
   * Get the size of the list
   */
  size(): number {
    return this.nodes.size;
  }
  
  /**
   * Clear the list
   */
  clear(): void {
    this.head = null;
    this.tail = null;
    this.nodes.clear();
  }
}
