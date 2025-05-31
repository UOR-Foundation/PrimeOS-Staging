/**
 * Performance Optimizer Implementation
 * ===================================
 * 
 * Production implementation of performance optimization for stream processing.
 * Provides adaptive algorithms, bottleneck detection, and automated tuning.
 */

import { 
  StreamOptimizer, 
  StreamPerformanceMetrics, 
  BufferConfig, 
  OptimizationStrategy,
  PerformanceReport,
  PerformanceHistory,
  OptimizationSuggestion,
  BottleneckAnalysis
} from '../types';
import { getMemoryStats } from '../utils/memory-utils';

export interface PerformanceOptimizerConfig {
  enabled?: boolean;
  strategy?: OptimizationStrategy;
  enableProfiling?: boolean;
  enableAutoTuning?: boolean;
  profilingInterval?: number;
  optimizationInterval?: number;
  enableDetailedLogging?: boolean;
  maxConcurrency?: number;
  minChunkSize?: number;
  maxChunkSize?: number;
}

export interface BottleneckInfo {
  stage: string;
  type: BottleneckType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number;
  suggestedFix: string;
}

export enum BottleneckType {
  CPU = 'CPU',
  MEMORY = 'MEMORY',
  IO = 'IO',
  CONCURRENCY = 'CONCURRENCY',
  BUFFER = 'BUFFER',
  ALGORITHM = 'ALGORITHM'
}

interface TrendData {
  timestamp: number;
  metric: string;
  value: number;
}

interface MetricsHistory {
  throughput: number[];
  latency: number[];
  memoryUsage: number[];
  errorRate: number[];
  cpuUsage: number[];
  timestamps: number[];
}

export class PerformanceOptimizerImpl implements StreamOptimizer {
  private config: Required<PerformanceOptimizerConfig>;
  private strategy: OptimizationStrategy;
  private logger?: any;
  
  // Metrics tracking
  private metricsHistory: MetricsHistory = {
    throughput: [],
    latency: [],
    memoryUsage: [],
    errorRate: [],
    cpuUsage: [],
    timestamps: []
  };
  
  // Performance statistics
  private currentMetrics?: StreamPerformanceMetrics;
  private peakThroughput = 0;
  private averageThroughput = 0;
  private averageLatency = 0;
  private totalMetricsCount = 0;
  private throughputSum = 0;
  private latencySum = 0;
  
  // Optimization state
  private profilingEnabled = false;
  private autoTuningEnabled = false;
  private profilingTimer?: NodeJS.Timeout;
  private optimizationTimer?: NodeJS.Timeout;
  private lastOptimizationTime = 0;
  
  // Adaptive learning
  private optimizationResults: Array<{
    action: string;
    beforeMetrics: StreamPerformanceMetrics;
    afterMetrics?: StreamPerformanceMetrics;
    improvement: number;
    timestamp: number;
  }> = [];
  
  constructor(config: PerformanceOptimizerConfig = {}, options: any = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      strategy: config.strategy ?? OptimizationStrategy.BALANCED,
      enableProfiling: config.enableProfiling ?? false,
      enableAutoTuning: config.enableAutoTuning ?? false,
      profilingInterval: config.profilingInterval ?? 1000,
      optimizationInterval: config.optimizationInterval ?? 5000,
      enableDetailedLogging: config.enableDetailedLogging ?? false,
      maxConcurrency: config.maxConcurrency ?? 16,
      minChunkSize: config.minChunkSize ?? 256,
      maxChunkSize: config.maxChunkSize ?? 64 * 1024
    };
    
    this.strategy = this.config.strategy;
    this.logger = options.logger;
    
    // Start profiling if enabled
    if (this.config.enableProfiling) {
      this.enableProfiling();
    }
    
    // Start auto-tuning if enabled
    if (this.config.enableAutoTuning) {
      this.enableAutoTuning();
    }
  }
  
  adaptChunkSize(metrics: StreamPerformanceMetrics): number {
    this.updateMetricsHistory(metrics);
    
    let targetSize = 4096; // Default starting point
    
    switch (this.strategy) {
      case OptimizationStrategy.THROUGHPUT:
        targetSize = this.optimizeForThroughput(metrics);
        break;
        
      case OptimizationStrategy.LATENCY:
        targetSize = this.optimizeForLatency(metrics);
        break;
        
      case OptimizationStrategy.MEMORY:
        targetSize = this.optimizeForMemory(metrics);
        break;
        
      case OptimizationStrategy.BALANCED:
        targetSize = this.optimizeBalanced(metrics);
        break;
        
      case OptimizationStrategy.CUSTOM:
        targetSize = this.customOptimization(metrics);
        break;
    }
    
    // Apply bounds
    return Math.max(this.config.minChunkSize, Math.min(targetSize, this.config.maxChunkSize));
  }
  
  optimizeConcurrency(metrics: StreamPerformanceMetrics): number {
    const baselineConcurrency = 4;
    let concurrency = baselineConcurrency;
    
    // CPU-based adjustment
    if (metrics.cpuUsage !== undefined) {
      if (metrics.cpuUsage > 0.9) {
        concurrency = Math.max(1, Math.floor(concurrency * 0.7));
      } else if (metrics.cpuUsage < 0.5) {
        concurrency = Math.min(this.config.maxConcurrency, Math.floor(concurrency * 1.3));
      }
    }
    
    // Error rate adjustment
    if (metrics.errorRate > 0.05) { // 5% error threshold
      concurrency = Math.max(1, Math.floor(concurrency * 0.8));
    }
    
    // Memory pressure adjustment
    if (metrics.memoryUsage !== undefined) {
      const memoryStats = getMemoryStats();
      if (memoryStats) {
        const memoryRatio = metrics.memoryUsage / memoryStats.total;
        if (memoryRatio > 0.8) {
          concurrency = Math.max(1, Math.floor(concurrency * 0.7));
        }
      }
    }
    
    // Throughput-based fine tuning
    if (metrics.throughput < 100) { // Very low throughput
      concurrency = Math.max(1, concurrency - 1);
    } else if (metrics.throughput > 1000 && metrics.cpuUsage < 0.7) {
      concurrency = Math.min(this.config.maxConcurrency, concurrency + 1);
    }
    
    return Math.max(1, Math.min(this.config.maxConcurrency, concurrency));
  }
  
  adjustBufferSizes(metrics: StreamPerformanceMetrics): BufferConfig {
    const memoryStats = getMemoryStats();
    const memoryPressure = memoryStats ? metrics.memoryUsage / memoryStats.total : 0.5;
    
    let inputBufferSize = 8192;
    let outputBufferSize = 8192;
    let intermediateBufferSize = 4096;
    let backpressureThreshold = 0.8;
    
    // Adjust based on memory pressure
    if (memoryPressure > 0.8) {
      // High memory pressure - reduce buffers
      inputBufferSize = 4096;
      outputBufferSize = 4096;
      intermediateBufferSize = 2048;
      backpressureThreshold = 0.6;
    } else if (memoryPressure < 0.5) {
      // Low memory pressure - increase buffers for better performance
      inputBufferSize = 16384;
      outputBufferSize = 16384;
      intermediateBufferSize = 8192;
      backpressureThreshold = 0.9;
    }
    
    // Adjust based on throughput requirements
    if (metrics.throughput < 200) {
      // Low throughput - increase buffers to improve batching
      inputBufferSize *= 1.5;
      outputBufferSize *= 1.5;
    }
    
    // Adjust based on latency requirements
    if (metrics.latency > 100) {
      // High latency - reduce buffers to minimize delays
      inputBufferSize = Math.max(2048, inputBufferSize * 0.7);
      outputBufferSize = Math.max(2048, outputBufferSize * 0.7);
      intermediateBufferSize = Math.max(1024, intermediateBufferSize * 0.7);
    }
    
    // Strategy-specific adjustments
    switch (this.strategy) {
      case OptimizationStrategy.LATENCY:
        inputBufferSize *= 0.8;
        outputBufferSize *= 0.8;
        backpressureThreshold = 0.7;
        break;
        
      case OptimizationStrategy.THROUGHPUT:
        inputBufferSize *= 1.2;
        outputBufferSize *= 1.2;
        backpressureThreshold = 0.9;
        break;
        
      case OptimizationStrategy.MEMORY:
        inputBufferSize *= 0.7;
        outputBufferSize *= 0.7;
        intermediateBufferSize *= 0.7;
        backpressureThreshold = 0.6;
        break;
    }
    
    return {
      inputBufferSize: Math.floor(inputBufferSize),
      outputBufferSize: Math.floor(outputBufferSize),
      intermediateBufferSize: Math.floor(intermediateBufferSize),
      backpressureThreshold: Math.max(0.1, Math.min(1.0, backpressureThreshold))
    };
  }
  
  enableProfiling(): void {
    if (this.profilingEnabled) return;
    
    this.profilingEnabled = true;
    
    this.profilingTimer = setInterval(() => {
      this.collectProfilingData();
    }, this.config.profilingInterval);
    
    if (this.logger && this.config.enableDetailedLogging) {
      this.logger.debug('Performance profiling enabled').catch(() => {});
    }
  }
  
  disableProfiling(): void {
    if (!this.profilingEnabled) return;
    
    this.profilingEnabled = false;
    
    if (this.profilingTimer) {
      clearInterval(this.profilingTimer);
      this.profilingTimer = undefined;
    }
    
    if (this.logger && this.config.enableDetailedLogging) {
      this.logger.debug('Performance profiling disabled').catch(() => {});
    }
  }
  
  getPerformanceReport(): PerformanceReport {
    const bottlenecks = this.detectBottlenecks();
    const recommendations = this.generateRecommendations();
    const trends = this.generateTrendData();
    
    return {
      summary: {
        averageThroughput: this.averageThroughput,
        peakThroughput: this.peakThroughput,
        averageLatency: this.averageLatency,
        errorRate: this.currentMetrics?.errorRate || 0
      },
      bottlenecks,
      recommendations,
      historicalTrends: trends
    };
  }
  
  suggestOptimizations(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    
    if (!this.currentMetrics) {
      return suggestions;
    }
    
    const metrics = this.currentMetrics;
    
    // Throughput suggestions
    if (metrics.throughput < 300) {
      suggestions.push({
        type: 'configuration',
        priority: 'high',
        description: 'Low throughput detected. Consider increasing chunk sizes and concurrency.',
        expectedImprovement: 25,
        implementation: 'Increase chunk size to 8KB and concurrency to 8 threads'
      });
    }
    
    // Latency suggestions
    if (metrics.latency > 50) {
      suggestions.push({
        type: 'configuration',
        priority: 'medium',
        description: 'High latency detected. Consider reducing buffer sizes.',
        expectedImprovement: 15,
        implementation: 'Reduce buffer sizes by 30% and enable faster processing'
      });
    }
    
    // Memory suggestions
    if (metrics.memoryUsage > 400 * 1024 * 1024) {
      suggestions.push({
        type: 'resource',
        priority: 'high',
        description: 'High memory usage detected. Consider reducing buffer sizes and enabling GC.',
        expectedImprovement: 20,
        implementation: 'Reduce buffer allocation by 25% and trigger garbage collection'
      });
    }
    
    // Error rate suggestions
    if (metrics.errorRate > 0.02) {
      suggestions.push({
        type: 'configuration',
        priority: 'critical',
        description: 'High error rate detected. Consider reducing concurrency and increasing retry logic.',
        expectedImprovement: 40,
        implementation: 'Reduce concurrency by 50% and add exponential backoff retry'
      });
    }
    
    // CPU usage suggestions
    if (metrics.cpuUsage && metrics.cpuUsage > 0.9) {
      suggestions.push({
        type: 'resource',
        priority: 'high',
        description: 'High CPU usage detected. Consider reducing concurrency.',
        expectedImprovement: 30,
        implementation: 'Reduce concurrency to 4 threads and optimize algorithms'
      });
    }
    
    // Cache hit rate suggestions
    if (metrics.cacheHitRate && metrics.cacheHitRate < 0.7) {
      suggestions.push({
        type: 'algorithm',
        priority: 'medium',
        description: 'Low cache hit rate detected. Consider increasing cache size or improving locality.',
        expectedImprovement: 18,
        implementation: 'Increase cache size by 50% and implement LRU eviction'
      });
    }
    
    return suggestions;
  }
  
  setOptimizationStrategy(strategy: OptimizationStrategy): void {
    const oldStrategy = this.strategy;
    this.strategy = strategy;
    
    if (this.logger && this.config.enableDetailedLogging) {
      this.logger.debug('Optimization strategy changed', { from: oldStrategy, to: strategy }).catch(() => {});
    }
  }
  
  getOptimizationStrategy(): OptimizationStrategy {
    return this.strategy;
  }
  
  updateMetrics(metrics: StreamPerformanceMetrics): void {
    this.currentMetrics = metrics;
    this.updatePerformanceStatistics(metrics);
  }
  
  stop(): void {
    this.disableProfiling();
    this.disableAutoTuning();
    
    if (this.logger && this.config.enableDetailedLogging) {
      this.logger.debug('Performance optimizer stopped').catch(() => {});
    }
  }
  
  /**
   * Enable automatic performance tuning
   */
  private enableAutoTuning(): void {
    if (this.autoTuningEnabled) return;
    
    this.autoTuningEnabled = true;
    
    this.optimizationTimer = setInterval(() => {
      this.performAutoOptimization();
    }, this.config.optimizationInterval);
    
    if (this.logger && this.config.enableDetailedLogging) {
      this.logger.debug('Auto-tuning enabled').catch(() => {});
    }
  }
  
  /**
   * Disable automatic performance tuning
   */
  private disableAutoTuning(): void {
    if (!this.autoTuningEnabled) return;
    
    this.autoTuningEnabled = false;
    
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = undefined;
    }
    
    if (this.logger && this.config.enableDetailedLogging) {
      this.logger.debug('Auto-tuning disabled').catch(() => {});
    }
  }
  
  /**
   * Optimize chunk size for throughput strategy
   */
  private optimizeForThroughput(metrics: StreamPerformanceMetrics): number {
    let size = 4096;
    
    // Increase chunk size for higher throughput, but consider memory limits
    if (metrics.throughput < 500) {
      size = 8192; // Larger chunks for better throughput
    }
    
    if (metrics.memoryUsage < 200 * 1024 * 1024) { // Low memory usage
      size *= 1.5; // Even larger chunks
    }
    
    return Math.floor(size);
  }
  
  /**
   * Optimize chunk size for latency strategy
   */
  private optimizeForLatency(metrics: StreamPerformanceMetrics): number {
    let size = 2048; // Start smaller for lower latency
    
    // Reduce chunk size if latency is high
    if (metrics.latency > 30) {
      size = 1024;
    }
    
    // But don't go too small if throughput suffers
    if (metrics.throughput < 200) {
      size = Math.max(size, 2048);
    }
    
    return Math.floor(size);
  }
  
  /**
   * Optimize chunk size for memory strategy
   */
  private optimizeForMemory(metrics: StreamPerformanceMetrics): number {
    const memoryStats = getMemoryStats();
    const memoryPressure = memoryStats ? metrics.memoryUsage / memoryStats.total : 0.5;
    
    let size = 2048; // Conservative default
    
    if (memoryPressure > 0.8) {
      size = 1024; // Very small chunks under memory pressure
    } else if (memoryPressure < 0.4) {
      size = 4096; // Can afford larger chunks
    }
    
    return Math.floor(size);
  }
  
  /**
   * Optimize chunk size for balanced strategy
   */
  private optimizeBalanced(metrics: StreamPerformanceMetrics): number {
    const memoryStats = getMemoryStats();
    const memoryPressure = memoryStats ? metrics.memoryUsage / memoryStats.total : 0.5;
    
    let size = 4096; // Balanced default
    
    // Balance throughput and latency considerations
    const throughputWeight = Math.min(metrics.throughput / 1000, 1);
    const latencyWeight = Math.max(0, 1 - metrics.latency / 100);
    const memoryWeight = Math.max(0, 1 - memoryPressure);
    
    const totalWeight = (throughputWeight + latencyWeight + memoryWeight) / 3;
    size = Math.floor(size * (0.5 + totalWeight * 0.5));
    
    return size;
  }
  
  /**
   * Custom optimization algorithm (placeholder for future extension)
   */
  private customOptimization(metrics: StreamPerformanceMetrics): number {
    // For now, use balanced approach
    return this.optimizeBalanced(metrics);
  }
  
  /**
   * Update metrics history for trend analysis
   */
  private updateMetricsHistory(metrics: StreamPerformanceMetrics): void {
    const maxHistorySize = 100;
    
    this.metricsHistory.throughput.push(metrics.throughput);
    this.metricsHistory.latency.push(metrics.latency);
    this.metricsHistory.memoryUsage.push(metrics.memoryUsage);
    this.metricsHistory.errorRate.push(metrics.errorRate);
    this.metricsHistory.timestamps.push(Date.now());
    
    if (metrics.cpuUsage !== undefined) {
      this.metricsHistory.cpuUsage.push(metrics.cpuUsage);
    }
    
    // Limit history size
    if (this.metricsHistory.throughput.length > maxHistorySize) {
      this.metricsHistory.throughput.shift();
      this.metricsHistory.latency.shift();
      this.metricsHistory.memoryUsage.shift();
      this.metricsHistory.errorRate.shift();
      this.metricsHistory.timestamps.shift();
      
      if (this.metricsHistory.cpuUsage.length > 0) {
        this.metricsHistory.cpuUsage.shift();
      }
    }
  }
  
  /**
   * Update performance statistics
   */
  private updatePerformanceStatistics(metrics: StreamPerformanceMetrics): void {
    this.totalMetricsCount++;
    this.throughputSum += metrics.throughput;
    this.latencySum += metrics.latency;
    
    this.averageThroughput = this.throughputSum / this.totalMetricsCount;
    this.averageLatency = this.latencySum / this.totalMetricsCount;
    this.peakThroughput = Math.max(this.peakThroughput, metrics.throughput);
  }
  
  /**
   * Collect profiling data
   */
  private collectProfilingData(): void {
    if (!this.currentMetrics) return;
    
    // Update internal statistics
    this.updatePerformanceStatistics(this.currentMetrics);
    
    // Log detailed profiling information
    if (this.logger && this.config.enableDetailedLogging) {
      this.logger.debug('Performance profiling data', {
        metrics: this.currentMetrics,
        averageThroughput: this.averageThroughput,
        peakThroughput: this.peakThroughput,
        averageLatency: this.averageLatency
      }).catch(() => {});
    }
  }
  
  /**
   * Perform automatic optimization
   */
  private performAutoOptimization(): void {
    if (!this.currentMetrics) return;
    
    const now = Date.now();
    
    // Rate limit optimizations
    if (now - this.lastOptimizationTime < this.config.optimizationInterval) {
      return;
    }
    
    this.lastOptimizationTime = now;
    
    const suggestions = this.suggestOptimizations();
    const criticalSuggestions = suggestions.filter(s => s.priority === 'critical');
    
    if (criticalSuggestions.length > 0) {
      // Log critical optimization needs
      if (this.logger) {
        this.logger.warn('Critical performance issues detected', {
          suggestions: criticalSuggestions.map(s => s.description)
        }).catch(() => {});
      }
    }
    
    // Record optimization attempt
    this.optimizationResults.push({
      action: 'auto-optimization',
      beforeMetrics: { ...this.currentMetrics },
      improvement: 0, // Would be calculated after implementation
      timestamp: now
    });
    
    // Limit optimization history
    if (this.optimizationResults.length > 50) {
      this.optimizationResults.shift();
    }
  }
  
  /**
   * Detect performance bottlenecks
   */
  private detectBottlenecks(): BottleneckInfo[] {
    const bottlenecks: BottleneckInfo[] = [];
    
    if (!this.currentMetrics) return bottlenecks;
    
    const metrics = this.currentMetrics;
    
    // CPU bottleneck
    if (metrics.cpuUsage && metrics.cpuUsage > 0.9) {
      bottlenecks.push({
        stage: 'processing',
        type: BottleneckType.CPU,
        severity: 'critical',
        description: 'CPU usage is critically high at ' + (metrics.cpuUsage * 100).toFixed(1) + '%',
        impact: 0.8,
        suggestedFix: 'Reduce concurrency or optimize algorithms'
      });
    }
    
    // Memory bottleneck
    const memoryStats = getMemoryStats();
    if (memoryStats && metrics.memoryUsage / memoryStats.total > 0.9) {
      bottlenecks.push({
        stage: 'memory',
        type: BottleneckType.MEMORY,
        severity: 'high',
        description: 'Memory usage is critically high',
        impact: 0.7,
        suggestedFix: 'Reduce buffer sizes or trigger garbage collection'
      });
    }
    
    // Error rate bottleneck
    if (metrics.errorRate > 0.05) {
      bottlenecks.push({
        stage: 'error-handling',
        type: BottleneckType.ALGORITHM,
        severity: 'critical',
        description: 'Error rate is too high at ' + (metrics.errorRate * 100).toFixed(1) + '%',
        impact: 0.9,
        suggestedFix: 'Implement better error handling and retry logic'
      });
    }
    
    // Latency bottleneck
    if (metrics.latency > 100) {
      bottlenecks.push({
        stage: 'processing',
        type: BottleneckType.IO,
        severity: 'medium',
        description: 'Latency is high at ' + metrics.latency.toFixed(1) + 'ms',
        impact: 0.5,
        suggestedFix: 'Reduce buffer sizes or optimize I/O operations'
      });
    }
    
    return bottlenecks;
  }
  
  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.currentMetrics) return recommendations;
    
    const metrics = this.currentMetrics;
    
    if (metrics.throughput < 300) {
      recommendations.push('Consider increasing chunk sizes for better throughput');
    }
    
    if (metrics.latency > 50) {
      recommendations.push('Consider reducing buffer sizes to improve latency');
    }
    
    if (metrics.errorRate > 0.02) {
      recommendations.push('Implement better error handling and retry mechanisms');
    }
    
    if (metrics.cacheHitRate && metrics.cacheHitRate < 0.8) {
      recommendations.push('Consider increasing cache size or improving data locality');
    }
    
    return recommendations;
  }
  
  /**
   * Generate trend data for historical analysis
   */
  private generateTrendData(): PerformanceHistory[] {
    const trends: PerformanceHistory[] = [];
    
    // Generate performance history from metrics history
    const maxEntries = Math.min(this.metricsHistory.timestamps.length, 20); // Last 20 entries
    
    for (let i = Math.max(0, this.metricsHistory.timestamps.length - maxEntries); i < this.metricsHistory.timestamps.length; i++) {
      const metrics: StreamPerformanceMetrics = {
        throughput: this.metricsHistory.throughput[i] || 0,
        latency: this.metricsHistory.latency[i] || 0,
        memoryUsage: this.metricsHistory.memoryUsage[i] || 0,
        errorRate: this.metricsHistory.errorRate[i] || 0,
        backpressureEvents: 0, // Would be tracked separately
        cacheHitRate: 0.8, // Default value
        cpuUsage: this.metricsHistory.cpuUsage[i] || 0.5,
        ioWaitTime: 10 // Default value
      };
      
      trends.push({
        timestamp: this.metricsHistory.timestamps[i] || Date.now(),
        metrics,
        configuration: {
          strategy: this.strategy,
          profilingEnabled: this.profilingEnabled,
          autoTuningEnabled: this.autoTuningEnabled
        }
      });
    }
    
    return trends;
  }
}

export function createPerformanceOptimizer(
  config: PerformanceOptimizerConfig = {},
  options: any = {}
): StreamOptimizer {
  return new PerformanceOptimizerImpl(config, options);
}

export function createStrategyOptimizer(
  strategy: OptimizationStrategy,
  options: any = {}
): StreamOptimizer {
  const config: PerformanceOptimizerConfig = {
    strategy,
    enableProfiling: true,
    enableAutoTuning: false,
    enableDetailedLogging: options.enableDetailedLogging || false
  };
  
  return new PerformanceOptimizerImpl(config, options);
}
