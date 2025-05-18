/**
 * OS Model Mock for Testing
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

export interface ModelOptions {
  debug?: boolean;
  id?: string;
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
}

export interface ModelResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: number | string;
  timestamp: number;
  duration?: number;
  source: string;
}

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

export interface ModelInterface {
  initialize(): Promise<ModelResult>;
  process<T = unknown, R = unknown>(input: T): Promise<R>;
  getState(): ModelState;
  reset(): Promise<ModelResult>;
  terminate(): Promise<ModelResult>;
  createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T>;
}

export class BaseModel implements ModelInterface {
  protected state: ModelState;
  protected logger: any;
  protected options: ModelOptions;

  constructor(options: ModelOptions = {}) {
    this.options = {
      debug: false,
      name: 'base-model',
      version: '1.0.0',
      ...options
    };

    this.state = {
      lifecycle: ModelLifecycleState.Uninitialized,
      lastStateChangeTime: Date.now(),
      uptime: 0,
      operationCount: {
        total: 0,
        success: 0,
        failed: 0
      }
    };

    // Simple mock logger
    this.logger = {
      debug: async (...args: any[]) => Promise.resolve(),
      info: async (...args: any[]) => Promise.resolve(),
      warn: async (...args: any[]) => Promise.resolve(),
      error: async (...args: any[]) => Promise.resolve()
    };
  }

  async initialize(): Promise<ModelResult> {
    this.state.lifecycle = ModelLifecycleState.Initializing;
    this.state.lastStateChangeTime = Date.now();
    
    try {
      await this.onInitialize();
      this.state.lifecycle = ModelLifecycleState.Ready;
      return this.createResult(true);
    } catch (error: any) {
      this.state.lifecycle = ModelLifecycleState.Error;
      return this.createResult(false, undefined, error.message);
    }
  }

  protected async onInitialize(): Promise<void> {
    // To be overridden by subclasses
  }

  async process<T = unknown, R = unknown>(input: T): Promise<R> {
    if (this.state.lifecycle !== ModelLifecycleState.Ready) {
      throw new Error('Model is not ready for processing');
    }

    this.state.lifecycle = ModelLifecycleState.Processing;
    this.state.operationCount.total++;
    
    try {
      const result = await this.onProcess<T, R>(input);
      this.state.operationCount.success++;
      this.state.lifecycle = ModelLifecycleState.Ready;
      return result;
    } catch (error: any) {
      this.state.operationCount.failed++;
      this.state.lifecycle = ModelLifecycleState.Error;
      throw error;
    }
  }

  protected async onProcess<T = unknown, R = unknown>(input: T): Promise<R> {
    throw new Error('onProcess method must be implemented by subclasses');
  }

  async reset(): Promise<ModelResult> {
    try {
      await this.onReset();
      this.state.operationCount = {
        total: 0,
        success: 0,
        failed: 0
      };
      this.state.lastStateChangeTime = Date.now();
      return this.createResult(true);
    } catch (error: any) {
      return this.createResult(false, undefined, error.message);
    }
  }

  protected async onReset(): Promise<void> {
    // To be overridden by subclasses
  }

  async terminate(): Promise<ModelResult> {
    this.state.lifecycle = ModelLifecycleState.Terminating;
    
    try {
      await this.onTerminate();
      this.state.lifecycle = ModelLifecycleState.Terminated;
      return this.createResult(true);
    } catch (error: any) {
      this.state.lifecycle = ModelLifecycleState.Error;
      return this.createResult(false, undefined, error.message);
    }
  }

  protected async onTerminate(): Promise<void> {
    // To be overridden by subclasses
  }

  getState(): ModelState {
    return { ...this.state };
  }

  createResult<T>(success: boolean, data?: T, error?: string): ModelResult<T> {
    return {
      success,
      data,
      error,
      timestamp: Date.now(),
      source: this.options.name || 'unknown'
    };
  }
}
