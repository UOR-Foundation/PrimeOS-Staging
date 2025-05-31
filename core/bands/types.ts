/**
 * Band Optimization Types
 * ======================
 * 
 * Type definitions for the band optimization system.
 */

import { BaseModel, ModelResult, ModelLifecycleState, ModelOptions } from '../../os/model';

/**
 * Band Types - Different frequency bands for optimization
 */
export enum BandType {
  ULTRABASS = 'ultrabass',
  BASS = 'bass', 
  MIDRANGE = 'midrange',
  UPPER_MID = 'upper_mid',
  TREBLE = 'treble',
  SUPER_TREBLE = 'super_treble',
  ULTRASONIC_1 = 'ultrasonic_1',
  ULTRASONIC_2 = 'ultrasonic_2'
}

/**
 * Processing strategies for different bands
 */
export enum ProcessingStrategy {
  DIRECT_COMPUTATION = 'direct_computation',
  CACHE_OPTIMIZED = 'cache_optimized',
  SIEVE_BASED = 'sieve_based',
  PARALLEL_SIEVE = 'parallel_sieve',
  STREAMING_PRIME = 'streaming_prime',
  DISTRIBUTED_SIEVE = 'distributed_sieve',
  HYBRID_STRATEGY = 'hybrid_strategy',
  SPECTRAL_TRANSFORM = 'spectral_transform'
}

/**
 * Window functions for spectral processing
 */
export enum WindowFunction {
  RECTANGULAR = 'rectangular',
  HAMMING = 'hamming',
  BLACKMAN = 'blackman',
  KAISER = 'kaiser',
  CUSTOM = 'custom'
}

/**
 * Number characteristics for analysis
 */
export interface NumberCharacteristics {
  bitSize: number;
  magnitude: bigint;
  primeDensity: number;
  factorizationComplexity: number;
  cacheLocality: number;
  parallelizationPotential: number;
}

/**
 * Band classification result
 */
export interface BandClassification {
  band: BandType;
  bitSize: number;
  confidence: number;
  alternatives: BandType[];
  characteristics: NumberCharacteristics;
}

/**
 * Performance requirements
 */
export interface PerformanceRequirements {
  minThroughput?: number;
  maxLatency?: number;
  targetAcceleration?: number;
  memoryConstraints?: number;
}

/**
 * Quality requirements
 */
export interface QualityRequirements {
  minPrecision?: number;
  minAccuracy?: number;
  minCompleteness?: number;
  minConsistency?: number;
  minReliability?: number;
}

/**
 * Resource constraints
 */
export interface ResourceConstraints {
  maxMemoryUsage?: number;
  maxCpuUsage?: number;
  maxNetworkUsage?: number;
  timeConstraints?: number;
}

/**
 * Band selection criteria
 */
export interface BandCriteria {
  bitSizeRange?: [number, number];
  performanceRequirements?: PerformanceRequirements;
  qualityRequirements?: QualityRequirements;
  resourceConstraints?: ResourceConstraints;
  workloadCharacteristics?: any;
}

/**
 * Band performance metrics
 */
export interface BandMetrics {
  throughput: number;
  latency: number;
  memoryUsage: number;
  cacheHitRate: number;
  accelerationFactor: number;
  errorRate: number;
  primeGeneration: number;
  factorizationRate: number;
  spectralEfficiency: number;
  distributionBalance: number;
  precision: number;
  stability: number;
  convergence: number;
}

/**
 * Quality metrics
 */
export interface QualityMetrics {
  precision: number;
  accuracy: number;
  completeness: number;
  consistency: number;
  reliability: number;
}

/**
 * Lattice configuration
 */
export interface LatticeConfig {
  dimensions: number;
  basis: bigint[];
  reduction: 'LLL' | 'BKZ' | 'DEEP_LLL';
  precision: number;
}

/**
 * Parallelization configuration
 */
export interface ParallelizationConfig {
  enabled: boolean;
  threadCount: number;
  workDistribution: 'static' | 'dynamic' | 'work_stealing';
  syncStrategy: 'locks' | 'lockfree' | 'channels';
  chunkSize: number;
}

/**
 * Memory configuration
 */
export interface MemoryConfig {
  bufferSize: number;
  maxMemoryUsage: number;
  cacheStrategy: 'LRU' | 'LFU' | 'FIFO' | 'RANDOM';
  preloadSize: number;
}

/**
 * Band configuration
 */
export interface BandConfig {
  bitRange: { min: number; max: number };
  primeModulus: bigint;
  processingStrategy: ProcessingStrategy;
  windowFunction: WindowFunction;
  latticeConfig: LatticeConfig;
  crossoverThresholds: number[];
  cacheSize: number;
  parallelization: ParallelizationConfig;
  memoryConfig: MemoryConfig;
  accelerationFactor: number;
  qualityThreshold: number;
}

/**
 * Band capabilities
 */
export interface BandCapabilities {
  operations: string[];
  maxBitSize: number;
  minBitSize: number;
  parallelization: boolean;
  spectralProcessing: boolean;
  streamingSupport: boolean;
  cacheOptimization: boolean;
  approximateComputation: boolean;
  distributedProcessing: boolean;
  memoryRequirements: number;
  computationalComplexity: 'low' | 'medium' | 'high' | 'very_high';
}

/**
 * Performance history entry
 */
export interface PerformanceHistoryEntry {
  timestamp: number;
  metrics: BandMetrics;
  configuration: BandConfig;
  workload: any;
  environment: any;
}

/**
 * Performance history
 */
export interface PerformanceHistory {
  timestamp: number;
  metrics: BandMetrics;
  configuration: BandConfig;
  workload: any;
  environment: any;
}

/**
 * Band registry interface
 */
export interface BandRegistry {
  registerBand(band: BandType, config: BandConfig): void;
  getBandConfig(band: BandType): BandConfig;
  getRegisteredBands(): BandType[];
  getBandCapabilities(band: BandType): BandCapabilities;
  updatePerformanceHistory(band: BandType, metrics: BandMetrics): void;
  getPerformanceHistory(band: BandType): PerformanceHistory[];
  findOptimalBand(criteria: BandCriteria): BandType;
  findMatchingBands(criteria: BandCriteria): Array<{ band: BandType; score: number }>;
  validateRegistry(): { valid: boolean; issues: string[] };
  clear(): void;
}

/**
 * Band optimization result
 */
export interface BandOptimizationResult {
  selectedBand: BandType;
  expectedPerformance: BandMetrics;
  confidence: number;
  alternatives: Array<{
    band: BandType;
    score: number;
    tradeoffs: string[];
  }>;
  recommendations: string[];
}

/**
 * Band configuration with metadata
 */
export interface BandConfiguration {
  band: BandType;
  config: BandConfig;
  performance: BandMetrics;
  lastUpdated: number;
  version: string;
}

/**
 * Band selector options
 */
export interface BandSelectorOptions {
  adaptiveThresholds?: boolean;
  performanceMonitoring?: boolean;
  hysteresisMargin?: number;
  qualityThreshold?: number;
  cacheSize?: number;
}

/**
 * Band performance metrics aggregated across bands
 */
export interface BandPerformanceMetrics {
  bandUtilization: Map<BandType, number>;
  overallErrorRate: number;
  transitionOverhead: number;
  optimalBandSelection: number;
  averageAccuracy: number;
}

/**
 * Band selector interface
 */
export interface BandSelector {
  selectBand(number: bigint): BandType;
  selectBandWithMetrics(number: bigint): BandClassification;
  selectOptimalBand(numbers: bigint[]): BandType;
  selectOptimalBandWithAnalysis(numbers: bigint[]): BandOptimizationResult;
  adaptBandSelection(metrics: BandPerformanceMetrics): BandConfiguration;
  configure(options: BandSelectorOptions): void;
  getConfiguration(): BandSelectorOptions;
}

/**
 * Processing context for strategy processors
 */
export interface ProcessingContext {
  band: BandType;
  bitSize: number;
  workload: any;
  resources: any;
  constraints: ResourceConstraints;
}

/**
 * Processing result from strategy processors
 */
export interface ProcessingResult {
  success: boolean;
  result?: any;
  metrics: BandMetrics;
  quality: QualityMetrics;
  error?: string;
}

/**
 * Strategy processor interface
 */
export interface StrategyProcessor {
  process(input: any, context: ProcessingContext): Promise<ProcessingResult>;
  supports(band: BandType): boolean;
  getConfiguration(): any;
  updateConfiguration(config: any): void;
}

/**
 * Crossover manager interface
 */
export interface CrossoverManager {
  shouldTransition(fromBand: BandType, toBand: BandType, metrics: BandMetrics): boolean;
  performTransition(fromBand: BandType, toBand: BandType, data: any): Promise<any>;
  getTransitionCost(fromBand: BandType, toBand: BandType): number;
  optimizeThresholds(performanceData: any[]): void;
}

/**
 * Spectral processor interface
 */
export interface SpectralProcessor {
  transform(data: number[], band: BandType): Promise<number[]>;
  inverseTransform(data: number[], band: BandType): Promise<number[]>;
  analyzeSpectrum(data: number[]): any;
  optimizeParameters(band: BandType): void;
}

/**
 * Band optimization options
 */
export interface BandOptimizationOptions extends ModelOptions {
  enableAdaptiveThresholds?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableSpectralProcessing?: boolean;
  enableCrossoverOptimization?: boolean;
}

/**
 * Band optimization state
 */
export interface BandOptimizationState {
  lifecycle: ModelLifecycleState;
  lastStateChangeTime: number;
  uptime: number;
  operationCount: {
    total: number;
    success: number;
    failed: number;
  };
  custom?: any;
  currentBand?: BandType;
  bandMetrics: Map<BandType, BandMetrics>;
  transitionHistory: any[];
  optimizationLevel: number;
}

/**
 * Band optimization interface
 */
export interface BandOptimizationInterface {
  classifyNumber(n: bigint): Promise<BandClassification>;
  optimizeBatch(numbers: bigint[]): Promise<BandOptimizationResult>;
  updateConfiguration(band: BandType, config: BandConfig): Promise<void>;
  getPerformanceMetrics(): Promise<BandPerformanceMetrics>;
  resetOptimization(): Promise<void>;
  initialize(): Promise<ModelResult<unknown>>;
  terminate(): Promise<ModelResult<unknown>>;
  getState(): BandOptimizationState;
}

/**
 * Band optimization process input
 */
export interface BandOptimizationProcessInput {
  operation: 'classify' | 'optimize' | 'configure' | 'analyze' | 'reset';
  data?: any;
  config?: BandConfig;
  band?: BandType;
  numbers?: bigint[];
  criteria?: BandCriteria;
}
