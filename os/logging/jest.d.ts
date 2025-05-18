/**
 * Type definitions for Jest to support the test suite
 */

declare const describe: {
  (name: string, fn: () => void): void;
  each: any;
};

declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const afterEach: (fn: () => void | Promise<void>) => void;
declare const beforeAll: (fn: () => void | Promise<void>) => void;
declare const afterAll: (fn: () => void | Promise<void>) => void;

declare const test: {
  (name: string, fn: () => void | Promise<void>, timeout?: number): void;
  each: any;
  only: (name: string, fn: () => void | Promise<void>, timeout?: number) => void;
  skip: (name: string, fn: () => void | Promise<void>, timeout?: number) => void;
};

declare const it: typeof test;

declare const expect: {
  (actual: any): any;
  extend: (matchers: any) => void;
  assertions: (num: number) => void;
  anything: () => any;
  any: (constructor: any) => any;
  stringContaining: (str: string) => any;
  objectContaining: (obj: {}) => any;
  arrayContaining: (arr: any[]) => any;
  stringMatching: (regex: RegExp) => any;
};

declare namespace jest {
  function fn<T = any>(): jest.Mock<T>;
  function fn<T = any>(implementation?: (...args: any[]) => T): jest.Mock<T>;
  function spyOn(object: any, method: string): any;
  function mock(moduleName: string, factory?: any, options?: any): any;
  function resetModules(): void;
  function doMock(moduleName: string, factory?: any, options?: any): void;
  function dontMock(moduleName: string): void;
  function clearAllMocks(): void;
  function resetAllMocks(): void;
  function restoreAllMocks(): void;
  
  interface Mock<T = any> {
    new (...args: any[]): T;
    (...args: any[]): any;
    mock: {
      calls: any[][];
      instances: any[];
      invocationCallOrder: number[];
      results: { type: string; value: any }[];
    };
    mockClear(): void;
    mockReset(): void;
    mockRestore(): void;
    mockReturnValue(value: any): this;
    mockReturnValueOnce(value: any): this;
    mockImplementation(fn: (...args: any[]) => any): this;
    mockImplementationOnce(fn: (...args: any[]) => any): this;
  }
}
