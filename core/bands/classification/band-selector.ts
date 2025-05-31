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
    const configuration: BandConfiguration = {
      band: this.selectOptimalBandFromMetrics(metrics),
      config: {
        bitRange: { min: 16, max: 4096 }, // Will be updated based on analysis
        primeModulus: BigInt(1009), // Default prime
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
    // Simplified tradeoff analysis
    const tradeoffs: string[] = [];
    
    const indexA = Object.values(BandType).indexOf(bandA);
    const indexB = Object.values(BandType).indexOf(bandB);
    
    if (indexB > indexA) {
      tradeoffs.push('Higher memory usage', 'Better scalability', 'Higher latency');
    } else {
      tradeoffs.push('Lower memory usage', 'Faster response', 'Limited scalability');
    }
    
    return tradeoffs;
  }
  
  private getBitRangeForBand(band: BandType): { min: number; max: number } {
    // This should match the constants, but we'll define it here for safety
    const ranges = {
      [BandType.ULTRABASS]: { min: 16, max: 32 },
      [BandType.BASS]: { min: 33, max: 64 },
      [BandType.MIDRANGE]: { min: 65, max: 128 },
      [BandType.UPPER_MID]: { min: 129, max: 256 },
      [BandType.TREBLE]: { min: 257, max: 512 },
      [BandType.SUPER_TREBLE]: { min: 513, max: 1024 },
      [BandType.ULTRASONIC_1]: { min: 1025, max: 2048 },
      [BandType.ULTRASONIC_2]: { min: 2049, max: 4096 }
    };
    
    return ranges[band];
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
    // Return a default strategy - this would be more sophisticated in practice
    return 'adaptive';
  }
  
  private selectOptimalWindowFunction(metrics: BandPerformanceMetrics): any {
    // Return a default window function
    return 'hamming';
  }
  
  private calculateOptimalCacheSize(metrics: BandPerformanceMetrics): number {
    // Calculate based on memory usage and hit rates
    const baseSize = 4096;
    const memoryFactor = Math.min(2, metrics.averageAccuracy * 2);
    return Math.floor(baseSize * memoryFactor);
  }
  
  private getExpectedAccelerationForBand(band: BandType): number {
    const accelerationMap = {
      [BandType.ULTRABASS]: 2.5,
      [BandType.BASS]: 5.0,
      [BandType.MIDRANGE]: 7.0,
      [BandType.UPPER_MID]: 9.0,
      [BandType.TREBLE]: 11.0,
      [BandType.SUPER_TREBLE]: 13.0,
      [BandType.ULTRASONIC_1]: 10.0,
      [BandType.ULTRASONIC_2]: 6.0
    };
    
    return accelerationMap[band];
  }
}
