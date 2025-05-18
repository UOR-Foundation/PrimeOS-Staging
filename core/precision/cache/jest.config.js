/**
 * Jest configuration for cache module
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/test\\.ts)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/__mocks__/**'
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['./jest.setup.js']
};
