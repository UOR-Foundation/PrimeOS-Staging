/**
 * OS Logging Mock
 * This file re-exports the enhanced logging mock from os/logging/__mocks__
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
