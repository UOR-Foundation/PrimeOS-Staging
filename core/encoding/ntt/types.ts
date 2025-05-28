/**
 * NTT Module Types
 * ===============
 * 
 * Type definitions for Number Theoretic Transform operations
 * in the encoding module.
 */

/**
 * Window function types for spectral processing
 */
export enum WindowFunction {
  RECTANGULAR = 'rectangular',
  HAMMING = 'hamming',
  BLACKMAN = 'blackman',
  KAISER = 'kaiser',
  CUSTOM = 'custom'
}

/**
 * NTT error class
 */
export class NTTError extends Error {
  constructor(operation: string, reason: string) {
    super(`NTT operation failed at ${operation}: ${reason}`);
    this.name = 'NTTError';
  }
}

/**
 * NTT configuration interface
 */
export interface NTTConfig {
  modulus: bigint;
  primitiveRoot: bigint;
  maxSize: number;
}

/**
 * NTT metrics interface
 */
export interface NTTMetrics {
  modulus: bigint;
  primitiveRoot: bigint;
  maxSize: number;
  precomputedRoots: number;
}

/**
 * NTT result interface
 */
export interface NTTResult {
  forward: number[];
  inverse?: number[];
  verified: boolean;
}
