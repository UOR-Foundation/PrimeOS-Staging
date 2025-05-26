/**
 * Jest manual mock for os/model.
 * Provides mock implementations to avoid circular dependencies.
 */

// Mock ModelLifecycleState enum
export enum ModelLifecycleState {
  Uninitialized = 'uninitialized',
  Initializing = 'initializing',
  Ready = 'ready',
  Processing = 'processing',
  Error = 'error',
  Terminating = 'terminating',
  Terminated = 'terminated'
}

// Mock ModelResult interface
export interface ModelResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: number | string;
  timestamp: number;
  duration?: number;
  source: string;
}

// Mock ModelOptions interface
export interface ModelOptions {
  debug?: boolean;
  id?: string;
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
}

// Mock ModelState interface
export interface ModelState {
  lifecycle: ModelLifecycleState;
  lastStateChangeTime: number;
  uptime: number;
  operationCount: {
    total: number;
    success: number;
    failed: number;
  };
  custom?: Record<string, unknown>;
}

// Mock ModelInterface
export interface ModelInterface {
  initialize(): Promise<ModelResult>;
  process<T = unknown, R = unknown>(input: T): Promise<ModelResult<R>>;
  getState(): ModelState;
  reset(): Promise<ModelResult>;
  terminate(): Promise<ModelResult>;
  createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T>;
  getLogger?(): any;
}

// Mock BaseModel class
export class BaseModel implements ModelInterface {
  protected options: ModelOptions;
  protected state: ModelState;
  protected logger: any;
  private startTime: number;

  constructor(options: ModelOptions = {}) {
    this.options = {
      debug: false,
      name: 'mock-model',
      version: '0.1.0',
      ...options
    };
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
    
    // Mock logger with Jest spy functions
    this.logger = {
      initialize: jest.fn().mockResolvedValue({ success: true }),
      info: jest.fn().mockResolvedValue({ success: true }),
      debug: jest.fn().mockResolvedValue({ success: true }),
      warn: jest.fn().mockResolvedValue({ success: true }),
      error: jest.fn().mockResolvedValue({ success: true }),
      log: jest.fn().mockResolvedValue({ success: true }),
      terminate: jest.fn().mockResolvedValue({ success: true }),
      getState: jest.fn().mockReturnValue({ lifecycle: ModelLifecycleState.Ready })
    };
  }

  getLogger() {
    return this.logger;
  }

  protected logMessage(level: any, message: string, data?: unknown): Promise<void> {
    return Promise.resolve();
  }

  async initialize(): Promise<ModelResult> {
    try {
      this.updateLifecycle(ModelLifecycleState.Initializing);
      await this.onInitialize();
      this.updateLifecycle(ModelLifecycleState.Ready);
      return this.createResult(true, { initialized: true });
    } catch (error) {
      this.updateLifecycle(ModelLifecycleState.Error);
      return this.createResult(false, undefined, error instanceof Error ? error.message : String(error));
    }
  }

  protected async onInitialize(): Promise<void> {
    // Mock implementation - can be overridden to throw errors for testing
  }

  async process<T = unknown, R = unknown>(input: T): Promise<ModelResult<R>> {
    this.state.operationCount.total++;
    
    if (this.state.lifecycle !== ModelLifecycleState.Ready) {
      this.state.operationCount.failed++;
      let errorMessage = 'Not in ready state';
      
      // Provide more specific error messages based on state
      if (this.state.lifecycle === ModelLifecycleState.Uninitialized) {
        errorMessage = 'Cannot process in uninitialized state';
      } else if (this.state.lifecycle === ModelLifecycleState.Terminated) {
        errorMessage = 'Cannot process in terminated state';
      }
      
      return this.createResult(false, undefined as any, errorMessage);
    }

    this.updateLifecycle(ModelLifecycleState.Processing);

    try {
      const result = await this.onProcess(input) as R;
      this.updateLifecycle(ModelLifecycleState.Ready);
      this.state.operationCount.success++;
      return this.createResult(true, result);
    } catch (error) {
      this.updateLifecycle(ModelLifecycleState.Error);
      this.state.operationCount.failed++;
      return this.createResult(false, undefined as any, error instanceof Error ? error.message : String(error));
    }
  }

  protected async onProcess<T = unknown, R = unknown>(input: T): Promise<R> {
    // Default mock implementation - just return input
    return input as unknown as R;
  }

  getState(): ModelState {
    this.state.uptime = Date.now() - this.startTime;
    return { ...this.state };
  }

  async reset(): Promise<ModelResult> {
    try {
      await this.onReset();
      this.state.operationCount = { total: 0, success: 0, failed: 0 };
      this.updateLifecycle(ModelLifecycleState.Ready);
      return this.createResult(true, { reset: true });
    } catch (error) {
      return this.createResult(false, undefined, error instanceof Error ? error.message : String(error));
    }
  }

  protected async onReset(): Promise<void> {
    // Mock implementation
  }

  async terminate(): Promise<ModelResult> {
    try {
      this.updateLifecycle(ModelLifecycleState.Terminating);
      await this.onTerminate();
      this.updateLifecycle(ModelLifecycleState.Terminated);
      return this.createResult(true, { terminated: true });
    } catch (error) {
      this.updateLifecycle(ModelLifecycleState.Error);
      return this.createResult(false, undefined, error instanceof Error ? error.message : String(error));
    }
  }

  protected async onTerminate(): Promise<void> {
    // Mock implementation
  }

  createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T> {
    return {
      success,
      data,
      error,
      timestamp: Date.now(),
      source: this.getModuleIdentifier()
    };
  }

  protected updateLifecycle(newState: ModelLifecycleState): void {
    this.state.lifecycle = newState;
    this.state.lastStateChangeTime = Date.now();
  }

  protected getModuleIdentifier(): string {
    return this.options.id || `${this.options.name}@${this.options.version}`;
  }
}

// Mock StandardModel class
export class StandardModel extends BaseModel {
  protected async onProcess<T = unknown, R = unknown>(input: T): Promise<R> {
    if (input === undefined) {
      throw new Error('Input cannot be undefined');
    }
    return input as unknown as R;
  }
}

// Mock factory functions
export function createModel(options: ModelOptions = {}): ModelInterface {
  return new StandardModel(options);
}

export async function createAndInitializeModel(options: ModelOptions = {}): Promise<ModelInterface> {
  const model = createModel(options);
  const result = await model.initialize();
  
  if (!result.success) {
    throw new Error(`Failed to initialize model: ${result.error}`);
  }
  
  return model;
}

// Mock other exports
export const createModule = jest.fn();
export const createModelTestAdapter = jest.fn();
export const ModelTestAdapter = jest.fn();

// Export CreateModuleOptions interface
export interface CreateModuleOptions {
  name: string;
  path?: string;
  description?: string;
  parent?: string;
  install?: boolean;
  npm?: boolean;
}
