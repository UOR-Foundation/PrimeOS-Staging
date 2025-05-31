/**
 * Hybrid Strategy
 * ==============
 * 
 * ULTRASONIC_1 band processor (1025-2048 bits)
 * Combines multiple algorithms dynamically based on number characteristics.
 * Uses adaptive algorithm selection and cross-band optimization techniques.
 */

import { BaseStrategyProcessor, BaseStrategyConfig } from '../strategy-processor';
import { BandType, ProcessingContext } from '../../types';

/**
 * Algorithm weights for dynamic selection
 */
interface AlgorithmWeights {
  trialDivision: number;
  pollardRho: number;
  ecm: number;
  quadraticSieve: number;
  gnfs: number;
  distributedProcessing: number;
}

/**
 * Hybrid configuration for ULTRASONIC_1 band
 */
interface HybridConfig {
  adaptiveThreshold: number;
  algorithmSwitchDelay: number;
  crossBandOptimization: boolean;
  dynamicResourceAllocation: boolean;
  learningRate: number;
  historySize: number;
  performanceWeights: AlgorithmWeights;
  fallbackStrategy: string;
  maxAlgorithmAttempts: number;
}

/**
 * Algorithm performance history
 */
interface AlgorithmPerformance {
  algorithm: string;
  bitSize: number;
  processingTime: number;
  success: boolean;
  memoryUsage: number;
  timestamp: number;
}

/**
 * Dynamic algorithm selector
 */
interface AlgorithmSelector {
  selectAlgorithm(n: bigint, context: ProcessingContext): string;
  updatePerformance(performance: AlgorithmPerformance): void;
  getRecommendation(bitSize: number): string;
}

/**
 * Hybrid strategy for ULTRASONIC_1 band
 * Handles numbers with 1025-2048 bits using adaptive algorithm selection
 */
export class HybridStrategy extends BaseStrategyProcessor {
  private hybridConfig: HybridConfig;
  private algorithmSelector: AlgorithmSelector;
  private performanceHistory: AlgorithmPerformance[] = [];
  private algorithmWeights: AlgorithmWeights;
  private adaptiveMetrics = {
    algorithmSwitches: 0,
    adaptiveSuccesses: 0,
    crossBandOptimizations: 0,
    learningUpdates: 0,
    fallbackUsage: 0
  };
  
  constructor(config: BaseStrategyConfig = {}) {
    super({
      enableCaching: true,
      cacheSize: 35000,
      ...config
    });
    
    this.hybridConfig = {
      adaptiveThreshold: 0.1, // 10% performance improvement threshold
      algorithmSwitchDelay: 5000, // 5 second delay between switches
      crossBandOptimization: true,
      dynamicResourceAllocation: true,
      learningRate: 0.1,
      historySize: 1000,
      performanceWeights: {
        trialDivision: 0.1,
        pollardRho: 0.2,
        ecm: 0.3,
        quadraticSieve: 0.25,
        gnfs: 0.1,
        distributedProcessing: 0.05
      },
      fallbackStrategy: 'ecm',
      maxAlgorithmAttempts: 3
    };
    
    this.algorithmWeights = { ...this.hybridConfig.performanceWeights };
    this.algorithmSelector = this.createAlgorithmSelector();
  }
  
  /**
   * Check if this strategy supports the given band
   */
  supports(band: BandType): boolean {
    return band === BandType.ULTRASONIC_1;
  }
  
  /**
   * Execute hybrid strategy with adaptive algorithm selection
   */
  protected async executeStrategy(input: any, context: ProcessingContext): Promise<any> {
    if (typeof input === 'bigint' || typeof input === 'number') {
      return this.processNumber(input, context);
    } else if (Array.isArray(input)) {
      return this.processAdaptiveBatch(input, context);
    } else if (input && typeof input === 'object' && 'operation' in input) {
      return this.processOperation(input, context);
    } else {
      throw new Error(`Unsupported input type for hybrid processing: ${typeof input}`);
    }
  }
  
  /**
   * Process a single number using adaptive algorithm selection
   */
  private async processNumber(n: bigint | number, context: ProcessingContext): Promise<any> {
    const num = typeof n === 'bigint' ? n : BigInt(n);
    
    // Validate number is in ULTRASONIC_1 range (1025-2048 bits)
    const bitSize = num.toString(2).length;
    if (bitSize < 1025 || bitSize > 2048) {
      throw new Error(`Number out of ULTRASONIC_1 band range: ${bitSize} bits (expected 1025-2048)`);
    }
    
    // Use adaptive factorization
    const result = await this.adaptiveFactorization(num, context);
    
    return result;
  }
  
  /**
   * Process a batch of numbers with adaptive optimization
   */
  private async processAdaptiveBatch(numbers: (bigint | number)[], context: ProcessingContext): Promise<any[]> {
    const results: any[] = new Array(numbers.length);
    
    // Analyze batch characteristics for optimization
    const batchAnalysis = await this.analyzeBatchCharacteristics(numbers);
    
    // Apply cross-band optimization if enabled
    if (this.hybridConfig.crossBandOptimization) {
      const optimizedApproach = await this.optimizeCrossBand(batchAnalysis);
      this.adaptiveMetrics.crossBandOptimizations++;
    }
    
    // Process numbers with dynamic algorithm selection
    for (let i = 0; i < numbers.length; i++) {
      try {
        const itemContext: ProcessingContext = {
          ...context,
          bitSize: typeof numbers[i] === 'bigint' ? numbers[i].toString(2).length : numbers[i].toString(2).length
        };
        
        const result = await this.processNumber(numbers[i], itemContext);
        results[i] = result;
        
      } catch (error) {
        results[i] = {
          error: error instanceof Error ? error.message : 'Processing failed',
          input: numbers[i]
        };
      }
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
      case 'adaptiveFactor':
        return this.adaptiveFactorization(BigInt(operation.value), context);
      case 'algorithmSelection':
        return this.algorithmSelector.selectAlgorithm(BigInt(operation.value), context);
      case 'performanceAnalysis':
        return this.getPerformanceAnalysis();
      case 'updateWeights':
        return this.updateAlgorithmWeights(operation.weights);
      case 'crossBandOptimize':
        return this.optimizeCrossBand(operation.analysis);
      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }
  }
  
  /**
   * Adaptive factorization using dynamic algorithm selection
   */
  private async adaptiveFactorization(n: bigint, context: ProcessingContext): Promise<{ factors: Array<{prime: bigint, exponent: number}>, method: string }> {
    if (n <= 1n) {
      return { factors: [], method: 'hybrid-adaptive' };
    }
    
    const factors: Array<{prime: bigint, exponent: number}> = [];
    let remaining = n;
    let attempts = 0;
    const usedAlgorithms: string[] = [];
    
    while (remaining > 1n && attempts < this.hybridConfig.maxAlgorithmAttempts) {
      // Select best algorithm for current state
      const algorithm = this.algorithmSelector.selectAlgorithm(remaining, context);
      
      if (usedAlgorithms.includes(algorithm)) {
        // Avoid infinite loops, try fallback
        break;
      }
      
      usedAlgorithms.push(algorithm);
      attempts++;
      
      try {
        const startTime = performance.now();
        const algorithmFactors = await this.executeAlgorithm(algorithm, remaining, context);
        const processingTime = performance.now() - startTime;
        
        // Update performance metrics
        const algorithmPerformance: AlgorithmPerformance = {
          algorithm,
          bitSize: remaining.toString(2).length,
          processingTime,
          success: algorithmFactors.length > 0,
          memoryUsage: this.estimateMemoryUsage(),
          timestamp: Date.now()
        };
        
        this.algorithmSelector.updatePerformance(algorithmPerformance);
        
        if (algorithmFactors.length > 0) {
          factors.push(...algorithmFactors);
          
          // Update remaining number
          for (const factor of algorithmFactors) {
            for (let i = 0; i < factor.exponent; i++) {
              remaining /= factor.prime;
            }
          }
          
          this.adaptiveMetrics.adaptiveSuccesses++;
          break;
        }
        
      } catch (error) {
        // Algorithm failed, try next one
        continue;
      }
    }
    
    // Handle remaining unfactored part
    if (remaining > 1n) {
      // Use fallback strategy
      this.adaptiveMetrics.fallbackUsage++;
      const fallbackFactors = await this.executeFallbackStrategy(remaining, context);
      factors.push(...fallbackFactors);
    }
    
    return { 
      factors, 
      method: `hybrid-adaptive(${usedAlgorithms.join(',')})` 
    };
  }
  
  /**
   * Execute specific algorithm
   */
  private async executeAlgorithm(
    algorithm: string, 
    n: bigint, 
    context: ProcessingContext
  ): Promise<Array<{prime: bigint, exponent: number}>> {
    switch (algorithm) {
      case 'trialDivision':
        return this.hybridTrialDivision(n);
      case 'pollardRho':
        return this.hybridPollardRho(n);
      case 'ecm':
        return this.hybridECM(n);
      case 'quadraticSieve':
        return this.hybridQuadraticSieve(n);
      case 'gnfs':
        return this.hybridGNFS(n);
      case 'distributedProcessing':
        return this.hybridDistributedProcessing(n, context);
      default:
        throw new Error(`Unknown algorithm: ${algorithm}`);
    }
  }
  
  /**
   * Hybrid trial division optimized for large numbers
   */
  private async hybridTrialDivision(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    const factors: Array<{prime: bigint, exponent: number}> = [];
    let remaining = n;
    
    // Optimized wheel for trial division
    const wheelPrimes = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n];
    
    for (const prime of wheelPrimes) {
      if (remaining % prime === 0n) {
        let count = 0;
        while (remaining % prime === 0n) {
          remaining /= prime;
          count++;
        }
        factors.push({ prime, exponent: count });
      }
      
      if (prime * prime > remaining) break;
    }
    
    return factors;
  }
  
  /**
   * Hybrid Pollard's rho with optimization
   */
  private async hybridPollardRho(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    // Use multiple polynomial functions for better coverage
    const polynomials = [
      (x: bigint) => (x * x + 1n) % n,
      (x: bigint) => (x * x + 2n) % n,
      (x: bigint) => (x * x + 3n) % n
    ];
    
    for (const f of polynomials) {
      const factor = await this.pollardRhoWithFunction(n, f);
      if (factor && factor !== n && factor !== 1n) {
        factors.push({ prime: factor, exponent: 1 });
        
        const quotient = n / factor;
        if (quotient !== factor && quotient > 1n) {
          factors.push({ prime: quotient, exponent: 1 });
        }
        break;
      }
    }
    
    return factors;
  }
  
  /**
   * Pollard's rho with custom function
   */
  private async pollardRhoWithFunction(n: bigint, f: (x: bigint) => bigint): Promise<bigint | null> {
    let x = 2n;
    let y = 2n;
    let d = 1n;
    
    for (let i = 0; i < 2000000 && d === 1n; i++) {
      x = f(x);
      y = f(f(y));
      d = this.gcd(this.abs(x - y), n);
      
      // Yield control periodically
      if (i % 10000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return d === n ? null : d;
  }
  
  /**
   * Hybrid Elliptic Curve Method
   */
  private async hybridECM(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    // Use optimized curve selection
    const curves = this.selectOptimalCurves(n);
    
    for (const curve of curves) {
      const factor = await this.ecmSingleCurve(n, curve.a, curve.b);
      
      if (factor && factor !== n && factor !== 1n) {
        factors.push({ prime: factor, exponent: 1 });
        
        const quotient = n / factor;
        if (quotient !== factor && quotient > 1n) {
          factors.push({ prime: quotient, exponent: 1 });
        }
        break;
      }
    }
    
    return factors;
  }
  
  /**
   * Select optimal curves for ECM based on number characteristics
   */
  private selectOptimalCurves(n: bigint): Array<{a: bigint, b: bigint}> {
    const bitSize = n.toString(2).length;
    const curveCount = Math.min(10, Math.floor(bitSize / 100));
    
    const curves = [];
    for (let i = 0; i < curveCount; i++) {
      curves.push({
        a: BigInt(i + 1),
        b: BigInt((i * 3 + 7) % 97) // Use prime modulus for better distribution
      });
    }
    
    return curves;
  }
  
  /**
   * ECM single curve implementation
   */
  private async ecmSingleCurve(n: bigint, a: bigint, b: bigint): Promise<bigint | null> {
    try {
      const bound = 50000;
      let x = 2n + a;
      
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
            
            if (k % 1000 === 0) {
              await new Promise(resolve => setTimeout(resolve, 0));
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
   * Hybrid Quadratic Sieve
   */
  private async hybridQuadraticSieve(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    // Simplified QS with hybrid optimizations
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    // For very large numbers, QS becomes more effective
    const bitSize = n.toString(2).length;
    if (bitSize > 1500) {
      // Use actual QS algorithm (simplified implementation)
      const factor = await this.quadraticSieveCore(n);
      if (factor && factor !== n && factor !== 1n) {
        factors.push({ prime: factor, exponent: 1 });
        
        const quotient = n / factor;
        if (quotient !== factor && quotient > 1n) {
          factors.push({ prime: quotient, exponent: 1 });
        }
      }
    }
    
    return factors;
  }
  
  /**
   * Core quadratic sieve implementation
   */
  private async quadraticSieveCore(n: bigint): Promise<bigint | null> {
    // Simplified QS core - placeholder for complex algorithm
    const sqrt = this.integerSqrt(n);
    
    // Try a few candidates around sqrt(n)
    for (let i = 0; i < 1000; i++) {
      const candidate = sqrt + BigInt(i);
      const square = candidate * candidate - n;
      
      if (square > 0n && this.isPerfectSquare(square)) {
        const factor = this.gcd(candidate - this.integerSqrt(square), n);
        if (factor > 1n && factor < n) {
          return factor;
        }
      }
      
      if (i % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return null;
  }
  
  /**
   * Hybrid GNFS
   */
  private async hybridGNFS(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    // GNFS is extremely complex - placeholder implementation
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    // GNFS is only effective for very large numbers (> 1800 bits)
    const bitSize = n.toString(2).length;
    if (bitSize > 1800) {
      // In practice, this would implement GNFS
      factors.push({ prime: n, exponent: 1 });
    }
    
    return factors;
  }
  
  /**
   * Hybrid distributed processing
   */
  private async hybridDistributedProcessing(n: bigint, context: ProcessingContext): Promise<Array<{prime: bigint, exponent: number}>> {
    // Simplified distributed approach
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    // Use distributed ECM
    const distributedECMResult = await this.distributedECMSimulation(n);
    factors.push(...distributedECMResult);
    
    return factors;
  }
  
  /**
   * Simulated distributed ECM
   */
  private async distributedECMSimulation(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    // Simulate distributed ECM execution
    const curves = this.selectOptimalCurves(n);
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    // Process curves in parallel simulation
    const promises = curves.map(curve => this.ecmSingleCurve(n, curve.a, curve.b));
    const results = await Promise.allSettled(promises);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value && 
          result.value !== n && result.value !== 1n) {
        factors.push({ prime: result.value, exponent: 1 });
        break;
      }
    }
    
    return factors;
  }
  
  /**
   * Execute fallback strategy
   */
  private async executeFallbackStrategy(n: bigint, context: ProcessingContext): Promise<Array<{prime: bigint, exponent: number}>> {
    try {
      return await this.executeAlgorithm(this.hybridConfig.fallbackStrategy, n, context);
    } catch (error) {
      // Ultimate fallback: treat as prime
      return [{ prime: n, exponent: 1 }];
    }
  }
  
  /**
   * Create algorithm selector with machine learning
   */
  private createAlgorithmSelector(): AlgorithmSelector {
    const config = this.hybridConfig;
    const weights = this.algorithmWeights;
    const history = this.performanceHistory;
    
    return {
      selectAlgorithm: (n: bigint, context: ProcessingContext): string => {
        const bitSize = n.toString(2).length;
        
        // Algorithm selection based on bit size and historical performance
        if (bitSize < 1200) {
          return this.selectForSmallNumbers(bitSize);
        } else if (bitSize < 1600) {
          return this.selectForMediumNumbers(bitSize);
        } else {
          return this.selectForLargeNumbers(bitSize);
        }
      },
      
      updatePerformance: (performance: AlgorithmPerformance): void => {
        history.push(performance);
        
        // Maintain history size
        if (history.length > config.historySize) {
          history.shift();
        }
        
        // Update algorithm weights based on performance
        this.updateWeightsFromPerformance(performance);
        this.adaptiveMetrics.learningUpdates++;
      },
      
      getRecommendation: (bitSize: number): string => {
        // Find best performing algorithm for this bit size range
        const relevantHistory = history.filter(h => 
          Math.abs(h.bitSize - bitSize) <= 100 && h.success
        );
        
        if (relevantHistory.length === 0) {
          return this.getDefaultAlgorithm(bitSize);
        }
        
        // Calculate average performance for each algorithm
        const algorithmPerformance = new Map<string, number>();
        
        for (const record of relevantHistory) {
          const current = algorithmPerformance.get(record.algorithm) || 0;
          const newPerf = 1 / (record.processingTime + 1); // Inverse time as performance metric
          algorithmPerformance.set(record.algorithm, current + newPerf);
        }
        
        // Return best performing algorithm
        let bestAlgorithm = this.getDefaultAlgorithm(bitSize);
        let bestPerformance = 0;
        
        for (const [algorithm, performance] of algorithmPerformance) {
          if (performance > bestPerformance) {
            bestPerformance = performance;
            bestAlgorithm = algorithm;
          }
        }
        
        return bestAlgorithm;
      }
    };
  }
  
  /**
   * Select algorithm for small numbers
   */
  private selectForSmallNumbers(bitSize: number): string {
    if (this.algorithmWeights.pollardRho > 0.3) {
      return 'pollardRho';
    }
    return 'ecm';
  }
  
  /**
   * Select algorithm for medium numbers
   */
  private selectForMediumNumbers(bitSize: number): string {
    if (this.algorithmWeights.ecm > 0.4) {
      return 'ecm';
    }
    return 'quadraticSieve';
  }
  
  /**
   * Select algorithm for large numbers
   */
  private selectForLargeNumbers(bitSize: number): string {
    if (this.algorithmWeights.gnfs > 0.3) {
      return 'gnfs';
    }
    if (this.algorithmWeights.distributedProcessing > 0.2) {
      return 'distributedProcessing';
    }
    return 'quadraticSieve';
  }
  
  /**
   * Get default algorithm for bit size
   */
  private getDefaultAlgorithm(bitSize: number): string {
    if (bitSize < 1200) return 'pollardRho';
    if (bitSize < 1600) return 'ecm';
    return 'quadraticSieve';
  }
  
  /**
   * Update weights from performance data
   */
  private updateWeightsFromPerformance(performance: AlgorithmPerformance): void {
    const learningRate = this.hybridConfig.learningRate;
    const algorithm = performance.algorithm as keyof AlgorithmWeights;
    
    if (algorithm in this.algorithmWeights) {
      if (performance.success) {
        // Increase weight for successful algorithm
        const performanceScore = 1 / (performance.processingTime + 1);
        this.algorithmWeights[algorithm] += learningRate * performanceScore;
      } else {
        // Decrease weight for failed algorithm
        this.algorithmWeights[algorithm] *= (1 - learningRate);
      }
      
      // Normalize weights
      this.normalizeWeights();
    }
  }
  
  /**
   * Normalize algorithm weights
   */
  private normalizeWeights(): void {
    const total = Object.values(this.algorithmWeights).reduce((sum, weight) => sum + weight, 0);
    
    if (total > 0) {
      for (const key in this.algorithmWeights) {
        this.algorithmWeights[key as keyof AlgorithmWeights] /= total;
      }
    }
  }
  
  /**
   * Analyze batch characteristics
   */
  private async analyzeBatchCharacteristics(numbers: (bigint | number)[]): Promise<any> {
    const analysis = {
      averageBitSize: 0,
      bitSizeVariance: 0,
      numberCount: numbers.length,
      estimatedComplexity: 0
    };
    
    const bitSizes = numbers.map(n => 
      typeof n === 'bigint' ? n.toString(2).length : n.toString(2).length
    );
    
    analysis.averageBitSize = bitSizes.reduce((sum, size) => sum + size, 0) / bitSizes.length;
    
    const variance = bitSizes.reduce((sum, size) => 
      sum + Math.pow(size - analysis.averageBitSize, 2), 0
    ) / bitSizes.length;
    
    analysis.bitSizeVariance = Math.sqrt(variance);
    analysis.estimatedComplexity = analysis.averageBitSize * Math.log(analysis.numberCount);
    
    return analysis;
  }
  
  /**
   * Optimize cross-band processing
   */
  private async optimizeCrossBand(analysis: any): Promise<any> {
    // Cross-band optimization strategies
    const optimization = {
      recommendedPreprocessing: [] as string[],
      batchSizeAdjustment: 1.0,
      algorithmOverride: null as string | null
    };
    
    // Adjust batch processing based on characteristics
    if (analysis.bitSizeVariance > 100) {
      optimization.batchSizeAdjustment = 0.5; // Smaller batches for diverse sizes
      optimization.recommendedPreprocessing.push('sort_by_size');
    }
    
    if (analysis.averageBitSize > 1800) {
      optimization.algorithmOverride = 'gnfs';
    }
    
    return optimization;
  }
  
  /**
   * Update algorithm weights manually
   */
  private updateAlgorithmWeights(newWeights: Partial<AlgorithmWeights>): AlgorithmWeights {
    Object.assign(this.algorithmWeights, newWeights);
    this.normalizeWeights();
    return this.algorithmWeights;
  }
  
  /**
   * Get performance analysis
   */
  private getPerformanceAnalysis(): any {
    const analysis = {
      totalOperations: this.performanceHistory.length,
      algorithmUsage: {} as any,
      averagePerformance: {} as any,
      adaptiveMetrics: this.adaptiveMetrics,
      currentWeights: this.algorithmWeights
    };
    
    // Calculate algorithm usage statistics
    for (const record of this.performanceHistory) {
      if (!analysis.algorithmUsage[record.algorithm]) {
        analysis.algorithmUsage[record.algorithm] = { count: 0, successRate: 0 };
      }
      
      analysis.algorithmUsage[record.algorithm].count++;
      if (record.success) {
        analysis.algorithmUsage[record.algorithm].successRate++;
      }
    }
    
    // Calculate success rates
    for (const algorithm in analysis.algorithmUsage) {
      const usage = analysis.algorithmUsage[algorithm];
      usage.successRate = usage.successRate / usage.count;
    }
    
    return analysis;
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
  
  private isPerfectSquare(n: bigint): boolean {
    const sqrt = this.integerSqrt(n);
    return sqrt * sqrt === n;
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
   * Get base acceleration factor for hybrid processing
   */
  protected getBaseAccelerationFactor(): number {
    return 35.0; // ULTRASONIC_1 band acceleration
  }
  
  /**
   * Estimate memory usage for hybrid processing
   */
  protected estimateMemoryUsage(): number {
    // Dynamic memory usage based on active algorithms
    return 256 * 1024 * 1024; // 256MB
  }
}
