/**
 * Model Types
 * ===========
 * 
 * Type definitions for the model module that define the standard pattern for all PrimeOS modules.
 */

/**
 * Model lifecycle state
 */
export enum ModelLifecycleState {
  Uninitialized = 'uninitialized',
  Initializing = 'initializing',
  Ready = 'ready',
  Processing = 'processing',
  Error = 'error',
  Terminating = 'terminating',
  Terminated = 'terminated'
}

/**
 * Standard options interface for all modules
 */
export interface ModelOptions {
  /**
   * Enable debug mode to receive additional logs and diagnostics
   */
  debug?: boolean;
  
  /**
   * Unique identifier for the module instance
   */
  id?: string;
  
  /**
   * Module name - should match the standard naming convention
   */
  name?: string;
  
  /**
   * Module version for compatibility checking
   */
  version?: string;
  
  /**
   * Dependencies on other modules
   */
  dependencies?: Record<string, string>;
}

/**
 * Standard result format for all operations
 */
export interface ModelResult<T = unknown> {
  /**
   * Success indicator
   */
  success: boolean;
  
  /**
   * Result data with optional generic type
   */
  data?: T;
  
  /**
   * Error message if unsuccessful
   */
  error?: string;
  
  /**
   * Error code if applicable
   */
  errorCode?: number | string;
  
  /**
   * Operation timestamp
   */
  timestamp: number;
  
  /**
   * Duration of operation in milliseconds
   */
  duration?: number;
  
  /**
   * Source module identifier
   */
  source: string;
}

/**
 * Internal state representation for a module
 */
export interface ModelState {
  /**
   * Current lifecycle state
   */
  lifecycle: ModelLifecycleState;
  
  /**
   * Timestamp of last state change
   */
  lastStateChangeTime: number;
  
  /**
   * Module uptime in milliseconds
   */
  uptime: number;
  
  /**
   * Operation count statistics
   */
  operationCount: {
    total: number;
    success: number;
    failed: number;
  };
  
  /**
   * Custom properties specific to each module implementation
   */
  custom?: Record<string, unknown>;
}

/**
 * Core interface for all module functionality
 */
export interface ModelInterface {
  /**
   * Initialize the module with given configuration
   */
  initialize(): Promise<ModelResult>;
  
  /**
   * Process input data and return results
   */
  process<T = unknown, R = unknown>(input: T): Promise<ModelResult<R>>;
  
  /**
   * Get current module state
   */
  getState(): ModelState;
  
  /**
   * Reset module to initial state
   */
  reset(): Promise<ModelResult>;
  
  /**
   * Terminate the module, releasing resources
   */
  terminate(): Promise<ModelResult>;
  
  /**
   * Create a standardized result object
   */
  createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T>;
}

/**
 * Options for creating a new module
 */
export interface CreateModuleOptions {
  /**
   * Module name in kebab-case (required)
   */
  name: string;
  
  /**
   * Target directory for the new module (optional, defaults to current directory)
   */
  path?: string;
  
  /**
   * Module description (optional)
   */
  description?: string;
  
  /**
   * Parent module name for dependencies (optional, defaults to 'primeos')
   */
  parent?: string;
  
  /**
   * Whether to install the module in the main package.json (optional)
   */
  install?: boolean;
  
  /**
   * Whether to run npm install after creating module (optional)
   */
  npm?: boolean;
}
