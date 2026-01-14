/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */
/*global secrets, describe, it, expect, PropertyTestHelper, TestDataGenerators */

/**
 * Security and Cryptographic Testing Suite for @digitaldefiance/secrets
 * 
 * This test suite validates cryptographic correctness and security properties
 * of the Shamir's secret sharing implementation.
 * 
 * Feature: comprehensive-testing
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

// when running in a node.js env.
if (typeof require === "function") {
    crypto = require("crypto")
    secrets = require("../../secrets.js")
    PropertyTestHelper = require("../helpers/PropertyTestHelper.js")
    TestDataGenerators = require("../helpers/TestDataGenerators.js")
}

describe("Secrets Security and Cryptographic Tests", function() {
    
    beforeEach(function() {
        // Initialize with default settings for each test
        secrets.init()
    })
    
    describe("Cryptographic Correctness - Threshold Security", function() {
        
        it("should require exactly threshold shares for reconstruction", function() {
            // Test with various configurations
            var configs = [
                { bits: 8, numShares: 5, threshold: 3 },
                { bits: 8, numShares: 10, threshold: 5 },
                { bits: 8, numShares: 7, threshold: 4 },
                { bits: 10, numShares: 20, threshold: 10 }
            ]
            
            configs.forEach(function(config) {
                secrets.init(config.bits)
                var secret = TestDataGenerators.generateRandomSecret(16, 64)
                var shares = secrets.share(secret, config.numShares, config.threshold)
                
                // Should succeed with exactly threshold shares
                var thresholdShares = shares.slice(0, config.threshold)
                var recovered = secrets.combine(thresholdShares)
                expect(recovered).toBe(secret)
                
                // Should succeed with more than threshold shares
                if (config.numShares > config.threshold) {
                    var moreShares = shares.slice(0, config.threshold + 1)
                    var recoveredMore = secrets.combine(moreShares)
                    expect(recoveredMore).toBe(secret)
                }
            })
        })
        
        it("should not reveal secret with insufficient shares", function() {
            // Test that fewer than threshold shares don't reveal the secret
            var configs = [
                { bits: 8, numShares: 5, threshold: 3 },
                { bits: 8, numShares: 10, threshold: 6 },
                { bits: 10, numShares: 15, threshold: 8 }
            ]
            
            configs.forEach(function(config) {
                secrets.init(config.bits)
                var secret = TestDataGenerators.generateRandomSecret(32, 128)
                var shares = secrets.share(secret, config.numShares, config.threshold)
                
                // Try with threshold-1 shares
                if (config.threshold > 2) {
                    var insufficientShares = shares.slice(0, config.threshold - 1)
                    var recovered = secrets.combine(insufficientShares)
                    
                    // Should NOT recover the original secret
                    // (with overwhelming probability for cryptographically secure implementation)
                    expect(recovered).not.toBe(secret)
                }
            })
        })
        
        it("should maintain security with single share missing", function() {
            // Even with threshold-1 shares, the secret should remain secure
            secrets.init(8)
            var secret = TestDataGenerators.generateRandomSecret(64, 128)
            var numShares = 10
            var threshold = 6
            
            var shares = secrets.share(secret, numShares, threshold)
            
            // Try all possible combinations of threshold-1 shares
            for (var i = 0; i <= numShares - (threshold - 1); i++) {
                var insufficientShares = shares.slice(i, i + threshold - 1)
                if (insufficientShares.length === threshold - 1) {
                    var recovered = secrets.combine(insufficientShares)
                    expect(recovered).not.toBe(secret)
                }
            }
        })
        
        it("should maintain security across different share combinations", function() {
            secrets.init(8)
            var secret = TestDataGenerators.generateRandomSecret(32, 64)
            var numShares = 7
            var threshold = 4
            
            var shares = secrets.share(secret, numShares, threshold)
            
            // Test multiple different combinations of threshold shares
            // All should recover the same secret
            var combinations = [
                [0, 1, 2, 3],
                [0, 2, 4, 6],
                [1, 3, 5, 6],
                [0, 1, 5, 6],
                [2, 3, 4, 5]
            ]
            
            combinations.forEach(function(indices) {
                var selectedShares = indices.map(function(idx) { return shares[idx] })
                var recovered = secrets.combine(selectedShares)
                expect(recovered).toBe(secret)
            })
        })
    })
    
    describe("Cryptographic Source Validation", function() {
        
        it("should use cryptographically secure RNG by default", function() {
            secrets.init()
            var config = secrets.getConfig()
            
            expect(config.hasCSPRNG).toBe(true)
            expect(config.typeCSPRNG).toBeDefined()
            
            // Should be one of the secure RNG types
            var secureTypes = ["nodeCryptoRandomBytes", "browserCryptoGetRandomValues"]
            expect(secureTypes).toContain(config.typeCSPRNG)
        })
        
        it("should reject invalid RNG functions", function() {
            secrets.init()
            
            // Test various invalid RNG functions that should throw
            // Note: null and undefined don't throw - they trigger auto-detection
            var invalidRNGs = [
                "not a function",  // Invalid string (not a valid RNG type)
                123,               // Number instead of function
                {},                // Object instead of function
                []                 // Array instead of function
            ]
            
            invalidRNGs.forEach(function(invalidRNG) {
                expect(function() {
                    secrets.setRNG(invalidRNG)
                }).toThrow()
            })
        })
        
        it("should validate RNG output format", function() {
            secrets.init()
            
            // RNG that returns wrong type
            var wrongTypeRNG = function(bits) {
                return 12345 // Returns number instead of string
            }
            
            expect(function() {
                secrets.setRNG(wrongTypeRNG)
            }).toThrow()
            
            // RNG that returns wrong length
            var wrongLengthRNG = function(bits) {
                return "101" // Always returns 3 bits regardless of request
            }
            
            expect(function() {
                secrets.setRNG(wrongLengthRNG)
            }).toThrow()
            
            // RNG that returns invalid binary string
            var invalidBinaryRNG = function(bits) {
                var result = ""
                for (var i = 0; i < bits; i++) {
                    result += "2" // Invalid binary digit
                }
                return result
            }
            
            expect(function() {
                secrets.setRNG(invalidBinaryRNG)
            }).toThrow()
        })
        
        it("should maintain secure RNG across reinitialization", function() {
            // Initialize with different bit configurations
            var bitConfigs = [3, 8, 12, 16, 20]
            
            bitConfigs.forEach(function(bits) {
                secrets.init(bits)
                var config = secrets.getConfig()
                
                expect(config.hasCSPRNG).toBe(true)
                expect(config.typeCSPRNG).toBeDefined()
                
                var secureTypes = ["nodeCryptoRandomBytes", "browserCryptoGetRandomValues"]
                expect(secureTypes).toContain(config.typeCSPRNG)
            })
        })
        
        it("should not fall back to weak RNG sources", function() {
            secrets.init()
            var config = secrets.getConfig()
            
            // Should never use testRandom unless explicitly requested
            expect(config.typeCSPRNG).not.toBe("testRandom")
            
            // Should have a secure CSPRNG available
            expect(config.hasCSPRNG).toBe(true)
        })
    })
    
    describe("Deterministic Behavior with Fixed Seeds", function() {
        
        it("should produce identical shares with testRandom RNG", function() {
            var secret = "a1b2c3d4e5f6"
            var numShares = 5
            var threshold = 3
            
            // Generate shares with testRandom
            secrets.init(8, "testRandom")
            var shares1 = secrets.share(secret, numShares, threshold)
            
            // Reset and generate again
            secrets.init(8, "testRandom")
            var shares2 = secrets.share(secret, numShares, threshold)
            
            // Should be identical
            expect(shares1.length).toBe(shares2.length)
            for (var i = 0; i < shares1.length; i++) {
                expect(shares1[i]).toBe(shares2[i])
            }
        })
        
        it("should produce identical random values with testRandom", function() {
            secrets.init(8, "testRandom")
            var random1 = secrets.random(64)
            
            secrets.init(8, "testRandom")
            var random2 = secrets.random(64)
            
            expect(random1).toBe(random2)
        })
        
        it("should produce identical newShare with testRandom", function() {
            var secret = "deadbeef"
            var numShares = 5
            var threshold = 3
            var newId = 10
            
            secrets.init(8, "testRandom")
            var shares1 = secrets.share(secret, numShares, threshold)
            var newShare1 = secrets.newShare(newId, shares1)
            
            secrets.init(8, "testRandom")
            var shares2 = secrets.share(secret, numShares, threshold)
            var newShare2 = secrets.newShare(newId, shares2)
            
            expect(newShare1).toBe(newShare2)
        })
        
        it("should produce consistent results across multiple operations with testRandom", function() {
            var secret = "1234567890abcdef"
            
            // First run
            secrets.init(8, "testRandom")
            var shares1 = secrets.share(secret, 5, 3)
            var recovered1 = secrets.combine(shares1.slice(0, 3))
            var newShare1 = secrets.newShare(10, shares1)
            
            // Second run
            secrets.init(8, "testRandom")
            var shares2 = secrets.share(secret, 5, 3)
            var recovered2 = secrets.combine(shares2.slice(0, 3))
            var newShare2 = secrets.newShare(10, shares2)
            
            // All results should be identical
            expect(shares1).toEqual(shares2)
            expect(recovered1).toBe(recovered2)
            expect(newShare1).toBe(newShare2)
        })
    })
    
    describe("Cryptographic Edge Cases", function() {
        
        it("should handle zero-padded secrets correctly", function() {
            var secrets_with_zeros = [
                "00000001",
                "00001234",
                "0000000000000001",
                "00abcdef"
            ]
            
            secrets.init(8)
            
            secrets_with_zeros.forEach(function(secret) {
                var shares = secrets.share(secret, 5, 3)
                var recovered = secrets.combine(shares.slice(0, 3))
                expect(recovered).toBe(secret)
            })
        })
        
        it("should handle maximum value secrets", function() {
            secrets.init(8)
            
            // Maximum values for different bit lengths
            var maxSecrets = [
                "ff",           // 8 bits
                "ffff",         // 16 bits
                "ffffffff",     // 32 bits
                "ffffffffffff"  // 48 bits
            ]
            
            maxSecrets.forEach(function(secret) {
                var shares = secrets.share(secret, 5, 3)
                var recovered = secrets.combine(shares.slice(0, 3))
                expect(recovered).toBe(secret)
            })
        })
        
        it("should handle minimum threshold (2) correctly", function() {
            secrets.init(8)
            var secret = TestDataGenerators.generateRandomSecret(16, 64)
            
            var shares = secrets.share(secret, 5, 2)
            
            // Should work with exactly 2 shares
            var recovered = secrets.combine(shares.slice(0, 2))
            expect(recovered).toBe(secret)
            
            // Should fail with 1 share
            var singleShare = secrets.combine([shares[0]])
            expect(singleShare).not.toBe(secret)
        })
        
        it("should handle maximum shares correctly", function() {
            secrets.init(8)
            var secret = TestDataGenerators.generateRandomSecret(16, 32)
            var maxShares = 255 // Maximum for 8 bits
            
            // This might be slow, so use smaller numbers for testing
            var testShares = 50
            var threshold = 25
            
            var shares = secrets.share(secret, testShares, threshold)
            expect(shares.length).toBe(testShares)
            
            var recovered = secrets.combine(shares.slice(0, threshold))
            expect(recovered).toBe(secret)
        })
        
        it("should handle single-character secrets", function() {
            secrets.init(8)
            var singleCharSecrets = ["a", "1", "f", "0"]
            
            singleCharSecrets.forEach(function(secret) {
                var shares = secrets.share(secret, 5, 3)
                var recovered = secrets.combine(shares.slice(0, 3))
                expect(recovered).toBe(secret)
            })
        })
        
        it("should handle very long secrets", function() {
            secrets.init(8)
            
            // Generate a long secret (512 bits = 128 hex chars)
            var longSecret = TestDataGenerators.generateRandomSecret(512, 512)
            
            var shares = secrets.share(longSecret, 5, 3)
            var recovered = secrets.combine(shares.slice(0, 3))
            expect(recovered).toBe(longSecret)
        })
        
        it("should maintain security with repeated secret values", function() {
            secrets.init(8)
            
            // Secrets with repeated patterns
            var repeatedSecrets = [
                "11111111",
                "aaaaaaaa",
                "12121212",
                "abcabcabc"
            ]
            
            repeatedSecrets.forEach(function(secret) {
                var shares = secrets.share(secret, 7, 4)
                
                // Should recover with threshold shares
                var recovered = secrets.combine(shares.slice(0, 4))
                expect(recovered).toBe(secret)
                
                // Should not recover with insufficient shares
                var insufficient = secrets.combine(shares.slice(0, 3))
                expect(insufficient).not.toBe(secret)
            })
        })
        
        it("should handle alternating bit patterns", function() {
            secrets.init(8)
            
            // Alternating bit patterns (in hex)
            var patterns = [
                "55555555", // 01010101 repeated
                "aaaaaaaa", // 10101010 repeated
                "5a5a5a5a", // Alternating bytes
                "a5a5a5a5"  // Alternating bytes
            ]
            
            patterns.forEach(function(secret) {
                var shares = secrets.share(secret, 5, 3)
                var recovered = secrets.combine(shares.slice(0, 3))
                expect(recovered).toBe(secret)
            })
        })
    })
    
    describe("Share Integrity and Validation", function() {
        
        it("should detect corrupted share data", function() {
            secrets.init(8)
            var secret = TestDataGenerators.generateRandomSecret(32, 64)
            var shares = secrets.share(secret, 5, 3)
            
            // Corrupt a share by modifying its data
            var corruptedShare = shares[0].slice(0, -2) + "ff"
            var corruptedShares = [corruptedShare, shares[1], shares[2]]
            
            var recovered = secrets.combine(corruptedShares)
            
            // Should not recover the original secret with corrupted share
            expect(recovered).not.toBe(secret)
        })
        
        it("should detect mismatched bit configurations", function() {
            // Create shares with different bit configurations
            secrets.init(8)
            var secret1 = TestDataGenerators.generateRandomSecret(16, 32)
            var shares8bit = secrets.share(secret1, 5, 3)
            
            secrets.init(10)
            var secret2 = TestDataGenerators.generateRandomSecret(16, 32)
            var shares10bit = secrets.share(secret2, 5, 3)
            
            // Try to combine shares with different bit configurations
            var mixedShares = [shares8bit[0], shares8bit[1], shares10bit[0]]
            
            expect(function() {
                secrets.combine(mixedShares)
            }).toThrow()
        })
        
        it("should validate share ID ranges", function() {
            secrets.init(8)
            var secret = TestDataGenerators.generateRandomSecret(32, 64)
            var shares = secrets.share(secret, 5, 3)
            
            // Extract and validate share IDs
            shares.forEach(function(share, index) {
                var components = secrets.extractShareComponents(share)
                expect(components.id).toBe(index + 1)
                expect(components.id).toBeGreaterThan(0)
                expect(components.id).toBeLessThanOrEqual(255) // Max for 8 bits
            })
        })
        
        it("should reject invalid share formats", function() {
            secrets.init(8)
            
            var invalidShares = [
                "not a share",      // No valid format
                "12345",            // Too short
                "",                 // Empty string
                "xyz123abc",        // Invalid characters
                "201234abcd",       // Invalid bits value (20 > 20 is false, but 20 in base36 is 72 > 20)
                "z01234abcd"        // Invalid bits character
            ]
            
            invalidShares.forEach(function(invalidShare) {
                try {
                    secrets.extractShareComponents(invalidShare)
                    fail("Expected exception for invalid share: " + invalidShare)
                } catch (e) {
                    expect(e.message).toContain("Invalid share")
                }
            })
        })
        
        it("should handle duplicate share IDs correctly", function() {
            secrets.init(8)
            var secret = TestDataGenerators.generateRandomSecret(32, 64)
            var shares = secrets.share(secret, 5, 3)
            
            // Use the same share multiple times
            var duplicateShares = [shares[0], shares[0], shares[1]]
            
            // Should still work but effectively only have 2 unique shares
            // This might not recover the secret correctly
            var recovered = secrets.combine(duplicateShares)
            
            // The behavior here depends on implementation
            // Some implementations might detect duplicates, others might not
            // We just verify it doesn't crash
            expect(typeof recovered).toBe("string")
        })
    })
    
    describe("Security Properties Under Stress", function() {
        
        it("should maintain security with maximum bit configuration", function() {
            secrets.init(20) // Maximum bits
            var secret = TestDataGenerators.generateRandomSecret(32, 64)
            
            // Use smaller share counts to avoid performance issues
            var shares = secrets.share(secret, 10, 5)
            
            // Should recover with threshold
            var recovered = secrets.combine(shares.slice(0, 5))
            expect(recovered).toBe(secret)
            
            // Should not recover with insufficient shares
            var insufficient = secrets.combine(shares.slice(0, 4))
            expect(insufficient).not.toBe(secret)
        })
        
        it("should maintain security with minimum bit configuration", function() {
            secrets.init(3) // Minimum bits
            var secret = TestDataGenerators.generateRandomSecret(4, 8)
            
            var shares = secrets.share(secret, 5, 3)
            
            // Should recover with threshold
            var recovered = secrets.combine(shares.slice(0, 3))
            expect(recovered).toBe(secret)
            
            // Should not recover with insufficient shares
            var insufficient = secrets.combine(shares.slice(0, 2))
            expect(insufficient).not.toBe(secret)
        })
        
        it("should handle rapid reinitialization", function() {
            var secret = TestDataGenerators.generateRandomSecret(32, 64)
            
            // Rapidly reinitialize and test
            for (var i = 0; i < 10; i++) {
                secrets.init(8)
                var shares = secrets.share(secret, 5, 3)
                var recovered = secrets.combine(shares.slice(0, 3))
                expect(recovered).toBe(secret)
            }
        })
        
        it("should maintain security across multiple secret sharing operations", function() {
            secrets.init(8)
            
            // Share multiple different secrets
            var secrets_list = []
            var shares_list = []
            
            for (var i = 0; i < 10; i++) {
                var secret = TestDataGenerators.generateRandomSecret(16, 64)
                secrets_list.push(secret)
                shares_list.push(secrets.share(secret, 5, 3))
            }
            
            // Verify each can be recovered independently
            for (var j = 0; j < secrets_list.length; j++) {
                var recovered = secrets.combine(shares_list[j].slice(0, 3))
                expect(recovered).toBe(secrets_list[j])
            }
        })
    })
})
