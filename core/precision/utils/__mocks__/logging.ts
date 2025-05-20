/**
 * Logging Module Mock for Utils
 * 
 * This file mocks the logging module for the utils module tests.
 */

// Import the LoggingInterface from the actual types file
import { LoggingInterface } from '../../../../os/logging/types';

// Import the createLoggingMock function
import { createLoggingMock } from './os-logging-mock';

// Export createLoggingMock as createLogging for the tests
export function createLogging(options: any = {}): LoggingInterface {
  return createLoggingMock();
}

// Re-export everything else from the os-logging-mock
export * from './os-logging-mock';
