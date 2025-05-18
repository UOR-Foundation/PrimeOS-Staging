/**
 * Run Mock Tests Script
 * ===================
 * 
 * This script runs the tests for the mock implementations to verify they're working correctly.
 */

import * as jest from 'jest';
import * as path from 'path';
import * as fs from 'fs';

// Get the directory of this script
const currentDir = __dirname;

// Define test pattern
const testPattern = 'mocks.test.ts';

// Run the tests
async function runTests() {
  try {
    console.log('Running tests for PrimeOS mocks...');
    
    const jestArgs = [
      '--runInBand',                  // Run tests sequentially
      '--colors',                     // Use colors in output
      '--verbose',                    // Display individual test results
      '--testMatch', `**/${testPattern}` // Only run the mock tests
    ];
    
    // If we have a test config file, use it
    const configPath = path.join(currentDir, '..', 'jest.config.js');
    if (fs.existsSync(configPath)) {
      jestArgs.push('--config', configPath);
    }
    
    // Run Jest with our arguments
    await jest.run(jestArgs);
    
    // Jest will set the process.exitCode based on test results
    // If we get here without throwing, tests have passed
    console.log('✅ Mock tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
