/**
 * Spectral Processing Adapters
 * ===========================
 * 
 * Spectral-optimized adapters that extend the enhanced integration adapters
 * from core/bands/integration with additional spectral analysis capabilities.
 */

// Import enhanced adapters from integration
import {
  EnhancedPrimeAdapter,
  EnhancedEncodingAdapter,
  EnhancedPrecisionAdapter,
  EnhancedStreamAdapter,
  createEnhancedPrimeAdapter,
  createEnhancedEncodingAdapter,
  createEnhancedPrecisionAdapter,
  createEnhancedStreamAdapter
} from '../../integration';

// Import spectral-specific adapters
import { 
  SpectralPrecisionAdapter,
  createPrecisionAdapter as createSpectralPrecisionAdapterImpl,
  createBandOptimizedPrecisionAdapter
} from './precision-adapter';

import {
  SpectralPrimeAdapter,
  createPrimeAdapter as createSpectralPrimeAdapterImpl,
  createBandOptimizedPrimeAdapter
} from './prime-adapter';

import { BandType } from '../../types';

/**
 * Spectral adapter factory that creates band-optimized versions
 * of the enhanced integration adapters
 */
export class SpectralAdapterFactory {
  
  /**
   * Create a spectral-optimized prime adapter
   */
  static createSpectralPrimeAdapter(
    primeRegistry: any,
    band?: BandType,
    config: any = {}
  ): EnhancedPrimeAdapter | SpectralPrimeAdapter {
    
    if (band) {
      // Use spectral-specific adapter for band optimization
      return createBandOptimizedPrimeAdapter(primeRegistry, band, config);
    } else {
      // Use enhanced integration adapter
      return createEnhancedPrimeAdapter({
        ...config,
        primeRegistryOptions: {
          preloadCount: 2000, // More primes for spectral analysis
          useStreaming: true,
          streamChunkSize: 2048,
          enableLogs: false
        }
      });
    }
  }
  
  /**
   * Create a spectral-optimized precision adapter
   */
  static createSpectralPrecisionAdapter(
    precisionModule: any,
    band?: BandType,
    config: any = {}
  ): EnhancedPrecisionAdapter | SpectralPrecisionAdapter {
    
    if (band) {
      // Use spectral-specific adapter for band optimization
      return createBandOptimizedPrecisionAdapter(precisionModule, band, config);
    } else {
      // Use enhanced integration adapter
      return createEnhancedPrecisionAdapter({
        ...config,
        precisionModuleOptions: {
          enableCaching: true,
          cacheSize: 15000, // Larger cache for spectral operations
          useOptimized: true,
          strict: true,
          pythonCompatible: false,
          checksumPower: 6,
          cachePolicy: 'lru'
        }
      });
    }
  }
  
  /**
   * Create a spectral-optimized encoding adapter
   */
  static createSpectralEncodingAdapter(
    encodingModule: any,
    config: any = {}
  ): EnhancedEncodingAdapter {
    
    // Enhanced encoding adapter is already optimal for spectral processing
    return createEnhancedEncodingAdapter({
      ...config,
      enableNTT: true, // Essential for spectral analysis
      enableSpectralTransforms: true,
      nttModulus: 2281701377n, // Large NTT modulus for precision
      nttPrimitiveRoot: 3n,
      chunkIdLength: 16, // Larger chunk IDs for spectral data
      encodingModuleOptions: {
        enableSpectralEncoding: true,
        enableVM: true,
        ...config.encodingModuleOptions
      }
    });
  }
  
  /**
   * Create a spectral-optimized stream adapter
   */
  static createSpectralStreamAdapter(
    streamProcessor: any,
    config: any = {}
  ): EnhancedStreamAdapter {
    
    // Enhanced stream adapter with spectral-optimized configuration
    return createEnhancedStreamAdapter({
      ...config,
      defaultChunkSize: 4096, // Larger chunks for spectral processing
      maxConcurrency: 8, // More concurrency for frequency analysis
      enableBackpressure: true,
      bufferSize: 16384, // Larger buffers for spectral data
      streamModuleOptions: {
        memoryLimit: 500 * 1024 * 1024, // 500MB for large spectral datasets
        metricsInterval: 2000, // Faster metrics for spectral monitoring
        optimizationStrategy: 'balanced',
        retryAttempts: 5,
        retryDelay: 500,
        errorTolerance: 0.02, // Lower tolerance for spectral precision
        backpressureThreshold: 0.7,
        ...config.streamModuleOptions
      }
    });
  }
  
  /**
   * Create a complete spectral adapter suite for a specific band
   */
  static createSpectralSuite(
    modules: {
      primeRegistry: any;
      encodingModule: any;
      precisionModule: any;
      streamProcessor: any;
    },
    band: BandType,
    config: any = {}
  ) {
    
    return {
      prime: this.createSpectralPrimeAdapter(modules.primeRegistry, band, config.prime),
      encoding: this.createSpectralEncodingAdapter(modules.encodingModule, config.encoding),
      precision: this.createSpectralPrecisionAdapter(modules.precisionModule, band, config.precision),
      stream: this.createSpectralStreamAdapter(modules.streamProcessor, config.stream),
      
      // Utility method to get band-optimized configuration
      getBandOptimization: () => ({
        band,
        optimalChunkSize: this.getOptimalChunkSizeForBand(band),
        optimalConcurrency: this.getOptimalConcurrencyForBand(band),
        optimalPrecision: this.getOptimalPrecisionForBand(band),
        optimalNTTModulus: this.getOptimalNTTModulusForBand(band)
      })
    };
  }
  
  // Band optimization utilities
  
  private static getOptimalChunkSizeForBand(band: BandType): number {
    const chunkSizes = {
      [BandType.ULTRABASS]: 1024,
      [BandType.BASS]: 2048,
      [BandType.MIDRANGE]: 4096,
      [BandType.UPPER_MID]: 8192,
      [BandType.TREBLE]: 16384,
      [BandType.SUPER_TREBLE]: 32768,
      [BandType.ULTRASONIC_1]: 65536,
      [BandType.ULTRASONIC_2]: 131072
    };
    
    return chunkSizes[band] || 4096;
  }
  
  private static getOptimalConcurrencyForBand(band: BandType): number {
    const concurrencies = {
      [BandType.ULTRABASS]: 2,
      [BandType.BASS]: 4,
      [BandType.MIDRANGE]: 6,
      [BandType.UPPER_MID]: 8,
      [BandType.TREBLE]: 12,
      [BandType.SUPER_TREBLE]: 16,
      [BandType.ULTRASONIC_1]: 20,
      [BandType.ULTRASONIC_2]: 24
    };
    
    return concurrencies[band] || 8;
  }
  
  private static getOptimalPrecisionForBand(band: BandType): number {
    const precisions = {
      [BandType.ULTRABASS]: 64,
      [BandType.BASS]: 128,
      [BandType.MIDRANGE]: 256,
      [BandType.UPPER_MID]: 512,
      [BandType.TREBLE]: 1024,
      [BandType.SUPER_TREBLE]: 2048,
      [BandType.ULTRASONIC_1]: 4096,
      [BandType.ULTRASONIC_2]: 8192
    };
    
    return precisions[band] || 512;
  }
  
  private static getOptimalNTTModulusForBand(band: BandType): bigint {
    const moduli = {
      [BandType.ULTRABASS]: 998244353n,
      [BandType.BASS]: 998244353n,
      [BandType.MIDRANGE]: 2013265921n,
      [BandType.UPPER_MID]: 2013265921n,
      [BandType.TREBLE]: 2281701377n,
      [BandType.SUPER_TREBLE]: 2281701377n,
      [BandType.ULTRASONIC_1]: 2281701377n,
      [BandType.ULTRASONIC_2]: 2281701377n
    };
    
    return moduli[band] || 2013265921n;
  }
}

// Re-export enhanced adapters for direct use
export {
  EnhancedPrimeAdapter,
  EnhancedEncodingAdapter,
  EnhancedPrecisionAdapter,
  EnhancedStreamAdapter,
  createEnhancedPrimeAdapter,
  createEnhancedEncodingAdapter,
  createEnhancedPrecisionAdapter,
  createEnhancedStreamAdapter
};

// Re-export spectral-specific adapters
export {
  SpectralPrecisionAdapter,
  SpectralPrimeAdapter,
  createSpectralPrecisionAdapterImpl as createSpectralPrecisionAdapter,
  createSpectralPrimeAdapterImpl as createSpectralPrimeAdapter,
  createBandOptimizedPrecisionAdapter,
  createBandOptimizedPrimeAdapter
};

// Convenience exports
export const createSpectralAdapters = SpectralAdapterFactory.createSpectralSuite;
export default SpectralAdapterFactory;
