/**
 * Precision Module - Main Entry Point
 * ===================================
 *
 * This file serves as the main entry point for the precision-focused mathematical operations
 * in the PrimeOS ecosystem. It provides exact arithmetic operations and utilities for working
 * with large integers.
 */

// Import modular arithmetic functions
import {
  mod,
  modAdd,
  modSub,
  modMul,
  modPow,
  modInverse,
  isCoprime,
  gcd,
  lcm,
  findPrimitiveRoots
} from './modular';

// Import utility functions
import {
  isSafeInteger,
  bitLength,
  exactlyEquals,
  toByteArray,
  fromByteArray
} from './utils';

// Import verification functions
import {
  verifyValue,
  VerificationStatus,
  VerificationContext,
  createOptimizedVerifier
} from './verification';

// Import checksum functions
import {
  calculateChecksum,
  extractFactorsAndChecksum,
  verifyChecksum,
  SimplePrimeRegistry,
  calculateChecksumMemoryUsage
} from './checksums';

// Import BigInt utilities
import {
  PrecisionBigInt,
  createPrecisionBigInt,
  toBigInt,
  toNumber,
  isProbablePrime
} from './bigint';

// Export core mathematical types only
export * from './types';

// Re-export specific functions
export {
  // Modular arithmetic
  mod,
  modAdd,
  modSub,
  modMul,
  modPow,
  modInverse,
  isCoprime,
  gcd,
  lcm,
  findPrimitiveRoots,

  // Utilities
  isSafeInteger,
  bitLength,
  exactlyEquals,
  toByteArray,
  fromByteArray,

  // Verification
  verifyValue,
  VerificationStatus,
  VerificationContext,
  createOptimizedVerifier,

  // Checksums
  calculateChecksum,
  extractFactorsAndChecksum,
  verifyChecksum,
  SimplePrimeRegistry,
  calculateChecksumMemoryUsage,

  // BigInt utilities
  PrecisionBigInt,
  createPrecisionBigInt,
  toBigInt,
  toNumber,
  isProbablePrime
};

/**
 * Create a precision enhancer to improve existing UOR kernel components
 */
export function createPrecisionEnhancer(options: {
  pythonCompatible?: boolean,
  errorTolerance?: number
} = {}) {
  return {
    /**
     * Enhance an integrity system with precision improvements
     */
    enhanceIntegritySystem(integrity: any): any {
      // Placeholder implementation
      return integrity;
    },

    /**
     * Enhance verification with precision improvements
     */
    enhanceVerification(verification: any): any {
      // Placeholder implementation
      return verification;
    }
  };
}

/**
 * Test if the environment supports Python-compatible modular arithmetic
 */
export function testModularCompatibility(): boolean {
  // Check if negative modulus works correctly
  const jsNegativeMod = -5 % 13;
  const correctNegativeMod = mod(-5, 13);

  return jsNegativeMod === correctNegativeMod;
}

/**
 * Return the version of the precision module
 */
export function getVersion(): string {
  return "1.0.0";
}

/**
 * Group core mathematical utilities for easy access
 */
export const MathUtils = {
  // Modular arithmetic
  mod,
  modAdd,
  modSub,
  modMul,
  modPow,
  modInverse,
  
  // Integer operations
  gcd,
  lcm,
  isProbablePrime,
  
  // BigInt utilities
  toBigInt,
  toNumber,
  bitLength,
  exactlyEquals,
  
  // Conversion
  toByteArray,
  fromByteArray
};
