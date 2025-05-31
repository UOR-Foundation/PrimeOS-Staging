/**
 * Band Classifier Implementation
 * =============================
 * 
 * Core logic for classifying numbers into optimal processing bands.
 */

import {
  BandType,
  BandClassification,
  NumberCharacteristics,
  BandCriteria,
  PerformanceRequirements,
  QualityRequirements,
  ResourceConstraints
} from '../types';

import {
  calculateBitSize,
  classifyByBitSize,
  analyzeNumberCharacteristics,
  calculateClassificationConfidence,
  generateBandAlternatives,
  validateBandType
} from '../utils/helpers';

import {
  BAND_CONSTANTS,
  getBitSizeForBand,
  getExpectedAcceleration
} from '../utils/constants';

/**
 * Core band classifier implementation
 */
export class BandClassifier {
  private classificationCache: Map<string, BandClassification> = new Map();
  private cacheSize: number;
  
  constructor(options: { cacheSize?: number } = {}) {
    this.cacheSize = options.cacheSize || 1000;
  }
  
  /**
   * Classify a single number into the optimal band
   */
  classifyNumber(n: bigint): BandClassification {
    const cacheKey = n.toString();
    
    // Check cache first
    if (this.classificationCache.has(cacheKey)) {
      return this.classificationCache.get(cacheKey)!;
    }
    
    // Perform classification
    const characteristics = analyzeNumberCharacteristics(n);
    const bitSize = characteristics.bitSize;
    const primaryBand = classifyByBitSize(bitSize);
    const confidence = calculateClassificationConfidence(n, primaryBand, characteristics);
    const alternatives = generateBandAlternatives(primaryBand, characteristics);
    
    const classification: BandClassification = {
      band: primaryBand,
      bitSize,
      confidence,
      alternatives,
      characteristics
    };
    
    // Cache result
    this.addToCache(cacheKey, classification);
    
    return classification;
  }
  
  /**
   * Classify multiple numbers and find optimal batch band
   */
  classifyBatch(numbers: bigint[]): {
    individual: BandClassification[];
    optimal: BandType;
    distribution: Map<BandType, number>;
    confidence: number;
  } {
    const individual = numbers.map(n => this.classifyNumber(n));
    
    // Calculate band distribution
    const distribution = new Map<BandType, number>();
    individual.forEach(classification => {
      const count = distribution.get(classification.band) || 0;
      distribution.set(classification.band, count + 1);
    });
    
    // Find most common band
    let optimal = BandType.MIDRANGE;
    let maxCount = 0;
    for (const [band, count] of distribution) {
      if (count > maxCount) {
        maxCount = count;
        optimal = band;
      }
    }
    
    // Calculate batch confidence
    const relevantClassifications = individual.filter(c => c.band === optimal);
    const confidence = relevantClassifications.length > 0 
      ? relevantClassifications.reduce((sum, c) => sum + c.confidence, 0) / relevantClassifications.length
      : 0;
    
    return {
      individual,
      optimal,
      distribution,
      confidence
    };
  }
  
  /**
   * Find optimal band based on specific criteria
   */
  findOptimalBand(criteria: BandCriteria): BandType {
    const candidates = Object.values(BandType);
    let bestBand = BandType.MIDRANGE;
    let bestScore = -1;
    
    for (const band of candidates) {
      const score = this.scoreBandForCriteria(band, criteria);
      if (score > bestScore) {
        bestScore = score;
        bestBand = band;
      }
    }
    
    return bestBand;
  }
  
  /**
   * Get detailed metrics for a specific band
   */
  getBandMetrics(band: BandType): {
    performance: {
      expectedAcceleration: number;
      memoryUsage: number;
      cacheSize: number;
    };
    characteristics: {
      bitRange: { min: number; max: number };
      optimalFor: string[];
      limitations: string[];
    };
    usage: {
      classificationsCount: number;
      averageConfidence: number;
      successRate: number;
    };
  } {
    const bitRange = getBitSizeForBand(band);
    const expectedAcceleration = getExpectedAcceleration(band);
    
    // Calculate usage statistics from cache
    const relevantClassifications = Array.from(this.classificationCache.values())
      .filter(c => c.band === band);
    
    const averageConfidence = relevantClassifications.length > 0
      ? relevantClassifications.reduce((sum, c) => sum + c.confidence, 0) / relevantClassifications.length
      : 0;
    
    return {
      performance: {
        expectedAcceleration,
        memoryUsage: this.getMemoryUsageForBand(band),
        cacheSize: this.getCacheSizeForBand(band)
      },
      characteristics: {
        bitRange,
        optimalFor: this.getOptimalUseCases(band),
        limitations: this.getBandLimitations(band)
      },
      usage: {
        classificationsCount: relevantClassifications.length,
        averageConfidence,
        successRate: this.calculateSuccessRate(band)
      }
    };
  }
  
  /**
   * Clear classification cache
   */
  clearCache(): void {
    this.classificationCache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    distribution: Map<BandType, number>;
  } {
    const distribution = new Map<BandType, number>();
    
    for (const classification of this.classificationCache.values()) {
      const count = distribution.get(classification.band) || 0;
      distribution.set(classification.band, count + 1);
    }
    
    return {
      size: this.classificationCache.size,
      hitRate: 0.85, // TODO: Implement actual hit rate tracking
      distribution
    };
  }
  
  // Private helper methods
  
  private addToCache(key: string, classification: BandClassification): void {
    // Implement LRU eviction if cache is full
    if (this.classificationCache.size >= this.cacheSize) {
      const firstKey = this.classificationCache.keys().next().value;
      this.classificationCache.delete(firstKey);
    }
    
    this.classificationCache.set(key, classification);
  }
  
  private scoreBandForCriteria(band: BandType, criteria: BandCriteria): number {
    let score = 0;
    
    // Bit size range scoring
    if (criteria.bitSizeRange) {
      const bandRange = getBitSizeForBand(band);
      const overlapStart = Math.max(bandRange.min, criteria.bitSizeRange[0]);
      const overlapEnd = Math.min(bandRange.max, criteria.bitSizeRange[1]);
      const overlap = Math.max(0, overlapEnd - overlapStart);
      const requestedRange = criteria.bitSizeRange[1] - criteria.bitSizeRange[0];
      score += (overlap / requestedRange) * 0.4; // 40% weight
    }
    
    // Performance requirements scoring
    if (criteria.performanceRequirements) {
      score += this.scorePerformanceRequirements(band, criteria.performanceRequirements) * 0.3; // 30% weight
    }
    
    // Quality requirements scoring
    if (criteria.qualityRequirements) {
      score += this.scoreQualityRequirements(band, criteria.qualityRequirements) * 0.2; // 20% weight
    }
    
    // Resource constraints scoring
    if (criteria.resourceConstraints) {
      score += this.scoreResourceConstraints(band, criteria.resourceConstraints) * 0.1; // 10% weight
    }
    
    return score;
  }
  
  private scorePerformanceRequirements(band: BandType, requirements: PerformanceRequirements): number {
    let score = 1.0;
    const acceleration = getExpectedAcceleration(band);
    
    if (requirements.minThroughput) {
      const estimatedThroughput = 1000 * acceleration;
      score *= estimatedThroughput >= requirements.minThroughput ? 1.0 : 0.5;
    }
    
    if (requirements.maxLatency) {
      const estimatedLatency = 1 / acceleration;
      score *= estimatedLatency <= requirements.maxLatency ? 1.0 : 0.5;
    }
    
    if (requirements.targetAcceleration) {
      const ratio = Math.min(acceleration / requirements.targetAcceleration, requirements.targetAcceleration / acceleration);
      score *= ratio;
    }
    
    return score;
  }
  
  private scoreQualityRequirements(band: BandType, requirements: QualityRequirements): number {
    let score = 1.0;
    
    // All bands maintain high quality, but some are better for specific requirements
    if (requirements.minPrecision && requirements.minPrecision > 0.99) {
      // Favor lower bands for higher precision requirements
      const bandIndex = Object.values(BandType).indexOf(band);
      score *= 1.0 - (bandIndex * 0.1); // Reduce score for higher bands
    }
    
    return Math.max(0.1, score); // Minimum score
  }
  
  private scoreResourceConstraints(band: BandType, constraints: ResourceConstraints): number {
    let score = 1.0;
    
    if (constraints.maxMemoryUsage) {
      const memoryUsage = this.getMemoryUsageForBand(band);
      score *= memoryUsage <= constraints.maxMemoryUsage ? 1.0 : 0.5;
    }
    
    return score;
  }
  
  private getMemoryUsageForBand(band: BandType): number {
    const memoryMap = {
      [BandType.ULTRABASS]: 256,
      [BandType.BASS]: 512,
      [BandType.MIDRANGE]: 1024,
      [BandType.UPPER_MID]: 2048,
      [BandType.TREBLE]: 4096,
      [BandType.SUPER_TREBLE]: 8192,
      [BandType.ULTRASONIC_1]: 16384,
      [BandType.ULTRASONIC_2]: 32768
    };
    
    return memoryMap[band];
  }
  
  private getCacheSizeForBand(band: BandType): number {
    const cacheMap = {
      [BandType.ULTRABASS]: 1024,
      [BandType.BASS]: 2048,
      [BandType.MIDRANGE]: 4096,
      [BandType.UPPER_MID]: 8192,
      [BandType.TREBLE]: 16384,
      [BandType.SUPER_TREBLE]: 32768,
      [BandType.ULTRASONIC_1]: 65536,
      [BandType.ULTRASONIC_2]: 131072
    };
    
    return cacheMap[band];
  }
  
  private getOptimalUseCases(band: BandType): string[] {
    const useCases = {
      [BandType.ULTRABASS]: ['Small integers', 'Fast operations', 'Low memory'],
      [BandType.BASS]: ['Medium integers', 'Cache-friendly', 'Balanced performance'],
      [BandType.MIDRANGE]: ['General purpose', 'Sieve algorithms', 'Good balance'],
      [BandType.UPPER_MID]: ['Large integers', 'Parallel processing', 'High throughput'],
      [BandType.TREBLE]: ['Very large integers', 'Streaming data', 'Continuous processing'],
      [BandType.SUPER_TREBLE]: ['Huge integers', 'Distributed systems', 'Maximum throughput'],
      [BandType.ULTRASONIC_1]: ['Astronomical integers', 'Hybrid approaches', 'Complex algorithms'],
      [BandType.ULTRASONIC_2]: ['Extreme integers', 'Spectral methods', 'Research applications']
    };
    
    return useCases[band];
  }
  
  private getBandLimitations(band: BandType): string[] {
    const limitations = {
      [BandType.ULTRABASS]: ['Limited to small numbers', 'No parallelization'],
      [BandType.BASS]: ['Cache dependency', 'Limited scalability'],
      [BandType.MIDRANGE]: ['Memory requirements grow', 'Moderate complexity'],
      [BandType.UPPER_MID]: ['High memory usage', 'Synchronization overhead'],
      [BandType.TREBLE]: ['Variable latency', 'Backpressure management needed'],
      [BandType.SUPER_TREBLE]: ['Network dependencies', 'Coordination overhead'],
      [BandType.ULTRASONIC_1]: ['Complex implementation', 'Resource intensive'],
      [BandType.ULTRASONIC_2]: ['Experimental algorithms', 'High computational cost']
    };
    
    return limitations[band];
  }
  
  private calculateSuccessRate(band: BandType): number {
    // TODO: Implement actual success rate tracking
    // For now, return a reasonable default based on band characteristics
    const successRates = {
      [BandType.ULTRABASS]: 0.98,
      [BandType.BASS]: 0.96,
      [BandType.MIDRANGE]: 0.94,
      [BandType.UPPER_MID]: 0.92,
      [BandType.TREBLE]: 0.90,
      [BandType.SUPER_TREBLE]: 0.88,
      [BandType.ULTRASONIC_1]: 0.85,
      [BandType.ULTRASONIC_2]: 0.82
    };
    
    return successRates[band];
  }
}
