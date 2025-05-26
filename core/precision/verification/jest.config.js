module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  moduleNameMapper: {
    // Map os modules to mocks - comprehensive coverage
    '^../../../os/model$': '<rootDir>/../../../os/model/__mocks__',
    '^../../../os/logging$': '<rootDir>/../../../os/logging/__mocks__',
    '^../../../../os/model$': '<rootDir>/../../../os/model/__mocks__',
    '^../../../../os/logging$': '<rootDir>/../../../os/logging/__mocks__',
    '^../../../../../os/model$': '<rootDir>/../../../os/model/__mocks__',
    '^../../../../../os/logging$': '<rootDir>/../../../os/logging/__mocks__',
    // Map type imports
    '^../../../os/model/types$': '<rootDir>/../../../os/model/__mocks__',
    '^../../../os/logging/types$': '<rootDir>/../../../os/logging/__mocks__',
    '^../../../../os/model/types$': '<rootDir>/../../../os/model/__mocks__',
    '^../../../../os/logging/types$': '<rootDir>/../../../os/logging/__mocks__',
    '^../../../../../os/model/types$': '<rootDir>/../../../os/model/__mocks__',
    '^../../../../../os/logging/types$': '<rootDir>/../../../os/logging/__mocks__',
    // Map cache imports to cache mock
    '^../cache$': '<rootDir>/../cache/__mocks__',
    '^../cache/index$': '<rootDir>/../cache/__mocks__'
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
      tsconfig: '<rootDir>/../tsconfig.test.json'
    }]
  }
};
