// This file is used to set up the test environment
// It will be executed before each test file is run

// Set up global variables or mocks if needed
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set up BigInt serialization for Jest snapshots
expect.addSnapshotSerializer({
  test: (val) => typeof val === 'bigint',
  print: (val) => `${val.toString()}n`,
});

// Mock any global APIs if needed
