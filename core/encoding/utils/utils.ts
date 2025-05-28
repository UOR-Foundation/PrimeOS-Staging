/**
 * Encoding Module Utilities
 * =========================
 * 
 * Utility functions for the encoding module implementation.
 * Uses the precision module for enhanced mathematical operations.
 */

import { Factor } from '../../prime/types';
import { ChunkType, StandardOpcodes, ChunkExponent } from '../core/types';

// Import enhanced mathematical functions from the precision module
import { 
  mod as precisionMod, 
  modPow as precisionModPow
} from '../../precision/modular';

/**
 * Generate unique chunk ID
 */
export function generateChunkId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Reconstruct number from prime factors
 */
export function reconstructFromFactors(factors: Factor[]): bigint {
  return factors.reduce(
    (acc, { prime, exponent }) => acc * (prime ** BigInt(exponent)),
    1n
  );
}

/**
 * Determine chunk type from exponent pattern - fixed with strict validation
 */
export function determineChunkType(factors: Factor[]): ChunkType {
  // Check for block header patterns first
  if (factors.some(f => f.exponent === ChunkExponent.BLOCK_HEADER)) {
    return ChunkType.BLOCK_HEADER;
  }
  
  // Check for data patterns FIRST - STRICT validation: must have BOTH position and value
  const hasDataPosition = factors.some(f => 
    f.prime === 2n && f.exponent >= ChunkExponent.DATA_POSITION
  );
  const hasDataValue = factors.some(f => 
    f.prime === 3n && f.exponent >= ChunkExponent.DATA_VALUE
  );
  
  // For data chunks, we need BOTH position and value factors with correct ranges
  if (hasDataPosition && hasDataValue) {
    return ChunkType.DATA;
  }
  
  // Check for operation patterns ONLY if it's not a data chunk
  if (factors.some(f => f.exponent === ChunkExponent.OPERATION)) {
    return ChunkType.OPERATION;
  }
  
  throw new Error('Unknown chunk type from factors');
}

/**
 * Extract factors by exponent
 */
export function getFactorsByExponent(factors: Factor[], exponent: number): Factor[] {
  return factors.filter(f => f.exponent === exponent);
}

/**
 * Validate chunk structure - stricter validation
 */
export function validateChunkStructure(factors: Factor[]): boolean {
  // Must have at least one factor
  if (factors.length === 0) return false;
  
  // For valid UOR chunks, we need proper patterns
  try {
    // Try to determine type with all factors first
    determineChunkType(factors);
    return true;
  } catch {
    // If that fails, try with core factors only (excluding checksum)
    try {
      const coreFactors = factors.filter(f => f.exponent < ChunkExponent.CHECKSUM);
      if (coreFactors.length > 0) {
        determineChunkType(coreFactors);
        return true;
      }
    } catch {
      // Final check: reject anything that doesn't fit UOR patterns
      return false;
    }
  }
  
  return false;
}

/**
 * Calculate chunk size in bits
 */
export function calculateChunkSize(value: bigint): number {
  return value.toString(2).length;
}

/**
 * Modular exponentiation using precision module
 */
export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  return precisionModPow(base, exponent, modulus);
}

/**
 * Modular arithmetic using precision module
 */
export function mod(a: bigint, m: bigint): bigint {
  return precisionMod(a, m);
}

/**
 * Modular inverse using extended Euclidean algorithm
 */
export function modularInverse(a: bigint, m: bigint): bigint {
  if (gcd(a, m) !== 1n) {
    throw new Error('Modular inverse does not exist');
  }
  
  const [x] = extendedGcd(a, m);
  return mod(x, m);
}

/**
 * Greatest common divisor
 */
export function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) {
    [a, b] = [b, mod(a, b)];
  }
  return a;
}

/**
 * Extended Euclidean algorithm
 */
export function extendedGcd(a: bigint, b: bigint): [bigint, bigint] {
  if (b === 0n) {
    return [1n, 0n];
  }
  
  const [x1, y1] = extendedGcd(b, mod(a, b));
  const x = y1;
  const y = x1 - (a / b) * y1;
  
  return [x, y];
}

/**
 * Check if a number is in a specific exponent range
 */
export function hasExponentInRange(factors: Factor[], minExp: number, maxExp: number): boolean {
  return factors.some(f => f.exponent >= minExp && f.exponent <= maxExp);
}

/**
 * Get the dominant factor (highest exponent)
 */
export function getDominantFactor(factors: Factor[]): Factor | undefined {
  return factors.reduce((max, current) => 
    (!max || current.exponent > max.exponent) ? current : max, 
    undefined as Factor | undefined
  );
}

/**
 * Normalize factors by removing zero exponents
 */
export function normalizeFactors(factors: Factor[]): Factor[] {
  return factors.filter(f => f.exponent > 0);
}

/**
 * Check if factors represent a valid UOR chunk pattern
 */
export function isValidUORPattern(factors: Factor[]): boolean {
  const normalized = normalizeFactors(factors);
  
  // Must have at least one factor
  if (normalized.length === 0) return false;
  
  // Check for valid type pattern
  try {
    const hasChecksum = normalized.some(f => f.exponent >= ChunkExponent.CHECKSUM);
    const coreFactors = hasChecksum 
      ? normalized.filter(f => f.exponent < ChunkExponent.CHECKSUM)
      : normalized;
    
    if (coreFactors.length === 0 && hasChecksum) {
      // Only checksum factors is not valid for UOR patterns
      return false;
    }
    
    determineChunkType(coreFactors);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract core factors (excluding checksum)
 */
export function extractCoreFactors(factors: Factor[]): Factor[] {
  const result: Factor[] = [];
  
  for (const factor of factors) {
    if (factor.exponent >= ChunkExponent.CHECKSUM) {
      // This is a checksum factor, subtract checksum exponent
      const remainingExponent = factor.exponent - ChunkExponent.CHECKSUM;
      if (remainingExponent > 0) {
        result.push({ prime: factor.prime, exponent: remainingExponent });
      }
    } else {
      // This is a core factor
      result.push({ ...factor });
    }
  }
  
  return result;
}

/**
 * Create a safe bigint from various input types
 */
export function toBigInt(value: any): bigint {
  if (typeof value === 'bigint') {
    return value;
  } else if (typeof value === 'number' && Number.isInteger(value)) {
    return BigInt(value);
  } else if (typeof value === 'string') {
    try {
      return BigInt(value);
    } catch {
      throw new Error(`Cannot convert string "${value}" to BigInt`);
    }
  } else {
    throw new Error(`Cannot convert ${typeof value} to BigInt`);
  }
}

/**
 * Format a factor array as a readable string
 */
export function formatFactors(factors: Factor[]): string {
  return factors
    .map(f => `${f.prime}^${f.exponent}`)
    .join(' × ');
}

/**
 * Calculate total bit size of a factor array
 */
export function calculateFactorsBitSize(factors: Factor[]): number {
  const reconstructed = reconstructFromFactors(factors);
  return calculateChunkSize(reconstructed);
}

/**
 * Check if two factor arrays are equivalent (same mathematical value)
 */
export function areFactorsEquivalent(factors1: Factor[], factors2: Factor[]): boolean {
  const value1 = reconstructFromFactors(factors1);
  const value2 = reconstructFromFactors(factors2);
  return value1 === value2;
}

/**
 * Merge factor arrays by combining same primes
 */
export function mergeFactors(factors1: Factor[], factors2: Factor[]): Factor[] {
  const merged = new Map<string, number>();
  
  // Add factors from first array
  for (const factor of factors1) {
    const key = factor.prime.toString();
    merged.set(key, (merged.get(key) || 0) + factor.exponent);
  }
  
  // Add factors from second array
  for (const factor of factors2) {
    const key = factor.prime.toString();
    merged.set(key, (merged.get(key) || 0) + factor.exponent);
  }
  
  // Convert back to Factor array
  const result: Factor[] = [];
  for (const [primeStr, exponent] of merged) {
    if (exponent > 0) {
      result.push({ prime: BigInt(primeStr), exponent });
    }
  }
  
  return result;
}

/**
 * Create a timestamp in milliseconds
 */
export function createTimestamp(): number {
  return Date.now();
}

/**
 * Validate that a value is a positive integer
 */
export function validatePositiveInteger(value: any, name: string): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer, got: ${value}`);
  }
}

/**
 * Validate that a value is a positive BigInt
 */
export function validatePositiveBigInt(value: any, name: string): void {
  if (typeof value !== 'bigint' || value <= 0n) {
    throw new Error(`${name} must be a positive BigInt, got: ${value}`);
  }
}
