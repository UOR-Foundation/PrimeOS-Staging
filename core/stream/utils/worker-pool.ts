/**
 * Worker Thread Pool Implementation
 * ==================================
 * 
 * Production-grade worker thread pool for true parallel processing,
 * replacing the simulated parallel processing in stream utilities.
 */

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { EventEmitter } from 'events';
import { WORKER_CONFIG } from '../constants';

/**
 * Task structure for worker execution
 */
export interface WorkerTask<T, R> {
  id: string;
  type: 'transform' | 'process' | 'factorize' | 'custom';
  data: T;
  functionCode?: string;  // Serialized function for custom operations
}

/**
 * Worker task result
 */
export interface WorkerResult<R> {
  id: string;
  success: boolean;
  result?: R;
  error?: string;
  executionTime: number;
}

/**
 * Worker pool statistics
 */
export interface WorkerPoolStats {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageExecutionTime: number;
}

/**
 * Worker state tracking
 */
interface WorkerState {
  worker: Worker;
  id: number;
  busy: boolean;
  currentTask?: string;
  lastActivity: number;
  tasksCompleted: number;
  tasksFailed: number;
}

/**
 * Production worker pool with real parallelism
 */
export class WorkerPool<T = any, R = any> extends EventEmitter {
  private workers: Map<number, WorkerState> = new Map();
  private taskQueue: Array<{
    task: WorkerTask<T, R>;
    resolve: (result: WorkerResult<R>) => void;
    reject: (error: Error) => void;
  }> = [];
  private nextWorkerId = 0;
  private isShuttingDown = false;
  private workerScriptPath: string;
  private stats = {
    completedTasks: 0,
    failedTasks: 0,
    totalExecutionTime: 0
  };
  
  constructor(
    private options: {
      minWorkers?: number;
      maxWorkers?: number;
      workerScript?: string;
      idleTimeout?: number;
      taskTimeout?: number;
    } = {}
  ) {
    super();
    
    // Use provided worker script or default worker implementation
    this.workerScriptPath = options.workerScript || __dirname + '/worker-script.js';
    
    // Initialize minimum number of workers
    const minWorkers = options.minWorkers || WORKER_CONFIG.POOL.MIN_WORKERS;
    for (let i = 0; i < minWorkers; i++) {
      this.spawnWorker();
    }
  }
  
  /**
   * Execute a task in the worker pool
   */
  async execute(task: WorkerTask<T, R>): Promise<WorkerResult<R>> {
    if (this.isShuttingDown) {
      throw new Error('Worker pool is shutting down');
    }
    
    return new Promise((resolve, reject) => {
      // Check queue size
      if (this.taskQueue.length >= WORKER_CONFIG.TASKS.QUEUE_HIGH_WATER) {
        reject(new Error('Task queue is full'));
        return;
      }
      
      // Try to find an idle worker
      const idleWorker = this.findIdleWorker();
      
      if (idleWorker) {
        this.assignTask(idleWorker, task, resolve, reject);
      } else if (this.canSpawnWorker()) {
        // Spawn new worker if under limit
        const newWorker = this.spawnWorker();
        this.assignTask(newWorker, task, resolve, reject);
      } else {
        // Queue the task
        this.taskQueue.push({ task, resolve, reject });
        this.emit('taskQueued', task.id);
      }
    });
  }
  
  /**
   * Execute multiple tasks in parallel
   */
  async executeMany(tasks: WorkerTask<T, R>[]): Promise<WorkerResult<R>[]> {
    return Promise.all(tasks.map(task => this.execute(task)));
  }
  
  /**
   * Get pool statistics
   */
  getStats(): WorkerPoolStats {
    let activeWorkers = 0;
    let idleWorkers = 0;
    
    for (const state of this.workers.values()) {
      if (state.busy) {
        activeWorkers++;
      } else {
        idleWorkers++;
      }
    }
    
    const averageExecutionTime = this.stats.completedTasks > 0
      ? this.stats.totalExecutionTime / this.stats.completedTasks
      : 0;
    
    return {
      totalWorkers: this.workers.size,
      activeWorkers,
      idleWorkers,
      queuedTasks: this.taskQueue.length,
      completedTasks: this.stats.completedTasks,
      failedTasks: this.stats.failedTasks,
      averageExecutionTime
    };
  }
  
  /**
   * Shutdown the worker pool
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    
    // Wait for all active tasks to complete
    const activeWorkers = Array.from(this.workers.values()).filter(w => w.busy);
    if (activeWorkers.length > 0) {
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          const stillActive = Array.from(this.workers.values()).filter(w => w.busy);
          if (stillActive.length === 0) {
            clearInterval(checkInterval);
            resolve(undefined);
          }
        }, 100);
      });
    }
    
    // Terminate all workers
    const terminationPromises: Promise<number>[] = [];
    for (const [id, state] of this.workers.entries()) {
      terminationPromises.push(state.worker.terminate());
      this.workers.delete(id);
    }
    
    await Promise.all(terminationPromises);
    this.emit('shutdown');
  }
  
  /**
   * Spawn a new worker
   */
  private spawnWorker(): WorkerState {
    const workerId = this.nextWorkerId++;
    
    const worker = new Worker(this.workerScriptPath, {
      workerData: { workerId }
    });
    
    const state: WorkerState = {
      worker,
      id: workerId,
      busy: false,
      lastActivity: Date.now(),
      tasksCompleted: 0,
      tasksFailed: 0
    };
    
    // Set up worker event handlers
    worker.on('message', (message: WorkerResult<R>) => {
      this.handleWorkerMessage(workerId, message);
    });
    
    worker.on('error', (error) => {
      this.handleWorkerError(workerId, error);
    });
    
    worker.on('exit', (code) => {
      this.handleWorkerExit(workerId, code);
    });
    
    this.workers.set(workerId, state);
    this.emit('workerSpawned', workerId);
    
    // Set up idle timeout
    if (this.options.idleTimeout) {
      this.scheduleIdleCheck(workerId);
    }
    
    return state;
  }
  
  /**
   * Find an idle worker
   */
  private findIdleWorker(): WorkerState | null {
    for (const state of this.workers.values()) {
      if (!state.busy) {
        return state;
      }
    }
    return null;
  }
  
  /**
   * Check if we can spawn more workers
   */
  private canSpawnWorker(): boolean {
    const maxWorkers = this.options.maxWorkers || WORKER_CONFIG.POOL.MAX_WORKERS;
    return this.workers.size < maxWorkers && !this.isShuttingDown;
  }
  
  /**
   * Assign a task to a worker
   */
  private assignTask(
    workerState: WorkerState,
    task: WorkerTask<T, R>,
    resolve: (result: WorkerResult<R>) => void,
    reject: (error: Error) => void
  ): void {
    workerState.busy = true;
    workerState.currentTask = task.id;
    workerState.lastActivity = Date.now();
    
    // Store callbacks
    const taskCallbacks = { resolve, reject, startTime: Date.now() };
    (workerState as any).currentTaskCallbacks = taskCallbacks;
    
    // Set task timeout
    if (this.options.taskTimeout) {
      const timeout = setTimeout(() => {
        this.handleTaskTimeout(workerState.id, task.id);
      }, this.options.taskTimeout);
      (workerState as any).currentTaskTimeout = timeout;
    }
    
    // Send task to worker
    workerState.worker.postMessage(task);
    this.emit('taskAssigned', { workerId: workerState.id, taskId: task.id });
  }
  
  /**
   * Handle message from worker
   */
  private handleWorkerMessage(workerId: number, message: WorkerResult<R>): void {
    const workerState = this.workers.get(workerId);
    if (!workerState) return;
    
    // Clear task timeout
    const timeout = (workerState as any).currentTaskTimeout;
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // Get task callbacks
    const callbacks = (workerState as any).currentTaskCallbacks;
    if (!callbacks) return;
    
    // Update stats
    const executionTime = Date.now() - callbacks.startTime;
    if (message.success) {
      this.stats.completedTasks++;
      workerState.tasksCompleted++;
    } else {
      this.stats.failedTasks++;
      workerState.tasksFailed++;
    }
    this.stats.totalExecutionTime += executionTime;
    
    // Update worker state
    workerState.busy = false;
    workerState.currentTask = undefined;
    workerState.lastActivity = Date.now();
    delete (workerState as any).currentTaskCallbacks;
    delete (workerState as any).currentTaskTimeout;
    
    // Resolve task
    callbacks.resolve({
      ...message,
      executionTime
    });
    
    this.emit('taskCompleted', { workerId, taskId: message.id });
    
    // Process queued tasks
    this.processQueue();
  }
  
  /**
   * Handle worker error
   */
  private handleWorkerError(workerId: number, error: Error): void {
    const workerState = this.workers.get(workerId);
    if (!workerState) return;
    
    this.emit('workerError', { workerId, error });
    
    // Handle current task failure
    const callbacks = (workerState as any).currentTaskCallbacks;
    if (callbacks) {
      callbacks.reject(error);
      this.stats.failedTasks++;
      workerState.tasksFailed++;
    }
    
    // Respawn worker
    this.workers.delete(workerId);
    if (!this.isShuttingDown) {
      this.spawnWorker();
    }
  }
  
  /**
   * Handle worker exit
   */
  private handleWorkerExit(workerId: number, code: number): void {
    const workerState = this.workers.get(workerId);
    if (!workerState) return;
    
    this.emit('workerExit', { workerId, code });
    
    // Handle current task failure if abnormal exit
    if (code !== 0) {
      const callbacks = (workerState as any).currentTaskCallbacks;
      if (callbacks) {
        callbacks.reject(new Error(`Worker exited with code ${code}`));
        this.stats.failedTasks++;
      }
    }
    
    // Remove worker
    this.workers.delete(workerId);
    
    // Respawn if needed
    if (!this.isShuttingDown && this.workers.size < (this.options.minWorkers || WORKER_CONFIG.POOL.MIN_WORKERS)) {
      this.spawnWorker();
    }
  }
  
  /**
   * Handle task timeout
   */
  private handleTaskTimeout(workerId: number, taskId: string): void {
    const workerState = this.workers.get(workerId);
    if (!workerState || workerState.currentTask !== taskId) return;
    
    this.emit('taskTimeout', { workerId, taskId });
    
    // Terminate and respawn worker
    const callbacks = (workerState as any).currentTaskCallbacks;
    if (callbacks) {
      callbacks.reject(new Error('Task timeout'));
      this.stats.failedTasks++;
      workerState.tasksFailed++;
    }
    
    workerState.worker.terminate();
    this.workers.delete(workerId);
    
    if (!this.isShuttingDown) {
      this.spawnWorker();
    }
  }
  
  /**
   * Process queued tasks
   */
  private processQueue(): void {
    while (this.taskQueue.length > 0) {
      const idleWorker = this.findIdleWorker();
      if (!idleWorker) break;
      
      const queuedItem = this.taskQueue.shift();
      if (queuedItem) {
        this.assignTask(idleWorker, queuedItem.task, queuedItem.resolve, queuedItem.reject);
      }
    }
  }
  
  /**
   * Schedule idle worker check
   */
  private scheduleIdleCheck(workerId: number): void {
    setTimeout(() => {
      const workerState = this.workers.get(workerId);
      if (!workerState || workerState.busy || this.isShuttingDown) return;
      
      const idleTime = Date.now() - workerState.lastActivity;
      const idleTimeout = this.options.idleTimeout || WORKER_CONFIG.POOL.WORKER_IDLE_TIMEOUT;
      
      if (idleTime > idleTimeout && this.workers.size > (this.options.minWorkers || WORKER_CONFIG.POOL.MIN_WORKERS)) {
        // Terminate idle worker
        workerState.worker.terminate();
        this.workers.delete(workerId);
        this.emit('workerTerminated', { workerId, reason: 'idle' });
      } else {
        // Schedule next check
        this.scheduleIdleCheck(workerId);
      }
    }, 10000); // Check every 10 seconds
  }
}

/**
 * Create a worker pool for stream processing
 */
export function createWorkerPool<T = any, R = any>(options?: {
  minWorkers?: number;
  maxWorkers?: number;
  workerScript?: string;
  idleTimeout?: number;
  taskTimeout?: number;
}): WorkerPool<T, R> {
  return new WorkerPool<T, R>(options);
}

/**
 * Global worker pool instance
 */
let globalWorkerPool: WorkerPool | null = null;

/**
 * Get or create global worker pool
 */
export function getGlobalWorkerPool(): WorkerPool {
  if (!globalWorkerPool) {
    globalWorkerPool = createWorkerPool();
  }
  return globalWorkerPool;
}

/**
 * Shutdown global worker pool
 */
export async function shutdownGlobalWorkerPool(): Promise<void> {
  if (globalWorkerPool) {
    await globalWorkerPool.shutdown();
    globalWorkerPool = null;
  }
}
