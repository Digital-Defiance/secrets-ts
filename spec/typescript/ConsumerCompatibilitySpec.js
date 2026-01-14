/**
 * Consumer Compatibility Test Suite
 * 
 * Feature: typescript-conversion
 * 
 * This test suite validates that the TypeScript-compiled library works
 * seamlessly for both TypeScript and JavaScript consumers, mimicking
 * real-world usage patterns.
 * 
 * Requirements validated:
 * - 6.1: Identical public API behavior for all consumers
 * - 6.5: Migration is seamless for existing users
 */

const secrets = require('../../dist/secrets');

describe('Consumer Compatibility', function() {
  beforeEach(function() {
    secrets.init();
  });

  describe('JavaScript Consumer Patterns', function() {
    it('should work with CommonJS require', function() {
      expect(secrets).toBeDefined();
      expect(typeof secrets.init).toBe('function');
      expect(typeof secrets.share).toBe('function');
      expect(typeof secrets.combine).toBe('function');
    });

    it('should support typical JavaScript usage pattern', function() {
      var mySecret = 'my secret password';
      var hexSecret = secrets.str2hex(mySecret);
      var shares = secrets.share(hexSecret, 6, 3);
      var recovered = secrets.combine(shares.slice(0, 3));
      var originalSecret = secrets.hex2str(recovered);
      
      expect(originalSecret).toBe(mySecret);
    });

    it('should work with JavaScript class pattern', function() {
      function SecretSharer() {
        this.lib = secrets;
      }
      
      SecretSharer.prototype.share = function(secret, numShares, threshold) {
        var hex = this.lib.str2hex(secret);
        return this.lib.share(hex, numShares, threshold);
      };
      
      SecretSharer.prototype.combine = function(shares) {
        var hex = this.lib.combine(shares);
        return this.lib.hex2str(hex);
      };
      
      var sharer = new SecretSharer();
      var shares = sharer.share('test', 5, 3);
      var recovered = sharer.combine(shares.slice(0, 3));
      
      expect(recovered).toBe('test');
    });
  });

  describe('Real-World Usage Scenarios', function() {
    it('should support password sharing scenario', function() {
      var password = 'SuperSecretPassword123!';
      var hexPassword = secrets.str2hex(password);
      var shares = secrets.share(hexPassword, 5, 3);
      
      var teamMembers = [
        { name: 'Alice', share: shares[0] },
        { name: 'Bob', share: shares[1] },
        { name: 'Charlie', share: shares[2] },
        { name: 'David', share: shares[3] },
        { name: 'Eve', share: shares[4] }
      ];
      
      var threeShares = [
        teamMembers[0].share,
        teamMembers[2].share,
        teamMembers[4].share
      ];
      
      var recoveredHex = secrets.combine(threeShares);
      var recoveredPassword = secrets.hex2str(recoveredHex);
      
      expect(recoveredPassword).toBe(password);
    });

    it('should support API key distribution scenario', function() {
      var apiKey = 'sk_live_1234567890abcdef';
      var hexKey = secrets.str2hex(apiKey);
      var shares = secrets.share(hexKey, 3, 2);
      
      var services = {
        frontend: shares[0],
        backend: shares[1],
        database: shares[2]
      };
      
      var recoveredHex = secrets.combine([services.frontend, services.backend]);
      var recoveredKey = secrets.hex2str(recoveredHex);
      
      expect(recoveredKey).toBe(apiKey);
    });

    it('should support dynamic share generation', function() {
      var secret = secrets.str2hex('original secret');
      var originalShares = secrets.share(secret, 5, 3);
      var newShare = secrets.newShare(6, originalShares);
      
      var recoveredHex = secrets.combine([
        originalShares[0],
        originalShares[1],
        newShare
      ]);
      
      expect(recoveredHex).toBe(secret);
    });

    it('should support batch secret processing', function() {
      var secretsList = [
        'database-password',
        'api-key',
        'encryption-key',
        'signing-key',
        'admin-token'
      ];
      
      var allShares = secretsList.map(function(secret) {
        var hex = secrets.str2hex(secret);
        return {
          original: secret,
          shares: secrets.share(hex, 5, 3)
        };
      });
      
      allShares.forEach(function(item) {
        var recoveredHex = secrets.combine(item.shares.slice(0, 3));
        var recovered = secrets.hex2str(recoveredHex);
        expect(recovered).toBe(item.original);
      });
    });
  });

  describe('Migration Scenarios', function() {
    it('should work with existing JavaScript code without changes', function() {
      var mySecret = 'old javascript code';
      var hex = secrets.str2hex(mySecret);
      var shares = secrets.share(hex, 5, 3);
      var recovered = secrets.combine(shares.slice(0, 3));
      var original = secrets.hex2str(recovered);
      
      expect(original).toBe(mySecret);
    });

    it('should maintain compatibility with old error handling', function() {
      try {
        secrets.share('invalid', 1, 2);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e.message).toContain('Number of shares must be an integer');
      }
    });

    it('should work with old configuration patterns', function() {
      secrets.init(8);
      var config = secrets.getConfig();
      
      expect(config.bits).toBe(8);
      expect(config.radix).toBe(16);
    });
  });

  describe('Error Handling Compatibility', function() {
    it('should maintain error types for JavaScript consumers', function() {
      try {
        secrets.init(2);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e instanceof Error).toBe(true);
        expect(e.message).toContain('Number of bits must be an integer');
      }
    });

    it('should support try-catch patterns', function() {
      var jsError = null;
      try {
        secrets.share(123, 5, 3);
      } catch (e) {
        jsError = e;
      }
      expect(jsError).not.toBeNull();
    });
  });
});
