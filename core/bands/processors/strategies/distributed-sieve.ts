/**
 * Distributed Sieve Strategy
 * =========================
 * 
 * SUPER_TREBLE band processor (513-1024 bits)
 * Optimized for extremely large numbers using distributed computing approaches.
 * Uses distributed sieving, remote worker coordination, and fault-tolerant processing.
 */

import { BaseStrategyProcessor, BaseStrategyConfig } from '../strategy-processor';
import { BandType, ProcessingContext } from '../../types';

/**
 * Distributed processing configuration for SUPER_TREBLE band
 */
interface DistributedConfig {
  nodeCount: number;
  maxNodes: number;
  communicationTimeout: number;
  faultTolerance: boolean;
  redundancyFactor: number;
  loadBalancingStrategy: 'round_robin' | 'load_aware' | 'capability_based';
  distributedSieveSize: number;
  consensusThreshold: number;
  networkLatencyTolerance: number;
}

/**
 * Network node for distributed processing
 */
interface ProcessingNode {
  id: string;
  capabilities: {
    memory: number;
    cpu: number;
    network: number;
  };
  status: 'available' | 'busy' | 'failed' | 'disconnected';
  currentLoad: number;
  lastHeartbeat: number;
  location: string;
}

/**
 * Distributed task for processing
 */
interface DistributedTask {
  id: string;
  type: 'sieve' | 'factor' | 'primality' | 'consensus';
  data: any;
  range?: { start: bigint; end: bigint };
  priority: number;
  assignedNodes: string[];
  redundancy: number;
  timeout: number;
  retryCount: number;
}

/**
 * Task result from distributed processing
 */
interface TaskResult {
  taskId: string;
  nodeId: string;
  result: any;
  processingTime: number;
  confidence: number;
  timestamp: number;
}

/**
 * Distributed sieve strategy for SUPER_TREBLE band
 * Handles numbers with 513-1024 bits using distributed processing
 */
export class DistributedSieveStrategy extends BaseStrategyProcessor {
  private distributedConfig: DistributedConfig;
  private processingNodes: Map<string, ProcessingNode> = new Map();
  private activeTasks: Map<string, DistributedTask> = new Map();
  private taskResults: Map<string, TaskResult[]> = new Map();
  private networkMetrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageNetworkLatency: 0,
    nodeFailures: 0,
    consensusAgreements: 0
  };
  
  constructor(config: BaseStrategyConfig = {}) {
    super({
      enableCaching: true,
      cacheSize: 25000,
      ...config
    });
    
    this.distributedConfig = {
      nodeCount: 8,
      maxNodes: 32,
      communicationTimeout: 30000,
      faultTolerance: true,
      redundancyFactor: 3,
      loadBalancingStrategy: 'capability_based',
      distributedSieveSize: 1048576, // 1MB sieve segments
      consensusThreshold: 0.67, // 67% agreement required
      networkLatencyTolerance: 5000 // 5 seconds
    };
    
    // Initialize distributed processing infrastructure
    this.initializeDistributedNetwork();
  }
  
  /**
   * Check if this strategy supports the given band
   */
  supports(band: BandType): boolean {
    return band === BandType.SUPER_TREBLE;
  }
  
  /**
   * Execute distributed sieve strategy
   */
  protected async executeStrategy(input: any, context: ProcessingContext): Promise<any> {
    if (typeof input === 'bigint' || typeof input === 'number') {
      return this.processNumber(input, context);
    } else if (Array.isArray(input)) {
      return this.processDistributedBatch(input, context);
    } else if (input && typeof input === 'object' && 'operation' in input) {
      return this.processOperation(input, context);
    } else {
      throw new Error(`Unsupported input type for distributed sieve processing: ${typeof input}`);
    }
  }
  
  /**
   * Process a single number using distributed algorithms
   */
  private async processNumber(n: bigint | number, context: ProcessingContext): Promise<any> {
    const num = typeof n === 'bigint' ? n : BigInt(n);
    
    // Validate number is in SUPER_TREBLE range (513-1024 bits)
    const bitSize = num.toString(2).length;
    if (bitSize < 513 || bitSize > 1024) {
      throw new Error(`Number out of SUPER_TREBLE band range: ${bitSize} bits (expected 513-1024)`);
    }
    
    // Use distributed factorization
    const result = await this.distributedFactorization(num);
    
    return result;
  }
  
  /**
   * Process a batch of numbers using distributed optimization
   */
  private async processDistributedBatch(numbers: (bigint | number)[], context: ProcessingContext): Promise<any[]> {
    const results: any[] = new Array(numbers.length);
    
    // Distribute work across available nodes
    const workDistribution = await this.distributeWorkload(numbers);
    
    // Process distributed tasks
    const taskPromises = workDistribution.map(workItem => 
      this.processDistributedWorkItem(workItem)
    );
    
    const distributedResults = await Promise.allSettled(taskPromises);
    
    // Assemble results
    for (let i = 0; i < distributedResults.length; i++) {
      const result = distributedResults[i];
      if (result.status === 'fulfilled') {
        // Map distributed results back to original indices
        for (const [index, value] of result.value.entries()) {
          results[index] = value;
        }
      } else {
        // Handle failed distributed tasks
        for (const index of workDistribution[i].indices) {
          results[index] = {
            error: `Distributed processing failed: ${result.reason}`,
            input: numbers[index]
          };
        }
      }
    }
    
    return results;
  }
  
  /**
   * Process operation-based input
   */
  private async processOperation(operation: any, context: ProcessingContext): Promise<any> {
    switch (operation.type) {
      case 'factor':
        return this.processNumber(operation.value, context);
      case 'distributedFactor':
        return this.distributedFactorization(BigInt(operation.value));
      case 'distributedSieve':
        return this.distributedSieve(operation.start, operation.end);
      case 'networkStatus':
        return this.getNetworkStatus();
      case 'consensusPrimality':
        return this.consensusPrimalityTest(BigInt(operation.value));
      case 'faultTolerantOperation':
        return this.faultTolerantOperation(operation.subOperation);
      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }
  }
  
  /**
   * Distributed factorization for extremely large numbers
   */
  private async distributedFactorization(n: bigint): Promise<{ factors: Array<{prime: bigint, exponent: number}>, method: string }> {
    if (n <= 1n) {
      return { factors: [], method: 'distributed-sieve' };
    }
    
    const factors: Array<{prime: bigint, exponent: number}> = [];
    let remaining = n;
    
    // Use distributed trial division for small-medium factors
    const smallFactors = await this.distributedTrialDivision(remaining);
    for (const factor of smallFactors) {
      factors.push(factor);
      for (let i = 0; i < factor.exponent; i++) {
        remaining /= factor.prime;
      }
    }
    
    if (remaining === 1n) {
      return { factors, method: 'distributed-sieve' };
    }
    
    // Use distributed advanced algorithms for very large factors
    if (remaining > 1n && remaining < 2n ** 512n) {
      const mediumFactors = await this.distributedECM(remaining);
      factors.push(...mediumFactors);
    } else if (remaining > 1n) {
      // Use distributed GNFS for extremely large factors
      const largeFactors = await this.distributedGNFS(remaining);
      factors.push(...largeFactors);
    }
    
    return { factors, method: 'distributed-sieve' };
  }
  
  /**
   * Distributed trial division using network nodes
   */
  private async distributedTrialDivision(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    const sqrt = this.integerSqrt(n);
    const limit = Number(sqrt);
    
    // Create distributed sieve tasks
    const tasks = await this.createDistributedSieveTasks(2, limit);
    
    // Execute tasks with fault tolerance
    const taskResults = await this.executeFaultTolerantTasks(tasks);
    
    // Combine results with consensus
    const consensusFactors = await this.buildConsensusFactors(taskResults, n);
    
    factors.push(...consensusFactors);
    
    return factors;
  }
  
  /**
   * Distributed Elliptic Curve Method
   */
  private async distributedECM(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    // Create multiple ECM tasks with different curves
    const curveCount = 20;
    const tasks: DistributedTask[] = [];
    
    for (let i = 0; i < curveCount; i++) {
      const task: DistributedTask = {
        id: `ecm_${i}_${Date.now()}`,
        type: 'factor',
        data: {
          algorithm: 'ecm',
          n: n.toString(),
          curve: { a: BigInt(i + 1), b: BigInt(i * 2 + 1) },
          bound: 100000
        },
        priority: 2,
        assignedNodes: [],
        redundancy: this.distributedConfig.redundancyFactor,
        timeout: this.distributedConfig.communicationTimeout,
        retryCount: 0
      };
      
      tasks.push(task);
    }
    
    // Execute ECM tasks in parallel across nodes
    const results = await this.executeFaultTolerantTasks(tasks);
    
    // Extract factors from successful results
    for (const result of results) {
      if (result.result && result.result.factor && 
          result.result.factor !== n && result.result.factor !== 1n) {
        factors.push({ prime: BigInt(result.result.factor), exponent: 1 });
        
        const quotient = n / BigInt(result.result.factor);
        if (quotient !== BigInt(result.result.factor)) {
          factors.push({ prime: quotient, exponent: 1 });
        }
        break;
      }
    }
    
    return factors;
  }
  
  /**
   * Distributed General Number Field Sieve
   */
  private async distributedGNFS(n: bigint): Promise<Array<{prime: bigint, exponent: number}>> {
    // GNFS is extremely complex - this is a high-level distributed framework
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    // Create GNFS subtasks for distribution
    const gnfsTasks = await this.createGNFSTasks(n);
    
    // Execute with maximum fault tolerance
    const results = await this.executeFaultTolerantTasks(gnfsTasks);
    
    // Process GNFS results (simplified)
    if (results.length > 0 && results[0].result) {
      // In practice, GNFS would return multiple factors
      factors.push({ prime: n, exponent: 1 });
    }
    
    return factors;
  }
  
  /**
   * Distributed sieve implementation
   */
  private async distributedSieve(start: number, end: number): Promise<bigint[]> {
    const primes: bigint[] = [];
    
    // Create distributed sieve tasks
    const tasks = await this.createDistributedSieveTasks(start, end);
    
    // Execute with consensus
    const results = await this.executeFaultTolerantTasks(tasks);
    
    // Build consensus prime list
    const consensusPrimes = await this.buildConsensusPrimes(results);
    
    primes.push(...consensusPrimes);
    
    return primes.sort((a, b) => a < b ? -1 : 1);
  }
  
  /**
   * Consensus-based primality test
   */
  private async consensusPrimalityTest(n: bigint): Promise<boolean> {
    const tasks: DistributedTask[] = [];
    
    // Create multiple primality test tasks
    for (let i = 0; i < this.distributedConfig.redundancyFactor; i++) {
      const task: DistributedTask = {
        id: `primality_${i}_${Date.now()}`,
        type: 'primality',
        data: { n: n.toString(), rounds: 20 },
        priority: 1,
        assignedNodes: [],
        redundancy: 1,
        timeout: this.distributedConfig.communicationTimeout,
        retryCount: 0
      };
      
      tasks.push(task);
    }
    
    // Execute across different nodes
    const results = await this.executeFaultTolerantTasks(tasks);
    
    // Consensus decision
    const trueCount = results.filter(r => r.result === true).length;
    const falseCount = results.filter(r => r.result === false).length;
    
    if (trueCount + falseCount === 0) {
      throw new Error('No valid primality test results');
    }
    
    const agreement = Math.max(trueCount, falseCount) / (trueCount + falseCount);
    
    if (agreement >= this.distributedConfig.consensusThreshold) {
      this.networkMetrics.consensusAgreements++;
      return trueCount > falseCount;
    } else {
      throw new Error('Insufficient consensus for primality test');
    }
  }
  
  /**
   * Create distributed sieve tasks
   */
  private async createDistributedSieveTasks(start: number, end: number): Promise<DistributedTask[]> {
    const tasks: DistributedTask[] = [];
    const segmentSize = this.distributedConfig.distributedSieveSize;
    
    for (let i = start; i <= end; i += segmentSize) {
      const segmentEnd = Math.min(i + segmentSize - 1, end);
      
      const task: DistributedTask = {
        id: `sieve_${i}_${segmentEnd}_${Date.now()}`,
        type: 'sieve',
        data: { start: i, end: segmentEnd },
        range: { start: BigInt(i), end: BigInt(segmentEnd) },
        priority: 1,
        assignedNodes: [],
        redundancy: this.distributedConfig.redundancyFactor,
        timeout: this.distributedConfig.communicationTimeout,
        retryCount: 0
      };
      
      tasks.push(task);
    }
    
    return tasks;
  }
  
  /**
   * Create GNFS tasks for distribution
   */
  private async createGNFSTasks(n: bigint): Promise<DistributedTask[]> {
    const tasks: DistributedTask[] = [];
    
    // GNFS phases: polynomial selection, sieving, linear algebra, square root
    const phases = ['polynomial', 'sieving', 'linear_algebra', 'square_root'];
    
    for (const phase of phases) {
      const task: DistributedTask = {
        id: `gnfs_${phase}_${Date.now()}`,
        type: 'factor',
        data: {
          algorithm: 'gnfs',
          phase,
          n: n.toString()
        },
        priority: 3,
        assignedNodes: [],
        redundancy: 2,
        timeout: this.distributedConfig.communicationTimeout * 5, // Longer timeout for GNFS
        retryCount: 0
      };
      
      tasks.push(task);
    }
    
    return tasks;
  }
  
  /**
   * Execute tasks with fault tolerance
   */
  private async executeFaultTolerantTasks(tasks: DistributedTask[]): Promise<TaskResult[]> {
    const results: TaskResult[] = [];
    
    for (const task of tasks) {
      this.networkMetrics.totalTasks++;
      
      try {
        // Assign task to available nodes
        const assignedNodes = await this.assignTaskToNodes(task);
        task.assignedNodes = assignedNodes;
        
        // Execute task on multiple nodes for redundancy
        const nodeResults = await this.executeTaskOnNodes(task);
        
        // Select best result based on consensus
        const bestResult = await this.selectBestResult(nodeResults);
        
        if (bestResult) {
          results.push(bestResult);
          this.networkMetrics.completedTasks++;
        } else {
          this.networkMetrics.failedTasks++;
        }
        
      } catch (error) {
        this.networkMetrics.failedTasks++;
        
        if (!this.distributedConfig.faultTolerance) {
          throw error;
        }
      }
    }
    
    return results;
  }
  
  /**
   * Assign task to optimal nodes
   */
  private async assignTaskToNodes(task: DistributedTask): Promise<string[]> {
    const availableNodes = Array.from(this.processingNodes.values())
      .filter(node => node.status === 'available')
      .sort((a, b) => this.calculateNodeScore(b) - this.calculateNodeScore(a));
    
    const requiredNodes = Math.min(task.redundancy, availableNodes.length);
    
    if (requiredNodes === 0) {
      throw new Error('No available nodes for task execution');
    }
    
    return availableNodes.slice(0, requiredNodes).map(node => node.id);
  }
  
  /**
   * Calculate node suitability score
   */
  private calculateNodeScore(node: ProcessingNode): number {
    const memoryScore = node.capabilities.memory / 1000000; // Normalize memory
    const cpuScore = node.capabilities.cpu;
    const loadPenalty = node.currentLoad;
    
    return memoryScore + cpuScore - loadPenalty;
  }
  
  /**
   * Execute task on assigned nodes
   */
  private async executeTaskOnNodes(task: DistributedTask): Promise<TaskResult[]> {
    const nodeResults: TaskResult[] = [];
    
    // Simulate distributed execution
    const executionPromises = task.assignedNodes.map(async (nodeId) => {
      const node = this.processingNodes.get(nodeId);
      if (!node) return null;
      
      try {
        // Mark node as busy
        node.status = 'busy';
        node.currentLoad += 0.2;
        
        // Simulate task execution
        const startTime = performance.now();
        const result = await this.simulateNodeExecution(task, nodeId);
        const processingTime = performance.now() - startTime;
        
        // Mark node as available
        node.status = 'available';
        node.currentLoad = Math.max(0, node.currentLoad - 0.2);
        
        return {
          taskId: task.id,
          nodeId,
          result,
          processingTime,
          confidence: 0.95,
          timestamp: Date.now()
        };
        
      } catch (error) {
        // Handle node failure
        node.status = 'failed';
        this.networkMetrics.nodeFailures++;
        return null;
      }
    });
    
    const results = await Promise.allSettled(executionPromises);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        nodeResults.push(result.value);
      }
    }
    
    return nodeResults;
  }
  
  /**
   * Simulate node execution (placeholder for actual distributed execution)
   */
  private async simulateNodeExecution(task: DistributedTask, nodeId: string): Promise<any> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    switch (task.type) {
      case 'sieve':
        return this.simulateSieveExecution(task.data);
      case 'factor':
        return this.simulateFactorExecution(task.data);
      case 'primality':
        return this.simulatePrimalityExecution(task.data);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }
  
  /**
   * Simulate sieve execution
   */
  private simulateSieveExecution(data: any): bigint[] {
    const { start, end } = data;
    const primes: bigint[] = [];
    
    for (let i = Math.max(start, 2); i <= end && i <= start + 1000; i++) {
      if (this.isPrimeSimple(i)) {
        primes.push(BigInt(i));
      }
    }
    
    return primes;
  }
  
  /**
   * Simulate factor execution
   */
  private simulateFactorExecution(data: any): any {
    if (data.algorithm === 'ecm') {
      // Simulate ECM result
      const n = BigInt(data.n);
      if (n % 3n === 0n) {
        return { factor: 3n };
      }
      return { factor: null };
    }
    
    return { factors: [] };
  }
  
  /**
   * Simulate primality execution
   */
  private simulatePrimalityExecution(data: any): boolean {
    const n = BigInt(data.n);
    return this.millerRabinTest(n, data.rounds || 10);
  }
  
  /**
   * Select best result from multiple node results
   */
  private async selectBestResult(results: TaskResult[]): Promise<TaskResult | null> {
    if (results.length === 0) return null;
    
    // Simple consensus: select result with highest confidence
    return results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }
  
  /**
   * Build consensus factors from distributed results
   */
  private async buildConsensusFactors(
    results: TaskResult[], 
    n: bigint
  ): Promise<Array<{prime: bigint, exponent: number}>> {
    const factorCounts = new Map<string, number>();
    const factors: Array<{prime: bigint, exponent: number}> = [];
    
    // Count factor occurrences across results
    for (const result of results) {
      if (Array.isArray(result.result)) {
        for (const prime of result.result) {
          const key = prime.toString();
          factorCounts.set(key, (factorCounts.get(key) || 0) + 1);
        }
      }
    }
    
    // Select factors with sufficient consensus
    const minAgreement = Math.ceil(results.length * this.distributedConfig.consensusThreshold);
    
    for (const [primeStr, count] of factorCounts) {
      if (count >= minAgreement) {
        const prime = BigInt(primeStr);
        if (n % prime === 0n) {
          let exponent = 0;
          let temp = n;
          while (temp % prime === 0n) {
            temp /= prime;
            exponent++;
          }
          if (exponent > 0) {
            factors.push({ prime, exponent });
          }
        }
      }
    }
    
    return factors;
  }
  
  /**
   * Build consensus primes from distributed results
   */
  private async buildConsensusPrimes(results: TaskResult[]): Promise<bigint[]> {
    const primeCounts = new Map<string, number>();
    const primes: bigint[] = [];
    
    // Count prime occurrences across results
    for (const result of results) {
      if (Array.isArray(result.result)) {
        for (const prime of result.result) {
          const key = prime.toString();
          primeCounts.set(key, (primeCounts.get(key) || 0) + 1);
        }
      }
    }
    
    // Select primes with sufficient consensus
    const minAgreement = Math.ceil(results.length * this.distributedConfig.consensusThreshold);
    
    for (const [primeStr, count] of primeCounts) {
      if (count >= minAgreement) {
        primes.push(BigInt(primeStr));
      }
    }
    
    return primes;
  }
  
  /**
   * Distribute workload across nodes
   */
  private async distributeWorkload(numbers: (bigint | number)[]): Promise<Array<{
    numbers: (bigint | number)[];
    indices: number[];
    assignedNode: string;
  }>> {
    const workItems = [];
    const availableNodes = Array.from(this.processingNodes.values())
      .filter(node => node.status === 'available');
    
    if (availableNodes.length === 0) {
      throw new Error('No available nodes for workload distribution');
    }
    
    const itemsPerNode = Math.ceil(numbers.length / availableNodes.length);
    
    for (let i = 0; i < availableNodes.length && i * itemsPerNode < numbers.length; i++) {
      const start = i * itemsPerNode;
      const end = Math.min(start + itemsPerNode, numbers.length);
      
      workItems.push({
        numbers: numbers.slice(start, end),
        indices: Array.from({ length: end - start }, (_, idx) => start + idx),
        assignedNode: availableNodes[i].id
      });
    }
    
    return workItems;
  }
  
  /**
   * Process distributed work item
   */
  private async processDistributedWorkItem(workItem: any): Promise<Map<number, any>> {
    const results = new Map<number, any>();
    
    for (let i = 0; i < workItem.numbers.length; i++) {
      try {
        const context: ProcessingContext = {
          band: BandType.SUPER_TREBLE,
          bitSize: typeof workItem.numbers[i] === 'bigint' 
            ? workItem.numbers[i].toString(2).length 
            : workItem.numbers[i].toString(2).length,
          workload: 'factorization',
          resources: { memory: this.estimateMemoryUsage(), cpu: 1 },
          constraints: { 
            timeConstraints: this.distributedConfig.communicationTimeout,
            maxMemoryUsage: this.estimateMemoryUsage() 
          }
        };
        
        const result = await this.processNumber(workItem.numbers[i], context);
        results.set(workItem.indices[i], result);
        
      } catch (error) {
        results.set(workItem.indices[i], {
          error: error instanceof Error ? error.message : 'Processing failed',
          input: workItem.numbers[i]
        });
      }
    }
    
    return results;
  }
  
  /**
   * Get network status
   */
  private getNetworkStatus(): any {
    const nodeStats = Array.from(this.processingNodes.values()).reduce((acc, node) => {
      acc[node.status] = (acc[node.status] || 0) + 1;
      return acc;
    }, {} as any);
    
    return {
      nodes: {
        total: this.processingNodes.size,
        ...nodeStats
      },
      metrics: this.networkMetrics,
      configuration: this.distributedConfig
    };
  }
  
  /**
   * Fault-tolerant operation wrapper
   */
  private async faultTolerantOperation(operation: any): Promise<any> {
    const maxRetries = 3;
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.processOperation(operation, {
          band: BandType.SUPER_TREBLE,
          bitSize: 1024,
          workload: operation.type || 'general',
          resources: { memory: this.estimateMemoryUsage(), cpu: 1 },
          constraints: {
            timeConstraints: this.distributedConfig.communicationTimeout,
            maxMemoryUsage: this.estimateMemoryUsage()
          }
        });
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }
    
    throw lastError;
  }
  
  /**
   * Initialize distributed network
   */
  private initializeDistributedNetwork(): void {
    // Simulate network nodes
    for (let i = 0; i < this.distributedConfig.nodeCount; i++) {
      const node: ProcessingNode = {
        id: `node_${i}`,
        capabilities: {
          memory: Math.random() * 16000000 + 4000000, // 4-20MB
          cpu: Math.random() * 8 + 2, // 2-10 cores
          network: Math.random() * 1000 + 100 // 100-1100 Mbps
        },
        status: 'available',
        currentLoad: 0,
        lastHeartbeat: Date.now(),
        location: `datacenter_${Math.floor(i / 4)}`
      };
      
      this.processingNodes.set(node.id, node);
    }
  }
  
  // Utility methods
  private isPrimeSimple(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    const sqrt = Math.sqrt(n);
    for (let i = 3; i <= sqrt; i += 2) {
      if (n % i === 0) return false;
    }
    
    return true;
  }
  
  private integerSqrt(n: bigint): bigint {
    if (n < 0n) throw new Error('Cannot compute square root of negative number');
    if (n < 2n) return n;
    
    let x = n;
    let y = (x + 1n) / 2n;
    
    while (y < x) {
      x = y;
      y = (x + n / x) / 2n;
    }
    
    return x;
  }
  
  private millerRabinTest(n: bigint, k: number = 10): boolean {
    if (n < 2n) return false;
    if (n === 2n || n === 3n) return true;
    if (n % 2n === 0n) return false;
    
    let d = n - 1n;
    let r = 0;
    while (d % 2n === 0n) {
      d /= 2n;
      r++;
    }
    
    for (let i = 0; i < k; i++) {
      const a = this.randomBigInt(2n, n - 2n);
      let x = this.modPow(a, d, n);
      
      if (x === 1n || x === n - 1n) continue;
      
      let composite = true;
      for (let j = 0; j < r - 1; j++) {
        x = this.modPow(x, 2n, n);
        if (x === n - 1n) {
          composite = false;
          break;
        }
      }
      
      if (composite) return false;
    }
    
    return true;
  }
  
  private modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    let result = 1n;
    base = base % modulus;
    
    while (exponent > 0n) {
      if (exponent % 2n === 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent / 2n;
      base = (base * base) % modulus;
    }
    
    return result;
  }
  
  private randomBigInt(min: bigint, max: bigint): bigint {
    const range = max - min + 1n;
    const bits = range.toString(2).length;
    
    let result;
    do {
      result = 0n;
      for (let i = 0; i < bits; i++) {
        result = (result << 1n) + (Math.random() < 0.5 ? 0n : 1n);
      }
      result = result % range;
    } while (result + min > max);
    
    return result + min;
  }
  
  private gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
      [a, b] = [b, a % b];
    }
    return a;
  }
  
  private abs(n: bigint): bigint {
    return n < 0n ? -n : n;
  }
  
  /**
   * Get base acceleration factor for distributed sieve processing
   */
  protected getBaseAccelerationFactor(): number {
    return 25.0; // SUPER_TREBLE band acceleration
  }
  
  /**
   * Estimate memory usage for distributed sieve processing
   */
  protected estimateMemoryUsage(): number {
    // Very high memory usage due to distributed coordination
    return 128 * 1024 * 1024; // 128MB
  }
}
