/**
 * Verification Events Types
 * ======================
 * 
 * Type definitions for verification events.
 */

/**
 * Verification event types
 */
export enum VerificationEventType {
  // Lifecycle events
  INITIALIZED = 'initialized',
  TERMINATED = 'terminated',
  
  // Operation events
  VERIFICATION_START = 'verification_start',
  VERIFICATION_SUCCESS = 'verification_success',
  VERIFICATION_FAILURE = 'verification_failure',
  
  // Retry events
  RETRY_ATTEMPT = 'retry_attempt',
  RETRY_SUCCESS = 'retry_success',
  RETRY_FAILURE = 'retry_failure',
  
  // Cache events
  CACHE_HIT = 'cache_hit',
  CACHE_MISS = 'cache_miss',
  CACHE_CLEARED = 'cache_cleared',
  
  // Resilience events
  RATE_LIMIT_HIT = 'rate_limit_hit',
  CIRCUIT_OPEN = 'circuit_open',
  CIRCUIT_CLOSE = 'circuit_close',
  CIRCUIT_HALF_OPEN = 'circuit_half_open'
}

/**
 * Base verification event
 */
export interface VerificationEvent {
  /**
   * Event type
   */
  type: VerificationEventType;
  
  /**
   * Timestamp (ms since epoch)
   */
  timestamp: number;
  
  /**
   * Event data
   */
  data: Record<string, any>;
}

/**
 * Event handler function
 */
export type EventHandler = (event: VerificationEvent) => void;

/**
 * Event subscription options
 */
export interface EventSubscriptionOptions {
  /**
   * Whether to receive events only once
   */
  once?: boolean;
  
  /**
   * Filter function to determine if event should be handled
   */
  filter?: (event: VerificationEvent) => boolean;
  
  /**
   * Whether to replay buffered events when subscribing
   */
  replayBuffered?: boolean;
}

/**
 * Buffer overflow strategy
 */
export enum BufferOverflowStrategy {
  /**
   * Discard oldest events when buffer is full
   */
  DISCARD_OLDEST = 'discard_oldest',
  
  /**
   * Discard newest events when buffer is full
   */
  DISCARD_NEWEST = 'discard_newest',
  
  /**
   * Discard events based on priority when buffer is full
   */
  PRIORITY_BASED = 'priority_based'
}

/**
 * Event buffer options
 */
export interface EventBufferOptions {
  /**
   * Whether to enable event buffering
   */
  enabled?: boolean;
  
  /**
   * Maximum number of events to buffer
   */
  maxSize?: number;
  
  /**
   * Maximum age of buffered events in milliseconds
   */
  maxAge?: number;
  
  /**
   * Strategy for handling buffer overflow
   */
  overflowStrategy?: BufferOverflowStrategy;
  
  /**
   * Event types to buffer (if not specified, all events are buffered)
   */
  includedTypes?: VerificationEventType[];
  
  /**
   * Event types to exclude from buffering
   */
  excludedTypes?: VerificationEventType[];
  
  /**
   * Whether to automatically replay buffered events to new subscribers
   */
  autoReplay?: boolean;
}

/**
 * Event emitter interface
 */
export interface EventEmitter {
  /**
   * Emit an event
   */
  emit(event: VerificationEvent): void;
  
  /**
   * Subscribe to an event type
   */
  on(type: VerificationEventType, handler: EventHandler, options?: EventSubscriptionOptions): void;
  
  /**
   * Subscribe to an event type once
   */
  once(type: VerificationEventType, handler: EventHandler, options?: EventSubscriptionOptions): void;
  
  /**
   * Unsubscribe from an event type
   */
  off(type: VerificationEventType, handler: EventHandler): void;
  
  /**
   * Unsubscribe from all events
   */
  offAll(): void;
  
  /**
   * Configure event buffer
   */
  configureBuffer(options: EventBufferOptions): void;
  
  /**
   * Get buffered events
   */
  getBufferedEvents(type?: VerificationEventType): VerificationEvent[];
  
  /**
   * Clear buffered events
   */
  clearBuffer(type?: VerificationEventType): void;
  
  /**
   * Replay buffered events to a specific handler
   */
  replayBuffered(type: VerificationEventType, handler: EventHandler, filter?: (event: VerificationEvent) => boolean): void;
}
