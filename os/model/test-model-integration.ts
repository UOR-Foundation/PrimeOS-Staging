/**
 * Test Model Integration
 * =====================
 * 
 * This script runs both test scripts for verifying the integration
 * between the model module and the test framework.
 */

import { runModelTests } from './run-model-tests';
import { verifyTestIntegration } from './verify-test-integration';

/**
 * Run both test scripts to verify the integration
 */
async function testModelIntegration() {
  console.log('======================================================');
  console.log('    PrimeOS Model-TestFramework Integration Tests');
  console.log('======================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('Running comprehensive verification tests...\n');
  
  try {
    // Step 1: Run the basic model tests demo
    console.log('\n======================================================');
    console.log('PART 1: Running Basic Model Tests Demo');
    console.log('======================================================\n');
    await runModelTests();
    
    // Step 2: Run the detailed verification tests
    console.log('\n\n======================================================');
    console.log('PART 2: Running Detailed Verification Tests');
    console.log('======================================================\n');
    await verifyTestIntegration();
    
    console.log('\n======================================================');
    console.log('All integration tests completed successfully!');
    console.log('The model module and testing framework are properly integrated.');
    console.log('======================================================');
    
    return true;
  } catch (error) {
    console.error('Error running integration tests:', error);
    return false;
  }
}

// Run the tests if executed directly
if (require.main === module) {
  testModelIntegration().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testModelIntegration };
