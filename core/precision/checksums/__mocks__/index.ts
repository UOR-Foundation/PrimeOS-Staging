/**
 * Checksums Module Mocks Export
 * 
 * This file exports mocks for the checksums module that can be used by other modules
 * in their tests.
 */

// Re-export model and logging mocks
export * from './os-model-mock';
export * from './os-logging-mock';
export * from './test-mock';

// Import actual Checksums types for mocking
import { 
  ChecksumOptions,
  ChecksumState,
  ChecksumsModelInterface,
  ChecksumExtractionResult,
  XorHashState
} from '../types';
import { Factor } from '../../types';

import { ModelResult, ModelLifecycleState } from './os-model-mock';
import { createLogging } from './os-logging-mock';
import { createMockChecksums, CHECKSUM_CONSTANTS } from './test-mock';

// Export constants
export { CHECKSUM_CONSTANTS };

// Export factory function
export { createMockChecksums };
