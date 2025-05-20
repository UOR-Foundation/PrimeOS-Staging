/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // Allow BigInt literals
        target: 'esnext'
      }
    }]
  },
  testMatch: ['**/*.test.ts', '**/*.spec.ts', '**/test.ts'],
  // Add babel support for BigInt literals
  globals: {
    'ts-jest': {
      babelConfig: {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript'
        ],
        plugins: [
          "@babel/plugin-syntax-bigint"
        ]
      }
    }
  },
  // Setup file
  setupFilesAfterEnv: ['./jest.setup.js']
};
