module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/__mocks__/**',
    '!**/*.test.ts',
    '!**/*.spec.ts',
    '!**/test.ts'
  ],
  moduleNameMapping: {
    '^@primeos/core$': '<rootDir>/index.ts',
    '^@primeos/core/(.*)$': '<rootDir>/$1',
    '^@primeos/os-model$': '<rootDir>/../os/model',
    '^@primeos/os-logging$': '<rootDir>/../os/logging',
    '^@primeos/os-tests$': '<rootDir>/../os/os-tests'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
  verbose: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  maxWorkers: 4
};
