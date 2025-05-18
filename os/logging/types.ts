/**
 * Logging Types
 * =======
 * 
 * Type definitions for the logging module.
 */

import { 
  ModelOptions, 
  ModelInterface, 
  ModelResult, 
  ModelState 
} from '../model/types';

/**
 * Log level enumeration
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  NONE = 6
}

/**
 * Log entry structure
 */
export interface LogEntry {
  /**
   * Timestamp in milliseconds
   */
  timestamp: number;
  
  /**
   * Log level
   */
  level: LogLevel;
  
  /**
   * Source module or component
   */
  source: string;
  
  /**
   * Log message
   */
  message: string;
  
  /**
   * Optional additional data
   */
  data?: unknown;
}

/**
 * Configuration options for logging
 */
export interface LoggingOptions extends ModelOptions {
  /**
   * Minimum log level to output
   */
  minLevel?: LogLevel;
  
  /**
   * Maximum number of entries to keep in memory
   */
  maxEntries?: number;
  
  /**
   * Whether to output logs to console
   */
  consoleOutput?: boolean;
  
  /**
   * Custom formatter for log entries
   */
  formatter?: (entry: LogEntry) => string;
}

/**
 * Extended state for logging module
 */
export interface LoggingState extends ModelState {
  /**
   * Recent log entries
   */
  recentEntries?: LogEntry[];
  
  /**
   * Statistics by log level
   */
  stats?: Record<LogLevel, number>;
}

/**
 * Core interface for logging functionality
 */
export interface LoggingInterface extends ModelInterface {
  /**
   * Log a message at specified level
   */
  log(level: LogLevel, message: string, data?: unknown): Promise<ModelResult>;
  
  /**
   * Convenience method for TRACE level
   */
  trace(message: string, data?: unknown): Promise<ModelResult>;
  
  /**
   * Convenience method for DEBUG level
   */
  debug(message: string, data?: unknown): Promise<ModelResult>;
  
  /**
   * Convenience method for INFO level
   */
  info(message: string, data?: unknown): Promise<ModelResult>;
  
  /**
   * Convenience method for WARN level
   */
  warn(message: string, data?: unknown): Promise<ModelResult>;
  
  /**
   * Convenience method for ERROR level
   */
  error(message: string, data?: unknown): Promise<ModelResult>;
  
  /**
   * Convenience method for FATAL level
   */
  fatal(message: string, data?: unknown): Promise<ModelResult>;
  
  /**
   * Get recent log entries
   */
  getEntries(count?: number): LogEntry[];
  
  /**
   * Clear log history
   */
  clearHistory(): Promise<ModelResult>;
}
