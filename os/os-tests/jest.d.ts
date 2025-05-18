/**
 * Type definitions for Jest global variables
 */

declare global {
  const jest: {
    fn: <T = any>(implementation?: (...args: any[]) => T) => jest.Mock<T>;
    mock: (moduleName: string, factory?: any) => void;
    spyOn: <T extends {}, M extends keyof T>(object: T, method: M) => jest.SpyInstance<any, any>;
    clearAllMocks: () => void;
    restoreAllMocks: () => void;
  };

  namespace jest {
    interface Mock<T = any> {
      (...args: any[]): T;
      mockReturnValue(value: T): this;
      mockReturnValueOnce(value: T): this;
      mockImplementation(fn: (...args: any[]) => T): this;
      mockImplementationOnce(fn: (...args: any[]) => T): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): this;
      getMockName(): string;
      mock: {
        calls: any[][];
        instances: any[];
        invocationCallOrder: number[];
        results: { type: string; value: any }[];
      };
    }
    
    interface SpyInstance<T = any, Y extends any[] = any[]> {
      (...args: Y): T;
      mockReturnValue(value: T): this;
      mockReturnValueOnce(value: T): this;
      mockImplementation(fn: (...args: Y) => T): this;
      mockImplementationOnce(fn: (...args: Y) => T): this;
      mockClear(): this;
      mockReset(): this;
      mockRestore(): this;
    }
  }

  const describe: (name: string, fn: () => void) => void;
  const beforeEach: (fn: () => void | Promise<void>) => void;
  const afterEach: (fn: () => void | Promise<void>) => void;
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const afterAll: (fn: () => void | Promise<void>) => void;
  const test: (name: string, fn: () => void | Promise<void>, timeout?: number) => void;
  const it: typeof test;
  const expect: any;
}

export {};
