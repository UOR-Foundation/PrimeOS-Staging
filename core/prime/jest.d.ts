// Type definitions for Jest testing globals

declare global {
  // Jest global functions
  function describe(name: string, fn: () => void): void;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function beforeAll(fn: () => void): void;
  function afterAll(fn: () => void): void;
  function test(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  // 'it' is an alias for 'test'
  function it(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  
  // Jest expect
  function expect<T>(value: T): JestExpectation<T>;
  
  // Jest mocks
  const jest: any;
}

interface JestExpectation<T> {
  toBe(value: any): void;
  toEqual(value: any): void;
  toContain(value: any): void;
  toBeDefined(): void;
  toBeUndefined(): void;
  toBeNull(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toBeGreaterThan(value: number): void;
  toBeGreaterThanOrEqual(value: number): void;
  toBeLessThan(value: number): void;
  toBeLessThanOrEqual(value: number): void;
  toBeCloseTo(value: number, precision?: number): void;
  toMatch(value: string | RegExp): void;
  toThrow(value?: string | RegExp | Error): void;
  not: JestExpectation<T>;
  resolves: JestExpectation<Promise<T>>;
  rejects: JestExpectation<Promise<T>>;
  // Add more as needed
}

export {};
