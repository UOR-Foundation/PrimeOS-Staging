/**
 * Jest setup for Prime module
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

// Setup global test environment
global.jest = jest;
