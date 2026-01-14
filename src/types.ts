// Enhanced Type Definitions for @digitaldefiance/secrets
// This file provides comprehensive type safety for the Shamir's Secret Sharing library

/**
 * @packageDocumentation
 * Type definitions for @digitaldefiance/secrets - Shamir's Secret Sharing library
 * 
 * This library implements Shamir's threshold secret sharing scheme with
 * comprehensive TypeScript type safety. It allows splitting a secret into
 * multiple shares such that a threshold number of shares can reconstruct
 * the original secret, but fewer shares reveal no information.
 * 
 * @example
 * ```typescript
 * import secrets from '@digitaldefiance/secrets';
 * 
 * // Split a secret into 5 shares, requiring 3 to reconstruct
 * const shares = secrets.share('deadbeef', 5, 3);
 * 
 * // Reconstruct from any 3 shares
 * const recovered = secrets.combine([shares[0], shares[2], shares[4]]);
 * ```
 */

// ============================================================================
// Public API Types
// ============================================================================

/**
 * Configuration object returned by getConfig()
 * 
 * Provides information about the current Galois Field configuration
 * and random number generator status.
 * 
 * @property radix - The numerical base used for share representation (typically 16 for hex)
 * @property bits - Number of bits in the Galois Field (determines max shares = 2^bits - 1)
 * @property maxShares - Maximum number of shares that can be generated (2^bits - 1)
 * @property hasCSPRNG - Whether a cryptographically secure RNG is configured
 * @property typeCSPRNG - The type of CSPRNG currently in use
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
 * 
 * A share string encodes the bit configuration, share ID, and share data
 * in a compact format. This interface represents the parsed components.
 * 
 * @property bits - Number of bits used in the Galois Field for this share
 * @property id - Unique identifier for this share (1 to 2^bits - 1)
 * @property data - The actual share data as a hexadecimal string
 */
export interface ShareComponents {
  readonly bits: number;
  readonly id: number;
  readonly data: string;
}

/**
 * Valid CSPRNG (Cryptographically Secure Pseudo-Random Number Generator) types
 * 
 * The library supports multiple CSPRNGs depending on the runtime environment:
 * - `nodeCryptoRandomBytes`: Node.js crypto.randomBytes (server-side)
 * - `browserCryptoGetRandomValues`: Web Crypto API (browser-side)
 * - `testRandom`: Deterministic RNG for testing purposes only (NOT secure)
 */
export type CSPRNGType = 
  | "nodeCryptoRandomBytes"
  | "browserCryptoGetRandomValues" 
  | "testRandom";

/**
 * Array of share strings
 * 
 * Shares are represented as strings that encode the bit configuration,
 * share ID, and share data. This type ensures immutability of share arrays.
 */
export type Shares = readonly string[];

/**
 * Internal share representation with x and y coordinates
 * 
 * Represents a point on the polynomial used in Shamir's Secret Sharing.
 * The x coordinate is the share ID, and y is the evaluated polynomial value.
 * 
 * @property x - The x-coordinate (share ID)
 * @property y - The y-coordinate (polynomial evaluation at x)
 */
export interface Share {
  readonly x: number;
  readonly y: number;
}

/**
 * Random number generator function signature
 * 
 * Custom RNG functions must conform to this signature. They should return
 * a binary string (containing only '0' and '1' characters) of exactly the
 * specified length.
 * 
 * @param bits - Number of random bits to generate
 * @returns Binary string of specified length (e.g., "10110101" for 8 bits)
 * 
 * @example
 * ```typescript
 * const customRNG: RNGFunction = (bits: number): string => {
 *   // Generate and return binary string of specified length
 *   return generateRandomBinaryString(bits);
 * };
 * secrets.setRNG(customRNG);
 * ```
 */
export type RNGFunction = (bits: number) => string;

// ============================================================================
// Environment-Specific Types
// ============================================================================

/**
 * Node.js crypto module interface
 * 
 * Minimal interface for Node.js crypto.randomBytes functionality.
 */
export interface NodeCrypto {
  /**
   * Generate cryptographically strong pseudo-random data
   * @param size - Number of bytes to generate
   * @returns Buffer containing random bytes
   */
  randomBytes(size: number): Buffer;
}

/**
 * Browser Web Crypto API interface
 * 
 * Minimal interface for browser crypto.getRandomValues functionality.
 */
export interface BrowserCrypto {
  /**
   * Fill an array with cryptographically secure random values
   * @param array - Typed array to fill with random values
   * @returns The same array, filled with random values
   */
  getRandomValues<T extends ArrayBufferView>(array: T): T;
}

/**
 * Discriminated union for crypto environment detection
 * 
 * Represents the different cryptographic environments the library can run in.
 * The type field discriminates between Node.js, browser, and test environments.
 */
export type CryptoEnvironment = 
  | {
      /** Node.js environment with crypto.randomBytes */
      readonly type: 'node';
      readonly crypto: NodeCrypto;
    }
  | {
      /** Browser environment with crypto.getRandomValues */
      readonly type: 'browser';
      readonly crypto: BrowserCrypto;
    }
  | {
      /** Test environment with deterministic RNG (NOT secure) */
      readonly type: 'test';
      readonly crypto: null;
    };

// ============================================================================
// Internal Configuration Types
// ============================================================================

/**
 * Internal configuration state (mutable during initialization)
 * 
 * Contains the runtime configuration including Galois Field arithmetic tables.
 * This is internal state and should not be accessed directly by library users.
 * 
 * @internal
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
 * 
 * Contains the default settings and constraints for the library.
 * 
 * @internal
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
 * 
 * @param value - Value to check
 * @returns True if value is a valid hexadecimal string
 * 
 * @example
 * ```typescript
 * if (isValidSecret(userInput)) {
 *   const shares = secrets.share(userInput, 5, 3);
 * }
 * ```
 */
export function isValidSecret(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-fA-F]*$/.test(value);
}

/**
 * Type guard to check if a value is a valid shares array
 * 
 * @param value - Value to check
 * @returns True if value is a valid array of share strings
 * 
 * @example
 * ```typescript
 * if (isValidShares(userShares)) {
 *   const secret = secrets.combine(userShares);
 * }
 * ```
 */
export function isValidShares(value: unknown): value is Shares {
  return Array.isArray(value) && 
         value.length > 0 &&
         value.every(share => typeof share === 'string');
}

/**
 * Type guard to check if a value is a valid RNG function
 * 
 * @param value - Value to check
 * @returns True if value is a function (basic check)
 */
export function isValidRNGFunction(value: unknown): value is RNGFunction {
  return typeof value === 'function';
}

/**
 * Type guard to check if a value is a valid CSPRNG type
 * 
 * @param value - Value to check
 * @returns True if value is a valid CSPRNG type string
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
 * 
 * Used internally for binary arithmetic operations.
 * 
 * @example "10110101"
 */
export type BinaryString = string;

/**
 * Represents a hexadecimal string (string of '0-9' and 'a-f' characters)
 * 
 * Used for secrets and share data representation.
 * 
 * @example "deadbeef"
 */
export type HexString = string;

/**
 * Represents a base-36 string (string of '0-9' and 'a-z' characters)
 * 
 * Used for encoding bit configuration in share strings.
 * 
 * @example "8" (represents 8 bits)
 */
export type Base36String = string;
