/**
 * OS Logging Mock for Testing
 */

export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: number;
  source: string;
}

export interface LoggingOptions {
  debug?: boolean;
  name?: string;
  minLevel?: LogLevel;
}

export interface LoggingInterface {
  initialize(): Promise<any>;
  terminate(): Promise<any>;
  getState(): any;
  log(level: LogLevel, message: string, data?: unknown): Promise<void>;
  trace(message: string, data?: unknown): Promise<void>;
  debug(message: string, data?: unknown): Promise<void>;
  info(message: string, data?: unknown): Promise<void>;
  warn(message: string, data?: unknown): Promise<void>;
  error(message: string, data?: unknown): Promise<void>;
  fatal(message: string, data?: unknown): Promise<void>;
}

/**
 * Create a simple mock logger that doesn't actually log
 */
export function createLogging(options: LoggingOptions = {}): LoggingInterface {
  return {
    initialize: async () => Promise.resolve({ success: true }),
    terminate: async () => Promise.resolve({ success: true }),
    getState: () => ({ lifecycle: 'ready', logs: [] }),
    log: async (level: LogLevel, message: string, data?: unknown) => Promise.resolve(),
    trace: async (message: string, data?: unknown) => Promise.resolve(),
    debug: async (message: string, data?: unknown) => Promise.resolve(),
    info: async (message: string, data?: unknown) => Promise.resolve(),
    warn: async (message: string, data?: unknown) => Promise.resolve(),
    error: async (message: string, data?: unknown) => Promise.resolve(),
    fatal: async (message: string, data?: unknown) => Promise.resolve()
  };
}
