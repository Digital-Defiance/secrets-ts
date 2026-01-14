// Browser-specific type definitions and error handling
// Provides enhanced typing for browser Web Crypto API and environment-specific behavior

import type { RNGFunction, CSPRNGType } from './types';
import { CryptoError } from './errors';

// ============================================================================
// Browser Crypto API Types
// ============================================================================

/**
 * Enhanced browser Web Crypto API interface with comprehensive typing
 */
export interface BrowserCryptoAPI {
  /**
   * Generates cryptographically strong random values
   * @param array - Typed array to fill with random values
   * @returns The same array filled with random values
   * @throws {Error} If random value generation fails
   */
  getRandomValues<T extends ArrayBufferView>(array: T): T;
  
  /**
   * SubtleCrypto interface for advanced cryptographic operations
   */
  subtle?: SubtleCrypto;
}

/**
 * Browser window.crypto interface
 */
export interface WindowCrypto {
  crypto?: BrowserCryptoAPI;
}

/**
 * Type guard for Uint32Array
 */
export function isUint32Array(value: unknown): value is Uint32Array {
  return value !== null &&
         typeof value === 'object' &&
         value.constructor?.name === 'Uint32Array';
}

/**
 * Type guard for any typed array
 */
export function isTypedArray(value: unknown): value is ArrayBufferView {
  return value !== null &&
         typeof value === 'object' &&
         ArrayBuffer.isView(value);
}

// ============================================================================
// Browser Environment Detection
// ============================================================================

/**
 * Detects if the current environment is a browser
 * @returns true if running in a browser, false otherwise
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' &&
         typeof window.document !== 'undefined';
}

/**
 * Attempts to access the browser Web Crypto API
 * @returns BrowserCryptoAPI if available, null otherwise
 */
export function getBrowserCrypto(): BrowserCryptoAPI | null {
  // Check for window.crypto
  if (typeof window !== 'undefined' && window.crypto) {
    const crypto = window.crypto;
    
    if (typeof crypto.getRandomValues === 'function' ||
        typeof crypto.getRandomValues === 'object') {
      return crypto as BrowserCryptoAPI;
    }
  }
  
  // Check for global crypto (some environments)
  if (typeof global !== 'undefined' && (global as any).crypto) {
    const crypto = (global as any).crypto;
    
    if (typeof crypto.getRandomValues === 'function' ||
        typeof crypto.getRandomValues === 'object') {
      return crypto as BrowserCryptoAPI;
    }
  }
  
  return null;
}

/**
 * Checks if browser crypto.getRandomValues is available
 * @returns true if crypto.getRandomValues is available
 */
export function hasBrowserCryptoGetRandomValues(): boolean {
  const crypto = getBrowserCrypto();
  
  if (!crypto) {
    return false;
  }
  
  // Check if Uint32Array is available
  if (typeof Uint32Array !== 'function' && typeof Uint32Array !== 'object') {
    return false;
  }
  
  return typeof crypto.getRandomValues === 'function' ||
         typeof crypto.getRandomValues === 'object';
}

// ============================================================================
// Browser-Specific Error Types
// ============================================================================

/**
 * Error thrown when browser crypto operations fail
 */
export class BrowserCryptoError extends CryptoError {
  constructor(operation: string, reason: string, public readonly originalError?: Error) {
    super(operation, `Browser crypto error: ${reason}`);
    this.name = 'BrowserCryptoError';
    
    if (originalError && Error.captureStackTrace) {
      Error.captureStackTrace(this, BrowserCryptoError);
    }
  }
}

/**
 * Error thrown when browser environment is required but not available
 */
export class BrowserEnvironmentError extends CryptoError {
  constructor(feature: string) {
    super(
      'environment_check',
      `Feature '${feature}' requires browser environment but is not available`
    );
    this.name = 'BrowserEnvironmentError';
  }
}

/**
 * Error thrown when Web Crypto API is not supported
 */
export class WebCryptoNotSupportedError extends BrowserCryptoError {
  constructor() {
    super(
      'getRandomValues',
      'Web Crypto API is not supported in this browser'
    );
    this.name = 'WebCryptoNotSupportedError';
  }
}

// ============================================================================
// Browser RNG Implementation
// ============================================================================

/**
 * Creates a browser-specific RNG function using crypto.getRandomValues
 * @param crypto - Browser Web Crypto API
 * @returns RNG function that generates random binary strings
 * @throws {BrowserCryptoError} If random value generation fails
 */
export function createBrowserRNG(crypto: BrowserCryptoAPI): RNGFunction {
  return function browserCryptoGetRandomValues(bits: number): string {
    if (typeof bits !== 'number' || bits <= 0 || bits % 1 !== 0) {
      throw new BrowserCryptoError(
        'getRandomValues',
        `Invalid bits parameter: ${bits}. Must be a positive integer.`
      );
    }
    
    // Calculate number of 32-bit integers needed
    const elems = Math.ceil(bits / 32);
    
    try {
      // Generate random values
      const array = new Uint32Array(elems);
      crypto.getRandomValues(array);
      
      // Convert to binary string
      let binary = '';
      for (let i = 0; i < array.length; i++) {
        const value = array[i];
        const bin = value.toString(2);
        // Pad to 32 bits
        binary += '00000000000000000000000000000000'.substring(bin.length) + bin;
      }
      
      // Return exactly the requested number of bits
      return binary.substring(0, bits);
      
    } catch (error) {
      throw new BrowserCryptoError(
        'getRandomValues',
        'Failed to generate random values',
        error as Error
      );
    }
  };
}

/**
 * Browser-specific crypto environment descriptor
 */
export interface BrowserCryptoEnvironment {
  readonly type: 'browser';
  readonly crypto: BrowserCryptoAPI;
  readonly rngType: CSPRNGType;
  readonly rng: RNGFunction;
}

/**
 * Creates a browser crypto environment descriptor
 * @returns BrowserCryptoEnvironment if browser crypto is available, null otherwise
 */
export function createBrowserCryptoEnvironment(): BrowserCryptoEnvironment | null {
  const crypto = getBrowserCrypto();
  
  if (!crypto) {
    return null;
  }
  
  return {
    type: 'browser',
    crypto,
    rngType: 'browserCryptoGetRandomValues',
    rng: createBrowserRNG(crypto)
  };
}

// ============================================================================
// Type Validation for Browser
// ============================================================================

/**
 * Validates that a value is a valid Uint32Array
 * @param value - Value to validate
 * @param paramName - Parameter name for error messages
 * @throws {BrowserCryptoError} If value is not a valid Uint32Array
 */
export function validateUint32Array(value: unknown, paramName: string): asserts value is Uint32Array {
  if (!isUint32Array(value)) {
    throw new BrowserCryptoError(
      'validation',
      `Parameter '${paramName}' must be a Uint32Array`
    );
  }
}

/**
 * Validates that a value is a valid typed array
 * @param value - Value to validate
 * @param paramName - Parameter name for error messages
 * @throws {BrowserCryptoError} If value is not a valid typed array
 */
export function validateTypedArray(value: unknown, paramName: string): asserts value is ArrayBufferView {
  if (!isTypedArray(value)) {
    throw new BrowserCryptoError(
      'validation',
      `Parameter '${paramName}' must be a typed array`
    );
  }
}

/**
 * Validates that browser crypto is available
 * @throws {WebCryptoNotSupportedError} If browser crypto is not available
 */
export function requireBrowserCrypto(): BrowserCryptoAPI {
  const crypto = getBrowserCrypto();
  
  if (!crypto) {
    throw new WebCryptoNotSupportedError();
  }
  
  return crypto;
}

/**
 * Checks if the browser supports the Web Crypto API
 * @returns true if Web Crypto API is fully supported
 */
export function isWebCryptoSupported(): boolean {
  return hasBrowserCryptoGetRandomValues() &&
         (typeof Uint32Array === 'function' || typeof Uint32Array === 'object');
}
