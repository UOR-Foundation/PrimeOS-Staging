/**
 * Number Theoretic Transform Implementation
 * ========================================
 * 
 * Production NTT implementation for spectral transforms and domain switching
 * operations in the encoding module. Uses the complete mathematical implementation.
 */

import { CompleteNTT } from './ntt-implementation';

/**
 * Production NTT implementation using CompleteNTT
 */
export class SimpleNTT extends CompleteNTT {
  constructor(modulus: bigint, primitiveRoot: bigint) {
    // Use the complete implementation with proper mathematical operations
    super(modulus, primitiveRoot, 1024);
  }
  
  /**
   * Provide backward compatibility with the simple interface
   */
  getModulus(): bigint {
    return this.getMetrics().modulus;
  }
  
  getPrimitiveRoot(): bigint {
    return this.getMetrics().primitiveRoot;
  }
}
