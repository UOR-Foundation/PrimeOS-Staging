/**
 * MathUtils Wrapper Class
 * ======================
 * 
 * Wrapper class that provides a convenient interface to the core utility functions.
 * This file contains the MathUtils class and default instance creation.
 */

import { 
  MathUtilsInterface,
  BitLengthFunction,
  ExactEqualsFunction,
  GcdFunction,
  LcmFunction,
  ExtendedGcdFunction,
  IntegerSqrtFunction,
  CeilDivFunction,
  FloorDivFunction,
  CountSetBitsFunction,
  LeadingZerosFunction,
  TrailingZerosFunction
} from './types';

import { createMathUtils } from './core-functions';

/**
 * Default utility instance with standard options
 */
export class MathUtils implements MathUtilsInterface {
  private utils: MathUtilsInterface;
  bitLength: BitLengthFunction;
  exactlyEquals: ExactEqualsFunction;
  toByteArray: (value: bigint | number) => Uint8Array;
  fromByteArray: (bytes: Uint8Array) => bigint;
  isSafeInteger: (value: bigint | number) => boolean;
  sign: (value: bigint | number) => number;
  abs: (value: bigint | number) => bigint | number;
  isPowerOfTwo: (value: bigint | number) => boolean;
  
  // New functions
  gcd: GcdFunction;
  lcm: LcmFunction;
  extendedGcd: ExtendedGcdFunction;
  integerSqrt: IntegerSqrtFunction;
  ceilDiv: CeilDivFunction;
  floorDiv: FloorDivFunction;
  countSetBits: CountSetBitsFunction;
  leadingZeros: LeadingZerosFunction;
  trailingZeros: TrailingZerosFunction;
  
  constructor() {
    // First initialize the utils property
    this.utils = createMathUtils();
    
    // Then assign the method properties
    this.bitLength = this.utils.bitLength;
    this.exactlyEquals = this.utils.exactlyEquals;
    this.toByteArray = this.utils.toByteArray;
    this.fromByteArray = this.utils.fromByteArray;
    this.isSafeInteger = this.utils.isSafeInteger;
    this.sign = this.utils.sign;
    this.abs = this.utils.abs;
    this.isPowerOfTwo = this.utils.isPowerOfTwo;
    
    // Assign new methods
    this.gcd = this.utils.gcd;
    this.lcm = this.utils.lcm;
    this.extendedGcd = this.utils.extendedGcd;
    this.integerSqrt = this.utils.integerSqrt;
    this.ceilDiv = this.utils.ceilDiv;
    this.floorDiv = this.utils.floorDiv;
    this.countSetBits = this.utils.countSetBits;
    this.leadingZeros = this.utils.leadingZeros;
    this.trailingZeros = this.utils.trailingZeros;
  }
}

// Create and export a default instance
const defaultUtils = new MathUtils();

// Export individual functions from the default instance
export const {
  bitLength,
  exactlyEquals,
  toByteArray,
  fromByteArray,
  isSafeInteger,
  sign,
  abs,
  isPowerOfTwo,
  gcd,
  lcm,
  extendedGcd,
  integerSqrt,
  ceilDiv,
  floorDiv,
  countSetBits,
  leadingZeros,
  trailingZeros
} = defaultUtils;
