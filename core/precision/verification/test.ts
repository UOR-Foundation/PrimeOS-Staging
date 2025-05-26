/**
 * Verification Module Tests
 * =====================
 * 
 * Test suite for the verification module.
 */

import { 
  createVerification,
  createAndInitializeVerification,
  verifyValue,
  verifyValues,
  createOptimizedVerifier,
  getStatus,
  getResults,
  resetVerification,
  clearCache,
  VerificationStatus,
  VerificationInterface,
  VerificationOptions,
  VerificationModelInterface
} from './index';

import { ModelLifecycleState } from '../__mocks__/os-model-mock';
import { Factor } from '../types';

// Mock the os/model and os/logging modules
jest.mock('../../../os/model', () => require('./__mocks__/os-model-mock'));
jest.mock('../../../os/logging', () => require('./__mocks__/os-logging-mock'));

// Mock the checksums module
jest.mock('../checksums', () => ({
  extractFactorsAndChecksum: (value: bigint) => {
    if (value === BigInt(42)) {
      return {
        coreFactors: [
          { prime: BigInt(2), exponent: 1 },
          { prime: BigInt(3), exponent: 1 },
          { prime: BigInt(7), exponent: 1 }
        ],
        checksumPrime: BigInt(11)
      };
    } else if (value === BigInt(30)) {
      return {
        coreFactors: [
          { prime: BigInt(2), exponent: 1 },
          { prime: BigInt(3), exponent: 1 },
          { prime: BigInt(5), exponent: 1 }
        ],
        checksumPrime: BigInt(7)
      };
    } else if (value === BigInt(100)) {
      return {
        coreFactors: [
          { prime: BigInt(2), exponent: 2 },
          { prime: BigInt(5), exponent: 2 }
        ],
        checksumPrime: BigInt(13)
      };
    } else {
      throw new Error('Invalid value for testing');
    }
  },
  calculateChecksum: (factors: Factor[]) => {
    // Simple mock implementation for testing
    if (factors.length === 3 && 
        factors[0].prime === BigInt(2) && 
        factors[1].prime === BigInt(3) && 
        factors[2].prime === BigInt(7)) {
      return BigInt(11);
    } else if (factors.length === 3 && 
               factors[0].prime === BigInt(2) && 
               factors[1].prime === BigInt(3) && 
               factors[2].prime === BigInt(5)) {
      return BigInt(7);
    } else if (factors.length === 2 && 
               factors[0].prime === BigInt(2) && 
               factors[1].prime === BigInt(5)) {
      return BigInt(13);
    }
    return BigInt(0);
  }
}));

// Import mocks from test-mock.ts
import { createMockPrimeRegistry } from '../__mocks__/test-mock';

// Create a mock prime registry for testing
const mockPrimeRegistry = createMockPrimeRegistry();

// These mocks are already defined at the top of the file

describe('Verification Module', () => {
  describe('Basic functionality', () => {
    test('verifyValue validates checksums correctly', () => {
      const result = verifyValue(BigInt(42), mockPrimeRegistry);
      
      expect(result.valid).toBe(true);
      expect(result.coreFactors).toHaveLength(3);
      expect(result.checksumPrime).toBe(BigInt(11));
    });
    
    test('verifyValues validates multiple values', () => {
      const results = verifyValues([BigInt(42), BigInt(30)], mockPrimeRegistry);
      
      expect(results).toHaveLength(2);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(true);
    });
    
    test('createOptimizedVerifier returns a function that validates correctly', () => {
      const isValid = createOptimizedVerifier(mockPrimeRegistry);
      
      expect(isValid(BigInt(42))).toBe(true);
      expect(isValid(BigInt(30))).toBe(true);
      
      // Test caching - second call should use cache
      expect(isValid(BigInt(42))).toBe(true);
    });
    
    test('getStatus returns the correct verification status', () => {
      // Reset the verification context
      resetVerification();
      
      // Initially should be UNKNOWN
      expect(getStatus()).toBe(VerificationStatus.UNKNOWN);
      
      // After verifying a valid value, should be VALID
      verifyValue(BigInt(42), mockPrimeRegistry);
      expect(getStatus()).toBe(VerificationStatus.VALID);
    });
    
    test('getResults returns all verification results', () => {
      // Reset the verification context
      resetVerification();
      
      // Verify some values
      verifyValue(BigInt(42), mockPrimeRegistry);
      verifyValue(BigInt(30), mockPrimeRegistry);
      
      // Get results
      const results = getResults();
      
      expect(results).toHaveLength(2);
      expect(results[0].valid).toBe(true);
      expect(results[1].valid).toBe(true);
    });
    
    test('resetVerification clears verification results', () => {
      // Verify some values
      verifyValue(BigInt(42), mockPrimeRegistry);
      verifyValue(BigInt(30), mockPrimeRegistry);
      
      // Reset
      resetVerification();
      
      // Check results are cleared
      expect(getResults()).toHaveLength(0);
      expect(getStatus()).toBe(VerificationStatus.UNKNOWN);
    });
    
    test('clearCache clears the verification cache', () => {
      // Create a verification instance with cache enabled
      const verification = createVerification({ enableCache: true });
      
      // Verify a value to populate the cache
      verification.verifyValue(BigInt(42), mockPrimeRegistry);
      
      // Clear the cache
      verification.clearCache();
      
      // Verify the same value again - should not use cache
      verification.verifyValue(BigInt(42), mockPrimeRegistry);
      
      // Check state
      const state = verification.getState();
      expect(state.cache.hits).toBe(0);
    });
  });
  
  describe('Model Interface', () => {
    test('createVerification returns a valid model instance', () => {
      const verification = createVerification();
      
      expect(verification.initialize).toBeInstanceOf(Function);
      expect(verification.process).toBeInstanceOf(Function);
      expect(verification.reset).toBeInstanceOf(Function);
      expect(verification.terminate).toBeInstanceOf(Function);
      expect(verification.getState).toBeInstanceOf(Function);
      expect(verification.verifyValue).toBeInstanceOf(Function);
      expect(verification.verifyValues).toBeInstanceOf(Function);
      expect(verification.createOptimizedVerifier).toBeInstanceOf(Function);
      expect(verification.getStatus).toBeInstanceOf(Function);
      expect(verification.getResults).toBeInstanceOf(Function);
      expect(verification.resetVerification).toBeInstanceOf(Function);
      expect(verification.clearCache).toBeInstanceOf(Function);
    });
    
    test('createAndInitializeVerification initializes the module', async () => {
      const verification = await createAndInitializeVerification();
      
      expect(verification.getState().lifecycle).toBe('ready');
      
      // Clean up
      await verification.terminate();
    });
    
    test('process method handles operations correctly', async () => {
      const verification = await createAndInitializeVerification();
      
      // Test verifyValue operation
      const result = await verification.process({
        operation: 'verifyValue',
        params: [BigInt(42), mockPrimeRegistry]
      });
      
      // The result should be a ModelResult with data containing a VerificationResult
      const modelResult = result as unknown as { success: boolean, data: { valid: boolean } };
      expect(modelResult.success).toBe(true);
      expect(modelResult.data.valid).toBe(true);
      
      // Clean up
      await verification.terminate();
    });
    
    test('getState returns correct state information', async () => {
      const verification = await createAndInitializeVerification({
        debug: true,
        enableCache: true
      });
      
      // Perform some operations to update state
      verification.verifyValue(BigInt(42), mockPrimeRegistry);
      verification.verifyValue(BigInt(30), mockPrimeRegistry);
      
      // Get state
      const state = verification.getState();
      
      // Verify state properties
      expect(state.lifecycle).toBe('ready');
      expect(state.config).toBeDefined();
      expect(state.cache).toBeDefined();
      expect(state.verifiedCount).toBe(2);
      expect(state.validCount).toBe(2);
      expect(state.invalidCount).toBe(0);
      
      // Clean up
      await verification.terminate();
    });
    
    test('reset method resets the module state', async () => {
      const verification = await createAndInitializeVerification();
      
      // Perform some operations
      verification.verifyValue(BigInt(42), mockPrimeRegistry);
      verification.verifyValue(BigInt(30), mockPrimeRegistry);
      
      // Reset
      await verification.reset();
      
      // Check state
      const state = verification.getState();
      expect(state.verifiedCount).toBe(0);
      
      // Clean up
      await verification.terminate();
    });
    
    test('terminate method cleans up resources', async () => {
      const verification = await createAndInitializeVerification();
      
      // Terminate
      const result = await verification.terminate();
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('Configuration Options', () => {
    test('failFast option stops processing after first failure', () => {
      // Create a verification instance with failFast enabled
      const verification = createVerification({ failFast: true });
      
      // Mock a failing verification
      jest.spyOn(verification, 'verifyValue').mockImplementationOnce(() => ({
        coreFactors: [],
        checksumPrime: BigInt(0),
        valid: false,
        error: {
          expected: BigInt(0),
          actual: BigInt(0),
          message: 'Test failure'
        }
      }));
      
      // Verify multiple values
      const results = verification.verifyValues([BigInt(42), BigInt(30)], mockPrimeRegistry);
      
      // Should only have one result due to failFast
      expect(results).toHaveLength(1);
      expect(results[0].valid).toBe(false);
    });
    
    test('enableCache option enables caching of verification results', () => {
      // Create a verification instance with cache enabled
      const verification = createVerification({ enableCache: true });
      
      // Verify a value
      verification.verifyValue(BigInt(42), mockPrimeRegistry);
      
      // Verify the same value again - should use cache
      verification.verifyValue(BigInt(42), mockPrimeRegistry);
      
      // Check state
      const state = verification.getState();
      expect(state.cache.hits).toBeGreaterThan(0);
    });
    
    test('debug option enables debug logging', () => {
      // Create a verification instance with debug enabled
      const verification = createVerification({ debug: true });
      
      // Get the logger
      const logger = (verification as any).logger;
      
      // Verify a value
      verification.verifyValue(BigInt(42), mockPrimeRegistry);
      
      // Debug should have been called
      expect(logger.debug).toHaveBeenCalled();
    });
  });
  
  describe('Error Handling', () => {
    test('throws ValidationError for null/undefined inputs', () => {
      const verification = createVerification();
      
      // @ts-ignore - Testing runtime behavior
      expect(() => verification.verifyValue(null, mockPrimeRegistry))
        .toThrow('Validation Error');
        
      // @ts-ignore - Testing runtime behavior
      expect(() => verification.verifyValue(BigInt(42), null))
        .toThrow('Validation Error');
    });
    
    test('handles invalid prime registry interface', () => {
      const verification = createVerification();
      
      // @ts-ignore - Testing runtime behavior
      expect(() => verification.verifyValue(BigInt(42), { invalid: 'registry' }))
        .toThrow('Validation Error: Invalid prime registry interface');
    });
    
    test('getErrorDetails returns detailed error information', () => {
      const verification = createVerification();
      
      // Create a test error
      const error = new Error('Test error');
      const details = verification.getErrorDetails(error);
      
      expect(details.name).toBe('Error');
      expect(details.message).toBe('Test error');
      expect(details.stack).toBeDefined();
    });
  });
  
  describe('Retry Functionality', () => {
    test('verifyValueWithRetry retries on transient failures', async () => {
      const verification = createVerification({
        enableRetry: true,
        retryOptions: {
          maxRetries: 2,
          initialDelay: 10,
          maxDelay: 50,
          backoffFactor: 2
        }
      });
      
      // Import the TransientError class
      const { TransientError } = require('./errors');
      
      // Mock verifyValue to fail twice then succeed
      let attempts = 0;
      jest.spyOn(verification, 'verifyValue').mockImplementation(() => {
        attempts++;
        if (attempts <= 2) {
          throw new TransientError('Temporary failure');
        }
        return {
          coreFactors: [],
          checksumPrime: BigInt(11),
          valid: true
        };
      });
      
      const result = await verification.verifyValueWithRetry(BigInt(42), mockPrimeRegistry);
      expect(result.valid).toBe(true);
      expect(attempts).toBe(3);
    });
    
    test('createOptimizedVerifierWithRetry creates a function that retries', async () => {
      const verification = createVerification({
        enableRetry: true,
        retryOptions: {
          maxRetries: 2,
          initialDelay: 10,
          maxDelay: 50,
          backoffFactor: 2
        }
      });
      
      // Import the TransientError class
      const { TransientError } = require('./errors');
      
      // Create a base verifier that fails twice then succeeds
      let attempts = 0;
      const baseVerifier = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts <= 2) {
          throw new TransientError('Temporary failure');
        }
        return true;
      });
      
      // Mock createOptimizedVerifier to return our test verifier
      jest.spyOn(verification, 'createOptimizedVerifier').mockReturnValue(baseVerifier);
      
      // Create the retry-capable verifier
      const verifier = verification.createOptimizedVerifierWithRetry(mockPrimeRegistry);
      
      // Test it
      const result = await verifier(BigInt(42));
      expect(result).toBe(true);
      expect(attempts).toBe(3);
    });
  });
});
