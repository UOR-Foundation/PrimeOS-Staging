/**
 * Enhanced Adapters Index
 * ======================
 * 
 * Exports for enhanced adapter modules that bridge core modules with the encoding system.
 * These adapters provide production-ready integration with performance monitoring,
 * caching, batch processing, and load balancing capabilities.
 */

// Import and re-export enhanced prime adapter
import {
  PrimeRegistryAdapter,
  createPrimeAdapter,
  createPrimeAdapterPool
} from './prime-adapter';

// Import and re-export enhanced integrity adapter
import {
  IntegrityAdapter,
  createIntegrityAdapter,
  createIntegrityAdapterPool
} from './integrity-adapter';

// Re-export all imports
export {
  PrimeRegistryAdapter,
  createPrimeAdapter,
  createPrimeAdapterPool,
  IntegrityAdapter,
  createIntegrityAdapter,
  createIntegrityAdapterPool
};

/**
 * Adapter configuration options type
 */
export interface AdapterOptions {
  enableCaching?: boolean;
  maxCacheSize?: number;
  cacheExpiryMs?: number;
  logger?: any;
}

/**
 * Pool configuration for multiple adapter instances
 */
export interface AdapterPoolConfig extends AdapterOptions {
  poolSize?: number;
  loadBalancing?: 'round-robin' | 'least-connections' | 'random';
}

/**
 * Adapter performance statistics
 */
export interface AdapterStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageResponseTime: number;
  cacheHitRate: number;
  uptime: number;
}

/**
 * Factory function to create a complete adapter suite
 */
export interface AdapterSuite {
  primeAdapter: PrimeRegistryAdapter;
  integrityAdapter: IntegrityAdapter;
  getStats(): {
    prime: AdapterStats;
    integrity: AdapterStats;
    combined: AdapterStats;
  };
  clearCaches(): void;
  terminate(): Promise<void>;
}

/**
 * Create a complete adapter suite with both prime and integrity adapters
 */
export function createAdapterSuite(
  primeRegistry: any,
  integrityModule: any,
  options: AdapterOptions = {}
): AdapterSuite {
  const primeAdapter = createPrimeAdapter(primeRegistry, options);
  const integrityAdapter = createIntegrityAdapter(integrityModule, options);
  
  return {
    primeAdapter,
    integrityAdapter,
    
    getStats() {
      const primeMetrics = primeAdapter.getMetrics();
      const integrityMetrics = integrityAdapter.getMetrics();
      
      const primeStats: AdapterStats = {
        totalOperations: primeMetrics.primeRequests + primeMetrics.indexRequests + 
                        primeMetrics.factorizations + primeMetrics.primalityTests,
        successfulOperations: (primeMetrics.primeRequests + primeMetrics.indexRequests + 
                              primeMetrics.factorizations + primeMetrics.primalityTests) - 
                              primeMetrics.errorCount,
        failedOperations: primeMetrics.errorCount,
        averageResponseTime: primeMetrics.averageResponseTime,
        cacheHitRate: (primeMetrics.cacheHits / (primeMetrics.cacheHits + primeMetrics.cacheMisses)) || 0,
        uptime: Date.now() // Simplified uptime
      };
      
      const integrityStats: AdapterStats = {
        totalOperations: integrityMetrics.checksumsGenerated + integrityMetrics.checksumsAttached + 
                        integrityMetrics.integritiesVerified + integrityMetrics.checksumsExtracted,
        successfulOperations: (integrityMetrics.checksumsGenerated + integrityMetrics.checksumsAttached + 
                              integrityMetrics.integritiesVerified + integrityMetrics.checksumsExtracted) - 
                              integrityMetrics.errorCount,
        failedOperations: integrityMetrics.errorCount,
        averageResponseTime: integrityMetrics.averageResponseTime,
        cacheHitRate: (integrityMetrics.cacheHits / (integrityMetrics.cacheHits + integrityMetrics.cacheMisses)) || 0,
        uptime: Date.now() // Simplified uptime
      };
      
      const combinedStats: AdapterStats = {
        totalOperations: primeStats.totalOperations + integrityStats.totalOperations,
        successfulOperations: primeStats.successfulOperations + integrityStats.successfulOperations,
        failedOperations: primeStats.failedOperations + integrityStats.failedOperations,
        averageResponseTime: (primeStats.averageResponseTime + integrityStats.averageResponseTime) / 2,
        cacheHitRate: (primeStats.cacheHitRate + integrityStats.cacheHitRate) / 2,
        uptime: Math.min(primeStats.uptime, integrityStats.uptime)
      };
      
      return {
        prime: primeStats,
        integrity: integrityStats,
        combined: combinedStats
      };
    },
    
    clearCaches() {
      primeAdapter.clearCache();
      integrityAdapter.clearCache();
    },
    
    async terminate() {
      await Promise.all([
        primeAdapter.terminate(),
        integrityAdapter.terminate()
      ]);
    }
  };
}

/**
 * Create multiple adapter suites for load balancing
 */
export function createAdapterSuitePool(
  primeRegistries: any[],
  integrityModules: any[],
  options: AdapterOptions = {}
): AdapterSuite[] {
  if (primeRegistries.length !== integrityModules.length) {
    throw new Error('Prime registries and integrity modules arrays must have the same length');
  }
  
  return primeRegistries.map((primeRegistry, index) => 
    createAdapterSuite(primeRegistry, integrityModules[index], options)
  );
}

/**
 * Load balancer for adapter pools
 */
export class AdapterLoadBalancer {
  private suites: AdapterSuite[];
  private currentIndex = 0;
  private strategy: 'round-robin' | 'least-connections' | 'random';
  
  constructor(suites: AdapterSuite[], strategy: 'round-robin' | 'least-connections' | 'random' = 'round-robin') {
    this.suites = suites;
    this.strategy = strategy;
  }
  
  /**
   * Get the next adapter suite based on load balancing strategy
   */
  getNext(): AdapterSuite {
    switch (this.strategy) {
      case 'round-robin':
        const suite = this.suites[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.suites.length;
        return suite;
        
      case 'least-connections':
        // Find suite with lowest total operations
        return this.suites.reduce((min, current) => {
          const minStats = min.getStats();
          const currentStats = current.getStats();
          return currentStats.combined.totalOperations < minStats.combined.totalOperations ? current : min;
        });
        
      case 'random':
        return this.suites[Math.floor(Math.random() * this.suites.length)];
        
      default:
        return this.suites[0];
    }
  }
  
  /**
   * Get all adapter suites
   */
  getAllSuites(): AdapterSuite[] {
    return [...this.suites];
  }
  
  /**
   * Get combined statistics from all suites
   */
  getCombinedStats(): AdapterStats {
    const allStats = this.suites.map(suite => suite.getStats().combined);
    
    return allStats.reduce((combined, stats) => ({
      totalOperations: combined.totalOperations + stats.totalOperations,
      successfulOperations: combined.successfulOperations + stats.successfulOperations,
      failedOperations: combined.failedOperations + stats.failedOperations,
      averageResponseTime: (combined.averageResponseTime + stats.averageResponseTime) / 2,
      cacheHitRate: (combined.cacheHitRate + stats.cacheHitRate) / 2,
      uptime: Math.min(combined.uptime, stats.uptime)
    }), {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      uptime: Date.now()
    });
  }
  
  /**
   * Terminate all adapter suites
   */
  async terminate(): Promise<void> {
    await Promise.all(this.suites.map(suite => suite.terminate()));
  }
}
