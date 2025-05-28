/**
 * Stream Processing Module Tests
 * =============================
 * 
 * Simplified test suite for the stream processing module implementing Axiom 4:
 * "High-throughput streaming primitives for efficient data handling"
 */

import { 
  createStream,
  createAndInitializeStream,
  StreamInterface,
  StreamOptions,
  StreamState,
  ChunkProcessor,
  createStreamFromArray
} from './index';

// Mock the os modules since they might not be available during testing
jest.mock('../../os/model', () => ({
  BaseModel: class MockBaseModel {
    protected state: any = {
      lifecycle: 'Ready',
      operationCount: { total: 0, success: 0, failed: 0 },
      lastStateChangeTime: Date.now(),
      uptime: 0,
      custom: {}
    };
    protected options: any;
    protected logger: any = {
      debug: jest.fn().mockResolvedValue(undefined),
      info: jest.fn().mockResolvedValue(undefined),
      warn: jest.fn().mockResolvedValue(undefined),
      error: jest.fn().mockResolvedValue(undefined)
    };

    constructor(options: any) {
      this.options = options;
    }

    async initialize() {
      await this.onInitialize();
      return { success: true, data: undefined, timestamp: Date.now(), source: this.options.name };
    }

    async process(input: any) {
      this.state.operationCount.total++;
      try {
        const result = await this.onProcess(input);
        this.state.operationCount.success++;
        return { success: true, data: result, timestamp: Date.now(), source: this.options.name };
      } catch (error) {
        this.state.operationCount.failed++;
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error', timestamp: Date.now(), source: this.options.name };
      }
    }

    async reset() {
      await this.onReset();
      this.state.operationCount = { total: 0, success: 0, failed: 0 };
      return { success: true, data: undefined, timestamp: Date.now(), source: this.options.name };
    }

    async terminate() {
      await this.onTerminate();
      this.state.lifecycle = 'Terminated';
      return { success: true, data: undefined, timestamp: Date.now(), source: this.options.name };
    }

    getState() { return this.state; }
    createResult(success: boolean, data?: any, error?: string) {
      return { success, data, error, timestamp: Date.now(), source: this.options.name };
    }

    protected async onInitialize(): Promise<void> {}
    protected async onProcess<T, R>(input: T): Promise<R> { throw new Error('Not implemented'); }
    protected async onReset(): Promise<void> {}
    protected async onTerminate(): Promise<void> {}
  },
  ModelLifecycleState: {
    Uninitialized: 'Uninitialized',
    Initializing: 'Initializing', 
    Ready: 'Ready',
    Processing: 'Processing',
    Error: 'Error',
    Terminating: 'Terminating',
    Terminated: 'Terminated'
  }
}));

describe('Stream Processing Module', () => {
  let instance: StreamInterface;
  
  beforeEach(async () => {
    instance = createStream({
      debug: true,
      name: 'test-stream',
      defaultChunkSize: 10,
      maxConcurrency: 2,
      memoryLimit: 10 * 1024 * 1024, // 10MB
      enableOptimization: true
    });
    
    await instance.initialize();
  });
  
  afterEach(async () => {
    await instance.terminate();
  });
  
  describe('Lifecycle Management', () => {
    test('should initialize correctly', () => {
      const state = instance.getState() as StreamState;
      expect(state.lifecycle).toBe('Ready');
      expect(state.config).toBeDefined();
      expect(state.config.defaultChunkSize).toBe(10);
      expect(state.config.maxConcurrency).toBe(2);
    });
    
    test('should reset state correctly', async () => {
      // Reset the instance
      const result = await instance.reset();
      expect(result.success).toBe(true);
      
      // Check state after reset
      const state = instance.getState();
      expect(state.operationCount.total).toBe(0);
    });
    
    test('should terminate properly', async () => {
      const result = await instance.terminate();
      expect(result.success).toBe(true);
      
      const state = instance.getState();
      expect(state.lifecycle).toBe('Terminated');
    });
  });
  
  describe('Stream Creation and Basic Operations', () => {
    test('should create stream from array', async () => {
      const data = [1, 2, 3, 4, 5];
      const stream = createStreamFromArray(data);
      
      const result = await stream.toArray();
      expect(result).toEqual(data);
    });
    
    test('should create stream through interface', () => {
      const data = [1, 2, 3, 4, 5];
      const asyncIterable = async function* () {
        for (const item of data) {
          yield item;
        }
      };
      
      const stream = instance.createStream(asyncIterable());
      expect(stream).toBeDefined();
    });
    
    test('should support basic stream transformations', async () => {
      const data = [1, 2, 3, 4, 5];
      const stream = createStreamFromArray(data);
      
      // Test map
      const doubled = stream.map(x => x * 2);
      const doubledResult = await doubled.toArray();
      expect(doubledResult).toEqual([2, 4, 6, 8, 10]);
      
      // Test filter
      const evenStream = createStreamFromArray(data);
      const filtered = evenStream.filter(x => x % 2 === 0);
      const filteredResult = await filtered.toArray();
      expect(filteredResult).toEqual([2, 4]);
      
      // Test take
      const takeStream = createStreamFromArray(data);
      const taken = takeStream.take(3);
      const takenResult = await taken.toArray();
      expect(takenResult).toEqual([1, 2, 3]);
      
      // Test skip
      const skipStream = createStreamFromArray(data);
      const skipped = skipStream.skip(2);
      const skippedResult = await skipped.toArray();
      expect(skippedResult).toEqual([3, 4, 5]);
    });
    
    test('should support stream reduction', async () => {
      const data = [1, 2, 3, 4, 5];
      const stream = createStreamFromArray(data);
      
      const sum = await stream.reduce((acc, val) => acc + val, 0);
      expect(sum).toBe(15);
    });
  });
  
  describe('Chunked Processing', () => {
    test('should process chunked streams', async () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const source = async function* () {
        for (const item of data) {
          yield item;
        }
      };
      
      const processor: ChunkProcessor<number> = {
        config: {
          chunkSize: 3,
          maxBufferSize: 1000,
          enableBackpressure: true,
          backpressureThreshold: 0.8,
          errorTolerance: 0.1,
          retryAttempts: 3,
          retryDelay: 100
        },
        
        async processChunk(chunk: number[]): Promise<number[]> {
          return chunk.map(x => x * 2);
        },
        
        async flush(): Promise<number[]> {
          return [];
        },
        
        getMemoryUsage(): number {
          return 100;
        },
        
        shouldApplyBackpressure(): boolean {
          return false;
        },
        
        handleProcessingError(error: Error, chunk: number[]): number[] | null {
          return null;
        },
        
        async initialize(): Promise<void> {},
        async terminate(): Promise<void> {}
      };
      
      const result = await instance.processChunkedStream(source(), processor);
      const output: number[] = [];
      
      for await (const item of result) {
        output.push(item);
      }
      
      expect(output).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
    });
  });
  
  describe('Pipeline Operations', () => {
    test('should create and execute pipelines', async () => {
      const pipeline = instance.createPipeline<number, string>();
      expect(pipeline).toBeDefined();
      
      // Test pipeline configuration methods exist
      expect(typeof pipeline.source).toBe('function');
      expect(typeof pipeline.transform).toBe('function');
      expect(typeof pipeline.filter).toBe('function');
      expect(typeof pipeline.execute).toBe('function');
    });
  });
  
  describe('Performance Monitoring', () => {
    test('should provide performance metrics', () => {
      const metrics = instance.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.throughput).toBe('number');
      expect(typeof metrics.latency).toBe('number');
      expect(typeof metrics.memoryUsage).toBe('number');
      expect(typeof metrics.errorRate).toBe('number');
    });
    
    test('should provide memory usage information', () => {
      const memoryStats = instance.getMemoryUsage();
      expect(memoryStats).toBeDefined();
      expect(typeof memoryStats.used).toBe('number');
      expect(typeof memoryStats.available).toBe('number');
      expect(typeof memoryStats.total).toBe('number');
    });
    
    test('should support performance optimization', async () => {
      const result = await instance.optimizePerformance();
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.improvementPercentage).toBe('number');
    });
  });
  
  describe('Configuration Management', () => {
    test('should support configuration updates', () => {
      const newConfig = {
        defaultChunkSize: 20,
        maxConcurrency: 4
      };
      
      instance.configure(newConfig);
      const currentConfig = instance.getConfiguration();
      
      expect(currentConfig.defaultChunkSize).toBe(20);
      expect(currentConfig.maxConcurrency).toBe(4);
    });
    
    test('should use default options when none provided', async () => {
      const defaultInstance = createStream();
      await defaultInstance.initialize();
      
      const config = defaultInstance.getConfiguration();
      expect(config.defaultChunkSize).toBeDefined();
      expect(config.maxConcurrency).toBeDefined();
      
      await defaultInstance.terminate();
    });
  });
  
  describe('Backpressure Management', () => {
    test('should provide backpressure controller', () => {
      const controller = instance.getBackpressureController();
      expect(controller).toBeDefined();
      expect(typeof controller.pause).toBe('function');
      expect(typeof controller.resume).toBe('function');
      expect(typeof controller.drain).toBe('function');
      expect(typeof controller.getBufferLevel).toBe('function');
    });
    
    test('should handle backpressure operations', async () => {
      const controller = instance.getBackpressureController();
      
      // Test pause/resume
      controller.pause();
      controller.resume();
      
      // Test drain
      await controller.drain();
      
      // Test threshold management
      controller.setThreshold(0.9);
      const threshold = controller.getThreshold();
      expect(threshold).toBe(0.9);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle processing errors gracefully', async () => {
      const result = await instance.process(null as any);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    test('should handle invalid stream operations', async () => {
      const invalidOperation = {
        operation: 'nonexistent'
      };
      
      const result = await instance.process(invalidOperation as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown operation');
    });
  });
  
  describe('Factory Functions', () => {
    test('createAndInitializeStream should work', async () => {
      const testInstance = await createAndInitializeStream({
        debug: true,
        name: 'factory-test',
        defaultChunkSize: 5
      });
      
      expect(testInstance).toBeDefined();
      const state = testInstance.getState();
      expect(state.lifecycle).toBe('Ready');
      
      await testInstance.terminate();
    });
  });
  
  describe('Integration with Core Modules', () => {
    test('should create prime stream processor', () => {
      const primeProcessor = instance.createPrimeStreamProcessor();
      expect(primeProcessor).toBeDefined();
    });
    
    test('should create encoding stream bridge', () => {
      const encodingBridge = instance.createEncodingStreamBridge();
      expect(encodingBridge).toBeDefined();
      expect(typeof encodingBridge.encodeTextStream).toBe('function');
      expect(typeof encodingBridge.decodeTextStream).toBe('function');
    });
    
    test('should handle chunked stream creation', () => {
      const chunkedStream = instance.createChunkedStream({
        chunkSize: 10,
        maxBufferSize: 1000,
        enableBackpressure: true,
        backpressureThreshold: 0.8,
        errorTolerance: 0.1,
        retryAttempts: 3,
        retryDelay: 100
      });
      
      expect(chunkedStream).toBeDefined();
      expect(typeof chunkedStream.processChunk).toBe('function');
      expect(typeof chunkedStream.flush).toBe('function');
    });
  });
  
  describe('State Management', () => {
    test('should maintain comprehensive state', () => {
      const state = instance.getState() as StreamState;
      
      expect(state.config).toBeDefined();
      expect(state.metrics).toBeDefined();
      expect(state.activeStreams).toBeDefined();
      expect(state.pipelines).toBeDefined();
      expect(state.memory).toBeDefined();
      
      // Check state structure
      expect(typeof state.activeStreams.count).toBe('number');
      expect(typeof state.pipelines.created).toBe('number');
      expect(typeof state.memory.currentUsage).toBe('number');
    });
  });
  
  describe('Logger Access', () => {
    test('should provide access to logger', () => {
      const logger = instance.getLogger();
      expect(logger).toBeDefined();
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });
  });
});
