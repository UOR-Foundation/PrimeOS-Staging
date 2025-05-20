/**
 * OS Logging Mock for Cache Module
 * 
 * This file re-exports the logging mock from the utils/__mocks__ directory
 * to maintain consistency across precision modules.
 */

// Re-export everything from the utils/__mocks__ directory
export * from '../../utils/__mocks__/os-logging-mock';

// Re-export createLogging from the actual logging module for compatibility
export { createLogging } from '../../../../os/logging';
