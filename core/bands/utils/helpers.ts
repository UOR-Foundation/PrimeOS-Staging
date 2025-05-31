/**
 * Band Optimization Helper Functions
 * ==================================
 * 
 * Utility functions for band optimization operations.
 */

import { BandType, BandClassification, NumberCharacteristics, BandMetrics, QualityMetrics } from '../types';
import { BAND_CONSTANTS, PERFORMANCE_CONSTANTS, getBitSizeForBand } from './constants';

/**
 * Calculate the bit size of a BigInt number
 */
export function calculateBitSize(n: bigint): number {
  if (n === 0n) return 1;
  return n.toString(2).length;
}

/**
 * Classify a number into the appropriate band based on bit size
 */
export function classifyByBitSize(bitSize: number): BandType {
  for (const [band, range] of Object.entries(BAND_CONSTANTS.BIT_RANGES)) {
    if (bitSize >= range.min && bitSize <= range.max) {
      return band as BandType;
    }
  }
  
  // Fallback for out-of-range values
  if (bitSize < 16) return BandType.ULTRABASS;
  return BandType.ULTRASONIC_2;
}

/**
 * Analyze number characteristics for band selection
 */
export function analyzeNumberCharacteristics(n: bigint): NumberCharacteristics {
  const bitSize = calculateBitSize(n);
  const magnitude = n;
  
  // Estimate prime density based on bit size
  const primeDensity = estimatePrimeDensity(bitSize);
  
  // Estimate factorization complexity
  const factorizationComplexity = estimateFactorizationComplexity(bitSize);
  
  // Cache locality score (higher for smaller numbers)
  const cacheLocality = Math.max(0, 1 - (bitSize / 4096));
  
  // Parallelization potential (higher for larger numbers)
  const parallelizationPotential = Math.min(1, bitSize / 512);
  
  return {
    bitSize,
    magnitude,
    primeDensity,
    factorizationComplexity,
    cacheLocality,
    parallelizationPotential
  };
}

/**
 * Estimate prime density for a given bit size
 */
function estimatePrimeDensity(bitSize: number): number {
  // Using Prime Number Theorem approximation: π(n) ≈ n/ln(n)
  const n = Math.pow(2, bitSize);
  const density = 1 / Math.log(n);
  return Math.min(1, Math.max(0, density * 100)); // Normalize to [0,1]
}

/**
 * Estimate factorization complexity for a given bit size
 */
function estimateFactorizationComplexity(bitSize: number): number {
  // Exponential complexity growth
  const baseComplexity = Math.log2(bitSize) / 12; // Normalize base
  const exponentialFactor = Math.pow(1.1, bitSize / 32); // Exponential growth
  return Math.min(1, baseComplexity * exponentialFactor);
}

/**
 * Calculate confidence score for band classification
 */
export function calculateClassificationConfidence(
  n: bigint, 
  selectedBand: BandType, 
  characteristics: NumberCharacteristics
): number {
  const bitSize = characteristics.bitSize;
  const bandRange = getBitSizeForBand(selectedBand);
  
  // Base confidence from bit size fit
  let confidence = 0.5;
  
  // Perfect fit in range
  if (bitSize >= bandRange.min && bitSize <= bandRange.max) {
    const rangeSize = bandRange.max - bandRange.min;
    const position = (bitSize - bandRange.min) / rangeSize;
    
    // Higher confidence for center of range
    confidence = 0.7 + 0.3 * (1 - Math.abs(0.5 - position) * 2);
  }
  
  // Adjust based on characteristics
  confidence *= (1 + characteristics.cacheLocality * 0.1);
  confidence *= (1 + characteristics.parallelizationPotential * 0.1);
  confidence *= (1 - characteristics.factorizationComplexity * 0.1);
  
  return Math.min(1, Math.max(0, confidence));
}

/**
 * Create default band metrics
 */
export function createDefaultBandMetrics(band: BandType): BandMetrics {
  const expectedAcceleration = PERFORMANCE_CONSTANTS.ACCELERATION_FACTORS[band];
  const memoryUsage = PERFORMANCE_CONSTANTS.MEMORY_USAGE[band];
  
  return {
    throughput: 1000 * expectedAcceleration,
    latency: 1 / expectedAcceleration,
    memoryUsage,
    cacheHitRate: 0.8,
    accelerationFactor: expectedAcceleration,
    errorRate: 0.001,
    primeGeneration: 500 * expectedAcceleration,
    factorizationRate: 100 * expectedAcceleration,
    spectralEfficiency: 0.9,
    distributionBalance: 0.95,
    precision: 0.999,
    stability: 0.98,
    convergence: 0.95
  };
}

/**
 * Create default quality metrics
 */
export function createDefaultQualityMetrics(): QualityMetrics {
  return {
    precision: 0.999,
    accuracy: 0.99,
    completeness: 1.0,
    consistency: 0.95,
    reliability: 0.98
  };
}

/**
 * Merge quality metrics
 */
export function mergeQualityMetrics(metrics: QualityMetrics[]): QualityMetrics {
  if (metrics.length === 0) return createDefaultQualityMetrics();
  
  const combined = metrics.reduce((acc, metric) => ({
    precision: acc.precision + metric.precision,
    accuracy: acc.accuracy + metric.accuracy,
    completeness: acc.completeness + metric.completeness,
    consistency: acc.consistency + metric.consistency,
    reliability: acc.reliability + metric.reliability
  }), { precision: 0, accuracy: 0, completeness: 0, consistency: 0, reliability: 0 });
  
  const count = metrics.length;
  return {
    precision: combined.precision / count,
    accuracy: combined.accuracy / count,
    completeness: combined.completeness / count,
    consistency: combined.consistency / count,
    reliability: combined.reliability / count
  };
}

/**
 * Validate band configuration
 */
export function validateBandType(band: any): band is BandType {
  return Object.values(BandType).includes(band as BandType);
}

/**
 * Get neighboring bands for transition analysis
 */
export function getNeighboringBands(band: BandType): BandType[] {
  const bands = Object.values(BandType);
  const index = bands.indexOf(band);
  const neighbors: BandType[] = [];
  
  if (index > 0) neighbors.push(bands[index - 1]);
  if (index < bands.length - 1) neighbors.push(bands[index + 1]);
  
  return neighbors;
}

/**
 * Calculate distance between bands
 */
export function calculateBandDistance(band1: BandType, band2: BandType): number {
  const bands = Object.values(BandType);
  const index1 = bands.indexOf(band1);
  const index2 = bands.indexOf(band2);
  return Math.abs(index2 - index1);
}

/**
 * Estimate processing time for a given band and data size
 */
export function estimateProcessingTime(band: BandType, dataSize: number): number {
  const baseTime = 1; // 1ms base time
  const acceleration = PERFORMANCE_CONSTANTS.ACCELERATION_FACTORS[band];
  const complexity = Math.log(dataSize + 1);
  
  return (baseTime * complexity) / acceleration;
}

/**
 * Calculate memory requirements for band processing
 */
export function calculateMemoryRequirements(band: BandType, dataSize: number): number {
  const baseMemory = PERFORMANCE_CONSTANTS.MEMORY_USAGE[band];
  const scaleFactor = Math.log(dataSize + 1) / Math.log(1000); // Scale with log of data size
  
  return Math.ceil(baseMemory * (1 + scaleFactor));
}

/**
 * Format performance metrics for display
 */
export function formatPerformanceMetrics(metrics: BandMetrics): Record<string, string> {
  return {
    throughput: `${metrics.throughput.toFixed(0)} ops/sec`,
    latency: `${(metrics.latency * 1000).toFixed(2)} ms`,
    memoryUsage: `${(metrics.memoryUsage / 1024).toFixed(1)} KB`,
    accelerationFactor: `${metrics.accelerationFactor.toFixed(1)}x`,
    cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
    errorRate: `${(metrics.errorRate * 100).toFixed(3)}%`,
    precision: `${(metrics.precision * 100).toFixed(2)}%`,
    efficiency: `${(metrics.spectralEfficiency * 100).toFixed(1)}%`
  };
}

/**
 * Compare band performance
 */
export function compareBandPerformance(metrics1: BandMetrics, metrics2: BandMetrics): {
  better: 'first' | 'second' | 'equal';
  differences: Record<string, number>;
} {
  const throughputDiff = (metrics1.throughput - metrics2.throughput) / metrics2.throughput;
  const latencyDiff = (metrics2.latency - metrics1.latency) / metrics2.latency; // Lower is better
  const memoryDiff = (metrics2.memoryUsage - metrics1.memoryUsage) / metrics2.memoryUsage; // Lower is better
  const errorDiff = (metrics2.errorRate - metrics1.errorRate) / metrics2.errorRate; // Lower is better
  
  const score1 = throughputDiff + latencyDiff + memoryDiff + errorDiff;
  const score2 = -score1; // Inverse
  
  let better: 'first' | 'second' | 'equal' = 'equal';
  if (Math.abs(score1) > 0.05) { // 5% threshold
    better = score1 > score2 ? 'first' : 'second';
  }
  
  return {
    better,
    differences: {
      throughput: throughputDiff,
      latency: -latencyDiff, // Normalize so positive is better
      memory: memoryDiff,
      error: errorDiff
    }
  };
}

/**
 * Generate band selection alternatives
 */
export function generateBandAlternatives(
  primaryBand: BandType, 
  characteristics: NumberCharacteristics
): BandType[] {
  const alternatives: BandType[] = [];
  const neighbors = getNeighboringBands(primaryBand);
  
  // Add immediate neighbors
  alternatives.push(...neighbors);
  
  // Add based on characteristics
  if (characteristics.parallelizationPotential > 0.7) {
    // Favor parallel-capable bands
    if (!alternatives.includes(BandType.UPPER_MID)) alternatives.push(BandType.UPPER_MID);
    if (!alternatives.includes(BandType.SUPER_TREBLE)) alternatives.push(BandType.SUPER_TREBLE);
  }
  
  if (characteristics.cacheLocality > 0.8) {
    // Favor cache-optimized bands
    if (!alternatives.includes(BandType.BASS)) alternatives.push(BandType.BASS);
  }
  
  // Remove duplicates and primary band
  return alternatives.filter((band, index, arr) => 
    band !== primaryBand && arr.indexOf(band) === index
  );
}
