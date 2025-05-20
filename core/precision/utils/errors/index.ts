/**
 * Error Handling for Mathematical Utilities
 * ======================================
 * 
 * Standardized error creation for mathematical operations.
 */

/**
 * Create an input validation error
 */
export function createValidationError(message: string, value?: any): Error {
  return new Error(`Validation Error: ${message}${value !== undefined ? ` (${value})` : ''}`);
}

/**
 * Create an overflow error
 */
export function createOverflowError(operation: string, value?: any): Error {
  return new Error(`Overflow Error: ${operation}${value !== undefined ? ` (${value})` : ''}`);
}

/**
 * Create a division by zero error
 */
export function createDivisionByZeroError(): Error {
  return new Error('Division by Zero Error: Cannot divide by zero');
}

/**
 * Create a negative input error
 */
export function createNegativeInputError(operation: string, value: any): Error {
  return new Error(`Negative Input Error: ${operation} cannot be performed on negative value (${value})`);
}
