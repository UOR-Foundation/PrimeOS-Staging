/**
 * Enhanced Chunk Virtual Machine Implementation
 * ============================================
 * 
 * Extended stack-based virtual machine for executing chunk-encoded programs
 * with comprehensive instruction set and advanced features.
 */

import {
  DecodedChunk,
  ChunkData,
  ChunkType,
  StandardOpcodes,
  VMExecutionError,
  AdvancedVMExecutionResult
} from '../core/types';

/**
 * Extended opcodes for enhanced VM
 */
export enum ExtendedOpcodes {
  // Arithmetic operations
  OP_SUB = 13,      // Subtract top two stack values
  OP_MUL = 17,      // Multiply top two stack values
  OP_DIV = 19,      // Divide top two stack values
  OP_MOD = 23,      // Modulo operation
  OP_POW = 29,      // Power operation
  
  // Stack operations
  OP_DUP = 31,      // Duplicate top stack value
  OP_SWAP = 37,     // Swap top two stack values
  OP_POP = 41,      // Pop top stack value
  OP_CLEAR = 43,    // Clear entire stack
  
  // Comparison operations
  OP_EQ = 47,       // Equal comparison
  OP_NEQ = 53,      // Not equal comparison
  OP_LT = 59,       // Less than comparison
  OP_GT = 61,       // Greater than comparison
  OP_LTE = 67,      // Less than or equal
  OP_GTE = 71,      // Greater than or equal
  
  // Logical operations
  OP_AND = 73,      // Logical AND
  OP_OR = 79,       // Logical OR
  OP_NOT = 83,      // Logical NOT
  OP_XOR = 89,      // Logical XOR
  
  // Control flow
  OP_JMP = 97,      // Unconditional jump
  OP_JIF = 101,     // Jump if true
  OP_CALL = 103,    // Function call
  OP_RET = 107,     // Function return
  
  // Memory operations
  OP_LOAD = 109,    // Load from memory
  OP_STORE = 113,   // Store to memory
  
  // I/O operations
  OP_READ = 127,    // Read input
  OP_WRITE = 131,   // Write output
  
  // Advanced operations
  OP_FACT = 137,    // Factorial
  OP_FIB = 139,     // Fibonacci
  OP_PRIME = 149,   // Check if prime
  OP_SQRT = 151,    // Square root
  
  // Data type operations
  OP_INT = 157,     // Convert to integer
  OP_STR = 163,     // Convert to string
  OP_BOOL = 167,    // Convert to boolean
  
  // Array operations
  OP_ARRAY = 173,   // Create array
  OP_INDEX = 179,   // Array indexing
  OP_LENGTH = 181,  // Array length
  OP_APPEND = 191,  // Append to array
  
  // Special operations
  OP_NOP = 193,     // No operation
  OP_HALT = 197,    // Halt execution
  OP_DEBUG = 199    // Debug output
}

/**
 * VM Memory interface
 */
interface VMMemory {
  [address: number]: any;
}

/**
 * VM Call stack frame
 */
interface CallFrame {
  returnAddress: number;
  locals: any[];
}

/**
 * Enhanced VM with comprehensive instruction set
 */
export class EnhancedChunkVM {
  private stack: any[] = [];
  private memory: VMMemory = {};
  private callStack: CallFrame[] = [];
  private output: string[] = [];
  private input: string[] = [];
  private programCounter = 0;
  private operations = 0;
  private executionTime = 0;
  private memoryUsed = 0;
  private instructionsExecuted = 0;
  private errors: string[] = [];
  private warnings: string[] = [];
  private halted = false;
  private debugMode = false;
  
  constructor(debugMode = false) {
    this.debugMode = debugMode;
  }
  
  reset(): void {
    this.stack = [];
    this.memory = {};
    this.callStack = [];
    this.output = [];
    this.input = [];
    this.programCounter = 0;
    this.operations = 0;
    this.executionTime = 0;
    this.memoryUsed = 0;
    this.instructionsExecuted = 0;
    this.errors = [];
    this.warnings = [];
    this.halted = false;
  }
  
  /**
   * Set input for the VM
   */
  setInput(input: string[]): void {
    this.input = [...input];
  }
  
  /**
   * Execute program with enhanced features
   */
  execute(chunks: DecodedChunk[]): string[] {
    const startTime = performance.now();
    this.reset();
    
    // Convert chunks to instructions
    const instructions = this.chunksToInstructions(chunks);
    
    try {
      while (this.programCounter < instructions.length && !this.halted) {
        this.executeInstruction(instructions[this.programCounter]);
        this.programCounter++;
        this.instructionsExecuted++;
        
        // Safety check to prevent infinite loops
        if (this.instructionsExecuted > 1000000) {
          throw new VMExecutionError('SAFETY', 'Maximum instruction limit exceeded');
        }
      }
    } catch (error) {
      if (error instanceof VMExecutionError) {
        this.errors.push(error.message);
        throw error;
      }
      this.errors.push(error instanceof Error ? error.message : 'Unknown error');
      throw new VMExecutionError('RUNTIME', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.executionTime = performance.now() - startTime;
      this.memoryUsed = this.calculateMemoryUsage();
    }
    
    return [...this.output];
  }
  
  /**
   * Convert chunks to executable instructions
   */
  private chunksToInstructions(chunks: DecodedChunk[]): any[] {
    const instructions: any[] = [];
    
    for (const chunk of chunks) {
      switch (chunk.type) {
        case ChunkType.OPERATION:
          instructions.push({
            type: 'operation',
            opcode: chunk.data.opcode,
            operand: chunk.data.operand
          });
          break;
          
        case ChunkType.DATA:
          instructions.push({
            type: 'data',
            position: chunk.data.position,
            value: chunk.data.value
          });
          break;
          
        case ChunkType.BLOCK_HEADER:
          instructions.push({
            type: 'block',
            blockType: chunk.data.blockType,
            blockLength: chunk.data.blockLength
          });
          break;
          
        default:
          // Skip unknown chunk types
          break;
      }
    }
    
    return instructions;
  }
  
  /**
   * Execute a single instruction
   */
  private executeInstruction(instruction: any): void {
    this.operations++;
    
    if (this.debugMode) {
      this.output.push(`DEBUG: PC=${this.programCounter}, OP=${instruction.type}, STACK=[${this.stack.join(',')}]`);
    }
    
    switch (instruction.type) {
      case 'operation':
        this.executeOperation(instruction.opcode, instruction.operand);
        break;
        
      case 'data':
        this.executeData(instruction.value);
        break;
        
      case 'block':
        this.executeBlock(instruction.blockType, instruction.blockLength);
        break;
        
      default:
        this.warnings.push(`Unknown instruction type: ${instruction.type}`);
        break;
    }
  }
  
  /**
   * Execute operation with extended instruction set
   */
  private executeOperation(opcode: number, operand?: number): void {
    switch (opcode) {
      // Basic operations
      case StandardOpcodes.OP_PUSH:
        if (operand === undefined) {
          throw new VMExecutionError('PUSH', 'Missing operand for PUSH operation');
        }
        this.stack.push(operand);
        break;
        
      case StandardOpcodes.OP_ADD:
        this.binaryOperation((a, b) => a + b, 'ADD');
        break;
        
      case StandardOpcodes.OP_PRINT:
        if (this.stack.length < 1) {
          throw new VMExecutionError('PRINT', 'Stack underflow: PRINT requires 1 operand');
        }
        this.output.push(this.stack.pop()!.toString());
        break;
        
      // Extended arithmetic operations
      case ExtendedOpcodes.OP_SUB:
        this.binaryOperation((a, b) => a - b, 'SUB');
        break;
        
      case ExtendedOpcodes.OP_MUL:
        this.binaryOperation((a, b) => a * b, 'MUL');
        break;
        
      case ExtendedOpcodes.OP_DIV:
        this.binaryOperation((a, b) => {
          if (b === 0) throw new VMExecutionError('DIV', 'Division by zero');
          return Math.floor(a / b);
        }, 'DIV');
        break;
        
      case ExtendedOpcodes.OP_MOD:
        this.binaryOperation((a, b) => {
          if (b === 0) throw new VMExecutionError('MOD', 'Modulo by zero');
          return a % b;
        }, 'MOD');
        break;
        
      case ExtendedOpcodes.OP_POW:
        this.binaryOperation((a, b) => Math.pow(a, b), 'POW');
        break;
        
      // Stack operations
      case ExtendedOpcodes.OP_DUP:
        if (this.stack.length < 1) {
          throw new VMExecutionError('DUP', 'Stack underflow: DUP requires 1 operand');
        }
        this.stack.push(this.stack[this.stack.length - 1]);
        break;
        
      case ExtendedOpcodes.OP_SWAP:
        if (this.stack.length < 2) {
          throw new VMExecutionError('SWAP', 'Stack underflow: SWAP requires 2 operands');
        }
        const a = this.stack.pop()!;
        const b = this.stack.pop()!;
        this.stack.push(a);
        this.stack.push(b);
        break;
        
      case ExtendedOpcodes.OP_POP:
        if (this.stack.length < 1) {
          throw new VMExecutionError('POP', 'Stack underflow: POP requires 1 operand');
        }
        this.stack.pop();
        break;
        
      case ExtendedOpcodes.OP_CLEAR:
        this.stack = [];
        break;
        
      // Comparison operations
      case ExtendedOpcodes.OP_EQ:
        this.binaryOperation((a, b) => a === b ? 1 : 0, 'EQ');
        break;
        
      case ExtendedOpcodes.OP_NEQ:
        this.binaryOperation((a, b) => a !== b ? 1 : 0, 'NEQ');
        break;
        
      case ExtendedOpcodes.OP_LT:
        this.binaryOperation((a, b) => a < b ? 1 : 0, 'LT');
        break;
        
      case ExtendedOpcodes.OP_GT:
        this.binaryOperation((a, b) => a > b ? 1 : 0, 'GT');
        break;
        
      case ExtendedOpcodes.OP_LTE:
        this.binaryOperation((a, b) => a <= b ? 1 : 0, 'LTE');
        break;
        
      case ExtendedOpcodes.OP_GTE:
        this.binaryOperation((a, b) => a >= b ? 1 : 0, 'GTE');
        break;
        
      // Logical operations
      case ExtendedOpcodes.OP_AND:
        this.binaryOperation((a, b) => (a && b) ? 1 : 0, 'AND');
        break;
        
      case ExtendedOpcodes.OP_OR:
        this.binaryOperation((a, b) => (a || b) ? 1 : 0, 'OR');
        break;
        
      case ExtendedOpcodes.OP_NOT:
        this.unaryOperation(a => a ? 0 : 1, 'NOT');
        break;
        
      case ExtendedOpcodes.OP_XOR:
        this.binaryOperation((a, b) => (a ? 1 : 0) ^ (b ? 1 : 0), 'XOR');
        break;
        
      // Control flow
      case ExtendedOpcodes.OP_JMP:
        if (operand !== undefined) {
          this.programCounter = operand - 1; // -1 because it will be incremented
        }
        break;
        
      case ExtendedOpcodes.OP_JIF:
        if (this.stack.length < 1) {
          throw new VMExecutionError('JIF', 'Stack underflow: JIF requires 1 operand');
        }
        const condition = this.stack.pop()!;
        if (condition && operand !== undefined) {
          this.programCounter = operand - 1;
        }
        break;
        
      // Memory operations
      case ExtendedOpcodes.OP_LOAD:
        if (operand !== undefined) {
          this.stack.push(this.memory[operand] || 0);
        }
        break;
        
      case ExtendedOpcodes.OP_STORE:
        if (this.stack.length < 1 || operand === undefined) {
          throw new VMExecutionError('STORE', 'STORE requires stack value and memory address');
        }
        this.memory[operand] = this.stack.pop()!;
        break;
        
      // I/O operations
      case ExtendedOpcodes.OP_READ:
        if (this.input.length > 0) {
          this.stack.push(this.input.shift()!);
        } else {
          this.stack.push(0); // Default value when no input
        }
        break;
        
      case ExtendedOpcodes.OP_WRITE:
        if (this.stack.length < 1) {
          throw new VMExecutionError('WRITE', 'Stack underflow: WRITE requires 1 operand');
        }
        this.output.push(this.stack.pop()!.toString());
        break;
        
      // Advanced operations
      case ExtendedOpcodes.OP_FACT:
        this.unaryOperation(n => {
          if (n < 0) throw new VMExecutionError('FACT', 'Factorial of negative number');
          let result = 1;
          for (let i = 1; i <= n; i++) result *= i;
          return result;
        }, 'FACT');
        break;
        
      case ExtendedOpcodes.OP_FIB:
        this.unaryOperation(n => {
          if (n < 0) throw new VMExecutionError('FIB', 'Fibonacci of negative number');
          if (n <= 1) return n;
          let a = 0, b = 1;
          for (let i = 2; i <= n; i++) {
            [a, b] = [b, a + b];
          }
          return b;
        }, 'FIB');
        break;
        
      case ExtendedOpcodes.OP_SQRT:
        this.unaryOperation(n => {
          if (n < 0) throw new VMExecutionError('SQRT', 'Square root of negative number');
          return Math.floor(Math.sqrt(n));
        }, 'SQRT');
        break;
        
      // Special operations
      case ExtendedOpcodes.OP_NOP:
        // No operation
        break;
        
      case ExtendedOpcodes.OP_HALT:
        this.halted = true;
        break;
        
      case ExtendedOpcodes.OP_DEBUG:
        this.output.push(`DEBUG: Stack=[${this.stack.join(',')}], Memory=${JSON.stringify(this.memory)}`);
        break;
        
      default:
        throw new VMExecutionError('UNKNOWN', `Unknown opcode: ${opcode}`);
    }
  }
  
  /**
   * Execute data instruction
   */
  private executeData(value?: number): void {
    if (value !== undefined) {
      this.output.push(String.fromCharCode(value));
    }
  }
  
  /**
   * Execute block instruction
   */
  private executeBlock(blockType?: number, blockLength?: number): void {
    // Block headers are primarily metadata
    if (this.debugMode) {
      this.output.push(`BLOCK: type=${blockType}, length=${blockLength}`);
    }
  }
  
  /**
   * Helper for binary operations
   */
  private binaryOperation(op: (a: any, b: any) => any, name: string): void {
    if (this.stack.length < 2) {
      throw new VMExecutionError(name, `Stack underflow: ${name} requires 2 operands`);
    }
    const b = this.stack.pop()!;
    const a = this.stack.pop()!;
    this.stack.push(op(a, b));
  }
  
  /**
   * Helper for unary operations
   */
  private unaryOperation(op: (a: any) => any, name: string): void {
    if (this.stack.length < 1) {
      throw new VMExecutionError(name, `Stack underflow: ${name} requires 1 operand`);
    }
    const a = this.stack.pop()!;
    this.stack.push(op(a));
  }
  
  /**
   * Calculate current memory usage
   */
  private calculateMemoryUsage(): number {
    return JSON.stringify({
      stack: this.stack,
      memory: this.memory,
      callStack: this.callStack
    }).length;
  }
  
  /**
   * Get enhanced execution result
   */
  getAdvancedResult(): AdvancedVMExecutionResult {
    return {
      output: [...this.output],
      stackSize: this.stack.length,
      operations: this.operations,
      executionTime: this.executionTime,
      memoryUsed: this.memoryUsed,
      instructionsExecuted: this.instructionsExecuted,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }
  
  /**
   * Get current VM state
   */
  getState() {
    return {
      stackSize: this.stack.length,
      outputLength: this.output.length,
      operations: this.operations,
      programCounter: this.programCounter,
      memorySize: Object.keys(this.memory).length,
      halted: this.halted,
      executionTime: this.executionTime,
      instructionsExecuted: this.instructionsExecuted
    };
  }
}
