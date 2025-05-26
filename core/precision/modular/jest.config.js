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
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^../../../os/model$': '<rootDir>/../../../os/model/__mocks__',
    '^../../../os/logging$': '<rootDir>/../../../os/logging/__mocks__',
    '^../../cache$': '<rootDir>/../cache/__mocks__',
    '^../cache$': '<rootDir>/cache/__mocks__'
  }
};
