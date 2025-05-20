/**
 * Jest setup file for precision modular module
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

// Add BigInt support for Jest serialization
// This is needed because Jest's default serializer doesn't handle BigInt
expect.addSnapshotSerializer({
  test: (val) => typeof val === 'bigint',
  print: (val) => `BigInt(${val.toString()})`
});

// Clean up after all tests
afterAll(() => {
  // Reset any global state that might affect other tests
});
