/**
 * Mock Backpressure Controller
 * ============================
 */

export const mockController = {
  pause: jest.fn(),
  resume: jest.fn(),
  drain: jest.fn().mockResolvedValue(undefined),
  getBufferLevel: jest.fn().mockReturnValue(0.5),
  getMemoryUsage: jest.fn().mockReturnValue({
    used: 200 * 1024 * 1024,
    available: 300 * 1024 * 1024,
    total: 500 * 1024 * 1024,
    bufferSize: 10 * 1024,
    gcCollections: 3
  }),
  onPressure: jest.fn(),
  setThreshold: jest.fn(),
  getThreshold: jest.fn().mockReturnValue(0.8),
  getStatistics: jest.fn().mockReturnValue({
    currentState: 'NORMAL',
    pressureEvents: 5,
    totalPressureTime: 1000,
    isPaused: false,
    bufferOverflows: 0,
    memoryWarnings: 0
  }),
  stop: jest.fn()
};

export const BackpressureControllerImpl = jest.fn(() => mockController);
export const createBackpressureController = jest.fn(() => mockController);
export const createEnhancedBackpressureController = jest.fn(() => mockController);

export enum BackpressureState {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  BLOCKING = 'BLOCKING'
}
