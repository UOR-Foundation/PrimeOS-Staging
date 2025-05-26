/**
 * Logging Mock Exports
 * ===================
 * 
 * This file exports mocks of the logging system for use in tests.
 * It provides a complete implementation of the LoggingInterface for testing.
 */

import {
  LogLevel,
  LogEntry,
  LoggingOptions,
  LoggingInterface,
  LoggingState
} from '../types';

import { ModelResult, ModelLifecycleState } from '../../model/types';

export { LogLevel, LogEntry, LoggingOptions };

/**
 * Create a fully-compliant mock logger that implements the complete LoggingInterface
 */
export function createLogging(options: LoggingOptions = {}): LoggingInterface {
  // Track recent entries
  const entries: LogEntry[] = [];
  const maxEntries = options.maxEntries || 100;
  
  // Track state
  const state: LoggingState = {
    lifecycle: ModelLifecycleState.Ready,
    lastStateChangeTime: Date.now(),
    uptime: 0,
    operationCount: {
      total: 0,
      success: 0,
      failed: 0
    },
    recentEntries: [],
    stats: {
      [LogLevel.TRACE]: 0,
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.FATAL]: 0,
      [LogLevel.NONE]: 0  // Added NONE level
    }
  };
  
  // Create a standard result
  const createStandardResult = <T>(success: boolean, data?: T, error?: string): ModelResult<T> => ({
    success,
    data,
    timestamp: Date.now(),
    source: options.name || 'mock-logging',
    error
  });
  
  // Add an entry to the log history
  const addEntry = (level: LogLevel, message: string, data?: unknown): LogEntry => {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      source: options.name || 'mock-logging',
      data
    };
    
    entries.unshift(entry);
    if (entries.length > maxEntries) {
      entries.pop();
    }
    
    // Update statistics
    if (state.stats && level !== LogLevel.NONE) {
      state.stats[level] = (state.stats[level] || 0) + 1;
    }
    
    state.recentEntries = [...entries];
    state.operationCount.total++;
    state.operationCount.success++;
    
    return entry;
  };
  
  // Create Jest spy functions for all logging methods
  const mockLogger = {
    // Basic logging methods
    initialize: jest.fn().mockImplementation(async () => {
      state.lifecycle = ModelLifecycleState.Ready;
      state.lastStateChangeTime = Date.now();
      return createStandardResult(true);
    }),
    
    terminate: jest.fn().mockImplementation(async () => {
      state.lifecycle = ModelLifecycleState.Terminated;
      state.lastStateChangeTime = Date.now();
      return createStandardResult(true);
    }),
    
    getState: jest.fn().mockImplementation(() => ({ ...state })),
    
    // Enhanced with ModelInterface methods
    reset: jest.fn().mockImplementation(async () => {
      entries.length = 0;
      state.operationCount = {
        total: 0,
        success: 0,
        failed: 0
      };
      if (state.stats) {
        Object.keys(state.stats).forEach(key => {
          const logLevel = Number(key) as LogLevel;
          state.stats![logLevel] = 0;
        });
      }
      state.recentEntries = [];
      state.lastStateChangeTime = Date.now();
      return createStandardResult(true);
    }),
    
    process: jest.fn().mockImplementation(async <T, R>(input: T): Promise<ModelResult<R>> => {
      try {
        if (typeof input === 'object' && input !== null) {
          const request = input as any;
          if (request.operation === 'log' && request.level !== undefined && request.message) {
            addEntry(request.level, request.message, request.data);
            return createStandardResult(true, undefined as unknown as R);
          }
        }
        
        return createStandardResult(false, undefined as unknown as R, 'Invalid operation');
      } catch (error: any) {
        state.operationCount.failed++;
        return createStandardResult(false, undefined as unknown as R, error.message);
      }
    }),
    
    createResult: jest.fn().mockImplementation(<T>(success: boolean, data?: T, error?: string): ModelResult<T> => 
      createStandardResult(success, data, error)),
    
    // Logging specific methods - all as Jest spies
    log: jest.fn().mockImplementation(async (level: LogLevel, message: string, data?: unknown): Promise<ModelResult<unknown>> => {
      addEntry(level, message, data);
      return createStandardResult(true);
    }),
    
    trace: jest.fn().mockImplementation(async (message: string, data?: unknown): Promise<ModelResult<unknown>> => {
      addEntry(LogLevel.TRACE, message, data);
      return createStandardResult(true);
    }),
    
    debug: jest.fn().mockImplementation(async (message: string, data?: unknown): Promise<ModelResult<unknown>> => {
      addEntry(LogLevel.DEBUG, message, data);
      return createStandardResult(true);
    }),
    
    info: jest.fn().mockImplementation(async (message: string, data?: unknown): Promise<ModelResult<unknown>> => {
      addEntry(LogLevel.INFO, message, data);
      return createStandardResult(true);
    }),
    
    warn: jest.fn().mockImplementation(async (message: string, data?: unknown): Promise<ModelResult<unknown>> => {
      addEntry(LogLevel.WARN, message, data);
      return createStandardResult(true);
    }),
    
    error: jest.fn().mockImplementation(async (message: string, data?: unknown): Promise<ModelResult<unknown>> => {
      addEntry(LogLevel.ERROR, message, data);
      return createStandardResult(true);
    }),
    
    fatal: jest.fn().mockImplementation(async (message: string, data?: unknown): Promise<ModelResult<unknown>> => {
      addEntry(LogLevel.FATAL, message, data);
      return createStandardResult(true);
    }),
    
    // Additional required methods
    getEntries: jest.fn().mockImplementation((count?: number): LogEntry[] => {
      const limit = count || entries.length;
      return entries.slice(0, limit);
    }),
    
    clearHistory: jest.fn().mockImplementation(async (): Promise<ModelResult<unknown>> => {
      entries.length = 0;
      state.recentEntries = [];
      return createStandardResult(true);
    })
  };
  
  return mockLogger;
}
