/**
 * Debug Model Test
 * ===============
 * 
 * Simple test to debug model cache behavior
 */

import { createAndInitializeMathUtilsModel } from './model';

async function debugModel() {
  console.log('=== Model Debug Test ===');
  
  try {
    // Create model
    const model = await createAndInitializeMathUtilsModel({
      enableCache: true,
      debug: true
    });
    
    console.log('1. Model created and initialized');
    
    // Check initial state
    let state = model.getState();
    console.log('2. Initial state:', {
      enableCache: state.config.enableCache,
      cacheSize: state.cache?.bitLengthCacheSize,
      cacheHits: state.cache?.bitLengthCacheHits,
      cacheMisses: state.cache?.bitLengthCacheMisses
    });
    
    // Perform some operations
    console.log('3. Performing bitLength operations...');
    const result1 = model.bitLength(BigInt(1234));
    console.log('   First call result:', result1);
    
    const result2 = model.bitLength(BigInt(5678));
    console.log('   Second call result:', result2);
    
    const result3 = model.bitLength(BigInt(1234)); // Should be cache hit
    console.log('   Third call result (repeat):', result3);
    
    // Check final state
    state = model.getState();
    console.log('4. Final state:', {
      enableCache: state.config.enableCache,
      cacheSize: state.cache?.bitLengthCacheSize,
      cacheHits: state.cache?.bitLengthCacheHits,
      cacheMisses: state.cache?.bitLengthCacheMisses
    });
    
    await model.terminate();
    
  } catch (error) {
    console.error('Model debug error:', error);
  }
}

debugModel().then(() => {
  console.log('=== Debug Complete ===');
}).catch(console.error);
