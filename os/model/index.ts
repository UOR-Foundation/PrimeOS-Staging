/**
 * Model Implementation
 * ===================
 * 
 * This module implements the standard definition pattern for all PrimeOS modules.
 * It serves as the base class that other modules should extend or implement.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelResult,
  ModelState,
  ModelLifecycleState
} from './types';
import { createLogging, LoggingInterface, LogLevel, LogEntry } from '../logging';

/**
 * Default options for model
 */
const DEFAULT_OPTIONS: ModelOptions = {
  debug: false,
  name: 'unnamed-module',
  version: '0.1.0'
};

/**
 * Base implementation of the model interface
 * This class can be extended by specific module implementations
 */
export abstract class BaseModel implements ModelInterface {
  protected options: ModelOptions;
  protected state: ModelState;
  protected logger: LoggingInterface;
  private startTime: number;
  
  /**
   * Create a new model instance
   */
  constructor(options: ModelOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.startTime = Date.now();
    this.state = {
      lifecycle: ModelLifecycleState.Uninitialized,
      lastStateChangeTime: this.startTime,
      uptime: 0,
      operationCount: {
        total: 0,
        success: 0,
        failed: 0
      }
    };
    
    // Initialize logger with model name as source
    this.logger = createLogging({
      name: this.options.name || DEFAULT_OPTIONS.name,
      debug: this.options.debug,
      minLevel: this.options.debug ? LogLevel.TRACE : LogLevel.INFO
    });
    
    if (this.options.debug) {
      console.log(`[${this.getModuleIdentifier()}] Created model instance`);
    }
  }
  
  /**
   * Get module logger instance
   */
  getLogger(): LoggingInterface {
    return this.logger;
  }
  
  /**
   * Log at specified level (helper method)
   */
  protected logMessage(level: LogLevel, message: string, data?: unknown): Promise<void> {
    return this.logger.log(level, message, data).then(() => {});
  }
  
  /**
   * Initialize the module with given configuration
   * Subclasses should override this with their specific initialization logic
   */
  async initialize(): Promise<ModelResult> {
    const startTime = Date.now();
    this.updateLifecycle(ModelLifecycleState.Initializing);
    
    try {
      // Initialize logger first
      await this.logger.initialize();
      await this.logger.info('Initializing module', this.options);
      
      // Subclasses should implement their initialization logic
      await this.onInitialize();
      
      this.updateLifecycle(ModelLifecycleState.Ready);
      await this.logger.info('Module initialized successfully');
      
      return this.createResult(
        true, 
        { initialized: true },
        undefined
      );
    } catch (error) {
      this.updateLifecycle(ModelLifecycleState.Error);
      
      await this.logger.error('Initialization failed', error);
      
      if (this.options.debug) {
        console.error(`[${this.getModuleIdentifier()}] Initialization error:`, error);
      }
      
      return this.createResult(
        false,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  
  /**
   * Hook for subclass initialization implementation
   */
  protected async onInitialize(): Promise<void> {
    // Default implementation does nothing
    // Subclasses should override this method
  }
  
  /**
   * Process input data and return results
   * Subclasses should implement their own processing logic by overriding onProcess
   */
  async process<T = unknown, R = unknown>(input: T): Promise<ModelResult<R>> {
    const startTime = Date.now();
    this.state.operationCount.total++;
    
    if (this.state.lifecycle !== ModelLifecycleState.Ready) {
      this.state.operationCount.failed++;
      const errorMessage = `Cannot process in ${this.state.lifecycle} state. Module must be in Ready state.`;
      await this.logger.warn(errorMessage);
      return this.createResult(
        false,
        undefined as any,
        errorMessage
      );
    }
    
    this.updateLifecycle(ModelLifecycleState.Processing);
    
    await this.logger.debug('Processing input', input);
    if (this.options.debug) {
      console.log(`[${this.getModuleIdentifier()}] Processing input:`, input);
    }
    
    try {
      // Call subclass implementation
      const result = await this.onProcess(input) as R;
      
      this.updateLifecycle(ModelLifecycleState.Ready);
      this.state.operationCount.success++;
      
      await this.logger.debug('Processing completed successfully', { resultSummary: typeof result });
      return this.createResult(true, result, undefined);
    } catch (error) {
      this.updateLifecycle(ModelLifecycleState.Error);
      this.state.operationCount.failed++;
      
      await this.logger.error('Processing error', error);
      
      if (this.options.debug) {
        console.error(`[${this.getModuleIdentifier()}] Processing error:`, error);
      }
      
      return this.createResult(
        false,
        undefined as any,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  
  /**
   * Hook for subclass processing implementation
   */
  protected abstract onProcess<T = unknown, R = unknown>(input: T): Promise<R>;
  
  /**
   * Get current module state
   */
  getState(): ModelState {
    // Update uptime when state is requested
    this.state.uptime = Date.now() - this.startTime;
    return { ...this.state };
  }
  
  /**
   * Reset module to initial state
   */
  async reset(): Promise<ModelResult> {
    const startTime = Date.now();
    
    await this.logger.info('Resetting module');
    
    try {
      // Allow subclasses to perform custom reset logic
      await this.onReset();
      
      // Reset state counters
      this.state.operationCount = {
        total: 0,
        success: 0,
        failed: 0
      };
      
      this.updateLifecycle(ModelLifecycleState.Ready);
      
      await this.logger.info('Module reset completed');
      return this.createResult(true, { reset: true }, undefined);
    } catch (error) {
      this.updateLifecycle(ModelLifecycleState.Error);
      
      await this.logger.error('Reset failed', error);
      
      if (this.options.debug) {
        console.error(`[${this.getModuleIdentifier()}] Reset error:`, error);
      }
      
      return this.createResult(
        false,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  
  /**
   * Hook for subclass reset implementation
   */
  protected async onReset(): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override this method
  }
  
  /**
   * Terminate the module, releasing resources
   */
  async terminate(): Promise<ModelResult> {
    const startTime = Date.now();
    this.updateLifecycle(ModelLifecycleState.Terminating);
    
    await this.logger.info('Terminating module');
    
    try {
      // Allow subclasses to perform custom termination logic
      await this.onTerminate();
      
      this.updateLifecycle(ModelLifecycleState.Terminated);
      
      // Log termination before logger terminates
      await this.logger.info('Module terminated successfully');
      
      // Terminate the logger last
      await this.logger.terminate();
      
      return this.createResult(true, { terminated: true }, undefined);
    } catch (error) {
      this.updateLifecycle(ModelLifecycleState.Error);
      
      await this.logger.error('Termination failed', error);
      
      if (this.options.debug) {
        console.error(`[${this.getModuleIdentifier()}] Termination error:`, error);
      }
      
      // Still try to terminate the logger
      await this.logger.terminate().catch(() => {});
      
      return this.createResult(
        false,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
  
  /**
   * Hook for subclass termination implementation
   */
  protected async onTerminate(): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override this method
  }
  
  /**
   * Create a standardized result object
   */
  createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T> {
    return {
      success,
      data,
      error,
      timestamp: Date.now(),
      source: this.getModuleIdentifier()
    };
  }
  
  /**
   * Update the module lifecycle state
   */
  protected updateLifecycle(newState: ModelLifecycleState): void {
    const prevState = this.state.lifecycle;
    this.state.lifecycle = newState;
    this.state.lastStateChangeTime = Date.now();
    
    // Only log if the logger is initialized and not terminating/terminated
    if (this.logger && 
        this.logger.getState().lifecycle !== ModelLifecycleState.Terminating && 
        this.logger.getState().lifecycle !== ModelLifecycleState.Terminated) {
      // Don't await this to avoid blocking the state transition
      this.logger.debug('State transition', { from: prevState, to: newState }).catch(() => {});
    }
    
    if (this.options.debug) {
      console.log(`[${this.getModuleIdentifier()}] State transition: ${prevState} -> ${newState}`);
    }
  }
  
  /**
   * Get a standardized identifier for this module
   */
  protected getModuleIdentifier(): string {
    return this.options.id || 
           `${this.options.name}@${this.options.version}`;
  }
}

/**
 * Reference implementation of BaseModel
 * Provides a concrete implementation that can be used directly
 */
export class StandardModel extends BaseModel {
  /**
   * Process input data with default implementation
   */
  protected async onProcess<T = unknown, R = unknown>(input: T): Promise<R> {
    // Basic input validation to reject undefined or null
    if (input === undefined) {
      throw new Error('Input cannot be undefined');
    }
    
    // This is a simple pass-through implementation
    // Real modules would implement their specific logic
    return input as unknown as R;
  }
}

/**
 * Create a standard model instance with the specified options
 */
export function createModel(options: ModelOptions = {}): ModelInterface {
  return new StandardModel(options);
}

/**
 * Create and initialize a model in a single step
 * This is a convenience function that combines creation and initialization
 */
export async function createAndInitializeModel(options: ModelOptions = {}): Promise<ModelInterface> {
  const model = createModel(options);
  const result = await model.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize model: ${result.error}`);
  }
  
  return model;
}

// Export module creation functionality
export { createModule } from './create-module';

// Export testing adapter functionality
export { createModelTestAdapter, ModelTestAdapter } from './model-test-adapter';

// Export all types
export * from './types';
