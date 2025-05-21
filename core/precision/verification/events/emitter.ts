/**
 * Verification Event Emitter
 * =======================
 * 
 * Implementation of event emission for verification operations.
 */

import { LoggingInterface } from '../../../../os/logging';
import { 
  VerificationEventType, 
  VerificationEvent, 
  EventHandler, 
  EventEmitter,
  EventSubscriptionOptions,
  EventBufferOptions,
  BufferOverflowStrategy
} from './types';

/**
 * Subscription entry for an event handler
 */
interface Subscription {
  handler: EventHandler;
  options?: EventSubscriptionOptions;
}

/**
 * Default event buffer options
 */
const DEFAULT_BUFFER_OPTIONS: EventBufferOptions = {
  enabled: true,
  maxSize: 100,
  maxAge: 60 * 60 * 1000, // 1 hour
  overflowStrategy: BufferOverflowStrategy.DISCARD_OLDEST,
  autoReplay: true
};

/**
 * Implementation of event emitter for verification operations
 */
export class VerificationEventEmitter implements EventEmitter {
  private subscriptions: Map<VerificationEventType, Subscription[]>;
  private logger?: LoggingInterface;
  private debug: boolean;
  private bufferOptions: EventBufferOptions;
  private eventBuffer: Map<VerificationEventType, VerificationEvent[]>;
  private bufferCleanupInterval?: NodeJS.Timeout;
  
  /**
   * Create a new event emitter
   */
  constructor(
    logger?: LoggingInterface, 
    debug: boolean = false,
    bufferOptions?: EventBufferOptions
  ) {
    this.subscriptions = new Map();
    this.logger = logger;
    this.debug = debug;
    this.bufferOptions = { ...DEFAULT_BUFFER_OPTIONS, ...bufferOptions };
    this.eventBuffer = new Map();
    
    // Set up buffer cleanup interval if age limit is enabled
    if (this.bufferOptions.enabled && this.bufferOptions.maxAge) {
      // For testing environments, disable the interval to avoid open handles
      if (typeof jest !== 'undefined') {
        // In Jest environment, don't set up the interval
        if (this.debug && this.logger) {
          this.logger.debug('Running in test environment, skipping cleanup interval').catch(() => {});
        }
      } else {
        this.bufferCleanupInterval = setInterval(
          () => this.cleanupExpiredEvents(),
          Math.min(this.bufferOptions.maxAge / 2, 30 * 60 * 1000) // Half of maxAge or 30 minutes, whichever is smaller
        );
      }
    }
    
    if (this.debug && this.logger) {
      this.logger.debug('Verification event emitter initialized').catch(() => {});
    }
  }
  
  /**
   * Clean up resources when no longer needed
   */
  dispose(): void {
    if (this.bufferCleanupInterval) {
      clearInterval(this.bufferCleanupInterval);
    }
    
    this.offAll();
    this.clearBuffer();
    
    if (this.debug && this.logger) {
      this.logger.debug('Verification event emitter disposed').catch(() => {});
    }
  }
  
  /**
   * Emit an event
   */
  emit(event: VerificationEvent): void {
    // Ensure event has a timestamp
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }
    
    // Buffer the event if buffering is enabled
    if (this.bufferOptions.enabled) {
      this.bufferEvent(event);
    }
    
    // Get subscriptions for this event type
    const subs = this.subscriptions.get(event.type) || [];
    
    if (this.debug && this.logger) {
      this.logger.debug(`Emitting event: ${event.type} with ${subs.length} subscribers`, event.data).catch(() => {});
    }
    
    // Process subscriptions
    const remainingSubs: Subscription[] = [];
    
    for (const sub of subs) {
      try {
        // Check filter if provided
        if (sub.options?.filter && !sub.options.filter(event)) {
          // Keep subscription if it doesn't match the filter
          remainingSubs.push(sub);
          continue;
        }
        
        // Call handler
        sub.handler(event);
        
        // Keep subscription if it's not a one-time subscription
        if (!sub.options?.once) {
          remainingSubs.push(sub);
        }
      } catch (error) {
        // Log error but continue processing other subscriptions
        if (this.logger) {
          this.logger.error(`Error in event handler for ${event.type}:`, error).catch(() => {});
        }
        
        // Keep subscription even if it errors
        if (!sub.options?.once) {
          remainingSubs.push(sub);
        }
      }
    }
    
    // Update subscriptions
    if (remainingSubs.length > 0) {
      this.subscriptions.set(event.type, remainingSubs);
    } else {
      this.subscriptions.delete(event.type);
    }
  }
  
  /**
   * Buffer an event according to buffer options
   */
  private bufferEvent(event: VerificationEvent): void {
    // Check if event type should be buffered
    if (this.bufferOptions.includedTypes && 
        !this.bufferOptions.includedTypes.includes(event.type)) {
      return;
    }
    
    if (this.bufferOptions.excludedTypes && 
        this.bufferOptions.excludedTypes.includes(event.type)) {
      return;
    }
    
    // Get or create buffer for this event type
    let buffer = this.eventBuffer.get(event.type) || [];
    
    // Add event to buffer
    buffer = [...buffer, event];
    
    // Check if buffer exceeds max size
    if (this.bufferOptions.maxSize && buffer.length > this.bufferOptions.maxSize) {
      // Apply overflow strategy
      switch (this.bufferOptions.overflowStrategy) {
        case BufferOverflowStrategy.DISCARD_OLDEST:
          // Remove oldest events
          buffer = buffer.slice(buffer.length - this.bufferOptions.maxSize);
          break;
          
        case BufferOverflowStrategy.DISCARD_NEWEST:
          // Remove newest events (keep oldest)
          buffer = buffer.slice(0, this.bufferOptions.maxSize);
          break;
          
        case BufferOverflowStrategy.PRIORITY_BASED:
          // Sort by priority (for now, just keep most recent)
          // This could be enhanced with a priority function in the future
          buffer.sort((a, b) => b.timestamp - a.timestamp);
          buffer = buffer.slice(0, this.bufferOptions.maxSize);
          break;
      }
      
      if (this.debug && this.logger) {
        this.logger.debug(`Event buffer for type ${event.type} exceeded max size, applied ${this.bufferOptions.overflowStrategy} strategy`).catch(() => {});
      }
    }
    
    // Update buffer
    this.eventBuffer.set(event.type, buffer);
  }
  
  /**
   * Subscribe to an event type
   */
  on(type: VerificationEventType, handler: EventHandler, options?: EventSubscriptionOptions): void {
    // Get existing subscriptions
    const subs = this.subscriptions.get(type) || [];
    
    // Add new subscription
    subs.push({ handler, options });
    
    // Update subscriptions
    this.subscriptions.set(type, subs);
    
    // Replay buffered events if enabled
    const shouldReplay = (options?.replayBuffered !== undefined) 
      ? options.replayBuffered 
      : this.bufferOptions.autoReplay;
      
    if (shouldReplay && this.bufferOptions.enabled) {
      this.replayBuffered(type, handler, options?.filter);
    }
    
    if (this.debug && this.logger) {
      this.logger.debug(`Subscribed to event: ${type}`).catch(() => {});
    }
  }
  
  /**
   * Subscribe to an event type once
   */
  once(type: VerificationEventType, handler: EventHandler, options?: EventSubscriptionOptions): void {
    // Call on with once option set to true
    this.on(type, handler, { ...options, once: true });
  }
  
  /**
   * Unsubscribe from an event type
   */
  off(type: VerificationEventType, handler: EventHandler): void {
    // Get existing subscriptions
    const subs = this.subscriptions.get(type);
    
    if (!subs) {
      return;
    }
    
    // Filter out the handler
    const remainingSubs = subs.filter(sub => sub.handler !== handler);
    
    // Update subscriptions
    if (remainingSubs.length > 0) {
      this.subscriptions.set(type, remainingSubs);
    } else {
      this.subscriptions.delete(type);
    }
    
    if (this.debug && this.logger) {
      this.logger.debug(`Unsubscribed from event: ${type}`).catch(() => {});
    }
  }
  
  /**
   * Unsubscribe from all events
   */
  offAll(): void {
    // Clear all subscriptions
    this.subscriptions.clear();
    
    if (this.debug && this.logger) {
      this.logger.debug('Unsubscribed from all events').catch(() => {});
    }
  }
  
  /**
   * Get the number of subscribers for an event type
   */
  getSubscriberCount(type?: VerificationEventType): number {
    if (type) {
      return this.subscriptions.get(type)?.length || 0;
    } else {
      // Count all subscribers
      let count = 0;
      for (const subs of this.subscriptions.values()) {
        count += subs.length;
      }
      return count;
    }
  }
  
  /**
   * Check if there are any subscribers for an event type
   */
  hasSubscribers(type?: VerificationEventType): boolean {
    if (type) {
      return !!this.subscriptions.get(type)?.length;
    } else {
      return this.subscriptions.size > 0;
    }
  }
  
  /**
   * Create a verification event
   */
  createEvent(type: VerificationEventType, data: Record<string, any> = {}): VerificationEvent {
    return {
      type,
      timestamp: Date.now(),
      data
    };
  }
  
  /**
   * Configure event buffer
   */
  configureBuffer(options: EventBufferOptions): void {
    // Update buffer options
    this.bufferOptions = { ...this.bufferOptions, ...options };
    
    // Clear cleanup interval if it exists
    if (this.bufferCleanupInterval) {
      clearInterval(this.bufferCleanupInterval);
      this.bufferCleanupInterval = undefined;
    }
    
    // Set up new cleanup interval if age limit is enabled
    if (this.bufferOptions.enabled && this.bufferOptions.maxAge) {
      this.bufferCleanupInterval = setInterval(
        () => this.cleanupExpiredEvents(),
        Math.min(this.bufferOptions.maxAge / 2, 30 * 60 * 1000) // Half of maxAge or 30 minutes, whichever is smaller
      );
    }
    
    // If buffer is disabled, clear the buffer
    if (!this.bufferOptions.enabled) {
      this.clearBuffer();
    }
    
    if (this.debug && this.logger) {
      this.logger.debug('Event buffer reconfigured', this.bufferOptions).catch(() => {});
    }
  }
  
  /**
   * Get buffered events
   */
  getBufferedEvents(type?: VerificationEventType): VerificationEvent[] {
    if (!this.bufferOptions.enabled) {
      return [];
    }
    
    if (type) {
      // Return events of a specific type
      return [...(this.eventBuffer.get(type) || [])];
    } else {
      // Return all buffered events
      const allEvents: VerificationEvent[] = [];
      for (const events of this.eventBuffer.values()) {
        allEvents.push(...events);
      }
      
      // Sort by timestamp (oldest first)
      return allEvents.sort((a, b) => a.timestamp - b.timestamp);
    }
  }
  
  /**
   * Clear buffered events
   */
  clearBuffer(type?: VerificationEventType): void {
    if (type) {
      // Clear events of a specific type
      this.eventBuffer.delete(type);
    } else {
      // Clear all buffered events
      this.eventBuffer.clear();
    }
    
    if (this.debug && this.logger) {
      this.logger.debug(`Cleared event buffer${type ? ` for event type: ${type}` : ''}`).catch(() => {});
    }
  }
  
  /**
   * Replay buffered events to a specific handler
   */
  replayBuffered(
    type: VerificationEventType, 
    handler: EventHandler, 
    filter?: (event: VerificationEvent) => boolean
  ): void {
    if (!this.bufferOptions.enabled) {
      return;
    }
    
    // Get buffered events of the specified type
    const events = this.eventBuffer.get(type) || [];
    
    if (events.length === 0) {
      return;
    }
    
    if (this.debug && this.logger) {
      this.logger.debug(`Replaying ${events.length} buffered events of type: ${type}`).catch(() => {});
    }
    
    // Replay events to the handler
    for (const event of events) {
      try {
        // Apply filter if provided
        if (filter && !filter(event)) {
          continue;
        }
        
        // Call handler with event
        handler(event);
      } catch (error) {
        // Log error but continue processing other events
        if (this.logger) {
          this.logger.error(`Error replaying event of type ${type}:`, error).catch(() => {});
        }
      }
    }
  }
  
  /**
   * Clean up expired events
   */
  private cleanupExpiredEvents(): void {
    if (!this.bufferOptions.enabled || !this.bufferOptions.maxAge) {
      return;
    }
    
    const now = Date.now();
    const maxAge = this.bufferOptions.maxAge;
    let expiredCount = 0;
    
    // Check each event type
    for (const [type, events] of this.eventBuffer.entries()) {
      // Filter out expired events
      const validEvents = events.filter(event => {
        const expired = now - event.timestamp > maxAge;
        if (expired) {
          expiredCount++;
        }
        return !expired;
      });
      
      // Update buffer with valid events
      if (validEvents.length !== events.length) {
        this.eventBuffer.set(type, validEvents);
      }
    }
    
    if (expiredCount > 0 && this.debug && this.logger) {
      this.logger.debug(`Cleaned up ${expiredCount} expired events from buffer`).catch(() => {});
    }
  }
}

/**
 * Create a new event emitter
 */
export function createEventEmitter(
  logger?: LoggingInterface, 
  debug: boolean = false,
  bufferOptions?: EventBufferOptions
): EventEmitter {
  return new VerificationEventEmitter(logger, debug, bufferOptions);
}
