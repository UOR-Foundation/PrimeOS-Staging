/**
 * Jest setup file for precision cache module
 * 
 * This file runs before each test file to set up the environment
 */

// Set longer timeout for slow tests
jest.setTimeout(10000);

// Mock the global performance.now() if not available in test environment
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now()
  };
}

// Clean up after all tests
afterAll(() => {
  // Reset any global state that might affect other tests
});
