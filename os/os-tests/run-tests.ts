/**
 * Run All Tests Script
 * ===================
 * 
 * This script coordinates running both the main os-tests and the mocks tests.
 */

import * as jest from 'jest';
import * as path from 'path';
import * as fs from 'fs';

// Get the current directory
const currentDir = __dirname;

// Define test patterns
const ALL_TESTS = '**/*.test.ts';
const MOCK_TESTS = '**/mocks/**/*.test.ts';
const FRAMEWORK_TESTS = 'test.ts';

// Parse command line arguments
const args = process.argv.slice(2);
const runMocks = args.includes('--mocks') || args.includes('-m');
const runFramework = args.includes('--framework') || args.includes('-f');
const silent = args.includes('--silent') || args.includes('-s');
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
PrimeOS Testing Framework Runner
===============================

Usage: node run-tests.js [options]

Options:
  --help, -h       Show this help message
  --mocks, -m      Run only mock tests
  --framework, -f  Run only framework tests (test.ts)
  --silent, -s     Run with minimal output
  
Default: Runs all tests
`);
  process.exit(0);
}

// Based on args, determine which test pattern to use
let testPattern = ALL_TESTS;
if (runMocks && !runFramework) {
  testPattern = MOCK_TESTS;
} else if (runFramework && !runMocks) {
  testPattern = FRAMEWORK_TESTS;
}

async function runTests() {
  try {
    console.log(`Running PrimeOS tests with pattern: ${testPattern}`);
    
    const jestArgs = [
      '--runInBand',            // Run tests sequentially
      '--colors',               // Use colors in output
      '--testMatch', `**/${testPattern}`
    ];
    
    // Add verbose flag if not silent
    if (!silent) {
      jestArgs.push('--verbose');
    }
    
    // If we have a test config file, use it
    const configPath = path.join(currentDir, 'jest.config.js');
    if (fs.existsSync(configPath)) {
      jestArgs.push('--config', configPath);
    }
    
    // Run Jest with our arguments
    await jest.run(jestArgs);
    
    // If we get here without an error, tests passed
    console.log('✅ All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
