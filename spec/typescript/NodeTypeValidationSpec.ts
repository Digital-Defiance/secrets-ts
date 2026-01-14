// Tests for Node.js-specific type support and error handling
// Validates Node.js crypto API typing and environment detection

import {
  isNodeEnvironment,
  getNodeCrypto,
  hasNodeCryptoRandomBytes,
  isNodeBuffer,
  createNodeRNG,
  createNodeCryptoEnvironment,
  validateNodeBuffer,
  requireNodeCrypto,
  NodeCryptoError,
  NodeEnvironmentError
} from '../../dist/node-types.js';

describe('Node.js Type Support', () => {
  describe('Environment Detection', () => {
    it('should detect Node.js environment correctly', () => {
      const isNode = isNodeEnvironment();
      
      // We're running in Node.js via Jasmine
      expect(isNode).toBe(true);
      expect(typeof process).toBe('object');
      expect(process.versions).toBeDefined();
      expect(process.versions.node).toBeDefined();
    });
    
    it('should load Node.js crypto module', () => {
      const crypto = getNodeCrypto();
      
      expect(crypto).not.toBeNull();
      expect(typeof crypto?.randomBytes).toBe('function');
    });
    
    it('should detect crypto.randomBytes availability', () => {
      const hasRandomBytes = hasNodeCryptoRandomBytes();
      
      expect(hasRandomBytes).toBe(true);
    });
  });
  
  describe('Buffer Type Guard', () => {
    it('should identify valid Node.js Buffers', () => {
      const buffer = Buffer.from([1, 2, 3, 4]);
      
      expect(isNodeBuffer(buffer)).toBe(true);
    });
    
    it('should reject non-Buffer values', () => {
      expect(isNodeBuffer(null)).toBe(false);
      expect(isNodeBuffer(undefined)).toBe(false);
      expect(isNodeBuffer(123)).toBe(false);
      expect(isNodeBuffer('string')).toBe(false);
      expect(isNodeBuffer([])).toBe(false);
      expect(isNodeBuffer({})).toBe(false);
      expect(isNodeBuffer(new Uint8Array([1, 2, 3]))).toBe(false);
    });
  });
  
  describe('Node.js RNG Implementation', () => {
    it('should create a working RNG function', () => {
      const crypto = getNodeCrypto();
      expect(crypto).not.toBeNull();
      
      const rng = createNodeRNG(crypto!);
      
      expect(typeof rng).toBe('function');
    });
    
    it('should generate binary strings of correct length', () => {
      const crypto = getNodeCrypto();
      expect(crypto).not.toBeNull();
      
      const rng = createNodeRNG(crypto!);
      
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
    
    it('should generate different random values on each call', () => {
      const crypto = getNodeCrypto();
      expect(crypto).not.toBeNull();
      
      const rng = createNodeRNG(crypto!);
      
      const value1 = rng(64);
      const value2 = rng(64);
      const value3 = rng(64);
      
      // Extremely unlikely to be equal if truly random
      expect(value1).not.toBe(value2);
      expect(value2).not.toBe(value3);
      expect(value1).not.toBe(value3);
    });
    
    it('should throw error for invalid bits parameter', () => {
      const crypto = getNodeCrypto();
      expect(crypto).not.toBeNull();
      
      const rng = createNodeRNG(crypto!);
      
      expect(() => rng(0)).toThrowError(/Invalid bits parameter/);
      expect(() => rng(-1)).toThrowError(/Invalid bits parameter/);
      expect(() => rng(1.5)).toThrowError(/Invalid bits parameter/);
      expect(() => rng(NaN)).toThrowError(/Invalid bits parameter/);
    });
  });
  
  describe('Node.js Crypto Environment', () => {
    it('should create a valid crypto environment', () => {
      const env = createNodeCryptoEnvironment();
      
      expect(env).not.toBeNull();
      expect(env?.type).toBe('node');
      expect(env?.crypto).toBeDefined();
      expect(env?.rngType).toBe('nodeCryptoRandomBytes');
      expect(typeof env?.rng).toBe('function');
    });
    
    it('should have a working RNG in the environment', () => {
      const env = createNodeCryptoEnvironment();
      expect(env).not.toBeNull();
      
      const randomBits = env!.rng(32);
      
      expect(randomBits.length).toBe(32);
      expect(/^[01]+$/.test(randomBits)).toBe(true);
    });
  });
  
  describe('Node.js Error Types', () => {
    it('should create NodeCryptoError with proper properties', () => {
      const error = new NodeCryptoError('testOp', 'test reason');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('NodeCryptoError');
      expect(error.message).toContain('Node.js crypto error');
      expect(error.message).toContain('test reason');
    });
    
    it('should create NodeCryptoError with original error', () => {
      const originalError = new Error('Original error');
      const error = new NodeCryptoError('testOp', 'test reason', originalError);
      
      expect(error.originalError).toBe(originalError);
    });
    
    it('should create NodeEnvironmentError with proper properties', () => {
      const error = new NodeEnvironmentError('testFeature');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('NodeEnvironmentError');
      expect(error.message).toContain('testFeature');
      expect(error.message).toContain('Node.js environment');
    });
  });
  
  describe('Node.js Validation Functions', () => {
    it('should validate Node.js Buffers', () => {
      const buffer = Buffer.from([1, 2, 3]);
      
      expect(() => validateNodeBuffer(buffer, 'testParam')).not.toThrow();
    });
    
    it('should throw error for non-Buffer values', () => {
      expect(() => validateNodeBuffer('not a buffer', 'testParam')).toThrowError(/must be a Node\.js Buffer/);
      expect(() => validateNodeBuffer(123, 'testParam')).toThrowError(/must be a Node\.js Buffer/);
      expect(() => validateNodeBuffer(null, 'testParam')).toThrowError(/must be a Node\.js Buffer/);
    });
    
    it('should require Node.js crypto successfully', () => {
      const crypto = requireNodeCrypto();
      
      expect(crypto).toBeDefined();
      expect(typeof crypto.randomBytes).toBe('function');
    });
  });
  
  describe('Node.js Type Accuracy', () => {
    it('should have accurate Buffer type detection', () => {
      const buffer = Buffer.allocUnsafe(10);
      
      expect(isNodeBuffer(buffer)).toBe(true);
      expect(buffer.length).toBe(10);
      expect(typeof buffer.readUInt8).toBe('function');
    });
    
    it('should have accurate crypto module typing', () => {
      const crypto = getNodeCrypto();
      expect(crypto).not.toBeNull();
      
      // Test that randomBytes returns a Buffer
      const randomBuffer = crypto!.randomBytes(16);
      expect(isNodeBuffer(randomBuffer)).toBe(true);
      expect(randomBuffer.length).toBe(16);
    });
    
    it('should correctly type crypto.randomBytes return value', () => {
      const crypto = getNodeCrypto();
      expect(crypto).not.toBeNull();
      
      const buffer: Buffer = crypto!.randomBytes(8);
      
      // These operations should be type-safe
      expect(buffer.length).toBe(8);
      expect(typeof buffer.toString).toBe('function');
      expect(typeof buffer.readUInt8).toBe('function');
    });
  });
});
