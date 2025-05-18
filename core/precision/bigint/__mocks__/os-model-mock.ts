/**
 * OS Model Mock for BigInt Module
 * 
 * This file re-exports the model mock from the model's mocks directory
 * to maintain compatibility with the module's test infrastructure.
 */

// Import the interfaces from the types file
import { 
  ModelInterface, 
  ModelResult, 
  ModelOptions 
} from '../../../../os/model/types';

// Import the mock implementations
import {
  ModelLifecycleState,
  BaseModel
} from '../../../../os/model/__mocks__';

// Re-export everything
export {
  ModelInterface,
  ModelResult,
  ModelOptions,
  ModelLifecycleState,
  BaseModel
};
