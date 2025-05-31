// Jest setup for PrimeOS Core package
// Global test configuration and polyfills

// Configure BigInt support for JSON serialization in tests
if (typeof BigInt !== 'undefined') {
  BigInt.prototype.toJSON = function() {
    return this.toString();
  };
}

// Mock performance.now if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now()
  };
}

// Configure test timeouts
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  createMockLogger: () => ({
    debug: jest.fn().mockResolvedValue(undefined),
    info: jest.fn().mockResolvedValue(undefined),
    warn: jest.fn().mockResolvedValue(undefined),
    error: jest.fn().mockResolvedValue(undefined),
    trace: jest.fn().mockResolvedValue(undefined)
  }),
  
  createMockModelResult: (success = true, data = undefined, error = undefined) => ({
    success,
    data,
    error,
    timestamp: Date.now(),
    source: 'test'
  }),
  
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Suppress console output during tests unless explicitly needed
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error // Keep error for debugging
};
