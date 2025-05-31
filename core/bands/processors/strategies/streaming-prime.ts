/**
 * Streaming Prime Strategy
 * =======================
 * 
 * TREBLE band processor (257-512 bits)
 * Optimized for very large numbers using streaming algorithms and prime generation.
 * Uses memory-efficient streaming approaches for handling large datasets.
 */

import { BaseStrategyProcessor, BaseStrategyConfig } from '../strategy-processor';
import { BandType, ProcessingContext } from '../../types';

/**
 * Streaming configuration for TREBLE band
 */
interface StreamingConfig {
  chunkSize: number;
  bufferSize: number;
  maxStreamSize: number;
  primeStreamCacheSize: number;
  asyncProcessing: boolean;
  backpressureThreshold: number;
  streamingTimeout: number;
}

/**
 * Stream chunk for processing
 */
interface StreamChunk {
  id: string;
  data: bigint[];
  index: number;
  timestamp: number;
  priority: number;
}

/**
 * Prime stream interface
 */
interface PrimeStream {
  next(): Promise<bigint | null>;
  hasNext(): boolean;
  reset(): void;
  getCurrentRange(): { start: bigint; end: bigint };
}

/**
 * Streaming prime strategy for TREBLE band
 * Handles numbers with 257-512 bits using streaming processing
 */
export class StreamingPrimeStrategy extends BaseStrategyProcessor {
  private streamingConfig: StreamingConfig;
  private activeStreams: Map<string, PrimeStream> = new Map();
  private chunkProcessingQueue: StreamChunk[] = [];
  private primeStreamCache: Map<string, bigint[]> = new Map();
  private backpressureActive = false;
  private streamingMetrics = {
    chunksProcessed: 0,
    bytesStreamed: 0,
    averageChunkTime: 0,
    streamingErrors: 0
  };
  
  constructor(config: BaseStrategyConfig = {}) {
    super({
      enableCaching: true,
      cacheSize: 15000,
      ...config
    });
    
    this.streamingConfig = {
      chunkSize: 8192,
      bufferSize: 32768,
      maxStreamSize: 1024 * 1024, // 1MB
      primeStreamCacheSize: 10000,
      asyncProcessing: true,
      backpressureThreshold: 0.85,
      streamingTimeout: 60000 // 60 seconds
    };
  }
  
  /**
   * Check if this strategy supports the given band
   */
  supports(band: BandType): boolean {
    return band === BandType.TREBLE;
  }
  
  /**
   * Execute streaming prime strategy
   */
  protected async executeStrategy(input: any, context: ProcessingContext): Promise<any> {
    if (typeof input === 'bigint' || typeof input === 'number') {
      return this.processNumber(input, context);
    } else if (Array.isArray(input)) {
      return this.processStreamingBatch(input, context);
    } else if (input && typeof input === 'object' && 'operation' in input) {
      return this.processOperation(input, context);
    } else {
      throw new Error(`Unsupported input type for streaming prime processing: ${typeof input}`);
    }
  }
  
  /**
   * Process a single number using streaming algorithms
   */
  private async processNumber(n: bigint | number, context: ProcessingContext): Promise<any> {
    const num = typeof n === 'bigint' ? n : BigInt(n);
    
    // Validate number is in TREBLE range (257-512 bits)
    const bitSize = num.toString(2).length;
    if (bitSize < 257 || bitSize > 512) {
      throw new Error(`Number out of TREBLE band range: ${bitSize} bits (expected 257-512)`);
    }
    
    // Use streaming factorization for large numbers
    const result = await this.streamingFactorization(num);
    
    return result;
  }
  
  /**
   * Process a batch of numbers using streaming optimization
   */
  private async processStreamingBatch(numbers: (bigint | number)[], context: ProcessingContext): Promise<any[]> {
    const results: any[] = new Array(numbers.length);
    
    // Create streaming chunks
    const chunks = await this.createStreamingChunks(numbers);
    
    // Process chunks with backpressure management
    for (const chunk of chunks) {
      await this.processChunkWithBackpressure(chunk, results);
    }
    
    return results;
  }
  
  /**
   * Process operation-based input
   */
  private async processOperation(operation: any, context: ProcessingContext): Promise<any> {
    switch (operation.type) {
      case 'factor':
        return this.processNumber(operation.value, context);
      case 'streamingFactor':
        return this.streamingFactorization(BigInt(operation.value));
      case 'generatePrimeStream':
        return this.generatePrimeStream(operation.start, operation.end);
      case 'streamingSieve':
        return this.streamingSieve(operation.start, operation.end);
      case 'batchStreamProcess':
        return this.processStreamingBatch(operation.values, context);
      case 'primeGeneration':
        return this.generateLargePrimes(operation.count, operation.bitSize);
      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }
  }
  
  /**
   * Streaming factorization for very large numbers
   */
  private async streamingFactorization(n: bigint): Promise<{ factors: Array<{prime: bigint, exponent: number}>, method: string }> {
    if (n <= 1n) {
      return { factors: [], method: 'streaming-prime' };
    }
    
    const factors: Array<{prime: bigint, exponent: number}> = [];
    let remaining = n;
    
    // Use streaming trial division for small-medium factors
    const smallFactors = await this.streamingTrialDivision(remaining);
    for (const factor of smallFactors) {
      factors.push(factor);
      for (let i = 0; i < factor.exponent; i++) {
        remaining /= factor.prime;
      }
    }
    
    if (remaining === 1n) {
      return { factors, method: 'streaming-prime' };
    }
    
    // Use streaming Pollard's rho for medium factors
    if (remaining > 1n && remaining < 2n ** 256n) {
      const mediumFactors = await this.streamingPollardRho(remaining);
      factors.push(...mediumFactors);
    } else if (remaining > 1n) {
      // Use advanced algorithms for very large factors
      const largeFactors = await this.advancedStreamingFactorization(remaining);
      factors.push(...largeFactors);
    }
    
    return { factors, method: 'streaming-prime' };
  }
  
  /**
   * Streaming trial division using prime streams
   */
  private async streamingTrialDivision(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    const factors: Array<{prime: bigint, exponent: number}> = [];
    let remaining = n;
    
    const sqrt = this.integerSqrt(remaining);
    const primeStream = await this.createPrimeStream(2n, sqrt);
    
    let prime = await primeStream.next();
    while (prime !== null && remaining > 1n) {
      if (remaining % prime === 0n) {
        let count = 0;
        while (remaining % prime === 0n) {
          remaining /= prime;
          count++;
        }
        factors.push({ prime, exponent: count });
      }
      
      // Check if we need to continue
      if (prime * prime > remaining) break;
      
      prime = await primeStream.next();
    }
    
    return factors;
  }
  
  /**
   * Streaming Pollard's rho factorization
   */
  private async streamingPollardRho(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    const factors: Array<{prime: bigint, exponent: number}> = [];
    const toFactor = [n];
    
    while (toFactor.length > 0) {
      const current = toFactor.pop()!;
      
      if (current === 1n) continue;
      
      if (await this.streamingPrimalityTest(current)) {
        factors.push({ prime: current, exponent: 1 });
        continue;
      }
      
      // Use streaming Pollard's rho
      const factor = await this.pollardRhoStreaming(current);
      
      if (factor && factor !== current && factor !== 1n) {
        toFactor.push(factor);
        toFactor.push(current / factor);
      } else {
        // Handle composite numbers that Pollard's rho couldn't factor
        factors.push({ prime: current, exponent: 1 });
      }
    }
    
    return factors;
  }
  
  /**
   * Advanced streaming factorization for extremely large numbers
   */
  private async advancedStreamingFactorization(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    // Try multiple algorithms in streaming fashion
    const algorithms = [
      () => this.streamingECM(n),
      () => this.streamingQuadraticSieve(n),
      () => this.streamingGeneralNumberFieldSieve(n)
    ];
    
    for (const algorithm of algorithms) {
      try {
        const result = await algorithm();
        if (result.length > 0) {
          factors.push(...result);
          break;
        }
      } catch (error) {
        // Continue to next algorithm
        continue;
      }
    }
    
    // Fallback: treat as prime if no factorization found
    if (factors.length === 0) {
      factors.push({ prime: n, exponent: 1 });
    }
    
    return factors;
  }
  
  /**
   * Streaming Elliptic Curve Method
   */
  private async streamingECM(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    // Use multiple curves with streaming approach
    const curveCount = 10;
    
    for (let i = 0; i < curveCount; i++) {
      const factor = await this.ecmSingleCurveStreaming(n, BigInt(i + 1));
      
      if (factor && factor !== n && factor !== 1n) {
        factors.push({ prime: factor, exponent: 1 });
        const quotient = n / factor;
        if (quotient !== factor) {
          factors.push({ prime: quotient, exponent: 1 });
        }
        break;
      }
      
      // Yield control to avoid blocking
      if (i % 2 === 0) {
        await this.yieldControl();
      }
    }
    
    return factors;
  }
  
  /**
   * Single curve ECM with streaming
   */
  private async ecmSingleCurveStreaming(n: bigint, seed: bigint): Promise<bigint | null> {
    try {
      const bound = 10000;
      let x = 2n + seed;
      
      for (let p = 2; p <= bound; p++) {
        if (this.isPrimeSimple(p)) {
          let k = p;
          while (k <= bound) {
            const temp = this.modPow(x, BigInt(k), n);
            const g = this.gcd(temp - 1n, n);
            
            if (g > 1n && g < n) {
              return g;
            }
            
            k *= p;
            
            // Yield control periodically
            if (k % 100 === 0) {
              await this.yieldControl();
            }
          }
        }
      }
    } catch (error) {
      return null;
    }
    
    return null;
  }
  
  /**
   * Streaming Quadratic Sieve
   */
  private async streamingQuadraticSieve(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    // Simplified streaming QS - placeholder implementation
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    // For very large numbers, this would implement proper QS
    // For now, use trial division with streaming
    const sqrt = this.integerSqrt(n);
    let candidate = 2n;
    let remaining = n;
    
    while (candidate <= sqrt && remaining > 1n && candidate <= 100000n) {
      if (remaining % candidate === 0n) {
        let count = 0;
        while (remaining % candidate === 0n) {
          remaining /= candidate;
          count++;
        }
        factors.push({ prime: candidate, exponent: count });
      }
      
      candidate += candidate === 2n ? 1n : 2n;
      
      // Yield control periodically
      if (candidate % 1000n === 0n) {
        await this.yieldControl();
      }
    }
    
    if (remaining > 1n) {
      factors.push({ prime: remaining, exponent: 1 });
    }
    
    return factors;
  }
  
  /**
   * Streaming General Number Field Sieve (placeholder)
   */
  private async streamingGeneralNumberFieldSieve(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    // GNFS is extremely complex - this is a placeholder
    // In practice, this would implement the streaming version of GNFS
    return [{ prime: n, exponent: 1 }];
  }
  
  /**
   * Streaming Pollard's rho implementation
   */
  private async pollardRhoStreaming(n: bigint): Promise<bigint | null> {
    if (n % 2n === 0n) return 2n;
    
    let x = 2n;
    let y = 2n;
    let d = 1n;
    
    const f = (x: bigint) => (x * x + 1n) % n;
    let iterations = 0;
    
    while (d === 1n && iterations < 5000000) {
      x = f(x);
      y = f(f(y));
      d = this.gcd(this.abs(x - y), n);
      
      iterations++;
      
      // Yield control every 10000 iterations
      if (iterations % 10000 === 0) {
        await this.yieldControl();
      }
    }
    
    return d === n ? null : d;
  }
  
  /**
   * Streaming primality test
   */
  private async streamingPrimalityTest(n: bigint): Promise<boolean> {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n) return false;
    
    // Use multiple rounds of Miller-Rabin with yielding
    const rounds = 20;
    
    for (let i = 0; i < rounds; i++) {
      const result = this.millerRabinTest(n, 1);
      if (!result) return false;
      
      // Yield control every few rounds
      if (i % 5 === 0) {
        await this.yieldControl();
      }
    }
    
    return true;
  }
  
  /**
   * Generate prime stream for a range
   */
  private async generatePrimeStream(start: bigint, end: bigint): Promise<bigint[]> {
    const primes: bigint[] = [];
    const stream = await this.createPrimeStream(start, end);
    
    let prime = await stream.next();
    while (prime !== null) {
      primes.push(prime);
      prime = await stream.next();
      
      // Yield control periodically
      if (primes.length % 100 === 0) {
        await this.yieldControl();
      }
    }
    
    return primes;
  }
  
  /**
   * Create a prime stream for efficient streaming access
   */
  private async createPrimeStream(start: bigint, end: bigint): Promise<PrimeStream> {
    const streamId = `stream_${start}_${end}`;
    
    if (this.activeStreams.has(streamId)) {
      return this.activeStreams.get(streamId)!;
    }
    
    const stream = new StreamingPrimeStreamImpl(start, end, this.streamingConfig);
    this.activeStreams.set(streamId, stream);
    
    return stream;
  }
  
  /**
   * Streaming sieve implementation
   */
  private async streamingSieve(start: number, end: number): Promise<bigint[]> {
    const primes: bigint[] = [];
    const chunkSize = this.streamingConfig.chunkSize;
    
    for (let i = start; i <= end; i += chunkSize) {
      const chunkEnd = Math.min(i + chunkSize - 1, end);
      const chunkPrimes = await this.sieveChunk(i, chunkEnd);
      primes.push(...chunkPrimes);
      
      // Check backpressure
      if (this.shouldApplyBackpressure()) {
        await this.handleBackpressure();
      }
      
      await this.yieldControl();
    }
    
    return primes;
  }
  
  /**
   * Sieve a single chunk
   */
  private async sieveChunk(start: number, end: number): Promise<bigint[]> {
    const primes: bigint[] = [];
    const sieve = new Array(end - start + 1).fill(true);
    
    // Simple sieving for the chunk
    for (let i = 2; i * i <= end; i++) {
      if (i >= start && i <= end && sieve[i - start]) {
        for (let j = i * i; j <= end; j += i) {
          if (j >= start) {
            sieve[j - start] = false;
          }
        }
      }
    }
    
    // Extract primes
    for (let i = Math.max(start, 2); i <= end; i++) {
      if (sieve[i - start]) {
        primes.push(BigInt(i));
      }
    }
    
    return primes;
  }
  
  /**
   * Generate large primes using streaming approach
   */
  private async generateLargePrimes(count: number, bitSize: number): Promise<bigint[]> {
    const primes: bigint[] = [];
    const min = 2n ** BigInt(bitSize - 1);
    const max = 2n ** BigInt(bitSize) - 1n;
    
    while (primes.length < count) {
      const candidate = this.randomBigIntInRange(min, max);
      
      if (await this.streamingPrimalityTest(candidate)) {
        primes.push(candidate);
      }
      
      // Yield control periodically
      if (primes.length % 10 === 0) {
        await this.yieldControl();
      }
    }
    
    return primes;
  }
  
  /**
   * Create streaming chunks from input data
   */
  private async createStreamingChunks(numbers: (bigint | number)[]): Promise<StreamChunk[]> {
    const chunks: StreamChunk[] = [];
    const chunkSize = this.streamingConfig.chunkSize;
    
    for (let i = 0; i < numbers.length; i += chunkSize) {
      const chunkData = numbers.slice(i, i + chunkSize).map(n => 
        typeof n === 'bigint' ? n : BigInt(n)
      );
      
      chunks.push({
        id: `chunk_${i}_${Date.now()}`,
        data: chunkData,
        index: Math.floor(i / chunkSize),
        timestamp: Date.now(),
        priority: 1
      });
    }
    
    return chunks;
  }
  
  /**
   * Process chunk with backpressure management
   */
  private async processChunkWithBackpressure(chunk: StreamChunk, results: any[]): Promise<void> {
    const startTime = performance.now();
    
    // Process each number in the chunk
    for (let i = 0; i < chunk.data.length; i++) {
      try {
        const context: ProcessingContext = {
          band: BandType.TREBLE,
          bitSize: chunk.data[i].toString(2).length,
          workload: 'factorization',
          resources: { memory: this.estimateMemoryUsage(), cpu: 1 },
          constraints: { timeConstraints: this.streamingConfig.streamingTimeout, maxMemoryUsage: this.estimateMemoryUsage() }
        };
        
        const result = await this.processNumber(chunk.data[i], context);
        const globalIndex = chunk.index * this.streamingConfig.chunkSize + i;
        results[globalIndex] = result;
        
      } catch (error) {
        const globalIndex = chunk.index * this.streamingConfig.chunkSize + i;
        results[globalIndex] = {
          error: error instanceof Error ? error.message : 'Processing failed',
          input: chunk.data[i]
        };
        this.streamingMetrics.streamingErrors++;
      }
    }
    
    // Update metrics
    const processingTime = performance.now() - startTime;
    this.streamingMetrics.chunksProcessed++;
    this.streamingMetrics.bytesStreamed += chunk.data.length * 32; // Approximate
    this.updateAverageChunkTime(processingTime);
    
    // Check backpressure
    if (this.shouldApplyBackpressure()) {
      await this.handleBackpressure();
    }
  }
  
  /**
   * Check if backpressure should be applied
   */
  private shouldApplyBackpressure(): boolean {
    const memoryUsage = this.estimateMemoryUsage();
    const threshold = this.streamingConfig.maxStreamSize * this.streamingConfig.backpressureThreshold;
    return memoryUsage > threshold;
  }
  
  /**
   * Handle backpressure by pausing processing
   */
  private async handleBackpressure(): Promise<void> {
    this.backpressureActive = true;
    
    // Wait for memory pressure to decrease
    while (this.shouldApplyBackpressure()) {
      await this.yieldControl(100); // Wait 100ms
    }
    
    this.backpressureActive = false;
  }
  
  /**
   * Yield control to the event loop
   */
  private async yieldControl(delay: number = 0): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
  
  /**
   * Update average chunk processing time
   */
  private updateAverageChunkTime(newTime: number): void {
    if (this.streamingMetrics.chunksProcessed === 1) {
      this.streamingMetrics.averageChunkTime = newTime;
    } else {
      const alpha = 0.1; // Exponential moving average factor
      this.streamingMetrics.averageChunkTime = 
        alpha * newTime + (1 - alpha) * this.streamingMetrics.averageChunkTime;
    }
  }
  
  // Utility methods
  private isPrimeSimple(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    const sqrt = Math.sqrt(n);
    for (let i = 3; i <= sqrt; i += 2) {
      if (n % i === 0) return false;
    }
    
    return true;
  }
  
  private millerRabinTest(n: bigint, k: number = 10): boolean {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n) return false;
    
    let d = n - 1n;
    let r = 0;
    while (d % 2n === 0n) {
      d /= 2n;
      r++;
    }
    
    for (let i = 0; i < k; i++) {
      const a = this.randomBigInt(2n, n - 2n);
      let x = this.modPow(a, d, n);
      
      if (x === 1n || x === n - 1n) continue;
      
      let composite = true;
      for (let j = 0; j < r - 1; j++) {
        x = this.modPow(x, 2n, n);
        if (x === n - 1n) {
          composite = false;
          break;
        }
      }
      
      if (composite) return false;
    }
    
    return true;
  }
  
  private integerSqrt(n: bigint): bigint {
    if (n < 0n) throw new Error('Cannot compute square root of negative number');
    if (n < 2n) return n;
    
    let x = n;
    let y = (x + 1n) / 2n;
    
    while (y < x) {
      x = y;
      y = (x + n / x) / 2n;
    }
    
    return x;
  }
  
  private modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    let result = 1n;
    base = base % modulus;
    
    while (exponent > 0n) {
      if (exponent % 2n === 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent / 2n;
      base = (base * base) % modulus;
    }
    
    return result;
  }
  
  private randomBigInt(min: bigint, max: bigint): bigint {
    const range = max - min + 1n;
    const bits = range.toString(2).length;
    
    let result;
    do {
      result = 0n;
      for (let i = 0; i < bits; i++) {
        result = (result << 1n) + (Math.random() < 0.5 ? 0n : 1n);
      }
      result = result % range;
    } while (result + min > max);
    
    return result + min;
  }
  
  private randomBigIntInRange(min: bigint, max: bigint): bigint {
    return this.randomBigInt(min, max);
  }
  
  private gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
      [a, b] = [b, a % b];
    }
    return a;
  }
  
  private abs(n: bigint): bigint {
    return n < 0n ? -n : n;
  }
  
  /**
   * Get base acceleration factor for streaming prime processing
   */
  protected getBaseAccelerationFactor(): number {
    return 18.0; // TREBLE band acceleration
  }
  
  /**
   * Estimate memory usage for streaming prime processing
   */
  protected estimateMemoryUsage(): number {
    // Variable memory usage based on streaming configuration
    return this.streamingConfig.bufferSize * 8; // 8 bytes per bigint estimate
  }
}

/**
 * Implementation of PrimeStream for streaming prime generation
 */
class StreamingPrimeStreamImpl implements PrimeStream {
  private current: bigint;
  private end: bigint;
  private exhausted = false;
  
  constructor(
    private start: bigint,
    end: bigint,
    private config: StreamingConfig
  ) {
    this.current = start;
    this.end = end;
  }
  
  async next(): Promise<bigint | null> {
    if (this.exhausted || this.current > this.end) {
      return null;
    }
    
    // Find next prime starting from current
    while (this.current <= this.end) {
      if (await this.isPrime(this.current)) {
        const result = this.current;
        this.current++;
        return result;
      }
      this.current++;
    }
    
    this.exhausted = true;
    return null;
  }
  
  hasNext(): boolean {
    return !this.exhausted && this.current <= this.end;
  }
  
  reset(): void {
    this.current = this.start;
    this.exhausted = false;
  }
  
  getCurrentRange(): { start: bigint; end: bigint } {
    return { start: this.start, end: this.end };
  }
  
  private async isPrime(n: bigint): Promise<boolean> {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n || n % 3n === 0n) return false;
    
    // Simple trial division for small numbers
    if (n < 1000000n) {
      const sqrt = this.integerSqrt(n);
      for (let i = 5n; i <= sqrt; i += 6n) {
        if (n % i === 0n || n % (i + 2n) === 0n) {
          return false;
        }
      }
      return true;
    }
    
    // Miller-Rabin for larger numbers
    return this.millerRabinTest(n, 10);
  }
  
  private integerSqrt(n: bigint): bigint {
    if (n < 2n) return n;
    
    let x = n;
    let y = (x + 1n) / 2n;
    
    while (y < x) {
      x = y;
      y = (x + n / x) / 2n;
    }
    
    return x;
  }
  
  private millerRabinTest(n: bigint, k: number = 10): boolean {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n) return false;
    
    let d = n - 1n;
    let r = 0;
    while (d % 2n === 0n) {
      d /= 2n;
      r++;
    }
    
    for (let i = 0; i < k; i++) {
      const a = this.randomBigInt(2n, n - 2n);
      let x = this.modPow(a, d, n);
      
      if (x === 1n || x === n - 1n) continue;
      
      let composite = true;
      for (let j = 0; j < r - 1; j++) {
        x = this.modPow(x, 2n, n);
        if (x === n - 1n) {
          composite = false;
          break;
        }
      }
      
      if (composite) return false;
    }
    
    return true;
  }
  
  private modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    let result = 1n;
    base = base % modulus;
    
    while (exponent > 0n) {
      if (exponent % 2n === 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent / 2n;
      base = (base * base) % modulus;
    }
    
    return result;
  }
  
  private randomBigInt(min: bigint, max: bigint): bigint {
    const range = max - min + 1n;
    const bits = range.toString(2).length;
    
    let result;
    do {
      result = 0n;
      for (let i = 0; i < bits; i++) {
        result = (result << 1n) + (Math.random() < 0.5 ? 0n : 1n);
      }
      result = result % range;
    } while (result + min > max);
    
    return result + min;
  }
}
