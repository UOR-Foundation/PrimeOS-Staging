/**
 * Checksums Module Mock Implementation
 * 
 * This file provides a mock implementation of the checksums module interface
 * that can be used in tests.
 */

import { ModelLifecycleState } from './os-model-mock';
import { createLogging } from './os-logging-mock';
import {
  ChecksumOptions,
  ChecksumState,
  ChecksumsModelInterface,
  ChecksumProcessInput,
  ChecksumExtractionResult,
  PrimeRegistryForChecksums,
  XorHashState
} from '../types';
import { Factor } from '../../types';

// Default checksum constants
export const CHECKSUM_CONSTANTS = {
  DEFAULT_CHECKSUM_POWER: 6,
  DEFAULT_CACHE_SIZE: 1000
};

/**
 * Create a mock checksums implementation
 */
export function createMockChecksums(options: ChecksumOptions = {}): ChecksumsModelInterface {
  // Simple cache storage
  const cache = new Map<string, bigint>();
  
  // Default options
  const checksumOptions: ChecksumOptions = {
    checksumPower: options.checksumPower || CHECKSUM_CONSTANTS.DEFAULT_CHECKSUM_POWER,
    enableCache: options.enableCache !== undefined ? options.enableCache : true,
    verifyOnOperation: options.verifyOnOperation !== undefined ? options.verifyOnOperation : false,
    debug: options.debug !== undefined ? options.debug : false,
    name: options.name || 'mock-checksums',
    version: options.version || '1.0.0'
  };
  
  // Track module state
  const state: ChecksumState = {
    lifecycle: ModelLifecycleState.Uninitialized,
    lastStateChangeTime: Date.now(),
    uptime: 0,
    operationCount: {
      total: 0,
      success: 0,
      failed: 0
    },
    config: checksumOptions,
    cache: {
      size: 0,
      hits: 0,
      misses: 0
    }
  };
  
  // Return mock implementation
  return {
    // Checksums interface methods
    calculateXorSum(factors: Factor[], primeRegistry?: PrimeRegistryForChecksums): number {
      // Simple mock implementation - XOR the exponents
      return factors.reduce((sum, factor) => sum ^ factor.exponent, 0);
    },
    
    calculateChecksum(factors: Factor[], primeRegistry: PrimeRegistryForChecksums): bigint {
      // Simple mock implementation - use the first prime or a default
      if (factors.length === 0) {
        return primeRegistry.getPrime(0);
      }
      
      // Create a cache key
      const cacheKey = factors.map(f => `${f.prime}^${f.exponent}`).join(',');
      
      // Check cache
      if (checksumOptions.enableCache && cache.has(cacheKey)) {
        state.cache!.hits++;
        return cache.get(cacheKey)!;
      }
      
      state.cache!.misses++;
      
      // Calculate a simple XOR sum
      const xorSum = this.calculateXorSum(factors, primeRegistry);
      
      // Get the prime at that index
      const result = primeRegistry.getPrime(xorSum);
      
      // Cache the result
      if (checksumOptions.enableCache) {
        cache.set(cacheKey, result);
        state.cache!.size = cache.size;
      }
      
      return result;
    },
    
    attachChecksum(value: bigint, factors: Factor[], primeRegistry: PrimeRegistryForChecksums): bigint {
      // Calculate checksum
      const checksumPrime = this.calculateChecksum(factors, primeRegistry);
      
      // Simple mock implementation - multiply by checksum^power
      const power = BigInt(checksumOptions.checksumPower || CHECKSUM_CONSTANTS.DEFAULT_CHECKSUM_POWER);
      const checksum = checksumPrime ** power;
      
      return value * checksum;
    },
    
    extractFactorsAndChecksum(value: bigint, primeRegistry: PrimeRegistryForChecksums): ChecksumExtractionResult {
      // Mock implementation - assume the value is valid
      const checksumPower = checksumOptions.checksumPower || CHECKSUM_CONSTANTS.DEFAULT_CHECKSUM_POWER;
      
      // For mock purposes, just return a simple result
      return {
        coreFactors: [{ prime: BigInt(2), exponent: 1 }],
        checksumPrime: BigInt(3),
        checksumPower,
        valid: true
      };
    },
    
    calculateBatchChecksum(values: bigint[], primeRegistry: PrimeRegistryForChecksums): bigint {
      // Simple mock implementation - use the first prime
      return primeRegistry.getPrime(0);
    },
    
    getChecksumPower(): number {
      return checksumOptions.checksumPower || CHECKSUM_CONSTANTS.DEFAULT_CHECKSUM_POWER;
    },
    
    createXorHashState(): XorHashState {
      return { xorSum: 0, count: 0 };
    },
    
    updateXorHash(state: XorHashState, value: bigint, primeRegistry: PrimeRegistryForChecksums): XorHashState {
      // Simple mock implementation - increment count
      return {
        xorSum: state.xorSum + 1,
        count: state.count + 1
      };
    },
    
    getChecksumFromXorHash(state: XorHashState, primeRegistry: PrimeRegistryForChecksums): bigint {
      return primeRegistry.getPrime(state.xorSum);
    },
    
    clearCache(): void {
      cache.clear();
      if (state.cache) {
        state.cache.size = 0;
        state.cache.hits = 0;
        state.cache.misses = 0;
      }
    },
    
    // Model interface methods
    async initialize() {
      state.lifecycle = ModelLifecycleState.Ready;
      state.lastStateChangeTime = Date.now();
      
      return {
        success: true,
        timestamp: Date.now(),
        source: checksumOptions.name || 'mock-checksums'
      };
    },
    
    async process<T = any, R = any>(input: T): Promise<R> {
      state.operationCount.total += 1;
      
      try {
        let result: any;
        const checksumInput = input as unknown as ChecksumProcessInput;
        
        switch (checksumInput.operation) {
          case 'calculateXorSum':
            result = this.calculateXorSum(
              checksumInput.params[0] as Factor[],
              checksumInput.params[1] as PrimeRegistryForChecksums
            );
            break;
          case 'calculateChecksum':
            result = this.calculateChecksum(
              checksumInput.params[0] as Factor[],
              checksumInput.params[1] as PrimeRegistryForChecksums
            );
            break;
          case 'attachChecksum':
            result = this.attachChecksum(
              checksumInput.params[0] as bigint,
              checksumInput.params[1] as Factor[],
              checksumInput.params[2] as PrimeRegistryForChecksums
            );
            break;
          case 'extractFactorsAndChecksum':
            result = this.extractFactorsAndChecksum(
              checksumInput.params[0] as bigint,
              checksumInput.params[1] as PrimeRegistryForChecksums
            );
            break;
          case 'calculateBatchChecksum':
            result = this.calculateBatchChecksum(
              checksumInput.params[0] as bigint[],
              checksumInput.params[1] as PrimeRegistryForChecksums
            );
            break;
          case 'createXorHashState':
            result = this.createXorHashState();
            break;
          case 'updateXorHash':
            result = this.updateXorHash(
              checksumInput.params[0] as XorHashState,
              checksumInput.params[1] as bigint,
              checksumInput.params[2] as PrimeRegistryForChecksums
            );
            break;
          case 'getChecksumFromXorHash':
            result = this.getChecksumFromXorHash(
              checksumInput.params[0] as XorHashState,
              checksumInput.params[1] as PrimeRegistryForChecksums
            );
            break;
          case 'clearCache':
            this.clearCache();
            result = undefined;
            break;
          default:
            throw new Error(`Unknown operation: ${checksumInput.operation}`);
        }
        
        state.operationCount.success += 1;
        
        return result as R;
      } catch (error) {
        state.operationCount.failed += 1;
        throw error;
      }
    },
    
    getState() {
      return { ...state };
    },
    
    async reset() {
      this.clearCache();
      
      state.operationCount = {
        total: 0,
        success: 0,
        failed: 0
      };
      
      state.lastStateChangeTime = Date.now();
      
      return {
        success: true,
        timestamp: Date.now(),
        source: checksumOptions.name || 'mock-checksums'
      };
    },
    
    async terminate() {
      state.lifecycle = ModelLifecycleState.Terminated;
      state.lastStateChangeTime = Date.now();
      
      return {
        success: true,
        timestamp: Date.now(),
        source: checksumOptions.name || 'mock-checksums'
      };
    },
    
    createResult(success, data, error) {
      return {
        success,
        data,
        error,
        timestamp: Date.now(),
        source: checksumOptions.name || 'mock-checksums'
      };
    }
  };
}
