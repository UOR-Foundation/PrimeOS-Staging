module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  moduleNameMapper: {
    // Map core modules to their actual locations
    '^../prime$': '<rootDir>/../prime',
    '^../prime/(.*)$': '<rootDir>/../prime/$1',
    '^../integrity$': '<rootDir>/../integrity',
    '^../integrity/(.*)$': '<rootDir>/../integrity/$1',
    '^../precision$': '<rootDir>/../precision',
    '^../precision/(.*)$': '<rootDir>/../precision/$1',
    // Map os modules to their actual locations
    '^../../os/model$': '<rootDir>/../../os/model',
    '^../../os/logging$': '<rootDir>/../../os/logging',
    '^../../os/model/types$': '<rootDir>/../../os/model/types',
    '^../../os/logging/types$': '<rootDir>/../../os/logging/types'
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/jest.config.js',
    '!**/__mocks__/**'
  ],
  testTimeout: 30000,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json'
    }]
  },
  setupFilesAfterEnv: ['<rootDir>/__mocks__/index.ts'],
  verbose: true
};
