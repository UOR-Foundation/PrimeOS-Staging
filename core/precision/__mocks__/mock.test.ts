/**
 * Tests for Precision Module Mock Integration
 * ==========================================
 * 
 * This file tests that the precision module mocks properly implement
 * the os/model interface pattern.
 */

import { BaseModel, ModelLifecycleState } from './os-model-mock';
import { createLogging } from './os-logging-mock';
import { 
  createPrecision,
  MathUtilities,
  Factor
} from './index';

// Mock implementation of a precision module using BaseModel
class MockPrecisionModel extends BaseModel {
  private precision: any;

  constructor(options: any = {}) {
    super({
      name: 'mock-precision',
      version: '1.0.0',
      ...options
    });
    
    this.precision = createPrecision(options);
  }

  protected async onInitialize(): Promise<void> {
    // Initialize precision module
    await this.logger.info('Initializing precision module');
    
    // Set up custom state
    this.state.custom = {
      moduleCount: Object.keys(this.precision).length,
      hasSharedCache: !!this.precision.sharedCache
    };
  }

  protected async onProcess<T = any, R = any>(input: T): Promise<R> {
    // Process based on input type
    if (typeof input === 'object' && input !== null && 'operation' in input) {
      const request = input as any;
      
      switch (request.operation) {
        case 'bitLength':
          return MathUtilities.bitLength(request.value) as unknown as R;
          
        case 'mod':
          return MathUtilities.mod(request.a, request.b) as unknown as R;
          
        case 'calculateChecksum':
          return MathUtilities.calculateChecksum(
            request.factors,
            request.registry
          ) as unknown as R;
          
        case 'verifyValue':
          return MathUtilities.verifyValue(
            request.value,
            request.registry
          ) as unknown as R;
          
        default:
          throw new Error(`Unknown operation: ${request.operation}`);
      }
    }
    
    throw new Error('Invalid input format');
  }

  protected async onReset(): Promise<void> {
    // Clear any caches
    if (this.precision.sharedCache) {
      this.precision.sharedCache.clear();
    }
    
    await this.logger.info('Precision module reset');
  }

  protected async onTerminate(): Promise<void> {
    // Clean up resources
    await this.logger.info('Precision module terminated');
  }
}

describe('Precision Module Mock with OS Model', () => {
  let model: MockPrecisionModel;
  let mockRegistry: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock prime registry
    mockRegistry = {
      getPrime: jest.fn((index: number) => BigInt(index * 2 + 1)),
      getIndex: jest.fn((prime: bigint) => Number((prime - BigInt(1)) / BigInt(2))),
      factor: jest.fn((n: bigint) => {
        if (n === BigInt(42)) {
          return [
            { prime: BigInt(2), exponent: 1 },
            { prime: BigInt(3), exponent: 1 },
            { prime: BigInt(7), exponent: 1 }
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
      model = new MockPrecisionModel({ enableCaching: true });
      
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Uninitialized);
      
      const result = await model.initialize();
      
      expect(result.success).toBe(true);
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Ready);
      expect(model.getState().custom?.hasSharedCache).toBe(true);
    });

    test('should process operations when ready', async () => {
      model = new MockPrecisionModel();
      await model.initialize();
      
      // Test bitLength operation
      const bitLengthResult = (await model.process({
        operation: 'bitLength',
        value: BigInt(42)
      })).data;
      
      expect(bitLengthResult).toBe(6);
      
      // Test mod operation
      const modResult = (await model.process({
        operation: 'mod',
        a: -BigInt(5),
        b: BigInt(13)
      })).data;
      
      expect(modResult).toBe(BigInt(8));
    });

    test('should handle checksum operations', async () => {
      model = new MockPrecisionModel();
      await model.initialize();
      
      const factors: Factor[] = [
        { prime: BigInt(2), exponent: 1 },
        { prime: BigInt(3), exponent: 1 }
      ];
      
      const checksumResult = (await model.process({
        operation: 'calculateChecksum',
        factors,
        registry: mockRegistry
      })).data;
      
      expect(typeof checksumResult).toBe('bigint');
      expect(MathUtilities.calculateChecksum).toHaveBeenCalledWith(factors, mockRegistry);
    });

    test('should handle verification operations', async () => {
      model = new MockPrecisionModel();
      await model.initialize();
      
      const verifyResult = (await model.process({
        operation: 'verifyValue',
        value: BigInt(42),
        registry: mockRegistry
      })).data;
      
      expect(verifyResult).toEqual({
        valid: true,
        coreFactors: [],
        checksumPrime: BigInt(2)
      });
      
      expect(MathUtilities.verifyValue).toHaveBeenCalledWith(BigInt(42), mockRegistry);
    });

    test('should track operation counts', async () => {
      model = new MockPrecisionModel();
      await model.initialize();
      
      const initialState = model.getState();
      expect(initialState.operationCount.total).toBe(0);
      
      // Perform successful operations
      await model.process({ operation: 'bitLength', value: BigInt(42) });
      await model.process({ operation: 'mod', a: BigInt(10), b: BigInt(3) });
      
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
      model = new MockPrecisionModel({ enableCaching: true });
      await model.initialize();
      
      // Perform some operations
      await model.process({ operation: 'bitLength', value: BigInt(42) });
      await model.process({ operation: 'mod', a: BigInt(10), b: BigInt(3) });
      
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
      model = new MockPrecisionModel();
      await model.initialize();
      
      const terminateResult = await model.terminate();
      expect(terminateResult.success).toBe(true);
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Terminated);
      
      // Should not be able to process after termination
      {
        const result = await model.process({ operation: 'bitLength', value: BigInt(42) });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Cannot process in terminated state');
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle initialization errors', async () => {
      // Create a model that fails initialization
      class FailingModel extends MockPrecisionModel {
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
      model = new MockPrecisionModel();
      await model.initialize();
      
      {
        const result = await model.process({ operation: 'invalid' });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Unknown operation: invalid');
      }
      
      expect(model.getState().lifecycle).toBe(ModelLifecycleState.Error);
    });

    test('should not process when not ready', async () => {
      model = new MockPrecisionModel();
      
      // Try to process before initialization
      {
        const result = await model.process({ operation: 'bitLength', value: BigInt(42) });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Cannot process in uninitialized state');
      }
    });
  });

  describe('Logging Integration', () => {
    test('should use logger during lifecycle', async () => {
      const mockLogger = createLogging({ name: 'test-precision' });
      
      class LoggingModel extends MockPrecisionModel {
        constructor() {
          super();
          this.logger = mockLogger;
        }
      }
      
      model = new LoggingModel();
      
      await model.initialize();
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing precision module');
      
      await model.reset();
      expect(mockLogger.info).toHaveBeenCalledWith('Precision module reset');
      
      await model.terminate();
      expect(mockLogger.info).toHaveBeenCalledWith('Precision module terminated');
    });
  });

  describe('State Management', () => {
    test('should track uptime', async () => {
      model = new MockPrecisionModel();
      await model.initialize();
      
      const state1 = model.getState();
      expect(state1.uptime).toBeGreaterThanOrEqual(0);
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const state2 = model.getState();
      expect(state2.uptime).toBeGreaterThan(state1.uptime);
    });

    test('should include custom state', async () => {
      model = new MockPrecisionModel({ enableCaching: true });
      await model.initialize();
      
      const state = model.getState();
      expect(state.custom).toBeDefined();
      expect(state.custom?.moduleCount).toBeGreaterThan(0);
      expect(state.custom?.hasSharedCache).toBe(true);
    });
  });
});
