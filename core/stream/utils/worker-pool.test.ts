/**
 * Worker Pool Tests
 * =================
 * 
 * Tests for true parallel processing with worker threads.
 */

import { WorkerPool, WorkerTask, WorkerResult, createWorkerPool } from './worker-pool';
import { Worker } from 'worker_threads';
import * as path from 'path';

// Mock worker_threads module
jest.mock('worker_threads', () => {
  const EventEmitter = require('events');
  
  class MockWorker extends EventEmitter {
    postMessage = jest.fn();
    terminate = jest.fn().mockResolvedValue(0);
    unref = jest.fn();
    
    constructor(public filename: string, public options?: any) {
      super();
      
      // Simulate worker being ready
      setTimeout(() => {
        this.emit('online');
      }, 10);
    }
    
    // Simulate sending a response
    simulateMessage(data: any) {
      this.emit('message', data);
    }
    
    // Simulate error
    simulateError(error: Error) {
      this.emit('error', error);
    }
    
    // Simulate exit
    simulateExit(code: number) {
      this.emit('exit', code);
    }
  }
  
  return {
    Worker: MockWorker,
    isMainThread: true
  };
});

describe('WorkerPool', () => {
  let pool: WorkerPool;
  
  beforeEach(() => {
    jest.clearAllMocks();
    pool = new WorkerPool({ minWorkers: 2, maxWorkers: 4 });
  });
  
  afterEach(async () => {
    await pool.shutdown();
  });
  
  describe('Initialization', () => {
    it('should create minimum number of workers on construction', () => {
      // Workers are created in constructor
      expect(Worker).toHaveBeenCalledTimes(2); // minWorkers = 2
    });
    
    it('should track pool statistics', () => {
      const stats = pool.getStats();
      expect(stats.totalWorkers).toBe(2); // minWorkers = 2
      expect(stats.idleWorkers).toBe(2);
      expect(stats.activeWorkers).toBe(0);
    });
    
    it('should handle worker script path correctly', () => {
      const workerScriptPath = (Worker as any).mock.calls[0][0];
      expect(workerScriptPath).toContain('worker-script.js');
    });
  });
  
  describe('Task Execution', () => {
    
    it('should execute transform tasks', async () => {
      const task: WorkerTask<number[], number[]> = {
        id: 'test-1',
        type: 'transform',
        data: [1, 2, 3],
        functionCode: '(x) => x * 2'
      };
      
      // Get the worker instance
      const workers = (pool as any).workers;
      const worker = workers[0];
      
      // Submit task
      const resultPromise = pool.execute(task);
      
      // Simulate worker processing
      setTimeout(() => {
        worker.simulateMessage({
          id: 'test-1',
          success: true,
          result: [2, 4, 6]
        });
      }, 50);
      
      const result = await resultPromise;
      expect(result).toEqual([2, 4, 6]);
    });
    
    it('should handle task errors', async () => {
      const task: WorkerTask<string, any> = {
        id: 'test-error',
        type: 'process',
        data: 'invalid'
      };
      
      const workers = (pool as any).workers;
      const worker = workers[0];
      
      const resultPromise = pool.execute(task);
      
      setTimeout(() => {
        worker.simulateMessage({
          id: 'test-error',
          success: false,
          error: 'Processing failed'
        });
      }, 50);
      
      await expect(resultPromise).rejects.toThrow('Processing failed');
    });
    
    it('should queue tasks when all workers are busy', async () => {
      const workers = (pool as any).workers;
      
      // Mark all workers as busy
      workers.forEach((worker: any, index: number) => {
        (pool as any).workerStates.get(worker).busy = true;
      });
      
      const task: WorkerTask<string, string> = {
        id: 'queued-task',
        type: 'process',
        data: 'test'
      };
      
      // This should queue the task
      const executePromise = pool.execute(task);
      
      // Check that task is queued
      expect((pool as any).taskQueue.length).toBe(1);
      
      // Free up a worker
      const worker = workers[0];
      (pool as any).workerStates.get(worker).busy = false;
      
      // Process the queue
      (pool as any).processQueue();
      
      // Simulate response
      setTimeout(() => {
        worker.simulateMessage({
          id: 'queued-task',
          success: true,
          result: 'processed'
        });
      }, 50);
      
      const result = await executePromise;
      expect(result).toBe('processed');
    });
    
    it('should handle factorization tasks', async () => {
      const task: WorkerTask<bigint, any[]> = {
        id: 'factor-task',
        type: 'factorize',
        data: BigInt(15)
      };
      
      const workers = (pool as any).workers;
      const worker = workers[0];
      
      const resultPromise = pool.execute(task);
      
      setTimeout(() => {
        worker.simulateMessage({
          id: 'factor-task',
          success: true,
          result: [
            { prime: BigInt(3), exponent: 1 },
            { prime: BigInt(5), exponent: 1 }
          ]
        });
      }, 50);
      
      const result = await resultPromise;
      expect(result).toEqual([
        { prime: BigInt(3), exponent: 1 },
        { prime: BigInt(5), exponent: 1 }
      ]);
    });
    
    it('should handle custom tasks', async () => {
      const customOperation = (data: any) => {
        return { processed: true, data };
      };
      
      const task: WorkerTask<any, any> = {
        id: 'custom-task',
        type: 'custom',
        data: { value: 42 },
        functionCode: customOperation.toString()
      };
      
      const workers = (pool as any).workers;
      const worker = workers[0];
      
      const resultPromise = pool.execute(task);
      
      setTimeout(() => {
        worker.simulateMessage({
          id: 'custom-task',
          success: true,
          result: { processed: true, data: { value: 42 } }
        });
      }, 50);
      
      const result = await resultPromise;
      expect(result).toEqual({ processed: true, data: { value: 42 } });
    });
  });
  
  describe('Worker Management', () => {
    
    it('should spawn additional workers when needed', async () => {
      const initialWorkerCount = (Worker as any).mock.calls.length;
      
      // Mark all workers as busy
      const workers = (pool as any).workers;
      workers.forEach((worker: any) => {
        (pool as any).workerStates.get(worker).busy = true;
      });
      
      // Add task to trigger new worker
      const task: WorkerTask<string, any> = {
        id: 'spawn-trigger',
        type: 'process',
        data: 'test'
      };
      
      pool.execute(task);
      
      // Should spawn a new worker (up to max)
      expect(Worker).toHaveBeenCalledTimes(initialWorkerCount + 1);
    });
    
    it('should not exceed maximum workers', async () => {
      // Create maximum workers
      const workers = (pool as any).workers;
      while (workers.length < 4) { // maxWorkers = 4
        await (pool as any).spawnWorker();
      }
      
      const maxWorkerCount = (Worker as any).mock.calls.length;
      
      // Try to spawn one more
      await (pool as any).spawnWorker();
      
      // Should not create additional worker
      expect(Worker).toHaveBeenCalledTimes(maxWorkerCount);
    });
    
    it('should handle worker errors gracefully', async () => {
      const workers = (pool as any).workers;
      const worker = workers[0];
      
      // Submit a task
      const task: WorkerTask<string, any> = {
        id: 'error-task',
        type: 'process',
        data: 'test'
      };
      
      const resultPromise = pool.execute(task);
      (pool as any).workerStates.get(worker).currentTask = task;
      
      // Simulate worker error
      worker.simulateError(new Error('Worker crashed'));
      
      // Task should be rejected
      await expect(resultPromise).rejects.toThrow('Worker error');
      
      // Worker should be replaced
      expect((pool as any).workers.includes(worker)).toBe(false);
    });
    
    it('should handle worker exit', () => {
      const workers = (pool as any).workers;
      const worker = workers[0];
      const initialCount = workers.length;
      
      // Simulate worker exit
      worker.simulateExit(1);
      
      // Worker should be removed
      expect((pool as any).workers.length).toBe(initialCount - 1);
    });
    
    it('should handle task timeout', async () => {
      jest.useFakeTimers();
      
      const pool = new WorkerPool({ 
        minWorkers: 1, 
        maxWorkers: 2,
        taskTimeout: 1000 // 1 second timeout
      });
      
      const task: WorkerTask<string, any> = {
        id: 'timeout-task',
        type: 'process',
        data: 'slow-task'
      };
      
      const resultPromise = pool.execute(task);
      
      // Fast-forward past timeout
      jest.advanceTimersByTime(1500);
      
      await expect(resultPromise).rejects.toThrow('timeout');
      
      await pool.shutdown();
      jest.useRealTimers();
    });
  });
  
  describe('Pool Statistics', () => {
    
    it('should track pool statistics', () => {
      const stats = pool.getStats();
      
      expect(stats).toHaveProperty('activeWorkers');
      expect(stats).toHaveProperty('idleWorkers');
      expect(stats).toHaveProperty('queuedTasks');
      expect(stats).toHaveProperty('completedTasks');
      expect(stats).toHaveProperty('failedTasks');
      expect(stats).toHaveProperty('averageTaskTime');
    });
    
    it('should update statistics on task completion', async () => {
      const initialStats = pool.getStats();
      
      const task: WorkerTask<string, string> = {
        id: 'stats-task',
        type: 'process',
        data: 'test'
      };
      
      const workers = (pool as any).workers;
      const worker = workers[0];
      
      const resultPromise = pool.execute(task);
      
      setTimeout(() => {
        worker.simulateMessage({
          id: 'stats-task',
          success: true,
          result: 'done'
        });
      }, 50);
      
      await resultPromise;
      
      const finalStats = pool.getStats();
      expect(finalStats.completedTasks).toBe(initialStats.completedTasks + 1);
    });
  });
  
  describe('Pool Termination', () => {
    it('should terminate all workers', async () => {
      
      const workers = (pool as any).workers;
      const workerCount = workers.length;
      
      await pool.shutdown();
      
      // All workers should be terminated
      workers.forEach((worker: any) => {
        expect(worker.terminate).toHaveBeenCalled();
      });
      
      expect((pool as any).workers.length).toBe(0);
    });
    
    it('should reject pending tasks on termination', async () => {
      
      // Submit a task but don't process it
      const task: WorkerTask<string, any> = {
        id: 'pending-task',
        type: 'process',
        data: 'test'
      };
      
      const resultPromise = pool.execute(task);
      
      // Terminate immediately
      await pool.shutdown();
      
      await expect(resultPromise).rejects.toThrow('Worker pool is shutting down');
    });
  });
  
  describe('Worker Idle Timeout', () => {
    it('should terminate idle workers after timeout', async () => {
      jest.useFakeTimers();
      
      const pool = new WorkerPool({ 
        minWorkers: 2, 
        maxWorkers: 4,
        idleTimeout: 5000 // 5 seconds
      });
      
      // Spawn extra workers
      await (pool as any).spawnWorker();
      await (pool as any).spawnWorker();
      
      const workers = (pool as any).workers;
      expect(workers.length).toBe(4);
      
      // Fast-forward past idle timeout
      jest.advanceTimersByTime(6000);
      
      // Should reduce to minimum workers
      expect((pool as any).workers.length).toBe(2);
      
      await pool.shutdown();
      jest.useRealTimers();
    });
  });
  
  describe('Error Scenarios', () => {
    it('should handle worker spawn failures', async () => {
      // Mock Worker to throw on construction
      const originalWorker = (Worker as any);
      (Worker as any) = jest.fn().mockImplementation(() => {
        throw new Error('Failed to create worker');
      });
      
      const failPool = new WorkerPool({ minWorkers: 2 });
      
      // The pool will throw during construction
      expect(() => new WorkerPool({ minWorkers: 2 })).toThrow();
      
      // Restore original mock
      (Worker as any) = originalWorker;
    });
    
    it('should handle invalid task types', async () => {
      
      const invalidTask = {
        id: 'invalid',
        type: 'INVALID_TYPE' as any,
        data: 'test'
      };
      
      // The worker script would handle invalid task types
      // For now, we test that the task is accepted by the pool
      const resultPromise = pool.execute(invalidTask);
      
      // Simulate worker error response
      const workers = (pool as any).workers;
      const worker = workers.values().next().value;
      
      setTimeout(() => {
        worker.worker.simulateMessage({
          id: 'invalid',
          success: false,
          error: 'Unsupported task type'
        });
      }, 50);
      
      await expect(resultPromise).rejects.toThrow();
    });
  });
});
