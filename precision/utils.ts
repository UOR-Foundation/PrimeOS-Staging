/**
 * Precision Module - Utility Functions
 * ==================================
 *
 * Mathematical utility functions for the precision module, providing common
 * operations needed across the implementation.
 */

/**
 * Check if a value is a safe integer that can be represented as a Number
 * without precision loss
 */
export function isSafeInteger(value: bigint | number): boolean {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value);
  } else {
    return value >= BigInt(Number.MIN_SAFE_INTEGER) &&
           value <= BigInt(Number.MAX_SAFE_INTEGER);
  }
}

/**
 * Calculate the number of bits needed to represent a value
 */
export function bitLength(value: bigint | number): number {
  if (typeof value === 'number') {
    if (value === 0) return 1;
    return Math.floor(Math.log2(Math.abs(value))) + 1;
  } else {
    if (value === 0n) return 1;
    value = value < 0n ? -value : value;
    return value.toString(2).length;
  }
}

/**
 * Check if two values are exactly equal
 */
export function exactlyEquals(a: bigint | number, b: bigint | number): boolean {
  if (typeof a === typeof b) {
    return a === b;
  }

  try {
    if (typeof a === 'number') {
      if (!Number.isInteger(a)) return false;
      return BigInt(a) === b;
    } else {
      if (!Number.isInteger(b)) return false;
      return a === BigInt(b);
    }
  } catch {
    return false;
  }
}

/**
 * Convert a number to a byte array (little-endian)
 */
export function toByteArray(value: bigint | number): Uint8Array {
  if (typeof value === 'number') {
    value = BigInt(Math.floor(value));
  }

  if (value === 0n) {
    return new Uint8Array(1);
  }

  const byteCount = Math.ceil(bitLength(value) / 8);
  const bytes = new Uint8Array(byteCount);

  let remaining = value < 0n ? -value : value;
  for (let i = 0; i < byteCount; i++) {
    bytes[i] = Number(remaining & 0xFFn);
    remaining >>= 8n;
  }

  // Add sign bit if negative
  if (value < 0n) {
    bytes[byteCount - 1] |= 0x80;
  }

  return bytes;
}

/**
 * Convert a byte array to a number (little-endian)
 */
export function fromByteArray(bytes: Uint8Array): bigint {
  if (bytes.length === 0) {
    return 0n;
  }

  // Check if negative
  const isNegative = (bytes[bytes.length - 1] & 0x80) !== 0;

  // Create a copy to avoid modifying the original
  const bytesCopy = new Uint8Array(bytes);

  // Clear the sign bit
  if (isNegative) {
    bytesCopy[bytes.length - 1] &= 0x7F;
  }

  // Convert to BigInt
  let result = 0n;
  for (let i = bytesCopy.length - 1; i >= 0; i--) {
    result = (result << 8n) | BigInt(bytesCopy[i]);
  }

  return isNegative ? -result : result;
}

/**
 * Get the sign of a number
 */
export function sign(value: bigint | number): number {
  if (typeof value === 'number') {
    return Math.sign(value);
  } else {
    if (value > 0n) return 1;
    if (value < 0n) return -1;
    return 0;
  }
}

/**
 * Absolute value function that works for both number and bigint
 */
export function abs(value: bigint | number): bigint | number {
  if (typeof value === 'number') {
    return Math.abs(value);
  } else {
    return value < 0n ? -value : value;
  }
}

/**
 * Convert between bigint and number safely when possible
 */
export function toNumber(value: bigint): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new Error(`Cannot safely convert ${value} to Number (exceeds safe integer range)`);
  }
  return Number(value);
}

/**
 * Check if a number is a power of 2
 */
export function isPowerOfTwo(value: bigint | number): boolean {
  if (typeof value === 'number') {
    return value > 0 && (value & (value - 1)) === 0;
  } else {
    return value > 0n && (value & (value - 1n)) === 0n;
  }
}
