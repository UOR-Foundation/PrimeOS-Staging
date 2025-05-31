/**
 * Mock Memory Manager
 * ==================
 */

export const mockMemoryManager = {
  registerBuffer: jest.fn(),
  updateBufferSize: jest.fn().mockReturnValue(true),
  releaseBuffer: jest.fn().mockReturnValue(true),
  getOptimalBufferSize: jest.fn().mockReturnValue(4096),
  triggerGC: jest.fn(),
  getMemoryStats: jest.fn().mockReturnValue({
    used: 200 * 1024 * 1024,
    available: 300 * 1024 * 1024,
    total: 500 * 1024 * 1024,
    bufferSize: 10 * 1024,
    gcCollections: 3
  }),
  getBufferStats: jest.fn().mockReturnValue({
    totalAllocated: 50 * 1024,
    totalReleased: 10 * 1024,
    activeBuffers: 5,
    peakUsage: 60 * 1024,
    averageBufferSize: 8192,
    totalBufferMemory: 40 * 1024
  }),
  getManagementStats: jest.fn().mockReturnValue({
    strategy: 'BALANCED',
    gcTriggers: 3,
    pressureEvents: 2,
    totalPressureTime: 500,
    averagePressureTime: 250,
    leaksDetected: 0,
    bufferAdjustments: 8,
    peakMemoryUsage: 250 * 1024 * 1024,
    averageMemoryUsage: 200 * 1024 * 1024
  }),
  onMemoryPressure: jest.fn(),
  onGC: jest.fn(),
  getEventHistory: jest.fn().mockReturnValue([]),
  setStrategy: jest.fn(),
  stop: jest.fn()
};

export const MemoryManager = jest.fn(() => mockMemoryManager);
export const createMemoryManager = jest.fn(() => mockMemoryManager);
export const createOptimizedMemoryManager = jest.fn(() => mockMemoryManager);

export enum MemoryStrategy {
  CONSERVATIVE = 'CONSERVATIVE',
  BALANCED = 'BALANCED',
  AGGRESSIVE = 'AGGRESSIVE',
  ADAPTIVE = 'ADAPTIVE'
}
