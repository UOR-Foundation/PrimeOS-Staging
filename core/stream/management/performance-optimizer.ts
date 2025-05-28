/**
 * Performance Optimizer Implementation
 * ===================================
 * 
 * Optimizes stream processing performance through adaptive algorithms,
 * bottleneck detection, and automated tuning of processing parameters.
 */

import { 
  StreamOptimizer, 
  StreamPerformanceMetrics, 
  OptimizationStrategy, 
  OptimizationResult,
  OptimizationSuggestion,
  BufferConfig,
  PerformanceReport,
  BottleneckAnalysis,
  PerformanceHistory,
  BenchmarkResult,
  OptimizationConfig
} from '../types';
import { getMemoryStats } from '../utils/memory-utils';

// Re-export OptimizationStrategy for external use
export { OptimizationStrategy };

/**
 * Performance bottleneck types
 */
export enum BottleneckType {
  CPU = 'cpu',
  MEMORY = 'memory',
  IO = 'io',
  NETWORK = 'network',
  CONCURRENCY = 'concurrency',
  BUFFER = 'buffer'
}

/**
 * Optimization context for decisions
 */
interface OptimizationContext {
  currentMetrics: StreamPerformanceMetrics;
  historicalData: PerformanceHistory[];
  systemResources: {
    cpuUsage: number;
    memoryUsage: number;
    diskIO: number;
    networkLatency: number;
  };
  constraints: {
    maxMemory: number;
    maxConcurrency: number;
    latencyTarget: number;
    throughputTarget: number;
  };
}

/**
 * Configuration for performance optimizer
 */
export interface PerformanceOptimizerConfig {
  strategy: OptimizationStrategy;
  enableProfiling: boolean;
  profilingInterval: number;        // ms
  optimizationInterval: number;     // ms
  enableAutoTuning: boolean;
  benchmarkSampleSize: number;
  historyRetentionPeriod: number;   // ms
  minimumImprovementThreshold: number; // percentage
  enableDetailedLogging: boolean;
}

/**
 * Default optimizer configuration
 */
const DEFAULT_CONFIG: PerformanceOptimizerConfig = {
  strategy: OptimizationStrategy.BALANCED,
  enableProfiling: true,
  profilingInterval: 5000,
  optimizationInterval: 30000,
  enableAutoTuning: true,
  benchmarkSampleSize: 100,
  historyRetentionPeriod: 3600000, // 1 hour
  minimumImprovementThreshold: 5.0, // 5%
  enableDetailedLogging: false
};

/**
 * Performance optimizer implementation
 */
export class PerformanceOptimizerImpl implements StreamOptimizer {
  private config: PerformanceOptimizerConfig;
  private logger?: any;
  
  // Profiling state
  private profilingEnabled = false;
  private profilingTimer?: NodeJS.Timeout;
  private optimizationTimer?: NodeJS.Timeout;
  
  // Performance tracking
  private metricsHistory: PerformanceHistory[] = [];
  private currentMetrics: StreamPerformanceMetrics = {
    throughput: 0,
    latency: 0,
    memoryUsage: 0,
    errorRate: 0,
    backpressureEvents: 0,
    cacheHitRate: 0,
    cpuUsage: 0,
    ioWaitTime: 0
  };
  
  // Optimization state
  private currentStrategy: OptimizationStrategy;
  private optimizationHistory: OptimizationResult[] = [];
  private detectedBottlenecks: BottleneckAnalysis[] = [];
  
  // Benchmarking
  private benchmarkResults: BenchmarkResult[] = [];
  private currentBenchmark?: {
    testName: string;
    startTime: number;
    beforeMetrics: StreamPerformanceMetrics;
  };
  
  // Configuration tracking
  private configurationHistory: { timestamp: number; config: Record<string, any> }[] = [];
  private currentConfiguration: Record<string, any> = {};
  
  constructor(config: Partial<PerformanceOptimizerConfig> = {}, dependencies: {
    logger?: any;
  } = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = dependencies.logger;
    this.currentStrategy = this.config.strategy;
    
    if (this.config.enableProfiling) {
      this.enableProfiling();
    }
    
    if (this.config.enableAutoTuning) {
      this.startAutoTuning();
    }
  }
  
  /**
   * Adaptively adjust chunk size based on performance metrics
   */
  adaptChunkSize(metrics: StreamPerformanceMetrics): number {
    const context = this.buildOptimizationContext(metrics);
    const currentChunkSize = this.currentConfiguration.chunkSize || 1024;
    
    // Analyze current performance
    const throughputScore = this.scoreThroughput(metrics.throughput);
    const latencyScore = this.scoreLatency(metrics.latency);
    const memoryScore = this.scoreMemoryUsage(metrics.memoryUsage);
    
    let adjustmentFactor = 1.0;
    
    switch (this.currentStrategy) {
      case OptimizationStrategy.THROUGHPUT:
        // Prioritize throughput over latency
        if (throughputScore < 0.7 && memoryScore > 0.5) {
          adjustmentFactor = 1.5; // Increase chunk size for better throughput
        } else if (memoryScore < 0.3) {
          adjustmentFactor = 0.8; // Reduce due to memory pressure
        }
        break;
        
      case OptimizationStrategy.LATENCY:
        // Prioritize low latency
        if (latencyScore < 0.7) {
          adjustmentFactor = 0.7; // Smaller chunks for better latency
        } else if (throughputScore < 0.5 && latencyScore > 0.8) {
          adjustmentFactor = 1.2; // Can afford slightly larger chunks
        }
        break;
        
      case OptimizationStrategy.MEMORY:
        // Prioritize memory efficiency
        if (memoryScore < 0.5) {
          adjustmentFactor = 0.6; // Aggressive reduction
        } else if (memoryScore > 0.8 && throughputScore < 0.7) {
          adjustmentFactor = 1.3; // Can afford larger chunks
        }
        break;
        
      case OptimizationStrategy.BALANCED:
        // Balance all factors
        const overallScore = (throughputScore + latencyScore + memoryScore) / 3;
        if (overallScore < 0.6) {
          adjustmentFactor = 0.9; // Slight reduction
        } else if (overallScore > 0.8) {
          adjustmentFactor = 1.1; // Slight increase
        }
        break;
        
      case OptimizationStrategy.CUSTOM:
        // Use custom logic or machine learning
        adjustmentFactor = this.customChunkSizeOptimization(context);
        break;
    }
    
    const newChunkSize = Math.round(currentChunkSize * adjustmentFactor);
    const minChunkSize = 256;
    const maxChunkSize = 64 * 1024; // 64KB
    
    const optimizedChunkSize = Math.max(minChunkSize, Math.min(maxChunkSize, newChunkSize));
    
    if (this.logger && this.config.enableDetailedLogging) {
      this.logger.debug('Chunk size optimization', {
        currentSize: currentChunkSize,
        adjustmentFactor,
        newSize: optimizedChunkSize,
        throughputScore,
        latencyScore,
        memoryScore
      }).catch(() => {});
    }
    
    return optimizedChunkSize;
  }
  
  /**
   * Optimize concurrency level based on performance
   */
  optimizeConcurrency(metrics: StreamPerformanceMetrics): number {
    const context = this.buildOptimizationContext(metrics);
    const currentConcurrency = this.currentConfiguration.maxConcurrency || 4;
    
    // Analyze CPU and throughput patterns
    const cpuUtilization = metrics.cpuUsage;
    const throughputEfficiency = this.calculateThroughputEfficiency(metrics);
    const errorRate = metrics.errorRate;
    
    let newConcurrency = currentConcurrency;
    
    // Increase concurrency if:
    // - CPU utilization is low
    // - Throughput efficiency is good
    // - Error rate is low
    if (cpuUtilization < 0.6 && throughputEfficiency > 0.8 && errorRate < 0.01) {
      newConcurrency = Math.min(currentConcurrency + 1, context.constraints.maxConcurrency);
    }
    // Decrease concurrency if:
    // - CPU utilization is high
    // - Error rate is increasing
    // - Memory pressure is high
    else if (cpuUtilization > 0.9 || errorRate > 0.05 || metrics.memoryUsage > context.constraints.maxMemory * 0.9) {
      newConcurrency = Math.max(currentConcurrency - 1, 1);
    }
    
    if (this.logger && newConcurrency !== currentConcurrency) {
      this.logger.debug('Concurrency optimization', {
        from: currentConcurrency,
        to: newConcurrency,
        cpuUtilization,
        throughputEfficiency,
        errorRate
      }).catch(() => {});
    }
    
    return newConcurrency;
  }
  
  /**
   * Adjust buffer sizes for optimal performance
   */
  adjustBufferSizes(metrics: StreamPerformanceMetrics): BufferConfig {
    const memoryStats = getMemoryStats();
    const memoryPressure = memoryStats ? (memoryStats.used / memoryStats.total) : 0.5;
    
    // Base buffer sizes
    let inputBufferSize = 8192;
    let outputBufferSize = 8192;
    let intermediateBufferSize = 4096;
    let backpressureThreshold = 0.8;
    
    // Adjust based on memory pressure
    if (memoryPressure > 0.8) {
      // Reduce buffer sizes under memory pressure
      inputBufferSize *= 0.5;
      outputBufferSize *= 0.5;
      intermediateBufferSize *= 0.5;
      backpressureThreshold = 0.6;
    } else if (memoryPressure < 0.4) {
      // Increase buffer sizes when memory is available
      inputBufferSize *= 1.5;
      outputBufferSize *= 1.5;
      intermediateBufferSize *= 1.5;
      backpressureThreshold = 0.9;
    }
    
    // Adjust based on throughput requirements
    if (metrics.throughput < metrics.throughput * 0.8) { // Below target
      inputBufferSize *= 1.2;
      outputBufferSize *= 1.2;
    }
    
    // Adjust based on latency requirements
    if (metrics.latency > 100) { // High latency
      inputBufferSize *= 0.8;
      outputBufferSize *= 0.8;
      intermediateBufferSize *= 0.8;
    }
    
    return {
      inputBufferSize: Math.round(inputBufferSize),
      outputBufferSize: Math.round(outputBufferSize),
      intermediateBufferSize: Math.round(intermediateBufferSize),
      backpressureThreshold
    };
  }
  
  /**
   * Enable performance profiling
   */
  enableProfiling(): void {
    if (this.profilingEnabled) {
      return;
    }
    
    this.profilingEnabled = true;
    this.profilingTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.profilingInterval);
    
    if (this.logger) {
      this.logger.debug('Performance profiling enabled', {
        interval: this.config.profilingInterval
      }).catch(() => {});
    }
  }
  
  /**
   * Disable performance profiling
   */
  disableProfiling(): void {
    if (!this.profilingEnabled) {
      return;
    }
    
    this.profilingEnabled = false;
    if (this.profilingTimer) {
      clearInterval(this.profilingTimer);
      this.profilingTimer = undefined;
    }
    
    if (this.logger) {
      this.logger.debug('Performance profiling disabled').catch(() => {});
    }
  }
  
  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): PerformanceReport {
    const recentHistory = this.getRecentHistory(300000); // Last 5 minutes
    
    // Calculate summary statistics
    const summary = this.calculateSummaryStats(recentHistory);
    
    // Detect bottlenecks
    const bottlenecks = this.detectBottlenecks(this.currentMetrics, recentHistory);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(bottlenecks, summary);
    
    return {
      summary,
      bottlenecks,
      recommendations,
      historicalTrends: recentHistory
    };
  }
  
  /**
   * Get optimization suggestions
   */
  suggestOptimizations(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const context = this.buildOptimizationContext(this.currentMetrics);
    
    // Analyze current performance against targets
    if (this.currentMetrics.throughput < 1000) { // Low throughput
      suggestions.push({
        type: 'configuration',
        priority: 'high',
        description: 'Increase chunk size and concurrency to improve throughput',
        expectedImprovement: 25,
        implementation: 'Set chunkSize to 4096 and maxConcurrency to 8'
      });
    }
    
    if (this.currentMetrics.latency > 50) { // High latency
      suggestions.push({
        type: 'configuration',
        priority: 'medium',
        description: 'Reduce chunk size to improve latency',
        expectedImprovement: 15,
        implementation: 'Set chunkSize to 512 and enable streaming mode'
      });
    }
    
    if (this.currentMetrics.memoryUsage > context.constraints.maxMemory * 0.8) {
      suggestions.push({
        type: 'resource',
        priority: 'high',
        description: 'Reduce memory usage to prevent performance degradation',
        expectedImprovement: 20,
        implementation: 'Enable memory-conservative mode and reduce buffer sizes'
      });
    }
    
    if (this.currentMetrics.errorRate > 0.01) { // High error rate
      suggestions.push({
        type: 'algorithm',
        priority: 'high',
        description: 'Implement retry logic and error handling to reduce errors',
        expectedImprovement: 30,
        implementation: 'Add exponential backoff retry and circuit breaker pattern'
      });
    }
    
    return suggestions;
  }
  
  /**
   * Set optimization strategy
   */
  setOptimizationStrategy(strategy: OptimizationStrategy): void {
    const oldStrategy = this.currentStrategy;
    this.currentStrategy = strategy;
    
    if (this.logger) {
      this.logger.info('Optimization strategy changed', {
        from: oldStrategy,
        to: strategy
      }).catch(() => {});
    }
  }
  
  /**
   * Get current optimization strategy
   */
  getOptimizationStrategy(): OptimizationStrategy {
    return this.currentStrategy;
  }
  
  /**
   * Update performance metrics
   */
  updateMetrics(metrics: StreamPerformanceMetrics): void {
    this.currentMetrics = { ...metrics };
    
    // Add to history
    this.metricsHistory.push({
      timestamp: Date.now(),
      metrics: { ...metrics },
      configuration: { ...this.currentConfiguration }
    });
    
    // Clean old history
    this.cleanHistory();
  }
  
  /**
   * Stop the optimizer and cleanup
   */
  stop(): void {
    this.disableProfiling();
    
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = undefined;
    }
    
    if (this.logger) {
      this.logger.debug('Performance optimizer stopped').catch(() => {});
    }
  }
  
  /**
   * Start automatic tuning
   */
  private startAutoTuning(): void {
    this.optimizationTimer = setInterval(() => {
      this.performAutoOptimization();
    }, this.config.optimizationInterval);
  }
  
  /**
   * Perform automatic optimization
   */
  private async performAutoOptimization(): Promise<void> {
    try {
      const suggestions = this.suggestOptimizations();
      
      for (const suggestion of suggestions) {
        if (suggestion.priority === 'high' && suggestion.expectedImprovement >= this.config.minimumImprovementThreshold) {
          // Apply high-priority optimizations automatically
          await this.applySuggestion(suggestion);
        }
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error('Auto-optimization failed', error).catch(() => {});
      }
    }
  }
  
  /**
   * Apply an optimization suggestion
   */
  private async applySuggestion(suggestion: OptimizationSuggestion): Promise<void> {
    // This would integrate with the actual stream configuration
    if (this.logger) {
      this.logger.info('Applying optimization suggestion', {
        type: suggestion.type,
        description: suggestion.description,
        expectedImprovement: suggestion.expectedImprovement
      }).catch(() => {});
    }
    
    // Track the optimization
    this.optimizationHistory.push({
      success: true,
      improvementPercentage: suggestion.expectedImprovement,
      newConfiguration: { suggestion: suggestion.implementation },
      benchmarkResults: [],
      recommendations: [suggestion]
    });
  }
  
  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    // This would integrate with actual performance monitoring
    const memoryStats = getMemoryStats();
    
    const metrics: StreamPerformanceMetrics = {
      throughput: this.measureThroughput(),
      latency: this.measureLatency(),
      memoryUsage: memoryStats ? memoryStats.used : 0,
      errorRate: this.calculateErrorRate(),
      backpressureEvents: this.countBackpressureEvents(),
      cacheHitRate: this.calculateCacheHitRate(),
      cpuUsage: this.measureCPUUsage(),
      ioWaitTime: this.measureIOWaitTime()
    };
    
    this.updateMetrics(metrics);
  }
  
  /**
   * Build optimization context
   */
  private buildOptimizationContext(metrics: StreamPerformanceMetrics): OptimizationContext {
    const memoryStats = getMemoryStats();
    
    return {
      currentMetrics: metrics,
      historicalData: this.getRecentHistory(60000), // Last minute
      systemResources: {
        cpuUsage: metrics.cpuUsage,
        memoryUsage: memoryStats.used / memoryStats.total,
        diskIO: metrics.ioWaitTime,
        networkLatency: 0 // Would measure actual network latency
      },
      constraints: {
        maxMemory: memoryStats.total,
        maxConcurrency: 16, // Would be configurable
        latencyTarget: 50, // ms
        throughputTarget: 1000 // items/sec
      }
    };
  }
  
  // Placeholder measurement methods (would integrate with actual monitoring)
  private measureThroughput(): number { return Math.random() * 1000; }
  private measureLatency(): number { return Math.random() * 100; }
  private calculateErrorRate(): number { return Math.random() * 0.05; }
  private countBackpressureEvents(): number { return Math.floor(Math.random() * 10); }
  private calculateCacheHitRate(): number { return 0.8 + Math.random() * 0.2; }
  private measureCPUUsage(): number { return Math.random() * 0.8; }
  private measureIOWaitTime(): number { return Math.random() * 20; }
  
  private scoreThroughput(throughput: number): number { return Math.min(throughput / 1000, 1.0); }
  private scoreLatency(latency: number): number { return Math.max(0, 1 - latency / 100); }
  private scoreMemoryUsage(usage: number): number { return Math.max(0, 1 - usage / (500 * 1024 * 1024)); }
  
  private calculateThroughputEfficiency(metrics: StreamPerformanceMetrics): number {
    return metrics.throughput / (metrics.cpuUsage * 1000 + 1);
  }
  
  private customChunkSizeOptimization(context: OptimizationContext): number {
    // Placeholder for custom optimization logic
    return 1.0;
  }
  
  private getRecentHistory(period: number): PerformanceHistory[] {
    const cutoff = Date.now() - period;
    return this.metricsHistory.filter(h => h.timestamp >= cutoff);
  }
  
  private calculateSummaryStats(history: PerformanceHistory[]) {
    if (history.length === 0) {
      return {
        averageThroughput: 0,
        peakThroughput: 0,
        averageLatency: 0,
        errorRate: 0
      };
    }
    
    const throughputs = history.map(h => h.metrics.throughput);
    const latencies = history.map(h => h.metrics.latency);
    const errorRates = history.map(h => h.metrics.errorRate);
    
    return {
      averageThroughput: throughputs.reduce((a, b) => a + b, 0) / throughputs.length,
      peakThroughput: Math.max(...throughputs),
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      errorRate: errorRates.reduce((a, b) => a + b, 0) / errorRates.length
    };
  }
  
  private detectBottlenecks(metrics: StreamPerformanceMetrics, history: PerformanceHistory[]): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];
    
    if (metrics.cpuUsage > 0.9) {
      bottlenecks.push({
        stage: 'processing',
        severity: 'high',
        description: 'High CPU utilization detected',
        impact: 25,
        suggestedFix: 'Reduce processing complexity or increase parallelization'
      });
    }
    
    if (metrics.memoryUsage > 400 * 1024 * 1024) { // 400MB
      bottlenecks.push({
        stage: 'memory',
        severity: 'medium',
        description: 'High memory usage detected',
        impact: 15,
        suggestedFix: 'Enable memory optimization and reduce buffer sizes'
      });
    }
    
    return bottlenecks;
  }
  
  private generateRecommendations(bottlenecks: BottleneckAnalysis[], summary: any): string[] {
    const recommendations: string[] = [];
    
    bottlenecks.forEach(bottleneck => {
      recommendations.push(bottleneck.suggestedFix);
    });
    
    if (summary.averageLatency > 50) {
      recommendations.push('Consider reducing chunk sizes to improve latency');
    }
    
    if (summary.averageThroughput < 500) {
      recommendations.push('Consider increasing concurrency to improve throughput');
    }
    
    return recommendations;
  }
  
  private cleanHistory(): void {
    const cutoff = Date.now() - this.config.historyRetentionPeriod;
    this.metricsHistory = this.metricsHistory.filter(h => h.timestamp >= cutoff);
  }
}

/**
 * Create a performance optimizer
 */
export function createPerformanceOptimizer(
  config: Partial<PerformanceOptimizerConfig> = {},
  dependencies: { logger?: any } = {}
): StreamOptimizer {
  return new PerformanceOptimizerImpl(config, dependencies);
}

/**
 * Create a performance optimizer with strategy-specific settings
 */
export function createStrategyOptimizer(
  strategy: OptimizationStrategy,
  dependencies: { logger?: any } = {}
): StreamOptimizer {
  const strategyConfigs: Record<OptimizationStrategy, Partial<PerformanceOptimizerConfig>> = {
    [OptimizationStrategy.THROUGHPUT]: {
      strategy,
      profilingInterval: 2000,
      optimizationInterval: 15000,
      minimumImprovementThreshold: 3.0
    },
    [OptimizationStrategy.LATENCY]: {
      strategy,
      profilingInterval: 1000,
      optimizationInterval: 10000,
      minimumImprovementThreshold: 2.0
    },
    [OptimizationStrategy.MEMORY]: {
      strategy,
      profilingInterval: 5000,
      optimizationInterval: 30000,
      minimumImprovementThreshold: 5.0
    },
    [OptimizationStrategy.BALANCED]: {
      strategy,
      profilingInterval: 3000,
      optimizationInterval: 20000,
      minimumImprovementThreshold: 4.0
    },
    [OptimizationStrategy.CUSTOM]: {
      strategy,
      enableAutoTuning: false,
      minimumImprovementThreshold: 10.0
    }
  };
  
  const config = strategyConfigs[strategy];
  return new PerformanceOptimizerImpl(config, dependencies);
}
