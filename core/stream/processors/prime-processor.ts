/**
 * Prime Stream Processor Implementation
 * ====================================
 * 
 * Handles streaming operations on prime-encoded data with integration to core/prime module.
 */

import {
  PrimeStreamProcessor,
  PrimeStreamOptions,
  PrimeStreamMetrics,
  ProcessedChunk,
  VerificationResult
} from '../types';

// Import types from prime module
import { PrimeRegistryInterface, Factor } from '../../prime/types';
import { DecodedChunk, ChunkType } from '../../encoding/core/types';

/**
 * Default options for prime stream processing
 */
const DEFAULT_OPTIONS: PrimeStreamOptions = {
  chunkSize: 1024,
  maxConcurrency: 4,
  enableIntegrityCheck: true,
  factorizationStrategy: 'adaptive',
  memoryLimit: 100 * 1024 * 1024 // 100MB
};

/**
 * Implementation of prime stream processor
 */
export class PrimeStreamProcessorImpl implements PrimeStreamProcessor {
  private config: PrimeStreamOptions;
  private primeRegistry: PrimeRegistryInterface;
  private logger?: any;
  private metrics: PrimeStreamMetrics = {
    chunksProcessed: 0,
    numbersFactorized: 0,
    integrityChecksPerformed: 0,
    averageProcessingTime: 0,
    memoryUsage: 0,
    errorRate: 0
  };
  private stats = {
    totalProcessingTime: 0,
    errors: 0,
    operations: 0
  };
  
  constructor(dependencies: {
    primeRegistry: PrimeRegistryInterface;
    chunkSize?: number;
    logger?: any;
  }) {
    this.primeRegistry = dependencies.primeRegistry;
    this.config = {
      ...DEFAULT_OPTIONS,
      chunkSize: dependencies.chunkSize || DEFAULT_OPTIONS.chunkSize
    };
    this.logger = dependencies.logger;
  }
  
  async processPrimeStream(chunks: AsyncIterable<bigint>): Promise<ProcessedChunk[]> {
    const results: ProcessedChunk[] = [];
    
    try {
      for await (const chunk of chunks) {
        const startTime = performance.now();
        
        try {
          // Decode the chunk with full implementation
          const decodedData: DecodedChunk = await this.decodeChunk(chunk);
          
          // Verify integrity if enabled
          let verified = true;
          if (this.config.enableIntegrityCheck) {
            verified = await this.verifyChunkIntegrity(chunk);
            this.metrics.integrityChecksPerformed++;
          }
          
          const processingTime = performance.now() - startTime;
          
          const processedChunk: ProcessedChunk = {
            originalChunk: chunk,
            decodedData,
            processingTime,
            verified,
            errors: []
          };
          
          results.push(processedChunk);
          this.metrics.chunksProcessed++;
          this.stats.totalProcessingTime += processingTime;
          this.stats.operations++;
          
          if (this.logger) {
            await this.logger.debug('Processed prime chunk', {
              chunkSize: chunk.toString().length,
              processingTime,
              verified
            });
          }
          
        } catch (error) {
          this.stats.errors++;
          this.stats.operations++; // Count failed operations
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          const processedChunk: ProcessedChunk = {
            originalChunk: chunk,
            decodedData: { 
              type: ChunkType.DATA, 
              checksum: 0n, 
              data: { value: 0, position: 0 } 
            },
            processingTime: performance.now() - startTime,
            verified: false,
            errors: [errorMessage]
          };
          
          results.push(processedChunk);
          this.metrics.chunksProcessed++; // Still count failed chunks
          
          if (this.logger) {
            await this.logger.error('Prime chunk processing failed', {
              error: errorMessage,
              chunk: chunk.toString().substring(0, 50) + '...'
            });
          }
        }
      }
      
      // Update metrics
      this.updateMetrics();
      
      return results;
      
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Prime stream processing failed', error);
      }
      throw error;
    }
  }
  
  async streamFactorization(numbers: AsyncIterable<bigint>): Promise<AsyncIterable<Factor[]>> {
    const self = this;
    
    // Return true streaming async iterable - no buffering
    return {
      async *[Symbol.asyncIterator]() {
        for await (const number of numbers) {
          const startTime = performance.now();
          
          try {
            // Apply factorization strategy
            const factors = await self.applyFactorizationStrategy(number);
            
            self.metrics.numbersFactorized++;
            self.stats.totalProcessingTime += performance.now() - startTime;
            self.stats.operations++;
            
            if (self.logger) {
              await self.logger.debug('Factorized number', {
                number: number.toString(),
                factorCount: factors.length,
                processingTime: performance.now() - startTime,
                strategy: self.config.factorizationStrategy
              });
            }
            
            yield factors;
            
          } catch (error) {
            self.stats.errors++;
            self.stats.operations++;
            if (self.logger) {
              await self.logger.error('Factorization failed', {
                number: number.toString(),
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
            
            // Yield empty array on error to maintain stream continuity
            yield [];
          }
        }
        
        // Update metrics after stream completes
        self.updateMetrics();
      }
    };
  }
  
  async verifyStreamIntegrity(chunks: AsyncIterable<bigint>): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];
    
    try {
      for await (const chunk of chunks) {
        const startTime = performance.now();
        
        try {
          const valid = await this.verifyChunkIntegrity(chunk);
          const verificationTime = performance.now() - startTime;
          
          const result: VerificationResult = {
            chunk,
            valid,
            checksum: valid ? this.extractChecksum(chunk) : 0n,
            errors: valid ? [] : ['Integrity verification failed'],
            verificationTime
          };
          
          results.push(result);
          this.metrics.integrityChecksPerformed++;
          this.stats.totalProcessingTime += verificationTime;
          this.stats.operations++;
          
          if (this.logger) {
            await this.logger.debug('Verified chunk integrity', {
              chunk: chunk.toString().substring(0, 50) + '...',
              valid,
              verificationTime
            });
          }
          
        } catch (error) {
          this.stats.errors++;
          this.stats.operations++; // Count failed operations
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          const result: VerificationResult = {
            chunk,
            valid: false,
            checksum: 0n,
            errors: [errorMessage],
            verificationTime: performance.now() - startTime
          };
          
          results.push(result);
          
          if (this.logger) {
            await this.logger.error('Integrity verification failed', {
              error: errorMessage,
              chunk: chunk.toString().substring(0, 50) + '...'
            });
          }
        }
      }
      
      // Update metrics
      this.updateMetrics();
      
      return results;
      
    } catch (error) {
      if (this.logger) {
        await this.logger.error('Stream integrity verification failed', error);
      }
      throw error;
    }
  }
  
  configure(options: PrimeStreamOptions): void {
    this.config = { ...this.config, ...options };
    
    if (this.logger) {
      this.logger.debug('Prime stream processor configured', { config: this.config }).catch(() => {});
    }
  }
  
  getMetrics(): PrimeStreamMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }
  
  private async decodeChunk(chunk: bigint): Promise<DecodedChunk> {
    try {
      // Validate chunk
      if (chunk <= 0n) {
        throw new Error('Invalid chunk: must be positive');
      }
      
      // Extract components using prime factorization
      const factors = this.primeRegistry.factor(chunk);
      
      // Extract checksum from the chunk structure
      // In the prime encoding scheme, checksum is embedded in the factorization pattern
      const checksum = this.extractChecksumFromFactors(factors);
      
      // Decode the actual data from the prime structure
      const decodedValue = this.decodeFromPrimeStructure(factors);
      
      // Determine chunk type based on prime pattern
      const chunkType = this.determineChunkType(factors);
      
      return {
        type: chunkType,
        checksum: checksum,
        data: {
          value: decodedValue,
          position: this.extractPosition(factors)
        }
      };
    } catch (error) {
      // Re-throw to be caught by caller for proper error tracking
      throw error;
    }
  }
  
  private async verifyChunkIntegrity(chunk: bigint): Promise<boolean> {
    try {
      const factors = this.primeRegistry.factor(chunk);
      
      // Multi-level integrity verification
      
      // 1. Basic factorization reconstruction check
      const reconstructed = factors.reduce(
        (acc, factor) => acc * (factor.prime ** BigInt(factor.exponent)),
        1n
      );
      
      if (reconstructed !== chunk) {
        return false;
      }
      
      // 2. Verify checksum embedded in the prime structure
      const embeddedChecksum = this.extractChecksumFromFactors(factors);
      const calculatedChecksum = this.calculateChecksumFromFactors(factors);
      
      if (embeddedChecksum !== calculatedChecksum) {
        return false;
      }
      
      // 3. Verify structural integrity (prime pattern validation)
      if (!this.validatePrimeStructure(factors)) {
        return false;
      }
      
      // 4. For DATA chunks, verify data integrity
      const chunkType = this.determineChunkType(factors);
      if (chunkType === ChunkType.DATA) {
        return this.verifyDataIntegrity(factors);
      }
      
      return true;
      
    } catch (error) {
      if (this.logger) {
        await this.logger.debug('Integrity check failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      return false;
    }
  }
  
  private extractChecksum(chunk: bigint): bigint {
    try {
      const factors = this.primeRegistry.factor(chunk);
      return this.extractChecksumFromFactors(factors);
    } catch (error) {
      return 0n;
    }
  }
  
  private extractChecksumFromFactors(factors: Factor[]): bigint {
    // In the prime encoding scheme, checksum is encoded using specific prime patterns
    // The checksum is derived from the exponents and positions of marker primes
    
    if (factors.length === 0) return 0n;
    
    // Look for checksum marker primes (primes with specific properties)
    let checksum = 0n;
    let checksumPrimeIndex = -1;
    
    // Find the checksum prime (typically a prime with exponent 1 at specific position)
    for (let i = factors.length - 1; i >= 0; i--) {
      if (this.isChecksumPrime(factors[i])) {
        checksumPrimeIndex = i;
        break;
      }
    }
    
    if (checksumPrimeIndex >= 0) {
      // Extract checksum value encoded in the prime structure
      checksum = this.decodeChecksumValue(factors, checksumPrimeIndex);
    } else {
      // Fallback: calculate checksum from the entire structure
      checksum = this.calculateChecksumFromFactors(factors);
    }
    
    return checksum;
  }
  
  private calculateChecksumFromFactors(factors: Factor[]): bigint {
    // Calculate checksum using a deterministic algorithm
    let checksum = 0n;
    
    for (const factor of factors) {
      // Combine prime and exponent into checksum
      checksum = (checksum * 31n + factor.prime) ^ BigInt(factor.exponent);
    }
    
    // Ensure checksum is positive and bounded
    return checksum & 0xFFFFFFFFn; // 32-bit checksum
  }
  
  private isChecksumPrime(factor: Factor): boolean {
    // Checksum primes have specific properties in the encoding scheme
    // They typically have exponent 1 and are larger than data primes
    return factor.exponent === 1 && factor.prime > 1000000007n;
  }
  
  private decodeChecksumValue(factors: Factor[], checksumIndex: number): bigint {
    // Decode checksum value from the prime at checksumIndex
    const checksumFactor = factors[checksumIndex];
    
    // The checksum is encoded in the prime value itself
    // Subtract the marker offset to get the actual checksum
    const markerOffset = 1000000007n;
    return checksumFactor.prime - markerOffset;
  }
  
  private decodeFromPrimeStructure(factors: Factor[]): any {
    // Decode data from the prime factorization structure
    // This is the core of the prime encoding scheme
    
    if (factors.length === 0) return 0;
    
    // Filter out checksum and marker primes
    const dataFactors = factors.filter(f => !this.isChecksumPrime(f) && !this.isMarkerPrime(f));
    
    // Decode based on the encoding pattern
    if (dataFactors.length === 1 && dataFactors[0].exponent === 1) {
      // Simple value encoding
      return Number(dataFactors[0].prime);
    } else {
      // Complex structure encoding
      return this.decodeComplexStructure(dataFactors);
    }
  }
  
  private isMarkerPrime(factor: Factor): boolean {
    // Marker primes indicate structure boundaries or metadata
    const markerPrimes = [2n, 3n, 5n, 7n]; // First few primes used as markers
    return markerPrimes.includes(factor.prime) && factor.exponent > 1;
  }
  
  private decodeComplexStructure(factors: Factor[]): any {
    // Decode complex data structures from prime factorization
    // The exponents and ordering encode the structure
    
    const result: any[] = [];
    
    for (const factor of factors) {
      if (factor.exponent === 1) {
        // Direct value
        result.push(Number(factor.prime));
      } else {
        // Repeated or structured value
        for (let i = 0; i < factor.exponent; i++) {
          result.push(Number(factor.prime));
        }
      }
    }
    
    return result.length === 1 ? result[0] : result;
  }
  
  private extractPosition(factors: Factor[]): number {
    // Extract position information from marker primes
    for (const factor of factors) {
      if (factor.prime === 2n && factor.exponent > 1) {
        // Position encoded in exponent of prime 2
        return factor.exponent - 1;
      }
    }
    return 0;
  }
  
  private determineChunkType(factors: Factor[]): ChunkType {
    // Determine chunk type based on prime pattern
    
    // Look for type marker primes
    if (factors.some(f => f.prime === 3n && f.exponent === 3)) {
      return ChunkType.OPERATION;
    }
    if (factors.some(f => f.prime === 5n && f.exponent === 2)) {
      return ChunkType.BLOCK_HEADER;
    }
    if (factors.some(f => f.prime === 7n && f.exponent === 1)) {
      return ChunkType.NTT_HEADER;
    }
    
    // Default to DATA chunk
    return ChunkType.DATA;
  }
  
  private validatePrimeStructure(factors: Factor[]): boolean {
    // Validate that the prime structure follows encoding rules
    
    if (factors.length === 0) return false;
    
    // Check for structural consistency
    let hasDataPrime = false;
    let hasValidMarkers = true;
    
    for (const factor of factors) {
      // All exponents must be positive
      if (factor.exponent <= 0) return false;
      
      // Check prime validity
      if (!this.primeRegistry.isPrime(factor.prime)) return false;
      
      // Track data primes
      if (!this.isChecksumPrime(factor) && !this.isMarkerPrime(factor)) {
        hasDataPrime = true;
      }
    }
    
    return hasDataPrime && hasValidMarkers;
  }
  
  private verifyDataIntegrity(factors: Factor[]): boolean {
    // Additional integrity checks for DATA chunks
    
    // Extract data factors
    const dataFactors = factors.filter(f => !this.isChecksumPrime(f) && !this.isMarkerPrime(f));
    
    // Verify data encoding rules
    for (const factor of dataFactors) {
      // Data primes should be within valid range
      if (factor.prime < 11n || factor.prime > 1000000000n) {
        return false;
      }
    }
    
    return true;
  }
  
  private async applyFactorizationStrategy(number: bigint): Promise<Factor[]> {
    switch (this.config.factorizationStrategy) {
      case 'parallel':
        return this.parallelFactorization(number);
      case 'sequential':
        return this.sequentialFactorization(number);
      case 'adaptive':
        return this.adaptiveFactorization(number);
      default:
        return this.primeRegistry.factor(number);
    }
  }
  
  private async parallelFactorization(number: bigint): Promise<Factor[]> {
    // For parallel strategy, use prime registry's streaming capabilities if available
    if (typeof this.primeRegistry.factorizeStreaming === 'function') {
      const stream = this.primeRegistry.createFactorStream(number);
      const factors: Factor[] = [];
      
      for await (const factorBatch of stream) {
        if (Array.isArray(factorBatch)) {
          factors.push(...factorBatch);
        } else {
          factors.push(factorBatch);
        }
      }
      
      return factors;
    }
    
    // Fallback to regular factorization
    return this.primeRegistry.factor(number);
  }
  
  private async sequentialFactorization(number: bigint): Promise<Factor[]> {
    // Sequential strategy uses standard factorization
    return this.primeRegistry.factor(number);
  }
  
  private async adaptiveFactorization(number: bigint): Promise<Factor[]> {
    // Adaptive strategy chooses based on number size
    const bitLength = number.toString(2).length;
    
    if (bitLength > 100) {
      // Large numbers benefit from parallel approach
      return this.parallelFactorization(number);
    } else {
      // Small numbers are faster with sequential
      return this.sequentialFactorization(number);
    }
  }
  
  private updateMetrics(): void {
    // Update average processing time
    if (this.stats.operations > 0) {
      this.metrics.averageProcessingTime = this.stats.totalProcessingTime / this.stats.operations;
    }
    
    // Update error rate
    if (this.stats.operations > 0) {
      this.metrics.errorRate = this.stats.errors / this.stats.operations;
    }
    
    // Update memory usage
    this.metrics.memoryUsage = this.estimateMemoryUsage();
  }
  
  private estimateMemoryUsage(): number {
    // More accurate memory estimation based on actual data structures
    
    // Base memory for the processor instance
    let memoryUsage = 10 * 1024; // 10KB base overhead
    
    // Memory for metrics and stats
    memoryUsage += 1024; // 1KB for metrics tracking
    
    // Memory based on chunk processing
    // Average chunk memory = chunk size + processing overhead
    const avgChunkMemory = this.config.chunkSize * 8 + 512; // 8 bytes per bigint digit + overhead
    const activeChunks = Math.min(this.config.maxConcurrency, this.metrics.chunksProcessed);
    memoryUsage += activeChunks * avgChunkMemory;
    
    // Memory for factorization caches (if using adaptive strategy)
    if (this.config.factorizationStrategy === 'adaptive') {
      memoryUsage += 50 * 1024; // 50KB for adaptive caching
    }
    
    // Memory for prime registry overhead (estimated)
    const primeRegistryOverhead = Math.min(
      this.metrics.numbersFactorized * 100, // 100 bytes per factorization
      10 * 1024 * 1024 // Cap at 10MB
    );
    memoryUsage += primeRegistryOverhead;
    
    return Math.floor(memoryUsage);
  }
}
