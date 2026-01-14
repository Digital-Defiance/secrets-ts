// Type guard functions and runtime validation for @brightchain/secrets

import type { CSPRNGType, RNGFunction, Shares } from './types';
import { InvalidParameterError } from './errors';

/**
 * Type guard to check if a value is a valid secret string (hex)
 */
export function isValidSecret(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-fA-F]*$/.test(value);
}

/**
 * Type guard to check if a value is a valid shares array
 */
export function isValidShares(value: unknown): value is Shares {
  return Array.isArray(value) && 
         value.length > 0 &&
         value.every(share => typeof share === 'string');
}

/**
 * Type guard to check if a value is a valid RNG function
 */
export function isValidRNGFunction(value: unknown): value is RNGFunction {
  return typeof value === 'function';
}

/**
 * Type guard to check if a value is a valid CSPRNG type
 */
export function isValidCSPRNGType(value: unknown): value is CSPRNGType {
  return typeof value === 'string' && 
         (value === 'nodeCryptoRandomBytes' || 
          value === 'browserCryptoGetRandomValues' || 
          value === 'testRandom');
}

/**
 * Validates that a number is an integer within a specified range
 */
export function validateInteger(
  value: unknown,
  paramName: string,
  min: number,
  max: number
): asserts value is number {
  if (typeof value !== 'number') {
    throw new InvalidParameterError(paramName, value, 'number');
  }
  
  if (value % 1 !== 0) {
    throw new InvalidParameterError(paramName, value, 'integer');
  }
  
  if (value < min || value > max) {
    throw new InvalidParameterError(
      paramName,
      value,
      `integer between ${min} and ${max}, inclusive`
    );
  }
}

/**
 * Validates that a value is a non-empty string
 */
export function validateString(
  value: unknown,
  paramName: string
): asserts value is string {
  if (typeof value !== 'string') {
    throw new InvalidParameterError(paramName, value, 'string');
  }
}

/**
 * Validates that a value is a valid hex string
 */
export function validateHexString(
  value: unknown,
  paramName: string
): asserts value is string {
  validateString(value, paramName);
  
  if (!/^[0-9a-fA-F]*$/.test(value)) {
    throw new InvalidParameterError(
      paramName,
      value,
      'hexadecimal string (0-9, a-f, A-F)'
    );
  }
}

/**
 * Validates that a value is a valid binary string
 */
export function validateBinaryString(
  value: unknown,
  paramName: string
): asserts value is string {
  validateString(value, paramName);
  
  if (!/^[01]*$/.test(value)) {
    throw new InvalidParameterError(
      paramName,
      value,
      'binary string (0 and 1 only)'
    );
  }
}
