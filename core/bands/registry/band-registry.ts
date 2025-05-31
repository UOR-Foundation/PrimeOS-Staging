/**
 * Band Registry Implementation
 * ===========================
 * 
 * Central registry for band configurations and management.
 */

import {
  BandType,
  BandRegistry,
  BandConfig,
  BandCriteria,
  BandCapabilities,
  PerformanceHistory,
  BandMetrics,
  ProcessingStrategy,
  WindowFunction
} from '../types';

import {
  BAND_CONSTANTS,
  PERFORMANCE_CONSTANTS,
  STRATEGY_MAPPINGS,
  getBitSizeForBand,
  getDefaultPrimeForBand,
  getExpectedAcceleration,
  getOptimalStrategy
} from '../utils/constants';

import {
  createDefaultBandMetrics,
  createDefaultQualityMetrics,
  validateBandType
} from '../utils/helpers';

/**
 * Central registry for band configurations and capabilities
 */
export class BandRegistryImpl implements BandRegistry {
  private configs: Map<BandType, BandConfig> = new Map();
  private capabilities: Map<BandType, BandCapabilities> = new Map();
  private performanceHistory: Map<BandType, PerformanceHistory> = new Map();
  private registryVersion: string = '1.0.0';
  
  constructor() {
    this.initializeDefaultConfigurations();
    this.initializeCapabilities();
  }
  
  /**
   * Register a band configuration
   */
  registerBand(band: BandType, config: BandConfig): void {
    if (!validateBandType(band)) {
      throw new Error(`Invalid band type: ${band}`);
    }
    
    this.configs.set(band, config);
    this.initializeCapabilitiesForBand(band);
  }
  
  /**
   * Get band configuration
   */
  getBandConfig(band: BandType): BandConfig | undefined {
    return this.configs.get(band);
  }
  
  /**
   * Get all registered bands
   */
  getRegisteredBands(): BandType[] {
    return Array.from(this.configs.keys());
  }
  
  /**
   * Get band capabilities
   */
  getBandCapabilities(band: BandType): BandCapabilities | undefined {
    return this.capabilities.get(band);
  }
  
  /**
   * Update band performance history
   */
  updatePerformanceHistory(band: BandType, metrics: BandMetrics): void {
    const history = this.performanceHistory.get(band) || {
      entries: [],
      averagePerformance: createDefaultBandMetrics(band),
      lastUpdated: Date.now()
    };
    
    history.entries.push({
      timestamp: Date.now(),
      metrics,
      environment: this.getCurrentEnvironment()
    });
    
    // Keep only last 100 entries
    if (history.entries.length > 100) {
      history.entries.shift();
    }
    
    // Update average performance
    history.averagePerformance = this.calculateAverageMetrics(history.entries);
    history.lastUpdated = Date.now();
    
    this.performanceHistory.set(band, history);
  }
  
  /**
   * Get performance history for a band
   */
  getPerformanceHistory(band: BandType): PerformanceHistory | undefined {
    return this.performanceHistory.get(band);
  }
  
  /**
   * Find optimal band based on criteria
   */
  findOptimalBand(criteria: BandCriteria): BandType | undefined {
    let bestBand: BandType | undefined;
    let bestScore = -1;
    
    for (const band of this.getRegisteredBands()) {
      const score = this.scoreBandAgainstCriteria(band, criteria);
      if (score > bestScore) {
        bestScore = score;
        bestBand = band;
      }
    }
    
    return bestBand;
  }
  
  /**
   * Get bands matching criteria
   */
  findMatchingBands(criteria: BandCriteria): Array<{ band: BandType; score: number }> {
    const results: Array<{ band: BandType; score: number }> = [];
    
    for (const band of this.getRegisteredBands()) {
      const score = this.scoreBandAgainstCriteria(band, criteria);
      if (score > 0.5) { // Minimum threshold
        results.push({ band, score });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Validate band registry integrity
   */
  validateRegistry(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check all bands are registered
    for (const band of Object.values(BandType)) {
      if (!this.configs.has(band)) {
        issues.push(`Band ${band} is not registered`);
      }
    }
    
    // Check configurations are valid
    for (const [band, config] of this.configs) {
      const configIssues = this.validateBandConfig(band, config);
      issues.push(...configIssues);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Get registry statistics
   */
  getRegistryStats(): {
    totalBands: number;
    registeredBands: number;
    averagePerformance: number;
    lastUpdated: number;
    version: string;
  } {
    const totalBands = Object.values(BandType).length;
    const registeredBands = this.configs.size;
    
    // Calculate average performance across all bands
    let totalPerformance = 0;
    let performanceCount = 0;
    
    for (const history of this.performanceHistory.values()) {
      if (history.averagePerformance) {
        totalPerformance += history.averagePerformance.accelerationFactor;
        performanceCount++;
      }
    }
    
    const averagePerformance = performanceCount > 0 ? totalPerformance / performanceCount : 0;
    
    return {
      totalBands,
      registeredBands,
      averagePerformance,
      lastUpdated: Date.now(),
      version: this.registryVersion
    };
  }
  
  /**
   * Clear all data
   */
  clear(): void {
    this.configs.clear();
    this.capabilities.clear();
    this.performanceHistory.clear();
  }
  
  // Private methods
  
  private initializeDefaultConfigurations(): void {
    for (const band of Object.values(BandType)) {
      const config: BandConfig = {
        bitRange: getBitSizeForBand(band),
        primeModulus: getDefaultPrimeForBand(band),
        processingStrategy: getOptimalStrategy(band),
        windowFunction: WindowFunction.HAMMING,
        latticeConfig: {
          dimensions: 2,
          basis: [BigInt(2), BigInt(3)],
          reduction: 'LLL',
          precision: 64
        },
        crossoverThresholds: [0.1, 0.3, 0.7, 0.9],
        cacheSize: PERFORMANCE_CONSTANTS.CACHE_SIZES[band],
        parallelization: {
          enabled: this.shouldEnableParallelization(band),
          threadCount: this.getOptimalThreadCount(band),
          workDistribution: 'dynamic',
          syncStrategy: 'lockfree',
          chunkSize: 1000
        },
        memoryConfig: {
          bufferSize: 8192,
          maxMemoryUsage: PERFORMANCE_CONSTANTS.MEMORY_USAGE[band] * 100,
          cacheStrategy: 'LRU',
          preloadSize: 1024
        },
        accelerationFactor: getExpectedAcceleration(band),
        qualityThreshold: 0.95
      };
      
      this.configs.set(band, config);
    }
  }
  
  private initializeCapabilities(): void {
    for (const band of Object.values(BandType)) {
      this.initializeCapabilitiesForBand(band);
    }
  }
  
  private initializeCapabilitiesForBand(band: BandType): void {
    const capabilities: BandCapabilities = {
      supportedOperations: this.getSupportedOperations(band),
      maxBitSize: getBitSizeForBand(band).max,
      minBitSize: getBitSizeForBand(band).min,
      parallelization: this.shouldEnableParallelization(band),
      spectralProcessing: this.supportsSpectralProcessing(band),
      streamingSupport: this.supportsStreaming(band),
      cacheOptimization: this.supportsCacheOptimization(band),
      approximateComputation: this.supportsApproximateComputation(band),
      distributedProcessing: this.supportsDistributedProcessing(band),
      memoryRequirements: PERFORMANCE_CONSTANTS.MEMORY_USAGE[band],
      computationalComplexity: this.getComputationalComplexity(band)
    };
    
    this.capabilities.set(band, capabilities);
  }
  
  private shouldEnableParallelization(band: BandType): boolean {
    const highParallelizationBands = [
      BandType.UPPER_MID,
      BandType.TREBLE,
      BandType.SUPER_TREBLE,
      BandType.ULTRASONIC_1
    ];
    return highParallelizationBands.includes(band);
  }
  
  private getOptimalThreadCount(band: BandType): number {
    const threadCounts = {
      [BandType.ULTRABASS]: 1,
      [BandType.BASS]: 1,
      [BandType.MIDRANGE]: 2,
      [BandType.UPPER_MID]: 4,
      [BandType.TREBLE]: 6,
      [BandType.SUPER_TREBLE]: 8,
      [BandType.ULTRASONIC_1]: 6,
      [BandType.ULTRASONIC_2]: 4
    };
    
    return threadCounts[band];
  }
  
  private getSupportedOperations(band: BandType): string[] {
    const baseOperations = ['factorization', 'primality_test', 'prime_generation'];
    
    const advancedOperations = {
      [BandType.ULTRABASS]: [],
      [BandType.BASS]: ['cache_optimization'],
      [BandType.MIDRANGE]: ['cache_optimization', 'sieve_based'],
      [BandType.UPPER_MID]: ['cache_optimization', 'sieve_based', 'parallel_processing'],
      [BandType.TREBLE]: ['parallel_processing', 'streaming', 'pipeline'],
      [BandType.SUPER_TREBLE]: ['parallel_processing', 'streaming', 'distributed'],
      [BandType.ULTRASONIC_1]: ['hybrid', 'spectral', 'advanced_algorithms'],
      [BandType.ULTRASONIC_2]: ['spectral', 'research_algorithms', 'experimental']
    };
    
    return [...baseOperations, ...advancedOperations[band]];
  }
  
  private supportsSpectralProcessing(band: BandType): boolean {
    return [BandType.ULTRASONIC_1, BandType.ULTRASONIC_2].includes(band);
  }
  
  private supportsStreaming(band: BandType): boolean {
    return [BandType.TREBLE, BandType.SUPER_TREBLE, BandType.ULTRASONIC_1, BandType.ULTRASONIC_2].includes(band);
  }
  
  private supportsCacheOptimization(band: BandType): boolean {
    return [BandType.BASS, BandType.MIDRANGE, BandType.UPPER_MID].includes(band);
  }
  
  private supportsApproximateComputation(band: BandType): boolean {
    return [BandType.ULTRASONIC_1, BandType.ULTRASONIC_2].includes(band);
  }
  
  private supportsDistributedProcessing(band: BandType): boolean {
    return [BandType.SUPER_TREBLE, BandType.ULTRASONIC_1, BandType.ULTRASONIC_2].includes(band);
  }
  
  private getComputationalComplexity(band: BandType): 'low' | 'medium' | 'high' | 'very_high' {
    const complexityMap = {
      [BandType.ULTRABASS]: 'low' as const,
      [BandType.BASS]: 'low' as const,
      [BandType.MIDRANGE]: 'medium' as const,
      [BandType.UPPER_MID]: 'medium' as const,
      [BandType.TREBLE]: 'high' as const,
      [BandType.SUPER_TREBLE]: 'high' as const,
      [BandType.ULTRASONIC_1]: 'very_high' as const,
      [BandType.ULTRASONIC_2]: 'very_high' as const
    };
    
    return complexityMap[band];
  }
  
  private scoreBandAgainstCriteria(band: BandType, criteria: BandCriteria): number {
    let score = 0;
    let weights = 0;
    
    const config = this.configs.get(band);
    const capabilities = this.capabilities.get(band);
    
    if (!config || !capabilities) return 0;
    
    // Bit size range scoring
    if (criteria.bitSizeRange) {
      const [minBit, maxBit] = criteria.bitSizeRange;
      const bandRange = config.bitRange;
      
      const overlap = Math.max(0, 
        Math.min(bandRange.max, maxBit) - Math.max(bandRange.min, minBit)
      );
      const requestedRange = maxBit - minBit;
      
      if (requestedRange > 0) {
        score += (overlap / requestedRange) * 0.4;
        weights += 0.4;
      }
    }
    
    // Performance requirements
    if (criteria.performanceRequirements) {
      const perfScore = this.scorePerformanceRequirements(band, criteria.performanceRequirements);
      score += perfScore * 0.3;
      weights += 0.3;
    }
    
    // Quality requirements
    if (criteria.qualityRequirements) {
      const qualityScore = this.scoreQualityRequirements(band, criteria.qualityRequirements);
      score += qualityScore * 0.2;
      weights += 0.2;
    }
    
    // Resource constraints
    if (criteria.resourceConstraints) {
      const resourceScore = this.scoreResourceConstraints(band, criteria.resourceConstraints);
      score += resourceScore * 0.1;
      weights += 0.1;
    }
    
    return weights > 0 ? score / weights : 0;
  }
  
  private scorePerformanceRequirements(band: BandType, requirements: any): number {
    // Simplified scoring - would be more sophisticated in practice
    const acceleration = getExpectedAcceleration(band);
    let score = 0.5; // Base score
    
    if (requirements.minThroughput) {
      const estimatedThroughput = 1000 * acceleration;
      score += estimatedThroughput >= requirements.minThroughput ? 0.3 : 0;
    }
    
    if (requirements.maxLatency) {
      const estimatedLatency = 1 / acceleration;
      score += estimatedLatency <= requirements.maxLatency ? 0.2 : 0;
    }
    
    return Math.min(1, score);
  }
  
  private scoreQualityRequirements(band: BandType, requirements: any): number {
    // All bands maintain high quality, slight preference for lower bands for precision
    let score = 0.8;
    
    if (requirements.minPrecision && requirements.minPrecision > 0.99) {
      const bandIndex = Object.values(BandType).indexOf(band);
      score += 0.2 * (1 - bandIndex * 0.1);
    }
    
    return Math.min(1, Math.max(0, score));
  }
  
  private scoreResourceConstraints(band: BandType, constraints: any): number {
    let score = 1.0;
    
    if (constraints.maxMemoryUsage) {
      const memoryUsage = PERFORMANCE_CONSTANTS.MEMORY_USAGE[band];
      score *= memoryUsage <= constraints.maxMemoryUsage ? 1.0 : 0.5;
    }
    
    return score;
  }
  
  private validateBandConfig(band: BandType, config: BandConfig): string[] {
    const issues: string[] = [];
    
    // Validate bit range
    if (config.bitRange.min >= config.bitRange.max) {
      issues.push(`Invalid bit range for ${band}: min >= max`);
    }
    
    if (config.bitRange.min < 1) {
      issues.push(`Invalid min bit size for ${band}: must be >= 1`);
    }
    
    // Validate cache size
    if (config.cacheSize < 0) {
      issues.push(`Invalid cache size for ${band}: must be >= 0`);
    }
    
    // Validate acceleration factor
    if (config.accelerationFactor < 1.0) {
      issues.push(`Invalid acceleration factor for ${band}: must be >= 1.0`);
    }
    
    return issues;
  }
  
  private calculateAverageMetrics(entries: any[]): BandMetrics {
    if (entries.length === 0) {
      return createDefaultBandMetrics(BandType.MIDRANGE);
    }
    
    const sums = entries.reduce((acc, entry) => {
      const metrics = entry.metrics;
      return {
        throughput: acc.throughput + metrics.throughput,
        latency: acc.latency + metrics.latency,
        memoryUsage: acc.memoryUsage + metrics.memoryUsage,
        accelerationFactor: acc.accelerationFactor + metrics.accelerationFactor,
        errorRate: acc.errorRate + metrics.errorRate
      };
    }, { throughput: 0, latency: 0, memoryUsage: 0, accelerationFactor: 0, errorRate: 0 });
    
    const count = entries.length;
    const averageMetrics = createDefaultBandMetrics(BandType.MIDRANGE);
    
    averageMetrics.throughput = sums.throughput / count;
    averageMetrics.latency = sums.latency / count;
    averageMetrics.memoryUsage = sums.memoryUsage / count;
    averageMetrics.accelerationFactor = sums.accelerationFactor / count;
    averageMetrics.errorRate = sums.errorRate / count;
    
    return averageMetrics;
  }
  
  private getCurrentEnvironment(): any {
    return {
      platform: 'node',
      version: process.version,
      memory: process.memoryUsage(),
      timestamp: Date.now()
    };
  }
}
