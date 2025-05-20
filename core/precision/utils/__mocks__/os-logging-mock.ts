/**
 * Mock implementation of the logging module
 */

import { LoggingInterface, LogLevel } from '../../../../os/logging/types';

/**
 * Create a mock logging implementation
 */
export function createLoggingMock(): LoggingInterface {
  return {
    initialize: jest.fn().mockResolvedValue({ success: true }),
    terminate: jest.fn().mockResolvedValue({ success: true }),
    log: jest.fn().mockResolvedValue({}),
    trace: jest.fn().mockResolvedValue({}),
    debug: jest.fn().mockResolvedValue({}),
    info: jest.fn().mockResolvedValue({}),
    warn: jest.fn().mockResolvedValue({}),
    error: jest.fn().mockResolvedValue({}),
    fatal: jest.fn().mockResolvedValue({}),
    getState: jest.fn().mockReturnValue({
      lifecycle: 'ready',
      lastStateChangeTime: Date.now(),
      uptime: 0,
      operationCount: {
        total: 0,
        success: 0,
        failed: 0
      }
    }),
    getEntries: jest.fn().mockReturnValue([]),
    clearHistory: jest.fn().mockResolvedValue({ success: true }),
    process: jest.fn().mockResolvedValue({ success: true }),
    reset: jest.fn().mockResolvedValue({ success: true }),
    createResult: jest.fn().mockImplementation((success, data, error) => ({
      success,
      data,
      error,
      timestamp: Date.now(),
      source: 'mock-logging'
    }))
  };
}

// Export a default instance
export const loggingMock = createLoggingMock();
