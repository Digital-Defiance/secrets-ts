/**
 * Backward Compatibility Test Suite
 *
 * Feature: typescript-conversion
 *
 * This test suite validates that the TypeScript conversion maintains 100%
 * backward compatibility with the original JavaScript implementation.
 *
 * Requirements validated:
 * - 6.1: Identical public API behavior after TypeScript conversion
 * - 6.2: JavaScript output functionally equivalent to original
 * - 6.3: Same error messages and error types
 * - 6.4: All configuration options maintain identical behavior
 */

// Import the compiled TypeScript library
const secrets = require("../../dist/secrets");

describe("Backward Compatibility Validation", () => {
  beforeEach(() => {
    // Initialize with default settings for each test
    secrets.init();
  });

  describe("API Signature Compatibility", () => {
    it("should expose all expected public methods", () => {
      expect(typeof secrets.init).toBe("function");
      expect(typeof secrets.share).toBe("function");
      expect(typeof secrets.combine).toBe("function");
      expect(typeof secrets.newShare).toBe("function");
      expect(typeof secrets.getConfig).toBe("function");
      expect(typeof secrets.extractShareComponents).toBe("function");
      expect(typeof secrets.setRNG).toBe("function");
      expect(typeof secrets.str2hex).toBe("function");
      expect(typeof secrets.hex2str).toBe("function");
      expect(typeof secrets.random).toBe("function");
    });

    it("should expose all private methods for testing", () => {
      expect(typeof secrets._reset).toBe("function");
      expect(typeof secrets._padLeft).toBe("function");
      expect(typeof secrets._hex2bin).toBe("function");
      expect(typeof secrets._bin2hex).toBe("function");
      expect(typeof secrets._bytesToHex).toBe("function");
      expect(typeof secrets._hasCryptoGetRandomValues).toBe("function");
      expect(typeof secrets._hasCryptoRandomBytes).toBe("function");
      expect(typeof secrets._getRNG).toBe("function");
      expect(typeof secrets._isSetRNG).toBe("function");
      expect(typeof secrets._splitNumStringToIntArray).toBe("function");
      expect(typeof secrets._horner).toBe("function");
      expect(typeof secrets._lagrange).toBe("function");
      expect(typeof secrets._getShares).toBe("function");
      expect(typeof secrets._constructPublicShareString).toBe("function");
    });
  });

  describe("Basic Usage Patterns", () => {
    it("should support basic share and combine workflow", () => {
      const secret = "abc123";
      const hexSecret = secrets.str2hex(secret);
      const shares = secrets.share(hexSecret, 5, 3);

      expect(shares).toBeDefined();
      expect(shares.length).toBe(5);

      const reconstructed = secrets.combine(shares.slice(0, 3));
      const originalSecret = secrets.hex2str(reconstructed);

      expect(originalSecret).toBe(secret);
    });

    it("should support initialization with custom bits", () => {
      secrets.init(8);
      const config = secrets.getConfig();
      expect(config.bits).toBe(8);
      expect(config.maxShares).toBe(255);
    });

    it("should support initialization with RNG type", () => {
      secrets.init(8, "testRandom");
      const config = secrets.getConfig();
      expect(config.typeCSPRNG).toBe("testRandom");
    });

    it("should support string to hex conversion", () => {
      const result = secrets.str2hex("hello");
      expect(typeof result).toBe("string");
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it("should support hex to string conversion", () => {
      const hex = secrets.str2hex("world");
      const result = secrets.hex2str(hex);
      expect(result).toBe("world");
    });

    it("should support random number generation", () => {
      const random = secrets.random(128);
      expect(typeof random).toBe("string");
      expect(random).toMatch(/^[0-9a-f]+$/);
    });

    it("should support extracting share components", () => {
      const secret = secrets.str2hex("test");
      const shares = secrets.share(secret, 3, 2);
      const components = secrets.extractShareComponents(shares[0]);

      expect(components).toBeDefined();
      expect(typeof components.bits).toBe("number");
      expect(typeof components.id).toBe("number");
      expect(typeof components.data).toBe("string");
    });

    it("should support creating new shares", () => {
      const secret = secrets.str2hex("test");
      const shares = secrets.share(secret, 3, 2);
      const newShare = secrets.newShare(4, shares);

      expect(newShare).toBeDefined();
      expect(typeof newShare).toBe("string");

      // Verify the new share works
      const reconstructed = secrets.combine([shares[0], newShare]);
      expect(reconstructed).toBe(secret);
    });
  });

  describe("Configuration Options Compatibility", () => {
    it("should maintain default configuration values", () => {
      secrets.init();
      const config = secrets.getConfig();

      expect(config.bits).toBe(8);
      expect(config.radix).toBe(16);
      expect(config.maxShares).toBe(255);
      expect(config.hasCSPRNG).toBe(true);
    });

    it("should support all valid bit sizes (3-20)", () => {
      for (let bits = 3; bits <= 20; bits++) {
        expect(() => secrets.init(bits)).not.toThrow();
        const config = secrets.getConfig();
        expect(config.bits).toBe(bits);
        expect(config.maxShares).toBe(Math.pow(2, bits) - 1);
      }
    });

    it("should support custom RNG functions", () => {
      const customRNG = (bits: number): string => {
        let result = "";
        for (let i = 0; i < bits; i++) {
          result += Math.random() < 0.5 ? "0" : "1";
        }
        return result;
      };

      expect(() => secrets.setRNG(customRNG)).not.toThrow();
      expect(secrets.getConfig().hasCSPRNG).toBe(true);
    });

    it("should support all CSPRNG types", () => {
      const types = ["nodeCryptoRandomBytes", "browserCryptoGetRandomValues", "testRandom"];

      types.forEach((type) => {
        expect(() => secrets.init(8, type)).not.toThrow();
      });
    });
  });

  describe("Error Message Compatibility", () => {
    it("should throw identical error for invalid bits in init", () => {
      expect(() => secrets.init(2)).toThrow(
        "Number of bits must be an integer between 3 and 20, inclusive."
      );
      expect(() => secrets.init(21)).toThrow(
        "Number of bits must be an integer between 3 and 20, inclusive."
      );
      expect(() => secrets.init(3.5)).toThrow(
        "Number of bits must be an integer between 3 and 20, inclusive."
      );
    });

    it("should throw identical error for invalid RNG type", () => {
      expect(() => secrets.init(8, "invalidType")).toThrow(
        "Invalid RNG type argument : 'invalidType'"
      );
    });

    it("should throw identical error for invalid secret type in share", () => {
      expect(() => secrets.share(123 as any, 5, 3)).toThrow("Secret must be a string.");
    });

    it("should throw identical error for invalid numShares", () => {
      const secret = secrets.str2hex("test");
      expect(() => secrets.share(secret, 1, 2)).toThrow(
        /Number of shares must be an integer between 2 and/
      );
      expect(() => secrets.share(secret, 3.5, 2)).toThrow(
        /Number of shares must be an integer between 2 and/
      );
    });

    it("should throw identical error for invalid threshold", () => {
      const secret = secrets.str2hex("test");
      expect(() => secrets.share(secret, 5, 1)).toThrow(
        /Threshold number of shares must be an integer between 2 and/
      );
      expect(() => secrets.share(secret, 5, 6)).toThrow(
        /Threshold number of shares was 6 but must be less than or equal to/
      );
    });

    it("should throw identical error for too many shares", () => {
      secrets.init(8); // maxShares = 255
      const secret = secrets.str2hex("test");
      expect(() => secrets.share(secret, 256, 3)).toThrow(
        /Number of shares must be an integer between 2 and 255/
      );
    });

    it("should throw identical error for invalid hex character", () => {
      expect(() => secrets._hex2bin("xyz")).toThrow("Invalid hex character.");
    });

    it("should throw identical error for invalid binary character", () => {
      expect(() => secrets._bin2hex("012")).toThrow("Invalid binary character.");
    });

    it("should throw identical error for invalid str2hex input", () => {
      expect(() => secrets.str2hex(123 as any)).toThrow("Input must be a character string.");
    });

    it("should throw identical error for invalid hex2str input", () => {
      expect(() => secrets.hex2str(123 as any)).toThrow("Input must be a hexadecimal string.");
    });

    it("should throw identical error for invalid bytesPerChar", () => {
      expect(() => secrets.str2hex("test", 0)).toThrow(
        "Bytes per character must be an integer between 1 and 6, inclusive."
      );
      expect(() => secrets.str2hex("test", 7)).toThrow(
        "Bytes per character must be an integer between 1 and 6, inclusive."
      );
    });

    it("should throw identical error for invalid share format", () => {
      expect(() => secrets.extractShareComponents("invalid")).toThrow(
        /The share data provided is invalid/
      );
    });

    it("should throw identical error for mismatched share bits", () => {
      secrets.init(8);
      const shares1 = secrets.share(secrets.str2hex("test"), 3, 2);
      secrets.init(10);
      const shares2 = secrets.share(secrets.str2hex("test"), 3, 2);

      expect(() => secrets.combine([shares1[0], shares2[0]])).toThrow(
        "Mismatched shares: Different bit settings."
      );
    });

    it("should throw identical error for invalid random bits", () => {
      expect(() => secrets.random(1)).toThrow(
        "Number of bits must be an Integer between 1 and 65536."
      );
      expect(() => secrets.random(65537)).toThrow(
        "Number of bits must be an Integer between 1 and 65536."
      );
    });

    it("should throw identical error for invalid padding", () => {
      expect(() => secrets._padLeft("test", 2000)).toThrow(
        "Padding must be multiples of no larger than 1024 bits."
      );
    });

    it("should throw identical error for invalid share ID", () => {
      expect(() => secrets._constructPublicShareString(8, 0, "abc")).toThrow(
        /Share id must be an integer between 1 and/
      );
      expect(() => secrets._constructPublicShareString(8, 256, "abc")).toThrow(
        /Share id must be an integer between 1 and/
      );
    });
  });

  describe("Edge Cases and Special Behaviors", () => {
    it("should handle empty string conversion", () => {
      const hex = secrets.str2hex("");
      expect(hex).toBe("");
      const str = secrets.hex2str("");
      expect(str).toBe("");
    });

    it("should handle single character secrets", () => {
      const secret = secrets.str2hex("a");
      const shares = secrets.share(secret, 3, 2);
      const reconstructed = secrets.combine(shares.slice(0, 2));
      expect(reconstructed).toBe(secret);
    });

    it("should handle long secrets", () => {
      const longString = "a".repeat(1000);
      const secret = secrets.str2hex(longString);
      const shares = secrets.share(secret, 5, 3);
      const reconstructed = secrets.combine(shares.slice(0, 3));
      const original = secrets.hex2str(reconstructed);
      expect(original).toBe(longString);
    });

    it("should handle special characters in secrets", () => {
      const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
      const secret = secrets.str2hex(specialChars);
      const shares = secrets.share(secret, 3, 2);
      const reconstructed = secrets.combine(shares.slice(0, 2));
      const original = secrets.hex2str(reconstructed);
      expect(original).toBe(specialChars);
    });

    it("should handle unicode characters", () => {
      const unicode = "你好世界🌍";
      const secret = secrets.str2hex(unicode, 3);
      const shares = secrets.share(secret, 3, 2);
      const reconstructed = secrets.combine(shares.slice(0, 2));
      const original = secrets.hex2str(reconstructed, 3);
      expect(original).toBe(unicode);
    });

    it("should handle minimum threshold (2)", () => {
      const secret = secrets.str2hex("test");
      const shares = secrets.share(secret, 2, 2);
      expect(shares.length).toBe(2);
      const reconstructed = secrets.combine(shares);
      expect(reconstructed).toBe(secret);
    });

    it("should handle maximum shares for 8 bits (255)", () => {
      secrets.init(8);
      const secret = secrets.str2hex("test");
      const shares = secrets.share(secret, 255, 2);
      expect(shares.length).toBe(255);
      const reconstructed = secrets.combine(shares.slice(0, 2));
      expect(reconstructed).toBe(secret);
    });

    it("should handle different bytesPerChar values", () => {
      for (let bytes = 1; bytes <= 6; bytes++) {
        const hex = secrets.str2hex("test", bytes);
        const str = secrets.hex2str(hex, bytes);
        expect(str).toBe("test");
      }
    });

    it("should handle custom padLength in share", () => {
      const secret = secrets.str2hex("test");
      const shares1 = secrets.share(secret, 3, 2, 0);
      const shares2 = secrets.share(secret, 3, 2, 256);

      expect(shares1.length).toBe(3);
      expect(shares2.length).toBe(3);

      const reconstructed1 = secrets.combine(shares1.slice(0, 2));
      const reconstructed2 = secrets.combine(shares2.slice(0, 2));

      expect(reconstructed1).toBe(secret);
      expect(reconstructed2).toBe(secret);
    });
  });

  describe("Functional Equivalence", () => {
    it("should produce deterministic results with testRandom", () => {
      secrets.init(8, "testRandom");
      const secret = secrets.str2hex("test");

      const shares1 = secrets.share(secret, 3, 2);
      secrets.init(8, "testRandom");
      const shares2 = secrets.share(secret, 3, 2);

      expect(shares1).toEqual(shares2);
    });

    it("should reconstruct secret from any threshold combination", () => {
      const secret = secrets.str2hex("test");
      const shares = secrets.share(secret, 5, 3);

      // Test all possible 3-share combinations
      const combinations = [
        [0, 1, 2],
        [0, 1, 3],
        [0, 1, 4],
        [0, 2, 3],
        [0, 2, 4],
        [0, 3, 4],
        [1, 2, 3],
        [1, 2, 4],
        [1, 3, 4],
        [2, 3, 4],
      ];

      combinations.forEach((combo) => {
        const subset = combo.map((i) => shares[i]);
        const reconstructed = secrets.combine(subset);
        expect(reconstructed).toBe(secret);
      });
    });

    it("should fail to reconstruct with insufficient shares", () => {
      const secret = secrets.str2hex("test");
      const shares = secrets.share(secret, 5, 3);

      // With only 2 shares (below threshold of 3), reconstruction should fail
      const reconstructed = secrets.combine(shares.slice(0, 2));
      expect(reconstructed).not.toBe(secret);
    });

    it("should maintain share independence", () => {
      const secret = secrets.str2hex("test");
      const shares = secrets.share(secret, 5, 3);

      // Each share should be unique
      const uniqueShares = new Set(shares);
      expect(uniqueShares.size).toBe(5);
    });

    it("should support share reuse in combine", () => {
      const secret = secrets.str2hex("test");
      const shares = secrets.share(secret, 5, 3);

      // Using the same share multiple times should still work
      const reconstructed = secrets.combine([shares[0], shares[0], shares[1], shares[2]]);
      expect(reconstructed).toBe(secret);
    });
  });

  describe("State Management", () => {
    it("should maintain independent state after init", () => {
      secrets.init(8);
      const config1 = secrets.getConfig();

      secrets.init(10);
      const config2 = secrets.getConfig();

      expect(config1.bits).toBe(8);
      expect(config2.bits).toBe(10);
    });

    it("should reset state on init", () => {
      secrets.init(8, "testRandom");
      const config1 = secrets.getConfig();
      expect(config1.typeCSPRNG).toBe("testRandom");

      secrets.init(8);
      const config2 = secrets.getConfig();
      expect(config2.typeCSPRNG).not.toBe("testRandom");
    });

    it("should preserve RNG across operations", () => {
      secrets.init(8, "testRandom");
      const secret = secrets.str2hex("test");
      secrets.share(secret, 3, 2);

      const config = secrets.getConfig();
      expect(config.typeCSPRNG).toBe("testRandom");
    });
  });

  describe("Cross-Version Compatibility", () => {
    it("should handle shares created with different bit settings", () => {
      // Create shares with 8 bits
      secrets.init(8);
      const secret8 = secrets.str2hex("test");
      const shares8 = secrets.share(secret8, 3, 2);

      // Create shares with 10 bits
      secrets.init(10);
      const secret10 = secrets.str2hex("test");
      const shares10 = secrets.share(secret10, 3, 2);

      // Each should reconstruct correctly
      const reconstructed8 = secrets.combine(shares8.slice(0, 2));
      expect(reconstructed8).toBe(secret8);

      const reconstructed10 = secrets.combine(shares10.slice(0, 2));
      expect(reconstructed10).toBe(secret10);
    });

    it("should auto-detect bit settings from shares", () => {
      secrets.init(8);
      const secret = secrets.str2hex("test");
      const shares = secrets.share(secret, 3, 2);

      // Change bit settings
      secrets.init(10);

      // Combine should auto-detect and use 8 bits
      const reconstructed = secrets.combine(shares.slice(0, 2));
      expect(reconstructed).toBe(secret);
    });
  });
});
