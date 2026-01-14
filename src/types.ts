// Enhanced Type Definitions for @brightchain/secrets
// This file provides comprehensive type safety for the Shamir's Secret Sharing library

// ============================================================================
// Public API Types
// ============================================================================

/**
 * Configuration object returned by getConfig()
 */
export interface SecretsConfig {
  readonly radix: number;
  readonly bits: number;
  readonly maxShares: number;
  readonly hasCSPRNG: boolean;
  readonly typeCSPRNG: CSPRNGType;
}

/**
 * Components extracted from a public share string
 */
export interface ShareComponents {
  readonly bits: number;
  readonly id: number;
  readonly data: string;
}

/**
 * Valid CSPRNG (Cryptographically Secure Pseudo-Random Number Generator) types
 */
export type CSPRNGType = 
  | "nodeCryptoRandomBytes"
  | "browserCryptoGetRandomValues" 
  | "testRandom";

/**
 * Array of share strings
 */
export type Shares = readonly string[];

/**
 * Internal share representation with x and y coordinates
 */
export interface Share {
  readonly x: number;
  readonly y: number;
}

/**
 * Random number generator function signature
 * @param bits - Number of random bits to generate
 * @returns Binary string of specified length
 */
export type RNGFunction = (bits: number) => string;

// ============================================================================
// Environment-Specific Types
// ============================================================================

/**
 * Node.js crypto module interface
 */
export interface NodeCrypto {
  randomBytes(size: number): Buffer;
}

/**
 * Browser Web Crypto API interface
 */
export interface BrowserCrypto {
  getRandomValues<T extends ArrayBufferView>(array: T): T;
}

/**
 * Discriminated union for crypto environment detection
 */
export type CryptoEnvironment = 
  | {
      readonly type: 'node';
      readonly crypto: NodeCrypto;
    }
  | {
      readonly type: 'browser';
      readonly crypto: BrowserCrypto;
    }
  | {
      readonly type: 'test';
      readonly crypto: null;
    };

// ============================================================================
// Internal Configuration Types
// ============================================================================

/**
 * Internal configuration state (mutable during initialization)
 */
export interface InternalConfig {
  radix: number;
  bits: number;
  size: number;
  maxShares: number;
  logs: readonly number[];
  exps: readonly number[];
  rng: RNGFunction;
  typeCSPRNG: CSPRNGType;
}

/**
 * Default configuration values
 */
export interface Defaults {
  readonly bits: number;
  readonly radix: number;
  readonly minBits: number;
  readonly maxBits: number;
  readonly bytesPerChar: number;
  readonly maxBytesPerChar: number;
  readonly primitivePolynomials: readonly (number | null)[];
}

// ============================================================================
// Type Guards
// ============================================================================

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

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Represents a binary string (string of '0' and '1' characters)
 */
export type BinaryString = string;

/**
 * Represents a hexadecimal string (string of '0-9' and 'a-f' characters)
 */
export type HexString = string;

/**
 * Represents a base-36 string (string of '0-9' and 'a-z' characters)
 */
export type Base36String = string;
