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
    '^../../../os/model$': '<rootDir>/../__mocks__/os-model-mock',
    '^../../../os/logging$': '<rootDir>/../__mocks__/os-logging-mock'
  },
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__mocks__/**'
  ]
};
