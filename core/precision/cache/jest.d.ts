/**
 * Jest definitions for precision cache module
 */

declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: (done?: jest.DoneCallback) => void | Promise<void>, timeout?: number) => void;
declare const expect: jest.Expect;
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;
declare const afterAll: (fn: () => void) => void;
declare const fail: (message?: string) => void;
declare const jest: jest.Jest;

declare namespace jest {
  interface Jest {
    fn: <T extends (...args: any[]) => any>(implementation?: T) => jest.Mock<ReturnType<T>, Parameters<T>>;
    clearAllMocks(): void;
    useFakeTimers(): void;
    useRealTimers(): void;
    advanceTimersByTime(msToRun: number): void;
    spyOn<T, K extends keyof T>(object: T, method: K): jest.Mock;
  }

  interface DoneCallback {
    (...args: any[]): void;
    fail(error?: string | { message: string }): void;
  }

  interface Matchers<R> {
    toEqual(expected: any): R;
    toBe(expected: any): R;
    toBeTruthy(): R;
    toBeFalsy(): R;
    toBeUndefined(): R;
    toBeNull(): R;
    toBeDefined(): R;
    toContain(expected: any): R;
    toHaveLength(expected: number): R;
    toBeGreaterThan(expected: number): R;
    toBeLessThan(expected: number): R;
    toBeGreaterThanOrEqual(expected: number): R;
    toBeLessThanOrEqual(expected: number): R;
    toThrow(expected?: any): R;
    toBeCloseTo(expected: number, precision?: number): R;
    toHaveBeenCalled(): R;
    toHaveBeenCalledTimes(expected: number): R;
    toHaveBeenCalledWith(...args: any[]): R;
  }

  interface Expect {
    <T>(actual: T): Matchers<void>;
  }

  interface Mock<T = any, Y extends any[] = any[]> {
    (...args: Y): T;
    mockImplementation(fn: (...args: Y) => T): this;
    mockImplementationOnce(fn: (...args: Y) => T): this;
    mockReturnValue(value: T): this;
    mockReturnValueOnce(value: T): this;
    mockClear(): this;
    mockReset(): this;
    mockRestore(): this;
    mockResolvedValue(value: any): this;
    mockResolvedValueOnce(value: any): this;
    mockRejectedValue(value: any): this;
    mockRejectedValueOnce(value: any): this;
    getMockName(): string;
    mock: {
      calls: Y[];
      instances: T[];
      invocationCallOrder: number[];
      results: Array<{ type: 'return' | 'throw'; value: any }>;
    };
  }
}
