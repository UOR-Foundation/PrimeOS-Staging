/**
 * Modular Arithmetic Error Handling
 * ===============================
 * 
 * Standardized error handling for modular arithmetic operations.
 */

/**
 * Base error class for modular arithmetic operations
 */
export class ModularError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModularError';
  }
}

/**
 * Error thrown when an operation exceeds the maximum supported bit size
 */
export class BitSizeError extends ModularError {
  constructor(operation: string, maxBits: number, actualBits: number) {
    super(
      `Operation exceeds maximum supported bit size (${maxBits}): ` +
      `${operation} with ${actualBits} bits`
    );
    this.name = 'BitSizeError';
  }
}

/**
 * Error thrown when division by zero is attempted
 */
export class DivisionByZeroError extends ModularError {
  constructor(operation: string) {
    super(`Division by zero in ${operation}`);
    this.name = 'DivisionByZeroError';
  }
}

/**
 * Error thrown when a modular inverse does not exist
 */
export class NoInverseError extends ModularError {
  constructor(a: bigint | number, m: bigint | number, gcd: bigint) {
    super(
      `Modular inverse of ${a} mod ${m} does not exist because gcd(${a}, ${m}) = ${gcd} ≠ 1. ` +
      `A modular inverse exists only when the numbers are coprime (gcd = 1).`
    );
    this.name = 'NoInverseError';
  }
}

/**
 * Error thrown when an operation is not supported
 */
export class UnsupportedOperationError extends ModularError {
  constructor(operation: string, reason: string) {
    super(`Unsupported operation: ${operation}. Reason: ${reason}`);
    this.name = 'UnsupportedOperationError';
  }
}

/**
 * Error thrown when an operation would cause overflow
 */
export class OverflowError extends ModularError {
  constructor(operation: string, suggestion?: string) {
    const message = `Operation would cause overflow: ${operation}` + 
                   (suggestion ? `. ${suggestion}` : '');
    super(message);
    this.name = 'OverflowError';
  }
}

/**
 * Create a division by zero error
 */
export function createDivisionByZeroError(operation: string): DivisionByZeroError {
  return new DivisionByZeroError(operation);
}

/**
 * Create a bit size error
 */
export function createBitSizeError(
  operation: string,
  maxBits: number,
  actualBits: number
): BitSizeError {
  return new BitSizeError(operation, maxBits, actualBits);
}

/**
 * Create a no inverse error
 */
export function createNoInverseError(
  a: bigint | number,
  m: bigint | number,
  gcd: bigint
): NoInverseError {
  return new NoInverseError(a, m, gcd);
}

/**
 * Create an unsupported operation error
 */
export function createUnsupportedOperationError(
  operation: string,
  reason: string
): UnsupportedOperationError {
  return new UnsupportedOperationError(operation, reason);
}

/**
 * Create an overflow error
 */
export function createOverflowError(
  operation: string,
  suggestion?: string
): OverflowError {
  return new OverflowError(operation, suggestion);
}
