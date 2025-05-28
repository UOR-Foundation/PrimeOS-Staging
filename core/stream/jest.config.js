module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  moduleNameMapper: {
    // Map os modules to their actual locations
    '^../../os/model$': '<rootDir>/../../os/model',
    '^../../os/logging$': '<rootDir>/../../os/logging',
    '^../../os/model/types$': '<rootDir>/../../os/model/types',
    '^../../os/logging/types$': '<rootDir>/../../os/logging/types',
    // Map core modules
    '^../prime$': '<rootDir>/../prime',
    '^../encoding$': '<rootDir>/../encoding',
    '^../integrity$': '<rootDir>/../integrity',
    '^../precision$': '<rootDir>/../precision'
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/jest.config.js'
  ],
  testTimeout: 10000,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json'
    }]
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  verbose: true,
  // Clear all timers and handles after each test
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
