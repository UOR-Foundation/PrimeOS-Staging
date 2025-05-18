/**
 * OS Logging Mock for BigInt Module
 * 
 * This file re-exports the logging mock from the logging's mocks directory
 * to maintain compatibility with the module's test infrastructure.
 */

// Import the interface from the types file
import { LoggingInterface } from '../../../../os/logging/types';

// Import the mock implementation
import {
  LogLevel,
  LogEntry,
  LoggingOptions,
  createLogging
} from '../../../../os/logging/__mocks__';

// Re-export everything
export {
  LogLevel,
  LogEntry,
  LoggingOptions,
  LoggingInterface,
  createLogging
};
