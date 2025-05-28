/**
 * Encoding Module Types
 * ====================
 * 
 * Type definitions for the encoding module implementing Axiom 3:
 * "Unified execution model: Data and operations share a common representation"
 * 
 * Based on the UOR (Universal Object Representation) specification with
 * prime-based chunk encoding using exponent patterns.
 */

import {
  ModelOptions,
  ModelInterface,
  ModelState
} from '../../../os/model/types';

// Import from actual core modules - no fallbacks
import { Factor } from '../../prime/types';
import { PrimeRegistryInterface } from '../../prime/types';
import { IntegrityInterface } from '../../integrity/types';

/**
 * Standard exponent patterns from UOR specification
 */
export enum ChunkExponent {
  DATA_POSITION = 2,    // Position in data stream
  DATA_VALUE = 3,       // Actual data value  
  OPERATION = 4,        // Operation opcode
  OPERAND = 5,          // Operation parameter
  CHECKSUM = 6,         // Integrity checksum (always present)
  BLOCK_HEADER = 7      // Block framing header
}

/**
 * Standard opcodes (matching UOR prototype)
 */
export enum StandardOpcodes {
  OP_PUSH = 2,     // prime[0] - Push value to stack
  OP_ADD = 3,      // prime[1] - Add top two stack values  
  OP_PRINT = 5,    // prime[2] - Print top stack value
  BLOCK_TAG = 7,   // prime[3] - Block container
  NTT_TAG = 11     // prime[4] - NTT spectral transform
}

/**
 * Chunk type classification
 */
export enum ChunkType {
  DATA = 'data',
  OPERATION = 'operation',
  BLOCK_HEADER = 'block_header', 
  NTT_HEADER = 'ntt_header'
}

/**
 * Encoded chunk representation
 */
export interface EncodedChunk {
  id: string;
  type: ChunkType;
  value: bigint;           // The encoded prime representation
  factors: Factor[];      // Prime factorization breakdown
  checksum: bigint;       // Extracted checksum prime
  metadata: ChunkMetadata;
}

/**
 * Chunk metadata
 */
export interface ChunkMetadata {
  size: number;           // Chunk size in bits
  position?: number;      // Position in stream
  timestamp: number;      // Creation timestamp
  verified: boolean;      // Integrity verification status
}

/**
 * Decoded chunk data
 */
export interface DecodedChunk {
  type: ChunkType;
  checksum: bigint;
  data: ChunkData;
}

/**
 * Chunk data contents based on type
 */
export interface ChunkData {
  // Data chunks
  position?: number;
  value?: number;
  
  // Operation chunks
  opcode?: StandardOpcodes;
  operand?: number;
  
  // Block chunks
  blockLength?: number;
  blockType?: StandardOpcodes;
}

/**
 * Program operation definition
 */
export interface ProgramOperation {
  opcode: StandardOpcodes;
  operand?: number;
}

/**
 * NTT configuration options
 */
export interface NTTOptions {
  modulus: bigint;
  primitiveRoot: bigint;
}

/**
 * Configuration options for encoding module
 */
export interface EncodingOptions extends ModelOptions {
  primeRegistry?: PrimeRegistryInterface;
  integrityModule?: IntegrityInterface;
  enableNTT?: boolean;
  nttModulus?: bigint;
  nttPrimitiveRoot?: bigint;
  chunkIdLength?: number;
  enableSpectralTransforms?: boolean;
}

/**
 * Extended state for encoding module
 */
export interface EncodingState extends ModelState {
  config: {
    enableNTT: boolean;
    nttModulus: bigint;
    nttPrimitiveRoot: bigint;
    chunkIdLength: number;
  };
  statistics: {
    chunksEncoded: number;
    chunksDecoded: number;
    programsExecuted: number;
    nttOperations: number;
    integrityFailures: number;
  };
  vm: {
    stackSize: number;
    outputLength: number;
    operations: number;
    programCounter: number;
    memorySize: number;
    halted: boolean;
    executionTime: number;
    instructionsExecuted: number;
  };
}

/**
 * Input for encoding processing operations
 */
export interface EncodingProcessInput {
  operation: 'encodeText' | 'encodeProgram' | 'encodeBlock' | 'decodeChunks' | 
            'executeProgram' | 'applyNTT' | 'verifyIntegrity' | 'encodeData' |
            'encodeOperation' | 'decodeChunk';
  data?: any;
  chunks?: bigint[];
  program?: ProgramOperation[];
  chunk?: bigint;
  position?: number;
  value?: number;
  opcode?: StandardOpcodes;
  operand?: number;
  options?: any;
}

/**
 * Core interface for encoding functionality
 */
export interface EncodingInterface extends ModelInterface {
  // Core encoding methods
  encodeText(text: string): Promise<bigint[]>;
  encodeProgram(operations: ProgramOperation[]): Promise<bigint[]>;
  encodeBlock(chunks: bigint[]): Promise<bigint[]>;
  encodeData(position: number, value: number): Promise<bigint>;
  encodeOperation(opcode: StandardOpcodes, operand?: number): Promise<bigint>;
  
  // Core decoding methods
  decodeChunk(chunk: bigint): Promise<DecodedChunk>;
  decodeText(chunks: bigint[]): Promise<string>;
  
  // VM execution
  executeProgram(chunks: bigint[]): Promise<string[]>;
  
  // NTT spectral operations
  applyNTT(data: number[]): Promise<number[]>;
  applyInverseNTT(data: number[]): Promise<number[]>;
  verifyNTTRoundTrip(data: number[]): Promise<boolean>;
  
  // Integrity operations  
  verifyChunkIntegrity(chunk: bigint): Promise<boolean>;
  
  // Utility methods
  getChunkMetadata(chunk: bigint): Promise<ChunkMetadata>;
  generateChunkId(): string;
  
  getLogger(): any;
  getState(): EncodingState;
}

/**
 * VM execution result
 */
export interface VMExecutionResult {
  output: string[];
  stackSize: number;
  operations: number;
}

/**
 * NTT Transform result
 */
export interface NTTResult {
  forward: number[];
  inverse?: number[];
  verified: boolean;
}

/**
 * Encoding result with metadata
 */
export interface EncodingResult {
  chunks: bigint[];
  metadata: {
    chunkCount: number;
    totalSize: bigint;
    hasIntegrity: boolean;
    hasSpectral: boolean;
  };
}

/**
 * Streaming chunk for large data processing
 */
export interface StreamingChunk {
  data: bigint | Uint8Array;
  position: number;
  final: boolean;
  metadata?: Record<string, any>;
}

/**
 * Streaming options for large number operations
 */
export interface StreamingOptions {
  chunkSize?: number;
  maxConcurrent?: number;
  parallel?: boolean;
  debugLogs?: boolean;
}

/**
 * Stream processor for large number operations
 */
export interface StreamProcessor {
  factorizeStreaming(stream: AsyncIterable<StreamingChunk> | StreamingChunk[]): Promise<Factor[]>;
  transformStreaming(stream: AsyncIterable<StreamingChunk> | StreamingChunk[]): Promise<StreamingChunk[]>;
}

/**
 * VM execution state
 */
export interface VMState {
  stackSize: number;
  outputLength: number;
  operations: number;
  programCounter: number;
  memorySize: number;
  halted: boolean;
  executionTime: number;
  instructionsExecuted: number;
}

/**
 * Window function types for spectral processing
 */
export enum WindowFunction {
  RECTANGULAR = 'rectangular',
  HAMMING = 'hamming',
  BLACKMAN = 'blackman',
  KAISER = 'kaiser',
  CUSTOM = 'custom'
}

/**
 * Spectral processing configuration
 */
export interface SpectralConfig {
  modulus: bigint;
  primitiveRoot: bigint;
  windowSize: number;
  overlapFactor: number;
  precisionBits: number;
}

/**
 * Spectral transform result
 */
export interface SpectralResult {
  forward: number[];
  inverse?: number[];
  verified: boolean;
  windowFunction: WindowFunction;
  quality: number;
}

/**
 * Processing metrics
 */
export interface ProcessingMetrics {
  throughput: number;
  latency: number;
  memoryUsage: number;
  errorRate: number;
  cacheHitRate: number;
}

/**
 * Performance tracking
 */
export interface PerformanceTracker {
  startTime: number;
  operations: number;
  errors: number;
  memoryPeak: number;
}

/**
 * Block composition types
 */
export interface BlockHeader {
  type: StandardOpcodes;
  length: number;
  version: number;
  flags: number;
}

/**
 * NTT block configuration
 */
export interface NTTBlockConfig {
  blockLength: number;
  modulus: bigint;
  primitiveRoot: bigint;
  windowFunction: WindowFunction;
}

/**
 * Chunk validation result
 */
export interface ChunkValidationResult {
  valid: boolean;
  errors: string[];
  metadata: {
    size: number;
    complexity: number;
    verified: boolean;
  };
}

/**
 * Processing context for operations
 */
export interface ProcessingContext {
  primeRegistry?: PrimeRegistryInterface;
  integrityModule?: IntegrityInterface;
  performanceTracker?: PerformanceTracker;
  config: {
    enableLogs: boolean;
    validateInputs: boolean;
    trackPerformance: boolean;
  };
}

/**
 * Batch processing options
 */
export interface BatchProcessingOptions {
  batchSize: number;
  maxConcurrency: number;
  errorTolerance: number;
  progressCallback?: (progress: number) => void;
}

/**
 * Advanced VM execution result
 */
export interface AdvancedVMExecutionResult extends VMExecutionResult {
  executionTime: number;
  memoryUsed: number;
  instructionsExecuted: number;
  errors: string[];
  warnings: string[];
}

/**
 * Transform function type
 */
export type TransformFunction<T, U> = (input: T) => U;
export type AsyncTransformFunction<T, U> = (input: T) => Promise<U>;

/**
 * Filter function type
 */
export type FilterFunction<T> = (input: T) => boolean;

/**
 * Reduce function type
 */
export type ReduceFunction<T, U> = (accumulator: U, current: T) => U;

/**
 * Error types for encoding operations
 */
export class EncodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EncodingError';
  }
}

export class ChunkValidationError extends EncodingError {
  constructor(chunk: bigint, reason: string) {
    super(`Chunk validation failed for ${chunk}: ${reason}`);
    this.name = 'ChunkValidationError';
  }
}

export class VMExecutionError extends EncodingError {
  constructor(operation: string, reason: string) {
    super(`VM execution failed at ${operation}: ${reason}`);
    this.name = 'VMExecutionError';
  }
}

export class NTTError extends EncodingError {
  constructor(operation: string, reason: string) {
    super(`NTT operation failed at ${operation}: ${reason}`);
    this.name = 'NTTError';
  }
}

export class SpectralTransformError extends EncodingError {
  constructor(operation: string, reason: string) {
    super(`Spectral transform failed at ${operation}: ${reason}`);
    this.name = 'SpectralTransformError';
  }
}

export class BlockCompositionError extends EncodingError {
  constructor(operation: string, reason: string) {
    super(`Block composition failed at ${operation}: ${reason}`);
    this.name = 'BlockCompositionError';
  }
}
