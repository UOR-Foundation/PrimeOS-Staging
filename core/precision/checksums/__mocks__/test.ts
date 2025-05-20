/**
 * Checksums Mocks Test Runner
 * 
 * This file runs the checksums mock tests.
 * Jest is configured to run files named 'test.ts', so this file imports and runs
 * the tests from mock.test.ts.
 */
/// <reference types="jest" />

// Import the tests from mock.test.ts
require('./mock.test');

// Additional mocks-specific tests
describe('Checksums Mocks Test Runner', () => {
  test('successfully loads mock tests', () => {
    // This is just a simple test to verify the test runner works
    expect(true).toBe(true);
  });
});
