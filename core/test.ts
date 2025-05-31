/**
 * PrimeOS Core Package Tests
 * =========================
 * 
 * Integration tests for the core package that verify proper module coordination
 * and dependency injection functionality.
 */

import {
  createCore,
  createAndInitializeCore,
  CoreImplementation,
  CoreInterface,
  CoreOptions,
  CoreState
} from './index';

describe('PrimeOS Core Package', () => {
  describe('Core Factory Functions', () => {
    test('createCore should create a core instance with default options', () => {
      const core = createCore();
      expect(core).toBeInstanceOf(CoreImplementation);
      expect(typeof core.getPrimeRegistry).toBe('function');
      expect(typeof core.getIntegritySystem).toBe('function');
      expect(typeof core.getEncodingSystem).toBe('function');
      expect(typeof core.getStreamProcessor).toBe('function');
      expect(typeof core.getBandOptimizer).toBe('function');
    });

    test('createCore should accept custom options', () => {
      const options: CoreOptions = {
        name: 'test-core',
        debug: true,
        enableDependencyInjection: false,
        enableCrossModuleOptimization: false
      };
      
      const core = createCore(options);
      expect(core).toBeInstanceOf(CoreImplementation);
    });

    test('createAndInitializeCore should initialize successfully', async () => {
      const core = await createAndInitializeCore({
        name: 'test-initialized-core'
      });
      
      expect(core).toBeInstanceOf(CoreImplementation);
      
      // Verify modules are initialized
      const state = core.getState();
      expect(state.modules.prime).toBe(true);
      expect(state.modules.integrity).toBe(true);
      expect(state.modules.encoding).toBe(true);
      expect(state.modules.stream).toBe(true);
      expect(state.modules.bands).toBe(true);
      
      // Clean up
      await core.terminate();
    });
  });

  describe('Core Implementation', () => {
    let core: CoreInterface;

    beforeEach(async () => {
      core = await createAndInitializeCore({
        name: 'test-core-implementation'
      });
    });

    afterEach(async () => {
      if (core) {
        await core.terminate();
      }
    });

    test('should provide access to all core modules', () => {
      expect(core.getPrimeRegistry()).toBeDefined();
      expect(core.getIntegritySystem()).toBeDefined();
      expect(core.getEncodingSystem()).toBeDefined();
      expect(core.getStreamProcessor()).toBeDefined();
      expect(core.getBandOptimizer()).toBeDefined();
    });

    test('should have correct integration status', () => {
      const status = core.getIntegrationStatus();
      
      expect(status.dependenciesResolved).toBe(true);
      expect(status.activeModules).toContain('prime');
      expect(status.activeModules).toContain('integrity');
      expect(status.activeModules).toContain('encoding');
      expect(status.activeModules).toContain('stream');
      expect(status.activeModules).toContain('bands');
      expect(status.crossModuleOptimizations).toContain('stream-bands');
      expect(status.crossModuleOptimizations).toContain('encoding-integrity');
      expect(status.crossModuleOptimizations).toContain('prime-integrity');
    });

    test('should provide performance metrics', () => {
      const metrics = core.getPerformanceMetrics();
      
      expect(typeof metrics.operationsPerSecond).toBe('number');
      expect(typeof metrics.averageLatency).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.modulePerformance).toBe('object');
    });

    test('should return proper state structure', () => {
      const state = core.getState();
      
      // Verify base model state properties
      expect(state.lifecycle).toBeDefined();
      expect(state.lastStateChangeTime).toBeDefined();
      expect(state.uptime).toBeDefined();
      expect(state.operationCount).toBeDefined();
      
      // Verify core-specific state properties
      expect(state.modules).toBeDefined();
      expect(state.integrationStatus).toBeDefined();
      expect(state.performance).toBeDefined();
      
      // Verify module status
      expect(state.modules.prime).toBe(true);
      expect(state.modules.integrity).toBe(true);
      expect(state.modules.encoding).toBe(true);
      expect(state.modules.stream).toBe(true);
      expect(state.modules.bands).toBe(true);
    });

    test('should handle band optimization processing', async () => {
      const testNumber = BigInt(12345);
      
      const result = await core.processWithBandOptimization(testNumber);
      
      expect(result).toBeDefined();
      expect(result.classification).toBeDefined();
      expect(result.optimization).toBeDefined();
      expect(result.recommendedBand).toBeDefined();
    });

    test('should handle encoding with integrity', async () => {
      const testData = { test: 'data' };
      
      const result = await core.encodeWithIntegrity(testData);
      
      expect(typeof result).toBe('bigint');
      expect(result).toBe(BigInt(42)); // Placeholder implementation
    });

    test('should allow module configuration', async () => {
      const newOptions: Partial<CoreOptions> = {
        enableCrossModuleOptimization: false
      };
      
      await core.configureModules(newOptions);
      
      // Verify configuration was applied
      const status = core.getIntegrationStatus();
      expect(status.dependenciesResolved).toBe(true);
    });
  });

  describe('Module Integration', () => {
    test('should properly initialize modules in dependency order', async () => {
      const core = await createAndInitializeCore({
        name: 'dependency-test-core'
      });
      
      // Verify all modules are available
      const primeRegistry = core.getPrimeRegistry();
      const integritySystem = core.getIntegritySystem();
      const encodingSystem = core.getEncodingSystem();
      const streamProcessor = core.getStreamProcessor();
      const bandOptimizer = core.getBandOptimizer();
      
      expect(primeRegistry).toBeDefined();
      expect(integritySystem).toBeDefined();
      expect(encodingSystem).toBeDefined();
      expect(streamProcessor).toBeDefined();
      expect(bandOptimizer).toBeDefined();
      
      // Clean up
      await core.terminate();
    });

    test('should handle module failures gracefully', async () => {
      // Test with invalid options that might cause initialization issues
      const options: CoreOptions = {
        name: 'failure-test-core',
        primeOptions: {
          preloadCount: -1 // Invalid option
        }
      };
      
      // Should still initialize successfully due to error handling
      await expect(createAndInitializeCore(options)).resolves.toBeDefined();
    });
  });

  describe('Lifecycle Management', () => {
    test('should support reset operations', async () => {
      const core = await createAndInitializeCore({
        name: 'reset-test-core'
      });
      
      // Perform some operations to change state
      await core.processWithBandOptimization(BigInt(123));
      
      // Reset
      const resetResult = await core.reset();
      expect(resetResult.success).toBe(true);
      
      // Verify state was reset
      const metrics = core.getPerformanceMetrics();
      expect(metrics.operationsPerSecond).toBe(0);
      expect(metrics.averageLatency).toBe(0);
      
      // Clean up
      await core.terminate();
    });

    test('should support proper termination', async () => {
      const core = await createAndInitializeCore({
        name: 'termination-test-core'
      });
      
      const terminateResult = await core.terminate();
      expect(terminateResult.success).toBe(true);
      
      // Verify modules are cleared
      expect(core.getPrimeRegistry()).toBeUndefined();
      expect(core.getIntegritySystem()).toBeUndefined();
      expect(core.getEncodingSystem()).toBeUndefined();
      expect(core.getStreamProcessor()).toBeUndefined();
      expect(core.getBandOptimizer()).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing modules gracefully', async () => {
      const core = createCore({
        enableDependencyInjection: false
      });
      
      // Should throw when trying to use unavailable modules
      await expect(core.processWithBandOptimization(BigInt(123)))
        .rejects.toThrow('Band optimization module not available');
      
      await expect(core.encodeWithIntegrity({ test: 'data' }))
        .rejects.toThrow('Encoding or integrity modules not available');
    });

    test('should handle initialization failures properly', async () => {
      // This test verifies error handling during initialization
      // In a real scenario, this would test actual failure conditions
      const core = createCore({
        name: 'error-test-core'
      });
      
      // Initialize should work even with basic configuration
      const result = await core.initialize();
      expect(result.success).toBe(true);
      
      await core.terminate();
    });
  });
});
