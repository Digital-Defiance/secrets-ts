// Property-Based Test for Cross-Environment Type Consistency
// **Feature: typescript-conversion, Property 5: Cross-Environment Type Consistency**
// **Validates: Requirements 4.2, 4.3**
//
// Property: For any environment-specific code path (Node.js vs browser),
// the TypeScript types should accurately represent the available APIs and their behavior.

import {
  isNodeEnvironment,
  getNodeCrypto,
  hasNodeCryptoRandomBytes,
  createNodeRNG,
  createNodeCryptoEnvironment
} from '../../dist/node-types.js';

import {
  isBrowserEnvironment,
  getBrowserCrypto,
  hasBrowserCryptoGetRandomValues,
  createBrowserRNG,
  createBrowserCryptoEnvironment
} from '../../dist/browser-types.js';

describe('Property 5: Cross-Environment Type Consistency', () => {
  const PROPERTY_TEST_ITERATIONS = 100;
  
  describe('Environment Detection Consistency', () => {
    it('should consistently detect environment type across multiple checks', () => {
      // Property: Environment detection should be stable and consistent
      for (let i = 0; i < PROPERTY_TEST_ITERATIONS; i++) {
        const isNode1 = isNodeEnvironment();
        const isNode2 = isNodeEnvironment();
        const isBrowser1 = isBrowserEnvironment();
        const isBrowser2 = isBrowserEnvironment();
        
        // Environment detection should be consistent
        expect(isNode1).toBe(isNode2);
        expect(isBrowser1).toBe(isBrowser2);
        
        // In a pure Node.js environment, we should not be in a browser
        // (though modern Node.js may have some browser-like APIs)
        if (isNode1 && !isBrowser1) {
          expect(typeof window).toBe('undefined');
          expect(typeof process).toBe('object');
        }
      }
    });
  });
  
  describe('Crypto API Availability Consistency', () => {
    it('should consistently report crypto API availability', () => {
      // Property: Crypto API availability checks should be stable
      for (let i = 0; i < PROPERTY_TEST_ITERATIONS; i++) {
        const hasNode1 = hasNodeCryptoRandomBytes();
        const hasNode2 = hasNodeCryptoRandomBytes();
        const hasBrowser1 = hasBrowserCryptoGetRandomValues();
        const hasBrowser2 = hasBrowserCryptoGetRandomValues();
        
        // Availability should be consistent
        expect(hasNode1).toBe(hasNode2);
        expect(hasBrowser1).toBe(hasBrowser2);
      }
    });
    
    it('should have consistent crypto module retrieval', () => {
      // Property: Getting crypto modules should return consistent results
      for (let i = 0; i < PROPERTY_TEST_ITERATIONS; i++) {
        const nodeCrypto1 = getNodeCrypto();
        const nodeCrypto2 = getNodeCrypto();
        const browserCrypto1 = getBrowserCrypto();
        const browserCrypto2 = getBrowserCrypto();
        
        // Should get same result each time
        if (nodeCrypto1 === null) {
          expect(nodeCrypto2).toBeNull();
        } else {
          expect(nodeCrypto2).not.toBeNull();
          expect(typeof nodeCrypto1.randomBytes).toBe('function');
          expect(typeof nodeCrypto2.randomBytes).toBe('function');
        }
        
        if (browserCrypto1 === null) {
          expect(browserCrypto2).toBeNull();
        } else {
          expect(browserCrypto2).not.toBeNull();
          expect(typeof browserCrypto1.getRandomValues).toBeDefined();
          expect(typeof browserCrypto2.getRandomValues).toBeDefined();
        }
      }
    });
  });
  
  describe('RNG Function Type Consistency', () => {
    it('should create RNG functions with consistent behavior for Node.js', () => {
      const nodeCrypto = getNodeCrypto();
      
      if (!nodeCrypto) {
        pending('Node.js crypto not available');
        return;
      }
      
      // Property: RNG functions should have consistent type signatures and behavior
      for (let i = 0; i < PROPERTY_TEST_ITERATIONS; i++) {
        const rng = createNodeRNG(nodeCrypto);
        
        // Type consistency: should be a function
        expect(typeof rng).toBe('function');
        
        // Behavior consistency: should generate binary strings
        const bits = 8 + (i % 120); // Test various bit lengths
        const result = rng(bits);
        
        expect(typeof result).toBe('string');
        expect(result.length).toBe(bits);
        expect(/^[01]+$/.test(result)).toBe(true);
      }
    });
    
    it('should create RNG functions with consistent behavior for browser', () => {
      const browserCrypto = getBrowserCrypto();
      
      if (!browserCrypto) {
        pending('Browser crypto not available');
        return;
      }
      
      // Property: RNG functions should have consistent type signatures and behavior
      for (let i = 0; i < PROPERTY_TEST_ITERATIONS; i++) {
        const rng = createBrowserRNG(browserCrypto);
        
        // Type consistency: should be a function
        expect(typeof rng).toBe('function');
        
        // Behavior consistency: should generate binary strings
        const bits = 8 + (i % 120); // Test various bit lengths
        const result = rng(bits);
        
        expect(typeof result).toBe('string');
        expect(result.length).toBe(bits);
        expect(/^[01]+$/.test(result)).toBe(true);
      }
    });
  });
  
  describe('Environment Descriptor Consistency', () => {
    it('should create consistent Node.js environment descriptors', () => {
      // Property: Environment descriptors should have consistent structure
      for (let i = 0; i < PROPERTY_TEST_ITERATIONS; i++) {
        const env = createNodeCryptoEnvironment();
        
        if (env === null) {
          // If null once, should always be null
          expect(createNodeCryptoEnvironment()).toBeNull();
        } else {
          // If not null, should have consistent structure
          expect(env.type).toBe('node');
          expect(env.rngType).toBe('nodeCryptoRandomBytes');
          expect(typeof env.rng).toBe('function');
          expect(env.crypto).toBeDefined();
          
          // RNG should work consistently
          const result = env.rng(32);
          expect(result.length).toBe(32);
          expect(/^[01]+$/.test(result)).toBe(true);
        }
      }
    });
    
    it('should create consistent browser environment descriptors', () => {
      // Property: Environment descriptors should have consistent structure
      for (let i = 0; i < PROPERTY_TEST_ITERATIONS; i++) {
        const env = createBrowserCryptoEnvironment();
        
        if (env === null) {
          // If null once, should always be null
          expect(createBrowserCryptoEnvironment()).toBeNull();
        } else {
          // If not null, should have consistent structure
          expect(env.type).toBe('browser');
          expect(env.rngType).toBe('browserCryptoGetRandomValues');
          expect(typeof env.rng).toBe('function');
          expect(env.crypto).toBeDefined();
          
          // RNG should work consistently
          const result = env.rng(32);
          expect(result.length).toBe(32);
          expect(/^[01]+$/.test(result)).toBe(true);
        }
      }
    });
  });
  
  describe('Cross-Environment Type Compatibility', () => {
    it('should have compatible RNG function signatures across environments', () => {
      const nodeCrypto = getNodeCrypto();
      const browserCrypto = getBrowserCrypto();
      
      // Property: Both RNG implementations should have the same type signature
      // and produce compatible outputs
      
      if (nodeCrypto && browserCrypto) {
        const nodeRng = createNodeRNG(nodeCrypto);
        const browserRng = createBrowserRNG(browserCrypto);
        
        for (let i = 0; i < PROPERTY_TEST_ITERATIONS; i++) {
          const bits = 8 + (i % 120);
          
          const nodeResult = nodeRng(bits);
          const browserResult = browserRng(bits);
          
          // Both should produce binary strings of correct length
          expect(typeof nodeResult).toBe('string');
          expect(typeof browserResult).toBe('string');
          expect(nodeResult.length).toBe(bits);
          expect(browserResult.length).toBe(bits);
          expect(/^[01]+$/.test(nodeResult)).toBe(true);
          expect(/^[01]+$/.test(browserResult)).toBe(true);
          
          // Results should be different (randomness check)
          // but have the same format
          if (bits > 8) {
            // For larger bit counts, extremely unlikely to be equal
            expect(nodeResult).not.toBe(browserResult);
          }
        }
      } else {
        pending('Both Node.js and browser crypto not available for comparison');
      }
    });
    
    it('should handle errors consistently across environments', () => {
      const nodeCrypto = getNodeCrypto();
      const browserCrypto = getBrowserCrypto();
      
      // Property: Error handling should be consistent across environments
      
      if (nodeCrypto) {
        const nodeRng = createNodeRNG(nodeCrypto);
        
        // Invalid inputs should throw errors
        expect(() => nodeRng(0)).toThrowError();
        expect(() => nodeRng(-1)).toThrowError();
        expect(() => nodeRng(1.5)).toThrowError();
      }
      
      if (browserCrypto) {
        const browserRng = createBrowserRNG(browserCrypto);
        
        // Invalid inputs should throw errors
        expect(() => browserRng(0)).toThrowError();
        expect(() => browserRng(-1)).toThrowError();
        expect(() => browserRng(1.5)).toThrowError();
      }
    });
  });
  
  describe('Type Accuracy Across Environments', () => {
    it('should accurately type Node.js crypto operations', () => {
      const crypto = getNodeCrypto();
      
      if (!crypto) {
        pending('Node.js crypto not available');
        return;
      }
      
      // Property: Type annotations should accurately reflect runtime behavior
      for (let i = 0; i < PROPERTY_TEST_ITERATIONS; i++) {
        const size = 1 + (i % 64);
        const buffer = crypto.randomBytes(size);
        
        // TypeScript types should match runtime types
        expect(buffer).toBeDefined();
        expect(buffer.length).toBe(size);
        expect(typeof buffer.toString).toBe('function');
        expect(typeof buffer.readUInt8).toBe('function');
      }
    });
    
    it('should accurately type browser crypto operations', () => {
      const crypto = getBrowserCrypto();
      
      if (!crypto) {
        pending('Browser crypto not available');
        return;
      }
      
      // Property: Type annotations should accurately reflect runtime behavior
      for (let i = 0; i < PROPERTY_TEST_ITERATIONS; i++) {
        const size = 1 + (i % 64);
        const array = new Uint32Array(size);
        const result = crypto.getRandomValues(array);
        
        // TypeScript types should match runtime types
        expect(result).toBe(array); // Should return the same array
        expect(result.length).toBe(size);
        expect(result.constructor.name).toBe('Uint32Array');
        
        // Values should be filled with random data
        let hasNonZero = false;
        for (let j = 0; j < result.length; j++) {
          if (result[j] !== 0) {
            hasNonZero = true;
            break;
          }
        }
        expect(hasNonZero).toBe(true);
      }
    });
  });
});
