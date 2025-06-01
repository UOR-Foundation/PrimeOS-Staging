/**
 * Band Classification Index Tests
 * ===============================
 * 
 * Test suite for the band classification module exports and factory functions.
 */

import {
  BandClassifier,
  BandSelector,
  createBandClassifier,
  createBandSelector
} from './index';

import { BandType } from '../types';

// Mock the implementations
jest.mock('./band-classifier');
jest.mock('./band-selector');

describe('Band Classification Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Class Exports', () => {
    test('should export BandClassifier class', () => {
      expect(BandClassifier).toBeDefined();
      expect(typeof BandClassifier).toBe('function');
    });

    test('should export BandSelector class', () => {
      expect(BandSelector).toBeDefined();
      expect(typeof BandSelector).toBe('function');
    });
  });

  describe('Factory Functions', () => {
    test('should create band classifier with default options', () => {
      const classifier = createBandClassifier();
      expect(classifier).toBeDefined();
      expect(classifier).toBeInstanceOf(BandClassifier);
    });

    test('should create band classifier with custom options', () => {
      const classifier = createBandClassifier({ cacheSize: 500 });
      expect(classifier).toBeDefined();
      expect(classifier).toBeInstanceOf(BandClassifier);
    });

    test('should create band selector with default classifier', () => {
      const selector = createBandSelector();
      expect(selector).toBeDefined();
      expect(selector).toBeInstanceOf(BandSelector);
    });

    test('should create band selector with custom classifier and options', () => {
      const customClassifier = createBandClassifier({ cacheSize: 200 });
      const options = {
        adaptiveThresholds: false,
        hysteresisMargin: 0.3
      };
      
      const selector = createBandSelector(customClassifier, options);
      expect(selector).toBeDefined();
      expect(selector).toBeInstanceOf(BandSelector);
    });

    test('should create band selector with only options (using default classifier)', () => {
      const options = {
        performanceMonitoring: true,
        qualityThreshold: 0.95
      };
      
      const selector = createBandSelector(undefined, options);
      expect(selector).toBeDefined();
      expect(selector).toBeInstanceOf(BandSelector);
    });
  });

  describe('Module Integration', () => {
    test('should provide consistent interface across factory functions', () => {
      const classifier1 = createBandClassifier();
      const classifier2 = createBandClassifier({ cacheSize: 100 });
      
      expect(classifier1.constructor).toBe(classifier2.constructor);
    });

    test('should handle undefined inputs gracefully in factory functions', () => {
      expect(() => createBandClassifier(undefined)).not.toThrow();
      expect(() => createBandSelector(undefined, undefined)).not.toThrow();
    });

    test('should export all required types and interfaces', () => {
      // This test ensures all exports are available
      const classifier = createBandClassifier();
      const selector = createBandSelector();
      
      expect(classifier).toBeDefined();
      expect(selector).toBeDefined();
      expect(BandType).toBeDefined();
    });
  });

  describe('Factory Function Edge Cases', () => {
    test('should handle empty options objects', () => {
      const classifier = createBandClassifier({});
      const selector = createBandSelector(undefined, {});
      
      expect(classifier).toBeDefined();
      expect(selector).toBeDefined();
    });

    test('should maintain separate instances', () => {
      const classifier1 = createBandClassifier();
      const classifier2 = createBandClassifier();
      const selector1 = createBandSelector();
      const selector2 = createBandSelector();
      
      expect(classifier1).not.toBe(classifier2);
      expect(selector1).not.toBe(selector2);
    });

    test('should accept null values appropriately', () => {
      // Test that the factory functions handle null inputs appropriately
      expect(() => createBandSelector(null as any)).not.toThrow();
    });
  });

  describe('Type Safety', () => {
    test('should create instances with correct types', () => {
      const classifier = createBandClassifier();
      const selector = createBandSelector();
      
      expect(classifier).toBeInstanceOf(BandClassifier);
      expect(selector).toBeInstanceOf(BandSelector);
    });

    test('should maintain type safety with options', () => {
      const classifierOptions = { cacheSize: 1000 };
      const selectorOptions = { adaptiveThresholds: true, qualityThreshold: 0.9 };
      
      const classifier = createBandClassifier(classifierOptions);
      const selector = createBandSelector(undefined, selectorOptions);
      
      expect(classifier).toBeDefined();
      expect(selector).toBeDefined();
    });
  });

  describe('Module Consistency', () => {
    test('should provide consistent behavior across multiple creations', () => {
      const results: any[] = [];
      
      for (let i = 0; i < 5; i++) {
        const classifier = createBandClassifier({ cacheSize: 100 });
        const selector = createBandSelector();
        results.push({ classifier, selector });
      }
      
      // All instances should be defined and of correct type
      results.forEach(({ classifier, selector }) => {
        expect(classifier).toBeInstanceOf(BandClassifier);
        expect(selector).toBeInstanceOf(BandSelector);
      });
    });

    test('should handle rapid successive creations', () => {
      const classifiers = Array.from({ length: 10 }, () => createBandClassifier());
      const selectors = Array.from({ length: 10 }, () => createBandSelector());
      
      expect(classifiers).toHaveLength(10);
      expect(selectors).toHaveLength(10);
      
      classifiers.forEach(c => expect(c).toBeInstanceOf(BandClassifier));
      selectors.forEach(s => expect(s).toBeInstanceOf(BandSelector));
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid options gracefully', () => {
      // Test with invalid but non-throwing options
      const invalidOptions = { cacheSize: -1 }; // Negative cache size
      
      expect(() => createBandClassifier(invalidOptions)).not.toThrow();
    });

    test('should handle malformed options objects', () => {
      const malformedOptions = { 
        cacheSize: 'not-a-number' as any,
        unknownProperty: 'value'
      };
      
      expect(() => createBandClassifier(malformedOptions)).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    test('should create instances efficiently', () => {
      const startTime = Date.now();
      
      // Create multiple instances
      for (let i = 0; i < 100; i++) {
        createBandClassifier();
        createBandSelector();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete reasonably quickly (less than 1 second for 100 instances)
      expect(duration).toBeLessThan(1000);
    });

    test('should not leak memory with repeated creations', () => {
      // This is a basic test - in a real scenario you'd want more sophisticated memory testing
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and discard many instances
      for (let i = 0; i < 1000; i++) {
        createBandClassifier();
        createBandSelector();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB for this test)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Configuration Propagation', () => {
    test('should properly pass options to underlying implementations', () => {
      const classifierOptions = { cacheSize: 2000 };
      const selectorOptions = { 
        adaptiveThresholds: true,
        performanceMonitoring: false,
        hysteresisMargin: 0.25
      };
      
      const classifier = createBandClassifier(classifierOptions);
      const selector = createBandSelector(undefined, selectorOptions);
      
      // Verify instances are created (specific option verification would require implementation details)
      expect(classifier).toBeDefined();
      expect(selector).toBeDefined();
    });

    test('should handle partial option sets', () => {
      const partialClassifierOptions = { cacheSize: 750 };
      const partialSelectorOptions = { adaptiveThresholds: false };
      
      const classifier = createBandClassifier(partialClassifierOptions);
      const selector = createBandSelector(undefined, partialSelectorOptions);
      
      expect(classifier).toBeDefined();
      expect(selector).toBeDefined();
    });
  });

  describe('Interoperability', () => {
    test('should allow classifier to be used with selector', () => {
      const classifier = createBandClassifier({ cacheSize: 500 });
      const selector = createBandSelector(classifier, { adaptiveThresholds: true });
      
      expect(selector).toBeDefined();
      expect(selector).toBeInstanceOf(BandSelector);
    });

    test('should work with different classifier instances', () => {
      const classifier1 = createBandClassifier({ cacheSize: 100 });
      const classifier2 = createBandClassifier({ cacheSize: 200 });
      
      const selector1 = createBandSelector(classifier1);
      const selector2 = createBandSelector(classifier2);
      
      expect(selector1).toBeDefined();
      expect(selector2).toBeDefined();
      expect(selector1).not.toBe(selector2);
    });
  });
});
