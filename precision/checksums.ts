/**
 * Precision Module - Checksums
 * ==========================
 *
 * This file provides checksumming functionality for data integrity and verification.
 */

import { Factor } from './types';

/**
 * Simple prime registry for checksumming
 */
export class SimplePrimeRegistry {
  private primes: bigint[] = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n];
  private primeIndices: Map<bigint, number> = new Map();
  
  constructor() {
    // Initialize indices
    this.primes.forEach((p, idx) => {
      this.primeIndices.set(p, idx);
    });
  }
  
  /**
   * Get prime at index
   */
  getPrime(index: number): bigint {
    if (index >= this.primes.length) {
      this.extendTo(index);
    }
    return this.primes[index];
  }
  
  /**
   * Get index of prime
   */
  getIndex(prime: bigint): number {
    if (!this.primeIndices.has(prime)) {
      throw new Error(`Prime ${prime} not found in registry`);
    }
    return this.primeIndices.get(prime) || 0;
  }
  
  /**
   * Extend prime registry to include index
   */
  private extendTo(index: number): void {
    // Simple prime generation
    // In a real implementation, this would be more sophisticated
    let candidate = this.primes[this.primes.length - 1] + 2n;
    
    while (this.primes.length <= index) {
      let isPrime = true;
      
      // Check if candidate is divisible by any known prime
      for (const prime of this.primes) {
        if (prime * prime > candidate) break;
        if (candidate % prime === 0n) {
          isPrime = false;
          break;
        }
      }
      
      if (isPrime) {
        this.primes.push(candidate);
        this.primeIndices.set(candidate, this.primes.length - 1);
      }
      
      candidate += 2n;
    }
  }
}

/**
 * Calculate a checksum from prime factors
 * 
 * @param factors List of prime factors with exponents
 * @param primeRegistry Registry to get prime indices
 * @returns Checksum prime number
 */
export function calculateChecksum(
  factors: Factor[],
  primeRegistry: {
    getIndex: (prime: bigint) => number;
    getPrime: (index: number) => bigint;
  }
): bigint {
  let xorSum = 0;
  
  for (const { prime, exponent } of factors) {
    const primeIndex = primeRegistry.getIndex(prime);
    xorSum ^= primeIndex * exponent;
  }
  
  return primeRegistry.getPrime(xorSum);
}


/**
 * Extract factors and checksum from a value
 * 
 * @param value Value to extract from
 * @param primeRegistry Registry to get prime indices
 * @returns Object containing core factors and checksum
 */
export function extractFactorsAndChecksum(
  value: bigint,
  primeRegistry: {
    getIndex: (prime: bigint) => number;
    getPrime: (index: number) => bigint;
    factor: (n: bigint) => Factor[];
  }
): { coreFactors: Factor[]; checksum: bigint } {
  const factors = primeRegistry.factor(value);
  
  // Find the checksum factor (has highest exponent)
  let checksumFactor: Factor | undefined;
  
  for (const factor of factors) {
    if (!checksumFactor || factor.exponent > checksumFactor.exponent) {
      checksumFactor = factor;
    }
  }
  
  if (!checksumFactor) {
    throw new Error("No checksum factor found");
  }
  
  // Extract core factors (all except checksum)
  const checksumPower = 6; // Default value from UOR kernel
  const coreFactors: Factor[] = [];
  
  for (const factor of factors) {
    if (factor.prime === checksumFactor.prime) {
      // If this is the checksum factor, reduce its exponent
      const remaining = factor.exponent - checksumPower;
      if (remaining > 0) {
        coreFactors.push({ prime: factor.prime, exponent: remaining });
      }
    } else {
      coreFactors.push(factor);
    }
  }
  
  return { coreFactors, checksum: checksumFactor.prime };
}

/**
 * Verify a checksum
 * 
 * @param value Value to verify
 * @param primeRegistry Registry to get prime indices
 * @returns Boolean indicating if checksum is valid
 */
export function verifyChecksum(
  value: bigint,
  primeRegistry: {
    getIndex: (prime: bigint) => number;
    getPrime: (index: number) => bigint;
    factor: (n: bigint) => Factor[];
  }
): boolean {
  try {
    const { coreFactors, checksum } = extractFactorsAndChecksum(value, primeRegistry);
    const expectedChecksum = calculateChecksum(coreFactors, primeRegistry);
    return checksum === expectedChecksum;
  } catch (error) {
    return false;
  }
}

/**
 * Batch checksum calculation for multiple sets of factors
 * 
 * @param factorSets Multiple sets of factors to calculate checksums for
 * @param primeRegistry Registry to get prime indices
 * @returns Array of checksums
 */
export function calculateBatchChecksums(
  factorSets: Factor[][],
  primeRegistry: {
    getIndex: (prime: bigint) => number;
    getPrime: (index: number) => bigint;
  }
): bigint[] {
  return factorSets.map(factors => calculateChecksum(factors, primeRegistry));
}

/**
 * Calculate memory usage of checksumming
 *
 * @param numFactors Number of factors to process
 * @returns Memory usage in bytes (approximate)
 */
export function calculateChecksumMemoryUsage(numFactors: number): number {
  // Simplified model of memory usage
  const OVERHEAD_BYTES = 64;  // Basic overhead
  const FACTOR_BYTES = 16;    // Bytes per factor (prime + exponent)
  
  return OVERHEAD_BYTES + (numFactors * FACTOR_BYTES);
}
