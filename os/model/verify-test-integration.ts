/**
 * Verify Test Integration
 * ======================
 * 
 * This script verifies the integration between the model module and the testing
 * framework by running a series of tests and outputting detailed diagnostic information.
 */

import {
  createModel,
  createModelTestAdapter,
  ModelInterface,
  ModelLifecycleState,
  StandardModel
} from './index';
import {
  createTestFramework,
  TestFrameworkInterface,
  TestResultStatus
} from '../os-tests';

/**
 * Run tests with a normal model
 */
async function runStandardModelTests() {
  console.log('\n=== Standard Model Tests ===');
  
  // Create and initialize a standard model
  const model = createModel({
    name: 'standard-model',
    version: '1.0.0',
    debug: true
  });
  
  await model.initialize();
  console.log('Standard model initialized successfully');
  
  // Create test adapter for normal model
  const adapter = createModelTestAdapter(model, {
    tags: ['standard'],
    testCases: [
      { name: 'basic-data', input: 'test' },
      { name: 'expected-match', input: 'match', expectedResult: 'match' }
    ]
  });
  
  // Run tests
  await runTestsWithAdapter(adapter);
  
  // Cleanup
  await model.terminate();
}

/**
 * Run tests with a custom model that transforms inputs
 */
async function runCustomModelTests() {
  console.log('\n=== Custom Model Tests ===');
  
  // Create a custom model that transforms inputs
  class TransformModel extends StandardModel {
    protected async onProcess<T = unknown, R = unknown>(input: T): Promise<R> {
      if (typeof input === 'string') {
        // Transform string inputs to uppercase
        return input.toUpperCase() as unknown as R;
      }
      return super.onProcess(input);
    }
  }
  
  const model = new TransformModel({
    name: 'transform-model',
    version: '1.0.0',
    debug: true
  });
  
  await model.initialize();
  console.log('Custom transform model initialized successfully');
  
  // Create test adapter with expectations
  const adapter = createModelTestAdapter(model, {
    tags: ['transform'],
    testCases: [
      { name: 'lowercase-to-uppercase', input: 'hello', expectedResult: 'HELLO' },
      { name: 'non-match-test', input: 'hello', expectedResult: 'hello' } // This should fail
    ]
  });
  
  // Run tests
  await runTestsWithAdapter(adapter);
  
  // Cleanup
  await model.terminate();
}

/**
 * Run tests with a model in error state
 */
async function runErrorModelTests() {
  console.log('\n=== Error State Model Tests ===');
  
  // Create a model that will be in error state
  class ErrorModel extends StandardModel {
    getState() {
      const state = super.getState();
      state.lifecycle = ModelLifecycleState.Error;
      return state;
    }
  }
  
  const model = new ErrorModel({
    name: 'error-model',
    version: '1.0.0'
  });
  
  await model.initialize();
  console.log('Error model initialized (will be in error state)');
  
  // Create test adapter
  const adapter = createModelTestAdapter(model);
  
  // Run tests
  await runTestsWithAdapter(adapter);
  
  // Cleanup
  await model.terminate();
}

/**
 * Helper function to run tests with a specific adapter
 */
async function runTestsWithAdapter(adapter: any) {
  // Create and initialize test framework
  const framework = createTestFramework({
    debug: true,
    verbose: true
  });
  
  await framework.initialize();
  
  // Output adapter metadata
  const metadata = adapter.getTestMetadata();
  console.log(`Test metadata: ${JSON.stringify(metadata, null, 2)}`);
  
  // Validate base requirements
  const validation = adapter.validateBase();
  console.log(`Base validation: ${JSON.stringify(validation, null, 2)}`);
  
  // Register adapter with framework
  framework.register(adapter);
  
  // Run tests
  console.log('Running tests...');
  const results = await framework.runAll();
  
  // Display results
  const moduleNames = Object.keys(results);
  
  moduleNames.forEach(moduleName => {
    const moduleResults = results[moduleName];
    const testCount = Object.keys(moduleResults).length;
    const passedTests = Object.values(moduleResults).filter(
      (r: any) => r.status === TestResultStatus.Passed
    ).length;
    
    console.log(`\nModule: ${moduleName}`);
    console.log(`  Tests: ${passedTests}/${testCount} passed`);
    
    Object.entries(moduleResults).forEach(([testName, result]: [string, any]) => {
      const status = result.status === TestResultStatus.Passed ? 'PASSED' :
                     result.status === TestResultStatus.Failed ? 'FAILED' :
                     result.status === TestResultStatus.Error ? 'ERROR' : 
                     'SKIPPED';
      
      console.log(`  ${testName}: ${status}`);
      if (result.status !== TestResultStatus.Passed) {
        console.log(`    Error: ${result.error}`);
      }
    });
  });
  
  // Cleanup
  await framework.terminate();
}

/**
 * Main function to run all verification tests
 */
async function verifyTestIntegration() {
  console.log('=== Verifying Model-TestFramework Integration ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  try {
    // Run standard model tests
    await runStandardModelTests();
    
    // Run custom model tests
    await runCustomModelTests();
    
    // Run error model tests
    await runErrorModelTests();
    
    console.log('\n=== Verification Complete ===');
    console.log('All tests ran successfully. Check the results above for details.');
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

// Run the verification if executed directly
if (require.main === module) {
  verifyTestIntegration().catch(error => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
}

export { verifyTestIntegration };
