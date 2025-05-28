/**
 * Chunk Virtual Machine Implementation
 * ===================================
 * 
 * Stack-based virtual machine for executing chunk-encoded programs
 * with proper error handling and operation tracking.
 */

import {
  DecodedChunk,
  ChunkData,
  ChunkType,
  StandardOpcodes,
  VMExecutionError
} from '../core/types';

/**
 * Enhanced VM for executing chunk-encoded programs with proper error handling
 */
export class ChunkVM {
  private stack: number[] = [];
  private output: string[] = [];
  private operations = 0;
  
  reset(): void {
    this.stack = [];
    this.output = [];
    this.operations = 0;
  }
  
  execute(chunks: DecodedChunk[]): string[] {
    this.reset();
    
    for (const chunk of chunks) {
      this.operations++;
      
      try {
        switch (chunk.type) {
          case ChunkType.OPERATION:
            this.executeOperation(chunk.data);
            break;
            
          case ChunkType.DATA:
            this.executeData(chunk.data);
            break;
            
          case ChunkType.BLOCK_HEADER:
            // Block headers are metadata, skip execution
            break;
            
          default:
            // Unknown chunk types are skipped
            break;
        }
      } catch (error) {
        if (error instanceof VMExecutionError) {
          throw error;
        }
        // Convert other errors to VM execution errors
        throw new VMExecutionError(
          chunk.type,
          error instanceof Error ? error.message : 'Unknown execution error'
        );
      }
    }
    
    return [...this.output];
  }
  
  private executeOperation(data: ChunkData): void {
    if (!data.opcode) {
      throw new VMExecutionError('UNKNOWN', 'Missing opcode in operation chunk');
    }
    
    switch (data.opcode) {
      case StandardOpcodes.OP_PUSH:
        if (data.operand === undefined) {
          throw new VMExecutionError('PUSH', 'Missing operand for PUSH operation');
        }
        this.stack.push(data.operand);
        break;
        
      case StandardOpcodes.OP_ADD:
        if (this.stack.length < 2) {
          throw new VMExecutionError('ADD', 'Stack underflow: ADD requires 2 operands');
        }
        const b = this.stack.pop()!;
        const a = this.stack.pop()!;
        this.stack.push(a + b);
        break;
        
      case StandardOpcodes.OP_PRINT:
        if (this.stack.length < 1) {
          throw new VMExecutionError('PRINT', 'Stack underflow: PRINT requires 1 operand');
        }
        this.output.push(this.stack.pop()!.toString());
        break;
        
      default:
        throw new VMExecutionError('UNKNOWN', `Unknown opcode: ${data.opcode}`);
    }
  }
  
  private executeData(data: ChunkData): void {
    if (data.value !== undefined) {
      this.output.push(String.fromCharCode(data.value));
    }
  }
  
  getState() {
    return {
      stackSize: this.stack.length,
      outputLength: this.output.length,
      operations: this.operations
    };
  }
}
