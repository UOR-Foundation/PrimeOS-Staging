/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  rootDir: '.',
  // Add the reconstructFromFactors utility that's missing in the index.ts but used in tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
