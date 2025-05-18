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
  moduleFileExtensions: ['ts', 'js', 'json'],
  rootDir: '.',
  setupFilesAfterEnv: ['./jest.setup.js']
};
