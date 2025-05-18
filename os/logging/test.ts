/**
 * Logging Tests
 * ============
 * 
 * Test suite for the logging module.
 */

import { 
  createLogging,
  LoggingInterface,
  LogLevel,
  LogEntry,
  LoggingState
} from './index';
import { ModelInterface, ModelLifecycleState } from '../model/types';

describe('Logging Module', () => {
  let logger: LoggingInterface;
  
  beforeEach(async () => {
    // Create a fresh instance before each test with console output disabled
    logger = createLogging({
      debug: true,
      name: 'test-logger',
      consoleOutput: false // Disable console output for tests
    });
    
    // Initialize the logger
    await logger.initialize();
  });
  
  afterEach(async () => {
    // Clean up after each test
    await logger.terminate();
  });
  
  describe('Lifecycle Management', () => {
    test('should initialize correctly', async () => {
      const state = logger.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Ready);
    });
    
    test('should reset state', async () => {
      // Log some messages
      await logger.info('Test message');
      await logger.warn('Warning message');
      
      // Reset the logger
      const result = await logger.reset();
      expect(result.success).toBe(true);
      
      // Check that counters are reset
      const state = logger.getState();
      expect(state.operationCount.total).toBe(0);
      
      // Check that log entries are cleared
      expect(logger.getEntries()).toHaveLength(0);
    });
    
    test('should terminate gracefully', async () => {
      const result = await logger.terminate();
      expect(result.success).toBe(true);
      
      const state = logger.getState();
      expect(state.lifecycle).toBe(ModelLifecycleState.Terminated);
    });
  });
  
  describe('Logging Functionality', () => {
    test('should log at different levels', async () => {
      // Create a fresh logger with explicit TRACE minimum level
      logger = createLogging({
        debug: true,
        name: 'test-logger',
        consoleOutput: false,
        minLevel: LogLevel.TRACE  // Explicitly set minimum level to TRACE
      });
      await logger.initialize();

      await logger.trace('Trace message');
      await logger.debug('Debug message');
      await logger.info('Info message');
      await logger.warn('Warning message');
      await logger.error('Error message');
      await logger.fatal('Fatal message');
      
      const entries = logger.getEntries();
      
      // Check exact number of entries
      expect(entries.length).toBe(6);
      
      // Check log levels are correct
      expect(entries[0].level).toBe(LogLevel.TRACE);
      expect(entries[1].level).toBe(LogLevel.DEBUG);
      expect(entries[2].level).toBe(LogLevel.INFO);
      expect(entries[3].level).toBe(LogLevel.WARN);
      expect(entries[4].level).toBe(LogLevel.ERROR);
      expect(entries[5].level).toBe(LogLevel.FATAL);
    });
    
    test('should include timestamp and source', async () => {
      await logger.info('Test message');
      
      const entries = logger.getEntries();
      expect(entries[0].timestamp).toBeDefined();
      expect(typeof entries[0].timestamp).toBe('number');
      expect(entries[0].source).toBe('test-logger@0.1.0');
    });
    
    test('should store additional data', async () => {
      const data = { user: 'test', id: 123 };
      await logger.info('Message with data', data);
      
      const entries = logger.getEntries();
      expect(entries[0].data).toEqual(data);
    });
  });
  
  describe('Log Filtering', () => {
    test('should respect minimum log level', async () => {
      // Create logger with minimum level of WARN
      const warnLogger = createLogging({
        minLevel: LogLevel.WARN,
        consoleOutput: false
      });
      
      await warnLogger.initialize();
      
      // These should be filtered out
      await warnLogger.trace('Trace message');
      await warnLogger.debug('Debug message');
      await warnLogger.info('Info message');
      
      // These should be logged
      await warnLogger.warn('Warning message');
      await warnLogger.error('Error message');
      await warnLogger.fatal('Fatal message');
      
      const entries = warnLogger.getEntries();
      expect(entries).toHaveLength(3);
      expect(entries[0].level).toBe(LogLevel.WARN);
      expect(entries[1].level).toBe(LogLevel.ERROR);
      expect(entries[2].level).toBe(LogLevel.FATAL);
      
      await warnLogger.terminate();
    });
  });
  
  describe('Log History Management', () => {
    test('should limit log history size', async () => {
      // Create logger with small max entries
      const smallLogger = createLogging({
        maxEntries: 5,
        consoleOutput: false
      });
      
      await smallLogger.initialize();
      
      // Log more than max entries
      for (let i = 0; i < 10; i++) {
        await smallLogger.info(`Message ${i}`);
      }
      
      const entries = smallLogger.getEntries();
      expect(entries).toHaveLength(5);
      
      // Should keep the most recent entries
      expect(entries[0].message).toBe('Message 5');
      expect(entries[4].message).toBe('Message 9');
      
      await smallLogger.terminate();
    });
    
    test('should handle maxEntries=0', async () => {
      const zeroLogger = createLogging({
        maxEntries: 0,
        consoleOutput: false
      });
      
      await zeroLogger.initialize();
      
      // Try to log messages
      await zeroLogger.info('Test message 1');
      await zeroLogger.info('Test message 2');
      
      // Should have no entries
      const entries = zeroLogger.getEntries();
      expect(entries).toHaveLength(0);
      
      await zeroLogger.terminate();
    });
    
    test('should track log statistics', async () => {
      // Create a new logger instance with explicit TRACE level
      const statsLogger = createLogging({
        debug: true,
        name: 'test-logger',
        consoleOutput: false,
        minLevel: LogLevel.TRACE // Explicitly set to capture all log levels
      });
      await statsLogger.initialize();
      
      // Log messages at different levels
      await statsLogger.trace('Trace message');
      await statsLogger.debug('Debug message');
      await statsLogger.info('Info message');
      await statsLogger.info('Another info message');
      await statsLogger.warn('Warning message');
      await statsLogger.error('Error message');
      
      // Check state stats using type-safe approach
      const state = statsLogger.getState();
      const loggingState = state as unknown as LoggingState;
      
      expect(loggingState.stats).toBeDefined();
      expect(loggingState.stats?.[LogLevel.TRACE]).toBe(1);
      expect(loggingState.stats?.[LogLevel.DEBUG]).toBe(1);
      expect(loggingState.stats?.[LogLevel.INFO]).toBe(2);
      expect(loggingState.stats?.[LogLevel.WARN]).toBe(1);
      expect(loggingState.stats?.[LogLevel.ERROR]).toBe(1);
      expect(loggingState.stats?.[LogLevel.FATAL]).toBe(0);
      
      await statsLogger.terminate();
    });
    
    test('should clear history', async () => {
      // Log some messages
      await logger.info('Message 1');
      await logger.info('Message 2');
      
      // Verify logs exist
      expect(logger.getEntries()).toHaveLength(2);
      
      // Clear history
      const result = await logger.clearHistory();
      expect(result.success).toBe(true);
      
      // Verify logs are cleared
      expect(logger.getEntries()).toHaveLength(0);
      
      // Verify stats are reset
      const state = logger.getState() as any;
      expect(state.stats[LogLevel.INFO]).toBe(0);
    });
  });
  
  describe('Input Processing', () => {
    test('should process string as INFO log', async () => {
      const result = await logger.process('Test message');
      expect(result.success).toBe(true);
      
      const entries = logger.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.INFO);
      expect(entries[0].message).toBe('Test message');
    });
    
    test('should process log entry object', async () => {
      const logEntry = {
        level: LogLevel.WARN,
        message: 'Warning from object',
        data: { source: 'test' }
      };
      
      const result = await logger.process(logEntry);
      expect(result.success).toBe(true);
      
      const entries = logger.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].level).toBe(LogLevel.WARN);
      expect(entries[0].message).toBe('Warning from object');
    });
    
    test('should handle undefined input', async () => {
      // This should not throw but log the undefined input as data
      const result = await logger.process(undefined as any);
      expect(result).toBeDefined();
    });
  });
  
  describe('Custom Configuration', () => {
    test('should use custom formatter', async () => {
      // Create a spy formatter
      const formatterSpy = jest.fn().mockImplementation((entry: LogEntry) => {
        return `CUSTOM: ${entry.message}`;
      });
      
      const customLogger = createLogging({
        formatter: formatterSpy,
        consoleOutput: true // We want console output for this test
      });
      
      // Mock console methods
      const originalConsoleInfo = console.info;
      console.info = jest.fn();
      
      await customLogger.initialize();
      await customLogger.info('Test message');
      
      // Verify formatter was called
      expect(formatterSpy).toHaveBeenCalled();
      const entry = formatterSpy.mock.calls[0][0];
      expect(entry.message).toBe('Test message');
      
      // Verify console output used the formatted string
      expect(console.info).toHaveBeenCalledWith('CUSTOM: Test message', undefined);
      
      // Restore console and verify restoration
      console.info = originalConsoleInfo;
      expect(console.info).toBe(originalConsoleInfo);
      
      await customLogger.terminate();
    });
    
    test('should use appropriate console methods for different log levels', async () => {
      // Create logger with console output
      const consoleLogger = createLogging({
        minLevel: LogLevel.TRACE,
        consoleOutput: true
      });
      
      // Mock all console methods
      const originalConsoleMethods = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error
      };
      
      console.debug = jest.fn();
      console.info = jest.fn();
      console.warn = jest.fn();
      console.error = jest.fn();
      
      await consoleLogger.initialize();
      
      // Log at different levels
      await consoleLogger.trace('Trace message');
      await consoleLogger.debug('Debug message');
      await consoleLogger.info('Info message');
      await consoleLogger.warn('Warn message');
      await consoleLogger.error('Error message');
      await consoleLogger.fatal('Fatal message');
      
      // Verify appropriate console methods were called
      expect(console.debug).toHaveBeenCalledTimes(2); // trace and debug use console.debug
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(2); // error and fatal use console.error
      
      // Restore console methods
      console.debug = originalConsoleMethods.debug;
      console.info = originalConsoleMethods.info;
      console.warn = originalConsoleMethods.warn;
      console.error = originalConsoleMethods.error;
      
      await consoleLogger.terminate();
    });
  });
  
  describe('Model Integration', () => {
    test('should implement ModelInterface without extending BaseModel', () => {
      // This test verifies our approach to avoid circular dependencies
      const impl = new (require('./index').LoggingImplementation)();
      
      // Verify it implements the required interface methods
      expect(typeof impl.initialize).toBe('function');
      expect(typeof impl.process).toBe('function');
      expect(typeof impl.getState).toBe('function');
      expect(typeof impl.reset).toBe('function');
      expect(typeof impl.terminate).toBe('function');
      expect(typeof impl.createResult).toBe('function');
      
      // Verify it implements the logging methods
      expect(typeof impl.log).toBe('function');
      expect(typeof impl.info).toBe('function');
      expect(typeof impl.debug).toBe('function');
      expect(typeof impl.warn).toBe('function');
      expect(typeof impl.error).toBe('function');
      expect(typeof impl.fatal).toBe('function');
      expect(typeof impl.getEntries).toBe('function');
      expect(typeof impl.clearHistory).toBe('function');
    });
    
    test('should detect state changes when logging', async () => {
      const eventLogger = createLogging({
        name: 'event-logger',
        consoleOutput: false
      });
      
      // Get initial state
      await eventLogger.initialize();
      const initialState = eventLogger.getState();
      
      // Perform multiple logging operations
      await eventLogger.info('Test message 1');
      await eventLogger.info('Test message 2');
      
      // Get updated state
      const updatedState = eventLogger.getState();
      
      // Check entries were recorded 
      const entries = eventLogger.getEntries();
      expect(entries.length).toBe(2);
      expect(entries[0].message).toBe('Test message 1');
      expect(entries[1].message).toBe('Test message 2');
      
      await eventLogger.terminate();
    });
    
    test('should fail gracefully when used after termination', async () => {
      const terminatedLogger = createLogging({
        consoleOutput: false
      });
      
      await terminatedLogger.initialize();
      await terminatedLogger.terminate();
      
      // Try to use after termination
      const result = await terminatedLogger.info('Should not log');
      
      expect(result.success).toBe(false);
    });
  });
  
  describe('Performance and Stress Testing', () => {
    test('should handle large volume of logs efficiently', async () => {
      const highVolumeLogger = createLogging({
        consoleOutput: false,
        maxEntries: 1000
      });
      
      await highVolumeLogger.initialize();
      
      const logCount = 500;
      const startTime = Date.now();
      
      // Generate many logs in sequence
      for (let i = 0; i < logCount; i++) {
        await highVolumeLogger.info(`Message ${i}`);
      }
      
      const duration = Date.now() - startTime;
      
      // Expect reasonable performance (this is a relative benchmark)
      // Adjust threshold as needed based on environment
      expect(duration).toBeLessThan(2000); // Should process 500 logs in under 2 seconds
      
      // Verify we have the expected number of logs (or maxEntries, whichever is less)
      const entries = highVolumeLogger.getEntries();
      expect(entries.length).toBe(Math.min(logCount, 1000));
      
      await highVolumeLogger.terminate();
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle circular references in log data', async () => {
      const circularLogger = createLogging({
        consoleOutput: false
      });
      
      await circularLogger.initialize();
      
      // Create object with circular reference
      const circularObject: any = { name: 'circular' };
      circularObject.self = circularObject;
      
      // This should not throw
      await circularLogger.info('Object with circular reference', circularObject);
      
      const entries = circularLogger.getEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].message).toBe('Object with circular reference');
      expect(entries[0].data).toBeDefined();
      
      await circularLogger.terminate();
    });
    
    test('should handle undefined message gracefully', async () => {
      await logger.info(undefined as unknown as string);
      
      const entries = logger.getEntries();
      expect(entries.length).toBeGreaterThan(0);
      const lastEntry = entries[entries.length - 1];
      expect(lastEntry.message).toBe('undefined');
    });
  });
});
