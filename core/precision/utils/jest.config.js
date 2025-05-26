/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        target: 'esnext',
        lib: ['esnext'],
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
        strict: false, // Disable strict mode to allow implicit any
        types: ['jest', 'node']
      }
    }]
  },
  testMatch: ['**/*.test.ts', '**/*.spec.ts', '**/test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Map os module imports to their respective mock files
    '^../../../os/model$': '<rootDir>/__mocks__/os-model-mock',
    '^../../../os/model/types$': '<rootDir>/__mocks__/os-model-mock',
    '^../../../os/logging$': '<rootDir>/__mocks__/os-logging-mock',
    '^../../../os/logging/types$': '<rootDir>/__mocks__/os-logging-mock',
    
    // Map cache imports to cache mocks
    '^../cache$': '<rootDir>/../cache/__mocks__',
    '^../cache/index$': '<rootDir>/../cache/__mocks__',
    '^../cache/types$': '<rootDir>/../cache/__mocks__',
    
    // Additional patterns for nested imports
    '^../../../../os/model$': '<rootDir>/__mocks__/os-model-mock',
    '^../../../../os/logging$': '<rootDir>/__mocks__/os-logging-mock'
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__mocks__/**'
  ]
};
