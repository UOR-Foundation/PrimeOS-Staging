/**
 * Band Selector Implementation
 * ============================
 * 
 * High-level interface for band selection with adaptive capabilities.
 */

import {
  BandType,
  BandSelector,
  BandClassification,
  BandOptimizationResult,
  BandConfiguration,
  BandSelectorOptions,
  BandPerformanceMetrics
} from '../types';

import { BandClassifier } from './band-classifier';
import {
  calculateBitSize,
  analyzeNumberCharacteristics,
  createDefaultBandMetrics,
  getNeighboringBands
} from '../utils/helpers';

import {
  getBitSizeForBand,
  getDefaultPrimeForBand,
  getExpectedAcceleration
} from '../utils/constants';

/**
 * Adaptive band selector with performance monitoring
 */
export class BandSelectorImpl implements BandSelector {
  private classifier: BandClassifier;
  private options: Required<BandSelectorOptions>;
  private performanceHistory: Map<BandType, number[]> = new Map();
  private adaptiveThresholds: Map<BandType, { min: number; max: number }> = new Map();
  
  constructor(classifier: BandClassifier, options: Partial<BandSelectorOptions> = {}) {
    this.classifier = classifier;
    this.options = {
      adaptiveThresholds: options.adaptiveThresholds ?? true,
      performanceMonitoring: options.performanceMonitoring ?? true,
      hysteresisMargin: options.hysteresisMargin ?? 0.1,
      qualityThreshold: options.qualityThreshold ?? 0.7,
      cacheSize: options.cacheSize ?? 1000
    };
    
    this.initializeAdaptiveThresholds();
  }
  
  /**
   * Select optimal band for a single number
   */
  selectBand(number: bigint): BandType {
    const classification = this.classifier.classifyNumber(number);
    
    // Apply adaptive thresholds if enabled
    if (this.options.adaptiveThresholds) {
      return this.applyAdaptiveSelection(number, classification);
    }
    
    return classification.band;
  }
  
  /**
   * Select band with detailed classification information
   */
  selectBandWithMetrics(number: bigint): BandClassification {
    const classification = this.classifier.classifyNumber(number);
    
    // Enhance with performance monitoring data if available
    if (this.options.performanceMonitoring) {
      this.updatePerformanceData(classification.band, classification.confidence);
    }
    
    return classification;
  }
  
  /**
   * Select optimal band for multiple numbers
   */
  selectOptimalBand(numbers: bigint[]): BandType {
    if (numbers.length === 0) return BandType.MIDRANGE;
    if (numbers.length === 1) return this.selectBand(numbers[0]);
    
    const batchResult = this.classifier.classifyBatch(numbers);
    
    // Apply batch optimization logic
    return this.optimizeBatchSelection(batchResult);
  }
  
  /**
   * Select optimal band with detailed analysis
   */
  selectOptimalBandWithAnalysis(numbers: bigint[]): BandOptimizationResult {
    if (numbers.length === 0) {
      return {
        selectedBand: BandType.MIDRANGE,
        expectedPerformance: createDefaultBandMetrics(BandType.MIDRANGE),
        confidence: 0.5,
        alternatives: [],
        recommendations: ['No input numbers provided']
      };
    }
    
    const batchResult = this.classifier.classifyBatch(numbers);
    const selectedBand = this.optimizeBatchSelection(batchResult);
    const expectedPerformance = createDefaultBandMetrics(selectedBand);
    
    // Generate alternatives and recommendations
    const alternatives = this.generateAlternatives(selectedBand, batchResult);
    const recommendations = this.generateRecommendations(batchResult, selectedBand);
    
    return {
      selectedBand,
      expectedPerformance,
      confidence: batchResult.confidence,
      alternatives,
      recommendations
    };
  }
  
  /**
   * Adapt band selection based on performance metrics
   */
  adaptBandSelection(metrics: BandPerformanceMetrics): BandConfiguration {
    // Analyze current performance and suggest adaptations
    const adaptations = this.analyzePerformanceMetrics(metrics);
    
    // Update adaptive thresholds based on performance
    this.updateAdaptiveThresholds(metrics);
    
    // Generate new configuration
    const selectedBand = this.selectOptimalBandFromMetrics(metrics);
    const bandRange = getBitSizeForBand(selectedBand);
    const optimalPrime = getDefaultPrimeForBand(selectedBand);
    
    const configuration: BandConfiguration = {
      band: selectedBand,
      config: {
        bitRange: bandRange,
        primeModulus: optimalPrime,
        processingStrategy: this.selectOptimalStrategyFromMetrics(metrics),
        windowFunction: this.selectOptimalWindowFunction(metrics),
        latticeConfig: {
          dimensions: 2,
          basis: [BigInt(2), BigInt(3)],
          reduction: 'LLL',
          precision: 64
        },
        crossoverThresholds: [0.1, 0.3, 0.7, 0.9],
        cacheSize: this.calculateOptimalCacheSize(metrics),
        parallelization: {
          enabled: true,
          threadCount: 4,
          workDistribution: 'dynamic',
          syncStrategy: 'lockfree',
          chunkSize: 1000
        },
        memoryConfig: {
          bufferSize: 8192,
          maxMemoryUsage: 100 * 1024 * 1024,
          cacheStrategy: 'LRU',
          preloadSize: 1024
        },
        accelerationFactor: adaptations.expectedImprovement,
        qualityThreshold: this.options.qualityThreshold
      },
      performance: createDefaultBandMetrics(this.selectOptimalBandFromMetrics(metrics)),
      lastUpdated: Date.now(),
      version: '1.0.0'
    };
    
    return configuration;
  }
  
  /**
   * Configure the band selector
   */
  configure(options: BandSelectorOptions): void {
    Object.assign(this.options, options);
    
    if (options.adaptiveThresholds !== undefined) {
      this.initializeAdaptiveThresholds();
    }
  }
  
  /**
   * Get current configuration
   */
  getConfiguration(): BandSelectorOptions {
    return { ...this.options };
  }
  
  // Private methods
  
  private initializeAdaptiveThresholds(): void {
    // Initialize adaptive thresholds for each band
    Object.values(BandType).forEach(band => {
      const range = this.getBitRangeForBand(band);
      this.adaptiveThresholds.set(band, {
        min: range.min * (1 - this.options.hysteresisMargin),
        max: range.max * (1 + this.options.hysteresisMargin)
      });
    });
  }
  
  private applyAdaptiveSelection(number: bigint, classification: BandClassification): BandType {
    const bitSize = classification.bitSize;
    const primaryBand = classification.band;
    
    // Check if we should consider neighboring bands based on performance
    const neighbors = getNeighboringBands(primaryBand);
    let bestBand = primaryBand;
    let bestScore = this.calculateBandScore(primaryBand, bitSize);
    
    for (const neighbor of neighbors) {
      const score = this.calculateBandScore(neighbor, bitSize);
      if (score > bestScore) {
        bestScore = score;
        bestBand = neighbor;
      }
    }
    
    return bestBand;
  }
  
  private calculateBandScore(band: BandType, bitSize: number): number {
    const range = this.getBitRangeForBand(band);
    const adaptiveRange = this.adaptiveThresholds.get(band)!;
    
    // Base score from bit size fit
    let score = 0;
    if (bitSize >= range.min && bitSize <= range.max) {
      score = 1.0;
    } else if (bitSize >= adaptiveRange.min && bitSize <= adaptiveRange.max) {
      score = 0.7; // Reduced score for adaptive range
    } else {
      score = 0.1; // Very low score for out of range
    }
    
    // Adjust based on performance history
    const history = this.performanceHistory.get(band) || [];
    if (history.length > 0) {
      const avgPerformance = history.reduce((sum, val) => sum + val, 0) / history.length;
      score *= avgPerformance;
    }
    
    return score;
  }
  
  private updatePerformanceData(band: BandType, confidence: number): void {
    const history = this.performanceHistory.get(band) || [];
    history.push(confidence);
    
    // Keep only recent history (last 100 entries)
    if (history.length > 100) {
      history.shift();
    }
    
    this.performanceHistory.set(band, history);
  }
  
  private optimizeBatchSelection(batchResult: {
    individual: BandClassification[];
    optimal: BandType;
    distribution: Map<BandType, number>;
    confidence: number;
  }): BandType {
    // Consider distribution spread and confidence
    if (batchResult.confidence > 0.8) {
      return batchResult.optimal;
    }
    
    // If confidence is low, consider neighboring bands
    const neighbors = getNeighboringBands(batchResult.optimal);
    let bestBand = batchResult.optimal;
    let bestWeight = batchResult.distribution.get(batchResult.optimal) || 0;
    
    for (const neighbor of neighbors) {
      const weight = batchResult.distribution.get(neighbor) || 0;
      if (weight > bestWeight * 0.8) { // Within 20% of best
        const neighborScore = this.calculateBandScore(neighbor, this.getAverageBitSize(batchResult.individual));
        const currentScore = this.calculateBandScore(bestBand, this.getAverageBitSize(batchResult.individual));
        
        if (neighborScore > currentScore) {
          bestBand = neighbor;
          bestWeight = weight;
        }
      }
    }
    
    return bestBand;
  }
  
  private getAverageBitSize(classifications: BandClassification[]): number {
    if (classifications.length === 0) return 64; // Default
    
    const sum = classifications.reduce((acc, c) => acc + c.bitSize, 0);
    return sum / classifications.length;
  }
  
  private generateAlternatives(selectedBand: BandType, batchResult: any): Array<{
    band: BandType;
    score: number;
    tradeoffs: string[];
  }> {
    const alternatives: Array<{ band: BandType; score: number; tradeoffs: string[] }> = [];
    
    // Add neighboring bands
    const neighbors = getNeighboringBands(selectedBand);
    for (const neighbor of neighbors) {
      const score = this.calculateBandScore(neighbor, this.getAverageBitSize(batchResult.individual));
      const tradeoffs = this.getTradeoffs(selectedBand, neighbor);
      
      alternatives.push({
        band: neighbor,
        score,
        tradeoffs
      });
    }
    
    // Sort by score
    alternatives.sort((a, b) => b.score - a.score);
    
    return alternatives.slice(0, 3); // Top 3 alternatives
  }
  
  private generateRecommendations(batchResult: any, selectedBand: BandType): string[] {
    const recommendations: string[] = [];
    
    if (batchResult.confidence < 0.5) {
      recommendations.push('Low confidence in band selection. Consider manual verification.');
    }
    
    if (batchResult.distribution.size > 3) {
      recommendations.push('High band diversity detected. Consider splitting into separate batches.');
    }
    
    const avgBitSize = this.getAverageBitSize(batchResult.individual);
    const range = this.getBitRangeForBand(selectedBand);
    
    if (avgBitSize < range.min + (range.max - range.min) * 0.1) {
      recommendations.push('Numbers are close to lower band boundary. Monitor for better performance in lower band.');
    }
    
    if (avgBitSize > range.max - (range.max - range.min) * 0.1) {
      recommendations.push('Numbers are close to upper band boundary. Monitor for better performance in higher band.');
    }
    
    return recommendations;
  }
  
  private getTradeoffs(bandA: BandType, bandB: BandType): string[] {
    const tradeoffs: string[] = [];
    
    const indexA = Object.values(BandType).indexOf(bandA);
    const indexB = Object.values(BandType).indexOf(bandB);
    
    if (indexB > indexA) {
      // Moving to higher band
      const diff = indexB - indexA;
      
      if (diff === 1) {
        tradeoffs.push(
          'Moderate increase in memory usage',
          'Better handling of larger numbers',
          'Slightly higher latency',
          'Improved parallel processing capability'
        );
      } else if (diff === 2) {
        tradeoffs.push(
          'Significant increase in memory usage',
          'Much better scalability',
          'Higher latency and startup cost',
          'Enhanced throughput for large batches'
        );
      } else {
        tradeoffs.push(
          'Substantial increase in resource requirements',
          'Dramatic improvement in handling very large numbers',
          'Much higher latency and complexity',
          'Maximum parallel processing and distribution capability'
        );
      }
    } else if (indexA > indexB) {
      // Moving to lower band
      const diff = indexA - indexB;
      
      if (diff === 1) {
        tradeoffs.push(
          'Moderate reduction in memory usage',
          'Faster response for smaller numbers',
          'Reduced parallel processing capability',
          'Better cache locality'
        );
      } else if (diff === 2) {
        tradeoffs.push(
          'Significant memory savings',
          'Much faster response times',
          'Limited scalability for large numbers',
          'Optimized for sequential processing'
        );
      } else {
        tradeoffs.push(
          'Minimal resource requirements',
          'Optimal performance for small numbers',
          'Very limited capability for large numbers',
          'Best suited for simple, direct computation'
        );
      }
    } else {
      // Same band
      tradeoffs.push('No significant tradeoffs - same processing band');
    }
    
    // Add band-specific characteristics
    const bandAChars = this.getBandCharacteristics(bandA);
    const bandBChars = this.getBandCharacteristics(bandB);
    
    if (bandAChars.cacheEfficiency !== bandBChars.cacheEfficiency) {
      const direction = bandBChars.cacheEfficiency > bandAChars.cacheEfficiency ? 'improved' : 'reduced';
      tradeoffs.push(`${direction} cache efficiency`);
    }
    
    if (bandAChars.algorithmComplexity !== bandBChars.algorithmComplexity) {
      const direction = bandBChars.algorithmComplexity > bandAChars.algorithmComplexity ? 'increased' : 'reduced';
      tradeoffs.push(`${direction} algorithm complexity`);
    }
    
    return tradeoffs;
  }
  
  private getBitRangeForBand(band: BandType): { min: number; max: number } {
    return getBitSizeForBand(band);
  }
  
  private analyzePerformanceMetrics(metrics: BandPerformanceMetrics): { expectedImprovement: number } {
    // Analyze performance and suggest improvements
    let expectedImprovement = 1.0;
    
    if (metrics.overallErrorRate > 0.05) {
      expectedImprovement *= 0.9; // Reduce expectation if high error rate
    }
    
    if (metrics.transitionOverhead > 0.1) {
      expectedImprovement *= 0.95; // Account for transition overhead
    }
    
    if (metrics.optimalBandSelection > 0.9) {
      expectedImprovement *= 1.1; // Boost if selections are optimal
    }
    
    return { expectedImprovement };
  }
  
  private updateAdaptiveThresholds(metrics: BandPerformanceMetrics): void {
    // Update thresholds based on performance
    for (const [band, utilization] of metrics.bandUtilization) {
      const current = this.adaptiveThresholds.get(band)!;
      const adjustment = utilization > 0.8 ? 1.05 : 0.95; // Expand if heavily used
      
      this.adaptiveThresholds.set(band, {
        min: current.min * adjustment,
        max: current.max * adjustment
      });
    }
  }
  
  private selectOptimalBandFromMetrics(metrics: BandPerformanceMetrics): BandType {
    // Find band with best performance
    let bestBand = BandType.MIDRANGE;
    let bestScore = 0;
    
    // For now, use a simple heuristic based on utilization
    for (const [band, utilization] of metrics.bandUtilization) {
      const acceleration = this.getExpectedAccelerationForBand(band);
      const score = utilization * acceleration;
      if (score > bestScore) {
        bestScore = score;
        bestBand = band;
      }
    }
    
    return bestBand;
  }
  
  private selectOptimalStrategyFromMetrics(metrics: BandPerformanceMetrics): any {
    // Analyze metrics to determine optimal processing strategy
    const avgUtilization = Array.from(metrics.bandUtilization.values())
      .reduce((sum, val) => sum + val, 0) / metrics.bandUtilization.size;
    
    // High error rate suggests need for more conservative approach
    if (metrics.overallErrorRate > 0.05) {
      return 'DIRECT_COMPUTATION'; // Most reliable
    }
    
    // High transition overhead suggests sticking with current strategies
    if (metrics.transitionOverhead > 0.15) {
      return 'CACHE_OPTIMIZED'; // Minimize transitions
    }
    
    // High utilization suggests need for parallel/distributed approaches
    if (avgUtilization > 0.7) {
      return 'PARALLEL_SIEVE'; // Scale out
    }
    
    // Medium utilization with good accuracy suggests sieve-based
    if (avgUtilization > 0.4 && metrics.averageAccuracy > 0.9) {
      return 'SIEVE_BASED';
    }
    
    // Low utilization suggests streaming approach
    if (avgUtilization < 0.3) {
      return 'STREAMING_PRIME';
    }
    
    // Default to adaptive for balanced scenarios
    return 'HYBRID_STRATEGY';
  }
  
  private selectOptimalWindowFunction(metrics: BandPerformanceMetrics): any {
    // Select window function based on spectral characteristics and performance
    const avgAccuracy = metrics.averageAccuracy;
    const errorRate = metrics.overallErrorRate;
    
    // High accuracy with low error rate - use high-precision window
    if (avgAccuracy > 0.95 && errorRate < 0.02) {
      return 'BLACKMAN_HARRIS'; // Best spectral characteristics
    }
    
    // Good accuracy, moderate error rate - balanced window
    if (avgAccuracy > 0.9 && errorRate < 0.05) {
      return 'HAMMING'; // Good balance of spectral leakage and resolution
    }
    
    // Lower accuracy or higher error rate - simpler window
    if (avgAccuracy > 0.8) {
      return 'HANNING'; // Good for general purposes
    }
    
    // Poor performance - use most basic window
    if (avgAccuracy < 0.8 || errorRate > 0.1) {
      return 'RECTANGULAR'; // Minimal processing overhead
    }
    
    // Default for unknown conditions
    return 'KAISER'; // Adaptive window with good characteristics
  }
  
  private calculateOptimalCacheSize(metrics: BandPerformanceMetrics): number {
    // Calculate based on memory usage and hit rates
    const baseSize = 4096;
    const memoryFactor = Math.min(2, metrics.averageAccuracy * 2);
    return Math.floor(baseSize * memoryFactor);
  }
  
  private getExpectedAccelerationForBand(band: BandType): number {
    return getExpectedAcceleration(band);
  }
  
  private getBandCharacteristics(band: BandType): {
    cacheEfficiency: number;
    algorithmComplexity: number;
    memoryRequirement: number;
    parallelizationPotential: number;
  } {
    const characteristics = {
      [BandType.ULTRABASS]: {
        cacheEfficiency: 0.95,
        algorithmComplexity: 0.2,
        memoryRequirement: 0.1,
        parallelizationPotential: 0.1
      },
      [BandType.BASS]: {
        cacheEfficiency: 0.9,
        algorithmComplexity: 0.3,
        memoryRequirement: 0.2,
        parallelizationPotential: 0.3
      },
      [BandType.MIDRANGE]: {
        cacheEfficiency: 0.8,
        algorithmComplexity: 0.5,
        memoryRequirement: 0.4,
        parallelizationPotential: 0.6
      },
      [BandType.UPPER_MID]: {
        cacheEfficiency: 0.7,
        algorithmComplexity: 0.6,
        memoryRequirement: 0.6,
        parallelizationPotential: 0.8
      },
      [BandType.TREBLE]: {
        cacheEfficiency: 0.6,
        algorithmComplexity: 0.7,
        memoryRequirement: 0.7,
        parallelizationPotential: 0.9
      },
      [BandType.SUPER_TREBLE]: {
        cacheEfficiency: 0.5,
        algorithmComplexity: 0.8,
        memoryRequirement: 0.8,
        parallelizationPotential: 0.95
      },
      [BandType.ULTRASONIC_1]: {
        cacheEfficiency: 0.4,
        algorithmComplexity: 0.9,
        memoryRequirement: 0.9,
        parallelizationPotential: 0.85
      },
      [BandType.ULTRASONIC_2]: {
        cacheEfficiency: 0.3,
        algorithmComplexity: 0.95,
        memoryRequirement: 0.95,
        parallelizationPotential: 0.7
      }
    };
    
    return characteristics[band];
  }
}
