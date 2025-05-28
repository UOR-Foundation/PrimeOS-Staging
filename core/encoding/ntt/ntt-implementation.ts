/**
 * Complete Number Theoretic Transform Implementation
 * =================================================
 * 
 * Full NTT implementation for spectral transforms with proper mathematical
 * operations using modular arithmetic from the precision module.
 */

import { NTTError, WindowFunction } from './types';
import { mod, modPow, modularInverse } from './utils';

/**
 * Complete NTT implementation with proper mathematical operations
 */
export class CompleteNTT {
  private modulus: bigint;
  private primitiveRoot: bigint;
  private size: number;
  private rootsOfUnity: bigint[] = [];
  private inverseRootsOfUnity: bigint[] = [];
  private inverseN: bigint;
  
  constructor(modulus: bigint, primitiveRoot: bigint, maxSize: number = 1024) {
    this.modulus = modulus;
    this.primitiveRoot = primitiveRoot;
    this.size = maxSize;
    
    // Precompute roots of unity for efficiency
    this.precomputeRoots();
    
    // Precompute modular inverse of maxSize
    this.inverseN = modularInverse(BigInt(maxSize), modulus);
  }
  
  /**
   * Precompute roots of unity for forward and inverse transforms
   */
  private precomputeRoots(): void {
    // Forward roots of unity: ω^k where ω = primitiveRoot^((modulus-1)/size)
    const baseRoot = modPow(this.primitiveRoot, (this.modulus - 1n) / BigInt(this.size), this.modulus);
    
    this.rootsOfUnity = [];
    this.inverseRootsOfUnity = [];
    
    for (let k = 0; k < this.size; k++) {
      const root = modPow(baseRoot, BigInt(k), this.modulus);
      this.rootsOfUnity.push(root);
      
      // Inverse root is the modular inverse
      const invRoot = modularInverse(root, this.modulus);
      this.inverseRootsOfUnity.push(invRoot);
    }
  }
  
  /**
   * Forward NTT transform
   */
  forward(data: number[]): number[] {
    if (!Array.isArray(data)) {
      throw new NTTError('NTT', 'Input must be an array of numbers');
    }
    
    if (data.length === 0) {
      return [];
    }
    
    // Convert to BigInt for calculations
    const bigIntData = data.map(x => BigInt(x));
    const n = bigIntData.length;
    
    // Pad to next power of 2 if necessary
    const paddedSize = this.nextPowerOfTwo(n);
    while (bigIntData.length < paddedSize) {
      bigIntData.push(0n);
    }
    
    // Perform bit-reversal permutation
    const permuted = this.bitReversePermutation(bigIntData);
    
    // Cooley-Tukey FFT algorithm adapted for NTT
    const result = this.nttCooleyTukey(permuted, false);
    
    // Convert back to numbers and trim to original size
    return result.slice(0, n).map(x => Number(mod(x, this.modulus)));
  }
  
  /**
   * Inverse NTT transform
   */
  inverse(data: number[]): number[] {
    if (!Array.isArray(data)) {
      throw new NTTError('NTT', 'Input must be an array of numbers');
    }
    
    if (data.length === 0) {
      return [];
    }
    
    // Convert to BigInt for calculations
    const bigIntData = data.map(x => BigInt(x));
    const n = bigIntData.length;
    
    // Pad to next power of 2 if necessary
    const paddedSize = this.nextPowerOfTwo(n);
    while (bigIntData.length < paddedSize) {
      bigIntData.push(0n);
    }
    
    // Perform bit-reversal permutation
    const permuted = this.bitReversePermutation(bigIntData);
    
    // Cooley-Tukey algorithm for inverse
    const result = this.nttCooleyTukey(permuted, true);
    
    // Scale by 1/n and convert back to numbers
    const inverseN = modularInverse(BigInt(paddedSize), this.modulus);
    const scaled = result.map(x => mod(x * inverseN, this.modulus));
    
    return scaled.slice(0, n).map(x => Number(x));
  }
  
  /**
   * Cooley-Tukey NTT algorithm
   */
  private nttCooleyTukey(data: bigint[], inverse: boolean): bigint[] {
    const n = data.length;
    if (n <= 1) return [...data];
    
    const result = [...data];
    const roots = inverse ? this.inverseRootsOfUnity : this.rootsOfUnity;
    
    // Iterative Cooley-Tukey algorithm
    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2;
      const step = n / size;
      
      for (let i = 0; i < n; i += size) {
        for (let j = 0; j < halfSize; j++) {
          const u = result[i + j];
          const v = mod(result[i + j + halfSize] * roots[j * step], this.modulus);
          
          result[i + j] = mod(u + v, this.modulus);
          result[i + j + halfSize] = mod(u - v, this.modulus);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Bit-reversal permutation for FFT
   */
  private bitReversePermutation(data: bigint[]): bigint[] {
    const n = data.length;
    const result = new Array(n);
    
    for (let i = 0; i < n; i++) {
      result[i] = data[this.bitReverse(i, Math.log2(n))];
    }
    
    return result;
  }
  
  /**
   * Bit reverse a number
   */
  private bitReverse(num: number, bits: number): number {
    let result = 0;
    for (let i = 0; i < bits; i++) {
      result = (result << 1) | (num & 1);
      num >>= 1;
    }
    return result;
  }
  
  /**
   * Find next power of 2
   */
  private nextPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }
  
  /**
   * Verify round-trip transformation
   */
  verify(original: number[]): boolean {
    try {
      const forward = this.forward(original);
      const inverse = this.inverse(forward);
      
      // Check if results match within tolerance
      return original.every((val, i) => Math.abs(val - inverse[i]) < 1e-10);
    } catch {
      return false;
    }
  }
  
  /**
   * Apply window function to data before transform
   */
  applyWindow(data: number[], windowFunction: WindowFunction): number[] {
    const n = data.length;
    
    switch (windowFunction) {
      case WindowFunction.RECTANGULAR:
        return [...data]; // No modification
        
      case WindowFunction.HAMMING:
        return data.map((val, i) => 
          val * (0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1)))
        );
        
      case WindowFunction.BLACKMAN:
        return data.map((val, i) => 
          val * (0.42 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)) + 
                 0.08 * Math.cos(4 * Math.PI * i / (n - 1)))
        );
        
      case WindowFunction.KAISER:
        // Simplified Kaiser window (β = 5)
        const beta = 5;
        const alpha = (n - 1) / 2;
        return data.map((val, i) => {
          const x = (i - alpha) / alpha;
          const bessel = this.modifiedBesselI0(beta * Math.sqrt(1 - x * x));
          const normalization = this.modifiedBesselI0(beta);
          return val * (bessel / normalization);
        });
        
      default:
        return [...data];
    }
  }
  
  /**
   * Modified Bessel function I0 for Kaiser window
   */
  private modifiedBesselI0(x: number): number {
    let sum = 1;
    let term = 1;
    let k = 1;
    
    while (Math.abs(term) > 1e-10) {
      term *= (x * x) / (4 * k * k);
      sum += term;
      k++;
      if (k > 100) break; // Prevent infinite loop
    }
    
    return sum;
  }
  
  /**
   * Convolution using NTT
   */
  convolve(a: number[], b: number[]): number[] {
    const n = a.length + b.length - 1;
    const size = this.nextPowerOfTwo(n);
    
    // Pad arrays
    const paddedA = [...a];
    const paddedB = [...b];
    while (paddedA.length < size) paddedA.push(0);
    while (paddedB.length < size) paddedB.push(0);
    
    // Transform both sequences
    const transformedA = this.forward(paddedA);
    const transformedB = this.forward(paddedB);
    
    // Pointwise multiplication in frequency domain
    const product = transformedA.map((val, i) => 
      mod(BigInt(val) * BigInt(transformedB[i]), this.modulus)
    ).map(x => Number(x));
    
    // Inverse transform
    const result = this.inverse(product);
    
    return result.slice(0, n);
  }
  
  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      modulus: this.modulus,
      primitiveRoot: this.primitiveRoot,
      maxSize: this.size,
      precomputedRoots: this.rootsOfUnity.length
    };
  }
}
