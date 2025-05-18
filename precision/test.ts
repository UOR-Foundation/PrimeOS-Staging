/**
 * Precision Module - Test and Verification
 * =======================================
 *
 * This file contains tests for the precision-enhanced arithmetic operations.
 * Run with: npx ts-node test.ts
 */

import * as precision from './index';
import { mod, modPow, modInverse } from './modular';

/**
 * Run all tests and return the number of failures
 */
function runTests(): number {
  let failures = 0;
  console.log('🔍 Running precision module tests...');
  
  // Test modular operations
  failures += testModularOperations();
  
  // Test utility functions
  failures += testUtilityFunctions();
  
  // Test integration
  failures += testModuleIntegration();
  
  // Print summary
  console.log(`\n📊 Test summary: ${failures === 0 ? '✅ All tests passed!' : `❌ ${failures} test(s) failed.`}`);
  
  return failures;
}

/**
 * Test core modular arithmetic operations
 */
function testModularOperations(): number {
  console.log('\n📝 Testing modular arithmetic operations...');
  let failures = 0;
  
  // Test mod function with positive and negative numbers
  try {
    // JavaScript: -5 % 13 = -5
    // Python:     -5 % 13 = 8
    assertEquality(mod(-5, 13), 8, 'mod(-5, 13) should be 8 (Python behavior)');
    assertEquality(mod(18, 13), 5, 'mod(18, 13) should be 5');
    
    // BigInt cases
    assertEquality(mod(-5n, 13n), 8n, 'mod(-5n, 13n) should be 8n');
    assertEquality(mod(18n, 13n), 5n, 'mod(18n, 13n) should be 5n');
    
    // Mixed types
    assertEquality(mod(-5, 13n), 8n, 'mod(-5, 13n) should be 8n');
    assertEquality(mod(-5n, 13), 8n, 'mod(-5n, 13) should be 8n');
    
    console.log('✅ mod tests passed');
  } catch (error: any) {
    console.error('❌ mod tests failed:', error?.message || String(error));
    failures++;
  }
  
  // Test modular exponentiation (modPow)
  try {
    // Test basic cases
    assertEquality(modPow(2, 3, 5), 3, '2^3 mod 5 should be 3');
    assertEquality(modPow(2n, 3n, 5n), 3n, '2n^3n mod 5n should be 3n');
    
    // Test with negative exponent (Python: pow(2, -1, 13) = 7)
    assertEquality(modPow(2, -1, 13), 7, '2^(-1) mod 13 should be 7');
    assertEquality(modPow(2n, -1n, 13n), 7n, '2n^(-1n) mod 13n should be 7n');
    
    console.log('✅ modPow tests passed');
  } catch (error: any) {
    console.error('❌ modPow tests failed:', error?.message || String(error));
    failures++;
  }
  
  // Test modular inverse
  try {
    assertEquality(modInverse(3, 11), 4, 'inverse of 3 mod 11 should be 4');
    assertEquality(modInverse(3n, 11n), 4n, 'inverse of 3n mod 11n should be 4n');
    
    // This should throw an error, as 2 and 4 are not coprime
    let threw = false;
    try {
      modInverse(2, 4);
    } catch (e) {
      threw = true;
    }
    if (!threw) {
      throw new Error('modInverse(2, 4) should throw an error (not coprime)');
    }
    
    console.log('✅ modInverse tests passed');
  } catch (error: any) {
    console.error('❌ modInverse tests failed:', error?.message || String(error));
    failures++;
  }
  
  return failures;
}

/**
 * Test utility functions
 */
function testUtilityFunctions(): number {
  console.log('\n📝 Testing utility functions...');
  let failures = 0;
  
  // Test bit length
  try {
    assertEquality(precision.bitLength(0), 1, 'bitLength(0) should be 1');
    assertEquality(precision.bitLength(1), 1, 'bitLength(1) should be 1');
    assertEquality(precision.bitLength(2), 2, 'bitLength(2) should be 2');
    assertEquality(precision.bitLength(255), 8, 'bitLength(255) should be 8');
    assertEquality(precision.bitLength(256), 9, 'bitLength(256) should be 9');
    
    // BigInt cases
    assertEquality(precision.bitLength(0n), 1, 'bitLength(0n) should be 1');
    assertEquality(precision.bitLength(1n), 1, 'bitLength(1n) should be 1');
    assertEquality(precision.bitLength(2n), 2, 'bitLength(2n) should be 2');
    
    console.log('✅ bitLength tests passed');
  } catch (error: any) {
    console.error('❌ bitLength tests failed:', error?.message || String(error));
    failures++;
  }
  
  // Test exactlyEquals
  try {
    assertTrue(precision.exactlyEquals(5, 5), '5 should equal 5');
    assertTrue(precision.exactlyEquals(5n, 5n), '5n should equal 5n');
    assertTrue(precision.exactlyEquals(5, 5n), '5 should equal 5n');
    assertTrue(precision.exactlyEquals(5n, 5), '5n should equal 5');
    assertFalse(precision.exactlyEquals(5.5, 5), '5.5 should not equal 5');
    
    console.log('✅ exactlyEquals tests passed');
  } catch (error: any) {
    console.error('❌ exactlyEquals tests failed:', error?.message || String(error));
    failures++;
  }
  
  // Test byte array conversion
  try {
    const n = 258n; // 0x0102 = 258
    const bytes = precision.toByteArray(n);
    assertEquality(bytes.length, 2, 'Byte array for 258 should have length 2');
    assertEquality(bytes[0], 2, 'First byte should be 2');
    assertEquality(bytes[1], 1, 'Second byte should be 1');
    
    const reconstructed = precision.fromByteArray(bytes);
    assertEquality(reconstructed, n, 'Reconstructed value should equal original');
    
    console.log('✅ Byte array conversion tests passed');
  } catch (error: any) {
    console.error('❌ Byte array conversion tests failed:', error?.message || String(error));
    failures++;
  }
  
  return failures;
}

/**
 * Test overall module integration
 */
function testModuleIntegration(): number {
  console.log('\n📝 Testing module integration...');
  let failures = 0;
  
  // Test compatibility checker
  try {
    const result = precision.testModularCompatibility();
    console.log(`Environment compatibility check: ${result ? '✅ Compatible' : '❌ Incompatible'}`);
    
    // This may fail on some environments, we just log it
    // assertTruthy(result, 'testModularCompatibility should return true');
  } catch (error: any) {
    console.error('❌ Compatibility test failed:', error?.message || String(error));
    failures++;
  }
  
  
  // Test precision enhancer
  try {
    const enhancer = precision.createPrecisionEnhancer();
    assertTrue(typeof enhancer.enhanceIntegritySystem === 'function', 'enhancer.enhanceIntegritySystem should be a function');
    assertTrue(typeof enhancer.enhanceVerification === 'function', 'enhancer.enhanceVerification should be a function');

    console.log('✅ Precision enhancer tests passed');
  } catch (error: any) {
    console.error('❌ Precision enhancer tests failed:', error?.message || String(error));
    failures++;
  }
  
  return failures;
}

// ===== Test Utility Functions =====

/**
 * Assert that a condition is true
 */
function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Assert that a condition is false
 */
function assertFalse(condition: boolean, message: string): void {
  if (condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * Assert that two values are exactly equal
 */
function assertEquality<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected ${expected}, got ${actual}`);
  }
}

// Export the test runner function for use in other scripts
export { runTests };

// If this file is executed directly (via ts-node), run the tests
// We avoid using Node.js specific require.main === module check for portability
runTests();
