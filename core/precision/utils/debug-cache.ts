/**
 * Debug Cache Test
 * ===============
 * 
 * Simple test to debug cache behavior
 */

import { createLRUCache } from '../cache';

async function debugCache() {
  console.log('=== Cache Debug Test ===');
  
  try {
    // Create cache
    const cache = createLRUCache<string, number>(10, {
      name: 'debug-cache',
      metrics: true
    });
    
    console.log('1. Cache created:', !!cache);
    console.log('2. Cache methods:', {
      get: typeof cache.get,
      set: typeof cache.set,
      has: typeof cache.has,
      getMetrics: typeof cache.getMetrics
    });
    
    // Initialize if needed
    if (cache.initialize) {
      await cache.initialize();
      console.log('3. Cache initialized');
    }
    
    // Test basic operations
    console.log('4. Initial metrics:', cache.getMetrics?.());
    
    // Set a value
    const setResult = cache.set?.('test', 42);
    console.log('5. Set result:', setResult);
    console.log('6. Metrics after set:', cache.getMetrics?.());
    
    // Check if value exists
    const hasResult = cache.has?.('test');
    console.log('7. Has result:', hasResult);
    
    // Get the value
    const getValue = cache.get?.('test');
    console.log('8. Get result:', getValue);
    console.log('9. Final metrics:', cache.getMetrics?.());
    
    // Test cache miss
    const missValue = cache.get?.('nonexistent');
    console.log('10. Miss result:', missValue);
    console.log('11. Metrics after miss:', cache.getMetrics?.());
    
  } catch (error) {
    console.error('Cache debug error:', error);
  }
}

debugCache().then(() => {
  console.log('=== Debug Complete ===');
}).catch(console.error);
