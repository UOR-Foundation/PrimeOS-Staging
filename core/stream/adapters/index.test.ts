/**
 * Stream Adapters Index Tests
 * ===========================
 * 
 * Tests for the stream adapters index module exports.
 */

import * as StreamAdapters from './index';

describe('Stream Adapters Index', () => {
  it('should export EncodingStreamAdapter', () => {
    expect(StreamAdapters.EncodingStreamAdapter).toBeDefined();
    expect(typeof StreamAdapters.EncodingStreamAdapter).toBe('function');
  });

  it('should export createEncodingStreamAdapter', () => {
    expect(StreamAdapters.createEncodingStreamAdapter).toBeDefined();
    expect(typeof StreamAdapters.createEncodingStreamAdapter).toBe('function');
  });

  it('should export createAutoEncodingStreamAdapter', () => {
    expect(StreamAdapters.createAutoEncodingStreamAdapter).toBeDefined();
    expect(typeof StreamAdapters.createAutoEncodingStreamAdapter).toBe('function');
  });

  it('should export PrimeStreamAdapter', () => {
    expect(StreamAdapters.PrimeStreamAdapter).toBeDefined();
    expect(typeof StreamAdapters.PrimeStreamAdapter).toBe('function');
  });

  it('should export createPrimeStreamAdapter', () => {
    expect(StreamAdapters.createPrimeStreamAdapter).toBeDefined();
    expect(typeof StreamAdapters.createPrimeStreamAdapter).toBe('function');
  });

  it('should export createEnhancedPrimeStreamAdapter', () => {
    expect(StreamAdapters.createEnhancedPrimeStreamAdapter).toBeDefined();
    expect(typeof StreamAdapters.createEnhancedPrimeStreamAdapter).toBe('function');
  });

  it('should export IntegrityStreamAdapter', () => {
    expect(StreamAdapters.IntegrityStreamAdapter).toBeDefined();
    expect(typeof StreamAdapters.IntegrityStreamAdapter).toBe('function');
  });

  it('should export createIntegrityStreamAdapter', () => {
    expect(StreamAdapters.createIntegrityStreamAdapter).toBeDefined();
    expect(typeof StreamAdapters.createIntegrityStreamAdapter).toBe('function');
  });

  it('should export createBatchIntegrityStreamAdapter', () => {
    expect(StreamAdapters.createBatchIntegrityStreamAdapter).toBeDefined();
    expect(typeof StreamAdapters.createBatchIntegrityStreamAdapter).toBe('function');
  });

  it('should export StreamVerificationResult interface through usage', () => {
    // TypeScript interfaces can't be tested directly at runtime,
    // but we can verify they work through type checking
    const result: StreamAdapters.StreamVerificationResult = {
      chunk: 123n,
      valid: true,
      errors: [],
      verificationTime: 100,
      index: 0
    };
    expect(result).toBeDefined();
  });

  it('should not export any unexpected properties', () => {
    const expectedExports = [
      'EncodingStreamAdapter',
      'createEncodingStreamAdapter',
      'createAutoEncodingStreamAdapter',
      'PrimeStreamAdapter',
      'createPrimeStreamAdapter',
      'createEnhancedPrimeStreamAdapter',
      'IntegrityStreamAdapter',
      'createIntegrityStreamAdapter',
      'createBatchIntegrityStreamAdapter',
      'StreamVerificationResult'
    ];

    const actualExports = Object.keys(StreamAdapters);
    const unexpectedExports = actualExports.filter(
      exp => !expectedExports.includes(exp)
    );

    // Note: TypeScript interfaces like StreamVerificationResult won't appear in Object.keys
    expect(unexpectedExports).toEqual([]);
  });
});
