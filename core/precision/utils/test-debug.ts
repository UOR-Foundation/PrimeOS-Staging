/**
 * Debug Test for Byte Array Conversion
 * ==================================
 * 
 * This file contains test code to debug the byte array conversion functions.
 */

import { toByteArray, fromByteArray } from './index';

// Test with various values
const testValues = [
  BigInt(0),
  BigInt(1),
  BigInt(255),
  BigInt(256),
  BigInt(65535),
  BigInt(65536),
  BigInt(16777215),
  BigInt(16777216),
  -BigInt(1),
  -BigInt(255),
  -BigInt(256),
  -BigInt(65535),
  -BigInt(65536)
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
