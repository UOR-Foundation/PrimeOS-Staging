/**
 * Mock implementation of the model module
 */

import { 
  ModelInterface, 
  ModelOptions, 
  ModelResult, 
  ModelState, 
  ModelLifecycleState 
} from '../../../../os/model/types';

/**
 * Create a mock model implementation
 */
export function createModelMock(): ModelInterface {
  const state: ModelState = {
    lifecycle: ModelLifecycleState.Ready,
    lastStateChangeTime: Date.now(),
    uptime: 0,
    operationCount: {
      total: 0,
      success: 0,
      failed: 0
    }
  };
  
  return {
    initialize: jest.fn().mockResolvedValue({
      success: true,
      data: { initialized: true },
      timestamp: Date.now(),
      source: 'mock-model'
    }),
    
    process: jest.fn().mockImplementation((input) => Promise.resolve({
      success: true,
      data: input,
      timestamp: Date.now(),
      source: 'mock-model'
    })),
    
    getState: jest.fn().mockReturnValue(state),
    
    reset: jest.fn().mockResolvedValue({
      success: true,
      data: { reset: true },
      timestamp: Date.now(),
      source: 'mock-model'
    }),
    
    terminate: jest.fn().mockResolvedValue({
      success: true,
      data: { terminated: true },
      timestamp: Date.now(),
      source: 'mock-model'
    }),
    
    createResult: jest.fn().mockImplementation((success, data, error) => ({
      success,
      data,
      error,
      timestamp: Date.now(),
      source: 'mock-model'
    }))
  };
}

// Export a default instance
export const modelMock = createModelMock();
