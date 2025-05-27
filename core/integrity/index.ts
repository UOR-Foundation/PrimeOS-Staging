/**
 * Integrity Implementation
 * =======================
 * 
 * This module implements Axiom 2: Data carries self-verification via checksums.
 * Based on the UOR CPU implementation pattern with XOR-based checksums and 6th power attachment.
 * 
 * This implementation uses regular numbers instead of JavaScript bigint.
 */

import {
  BaseModel,
  ModelResult,
  ModelLifecycleState
} from '../../os/model';

import {
  IntegrityOptions,
  IntegrityInterface,
  IntegrityState,
  Factor,
  VerificationResult,
  ChecksumExtraction,
  IntegrityProcessInput,
  IntegrityError,
  ChecksumMismatchError,
  InvalidFactorError,
  MissingChecksumError
} from './types';

/**
 * Simple LRU cache for checksum calculations
 */
class IntegrityCache {
  private cache = new Map<string, any>();
  private keyOrder: string[] = [];
  private hits = 0;
  private misses = 0;
  
  constructor(private capacity: number) {}
  
  get(key: string): any {
    if (!this.cache.has(key)) {
      this.misses++;
      return undefined;
    }
    
    // Move to end (most recently used)
    this.keyOrder = this.keyOrder.filter(k => k !== key);
    this.keyOrder.push(key);
    this.hits++;
    return this.cache.get(key);
  }
  
  set(key: string, value: any): void {
    if (this.cache.has(key)) {
      this.keyOrder = this.keyOrder.filter(k => k !== key);
    } else if (this.keyOrder.length === this.capacity) {
      const lru = this.keyOrder.shift();
      if (lru) this.cache.delete(lru);
    }
    
    this.cache.set(key, value);
    this.keyOrder.push(key);
  }
  
  clear(): void {
    this.cache.clear();
    this.keyOrder = [];
    this.hits = 0;
    this.misses = 0;
  }
  
  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses
    };
  }
}

/**
 * Mock prime registry for standalone operation
 * Will be replaced with actual prime registry integration
 */
class MockPrimeRegistry {
  private primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  
  getPrime(index: number): number {
    if (index < this.primes.length) {
      return this.primes[index];
    }
    // Simple approximation for larger indices
    return index * 2 + 1;
  }
  
  getIndex(prime: number): number {
    const index = this.primes.indexOf(prime);
    if (index >= 0) return index;
    // Simple approximation for primes not in table
    return Math.floor((prime - 1) / 2);
  }
  
  factor(n: number): Factor[] {
    const factors: Factor[] = [];
    let remaining = n;
    
    for (const prime of this.primes) {
      let exponent = 0;
      while (remaining % prime === 0) {
        exponent++;
        remaining = remaining / prime;
      }
      if (exponent > 0) {
        factors.push({ prime, exponent });
      }
      if (remaining === 1) break;
    }
    
    // Handle remaining prime factor
    if (remaining > 1) {
      factors.push({ prime: remaining, exponent: 1 });
    }
    
    return factors;
  }
}

/**
 * Default options for integrity module
 */
const DEFAULT_OPTIONS: Required<Omit<IntegrityOptions, keyof import('../../os/model/types').ModelOptions>> = {
  checksumPower: 6,
  enableCache: true,
  cacheSize: 1000,
  primeRegistry: undefined
};

/**
 * Main implementation of integrity system
 */
export class IntegrityImplementation extends BaseModel implements IntegrityInterface {
  private config: Required<Omit<IntegrityOptions, keyof import('../../os/model/types').ModelOptions>>;
  private cache: IntegrityCache;
  private mockRegistry: MockPrimeRegistry;
  private stats = {
    checksumsGenerated: 0,
    verificationsPerformed: 0,
    integrityFailures: 0
  };
  
  /**
   * Create a new integrity instance
   */
  constructor(options: IntegrityOptions = {}) {
    super({
      debug: false,
      name: 'integrity',
      version: '1.0.0',
      ...options
    });
    
    this.config = {
      checksumPower: options.checksumPower ?? DEFAULT_OPTIONS.checksumPower,
      enableCache: options.enableCache ?? DEFAULT_OPTIONS.enableCache,
      cacheSize: options.cacheSize ?? DEFAULT_OPTIONS.cacheSize,
      primeRegistry: options.primeRegistry ?? DEFAULT_OPTIONS.primeRegistry
    };
    
    this.cache = new IntegrityCache(this.config.cacheSize);
    this.mockRegistry = new MockPrimeRegistry();
  }
  
  /**
   * Module-specific initialization logic
   */
  protected async onInitialize(): Promise<void> {
    this.state.custom = {
      config: this.config,
      cache: this.cache.getStats(),
      stats: { ...this.stats }
    };
    
    await this.logger.debug('Integrity module initialized', {
      checksumPower: this.config.checksumPower,
      cacheEnabled: this.config.enableCache,
      cacheSize: this.config.cacheSize
    });
  }
  
  /**
   * Process input data with integrity operations
   */
  protected async onProcess<T = IntegrityProcessInput, R = unknown>(input: T): Promise<R> {
    if (!input || typeof input !== 'object') {
      throw new IntegrityError('Invalid input: expected IntegrityProcessInput object');
    }
    
    const request = input as unknown as IntegrityProcessInput;
    const registry = request.primeRegistry || this.mockRegistry;
    
    await this.logger.debug('Processing integrity operation', { operation: request.operation });
    
    switch (request.operation) {
      case 'generateChecksum':
        if (!request.factors) throw new IntegrityError('Missing factors for checksum generation');
        return await this.generateChecksum(request.factors, registry) as unknown as R;
        
      case 'attachChecksum':
        if (!request.value || !request.factors) throw new IntegrityError('Missing value or factors for checksum attachment');
        return await this.attachChecksum(request.value, request.factors, registry) as unknown as R;
        
      case 'verifyIntegrity':
        if (!request.value) throw new IntegrityError('Missing value for integrity verification');
        return await this.verifyIntegrity(request.value, registry) as unknown as R;
        
      case 'extractChecksum':
        if (!request.value) throw new IntegrityError('Missing value for checksum extraction');
        return await this.extractChecksum(request.value, registry) as unknown as R;
        
      case 'calculateXorSum':
        if (!request.factors) throw new IntegrityError('Missing factors for XOR sum calculation');
        return await this.calculateXorSum(request.factors, registry) as unknown as R;
        
      case 'verifyBatch':
        if (!request.values) throw new IntegrityError('Missing values for batch verification');
        return await this.verifyBatch(request.values, registry) as unknown as R;
        
      default:
        throw new IntegrityError(`Unknown operation: ${(request as any).operation}`);
    }
  }
  
  /**
   * Generate a checksum from prime factors using XOR pattern
   */
  async generateChecksum(factors: Factor[], primeRegistry?: any): Promise<number> {
    const registry = primeRegistry || this.mockRegistry;
    
    // Validate factors
    for (const factor of factors) {
      if (factor.prime <= 0 || factor.exponent <= 0) {
        throw new InvalidFactorError(factor);
      }
    }
    
    // Check cache first
    const cacheKey = factors.map(f => `${f.prime}^${f.exponent}`).join('*');
    if (this.config.enableCache) {
      const cached = this.cache.get(cacheKey);
      if (cached !== undefined) {
        await this.logger.debug('Cache hit for checksum generation', { cacheKey });
        return cached;
      }
    }
    
    // Calculate XOR sum
    const xorSum = await this.calculateXorSum(factors, registry);
    
    // Get checksum prime
    const checksumPrime = registry.getPrime(xorSum);
    
    // Cache result
    if (this.config.enableCache) {
      this.cache.set(cacheKey, checksumPrime);
    }
    
    this.stats.checksumsGenerated++;
    await this.logger.debug('Generated checksum', { 
      factors: factors.length, 
      xorSum, 
      checksumPrime: checksumPrime.toString() 
    });
    
    return checksumPrime;
  }
  
  /**
   * Attach a checksum to a value as the 6th power of checksum prime
   */
  async attachChecksum(value: number, factors: Factor[], primeRegistry?: any): Promise<number> {
    const checksum = await this.generateChecksum(factors, primeRegistry);
    const power = this.config.checksumPower;
    const result = value * Math.pow(checksum, power);
    
    await this.logger.debug('Attached checksum', {
      originalValue: value.toString(),
      checksum: checksum.toString(),
      power: this.config.checksumPower,
      result: result.toString()
    });
    
    return result;
  }
  
  /**
   * Verify the integrity of a checksummed value
   */
  async verifyIntegrity(value: number, primeRegistry?: any): Promise<VerificationResult> {
    this.stats.verificationsPerformed++;
    
    try {
      const extraction = await this.extractChecksum(value, primeRegistry);
      
      if (!extraction.valid) {
        this.stats.integrityFailures++;
        return {
          valid: false,
          error: extraction.error || 'Checksum extraction failed'
        };
      }
      
      // Verify the checksum matches expected
      const expectedChecksum = await this.generateChecksum(extraction.coreFactors, primeRegistry);
      
      if (extraction.checksumPrime !== expectedChecksum) {
        this.stats.integrityFailures++;
        await this.logger.warn('Checksum mismatch detected', {
          expected: expectedChecksum.toString(),
          actual: extraction.checksumPrime.toString()
        });
        return {
          valid: false,
          coreFactors: extraction.coreFactors,
          checksum: extraction.checksumPrime,
          error: `Checksum mismatch: expected ${expectedChecksum}, got ${extraction.checksumPrime}`
        };
      }
      
      await this.logger.debug('Integrity verification successful', {
        coreFactors: extraction.coreFactors.length,
        checksum: extraction.checksumPrime.toString()
      });
      
      return {
        valid: true,
        coreFactors: extraction.coreFactors,
        checksum: extraction.checksumPrime
      };
      
    } catch (error) {
      this.stats.integrityFailures++;
      await this.logger.error('Integrity verification failed', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown verification error'
      };
    }
  }
  
  /**
   * Extract checksum and core factors from a checksummed value
   */
  async extractChecksum(value: number, primeRegistry?: any): Promise<ChecksumExtraction> {
    const registry = primeRegistry || this.mockRegistry;
    
    try {
      // Factor the value
      const allFactors = registry.factor(value);
      
      // Find checksum (factor with exponent >= checksumPower)
      let checksumPrime: number | undefined;
      let checksumExponent = 0;
      const coreFactors: Factor[] = [];
      
      for (const factor of allFactors) {
        if (factor.exponent >= this.config.checksumPower && !checksumPrime) {
          // This is likely the checksum
          checksumPrime = factor.prime;
          checksumExponent = factor.exponent;
          
          // If exponent > checksumPower, add remainder to core factors
          const remainingExponent = factor.exponent - this.config.checksumPower;
          if (remainingExponent > 0) {
            coreFactors.push({ prime: factor.prime, exponent: remainingExponent });
          }
        } else {
          coreFactors.push(factor);
        }
      }
      
      if (!checksumPrime) {
        return {
          coreFactors: [],
          checksumPrime: 0,
          checksumExponent: 0,
          valid: false,
          error: 'No checksum found (no factor with exponent >= checksumPower)'
        };
      }
      
      await this.logger.debug('Extracted checksum', {
        checksumPrime: checksumPrime.toString(),
        checksumExponent,
        coreFactors: coreFactors.length
      });
      
      return {
        coreFactors,
        checksumPrime,
        checksumExponent,
        valid: true
      };
      
    } catch (error) {
      await this.logger.error('Checksum extraction failed', error);
      return {
        coreFactors: [],
        checksumPrime: 0,
        checksumExponent: 0,
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown extraction error'
      };
    }
  }
  
  /**
   * Calculate XOR sum for factors (used in checksum generation)
   */
  async calculateXorSum(factors: Factor[], primeRegistry?: any): Promise<number> {
    const registry = primeRegistry || this.mockRegistry;
    let xor = 0;
    
    for (const factor of factors) {
      const primeIndex = registry.getIndex(factor.prime);
      xor ^= primeIndex * factor.exponent;
    }
    
    await this.logger.debug('Calculated XOR sum', { 
      factors: factors.length, 
      xorSum: xor 
    });
    
    return xor;
  }
  
  /**
   * Verify multiple values in batch
   */
  async verifyBatch(values: number[], primeRegistry?: any): Promise<VerificationResult[]> {
    await this.logger.debug('Starting batch verification', { count: values.length });
    
    const results: VerificationResult[] = [];
    
    for (let i = 0; i < values.length; i++) {
      try {
        const result = await this.verifyIntegrity(values[i], primeRegistry);
        results.push(result);
      } catch (error) {
        results.push({
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown batch verification error'
        });
      }
    }
    
    const validCount = results.filter(r => r.valid).length;
    await this.logger.debug('Batch verification complete', {
      total: values.length,
      valid: validCount,
      invalid: values.length - validCount
    });
    
    return results;
  }
  
  /**
   * Access the module logger
   */
  getLogger() {
    return this.logger;
  }
  
  /**
   * Get current state including statistics
   */
  getState(): IntegrityState {
    const baseState = super.getState();
    
    return {
      ...baseState,
      config: this.config,
      cache: this.cache.getStats(),
      stats: { ...this.stats }
    } as IntegrityState;
  }
  
  /**
   * Reset module state and clear caches
   */
  protected async onReset(): Promise<void> {
    this.cache.clear();
    this.stats = {
      checksumsGenerated: 0,
      verificationsPerformed: 0,
      integrityFailures: 0
    };
    
    this.state.custom = {
      config: this.config,
      cache: this.cache.getStats(),
      stats: { ...this.stats }
    };
    
    await this.logger.debug('Integrity module reset');
  }
  
  /**
   * Clean up resources when module is terminated
   */
  protected async onTerminate(): Promise<void> {
    this.cache.clear();
    await this.logger.debug('Integrity module terminated');
  }
}

/**
 * Create an integrity instance with the specified options
 */
export function createIntegrity(options: IntegrityOptions = {}): IntegrityInterface {
  return new IntegrityImplementation(options);
}

/**
 * Create and initialize an integrity instance in a single step
 */
export async function createAndInitializeIntegrity(options: IntegrityOptions = {}): Promise<IntegrityInterface> {
  const instance = createIntegrity(options);
  const result = await instance.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize integrity: ${result.error}`);
  }
  
  return instance;
}

// Export types and errors
export * from './types';
