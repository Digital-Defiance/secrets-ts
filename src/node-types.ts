// Node.js-specific type definitions and error handling
// Provides enhanced typing for Node.js crypto APIs and environment-specific behavior

import type { RNGFunction, CSPRNGType } from './types';
import { CryptoError } from './errors';

// ============================================================================
// Node.js Crypto API Types
// ============================================================================

/**
 * Enhanced Node.js crypto module interface with comprehensive typing
 */
export interface NodeCryptoModule {
  /**
   * Generates cryptographically strong pseudo-random data
   * @param size - Number of bytes to generate
   * @returns Buffer containing random bytes
   * @throws {Error} If random data generation fails
   */
  randomBytes(size: number): Buffer;
  
  /**
   * Synchronous version of randomBytes
   * @param size - Number of bytes to generate
   * @returns Buffer containing random bytes
   * @throws {Error} If random data generation fails
   */
  randomBytesSync?(size: number): Buffer;
}

/**
 * Node.js Buffer type guard
 */
export function isNodeBuffer(value: unknown): value is Buffer {
  return value !== null &&
         typeof value === 'object' &&
         'length' in value &&
         typeof (value as any).readUInt8 === 'function';
}

// ============================================================================
// Node.js Environment Detection
// ============================================================================

/**
 * Detects if the current environment is Node.js
 * @returns true if running in Node.js, false otherwise
 */
export function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' &&
         process.versions != null &&
         process.versions.node != null;
}

/**
 * Attempts to load the Node.js crypto module
 * @returns NodeCryptoModule if available, null otherwise
 */
export function getNodeCrypto(): NodeCryptoModule | null {
  if (!isNodeEnvironment()) {
    return null;
  }
  
  try {
    // Dynamic require to avoid bundler issues
    const crypto = require('crypto');
    
    if (typeof crypto === 'object' && typeof crypto.randomBytes === 'function') {
      return crypto as NodeCryptoModule;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Checks if Node.js crypto.randomBytes is available
 * @returns true if crypto.randomBytes is available
 */
export function hasNodeCryptoRandomBytes(): boolean {
  const crypto = getNodeCrypto();
  return crypto !== null && typeof crypto.randomBytes === 'function';
}

// ============================================================================
// Node.js-Specific Error Types
// ============================================================================

/**
 * Error thrown when Node.js crypto operations fail
 */
export class NodeCryptoError extends CryptoError {
  constructor(operation: string, reason: string, public readonly originalError?: Error) {
    super(operation, `Node.js crypto error: ${reason}`);
    this.name = 'NodeCryptoError';
    
    if (originalError && Error.captureStackTrace) {
      Error.captureStackTrace(this, NodeCryptoError);
    }
  }
}

/**
 * Error thrown when Node.js environment is required but not available
 */
export class NodeEnvironmentError extends CryptoError {
  constructor(feature: string) {
    super(
      'environment_check',
      `Feature '${feature}' requires Node.js environment but is not available`
    );
    this.name = 'NodeEnvironmentError';
  }
}

// ============================================================================
// Node.js RNG Implementation
// ============================================================================

/**
 * Creates a Node.js-specific RNG function using crypto.randomBytes
 * @param crypto - Node.js crypto module
 * @returns RNG function that generates random binary strings
 * @throws {NodeCryptoError} If random byte generation fails
 */
export function createNodeRNG(crypto: NodeCryptoModule): RNGFunction {
  return function nodeCryptoRandomBytes(bits: number): string {
    if (typeof bits !== 'number' || bits <= 0 || bits % 1 !== 0) {
      throw new NodeCryptoError(
        'randomBytes',
        `Invalid bits parameter: ${bits}. Must be a positive integer.`
      );
    }
    
    const bytes = Math.ceil(bits / 8);
    
    try {
      const buffer = crypto.randomBytes(bytes);
      
      // Convert buffer to hex string
      let hex = '';
      for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i].toString(16);
        hex += byte.length === 1 ? '0' + byte : byte;
      }
      
      // Convert hex to binary
      let binary = '';
      for (let i = 0; i < hex.length; i++) {
        const num = parseInt(hex[i], 16);
        const bin = num.toString(2);
        binary += '0000'.substring(bin.length) + bin;
      }
      
      // Return exactly the requested number of bits
      return binary.substring(0, bits);
      
    } catch (error) {
      throw new NodeCryptoError(
        'randomBytes',
        'Failed to generate random bytes',
        error as Error
      );
    }
  };
}

/**
 * Node.js-specific crypto environment descriptor
 */
export interface NodeCryptoEnvironment {
  readonly type: 'node';
  readonly crypto: NodeCryptoModule;
  readonly rngType: CSPRNGType;
  readonly rng: RNGFunction;
}

/**
 * Creates a Node.js crypto environment descriptor
 * @returns NodeCryptoEnvironment if Node.js crypto is available, null otherwise
 */
export function createNodeCryptoEnvironment(): NodeCryptoEnvironment | null {
  const crypto = getNodeCrypto();
  
  if (!crypto) {
    return null;
  }
  
  return {
    type: 'node',
    crypto,
    rngType: 'nodeCryptoRandomBytes',
    rng: createNodeRNG(crypto)
  };
}

// ============================================================================
// Type Validation for Node.js
// ============================================================================

/**
 * Validates that a value is a valid Node.js Buffer
 * @param value - Value to validate
 * @param paramName - Parameter name for error messages
 * @throws {NodeCryptoError} If value is not a valid Buffer
 */
export function validateNodeBuffer(value: unknown, paramName: string): asserts value is Buffer {
  if (!isNodeBuffer(value)) {
    throw new NodeCryptoError(
      'validation',
      `Parameter '${paramName}' must be a Node.js Buffer`
    );
  }
}

/**
 * Validates that Node.js crypto is available
 * @throws {NodeEnvironmentError} If Node.js crypto is not available
 */
export function requireNodeCrypto(): NodeCryptoModule {
  const crypto = getNodeCrypto();
  
  if (!crypto) {
    throw new NodeEnvironmentError('crypto.randomBytes');
  }
  
  return crypto;
}
