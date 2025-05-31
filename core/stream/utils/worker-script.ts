/**
 * Worker Thread Script
 * ====================
 * 
 * Executes tasks in worker threads for true parallel processing.
 * This script runs in each worker thread.
 */

import { parentPort, workerData } from 'worker_threads';
import { Factor } from '../../prime/types';

// Worker identification
const workerId: number = workerData.workerId;

/**
 * Task types handled by the worker
 */
interface WorkerTask {
  id: string;
  type: 'transform' | 'process' | 'factorize' | 'custom';
  data: any;
  functionCode?: string;
}

/**
 * Worker result structure
 */
interface WorkerResult {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

/**
 * Process operation data
 */
interface ProcessData {
  operation: 'encode' | 'decode' | 'checksum';
  value: any;
}

if (!parentPort) {
  throw new Error('This script must be run as a worker thread');
}

/**
 * Handle incoming tasks
 */
parentPort.on('message', async (task: WorkerTask) => {
  const startTime = Date.now();
  
  try {
    let result: any;
    
    switch (task.type) {
      case 'transform':
        result = await handleTransform(task.data, task.functionCode);
        break;
        
      case 'process':
        result = await handleProcess(task.data);
        break;
        
      case 'factorize':
        result = await handleFactorize(task.data);
        break;
        
      case 'custom':
        result = await handleCustom(task.data, task.functionCode);
        break;
        
      default:
        throw new Error(`Unknown task type: ${(task as any).type}`);
    }
    
    // Send successful result
    const workerResult: WorkerResult = {
      id: task.id,
      success: true,
      result,
      executionTime: Date.now() - startTime
    };
    parentPort!.postMessage(workerResult);
    
  } catch (error) {
    // Send error result
    const workerResult: WorkerResult = {
      id: task.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTime: Date.now() - startTime
    };
    parentPort!.postMessage(workerResult);
  }
});

/**
 * Handle transform operations
 */
async function handleTransform(data: any, functionCode?: string): Promise<any> {
  if (!functionCode) {
    throw new Error('Transform function code is required');
  }
  
  // Create function from code
  const transformFn = new Function('data', functionCode);
  return transformFn(data);
}

/**
 * Handle general processing
 */
async function handleProcess(data: any): Promise<any> {
  if (typeof data === 'object' && data !== null && 'operation' in data) {
    const processData = data as ProcessData;
    
    switch (processData.operation) {
      case 'encode':
        return encodeData(processData.value);
      case 'decode':
        return decodeData(processData.value);
      case 'checksum':
        return calculateChecksum(processData.value);
      default:
        throw new Error(`Unknown operation: ${processData.operation}`);
    }
  }
  
  // Default processing
  return data;
}

/**
 * Handle factorization using optimized trial division
 */
async function handleFactorize(n: string | number | bigint): Promise<Factor[]> {
  let value: bigint;
  
  if (typeof n === 'string') {
    value = BigInt(n);
  } else if (typeof n === 'number') {
    value = BigInt(n);
  } else {
    value = n;
  }
  
  if (value <= 0n) {
    throw new Error('Number must be positive for factorization');
  }
  
  const factors: Factor[] = [];
  let remaining = value;
  
  // Handle small primes efficiently
  const smallPrimes: readonly bigint[] = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n, 43n, 47n];
  
  for (const prime of smallPrimes) {
    let exponent = 0;
    while (remaining % prime === 0n) {
      remaining /= prime;
      exponent++;
    }
    
    if (exponent > 0) {
      factors.push({
        prime,
        exponent
      });
    }
    
    if (remaining === 1n) {
      return factors;
    }
  }
  
  // Use optimized trial division for larger factors
  // Skip even numbers (already handled 2)
  let divisor = 49n; // Start after last small prime squared
  const step = 2n;
  
  while (divisor * divisor <= remaining) {
    let exponent = 0;
    while (remaining % divisor === 0n) {
      remaining /= divisor;
      exponent++;
    }
    
    if (exponent > 0) {
      factors.push({
        prime: divisor,
        exponent
      });
    }
    
    divisor += step;
  }
  
  if (remaining > 1n) {
    factors.push({
      prime: remaining,
      exponent: 1
    });
  }
  
  return factors;
}

/**
 * Handle custom operations
 */
async function handleCustom(data: any, functionCode?: string): Promise<any> {
  if (!functionCode) {
    throw new Error('Custom function code is required');
  }
  
  // Create async function from code
  const customFn = new Function('data', `return (async function() { ${functionCode} })()`);
  return await customFn(data);
}

/**
 * Helper: Encode data using proper prime encoding
 */
function encodeData(value: any): string {
  if (typeof value === 'string') {
    // Convert string to bytes then to BigInt
    const bytes = Buffer.from(value, 'utf8');
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) | BigInt(bytes[i]);
    }
    return result.toString();
  } else if (typeof value === 'number') {
    // Ensure safe conversion to BigInt
    if (!Number.isSafeInteger(value)) {
      throw new Error('Number is not a safe integer for encoding');
    }
    return BigInt(value).toString();
  } else if (typeof value === 'bigint') {
    return value.toString();
  } else if (typeof value === 'object' && value !== null) {
    // Encode object as JSON then to BigInt
    const json = JSON.stringify(value);
    const bytes = Buffer.from(json, 'utf8');
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) | BigInt(bytes[i]);
    }
    return result.toString();
  } else {
    throw new Error(`Cannot encode value of type ${typeof value}`);
  }
}

/**
 * Helper: Decode data from prime encoding
 */
function decodeData(value: string): any {
  if (typeof value !== 'string') {
    throw new Error('Decode value must be a string');
  }
  
  try {
    // Convert string to BigInt
    const bigintValue = BigInt(value);
    
    // Convert BigInt to bytes
    const bytes: number[] = [];
    let temp = bigintValue;
    while (temp > 0n) {
      bytes.unshift(Number(temp & 0xFFn));
      temp >>= 8n;
    }
    
    const buffer = Buffer.from(bytes);
    
    // Try to decode as UTF-8 string first
    const str = buffer.toString('utf8');
    
    // Check if it's valid JSON
    try {
      return JSON.parse(str);
    } catch {
      // Not JSON, return as string
      return str;
    }
  } catch (error) {
    throw new Error(`Failed to decode value: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper: Calculate checksum using prime-based algorithm
 */
function calculateChecksum(value: any): string {
  // Convert value to BigInt representation
  let bigintValue: bigint;
  
  if (typeof value === 'string') {
    const bytes = Buffer.from(value, 'utf8');
    bigintValue = 0n;
    for (let i = 0; i < bytes.length; i++) {
      bigintValue = (bigintValue << 8n) | BigInt(bytes[i]);
    }
  } else if (typeof value === 'bigint') {
    bigintValue = value;
  } else if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new Error('Number is not a safe integer for checksum');
    }
    bigintValue = BigInt(value);
  } else {
    // For objects, convert to JSON then to BigInt
    const json = JSON.stringify(value);
    const bytes = Buffer.from(json, 'utf8');
    bigintValue = 0n;
    for (let i = 0; i < bytes.length; i++) {
      bigintValue = (bigintValue << 8n) | BigInt(bytes[i]);
    }
  }
  
  // Use a prime-based checksum algorithm
  // Use large primes for better distribution
  const prime1 = 1000000007n;
  const prime2 = 1000000009n;
  
  // Calculate checksum using modular arithmetic
  let checksum = 0n;
  let temp = bigintValue;
  let position = 1n;
  
  while (temp > 0n) {
    const digit = temp % 256n;
    checksum = (checksum + (digit * position)) % prime1;
    position = (position * prime2) % prime1;
    temp = temp / 256n;
  }
  
  // Return as string to handle large checksums
  return checksum.toString();
}

// Signal that worker is ready
parentPort!.postMessage({ type: 'ready', workerId });
