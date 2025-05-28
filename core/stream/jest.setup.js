/**
 * Jest setup for Stream module
 */

// Mock global crypto for testing
global.crypto = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
};

// Mock performance API for testing
global.performance = {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  clearMarks: () => {},
  clearMeasures: () => {},
  getEntriesByType: () => [],
  getEntriesByName: () => []
};

// Setup global test environment
global.jest = jest;

// Track all timers and intervals for cleanup
let activeTimers = new Set();
let activeIntervals = new Set();

// Override setTimeout and setInterval to track handles
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;

global.setTimeout = function(callback, delay, ...args) {
  const handle = originalSetTimeout.call(this, callback, delay, ...args);
  activeTimers.add(handle);
  return handle;
};

global.setInterval = function(callback, delay, ...args) {
  const handle = originalSetInterval.call(this, callback, delay, ...args);
  activeIntervals.add(handle);
  return handle;
};

global.clearTimeout = function(handle) {
  activeTimers.delete(handle);
  return originalClearTimeout.call(this, handle);
};

global.clearInterval = function(handle) {
  activeIntervals.delete(handle);
  return originalClearInterval.call(this, handle);
};

// Clean up all active timers and intervals after each test
afterEach(() => {
  // Clear all active timers
  for (const timer of activeTimers) {
    originalClearTimeout(timer);
  }
  activeTimers.clear();
  
  // Clear all active intervals
  for (const interval of activeIntervals) {
    originalClearInterval(interval);
  }
  activeIntervals.clear();
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Final cleanup after all tests
afterAll(() => {
  // Clear any remaining timers
  for (const timer of activeTimers) {
    originalClearTimeout(timer);
  }
  activeTimers.clear();
  
  for (const interval of activeIntervals) {
    originalClearInterval(interval);
  }
  activeIntervals.clear();
  
  // Force garbage collection
  if (global.gc) {
    global.gc();
  }
});
