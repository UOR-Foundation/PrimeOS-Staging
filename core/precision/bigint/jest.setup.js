/**
 * Jest setup for BigInt module
 */

// Extend Jest matchers
expect.extend({
  toBeInstanceOf(received, expected) {
    const pass = received instanceof expected;
    if (pass) {
      return {
        message: () => `expected ${received} not to be an instance of ${expected.name}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be an instance of ${expected.name}`,
        pass: false,
      };
    }
  }
});

// Mock global crypto for testing
global.crypto = {
  getRandomValues: (array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
};

// Setup global test environment
global.jest = jest;
