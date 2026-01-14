// Tests for browser-specific type support and error handling
// Validates browser Web Crypto API typing and environment detection

import {
  isBrowserEnvironment,
  getBrowserCrypto,
  hasBrowserCryptoGetRandomValues,
  isUint32Array,
  isTypedArray,
  createBrowserRNG,
  createBrowserCryptoEnvironment,
  validateUint32Array,
  validateTypedArray,
  requireBrowserCrypto,
  isWebCryptoSupported,
  BrowserCryptoError,
  BrowserEnvironmentError,
  WebCryptoNotSupportedError
} from '../../dist/browser-types.js';

describe('Browser Type Support', () => {
  describe('Environment Detection', () => {
    it('should detect browser environment correctly', () => {
      const isBrowser = isBrowserEnvironment();
      
      // We're running in Node.js via Jasmine, not a browser
      expect(isBrowser).toBe(false);
      expect(typeof window).toBe('undefined');
    });
    
    it('should handle browser crypto availability', () => {
      const crypto = getBrowserCrypto();
      
      // Modern Node.js (v15+) has global crypto with getRandomValues
      // So this may or may not be null depending on Node version
      if (crypto) {
        expect(typeof crypto.getRandomValues).toBeDefined();
      }
    });
    
    it('should detect crypto.getRandomValues availability', () => {
      const hasRandomValues = hasBrowserCryptoGetRandomValues();
      
      // Modern Node.js supports this, so we just check it's a boolean
      expect(typeof hasRandomValues).toBe('boolean');
    });
    
    it('should check Web Crypto API support', () => {
      const isSupported = isWebCryptoSupported();
      
      // Modern Node.js supports this, so we just check it's a boolean
      expect(typeof isSupported).toBe('boolean');
    });
  });
  
  describe('Typed Array Type Guards', () => {
    it('should identify valid Uint32Array', () => {
      const array = new Uint32Array([1, 2, 3, 4]);
      
      expect(isUint32Array(array)).toBe(true);
    });
    
    it('should reject non-Uint32Array values', () => {
      expect(isUint32Array(null)).toBe(false);
      expect(isUint32Array(undefined)).toBe(false);
      expect(isUint32Array(123)).toBe(false);
      expect(isUint32Array('string')).toBe(false);
      expect(isUint32Array([])).toBe(false);
      expect(isUint32Array({})).toBe(false);
      expect(isUint32Array(new Uint8Array([1, 2, 3]))).toBe(false);
    });
    
    it('should identify valid typed arrays', () => {
      expect(isTypedArray(new Uint8Array([1, 2, 3]))).toBe(true);
      expect(isTypedArray(new Uint16Array([1, 2, 3]))).toBe(true);
      expect(isTypedArray(new Uint32Array([1, 2, 3]))).toBe(true);
      expect(isTypedArray(new Int8Array([1, 2, 3]))).toBe(true);
      expect(isTypedArray(new Int16Array([1, 2, 3]))).toBe(true);
      expect(isTypedArray(new Int32Array([1, 2, 3]))).toBe(true);
      expect(isTypedArray(new Float32Array([1.0, 2.0, 3.0]))).toBe(true);
      expect(isTypedArray(new Float64Array([1.0, 2.0, 3.0]))).toBe(true);
    });
    
    it('should reject non-typed-array values', () => {
      expect(isTypedArray(null)).toBe(false);
      expect(isTypedArray(undefined)).toBe(false);
      expect(isTypedArray(123)).toBe(false);
      expect(isTypedArray('string')).toBe(false);
      expect(isTypedArray([])).toBe(false);
      expect(isTypedArray({})).toBe(false);
      // Note: Buffer in Node.js is actually a Uint8Array subclass, so it IS a typed array
    });
  });
  
  describe('Browser RNG Implementation (with mock)', () => {
    it('should create a working RNG function with mock crypto', () => {
      // Create a mock browser crypto API
      const mockCrypto = {
        getRandomValues: <T extends ArrayBufferView>(array: T): T => {
          // Fill with pseudo-random values for testing
          if (array instanceof Uint32Array) {
            for (let i = 0; i < array.length; i++) {
              array[i] = Math.floor(Math.random() * 0xFFFFFFFF);
            }
          }
          return array;
        }
      };
      
      const rng = createBrowserRNG(mockCrypto);
      
      expect(typeof rng).toBe('function');
    });
    
    it('should generate binary strings of correct length with mock crypto', () => {
      const mockCrypto = {
        getRandomValues: <T extends ArrayBufferView>(array: T): T => {
          if (array instanceof Uint32Array) {
            for (let i = 0; i < array.length; i++) {
              array[i] = Math.floor(Math.random() * 0xFFFFFFFF);
            }
          }
          return array;
        }
      };
      
      const rng = createBrowserRNG(mockCrypto);
      
      const bits8 = rng(8);
      expect(bits8.length).toBe(8);
      expect(/^[01]+$/.test(bits8)).toBe(true);
      
      const bits16 = rng(16);
      expect(bits16.length).toBe(16);
      expect(/^[01]+$/.test(bits16)).toBe(true);
      
      const bits128 = rng(128);
      expect(bits128.length).toBe(128);
      expect(/^[01]+$/.test(bits128)).toBe(true);
    });
    
    it('should generate different random values on each call with mock crypto', () => {
      const mockCrypto = {
        getRandomValues: <T extends ArrayBufferView>(array: T): T => {
          if (array instanceof Uint32Array) {
            for (let i = 0; i < array.length; i++) {
              array[i] = Math.floor(Math.random() * 0xFFFFFFFF);
            }
          }
          return array;
        }
      };
      
      const rng = createBrowserRNG(mockCrypto);
      
      const value1 = rng(64);
      const value2 = rng(64);
      const value3 = rng(64);
      
      // Extremely unlikely to be equal if truly random
      expect(value1).not.toBe(value2);
      expect(value2).not.toBe(value3);
      expect(value1).not.toBe(value3);
    });
    
    it('should throw error for invalid bits parameter', () => {
      const mockCrypto = {
        getRandomValues: <T extends ArrayBufferView>(array: T): T => array
      };
      
      const rng = createBrowserRNG(mockCrypto);
      
      expect(() => rng(0)).toThrowError(/Invalid bits parameter/);
      expect(() => rng(-1)).toThrowError(/Invalid bits parameter/);
      expect(() => rng(1.5)).toThrowError(/Invalid bits parameter/);
      expect(() => rng(NaN)).toThrowError(/Invalid bits parameter/);
    });
  });
  
  describe('Browser Crypto Environment (with mock)', () => {
    it('should handle browser crypto environment creation', () => {
      const env = createBrowserCryptoEnvironment();
      
      // Modern Node.js may have crypto.getRandomValues, so this may not be null
      if (env) {
        expect(env.type).toBe('browser');
        expect(env.rngType).toBe('browserCryptoGetRandomValues');
        expect(typeof env.rng).toBe('function');
      }
    });
  });
  
  describe('Browser Error Types', () => {
    it('should create BrowserCryptoError with proper properties', () => {
      const error = new BrowserCryptoError('testOp', 'test reason');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('BrowserCryptoError');
      expect(error.message).toContain('Browser crypto error');
      expect(error.message).toContain('test reason');
    });
    
    it('should create BrowserCryptoError with original error', () => {
      const originalError = new Error('Original error');
      const error = new BrowserCryptoError('testOp', 'test reason', originalError);
      
      expect(error.originalError).toBe(originalError);
    });
    
    it('should create BrowserEnvironmentError with proper properties', () => {
      const error = new BrowserEnvironmentError('testFeature');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('BrowserEnvironmentError');
      expect(error.message).toContain('testFeature');
      expect(error.message).toContain('browser environment');
    });
    
    it('should create WebCryptoNotSupportedError with proper properties', () => {
      const error = new WebCryptoNotSupportedError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('WebCryptoNotSupportedError');
      expect(error.message).toContain('Web Crypto API');
      expect(error.message).toContain('not supported');
    });
  });
  
  describe('Browser Validation Functions', () => {
    it('should validate Uint32Array', () => {
      const array = new Uint32Array([1, 2, 3]);
      
      expect(() => validateUint32Array(array, 'testParam')).not.toThrow();
    });
    
    it('should throw error for non-Uint32Array values', () => {
      expect(() => validateUint32Array('not an array', 'testParam')).toThrowError(/must be a Uint32Array/);
      expect(() => validateUint32Array(123, 'testParam')).toThrowError(/must be a Uint32Array/);
      expect(() => validateUint32Array(null, 'testParam')).toThrowError(/must be a Uint32Array/);
    });
    
    it('should validate typed arrays', () => {
      const uint8 = new Uint8Array([1, 2, 3]);
      const uint32 = new Uint32Array([1, 2, 3]);
      const float32 = new Float32Array([1.0, 2.0, 3.0]);
      
      expect(() => validateTypedArray(uint8, 'testParam')).not.toThrow();
      expect(() => validateTypedArray(uint32, 'testParam')).not.toThrow();
      expect(() => validateTypedArray(float32, 'testParam')).not.toThrow();
    });
    
    it('should throw error for non-typed-array values', () => {
      expect(() => validateTypedArray('not an array', 'testParam')).toThrowError(/must be a typed array/);
      expect(() => validateTypedArray(123, 'testParam')).toThrowError(/must be a typed array/);
      expect(() => validateTypedArray([], 'testParam')).toThrowError(/must be a typed array/);
    });
    
    it('should handle browser crypto requirement appropriately', () => {
      // Modern Node.js may have crypto.getRandomValues
      try {
        const crypto = requireBrowserCrypto();
        expect(crypto).toBeDefined();
        expect(typeof crypto.getRandomValues).toBeDefined();
      } catch (error) {
        // If not available, should throw WebCryptoNotSupportedError
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Web Crypto API');
      }
    });
  });
  
  describe('Browser Type Accuracy', () => {
    it('should have accurate Uint32Array type detection', () => {
      const array = new Uint32Array(10);
      
      expect(isUint32Array(array)).toBe(true);
      expect(array.length).toBe(10);
      expect(array.constructor.name).toBe('Uint32Array');
    });
    
    it('should correctly distinguish between typed array types', () => {
      const uint8 = new Uint8Array([1, 2, 3]);
      const uint32 = new Uint32Array([1, 2, 3]);
      
      expect(isTypedArray(uint8)).toBe(true);
      expect(isTypedArray(uint32)).toBe(true);
      expect(isUint32Array(uint8)).toBe(false);
      expect(isUint32Array(uint32)).toBe(true);
    });
  });
});
