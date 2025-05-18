/**
 * Model with Testing Framework Demo
 * ================================
 * 
 * This file demonstrates how to use the model module with the os-tests framework.
 * It serves as a practical example for how to integrate the two modules.
 */

import {
  createModel,
  createModelTestAdapter,
  ModelInterface
} from './index';
import {
  createTestFramework,
  TestFrameworkInterface,
  TestResultStatus
} from '../os-tests';

/**
 * Main demo function to demonstrate the integration between 
 * the model module and the testing framework
 */
async function runModelTests() {
  console.log('=== Model Testing Framework Integration Demo ===');
  console.log('Debug: Starting test at', new Date().toISOString());
  
  // Step 1: Create a model to be tested
  console.log('\n1. Creating model instance...');
  const model = createModel({
    name: 'demo-model',
    version: '1.0.0',
    debug: true
  });
  
  // Step 2: Initialize the model
  console.log('\n2. Initializing model...');
  await model.initialize();
  console.log('   Model initialized successfully');
  
  // Step 3: Create a testing framework instance
  console.log('\n3. Creating testing framework...');
  const testFramework = createTestFramework({
    name: 'model-test-demo',
    verbose: true,
    debug: true,
    reportFormat: 'console'
  });
  
  // Step 4: Initialize the testing framework
  console.log('\n4. Initializing testing framework...');
  await testFramework.initialize();
  console.log('   Testing framework initialized successfully');
  
  // Step 5: Create a model test adapter with custom test cases
  console.log('\n5. Creating model test adapter...');
  console.log('   Debug: Model state before adapter creation:', JSON.stringify(model.getState(), null, 2));
  const testAdapter = createModelTestAdapter(model, {
    tags: ['demo', 'model'],
    testCases: [
      { 
        name: 'string-process', 
        input: 'Hello, PrimeOS!' 
      },
      { 
        name: 'number-process', 
        input: 42 
      },
      { 
        name: 'object-process', 
        input: { key: 'value', nested: { data: true } } 
      },
      { 
        name: 'array-process', 
        input: [1, 2, 3, 'test'] 
      },
      { 
        name: 'expected-match', 
        input: 'expected', 
        expectedResult: 'expected' 
      },
      { 
        name: 'expected-mismatch', 
        input: 'actual', 
        expectedResult: 'expected' 
      }
    ]
  });
  
  // Step 6: Register the model with the testing framework
  console.log('\n6. Registering model with testing framework...');
  console.log('   Debug: Test adapter metadata:', JSON.stringify(testAdapter.getTestMetadata(), null, 2));
  testFramework.register(testAdapter);
  console.log('   Model registered successfully');
  
  // Step 7: Run the tests
  console.log('\n7. Running tests...');
  // Validate base requirements before running tests
  console.log('   Debug: Validating base requirements...');
  const baseValidation = testAdapter.validateBase();
  console.log('   Debug: Base validation result:', JSON.stringify(baseValidation, null, 2));
  
  const results = await testFramework.runAll();
  
  // Step 8: Display a summary of the results
  console.log('\n8. Test result summary:');
  const moduleNames = Object.keys(results);
  
  moduleNames.forEach(moduleName => {
    const moduleResults = results[moduleName];
    const testCount = Object.keys(moduleResults).length;
    
    // Count passed/failed tests
    const passedTests = Object.values(moduleResults).filter(
      result => result.status === TestResultStatus.Passed
    ).length;
    
    const failedTests = Object.values(moduleResults).filter(
      result => result.status === TestResultStatus.Failed || 
      result.status === TestResultStatus.Error
    ).length;
    
    console.log(`   Module: ${moduleName}`);
    console.log(`     Total tests: ${testCount}`);
    console.log(`     Passed: ${passedTests}`);
    console.log(`     Failed: ${failedTests}`);
    console.log('     -----');
    
    // Show individual test results
    Object.entries(moduleResults).forEach(([testName, result]) => {
      const statusSymbol = result.status === TestResultStatus.Passed ? '✓' :
                          result.status === TestResultStatus.Failed ? '✗' :
                          result.status === TestResultStatus.Skipped ? '⚪' : '!';
      
      console.log(`     ${statusSymbol} ${testName}`);
      if (result.status !== TestResultStatus.Passed) {
        console.log(`       Error: ${result.error}`);
      }
    });
  });
  
  // Step 9: Clean up
  console.log('\n9. Cleaning up...');
  await testFramework.terminate();
  await model.terminate();
  console.log('   Resources cleaned up successfully');
  
  console.log('\nDemo completed successfully!');
  return results;
}

// Allow this file to be imported or executed directly
if (require.main === module) {
  // Execute the demo
  runModelTests().catch(error => {
    console.error('Error running demo:', error);
    process.exit(1);
  });
}

export { runModelTests };
