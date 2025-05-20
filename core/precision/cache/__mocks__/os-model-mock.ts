/**
 * OS Model Mock for Cache Module
 * 
 * This file re-exports the model mock from the utils/__mocks__ directory
 * to maintain consistency across precision modules.
 */

// Re-export everything from the utils/__mocks__ directory
export * from '../../utils/__mocks__/os-model-mock';

// Re-export the types and classes from the actual model module for compatibility
export { 
  ModelResult, 
  ModelLifecycleState 
} from '../../../../os/model/types';

export { BaseModel } from '../../../../os/model';
