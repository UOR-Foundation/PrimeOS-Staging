module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    '!**/__mocks__/**'
  ],
  // Exclude individual module __mocks__ directories from Jest's automatic discovery
  // This prevents "duplicate manual mock found" errors
  modulePathIgnorePatterns: [
    '<rootDir>/bigint/__mocks__',
    '<rootDir>/cache/__mocks__',
    '<rootDir>/checksums/__mocks__',
    '<rootDir>/modular/__mocks__',
    '<rootDir>/utils/__mocks__',
    '<rootDir>/verification/__mocks__'
  ],
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__mocks__/**',
    '!**/test.ts',
    '!**/jest.config.js'
  ],
  testTimeout: 10000,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json'
    }]
  },
  verbose: false
};
