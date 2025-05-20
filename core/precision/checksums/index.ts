/**
 * Checksums Implementation
 * =====================
 *
 * This module provides data integrity through prime-based checksums.
 * Implements the PrimeOS Model interface pattern for consistent lifecycle management.
 */

import {
  ChecksumOptions,
  ChecksumsImplementation,
  ChecksumsModelInterface,
  ChecksumState,
  ChecksumExtractionResult,
  PrimeRegistryForChecksums,
  XorHashState,
  XorSumFunction,
  ChecksumProcessInput
} from './types';
import { Factor } from '../types';
import { modPow, modMul } from '../modular';
import {
  BaseModel,
  ModelResult,
  ModelLifecycleState
} from '../../../os/model';
import { createLogging } from '../../../os/logging';

/**
 * Default options for checksum operations
 */
const DEFAULT_OPTIONS: ChecksumOptions = {
  checksumPower: 6, // Default power based on the UOR axioms
  enableCache: true,
  verifyOnOperation: false,
  debug: false,
  name: 'precision-checksums',
  version: '1.0.0'
};

/**
 * LRU Cache implementation for checksum caching
 */
class LRUCache<K, V> {
  private capacity: number;
  private cache = new Map<K, V>();
  private keyOrder: K[] = [];
  private hits = 0;
  private misses = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      this.misses++;
      return undefined;
    }
    
    // Move key to the end (most recently used)
    this.keyOrder = this.keyOrder.filter(k => k !== key);
    this.keyOrder.push(key);
    
    this.hits++;
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    // If key exists, update its position in keyOrder
    if (this.cache.has(key)) {
      this.keyOrder = this.keyOrder.filter(k => k !== key);
    } 
    // If at capacity, remove least recently used item
    else if (this.keyOrder.length === this.capacity) {
      const lruKey = this.keyOrder.shift();
      if (lruKey !== undefined) {
        this.cache.delete(lruKey);
      }
    }
    
    // Add new entry
    this.cache.set(key, value);
    this.keyOrder.push(key);
  }

  clear(): void {
    this.cache.clear();
    this.keyOrder = [];
    this.hits = 0;
    this.misses = 0;
  }

  size(): number {
    return this.cache.size;
  }
  
  getStats(): { size: number, hits: number, misses: number } {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses
    };
  }
}

/**
 * ChecksumsImplementation provides methods for calculating, attaching, 
 * and extracting checksums to ensure data integrity.
 * Extends BaseModel to implement the PrimeOS Model interface pattern.
 */
export class ChecksumsImpl extends BaseModel implements ChecksumsModelInterface {
  private cache: LRUCache<string, bigint>;
  private checksumOptions: ChecksumOptions;
  
  /**
   * Create a new checksums implementation
   */
  constructor(options: ChecksumOptions = {}) {
    // Initialize BaseModel with options
    super({ ...DEFAULT_OPTIONS, ...options });
    
    // Store checksum-specific options
    this.checksumOptions = { ...DEFAULT_OPTIONS, ...options };
    
    // Create LRU cache for checksum calculations
    this.cache = new LRUCache<string, bigint>(1000); // Cache up to 1000 entries
    
    if (this.checksumOptions.debug) {
      // Will use logger after initialization
      console.log('Created ChecksumsImpl with options:', this.checksumOptions);
    }
  }
  
  /**
   * Initialize the module
   */
  protected async onInitialize(): Promise<void> {
    // Add custom state tracking
    this.state.custom = {
      config: this.checksumOptions,
      cache: this.checksumOptions.enableCache ? this.cache.getStats() : undefined
    };
    
    await this.logger.debug('Checksums module initialized with configuration', this.checksumOptions);
  }
  
  /**
   * Process operation request
   */
  protected async onProcess<T = ChecksumProcessInput, R = unknown>(input: T): Promise<R> {
    if (!input) {
      throw new Error('Input cannot be undefined or null');
    }
    
    await this.logger.debug('Processing input', input);
    
    // Process based on input type
    if (typeof input === 'object' && input !== null && 'operation' in input && 'params' in input) {
      const request = input as unknown as ChecksumProcessInput;
      
      switch (request.operation) {
        case 'calculateXorSum':
          return this.calculateXorSum(
            request.params[0] as Factor[],
            request.params[1] as PrimeRegistryForChecksums
          ) as unknown as R;
          
        case 'calculateChecksum':
          return this.calculateChecksum(
            request.params[0] as Factor[],
            request.params[1] as PrimeRegistryForChecksums
          ) as unknown as R;
          
        case 'attachChecksum':
          return this.attachChecksum(
            request.params[0] as bigint,
            request.params[1] as Factor[],
            request.params[2] as PrimeRegistryForChecksums
          ) as unknown as R;
          
        case 'extractFactorsAndChecksum':
          return this.extractFactorsAndChecksum(
            request.params[0] as bigint,
            request.params[1] as PrimeRegistryForChecksums
          ) as unknown as R;
          
        case 'calculateBatchChecksum':
          return this.calculateBatchChecksum(
            request.params[0] as bigint[],
            request.params[1] as PrimeRegistryForChecksums
          ) as unknown as R;
          
        case 'createXorHashState':
          return this.createXorHashState() as unknown as R;
          
        case 'updateXorHash':
          return this.updateXorHash(
            request.params[0] as XorHashState,
            request.params[1] as bigint,
            request.params[2] as PrimeRegistryForChecksums
          ) as unknown as R;
          
        case 'getChecksumFromXorHash':
          return this.getChecksumFromXorHash(
            request.params[0] as XorHashState,
            request.params[1] as PrimeRegistryForChecksums
          ) as unknown as R;
          
        case 'clearCache':
          this.clearCache();
          return undefined as unknown as R;
          
        default:
          throw new Error(`Unknown operation: ${(request as any).operation}`);
      }
    } else {
      // For direct function calls without the operation wrapper
      return input as unknown as R;
    }
  }
  
  /**
   * Reset the module state
   */
  protected async onReset(): Promise<void> {
    // Clear cache
    this.clearCache();
    
    // Update state
    this.state.custom = {
      config: this.checksumOptions,
      cache: this.checksumOptions.enableCache ? this.cache.getStats() : undefined
    };
    
    await this.logger.debug('Checksums module reset');
  }
  
  /**
   * Clean up resources when module is terminated
   */
  protected async onTerminate(): Promise<void> {
    // Nothing to clean up for Checksums module
    await this.logger.debug('Checksums module terminated');
  }
  
  /**
   * Get the module state including cache statistics
   */
  getState(): ChecksumState {
    const baseState = super.getState();
    
    return {
      ...baseState,
      config: this.checksumOptions,
      cache: this.checksumOptions.enableCache ? this.cache.getStats() : undefined
    } as ChecksumState;
  }
  
  /**
   * Get the checksum power (exponent)
   */
  getChecksumPower(): number {
    return this.checksumOptions.checksumPower || DEFAULT_OPTIONS.checksumPower!;
  }
  
  /**
   * Calculate the XOR sum of factor indices × exponents
   * This is the core algorithm for checksum calculation
   */
  calculateXorSum(factors: Factor[], primeRegistry?: PrimeRegistryForChecksums): number {
    if (this.checksumOptions.debug) {
      this.logger.debug(`calculateXorSum for ${factors.length} factors ${primeRegistry ? 'with registry' : 'without registry'}`).catch(() => {});
    }
    
    let xorSum = 0;
    
    for (const { prime, exponent } of factors) {
      let primeIndex: number;
      
      if (primeRegistry) {
        // Get the actual index from the prime registry if provided
        primeIndex = primeRegistry.getIndex(prime);
      } else {
        // Fall back to a deterministic calculation for standalone use
        // This handles cases where we need to calculate a XOR sum without a registry
        // For test environments or when a proper registry isn't available

        // For small primes, use a simple algorithm that approximates prime indices
        if (prime < 100n) {
          // For small primes, derive a pseudo-index that's deterministic
          // This is faster than full factorization and works for common small primes
          primeIndex = Number(prime);
          
          // Adjust index to approximate actual prime index
          // This helps maintain XOR patterns similar to registry indices
          if (prime > 2n) primeIndex -= 1;      // Adjust for primes > 2
          if (prime > 3n) primeIndex -= 1;      // Adjust for primes > 3
          if (prime > 5n) primeIndex -= 1;      // Adjust for primes > 5
          if (prime > 10n) primeIndex -= 2;     // Adjust for primes > 10
          if (prime > 30n) primeIndex -= 5;     // Further adjust for larger primes
          
          // Final mapping to index space (approximation)
          primeIndex = Math.max(0, Math.floor(primeIndex / 2));
        } else {
          // For larger primes, use modulo with bit operations for a stable hash
          // This produces a deterministic index-like value suitable for XOR operations
          const str = prime.toString();
          let hash = 0;
          
          // Simple string hash algorithm with bit operations
          for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + charCode;
            hash |= 0; // Convert to 32-bit integer
          }
          
          // Ensure we get a positive index
          primeIndex = Math.abs(hash) % 1024; // Limit to reasonable range
        }
      }
      
      // XOR the index multiplied by the exponent - the actual checksum algorithm
      xorSum ^= (primeIndex * exponent);
    }
    
    return xorSum;
  }
  
  /**
   * Calculate a checksum from prime factors
   * The checksum is based on the XOR of prime indices times their exponents
   */
  calculateChecksum(factors: Factor[], primeRegistry: PrimeRegistryForChecksums): bigint {
    // Handle empty factors
    if (factors.length === 0) {
      return primeRegistry.getPrime(0); // Default to first prime (2)
    }
    
    // Convert factors to a cache key if caching is enabled
    const cacheKey = this.checksumOptions.enableCache 
      ? factors.map(f => `${f.prime}^${f.exponent}`).join(',')
      : '';
      
      // Check cache
      if (this.checksumOptions.enableCache) {
        const cached = this.cache.get(cacheKey);
        if (cached !== undefined) {
          if (this.checksumOptions.debug) {
            this.logger.debug(`Cache hit for checksum calculation: ${cacheKey}`).catch(() => {});
          }
          return cached;
        }
      }
    
    // Calculate XOR sum
    const xorSum = this.calculateXorSum(factors, primeRegistry);
    
    // Get the prime at the resulting index
    const checksumPrime = primeRegistry.getPrime(xorSum);
    
    // Cache the result
    if (this.checksumOptions.enableCache) {
      this.cache.set(cacheKey, checksumPrime);
    }
    
    return checksumPrime;
  }
  
  /**
   * Extract core factors and checksum from a value
   * Uses the checksum power to identify and separate the checksum factor
   */
  extractFactorsAndChecksum(
    value: bigint, 
    primeRegistry: PrimeRegistryForChecksums
  ): ChecksumExtractionResult {
    // Factor the value
    const rawFactors = primeRegistry.factor(value);
    
    // Extract checksum candidates - factors with exponent >= CHECKSUM_POWER
    const checksumPower = this.getChecksumPower();
    const checksumCandidates = rawFactors.filter(f => f.exponent >= checksumPower);
    
    if (checksumCandidates.length === 0) {
      throw new Error('Invalid encoding: no checksum found');
    }
    
    // Select the prime with highest exponent as checksum
    checksumCandidates.sort((a, b) => b.exponent - a.exponent);
    const checksumPrime = checksumCandidates[0].prime;
    
    // Create core factors, adjusting the checksum prime if needed
    const coreFactors: Factor[] = [];
    
    for (const factor of rawFactors) {
      if (factor.prime === checksumPrime) {
        const remaining = factor.exponent - checksumPower;
        if (remaining > 0) {
          coreFactors.push({ prime: factor.prime, exponent: remaining });
        }
      } else {
        coreFactors.push({ prime: factor.prime, exponent: factor.exponent });
      }
    }
    
    // Calculate expected checksum for verification
    const expectedChecksum = this.calculateChecksum(coreFactors, primeRegistry);
    
    // Verify the checksum
    const valid = checksumPrime === expectedChecksum;
    
    if (!valid) {
      throw new Error('Integrity violation: checksum mismatch');
    }
    
    return { coreFactors, checksumPrime, checksumPower, valid };
  }
  
  /**
   * Attach a checksum to a raw value
   * Uses the checksum power and modular exponentiation
   */
  attachChecksum(
    raw: bigint, 
    factors: Factor[], 
    primeRegistry: PrimeRegistryForChecksums
  ): bigint {
    if (this.checksumOptions.debug) {
      this.logger.debug(`Attaching checksum to raw value: ${raw}`).catch(() => {});
    }
    
    // Calculate the checksum prime
    const checksumPrime = this.calculateChecksum(factors, primeRegistry);
    
    // Calculate checksum = checksumPrime^checksumPower
    const checksumPower = this.getChecksumPower();
    
    // Simple approach: directly multiply by the prime raised to the power
    // This ensures the checksum factor will have exactly the required exponent
    const checksum = checksumPrime ** BigInt(checksumPower);
    
    // Multiply raw value by checksum
    const result = raw * checksum;
    
    // Verify the checksum if verifyOnOperation is enabled
    if (this.checksumOptions.verifyOnOperation) {
      if (this.checksumOptions.debug) {
        this.logger.debug(`Verifying checksum during operation (verifyOnOperation=true)`).catch(() => {});
      }
      
      try {
        const verification = this.extractFactorsAndChecksum(result, primeRegistry);
        if (!verification.valid) {
          throw new Error('Checksum verification failed during attachment');
        }
        
        if (this.checksumOptions.debug) {
          this.logger.debug(`Checksum verification successful`).catch(() => {});
        }
      } catch (error) {
        if (this.checksumOptions.debug) {
          this.logger.error(`Checksum verification failed:`, error).catch(() => {});
        }
        throw error;
      }
    }
    
    return result;
  }
  
  /**
   * Calculate a batch checksum for multiple values
   * XORs the checksums of each valid value in the batch
   */
  calculateBatchChecksum(values: bigint[], primeRegistry: PrimeRegistryForChecksums): bigint {
    if (this.checksumOptions.debug) {
      this.logger.debug(`Calculating batch checksum for ${values.length} values`).catch(() => {});
    }
    
    let batchXor = 0;
    let successCount = 0;
    let invalidCount = 0;
    
    for (const value of values) {
      try {
        const { checksumPrime } = this.extractFactorsAndChecksum(value, primeRegistry);
        const checksumIndex = primeRegistry.getIndex(checksumPrime);
        
        // XOR the checksum indices
        batchXor ^= checksumIndex;
        successCount++;
      } catch (e) {
        // Count invalid values but don't skip them entirely
        // Instead, use a special value to mark them as invalid
        batchXor ^= 0xFFFF; // Use a distinctive pattern for invalid values
        invalidCount++;
      }
    }
    
    // If no valid values, return the prime at index 0
    if (successCount === 0) {
      if (this.checksumOptions.debug) {
        this.logger.debug(`No valid values in batch, returning prime at index 0`).catch(() => {});
      }
      return primeRegistry.getPrime(0);
    }
    
    if (this.checksumOptions.debug) {
      this.logger.debug(`Batch XOR sum: ${batchXor}, valid values: ${successCount}/${values.length}`).catch(() => {});
    }
    
    return primeRegistry.getPrime(batchXor);
  }
  
  /**
   * Create a new XOR hash state for incremental hash computation
   */
  createXorHashState(): XorHashState {
    return { xorSum: 0, count: 0 };
  }
  
  /**
   * Update a running XOR hash with a new value
   * Useful for incremental hash computation
   */
  updateXorHash(state: XorHashState, value: bigint, primeRegistry: PrimeRegistryForChecksums): XorHashState {
    try {
      if (this.checksumOptions.debug) {
        this.logger.debug(`Updating XOR hash state with value: ${value}`).catch(() => {});
      }
      
      const { checksumPrime } = this.extractFactorsAndChecksum(value, primeRegistry);
      const checksumIndex = primeRegistry.getIndex(checksumPrime);
      
      // Update the XOR sum and count
      const newState = {
        xorSum: state.xorSum ^ checksumIndex,
        count: state.count + 1
      };
      
      if (this.checksumOptions.debug) {
        this.logger.debug(`Updated XOR hash: ${state.xorSum} -> ${newState.xorSum}, count: ${newState.count}`).catch(() => {});
      }
      
      return newState;
    } catch (e) {
      // Skip invalid values
      if (this.checksumOptions.debug) {
        this.logger.debug(`Skipping invalid value in updateXorHash: ${e}`).catch(() => {});
      }
      return state;
    }
  }
  
  /**
   * Get the checksum prime from an XOR hash state
   */
  getChecksumFromXorHash(state: XorHashState, primeRegistry: PrimeRegistryForChecksums): bigint {
    return primeRegistry.getPrime(state.xorSum);
  }
  
  /**
   * Clear the checksum cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Create a checksums implementation with the specified options
 */
export function createChecksums(options: ChecksumOptions = {}): ChecksumsModelInterface {
  return new ChecksumsImpl(options);
}

/**
 * Create and initialize a checksums module in a single step
 */
export async function createAndInitializeChecksums(
  options: ChecksumOptions = {}
): Promise<ChecksumsModelInterface> {
  const instance = createChecksums(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize checksums module: ${result.error}`);
  }
  
  return instance;
}

// Export default instance with standard options
export const checksums = createChecksums();

// Export individual functions for direct use
export const calculateXorSum = (factors: Factor[], primeRegistry?: PrimeRegistryForChecksums): number => {
  return checksums.calculateXorSum(factors, primeRegistry);
};

export const calculateChecksum = (
  factors: Factor[], 
  primeRegistry: PrimeRegistryForChecksums
): bigint => checksums.calculateChecksum(factors, primeRegistry);

export const extractFactorsAndChecksum = (
  value: bigint, 
  primeRegistry: PrimeRegistryForChecksums
): ChecksumExtractionResult => checksums.extractFactorsAndChecksum(value, primeRegistry);

export const attachChecksum = (
  raw: bigint, 
  factors: Factor[], 
  primeRegistry: PrimeRegistryForChecksums
): bigint => checksums.attachChecksum(raw, factors, primeRegistry);

export const calculateBatchChecksum = (
  values: bigint[], 
  primeRegistry: PrimeRegistryForChecksums
): bigint => checksums.calculateBatchChecksum(values, primeRegistry);

// Export type definitions
export * from './types';
