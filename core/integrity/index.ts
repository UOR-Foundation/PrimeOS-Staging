/**
 * Integrity Implementation
 * =======================
 * 
 * This module implements Axiom 2: Data carries self-verification via checksums.
 * Based on the UOR CPU implementation pattern with XOR-based checksums and 6th power attachment.
 * 
 * Production implementation requiring proper core module integration.
 * No fallbacks or simplifications - strict UOR compliance.
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
 * Prime Registry Adapter for clean interface
 */
class PrimeRegistryAdapter {
  constructor(private registry: any) {}
  
  async ensureInitialized(): Promise<void> {
    // Ensure the prime registry is initialized
    if (typeof this.registry.initialize === 'function' && 
        typeof this.registry.getState === 'function') {
      const state = this.registry.getState();
      if (state.lifecycle !== 'Ready') {
        const result = await this.registry.initialize();
        if (!result.success) {
          throw new IntegrityError(`Failed to initialize prime registry: ${result.error}`);
        }
      }
    }
  }
  
  getPrime(index: number): bigint {
    if (typeof this.registry.getPrime !== 'function') {
      throw new IntegrityError('Prime registry missing getPrime method');
    }
    return this.registry.getPrime(index);
  }
  
  getIndex(prime: bigint): number {
    if (typeof this.registry.getIndex !== 'function') {
      throw new IntegrityError('Prime registry missing getIndex method');
    }
    return this.registry.getIndex(prime);
  }
  
  factor(n: bigint): Factor[] {
    if (typeof this.registry.factor !== 'function') {
      throw new IntegrityError('Prime registry missing factor method');
    }
    return this.registry.factor(n);
  }
}

/**
 * Default options for integrity module
 */
const DEFAULT_OPTIONS: Required<Omit<IntegrityOptions, keyof import('../../os/model/types').ModelOptions | 'primeRegistry'>> = {
  checksumPower: 6,
  enableCache: true,
  cacheSize: 1000
};

/**
 * Production implementation of integrity system
 * Requires core/prime module - no fallbacks
 */
export class IntegrityImplementation extends BaseModel implements IntegrityInterface {
  private config: {
    checksumPower: number;
    enableCache: boolean;
    cacheSize: number;
    primeRegistry: any;
  };
  private cache: IntegrityCache;
  private primeAdapter: PrimeRegistryAdapter;
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
    
    // Require prime registry - no fallbacks in production
    if (!options.primeRegistry) {
      throw new IntegrityError('Prime registry is required for production integrity module');
    }
    
    this.config = {
      checksumPower: options.checksumPower ?? DEFAULT_OPTIONS.checksumPower,
      enableCache: options.enableCache ?? DEFAULT_OPTIONS.enableCache,
      cacheSize: options.cacheSize ?? DEFAULT_OPTIONS.cacheSize,
      primeRegistry: options.primeRegistry
    };
    
    this.cache = new IntegrityCache(this.config.cacheSize);
    this.primeAdapter = new PrimeRegistryAdapter(this.config.primeRegistry);
  }
  
  /**
   * Module-specific initialization logic
   */
  protected async onInitialize(): Promise<void> {
    // Initialize prime registry - fail if it doesn't work
    await this.primeAdapter.ensureInitialized();
    
    this.state.custom = {
      config: {
        checksumPower: this.config.checksumPower,
        enableCache: this.config.enableCache,
        cacheSize: this.config.cacheSize
      },
      cache: this.cache.getStats(),
      stats: { ...this.stats }
    };
    
    await this.logger.info('Production integrity module initialized with prime registry');
    
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
    
    await this.logger.debug('Processing integrity operation', { operation: request.operation });
    
    switch (request.operation) {
      case 'generateChecksum':
        if (!request.factors) throw new IntegrityError('Missing factors for checksum generation');
        return await this.generateChecksum(request.factors) as unknown as R;
        
      case 'attachChecksum':
        if (!request.value || !request.factors) throw new IntegrityError('Missing value or factors for checksum attachment');
        return await this.attachChecksum(request.value, request.factors) as unknown as R;
        
      case 'verifyIntegrity':
        if (!request.value) throw new IntegrityError('Missing value for integrity verification');
        return await this.verifyIntegrity(request.value) as unknown as R;
        
      case 'extractChecksum':
        if (!request.value) throw new IntegrityError('Missing value for checksum extraction');
        return await this.extractChecksum(request.value) as unknown as R;
        
      case 'calculateXorSum':
        if (!request.factors) throw new IntegrityError('Missing factors for XOR sum calculation');
        return await this.calculateXorSum(request.factors) as unknown as R;
        
      case 'verifyBatch':
        if (!request.values) throw new IntegrityError('Missing values for batch verification');
        return await this.verifyBatch(request.values) as unknown as R;
        
      default:
        throw new IntegrityError(`Unknown operation: ${(request as any).operation}`);
    }
  }
  
  /**
   * Generate a checksum from prime factors using XOR pattern
   */
  async generateChecksum(factors: Factor[], primeRegistry?: any): Promise<bigint> {
    // Ignore optional primeRegistry parameter - we always use our required registry
    
    // Validate factors
    for (const factor of factors) {
      if (factor.prime <= 0n || factor.exponent <= 0) {
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
    const xorSum = await this.calculateXorSum(factors);
    
    // Get checksum prime
    const checksumPrime = this.primeAdapter.getPrime(xorSum);
    
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
  async attachChecksum(value: bigint, factors: Factor[], primeRegistry?: any): Promise<bigint> {
    const checksum = await this.generateChecksum(factors);
    const power = BigInt(this.config.checksumPower);
    const result = value * (checksum ** power);
    
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
  async verifyIntegrity(value: bigint, primeRegistry?: any): Promise<VerificationResult> {
    this.stats.verificationsPerformed++;
    
    try {
      const extraction = await this.extractChecksum(value);
      
      if (!extraction.valid) {
        this.stats.integrityFailures++;
        return {
          valid: false,
          error: extraction.error || 'Checksum extraction failed'
        };
      }
      
      // Verify the checksum matches expected
      const expectedChecksum = await this.generateChecksum(extraction.coreFactors);
      
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
  async extractChecksum(value: bigint, primeRegistry?: any): Promise<ChecksumExtraction> {
    try {
      // Factor the value using production prime registry
      const allFactors = this.primeAdapter.factor(value);
      
      // Find checksum (factor with exponent >= checksumPower)
      let checksumPrime: bigint | undefined;
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
          checksumPrime: 0n,
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
        checksumPrime: 0n,
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
    let xor = 0;
    
    for (const factor of factors) {
      const primeIndex = this.primeAdapter.getIndex(factor.prime);
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
  async verifyBatch(values: bigint[], primeRegistry?: any): Promise<VerificationResult[]> {
    await this.logger.debug('Starting batch verification', { count: values.length });
    
    const results: VerificationResult[] = [];
    
    for (let i = 0; i < values.length; i++) {
      try {
        const result = await this.verifyIntegrity(values[i]);
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
      config: {
        checksumPower: this.config.checksumPower,
        enableCache: this.config.enableCache,
        cacheSize: this.config.cacheSize,
        primeRegistry: this.config.primeRegistry
      },
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
      config: {
        checksumPower: this.config.checksumPower,
        enableCache: this.config.enableCache,
        cacheSize: this.config.cacheSize
      },
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
 * Requires primeRegistry in production
 */
export function createIntegrity(options: IntegrityOptions = {}): IntegrityInterface {
  return new IntegrityImplementation(options);
}

/**
 * Create and initialize an integrity instance in a single step
 * Requires primeRegistry in production
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
