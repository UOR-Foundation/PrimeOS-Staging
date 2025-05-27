/**
 * Mock implementation of the Integrity module for testing
 * ======================================================
 * 
 * This mock provides a simplified version of the integrity module
 * that can be used in tests without the full implementation overhead.
 */

// Re-export model and logging mocks
export * from './os-model-mock';
export * from './os-logging-mock';

// Export integrity specific mocks
export * from './test-mock';

// Import the actual types to ensure type compatibility
import type {
  Factor,
  IntegrityOptions,
  IntegrityInterface,
  IntegrityState,
  VerificationResult,
  ChecksumExtraction,
  IntegrityProcessInput,
  IntegrityError,
  ChecksumMismatchError,
  InvalidFactorError,
  MissingChecksumError
} from '../types';

// Import createLogging from the mock
import { createLogging } from './os-logging-mock';
import { BaseModel, ModelLifecycleState } from './os-model-mock';

/**
 * Mock implementation of the IntegrityInterface
 */
class MockIntegrityImplementation extends BaseModel implements IntegrityInterface {
  private config: Required<Omit<IntegrityOptions, keyof import('../../../os/model/types').ModelOptions>>;
  private stats = {
    checksumsGenerated: 0,
    verificationsPerformed: 0,
    integrityFailures: 0
  };

  constructor(options: IntegrityOptions = {}) {
    super({
      debug: false,
      name: 'integrity-mock',
      version: '1.0.0',
      ...options
    });

    this.config = {
      checksumPower: options.checksumPower ?? 6,
      enableCache: options.enableCache ?? true,
      cacheSize: options.cacheSize ?? 1000,
      primeRegistry: options.primeRegistry ?? undefined
    };
  }

  protected async onInitialize(): Promise<void> {
    this.state.custom = {
      config: this.config,
      cache: { size: 0, hits: 0, misses: 0 },
      stats: { ...this.stats }
    };
  }

  protected async onProcess<T = IntegrityProcessInput, R = unknown>(input: T): Promise<R> {
    // Mock processing - just return success
    return { success: true, data: input } as unknown as R;
  }

  protected async onReset(): Promise<void> {
    this.stats = {
      checksumsGenerated: 0,
      verificationsPerformed: 0,
      integrityFailures: 0
    };
  }

  protected async onTerminate(): Promise<void> {
    // No cleanup needed for mock
  }

  // Mock implementations of IntegrityInterface methods
  generateChecksum = jest.fn(async (factors: Factor[], primeRegistry?: any): Promise<bigint> => {
    this.stats.checksumsGenerated++;
    
    // If registry is provided, use it to simulate real behavior
    if (primeRegistry) {
      let xor = 0;
      for (const factor of factors) {
        const index = primeRegistry.getIndex(factor.prime);
        xor ^= (index * factor.exponent);
      }
      const checksumPrime = primeRegistry.getPrime(xor);
      return checksumPrime;
    }
    
    // Simple mock checksum based on factors
    let checksum = 2n; // Default prime
    for (const factor of factors) {
      checksum += factor.prime * BigInt(factor.exponent);
    }
    return checksum % 100n; // Keep it small for testing
  });

  attachChecksum = jest.fn(async (value: bigint, factors: Factor[], primeRegistry?: any): Promise<bigint> => {
    const checksum = await this.generateChecksum(factors, primeRegistry);
    const power = BigInt(Math.max(2, this.config.checksumPower)); // Ensure at least power of 2
    const result = value * (checksum ** power);
    return result > value ? result : value + 1n; // Ensure result is always greater than input
  });

  verifyIntegrity = jest.fn(async (value: bigint, primeRegistry?: any): Promise<VerificationResult> => {
    this.stats.verificationsPerformed++;
    
    // Mock verification - assume most values are valid
    const isValid = value > 0n && value !== 13n; // 13n is our "bad" test value
    
    if (!isValid) {
      this.stats.integrityFailures++;
    }

    return {
      valid: isValid,
      coreFactors: isValid ? [{ prime: 2n, exponent: 1 }] : undefined,
      checksum: isValid ? 7n : undefined,
      error: isValid ? undefined : 'Mock integrity failure'
    };
  });

  extractChecksum = jest.fn(async (value: bigint, primeRegistry?: any): Promise<ChecksumExtraction> => {
    // Mock extraction
    const hasChecksum = value > 100n; // Assume values > 100 have checksums
    
    return {
      coreFactors: hasChecksum ? [{ prime: 2n, exponent: 1 }, { prime: 3n, exponent: 1 }] : [],
      checksumPrime: hasChecksum ? 7n : 0n,
      checksumExponent: hasChecksum ? this.config.checksumPower : 0,
      valid: hasChecksum,
      error: hasChecksum ? undefined : 'No checksum found'
    };
  });

  calculateXorSum = jest.fn(async (factors: Factor[], primeRegistry?: any): Promise<number> => {
    // Simple XOR mock
    let xor = 0;
    for (const factor of factors) {
      xor ^= (Number(factor.prime) * factor.exponent);
    }
    return xor;
  });

  verifyBatch = jest.fn(async (values: bigint[], primeRegistry?: any): Promise<VerificationResult[]> => {
    const results: VerificationResult[] = [];
    
    for (const value of values) {
      const result = await this.verifyIntegrity(value, primeRegistry);
      results.push(result);
    }
    
    return results;
  });

  getLogger() {
    return this.logger;
  }

  getState(): IntegrityState {
    const baseState = super.getState();
    
    return {
      ...baseState,
      config: this.config,
      cache: { size: 0, hits: 0, misses: 0 },
      stats: { ...this.stats }
    } as IntegrityState;
  }

  // Add setMockState method for testing
  setMockState(partialState: Partial<{ config: any; stats: any; }>) {
    if (partialState.config) {
      this.config = { ...this.config, ...partialState.config };
    }
    if (partialState.stats) {
      this.stats = { ...this.stats, ...partialState.stats };
    }
    this.state.custom = {
      config: this.config,
      cache: { size: 0, hits: 0, misses: 0 },
      stats: { ...this.stats }
    };
  }
}

// Mock factory functions
export const createIntegrity = jest.fn((options: IntegrityOptions = {}): IntegrityInterface => {
  return new MockIntegrityImplementation(options);
});

export const createAndInitializeIntegrity = jest.fn(async (options: IntegrityOptions = {}): Promise<IntegrityInterface> => {
  const instance = createIntegrity(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize integrity: ${result.error}`);
  }
  
  return instance;
});

// Mock standalone functions that mirror the main implementation
export const mockGenerateChecksum = jest.fn(async (factors: Factor[], primeRegistry?: any): Promise<bigint> => {
  let checksum = 2n;
  for (const factor of factors) {
    checksum += factor.prime * BigInt(factor.exponent);
  }
  return checksum % 100n;
});

export const mockAttachChecksum = jest.fn(async (value: bigint, factors: Factor[], primeRegistry?: any): Promise<bigint> => {
  const checksum = await mockGenerateChecksum(factors, primeRegistry);
  return value * (checksum ** 6n); // Default checksum power
});

export const mockVerifyIntegrity = jest.fn(async (value: bigint, primeRegistry?: any): Promise<VerificationResult> => {
  const isValid = value > 0n && value !== 13n;
  
  return {
    valid: isValid,
    coreFactors: isValid ? [{ prime: 2n, exponent: 1 }] : undefined,
    checksum: isValid ? 7n : undefined,
    error: isValid ? undefined : 'Mock integrity failure'
  };
});

export const mockExtractChecksum = jest.fn(async (value: bigint, primeRegistry?: any): Promise<ChecksumExtraction> => {
  const hasChecksum = value > 100n;
  
  return {
    coreFactors: hasChecksum ? [{ prime: 2n, exponent: 1 }] : [],
    checksumPrime: hasChecksum ? 7n : 0n,
    checksumExponent: hasChecksum ? 6 : 0,
    valid: hasChecksum,
    error: hasChecksum ? undefined : 'No checksum found'
  };
});

export const mockCalculateXorSum = jest.fn(async (factors: Factor[], primeRegistry?: any): Promise<number> => {
  let xor = 0;
  for (const factor of factors) {
    xor ^= (Number(factor.prime) * factor.exponent);
  }
  return xor;
});

export const mockVerifyBatch = jest.fn(async (values: bigint[], primeRegistry?: any): Promise<VerificationResult[]> => {
  return values.map(value => ({
    valid: value > 0n && value !== 13n,
    coreFactors: value > 0n && value !== 13n ? [{ prime: 2n, exponent: 1 }] : undefined,
    checksum: value > 0n && value !== 13n ? 7n : undefined,
    error: value > 0n && value !== 13n ? undefined : 'Mock integrity failure'
  }));
});

// Export all types from the main module
export * from '../types';

// Mock error classes
export class MockIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntegrityError';
  }
}

export class MockChecksumMismatchError extends MockIntegrityError {
  constructor(expected: bigint, actual: bigint) {
    super(`Checksum mismatch: expected ${expected}, got ${actual}`);
    this.name = 'ChecksumMismatchError';
  }
}

export class MockInvalidFactorError extends MockIntegrityError {
  constructor(factor: Factor) {
    super(`Invalid factor: prime=${factor.prime}, exponent=${factor.exponent}`);
    this.name = 'InvalidFactorError';
  }
}

export class MockMissingChecksumError extends MockIntegrityError {
  constructor() {
    super('No checksum found in value');
    this.name = 'MissingChecksumError';
  }
}

// Re-export with mock prefix for clarity in tests
export {
  MockIntegrityError as IntegrityError,
  MockChecksumMismatchError as ChecksumMismatchError,
  MockInvalidFactorError as InvalidFactorError,
  MockMissingChecksumError as MissingChecksumError
};

// Export the main class
export { MockIntegrityImplementation as IntegrityImplementation };

// Import Jest globals to use in the test function
import { describe, it, expect } from '@jest/globals';

// Create a convenient test function to run all tests in this directory
export function runIntegrityMockTests() {
  describe('Integrity Mocks Test Runner', () => {
    it('successfully loads mock tests', () => {
      expect(true).toBe(true);
    });
  });
  
  // Import and run the mock tests
  require('./mock.test.ts');
  require('./test.ts');
}
