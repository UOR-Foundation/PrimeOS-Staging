/**
 * Cross-Platform Crypto Utilities
 * ===============================
 * 
 * Provides a robust cross-platform solution for cryptographic operations.
 * Works in both Node.js and browser environments.
 */

/**
 * Interface for crypto providers
 */
interface CryptoProvider {
  getRandomBytes(byteLength: number): Uint8Array;
  isAvailable(): boolean;
  name: string;
}

/**
 * Web Crypto API provider
 */
class WebCryptoProvider implements CryptoProvider {
  name = 'WebCrypto';
  
  isAvailable(): boolean {
    return typeof globalThis !== 'undefined' && 
           typeof globalThis.crypto !== 'undefined' &&
           typeof globalThis.crypto.getRandomValues === 'function';
  }
  
  getRandomBytes(byteLength: number): Uint8Array {
    if (!this.isAvailable()) {
      throw new Error('Web Crypto API not available');
    }
    
    const bytes = new Uint8Array(byteLength);
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }
}

/**
 * Node.js crypto module provider
 */
class NodeCryptoProvider implements CryptoProvider {
  name = 'NodeCrypto';
  private cryptoModule: any = null;
  
  isAvailable(): boolean {
    if (this.cryptoModule !== null) {
      return true;
    }
    
    try {
      // Check if we're in Node.js environment
      if (typeof process !== 'undefined' && 
          process.versions && 
          process.versions.node) {
        // Try to load crypto module
        this.cryptoModule = require('crypto');
        return true;
      }
    } catch (e) {
      // Not in Node.js or crypto not available
    }
    
    return false;
  }
  
  getRandomBytes(byteLength: number): Uint8Array {
    if (!this.isAvailable()) {
      throw new Error('Node.js crypto module not available');
    }
    
    const buffer = this.cryptoModule.randomBytes(byteLength);
    return new Uint8Array(buffer);
  }
}

/**
 * MSCrypto provider for older IE browsers
 */
class MSCryptoProvider implements CryptoProvider {
  name = 'MSCrypto';
  
  isAvailable(): boolean {
    return typeof globalThis !== 'undefined' &&
           typeof (globalThis as any).msCrypto !== 'undefined' &&
           typeof (globalThis as any).msCrypto.getRandomValues === 'function';
  }
  
  getRandomBytes(byteLength: number): Uint8Array {
    if (!this.isAvailable()) {
      throw new Error('MS Crypto API not available');
    }
    
    const bytes = new Uint8Array(byteLength);
    (globalThis as any).msCrypto.getRandomValues(bytes);
    return bytes;
  }
}

/**
 * Fallback provider using Math.random (NOT SECURE - for testing only)
 */
class FallbackProvider implements CryptoProvider {
  name = 'Fallback (INSECURE)';
  
  isAvailable(): boolean {
    return true; // Always available but not secure
  }
  
  getRandomBytes(byteLength: number): Uint8Array {
    console.warn('Using insecure Math.random() for crypto operations. This should only be used for testing!');
    
    const bytes = new Uint8Array(byteLength);
    for (let i = 0; i < byteLength; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }
}

/**
 * Crypto manager that selects the best available provider
 */
class CryptoManager {
  private providers: CryptoProvider[] = [
    new WebCryptoProvider(),
    new NodeCryptoProvider(),
    new MSCryptoProvider()
  ];
  
  private selectedProvider: CryptoProvider | null = null;
  private allowInsecure: boolean = false;
  
  /**
   * Configure whether to allow insecure fallback
   */
  setAllowInsecure(allow: boolean): void {
    this.allowInsecure = allow;
    if (allow && !this.selectedProvider) {
      // Re-select provider with fallback option
      this.selectProvider();
    }
  }
  
  /**
   * Select the best available crypto provider
   */
  private selectProvider(): CryptoProvider {
    // Try each provider in order
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        this.selectedProvider = provider;
        return provider;
      }
    }
    
    // If no secure provider is available and insecure is allowed
    if (this.allowInsecure) {
      const fallback = new FallbackProvider();
      this.selectedProvider = fallback;
      return fallback;
    }
    
    throw new Error('No secure random number generator available. Enable insecure mode for testing only.');
  }
  
  /**
   * Get the current provider
   */
  getProvider(): CryptoProvider {
    if (!this.selectedProvider) {
      return this.selectProvider();
    }
    return this.selectedProvider;
  }
  
  /**
   * Get cryptographically secure random bytes
   */
  getRandomBytes(byteLength: number): Uint8Array {
    const provider = this.getProvider();
    return provider.getRandomBytes(byteLength);
  }
  
  /**
   * Get information about the current provider
   */
  getProviderInfo(): { name: string; secure: boolean } {
    const provider = this.getProvider();
    return {
      name: provider.name,
      secure: provider.name !== 'Fallback (INSECURE)'
    };
  }
  
  /**
   * Reset provider selection
   */
  reset(): void {
    this.selectedProvider = null;
  }
}

// Create singleton instance
const cryptoManager = new CryptoManager();

/**
 * Get cryptographically secure random bytes
 * 
 * @param byteLength - Number of bytes to generate
 * @returns Uint8Array of random bytes
 * @throws Error if no secure random source is available
 */
export function getSecureRandomBytes(byteLength: number): Uint8Array {
  return cryptoManager.getRandomBytes(byteLength);
}

/**
 * Configure crypto settings
 */
export interface CryptoConfig {
  /**
   * Allow insecure Math.random() fallback (for testing only)
   */
  allowInsecure?: boolean;
}

/**
 * Configure the crypto utilities
 */
export function configureCrypto(config: CryptoConfig): void {
  if (config.allowInsecure !== undefined) {
    cryptoManager.setAllowInsecure(config.allowInsecure);
  }
}

/**
 * Get information about the current crypto provider
 */
export function getCryptoInfo(): { name: string; secure: boolean } {
  return cryptoManager.getProviderInfo();
}

/**
 * Reset crypto provider selection
 */
export function resetCrypto(): void {
  cryptoManager.reset();
}

/**
 * Generate a random BigInt with the specified number of bits
 * 
 * @param bits - Number of bits for the random number
 * @returns Random BigInt value
 */
export function getRandomBigInt(bits: number): bigint {
  if (bits <= 0) {
    throw new Error('Bit length must be positive');
  }
  
  // Calculate the byte length
  const byteLength = Math.ceil(bits / 8);
  
  // Get random bytes
  const bytes = getSecureRandomBytes(byteLength);
  
  // Ensure we don't exceed the requested bit length
  const extraBits = byteLength * 8 - bits;
  if (extraBits > 0) {
    bytes[byteLength - 1] &= (1 << (8 - extraBits)) - 1;
  }
  
  // Convert to BigInt
  let result = BigInt(0);
  for (let i = byteLength - 1; i >= 0; i--) {
    result = (result << BigInt(8)) | BigInt(bytes[i]);
  }
  
  return result;
}

/**
 * Generate a random BigInt in the range [min, max)
 * 
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns Random BigInt in the specified range
 */
export function getRandomBigIntRange(min: bigint, max: bigint): bigint {
  if (min >= max) {
    throw new Error('Invalid range: min must be less than max');
  }
  
  const range = max - min;
  const bits = range.toString(2).length;
  
  // Generate random values until we get one in range
  let result: bigint;
  do {
    result = getRandomBigInt(bits);
  } while (result >= range);
  
  return result + min;
}
