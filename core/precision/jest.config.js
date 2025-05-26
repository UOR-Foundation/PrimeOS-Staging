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
  moduleNameMapper: {
    // Map os modules to mocks - comprehensive coverage
    '^../../../os/model$': '<rootDir>/../../os/model/__mocks__',
    '^../../../os/logging$': '<rootDir>/../../os/logging/__mocks__',
    '^../../../os/model/types$': '<rootDir>/../../os/model/__mocks__',
    '^../../../os/logging/types$': '<rootDir>/../../os/logging/__mocks__',
    
    // Additional os module patterns for nested imports
    '^../../../../os/model$': '<rootDir>/../../os/model/__mocks__',
    '^../../../../os/logging$': '<rootDir>/../../os/logging/__mocks__',
    '^../../../../os/model/types$': '<rootDir>/../../os/model/__mocks__',
    '^../../../../os/logging/types$': '<rootDir>/../../os/logging/__mocks__',
    
    // Cache module mappings for utils module
    '^../cache$': '<rootDir>/cache/__mocks__',
    '^../cache/index$': '<rootDir>/cache/__mocks__',
    '^../cache/types$': '<rootDir>/cache/__mocks__',
    
    // Internal mock cross-references (this is the key fix!)
    '^../../__mocks__/os-model-mock$': '<rootDir>/__mocks__/os-model-mock',
    '^../../__mocks__/os-logging-mock$': '<rootDir>/__mocks__/os-logging-mock',
    '^../../../__mocks__/os-model-mock$': '<rootDir>/__mocks__/os-model-mock',
    '^../../../__mocks__/os-logging-mock$': '<rootDir>/__mocks__/os-logging-mock'
  },
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
