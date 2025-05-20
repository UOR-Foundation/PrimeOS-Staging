import { ModularInterface, ModularOptions, ModularState } from '../types';
import { ModelLifecycleState } from './os-model-mock';

export function createMockModular(options: ModularOptions = {}): ModularInterface {
  const config = {
    pythonCompatible: options.pythonCompatible ?? true,
    useCache: options.useCache ?? true,
    useOptimized: options.useOptimized ?? true,
    nativeThreshold: options.nativeThreshold ?? 50,
    strict: options.strict ?? false,
    debug: options.debug ?? false
  } as Required<ModularOptions>;

  const state: ModularState = {
    lifecycle: ModelLifecycleState.Ready,
    lastStateChangeTime: Date.now(),
    uptime: 0,
    operationCount: { total: 0, success: 0, failed: 0 },
    config
  };

  const result = (success: boolean) => ({ success, timestamp: Date.now(), source: options.name || 'mock-modular' });

  return {
    mod: () => 0n,
    modPow: () => 0n,
    modInverse: () => 0n,
    extendedGcd: () => [1n, 0n, 0n],
    gcd: () => 1n,
    lcm: () => 1n,
    modMul: () => 0n,
    clearCache: () => {},
    initialize: async () => result(true),
    process: async () => 0 as any,
    getState: () => ({ ...state }),
    reset: async () => result(true),
    terminate: async () => result(true),
    createResult: <T>(s: boolean, d?: T, e?: string) => ({ success: s, data: d, error: e, timestamp: Date.now(), source: options.name || 'mock-modular' })
  } as ModularInterface;
}
