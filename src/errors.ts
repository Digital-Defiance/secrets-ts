// Type-safe error handling for @brightchain/secrets
// Provides structured error classes with context information

/**
 * Base error class for all secrets library errors
 */
export class SecretsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SecretsError';
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SecretsError);
    }
  }
}

/**
 * Error thrown when invalid parameters are provided to a function
 */
export class InvalidParameterError extends SecretsError {
  constructor(parameter: string, value: unknown, expected: string) {
    super(
      `Invalid parameter '${parameter}': expected ${expected}, got ${typeof value}`,
      'INVALID_PARAMETER',
      { parameter, value, expected }
    );
    this.name = 'InvalidParameterError';
  }
}

/**
 * Error thrown when initialization fails
 */
export class InitializationError extends SecretsError {
  constructor(reason: string) {
    super(
      `Initialization failed: ${reason}`,
      'INITIALIZATION_FAILED',
      { reason }
    );
    this.name = 'InitializationError';
  }
}

/**
 * Error thrown when share data is invalid or corrupted
 */
export class InvalidShareError extends SecretsError {
  constructor(share: string, reason: string) {
    super(
      `Invalid share data: ${reason}`,
      'INVALID_SHARE',
      { share, reason }
    );
    this.name = 'InvalidShareError';
  }
}

/**
 * Error thrown when cryptographic operations fail
 */
export class CryptoError extends SecretsError {
  constructor(operation: string, reason: string) {
    super(
      `Cryptographic operation '${operation}' failed: ${reason}`,
      'CRYPTO_ERROR',
      { operation, reason }
    );
    this.name = 'CryptoError';
  }
}
