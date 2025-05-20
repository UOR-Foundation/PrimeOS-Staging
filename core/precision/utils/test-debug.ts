/**
 * Debug Test for Byte Array Conversion
 * ==================================
 * 
 * This file contains test code to debug the byte array conversion functions.
 */

import { toByteArray, fromByteArray } from './index';

// Test with various values
const testValues = [
  0n,
  1n,
  255n,
  256n,
  65535n,
  65536n,
  16777215n,
  16777216n,
  -1n,
  -255n,
  -256n,
  -65535n,
  -65536n
];

for (const value of testValues) {
  console.log(`\nOriginal value: ${value}`);
  
  // Convert to byte array
  const bytes = toByteArray(value);
  console.log(`Byte array (${bytes.length} bytes):`, Array.from(bytes));
  
  // Convert back to BigInt
  const result = fromByteArray(bytes);
  console.log(`Converted back: ${result}`);
  console.log(`Equal: ${value === result}`);
}
