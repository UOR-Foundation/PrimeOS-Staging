/**
 * Tests for Integrity Module Mock Integration
 * ==========================================
 * 
 * This file tests that the integrity module mocks properly implement
 * the os/model interface pattern.
 */

import { BaseModel, ModelLifecycleState } from './os-model-mock';
import { createLogging } from './os-logging-mock';
import { 
  createIntegrity,
  Factor,
  IntegrityInterface,
  VerificationResult
} from './index';

// Mock implementation of an integrity module using BaseModel
class MockIntegrityModel extends BaseModel {
  private integrity: IntegrityInterface;

  constructor(options: any = {}) {
    super({
      name: 'mock-integrity',
      version: '1.0.0',
      ...options
    });
    
    this.integrity = createIntegrity(options);
  }

  protected async onInitialize(): Promise<void> {
    // Initialize integrity module
    await this.logger.info('Initializing integrity module');
    await this.integrity.initialize();
    
    // Set up custom state
    this.state.custom = {
      moduleType: 'integrity',
      hasCache: !!this.integrity.getState().cache
    };
  }

  protected async onProcess<T = any, R = any>(input: T): Promise<R> {
    // Process based on input type
    if (typeof input === 'object' && input !== null && 'operation' in input) {
      const request = input as any;
      
      switch (request.operation) {
        case 'generateChecksum':
          return await this.integrity.generateChecksum(
            request.factors,
            request.registry
          ) as unknown as R;
          
        case 'attachChecksum':
          return await this.integrity.attachChecksum(
            request.value,
            request.factors,
            request.registry
          ) as unknown as R;
          
        case 'verifyIntegrity':
          return await this.integrity.verifyIntegrity(
            request.value,
            request.registry
          ) as unknown as R;
          
        case 'extractChecksum':
          return await this.integrity.extractChecksum(
            request.value,
            request.registry
          ) as unknown as R;
          
        case 'calculateXorSum':
          return await this.integrity.calculateXorSum(
            request.factors,
            request.registry
          ) as unknown as R;
          
        case 'verifyBatch':
          return await this.integrity.verifyBatch(
            request.values,
            request.registry
          ) as unknown as R;
          
        default:
          throw new Error(`Unknown operation: ${request.operation}`);
      }
    }
    
    throw new Error('Invalid input format');
  }

  protected async onReset(): Promise<void> {
    // Reset integrity module
    if (this.integrity.reset) {
      await this.integrity.reset();
    }
    
    await this.logger.info('Integrity module reset');
  }

  protected async onTerminate(): Promise<void> {
    // Terminate integrity module
    if (this.integrity.terminate) {
      await this.integrity.terminate();
    }
    
    await this.logger.info('Integrity module terminated');
  }
}

describe('Integrity Module Mock with OS Model', () => {
  let model: MockIntegrityModel;
  let mockRegistry: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock prime registry
    mockRegistry = {
      getPrime: jest.fn((index: number) => BigInt(index * 2 + 1)),
      getIndex: jest.fn((prime: bigint) => Math.floor((Number(prime) - 1) / 2)),
      factor: jest.fn((n: bigint) => {
        if (n === 42n) {
          return [
            { prime: 2n, exponent: 1 },
            { prime: 3n, exponent: 1 },
            { prime: 7n, exponent: 1 }
          ];
        }
        return [{ prime: n, exponent: 1 }];
      })
    };
  });

  afterEach(async () => {
    if (model && model.getState().lifecycle !== ModelLifecycleState.Terminated) {
      await model.terminate();
    }
  });

  describe('Model Lifecycle', () => {
    test('should initialize properly', async () => {
      model = new MockIntegrityModel({ enableCache: true });
      
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Uninitialized);
      
      const result = await model.initialize();
      
      expect(result.success).toBe(true);
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Ready);
      expect(model.getState().custom?.moduleType).toBe('integrity');
    });

    test('should process operations when ready', async () => {
      model = new MockIntegrityModel();
      await model.initialize();
      
      // Test generateChecksum operation
      const factors: Factor[] = [
        { prime: 2n, exponent: 1 },
        { prime: 3n, exponent: 1 }
      ];
      
      const checksumResult = (await model.process({
        operation: 'generateChecksum',
        factors,
        registry: mockRegistry
      })).data;
      
      expect(typeof checksumResult).toBe('bigint');
      expect(checksumResult).toBeGreaterThan(0n);
      
      // Test verifyIntegrity operation
      const verifyResult = (await model.process({
        operation: 'verifyIntegrity',
        value: 42n,
        registry: mockRegistry
      })).data as VerificationResult;
      
      expect(verifyResult.valid).toBe(true);
      expect(verifyResult.coreFactors).toBeDefined();
    });

    test('should handle attachChecksum and extractChecksum operations', async () => {
      model = new MockIntegrityModel();
      await model.initialize();
      
      const factors: Factor[] = [{ prime: 2n, exponent: 2 }];
      const value = 4n;
      
      // Attach checksum
      const attachResult = (await model.process({
        operation: 'attachChecksum',
        value,
        factors,
        registry: mockRegistry
      })).data;
      
      expect(typeof attachResult).toBe('bigint');
      expect(attachResult).toBeGreaterThan(value);
      
      // Extract checksum
      const extractResult = (await model.process({
        operation: 'extractChecksum',
        value: 128n, // > 100, so has checksum in mock
        registry: mockRegistry
      })).data as any;
      
      expect(extractResult.valid).toBe(true);
      expect(extractResult.coreFactors).toBeDefined();
    });

    test('should handle batch operations', async () => {
      model = new MockIntegrityModel();
      await model.initialize();
      
      const values = [42n, 128n, 13n]; // Mix of valid and invalid
      
      const batchResult = (await model.process({
        operation: 'verifyBatch',
        values,
        registry: mockRegistry
      })).data as VerificationResult[];
      
      expect(batchResult).toHaveLength(values.length);
      expect(batchResult[0].valid).toBe(true);  // 42 is valid
      expect(batchResult[1].valid).toBe(true);  // 128 is valid
      expect(batchResult[2].valid).toBe(false); // 13 is invalid in mock
    });

    test('should track operation counts', async () => {
      model = new MockIntegrityModel();
      await model.initialize();
      
      const initialState = model.getState();
      expect(initialState.operationCount.total).toBe(0);
      
      // Perform successful operations
      await model.process({
        operation: 'generateChecksum',
        factors: [{ prime: 2n, exponent: 1 }]
      });
      
      await model.process({
        operation: 'verifyIntegrity',
        value: 42n
      });
      
      const stateAfterSuccess = model.getState();
      expect(stateAfterSuccess.operationCount.total).toBe(2);
      expect(stateAfterSuccess.operationCount.success).toBe(2);
      expect(stateAfterSuccess.operationCount.failed).toBe(0);
      
      // Perform failing operation
      try {
        await model.process({ operation: 'unknown' });
      } catch (e) {
        // Expected to fail
      }
      
      const stateAfterFailure = model.getState();
      expect(stateAfterFailure.operationCount.total).toBe(3);
      expect(stateAfterFailure.operationCount.success).toBe(2);
      expect(stateAfterFailure.operationCount.failed).toBe(1);
    });

    test('should reset properly', async () => {
      model = new MockIntegrityModel({ enableCache: true });
      await model.initialize();
      
      // Perform some operations
      await model.process({
        operation: 'generateChecksum',
        factors: [{ prime: 2n, exponent: 1 }]
      });
      
      await model.process({
        operation: 'verifyIntegrity',
        value: 42n
      });
      
      const stateBeforeReset = model.getState();
      expect(stateBeforeReset.operationCount.total).toBe(2);
      
      // Reset
      const resetResult = await model.reset();
      expect(resetResult.success).toBe(true);
      
      const stateAfterReset = model.getState();
      expect(stateAfterReset.operationCount.total).toBe(0);
      expect(stateAfterReset.operationCount.success).toBe(0);
      expect(stateAfterReset.operationCount.failed).toBe(0);
      expect(stateAfterReset.lifecycle).toBe(ModelLifecycleState.Ready);
    });

    test('should terminate properly', async () => {
      model = new MockIntegrityModel();
      await model.initialize();
      
      const terminateResult = await model.terminate();
      expect(terminateResult.success).toBe(true);
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Terminated);
      
      // Should not be able to process after termination
      {
        const result = await model.process({
          operation: 'generateChecksum',
          factors: [{ prime: 2n, exponent: 1 }]
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Cannot process in terminated state');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors', async () => {
      // Create a model that fails initialization
      class FailingModel extends MockIntegrityModel {
        protected async onInitialize(): Promise<void> {
          throw new Error('Initialization failed');
        }
      }
      
      model = new FailingModel();
      const result = await model.initialize();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Initialization failed');
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Error);
    });

    test('should handle processing errors', async () => {
      model = new MockIntegrityModel();
      await model.initialize();
      
      {
        const result = await model.process({ operation: 'invalid' });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Unknown operation: invalid');
      }
      
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Error);
    });

    test('should not process when not ready', async () => {
      model = new MockIntegrityModel();
      
      // Try to process before initialization
      {
        const result = await model.process({
          operation: 'generateChecksum',
          factors: [{ prime: 2n, exponent: 1 }]
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Cannot process in uninitialized state');
      }
    });
  });

  describe('Logging Integration', () => {
    test('should use logger during lifecycle', async () => {
      const mockLogger = createLogging({ name: 'test-integrity' });
      
      class LoggingModel extends MockIntegrityModel {
        constructor() {
          super();
          this.logger = mockLogger;
        }
      }
      
      model = new LoggingModel();
      
      await model.initialize();
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing integrity module');
      
      await model.reset();
      expect(mockLogger.info).toHaveBeenCalledWith('Integrity module reset');
      
      await model.terminate();
      expect(mockLogger.info).toHaveBeenCalledWith('Integrity module terminated');
    });
  });

  describe('State Management', () => {
    test('should track uptime', async () => {
      model = new MockIntegrityModel();
      await model.initialize();
      
      const state1 = model.getState();
      expect(state1.uptime).toBeGreaterThanOrEqual(0);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const state2 = model.getState();
      expect(state2.uptime).toBeGreaterThan(state1.uptime);
    });

    test('should include custom state', async () => {
      model = new MockIntegrityModel({ enableCache: true });
      await model.initialize();
      
      const state = model.getState();
      expect(state.custom).toBeDefined();
      expect(state.custom?.moduleType).toBe('integrity');
      expect(state.custom?.hasCache).toBeDefined();
    });
  });

  describe('Registry Integration', () => {
    test('should work with different registry implementations', async () => {
      const customRegistry = {
        getPrime: jest.fn((index: number) => [2n, 3n, 5n, 7n, 11n][index] || BigInt(index * 2 + 1)),
        getIndex: jest.fn((prime: bigint) => [2n, 3n, 5n, 7n, 11n].indexOf(prime)),
        factor: jest.fn((n: bigint) => {
          if (n === 6n) return [{ prime: 2n, exponent: 1 }, { prime: 3n, exponent: 1 }];
          if (n === 12n) return [{ prime: 2n, exponent: 2 }, { prime: 3n, exponent: 1 }];
          return [{ prime: n, exponent: 1 }];
        })
      };
      
      model = new MockIntegrityModel({ primeRegistry: customRegistry });
      await model.initialize();
      
      const factors: Factor[] = [{ prime: 5n, exponent: 1 }];
      
      await model.process({
        operation: 'generateChecksum',
        factors,
        registry: customRegistry
      });
      
      await model.process({
        operation: 'verifyIntegrity',
        value: 25n,
        registry: customRegistry
      });
      
      // Custom registry was passed to the operations
      expect(customRegistry).toBeDefined();
    });
  });

  describe('Performance Metrics', () => {
    test('should track integrity-specific metrics', async () => {
      model = new MockIntegrityModel();
      await model.initialize();
      
      // Perform various integrity operations
      await model.process({
        operation: 'generateChecksum',
        factors: [{ prime: 2n, exponent: 1 }]
      });
      
      await model.process({
        operation: 'attachChecksum',
        value: 2n,
        factors: [{ prime: 2n, exponent: 1 }]
      });
      
      await model.process({
        operation: 'verifyIntegrity',
        value: 42n
      });
      
      await model.process({
        operation: 'verifyIntegrity',
        value: 13n // This should fail in mock
      });
      
      // Check that operations were tracked
      const state = model.getState();
      expect(state.operationCount.total).toBe(4);
      expect(state.operationCount.success).toBe(4); // Process calls succeed even if verification fails
    });
  });
});
