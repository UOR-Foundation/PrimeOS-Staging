/**
 * Node in a doubly linked list
 */
export interface LinkedListNode<T> {
  /**
   * Value stored in the node
   */
  value: T;
  
  /**
   * Previous node
   */
  prev: LinkedListNode<T> | null;
  
  /**
   * Next node
   */
  next: LinkedListNode<T> | null;
}
