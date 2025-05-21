/**
 * Verification Cache Policies
 * =======================
 * 
 * Cache eviction policies for verification cache.
 * 
 * NOTE: These policy implementations have been removed.
 * Use the precision/cache module instead through the adapter.
 */

// The policy implementations have been removed.
// The adapter now uses precision/cache under the hood.

// For backward compatibility, we re-export the policy enum
export { CacheEvictionPolicy } from '../types';
