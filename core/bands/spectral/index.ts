/**
 * Spectral Processing Module
 * =========================
 * 
 * Complete spectral analysis system using enhanced core module integration.
 * Provides NTT-based transforms, frequency domain analysis, and band optimization.
 */

import { BandType } from '../types';
import { SpectralAdapterFactory } from './adapters';

// Export spectral adapters
export * from './adapters';

/**
 * Spectral module configuration
 */
export interface SpectralModuleConfig {
  enableNTT: boolean;
  enableBandOptimization: boolean;
  enableCaching: boolean;
  defaultBand: BandType;
  nttSize: number;
  windowFunction: 'hann' | 'hamming' | 'blackman' | 'rectangular';
}

/**
 * Default spectral module configuration
 */
export const DEFAULT_SPECTRAL_CONFIG: SpectralModuleConfig = {
  enableNTT: true,
  enableBandOptimization: true,
  enableCaching: true,
  defaultBand: BandType.MIDRANGE,
  nttSize: 4096,
  windowFunction: 'hann'
};

/**
 * Spectral analysis result
 */
export interface SpectralAnalysisResult {
  magnitudes: number[];
  phases: number[];
  frequencies: number[];
  band: BandType;
  powerSpectrum: number[];
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: number;
  bandEnergy: number;
}

/**
 * Complete spectral analysis system
 */
export class SpectralModule {
  private adapters: any;
  private config: SpectralModuleConfig;
  private cache = new Map<string, any>();
  private stats = {
    transformsPerformed: 0,
    analysisCount: 0,
    cacheHits: 0,
    bandOptimizations: 0
  };
  
  constructor(
    modules: {
      primeRegistry: any;
      encodingModule: any;
      precisionModule: any;
      streamProcessor: any;
    },
    config: Partial<SpectralModuleConfig> = {}
  ) {
    this.config = { ...DEFAULT_SPECTRAL_CONFIG, ...config };
    
    // Create spectral adapters using the factory
    this.adapters = SpectralAdapterFactory.createSpectralSuite(
      modules,
      this.config.defaultBand,
      {
        precision: { enableCaching: this.config.enableCaching },
        prime: { enableCaching: this.config.enableCaching },
        encoding: { enableNTT: this.config.enableNTT },
        stream: { enableOptimization: this.config.enableBandOptimization }
      }
    );
  }
  
  /**
   * Analyze spectral content for a specific band
   */
  async analyze(
    data: number[],
    band: BandType = this.config.defaultBand,
    sampleRate: number = 44100
  ): Promise<SpectralAnalysisResult> {
    this.stats.analysisCount++;
    
    // Check cache first
    const cacheKey = `analysis-${band}-${data.length}-${this.hashArray(data)}`;
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey);
    }
    
    // Get band-optimized adapters
    const bandAdapters = this.getBandOptimizedAdapters(band);
    
    // Apply windowing function
    const windowedData = this.applyWindowFunction(data, this.config.windowFunction);
    
    // Perform spectral transform using NTT
    const nttResult = await this.performNTTTransform(windowedData, band);
    
    // Calculate spectral features
    const magnitudes = this.calculateMagnitudeSpectrum(nttResult);
    const phases = this.calculatePhaseSpectrum(nttResult);
    const frequencies = this.generateFrequencyBins(this.config.nttSize, sampleRate);
    
    // Calculate derived metrics
    const powerSpectrum = magnitudes.map(mag => mag * mag);
    const spectralCentroid = this.calculateSpectralCentroid(magnitudes, frequencies);
    const spectralRolloff = this.calculateSpectralRolloff(powerSpectrum, frequencies);
    const spectralFlux = this.calculateSpectralFlux(magnitudes);
    const bandEnergy = this.calculateBandEnergy(powerSpectrum, frequencies, band);
    
    const result: SpectralAnalysisResult = {
      magnitudes,
      phases,
      frequencies,
      band,
      powerSpectrum,
      spectralCentroid,
      spectralRolloff,
      spectralFlux,
      bandEnergy
    };
    
    // Cache result
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, result);
    }
    
    return result;
  }
  
  /**
   * Perform multi-band spectral analysis
   */
  async analyzeMultiBand(
    data: number[],
    bands: BandType[] = Object.values(BandType),
    sampleRate: number = 44100
  ): Promise<Map<BandType, SpectralAnalysisResult>> {
    const results = new Map<BandType, SpectralAnalysisResult>();
    
    // Process each band
    await Promise.all(
      bands.map(async (band) => {
        const result = await this.analyze(data, band, sampleRate);
        results.set(band, result);
      })
    );
    
    return results;
  }
  
  // Private helper methods
  
  private async performNTTTransform(data: number[], band: BandType): Promise<number[]> {
    this.stats.transformsPerformed++;
    
    // Get band-optimized parameters
    const bandOptimization = this.adapters?.getBandOptimization?.();
    const modulus = bandOptimization?.optimalNTTModulus;
    
    // Use encoding module for NTT if available
    try {
      if (this.adapters?.encoding && typeof this.adapters.encoding.applyNTT === 'function') {
        return await this.adapters.encoding.applyNTT(data);
      }
    } catch (error) {
      console.warn('NTT encoding failed, using fallback');
    }
    
    // Fallback to basic FFT-like transform
    return this.basicSpectralTransform(data);
  }
  
  private basicSpectralTransform(data: number[]): number[] {
    // Simple DFT implementation as fallback
    const N = data.length;
    const result = new Array(N * 2); // Real and imaginary parts
    
    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = -2 * Math.PI * k * n / N;
        real += data[n] * Math.cos(angle);
        imag += data[n] * Math.sin(angle);
      }
      
      result[k * 2] = real;
      result[k * 2 + 1] = imag;
    }
    
    return result;
  }
  
  private applyWindowFunction(data: number[], windowType: string): number[] {
    const n = data.length;
    const windowed = new Array(n);
    
    switch (windowType) {
      case 'hann':
        for (let i = 0; i < n; i++) {
          const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
          windowed[i] = data[i] * window;
        }
        break;
        
      case 'hamming':
        for (let i = 0; i < n; i++) {
          const window = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
          windowed[i] = data[i] * window;
        }
        break;
        
      case 'rectangular':
      default:
        return [...data];
    }
    
    return windowed;
  }
  
  private calculateMagnitudeSpectrum(complexData: number[]): number[] {
    const magnitudes = [];
    
    for (let i = 0; i < complexData.length; i += 2) {
      const real = complexData[i] || 0;
      const imag = complexData[i + 1] || 0;
      const magnitude = Math.sqrt(real * real + imag * imag);
      magnitudes.push(magnitude);
    }
    
    return magnitudes;
  }
  
  private calculatePhaseSpectrum(complexData: number[]): number[] {
    const phases = [];
    
    for (let i = 0; i < complexData.length; i += 2) {
      const real = complexData[i] || 0;
      const imag = complexData[i + 1] || 0;
      const phase = Math.atan2(imag, real);
      phases.push(phase);
    }
    
    return phases;
  }
  
  private generateFrequencyBins(size: number, sampleRate: number): number[] {
    const frequencies = [];
    const freqResolution = sampleRate / size;
    
    for (let i = 0; i < size / 2; i++) {
      frequencies.push(i * freqResolution);
    }
    
    return frequencies;
  }
  
  private calculateSpectralCentroid(magnitudes: number[], frequencies: number[]): number {
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < Math.min(magnitudes.length, frequencies.length); i++) {
      const freq = frequencies[i];
      const mag = magnitudes[i];
      if (freq !== undefined && mag !== undefined) {
        weightedSum += freq * mag;
        magnitudeSum += mag;
      }
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }
  
  private calculateSpectralRolloff(powerSpectrum: number[], frequencies: number[], threshold: number = 0.95): number {
    const totalEnergy = powerSpectrum.reduce((sum, power) => sum + power, 0);
    const targetEnergy = totalEnergy * threshold;
    
    let cumulativeEnergy = 0;
    for (let i = 0; i < Math.min(powerSpectrum.length, frequencies.length); i++) {
      const power = powerSpectrum[i];
      const freq = frequencies[i];
      if (power !== undefined) {
        cumulativeEnergy += power;
        if (cumulativeEnergy >= targetEnergy && freq !== undefined) {
          return freq;
        }
      }
    }
    
    const lastFreq = frequencies[frequencies.length - 1];
    return lastFreq !== undefined ? lastFreq : 0;
  }
  
  private calculateSpectralFlux(magnitudes: number[]): number {
    let flux = 0;
    for (let i = 1; i < magnitudes.length; i++) {
      const diff = magnitudes[i] - magnitudes[i - 1];
      flux += diff * diff;
    }
    return Math.sqrt(flux);
  }
  
  private calculateBandEnergy(powerSpectrum: number[], frequencies: number[], band: BandType): number {
    const bandLimits = this.getBandFrequencyLimits(band);
    let energy = 0;
    
    for (let i = 0; i < Math.min(frequencies.length, powerSpectrum.length); i++) {
      const freq = frequencies[i];
      const power = powerSpectrum[i];
      if (typeof freq === 'number' && typeof power === 'number' && freq >= bandLimits.min && freq <= bandLimits.max) {
        energy += power;
      }
    }
    
    return energy;
  }
  
  private getBandFrequencyLimits(band: BandType): { min: number; max: number } {
    const limits = {
      [BandType.ULTRABASS]: { min: 16, max: 60 },
      [BandType.BASS]: { min: 60, max: 250 },
      [BandType.MIDRANGE]: { min: 250, max: 2000 },
      [BandType.UPPER_MID]: { min: 2000, max: 4000 },
      [BandType.TREBLE]: { min: 4000, max: 8000 },
      [BandType.SUPER_TREBLE]: { min: 8000, max: 16000 },
      [BandType.ULTRASONIC_1]: { min: 16000, max: 20000 },
      [BandType.ULTRASONIC_2]: { min: 20000, max: 22050 }
    };
    
    return limits[band] || { min: 0, max: 22050 };
  }
  
  private getBandOptimizedAdapters(band: BandType) {
    const cacheKey = `adapters-${band}`;
    
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // For now, return the default adapters
    // In a full implementation, we would create band-specific adapters here
    const bandAdapters = this.adapters;
    
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, bandAdapters);
    }
    
    this.stats.bandOptimizations++;
    
    return bandAdapters;
  }
  
  private hashArray(data: number[]): string {
    return data.slice(0, 8).map(n => n.toFixed(3)).join(',');
  }
  
  /**
   * Get processing statistics
   */
  getStats() {
    return { ...this.stats };
  }
  
  /**
   * Clear cache and reset statistics
   */
  clearCache(): void {
    this.cache.clear();
    this.stats = {
      transformsPerformed: 0,
      analysisCount: 0,
      cacheHits: 0,
      bandOptimizations: 0
    };
  }
  
  /**
   * Configure spectral processing
   */
  configure(config: Partial<SpectralModuleConfig>): void {
    this.config = { ...this.config, ...config };
    this.clearCache(); // Clear cache when configuration changes
  }
}

/**
 * Create a complete spectral analysis system
 */
export function createSpectralModule(
  modules: {
    primeRegistry: any;
    encodingModule: any;
    precisionModule: any;
    streamProcessor: any;
  },
  config: Partial<SpectralModuleConfig> = {}
): SpectralModule {
  return new SpectralModule(modules, config);
}

/**
 * Utility function to create spectral module with core modules
 */
export async function createSpectralModuleWithCoreModules(
  config: Partial<SpectralModuleConfig> = {}
): Promise<SpectralModule> {
  // Import core modules
  const { createAndInitializePrimeRegistry } = await import('../../prime');
  const { createAndInitializeEncoding } = await import('../../encoding');
  const { createAndInitializePrecision } = await import('../../precision');
  const { createAndInitializeStream } = await import('../../stream');
  
  // Initialize core modules
  const primeRegistry = await createAndInitializePrimeRegistry({
    preloadCount: 2000,
    useStreaming: true,
    enableLogs: false
  });
  
  const encodingModule = await createAndInitializeEncoding({
    enableNTT: true,
    enableSpectralTransforms: true,
    primeRegistry
    // integrityModule will be optional and handled internally
  });
  
  const precisionModule = await createAndInitializePrecision({
    enableCaching: true,
    cacheSize: 15000,
    useOptimized: true
  });
  
  const streamProcessor = await createAndInitializeStream({
    defaultChunkSize: 4096,
    maxConcurrency: 8,
    enableOptimization: true
  });
  
  return createSpectralModule({
    primeRegistry,
    encodingModule,
    precisionModule,
    streamProcessor
  }, config);
}

// Re-export important types
export { BandType } from '../types';
export { SpectralAdapterFactory } from './adapters';

// Export for convenience
export default SpectralModule;
