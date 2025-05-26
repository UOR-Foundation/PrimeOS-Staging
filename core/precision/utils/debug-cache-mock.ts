/**
 * Debug Cache Mock Test
 * ====================
 * 
 * Simple test to debug cache mock behavior in the utils module
 */

import { createLRUCache } from '../cache';

async function debugCacheMock() {
  console.log('=== Cache Mock Debug Test ===');
  
  try {
    // Create cache using the same method as the utils model
    const cache = createLRUCache<string, number>(1000, {
      name: 'bitLength-cache',
      metrics: true
    });
    
    console.log('1. Cache created:', !!cache);
    console.log('2. Cache methods:', {
      get: typeof cache.get,
      set: typeof cache.set,
      has: typeof cache.has,
      getMetrics: typeof cache.getMetrics
    });
    
    // Test basic operations
    cache.set('test1', 42);
    console.log('3. Set test1=42');
    
    const value = cache.get('test1');
    console.log('4. Get test1:', value);
    
    const hasKey = cache.has('test1');
    console.log('5. Has test1:', hasKey);
    
    // Test metrics
    if (cache.getMetrics) {
      const metrics = cache.getMetrics();
      console.log('6. Metrics:', metrics);
      console.log('7. Metrics structure:', {
        currentSize: metrics.currentSize,
        hitCount: metrics.hitCount,
        missCount: metrics.missCount
      });
    } else {
      console.log('6. No getMetrics method available');
    }
    
    // Test cache miss
    const missValue = cache.get('nonexistent');
    console.log('8. Get nonexistent:', missValue);
    
    // Get metrics again
    if (cache.getMetrics) {
      const finalMetrics = cache.getMetrics();
      console.log('9. Final metrics:', finalMetrics);
    }
    
  } catch (error) {
    console.error('Cache mock debug error:', error);
  }
}

debugCacheMock().then(() => {
  console.log('=== Debug Complete ===');
}).catch(console.error);
