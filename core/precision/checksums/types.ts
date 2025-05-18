/**
 * Checksums Types
 * ==============
 * 
 * Type definitions for the checksums module.
 */

import { Factor } from '../types';

/**
 * Interface for a prime registry used in checksum operations
 */
export interface PrimeRegistryForChecksums {
  /**
   * Get prime at specific index
   */
  getPrime(idx: number): bigint;
  
  /**
   * Get index of a prime in the registry
   */
  getIndex(prime: bigint): number;
  
  /**
   * Factor a number into its prime components
   */
  factor(x: bigint): Factor[];
}

/**
 * State for incremental XOR hash computation
 */
export interface XorHashState {
  /**
   * Running XOR sum
   */
  xorSum: number;
  
  /**
   * Count of values processed
   */
  count: number;
}

/**
 * Options for checksums operations
 */
export interface ChecksumOptions {
  /**
   * Power (exponent) to use for the checksum prime
   * Default is 6
   */
  checksumPower?: number;
  
  /**
   * Whether to cache checksum calculations
   */
  enableCache?: boolean;
  
  /**
   * Whether to verify checksums during operations
   */
  verifyOnOperation?: boolean;

  /**
   * Enable debug logging for checksums operations
   */
  debug?: boolean;
}

/**
 * Result of extracting checksum and factors from a value
 */
export interface ChecksumExtractionResult {
  /**
   * Original factors with checksum prime removed or reduced
   */
  coreFactors: Factor[];
  
  /**
   * The prime used for the checksum
   */
  checksumPrime: bigint;
  
  /**
   * Power (exponent) of the checksum prime
   */
  checksumPower: number;
  
  /**
   * Whether the checksum is valid
   */
  valid: boolean;
}

/**
 * Function to calculate a checksum XOR value from factors
 * Optional primeRegistry can be provided for accurate prime indices
 */
export type XorSumFunction = (factors: Factor[], primeRegistry?: PrimeRegistryForChecksums) => number;

/**
 * Function to attach a checksum to a value
 */
export type AttachChecksumFunction = (
  value: bigint, 
  factors: Factor[], 
  primeRegistry: PrimeRegistryForChecksums
) => bigint;

/**
 * Function to extract factors and checksum from a value
 */
export type ExtractChecksumFunction = (
  value: bigint, 
  primeRegistry: PrimeRegistryForChecksums
) => ChecksumExtractionResult;

/**
 * Function to calculate a batch checksum for multiple values
 */
export type BatchChecksumFunction = (values: bigint[], primeRegistry: PrimeRegistryForChecksums) => bigint;

/**
 * Interface for checksum operations
 */
export interface ChecksumsImplementation {
  /**
   * Calculate a checksum XOR value from factors
   * Optional primeRegistry can be provided for accurate prime indices
   */
  calculateXorSum: XorSumFunction;
  
  /**
   * Calculate a checksum prime from factors using XOR
   */
  calculateChecksum: (factors: Factor[], primeRegistry: PrimeRegistryForChecksums) => bigint;
  
  /**
   * Attach a checksum to a value
   */
  attachChecksum: AttachChecksumFunction;
  
  /**
   * Extract factors and checksum from a value
   */
  extractFactorsAndChecksum: ExtractChecksumFunction;
  
  /**
   * Calculate a batch checksum for multiple values
   */
  calculateBatchChecksum: BatchChecksumFunction;
  
  /**
   * Get the checksum power (exponent) used by this implementation
   */
  getChecksumPower(): number;
  
  /**
   * Create a new XOR hash state for incremental checksumming
   */
  createXorHashState(): XorHashState;
  
  /**
   * Update a running XOR hash with a new value
   */
  updateXorHash(state: XorHashState, value: bigint, primeRegistry: PrimeRegistryForChecksums): XorHashState;
  
  /**
   * Get the checksum prime from an XOR hash state
   */
  getChecksumFromXorHash(state: XorHashState, primeRegistry: PrimeRegistryForChecksums): bigint;
  
  /**
   * Clear the checksum cache
   */
  clearCache(): void;
}

/**
 * Function to create a ChecksumsImplementation with options
 */
export type ChecksumsFactory = (options?: ChecksumOptions) => ChecksumsImplementation;
