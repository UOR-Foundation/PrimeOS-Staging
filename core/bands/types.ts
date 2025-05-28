/**
 * Band Optimization Types
 * ======================
 * 
 * Type definitions for the band optimization module implementing Axiom 5:
 * "Band optimization system providing performance across all number ranges"
 * 
 * Based on heterodyne prime-spectral filter bank approach with
 * automatic strategy selection and performance optimization.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState,
  ModelLifecycleState
} from '../../os/model/types';
import { Factor } from '../prime/types';
import { PrimeRegistryInterface } from '../prime';
import { EncodingInterface } from '../encoding/types';
import { StreamInterface } from '../stream/types';

/**
 * Band classification by bit size ranges
 */
export enum BandType {
  ULTRABASS = 'ultrabass',         // 16-32 bits
  BASS = 'bass',                   // 33-64 bits  
  MIDRANGE = 'midrange',           // 65-128 bits
  UPPER_MID = 'upper_mid',         // 129-256 bits
  TREBLE = 'treble',               // 257-512 bits
  SUPER_TREBLE = 'super_treble',   // 513-1024 bits
  ULTRASONIC_1 = 'ultrasonic_1',   // 1025-2048 bits
  ULTRASONIC_2 = 'ultrasonic_2'    // 2049-4096 bits
}

/**
 * Window function types for spectral processing
 */
export enum WindowFunction {
  RECTANGULAR = 'rectangular',     // Minimal processing overhead
  HAMMING = 'hamming',            // Balanced performance/precision
  BLACKMAN = 'blackman',          // High precision applications
  KAISER = 'kaiser',              // Adaptive precision control
  CUSTOM = 'custom'               // User-defined windows
}

/**
 * Processing strategy types for different bands
 */
export enum ProcessingStrategy {
  DIRECT_COMPUTATION = 'direct_computation',       // ULTRABASS
  CACHE_OPTIMIZED = 'cache_optimized',            // BASS
  SIEVE_BASED = 'sieve_based',                    // MIDRANGE
  PARALLEL_SIEVE = 'parallel_sieve',              // UPPER_MID
  STREAMING_PRIME = 'streaming_prime',            // TREBLE
  DISTRIBUTED_SIEVE = 'distributed_sieve',        // SUPER_TREBLE
  HYBRID_STRATEGY = 'hybrid_strategy',            // ULTRASONIC_1
  SPECTRAL_TRANSFORM = 'spectral_transform'       // ULTRASONIC_2
}

/**
 * Band configuration for optimization parameters
 */
export interface BandConfig {
  // Core configuration
  bitRange: {
    min: number;
    max: number;
  };
  
  // Prime processing
  primeModulus: bigint;                    // Optimized prime for this range
  processingStrategy: ProcessingStrategy;   // Computation approach
  
  // Spectral characteristics
  windowFunction: WindowFunction;          // Spectral characteristics
  latticeConfig: LatticeConfig;           // Dimensionality settings
  
  // Performance tuning
  crossoverThresholds: number[];          // Transition boundaries
  cacheSize: number;                      // Cache optimization
  parallelization: ParallelConfig;        // Parallel processing settings
  
  // Memory management
  memoryConfig: BandMemoryConfig;         // Memory usage settings
  
  // Quality metrics
  accelerationFactor: number;             // Expected performance gain
  qualityThreshold: number;               // Minimum quality requirement
}

/**
 * Lattice configuration for dimensionality
 */
export interface LatticeConfig {
  dimensions: number;                     // Lattice dimensionality
  basis: bigint[];                       // Lattice basis vectors
  reduction: 'LLL' | 'BKZ' | 'PSLQ';     // Reduction algorithm
  precision: number;                     // Precision requirements
}

/**
 * Parallel processing configuration
 */
export interface ParallelConfig {
  enabled: boolean;                      // Enable parallel processing
  threadCount: number;                   // Number of threads
  workDistribution: 'dynamic' | 'static'; // Work distribution strategy
  syncStrategy: 'lockfree' | 'mutex';    // Synchronization approach
  chunkSize: number;                     // Parallel chunk size
}

/**
 * Band-specific memory configuration
 */
export interface BandMemoryConfig {
  bufferSize: number;                    // Buffer size for band
  maxMemoryUsage: number;               // Maximum memory limit
  cacheStrategy: 'LRU' | 'LFU' | 'FIFO'; // Cache replacement strategy
  preloadSize: number;                  // Preload data size
}

/**
 * Spectral processing configuration
 */
export interface SpectralConfig {
  modulus: bigint;                       // NTT modulus for band
  primitiveRoot: bigint;                 // Primitive root for band
  windowSize: number;                    // Transform window size
  overlapFactor: number;                 // Window overlap (0.0-1.0)
  precisionBits: number;                 // Required precision
  transformType: 'NTT' | 'FFT' | 'DFT';  // Transform algorithm
}

/**
 * Band classification result
 */
export interface BandClassification {
  band: BandType;                        // Selected band
  bitSize: number;                       // Actual bit size
  confidence: number;                    // Classification confidence
  alternatives: BandType[];              // Alternative band choices
  characteristics: NumberCharacteristics; // Number properties
}

/**
 * Number characteristics for band selection
 */
export interface NumberCharacteristics {
  bitSize: number;                       // Number bit size
  magnitude: bigint;                     // Numerical magnitude
  primeDensity: number;                  // Estimated prime factor density
  factorizationComplexity: number;      // Expected factorization difficulty
  cacheLocality: number;                // Memory access pattern score
  parallelizationPotential: number;     // Parallel processing suitability
}

/**
 * Band performance metrics
 */
export interface BandMetrics {
  // Core performance
  throughput: number;                    // Operations per second
  latency: number;                       // Average operation latency
  memoryUsage: number;                   // Memory consumption
  cacheHitRate: number;                 // Cache efficiency
  accelerationFactor: number;           // Performance vs. baseline
  errorRate: number;                    // Operation error rate
  
  // Band-specific metrics
  primeGeneration: number;              // Primes generated per second
  factorizationRate: number;            // Numbers factorized per second
  spectralEfficiency: number;           // NTT transform efficiency
  distributionBalance: number;          // Load balancing effectiveness
  
  // Quality metrics
  precision: number;                    // Numerical precision maintained
  stability: number;                    // Algorithm stability
  convergence: number;                  // Convergence rate for iterative algorithms
}

/**
 * Band selector interface
 */
export interface BandSelector {
  // Primary selection
  selectBand(number: bigint): BandType;
  selectBandWithMetrics(number: bigint): BandClassification;
  
  // Multi-number optimization
  selectOptimalBand(numbers: bigint[]): BandType;
  selectOptimalBandWithAnalysis(numbers: bigint[]): BandOptimizationResult;
  
  // Dynamic adaptation
  adaptBandSelection(metrics: BandPerformanceMetrics): BandConfiguration;
  
  // Configuration
  configure(options: BandSelectorOptions): void;
  getConfiguration(): BandSelectorOptions;
}

/**
 * Band selector configuration
 */
export interface BandSelectorOptions {
  adaptiveThresholds: boolean;          // Enable adaptive thresholds
  performanceMonitoring: boolean;       // Monitor performance for optimization
  hysteresisMargin: number;            // Prevent oscillation between bands
  qualityThreshold: number;            // Minimum quality for selection
  cacheSize: number;                   // Classification cache size
}

/**
 * Band optimization result
 */
export interface BandOptimizationResult {
  selectedBand: BandType;               // Chosen band
  expectedPerformance: BandMetrics;     // Predicted performance
  confidence: number;                   // Selection confidence
  alternatives: Array<{
    band: BandType;
    score: number;
    tradeoffs: string[];
  }>;
  recommendations: string[];           // Optimization recommendations
}

/**
 * Band processor interface
 */
export interface BandProcessor {
  // Band-specific operations
  processInBand(data: bigint[], band: BandType): Promise<ProcessingResult>;
  
  // Strategy implementations
  processWithStrategy(data: bigint[], strategy: ProcessingStrategy): Promise<ProcessingResult>;
  
  // Performance optimization
  optimizeForBand(band: BandType): Promise<OptimizationResult>;
  
  // Configuration
  configureBand(band: BandType, config: BandConfig): void;
  getBandConfig(band: BandType): BandConfig;
}

/**
 * Processing result with performance data
 */
export interface ProcessingResult {
  data: any[];                          // Processed results
  metrics: BandMetrics;                 // Performance metrics
  band: BandType;                       // Band used for processing
  strategy: ProcessingStrategy;         // Strategy applied
  executionTime: number;               // Total execution time
  memoryUsed: number;                  // Memory consumed
  quality: QualityMetrics;             // Quality assessment
}

/**
 * Quality metrics for processing results
 */
export interface QualityMetrics {
  precision: number;                    // Numerical precision
  accuracy: number;                     // Result accuracy
  completeness: number;                 // Processing completeness
  consistency: number;                  // Result consistency
  reliability: number;                  // Reliability score
}

/**
 * Spectral transformer interface
 */
export interface SpectralTransformer {
  // Band-specific NTT operations
  transformForBand(data: number[], band: BandType): SpectralResult;
  inverseTransformForBand(spectrum: number[], band: BandType): number[];
  
  // Window functions
  applyWindow(data: number[], window: WindowFunction): number[];
  
  // Quality assessment
  measureTransformQuality(original: number[], reconstructed: number[]): QualityMetrics;
  
  // Configuration
  configureForBand(band: BandType): SpectralConfig;
  optimizeParameters(band: BandType, data: number[]): SpectralConfig;
}

/**
 * Spectral transform result
 */
export interface SpectralResult {
  forward: number[];                    // Forward transform result
  inverse?: number[];                   // Inverse transform (if computed)
  verified: boolean;                    // Round-trip verification status
  windowFunction: WindowFunction;       // Applied window function
  quality: number;                      // Transform quality score
  metadata: {
    transformTime: number;
    memoryUsed: number;
    precision: number;
  };
}

/**
 * Crossover management interface
 */
export interface CrossoverManager {
  // Transition detection
  detectTransition(current: BandType, data: bigint[]): TransitionEvent;
  
  // Smooth transitions
  transitionBetweenBands(
    fromBand: BandType, 
    toBand: BandType, 
    data: bigint[]
  ): TransitionResult;
  
  // Hybrid processing
  processInTransition(data: bigint[], bands: BandType[]): HybridResult;
  
  // Configuration
  configureCrossover(config: CrossoverConfig): void;
  getCrossoverMetrics(): CrossoverMetrics;
}

/**
 * Transition event information
 */
export interface TransitionEvent {
  fromBand: BandType;                   // Source band
  toBand: BandType;                     // Target band
  trigger: 'performance' | 'size' | 'quality' | 'manual'; // Transition trigger
  confidence: number;                   // Transition confidence
  expectedImprovement: number;          // Expected performance improvement
  transitionCost: number;              // Cost of transition
}

/**
 * Transition result
 */
export interface TransitionResult {
  success: boolean;                     // Transition success
  fromBand: BandType;                   // Source band
  toBand: BandType;                     // Target band
  transitionTime: number;              // Time taken for transition
  performanceImpact: number;           // Performance impact during transition
  qualityMaintained: boolean;          // Quality preservation
}

/**
 * Hybrid processing result
 */
export interface HybridResult {
  results: Map<BandType, ProcessingResult>; // Results per band
  combinedResult: any[];               // Combined final result
  optimalBand: BandType;               // Best performing band
  performanceComparison: BandMetrics[]; // Performance comparison
  recommendations: string[];           // Processing recommendations
}

/**
 * Crossover configuration
 */
export interface CrossoverConfig {
  strategy: 'immediate' | 'gradual' | 'hybrid'; // Transition strategy
  hysteresisMargin: number;            // Prevent oscillation between bands
  transitionWindow: number;            // Samples for transition detection
  qualityThreshold: number;            // Minimum quality for transition
  adaptiveThresholds: boolean;         // Dynamic threshold adjustment
  maxConcurrentBands: number;          // Maximum bands for hybrid processing
}

/**
 * Crossover metrics
 */
export interface CrossoverMetrics {
  transitionsPerformed: number;        // Total transitions
  averageTransitionTime: number;       // Average transition duration
  successRate: number;                 // Successful transition rate
  performanceImpact: number;          // Average performance impact
  oscillationCount: number;           // Band oscillation events
}

/**
 * Band performance monitor interface
 */
export interface BandPerformanceMonitor {
  // Real-time monitoring
  monitorBandPerformance(band: BandType): BandMetrics;
  
  // Optimization recommendations
  optimizeBandConfiguration(band: BandType): OptimizationSuggestions;
  
  // Adaptive optimization
  adaptBandParameters(band: BandType, metrics: BandMetrics): BandConfig;
  
  // Historical analysis
  getPerformanceHistory(band: BandType): PerformanceHistory[];
  analyzePerformanceTrends(band: BandType): TrendAnalysis;
}

/**
 * Optimization suggestions
 */
export interface OptimizationSuggestions {
  parameterAdjustments: ParameterAdjustment[];
  strategyChanges: StrategyRecommendation[];
  performanceImprovements: PerformanceImprovement[];
  resourceOptimizations: ResourceOptimization[];
}

/**
 * Parameter adjustment recommendation
 */
export interface ParameterAdjustment {
  parameter: string;                   // Parameter name
  currentValue: any;                   // Current value
  recommendedValue: any;               // Recommended value
  expectedImprovement: number;         // Expected improvement percentage
  confidence: number;                  // Recommendation confidence
  rationale: string;                   // Reasoning for adjustment
}

/**
 * Strategy recommendation
 */
export interface StrategyRecommendation {
  currentStrategy: ProcessingStrategy;  // Current strategy
  recommendedStrategy: ProcessingStrategy; // Recommended strategy
  expectedImprovement: number;         // Expected improvement percentage
  migrationCost: number;              // Cost of strategy change
  benefits: string[];                 // Benefits of change
  risks: string[];                    // Potential risks
}

/**
 * Performance improvement suggestion
 */
export interface PerformanceImprovement {
  area: 'throughput' | 'latency' | 'memory' | 'accuracy'; // Improvement area
  currentValue: number;               // Current performance
  targetValue: number;                // Target performance
  actionItems: string[];              // Required actions
  timeframe: string;                  // Implementation timeframe
  priority: 'low' | 'medium' | 'high'; // Priority level
}

/**
 * Resource optimization suggestion
 */
export interface ResourceOptimization {
  resource: 'cpu' | 'memory' | 'cache' | 'io'; // Resource type
  currentUsage: number;               // Current usage
  optimizedUsage: number;             // Optimized usage
  optimizationMethod: string;         // Optimization approach
  savings: number;                    // Expected savings
}

/**
 * Performance history entry
 */
export interface PerformanceHistory {
  timestamp: number;                  // Measurement timestamp
  metrics: BandMetrics;               // Performance metrics
  configuration: BandConfig;          // Configuration at time
  workload: WorkloadCharacteristics;  // Workload characteristics
  environment: EnvironmentInfo;       // Environment information
}

/**
 * Workload characteristics
 */
export interface WorkloadCharacteristics {
  dataSize: number;                   // Size of data processed
  dataType: string;                   // Type of data
  complexity: number;                 // Workload complexity
  distribution: string;               // Data distribution pattern
  concurrency: number;                // Concurrent operations
}

/**
 * Environment information
 */
export interface EnvironmentInfo {
  cpuCores: number;                   // CPU cores available
  memorySize: number;                 // Total memory
  cacheSize: number;                  // Cache size
  loadAverage: number;                // System load
  temperature?: number;               // System temperature
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  trends: {
    throughput: TrendData;
    latency: TrendData;
    memoryUsage: TrendData;
    errorRate: TrendData;
  };
  predictions: PerformancePrediction[];
  anomalies: AnomalyDetection[];
  recommendations: string[];
}

/**
 * Trend data
 */
export interface TrendData {
  direction: 'increasing' | 'decreasing' | 'stable';
  rate: number;                       // Rate of change
  confidence: number;                 // Trend confidence
  volatility: number;                 // Data volatility
  seasonality?: SeasonalPattern;      // Seasonal patterns
}

/**
 * Seasonal pattern
 */
export interface SeasonalPattern {
  period: number;                     // Pattern period
  amplitude: number;                  // Pattern amplitude
  phase: number;                      // Pattern phase
  confidence: number;                 // Pattern confidence
}

/**
 * Performance prediction
 */
export interface PerformancePrediction {
  metric: string;                     // Predicted metric
  timeHorizon: number;                // Prediction time horizon
  predictedValue: number;             // Predicted value
  confidenceInterval: [number, number]; // Confidence interval
  factors: string[];                  // Influencing factors
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetection {
  timestamp: number;                  // Anomaly timestamp
  metric: string;                     // Affected metric
  severity: 'low' | 'medium' | 'high' | 'critical'; // Severity level
  description: string;                // Anomaly description
  possibleCauses: string[];          // Possible causes
  recommendedActions: string[];      // Recommended actions
}

/**
 * Band registry interface
 */
export interface BandRegistry {
  // Configuration management
  registerBand(band: BandType, config: BandConfig): void;
  getBandConfig(band: BandType): BandConfig;
  updateBandConfig(band: BandType, updates: Partial<BandConfig>): void;
  
  // Band discovery
  findOptimalBand(criteria: BandCriteria): BandType;
  listAvailableBands(): BandType[];
  getBandCapabilities(band: BandType): BandCapabilities;
  
  // Performance tracking
  recordPerformance(band: BandType, metrics: BandMetrics): void;
  getPerformanceHistory(band: BandType): PerformanceHistory[];
}

/**
 * Band selection criteria
 */
export interface BandCriteria {
  bitSizeRange?: [number, number];    // Bit size range
  performanceRequirements?: PerformanceRequirements; // Performance needs
  qualityRequirements?: QualityRequirements; // Quality needs
  resourceConstraints?: ResourceConstraints; // Resource limitations
  preferredStrategies?: ProcessingStrategy[]; // Preferred strategies
}

/**
 * Performance requirements
 */
export interface PerformanceRequirements {
  minThroughput?: number;             // Minimum throughput requirement
  maxLatency?: number;                // Maximum acceptable latency
  targetAcceleration?: number;        // Target acceleration factor
  memoryLimit?: number;               // Memory usage limit
}

/**
 * Quality requirements
 */
export interface QualityRequirements {
  minPrecision?: number;              // Minimum precision requirement
  minAccuracy?: number;               // Minimum accuracy requirement
  errorTolerance?: number;            // Maximum error rate
  consistencyLevel?: number;          // Required consistency level
}

/**
 * Resource constraints
 */
export interface ResourceConstraints {
  maxMemoryUsage?: number;            // Maximum memory usage
  maxCpuUsage?: number;               // Maximum CPU usage
  maxCacheUsage?: number;             // Maximum cache usage
  powerBudget?: number;               // Power consumption budget
}

/**
 * Band capabilities
 */
export interface BandCapabilities {
  supportedStrategies: ProcessingStrategy[]; // Available strategies
  performanceRange: {
    minThroughput: number;
    maxThroughput: number;
    minLatency: number;
    maxLatency: number;
  };
  qualityRange: {
    minPrecision: number;
    maxPrecision: number;
    minAccuracy: number;
    maxAccuracy: number;
  };
  resourceUsage: {
    memoryRange: [number, number];
    cpuRange: [number, number];
    cacheRange: [number, number];
  };
  features: string[];                 // Special features
  limitations: string[];              // Known limitations
}

/**
 * Band configuration
 */
export interface BandConfiguration {
  band: BandType;                     // Band identifier
  config: BandConfig;                 // Band configuration
  performance: BandMetrics;           // Expected performance
  lastUpdated: number;                // Last update timestamp
  version: string;                    // Configuration version
}

/**
 * Band optimization configuration
 */
export interface BandsOptions extends ModelOptions {
  // Band configuration
  enabledBands?: BandType[];          // Active bands for processing
  defaultBand?: BandType;             // Default band selection
  autoOptimization?: boolean;         // Enable automatic optimization
  
  // Performance tuning
  optimizationInterval?: number;      // Optimization frequency (ms)
  performanceThreshold?: number;      // Trigger optimization threshold
  adaptiveThresholds?: boolean;       // Dynamic threshold adjustment
  
  // Spectral configuration
  enableSpectralTransforms?: boolean; // Enable NTT operations
  defaultWindowFunction?: WindowFunction; // Default window function
  spectralPrecision?: number;         // Spectral precision bits
  
  // Crossover management
  crossoverStrategy?: 'immediate' | 'gradual' | 'hybrid';
  hysteresisMargin?: number;          // Band switching hysteresis
  transitionWindow?: number;          // Transition detection window
  
  // Integration
  primeRegistry?: PrimeRegistryInterface;   // Prime operations
  encodingModule?: EncodingInterface;       // Chunk processing
  streamProcessor?: StreamInterface;        // Stream operations
  
  // Monitoring and logging
  enablePerformanceMonitoring?: boolean;   // Performance monitoring
  metricsRetentionPeriod?: number;         // Metrics retention period
  loggingLevel?: 'debug' | 'info' | 'warn' | 'error'; // Logging level
}

/**
 * Extended state for bands module
 */
export interface BandsState extends ModelState {
  // Configuration
  config: {
    enabledBands: BandType[];
    defaultBand: BandType;
    autoOptimization: boolean;
    optimizationInterval: number;
  };
  
  // Band registry
  registry: {
    registeredBands: Map<BandType, BandConfig>;
    activeConfigurations: Map<BandType, BandConfiguration>;
    lastOptimization: number;
  };
  
  // Performance metrics
  performance: {
    overallMetrics: BandPerformanceMetrics;
    bandMetrics: Map<BandType, BandMetrics>;
    crossoverMetrics: CrossoverMetrics;
  };
  
  // Optimization state
  optimization: {
    currentOptimizations: OptimizationTask[];
    completedOptimizations: number;
    averageOptimizationTime: number;
    lastSuggestions: OptimizationSuggestions;
  };
  
  // Processing state
  processing: {
    activeBands: Set<BandType>;
    transitionsInProgress: number;
    hybridProcessingActive: boolean;
    currentWorkload: WorkloadCharacteristics;
  };
}

/**
 * Band performance metrics aggregate
 */
export interface BandPerformanceMetrics {
  // Overall performance
  totalThroughput: number;            // Combined throughput across bands
  averageLatency: number;             // Average latency across bands
  totalMemoryUsage: number;           // Total memory usage
  overallErrorRate: number;           // Combined error rate
  
  // Band utilization
  bandUtilization: Map<BandType, number>; // Utilization per band
  optimalBandSelection: number;       // Percentage of optimal selections
  transitionOverhead: number;         // Overhead from transitions
  
  // Quality metrics
  averagePrecision: number;          // Average precision across bands
  averageAccuracy: number;           // Average accuracy across bands
  consistencyScore: number;          // Consistency across bands
}

/**
 * Optimization task
 */
export interface OptimizationTask {
  id: string;                        // Task identifier
  band: BandType;                    // Target band
  type: 'parameter' | 'strategy' | 'resource'; // Optimization type
  status: 'pending' | 'running' | 'completed' | 'failed'; // Task status
  startTime: number;                 // Start timestamp
  estimatedDuration: number;         // Estimated duration
  progress: number;                  // Completion percentage
  currentStep: string;               // Current optimization step
}

/**
 * Core interface for bands functionality
 */
export interface BandsInterface extends ModelInterface {
  // Core optimization operations
  optimizeForWorkload(workload: WorkloadProfile): Promise<OptimizationResult>;
  selectOptimalBand(data: bigint[]): Promise<BandType>;
  processInOptimalBand(data: bigint[]): Promise<ProcessingResult>;
  
  // Band management
  registerBand(band: BandType, config: BandConfig): void;
  getBandConfig(band: BandType): BandConfig;
  updateBandConfig(band: BandType, updates: Partial<BandConfig>): void;
  
  // Performance monitoring
  getPerformanceMetrics(): BandPerformanceMetrics;
  getBandStatistics(): Map<BandType, BandMetrics>;
  optimizeConfiguration(): Promise<OptimizationResult>;
  
  // Band selection
  createBandSelector(): BandSelector;
  createBandProcessor(): BandProcessor;
  createSpectralTransformer(): SpectralTransformer;
  createCrossoverManager(): CrossoverManager;
  
  // Registry access
  getBandRegistry(): BandRegistry;
  getPerformanceMonitor(): BandPerformanceMonitor;
  
  getLogger(): any;
  getState(): BandsState;
}

/**
 * Workload profile for optimization
 */
export interface WorkloadProfile {
  dataCharacteristics: {
    averageBitSize: number;
    bitSizeDistribution: Map<number, number>;
    dataTypes: string[];
    complexity: number;
  };
  performanceRequirements: PerformanceRequirements;
  qualityRequirements: QualityRequirements;
  resourceConstraints: ResourceConstraints;
  processingPatterns: {
    batchSize: number;
    frequency: number;
    concurrency: number;
    duration: number;
  };
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  success: boolean;                   // Optimization success
  improvementPercentage: number;      // Performance improvement
  newConfiguration: Map<BandType, BandConfig>; // Updated configurations
  benchmarkResults: BenchmarkResult[]; // Benchmark data
  recommendations: OptimizationSuggestions; // Further recommendations
  optimizationTime: number;          // Time taken for optimization
  resourcesUsed: ResourceUsage;      // Resources consumed during optimization
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  testName: string;                  // Benchmark test name
  band: BandType;                    // Tested band
  beforeMetrics: BandMetrics;        // Performance before optimization
  afterMetrics: BandMetrics;         // Performance after optimization
  improvement: number;               // Improvement factor
  testData: any[];                   // Test data used
  configuration: BandConfig;         // Configuration used
}

/**
 * Resource usage tracking
 */
export interface ResourceUsage {
  cpuTime: number;                   // CPU time consumed
  memoryPeak: number;                // Peak memory usage
  cacheUsage: number;                // Cache usage
  ioOperations: number;              // I/O operations performed
  networkTraffic?: number;           // Network traffic (if applicable)
}

/**
 * Result of bands operations
 */
export type BandsResult<T = unknown> = ModelResult<T>;

/**
 * Error types for band optimization
 */
export class BandOptimizationError extends Error {
  constructor(message: string, public band?: BandType, public operation?: string) {
    super(message);
    this.name = 'BandOptimizationError';
  }
}

export class BandTransitionError extends BandOptimizationError {
  constructor(message: string, public fromBand: BandType, public toBand: BandType) {
    super(message, fromBand, 'transition');
    this.name = 'BandTransitionError';
  }
}

export class SpectralTransformError extends BandOptimizationError {
  constructor(message: string, public transformType: string, public band?: BandType) {
    super(message, band, 'spectral_transform');
    this.name = 'SpectralTransformError';
  }
}

export class CrossoverError extends BandOptimizationError {
  constructor(message: string, public crossoverType: string) {
    super(message, undefined, 'crossover');
    this.name = 'CrossoverError';
  }
}

export class PerformanceOptimizationError extends BandOptimizationError {
  constructor(message: string, public optimizationType: string, public band?: BandType) {
    super(message, band, 'performance_optimization');
    this.name = 'PerformanceOptimizationError';
  }
}

export class BandConfigurationError extends BandOptimizationError {
  constructor(message: string, public configType: string, public band?: BandType) {
    super(message, band, 'configuration');
    this.name = 'BandConfigurationError';
  }
}
