/**
 * Logging Module Mock for Utils
 * 
 * This file mocks the logging module for the utils module tests.
 * It directly uses the os/logging mock to avoid circular dependencies.
 */

// Import the LoggingInterface from the actual types file
import { LoggingInterface } from '../../../../os/logging/types';

// Import directly from the os/logging mocks to avoid circular dependency
import { createLogging as createOsLogging } from '../../../../os/logging/__mocks__';

// Export createLogging for the tests
export function createLogging(options: any = {}): LoggingInterface {
  return createOsLogging(options);
}

// Re-export everything else from the os/logging mocks
export * from '../../../../os/logging/__mocks__';
