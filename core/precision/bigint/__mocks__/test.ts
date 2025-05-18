/**
 * BigInt Mocks Test Runner
 * 
 * This file runs the BigInt mock tests.
 * Jest is configured to run files named 'test.ts', so this file imports and runs
 * the tests from mock.test.ts.
 */
/// <reference types="jest" />

import { describe, it, expect } from '@jest/globals';

// Import and re-export the tests from mock.test.ts
import './mock.test';

// Additional mocks-specific tests can be added here

describe('BigInt Mocks Test Runner', () => {
  it('successfully loads mock tests', () => {
    // This is just a simple test to verify the test runner works
    expect(true).toBe(true);
  });
});
