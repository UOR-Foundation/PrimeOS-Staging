/**
 * VM Module Types
 * ==============
 * 
 * Type definitions for the virtual machine component
 * of the encoding module.
 */

import { StandardOpcodes } from '../core/types';

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
 * VM execution result
 */
export interface VMExecutionResult {
  output: string[];
  stackSize: number;
  operations: number;
}

/**
 * VM instruction definition
 */
export interface VMInstruction {
  opcode: StandardOpcodes;
  operand?: number;
}

/**
 * VM error class
 */
export class VMError extends Error {
  constructor(operation: string, reason: string) {
    super(`VM error at ${operation}: ${reason}`);
    this.name = 'VMError';
  }
}

/**
 * VM execution context
 */
export interface VMContext {
  maxStackSize?: number;
  maxInstructions?: number;
  enableDebugging?: boolean;
}
