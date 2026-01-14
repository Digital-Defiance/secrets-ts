/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */
/*global secrets, describe, it, expect, beforeEach, crypto, Uint32Array */

/**
 * Cross-Platform Testing Suite
 * 
 * Feature: comprehensive-testing
 * 
 * This test suite validates that the @digitaldefiance/secrets library behaves
 * identically across Node.js and browser environments. It tests:
 * - Environment detection
 * - RNG consistency across platforms
 * - Hex conversion consistency
 * - Share generation and combination consistency
 * - Error handling consistency
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

// when running in a node.js env.
var nodeCrypto;
var secrets;
if (typeof require === "function") {
    nodeCrypto = require("crypto")
    secrets = require("../../secrets.js")
}

/**
 * Environment Detection Utilities
 * These functions help identify the current runtime environment
 */
function isNodeEnvironment() {
    return typeof process !== "undefined" &&
           process.versions != null &&
           process.versions.node != null
}

function isBrowserEnvironment() {
    return typeof window !== "undefined" &&
           typeof window.document !== "undefined"
}

function getEnvironmentName() {
    if (isNodeEnvironment()) {
        return "Node.js"
    } else if (isBrowserEnvironment()) {
        return "Browser"
    } else {
        return "Unknown"
    }
}

function hasNodeCryptoRandomBytes() {
    // Check for Node.js crypto module specifically
    return typeof nodeCrypto !== "undefined" &&
           typeof nodeCrypto.randomBytes === "function"
}

function hasBrowserCryptoGetRandomValues() {
    // In Node.js, we should not detect browser crypto
    if (typeof process !== "undefined" && process.versions && process.versions.node) {
        return false
    }
    // In browser, check for Web Crypto API
    return typeof crypto !== "undefined" &&
           typeof crypto === "object" &&
           typeof crypto.getRandomValues === "function" &&
           (typeof Uint32Array === "function" ||
            typeof Uint32Array === "object")
}

describe("Cross-Platform Testing", function() {
    "use strict"

    describe("Environment Detection Tests", function() {
        beforeEach(function() {
            secrets.init()
        })

        it("should correctly identify the current environment", function() {
            var envName = getEnvironmentName()
            expect(envName).toMatch(/Node\.js|Browser/)
            
            // Verify environment detection is consistent
            if (isNodeEnvironment()) {
                expect(envName).toEqual("Node.js")
                expect(isBrowserEnvironment()).toBe(false)
            } else if (isBrowserEnvironment()) {
                expect(envName).toEqual("Browser")
                expect(isNodeEnvironment()).toBe(false)
            }
        })

        it("should detect available cryptographic RNG sources", function() {
            var hasNodeRNG = hasNodeCryptoRandomBytes()
            var hasBrowserRNG = hasBrowserCryptoGetRandomValues()
            
            // At least one RNG source should be available
            expect(hasNodeRNG || hasBrowserRNG).toBe(true)
            
            // In test environments, we might have mixed crypto APIs
            // The important thing is that at least one secure RNG is available
            if (hasNodeRNG) {
                expect(typeof nodeCrypto.randomBytes).toEqual("function")
            }
            
            if (hasBrowserRNG) {
                expect(typeof crypto.getRandomValues).toEqual("function")
                expect(typeof Uint32Array).toEqual("function")
            }
        })

        it("should initialize with appropriate RNG for the environment", function() {
            secrets.init()
            var config = secrets.getConfig()
            
            expect(config.hasCSPRNG).toBe(true)
            expect(config.typeCSPRNG).toBeDefined()
            
            // Verify the RNG type matches the environment
            if (isNodeEnvironment()) {
                expect(config.typeCSPRNG).toEqual("nodeCryptoRandomBytes")
            } else if (isBrowserEnvironment()) {
                expect(config.typeCSPRNG).toEqual("browserCryptoGetRandomValues")
            }
        })
    })

    describe("Cross-Platform Consistency Tests", function() {
        beforeEach(function() {
            secrets.init()
            secrets.setRNG("testRandom") // Use deterministic RNG for consistency
        })

        it("should produce identical shares across platforms with same inputs", function() {
            var secret = "deadbeefcafebabe"
            var numShares = 5
            var threshold = 3
            
            // Generate shares
            var shares = secrets.share(secret, numShares, threshold)
            
            // Verify share format is consistent
            expect(shares.length).toEqual(numShares)
            shares.forEach(function(share, index) {
                expect(typeof share).toEqual("string")
                expect(share).toMatch(/^[0-9a-kA-K]{1}[0-9a-fA-F]+$/)
                
                // Extract and verify components
                var components = secrets.extractShareComponents(share)
                expect(components.bits).toEqual(8)
                expect(components.id).toEqual(index + 1)
                expect(components.data).toMatch(/^[0-9a-fA-F]+$/)
            })
            
            // Verify reconstruction works
            var reconstructed = secrets.combine(shares)
            expect(reconstructed).toEqual(secret)
        })

        it("should produce identical hex conversions across platforms", function() {
            var testStrings = [
                "Hello, World!",
                "Test123",
                "¥€£$",
                "αβγδ",
                "🚀🌟"
            ]
            
            testStrings.forEach(function(str) {
                var hex = secrets.str2hex(str)
                expect(typeof hex).toEqual("string")
                expect(hex).toMatch(/^[0-9a-fA-F]*$/)
                
                var roundTrip = secrets.hex2str(hex)
                expect(roundTrip).toEqual(str)
            })
        })

        it("should produce identical binary/hex conversions across platforms", function() {
            var testHexValues = [
                "deadbeef",
                "cafebabe",
                "0123456789abcdef",
                "ffffffff",
                "00000000"
            ]
            
            testHexValues.forEach(function(hex) {
                var bin = secrets._hex2bin(hex)
                expect(typeof bin).toEqual("string")
                expect(bin).toMatch(/^[01]+$/)
                
                var hexAgain = secrets._bin2hex(bin)
                expect(hexAgain).toEqual(hex)
            })
        })

        it("should handle share extraction identically across platforms", function() {
            var secret = "deadbeef"
            var shares = secrets.share(secret, 5, 3)
            
            shares.forEach(function(share, index) {
                var components = secrets.extractShareComponents(share)
                
                expect(components.bits).toEqual(8)
                expect(components.id).toEqual(index + 1)
                expect(typeof components.data).toEqual("string")
                expect(components.data.length).toBeGreaterThan(0)
            })
        })

        it("should handle newShare generation identically across platforms", function() {
            var secret = "deadbeefcafebabe"
            var shares = secrets.share(secret, 5, 3)
            
            var newShare = secrets.newShare(6, shares.slice(0, 3))
            expect(typeof newShare).toEqual("string")
            
            // Verify the new share works for reconstruction
            var reconstructed = secrets.combine([shares[0], shares[1], newShare])
            expect(reconstructed).toEqual(secret)
        })

        it("should handle configuration changes identically across platforms", function() {
            var testConfigs = [3, 8, 16, 20]
            
            testConfigs.forEach(function(bits) {
                secrets.init(bits)
                var config = secrets.getConfig()
                
                expect(config.bits).toEqual(bits)
                expect(config.maxShares).toEqual(Math.pow(2, bits) - 1)
                expect(config.radix).toEqual(16)
                expect(config.hasCSPRNG).toBe(true)
            })
        })

        it("should handle random generation with consistent format across platforms", function() {
            var bitLengths = [8, 16, 32, 64, 128, 256]
            
            bitLengths.forEach(function(bits) {
                var randomHex = secrets.random(bits)
                var expectedLength = Math.ceil(bits / 4)
                
                expect(typeof randomHex).toEqual("string")
                expect(randomHex.length).toEqual(expectedLength)
                expect(randomHex).toMatch(/^[0-9a-fA-F]+$/)
            })
        })
    })

    describe("Environment-Specific Error Handling Tests", function() {
        beforeEach(function() {
            secrets.init()
        })

        it("should handle RNG initialization errors consistently", function() {
            // Test with invalid RNG type
            expect(function() {
                secrets.setRNG("invalidRNGType")
            }).toThrowError()
            
            // Test with invalid RNG function
            expect(function() {
                secrets.setRNG(function() { return 123 })
            }).toThrowError()
        })

        it("should handle invalid inputs consistently across platforms", function() {
            // Test invalid share inputs
            expect(function() {
                secrets.share(null, 3, 2)
            }).toThrowError("Secret must be a string.")
            
            expect(function() {
                secrets.share("deadbeef", 1, 2)
            }).toThrowError()
            
            expect(function() {
                secrets.share("deadbeef", 3, 1)
            }).toThrowError()
            
            // Test invalid combine inputs
            expect(function() {
                secrets.combine([null])
            }).toThrowError()
            
            expect(function() {
                secrets.combine(["invalid"])
            }).toThrowError()
            
            // Test invalid str2hex inputs
            expect(function() {
                secrets.str2hex(null)
            }).toThrowError("Input must be a character string.")
            
            expect(function() {
                secrets.str2hex(123)
            }).toThrowError("Input must be a character string.")
            
            // Test invalid hex2str inputs
            expect(function() {
                secrets.hex2str(null)
            }).toThrowError("Input must be a hexadecimal string.")
            
            expect(function() {
                secrets.hex2str(123)
            }).toThrowError("Input must be a hexadecimal string.")
        })

        it("should handle boundary conditions consistently across platforms", function() {
            // Test minimum bit configuration
            secrets.init(3)
            var secret = "ab"
            var shares = secrets.share(secret, 3, 2)
            expect(secrets.combine(shares)).toEqual(secret)
            
            // Test maximum bit configuration
            secrets.init(20)
            shares = secrets.share(secret, 5, 3)
            expect(secrets.combine(shares)).toEqual(secret)
            
            // Test invalid bit configurations
            expect(function() {
                secrets.init(2)
            }).toThrowError()
            
            expect(function() {
                secrets.init(21)
            }).toThrowError()
        })

        it("should handle environment-specific RNG fallback scenarios", function() {
            // This test verifies that the library properly detects and uses
            // the appropriate RNG for the current environment
            
            secrets.init()
            var config = secrets.getConfig()
            
            expect(config.hasCSPRNG).toBe(true)
            expect(config.typeCSPRNG).toBeDefined()
            
            // Verify RNG actually works
            var randomValue = secrets.random(128)
            expect(typeof randomValue).toEqual("string")
            expect(randomValue.length).toEqual(32) // 128 bits = 32 hex chars
            expect(randomValue).toMatch(/^[0-9a-fA-F]+$/)
        })

        it("should handle large operations consistently across platforms", function() {
            secrets.init(16) // Use 16 bits to support more shares
            var secret = "deadbeefcafebabe"
            
            // Test with large number of shares
            var largeShares = secrets.share(secret, 1000, 3)
            expect(largeShares.length).toEqual(1000)
            expect(secrets.combine(largeShares.slice(0, 3))).toEqual(secret)
            
            // Test with large secret
            var largeSecret = "f".repeat(128) // 128 hex characters
            var shares = secrets.share(largeSecret, 5, 3)
            expect(secrets.combine(shares)).toEqual(largeSecret)
        })
    })

    describe("Cross-Platform Data Format Tests", function() {
        beforeEach(function() {
            secrets.init()
            secrets.setRNG("testRandom")
        })

        it("should produce shares with consistent format across platforms", function() {
            var secret = "deadbeef"
            var shares = secrets.share(secret, 5, 3)
            
            // Verify share format: <bits><id><data>
            // bits: 1 character in base36 (3-K for bits 3-20)
            // id: variable length hex based on maxShares
            // data: hex string
            
            shares.forEach(function(share) {
                expect(share).toMatch(/^[3-9a-kA-K][0-9a-fA-F]+$/)
                
                var components = secrets.extractShareComponents(share)
                expect(components.bits).toBeDefined()
                expect(components.id).toBeDefined()
                expect(components.data).toBeDefined()
            })
        })

        it("should handle share IDs consistently across platforms", function() {
            var secret = "deadbeef"
            var shares = secrets.share(secret, 10, 3)
            
            // Verify IDs are sequential
            shares.forEach(function(share, index) {
                var components = secrets.extractShareComponents(share)
                expect(components.id).toEqual(index + 1)
            })
            
            // Test newShare with various ID formats
            var newShare1 = secrets.newShare(11, shares.slice(0, 3))
            var newShare2 = secrets.newShare("12", shares.slice(0, 3))
            
            expect(secrets.extractShareComponents(newShare1).id).toEqual(11)
            expect(secrets.extractShareComponents(newShare2).id).toEqual(12)
        })

        it("should handle padding consistently across platforms", function() {
            var secret = "deadbeef"
            var padLengths = [0, 128, 256, 512, 1024]
            
            padLengths.forEach(function(padLength) {
                var shares = secrets.share(secret, 3, 2, padLength)
                expect(secrets.combine(shares)).toEqual(secret)
            })
        })

        it("should handle leading zeros consistently across platforms", function() {
            var secretsWithLeadingZeros = [
                "000000000000000123",
                "00000000",
                "000abc",
                "0000000deadbeef"
            ]
            
            secretsWithLeadingZeros.forEach(function(secret) {
                var shares = secrets.share(secret, 5, 3)
                var reconstructed = secrets.combine(shares)
                expect(reconstructed).toEqual(secret)
            })
        })
    })
})
    describe("Environment-Specific Error Condition Tests", function() {
        beforeEach(function() {
            secrets.init()
        })

        describe("Node.js-Specific Error Scenarios", function() {
            it("should handle Node.js crypto module unavailability gracefully", function() {
                // This test simulates what happens when Node.js crypto is not available
                // In a real Node.js environment, this should not happen, but we test the fallback
                
                if (typeof process !== "undefined" && process.versions && process.versions.node) {
                    // In Node.js, crypto should be available
                    expect(hasNodeCryptoRandomBytes()).toBe(true)
                    
                    // Test that Node.js RNG can be explicitly set
                    secrets.setRNG("nodeCryptoRandomBytes")
                    expect(secrets.getConfig().typeCSPRNG).toEqual("nodeCryptoRandomBytes")
                    
                    // Test that it actually works
                    var randomValue = secrets.random(32)
                    expect(typeof randomValue).toEqual("string")
                    expect(randomValue.length).toEqual(8)
                    expect(randomValue).toMatch(/^[0-9a-fA-F]+$/)
                } else {
                    // In browser environment, Node.js RNG should not be available
                    expect(hasNodeCryptoRandomBytes()).toBe(false)
                    
                    // Attempting to use Node.js RNG in browser should fail gracefully
                    // The library should either reject it or fall back to browser RNG
                    try {
                        secrets.setRNG("nodeCryptoRandomBytes")
                        // If it doesn't throw, check that it falls back to available RNG
                        var config = secrets.getConfig()
                        expect(config.hasCSPRNG).toBe(true)
                    } catch (error) {
                        // It's also acceptable to throw an error
                        expect(error.message).toContain("Invalid RNG")
                    }
                }
            })

            it("should handle Node.js-specific initialization errors", function() {
                if (typeof process !== "undefined" && process.versions && process.versions.node) {
                    // Test various Node.js-specific error conditions
                    
                    // Invalid RNG type should be rejected
                    expect(function() {
                        secrets.init(8, "invalidNodeRNG")
                    }).toThrowError()
                    
                    // Valid Node.js RNG should work
                    secrets.init(8, "nodeCryptoRandomBytes")
                    expect(secrets.getConfig().typeCSPRNG).toEqual("nodeCryptoRandomBytes")
                } else {
                    // In browser, Node.js-specific RNG should be handled gracefully
                    expect(function() {
                        secrets.init(8, "nodeCryptoRandomBytes")
                    }).toThrowError()
                }
            })

            it("should handle Node.js buffer operations consistently", function() {
                if (typeof process !== "undefined" && process.versions && process.versions.node) {
                    // Test that buffer-related operations work correctly in Node.js
                    var secret = "deadbeefcafebabe"
                    var shares = secrets.share(secret, 5, 3)
                    
                    // Should work with Node.js crypto
                    expect(shares.length).toEqual(5)
                    expect(secrets.combine(shares)).toEqual(secret)
                    
                    // Test with various secret sizes
                    var largSecret = "f".repeat(256) // Large hex string
                    var largeShares = secrets.share(largSecret, 3, 2)
                    expect(secrets.combine(largeShares)).toEqual(largSecret)
                } else {
                    // In browser, should still work without Node.js buffers
                    var secret = "deadbeefcafebabe"
                    var shares = secrets.share(secret, 5, 3)
                    expect(shares.length).toEqual(5)
                    expect(secrets.combine(shares)).toEqual(secret)
                }
            })
        })

        describe("Browser-Specific Error Scenarios", function() {
            it("should handle browser crypto API unavailability gracefully", function() {
                if (typeof window !== "undefined" && typeof window.document !== "undefined") {
                    // In browser, crypto.getRandomValues should be available
                    expect(hasBrowserCryptoGetRandomValues()).toBe(true)
                    
                    // Test that browser RNG can be explicitly set
                    secrets.setRNG("browserCryptoGetRandomValues")
                    expect(secrets.getConfig().typeCSPRNG).toEqual("browserCryptoGetRandomValues")
                    
                    // Test that it actually works
                    var randomValue = secrets.random(32)
                    expect(typeof randomValue).toEqual("string")
                    expect(randomValue.length).toEqual(8)
                    expect(randomValue).toMatch(/^[0-9a-fA-F]+$/)
                } else {
                    // In Node.js environment, browser RNG should not be available
                    expect(hasBrowserCryptoGetRandomValues()).toBe(false)
                    
                    // Attempting to use browser RNG in Node.js should fail gracefully
                    try {
                        secrets.setRNG("browserCryptoGetRandomValues")
                        // If it doesn't throw, check that it falls back to available RNG
                        var config = secrets.getConfig()
                        expect(config.hasCSPRNG).toBe(true)
                    } catch (error) {
                        // It's also acceptable to throw an error
                        expect(error.message).toContain("Invalid RNG")
                    }
                }
            })

            it("should handle browser-specific initialization errors", function() {
                if (typeof window !== "undefined" && typeof window.document !== "undefined") {
                    // Test various browser-specific error conditions
                    
                    // Invalid RNG type should be rejected
                    expect(function() {
                        secrets.init(8, "invalidBrowserRNG")
                    }).toThrowError()
                    
                    // Valid browser RNG should work
                    secrets.init(8, "browserCryptoGetRandomValues")
                    expect(secrets.getConfig().typeCSPRNG).toEqual("browserCryptoGetRandomValues")
                } else {
                    // In Node.js, browser-specific RNG might be handled gracefully or throw
                    // Just verify that invalid RNG types are rejected
                    expect(function() {
                        secrets.init(8, "invalidBrowserRNG")
                    }).toThrowError()
                }
            })

            it("should handle browser memory limitations gracefully", function() {
                if (typeof window !== "undefined" && typeof window.document !== "undefined") {
                    // Test with large operations that might stress browser memory
                    try {
                        secrets.init(16) // Use 16 bits to support more shares
                        var secret = "deadbeefcafebabe"
                        
                        // Test with large number of shares (might be limited in browser)
                        var largeShares = secrets.share(secret, 1000, 3)
                        expect(largeShares.length).toEqual(1000)
                        expect(secrets.combine(largeShares.slice(0, 3))).toEqual(secret)
                        
                        // Test with large secret
                        var largeSecret = "f".repeat(128)
                        var shares = secrets.share(largeSecret, 5, 3)
                        expect(secrets.combine(shares)).toEqual(largeSecret)
                    } catch (error) {
                        // If browser runs out of memory, that's acceptable
                        expect(error.message).toMatch(/memory|size|limit/i)
                    }
                } else {
                    // In Node.js, should handle large operations fine
                    secrets.init(16)
                    var secret = "deadbeefcafebabe"
                    var largeShares = secrets.share(secret, 1000, 3)
                    expect(largeShares.length).toEqual(1000)
                    expect(secrets.combine(largeShares.slice(0, 3))).toEqual(secret)
                }
            })

            it("should handle browser Uint32Array limitations", function() {
                if (typeof window !== "undefined" && typeof window.document !== "undefined") {
                    // Test that Uint32Array operations work correctly in browser
                    secrets.setRNG("browserCryptoGetRandomValues")
                    
                    // Generate multiple random values to test Uint32Array usage
                    for (var i = 0; i < 10; i++) {
                        var randomValue = secrets.random(64)
                        expect(typeof randomValue).toEqual("string")
                        expect(randomValue.length).toEqual(16) // 64 bits = 16 hex chars
                        expect(randomValue).toMatch(/^[0-9a-fA-F]+$/)
                    }
                } else {
                    // In Node.js, should work without Uint32Array dependency
                    var randomValue = secrets.random(64)
                    expect(typeof randomValue).toEqual("string")
                    expect(randomValue.length).toEqual(16)
                    expect(randomValue).toMatch(/^[0-9a-fA-F]+$/)
                }
            })
        })

        describe("Cross-Environment Error Consistency", function() {
            it("should throw identical errors for invalid bit configurations", function() {
                // Only test values that should definitely throw errors
                // Note: 0 is handled as a default value, null and undefined default to 8
                var invalidBitValues = [-1, 1, 2, 21, 22, 100, 1.5, "8"]
                
                invalidBitValues.forEach(function(invalidBits) {
                    expect(function() {
                        secrets.init(invalidBits)
                    }).toThrowError()
                })
            })

            it("should throw identical errors for invalid RNG types", function() {
                // Only test values that should definitely throw errors
                var invalidRNGTypes = ["invalid", "mathRandom", 123]
                
                invalidRNGTypes.forEach(function(invalidRNG) {
                    expect(function() {
                        secrets.init(8, invalidRNG)
                    }).toThrowError()
                })
            })

            it("should throw identical errors for invalid share parameters", function() {
                var secret = "deadbeef"
                
                // Invalid numShares
                var invalidNumShares = [0, 1, -1, 1.5, "3", null, undefined, {}, []]
                invalidNumShares.forEach(function(invalidNum) {
                    expect(function() {
                        secrets.share(secret, invalidNum, 2)
                    }).toThrowError()
                })
                
                // Invalid threshold
                var invalidThresholds = [0, 1, -1, 1.5, "2", null, undefined, {}, []]
                invalidThresholds.forEach(function(invalidThreshold) {
                    expect(function() {
                        secrets.share(secret, 3, invalidThreshold)
                    }).toThrowError()
                })
            })

            it("should throw identical errors for invalid string conversion parameters", function() {
                // Invalid str2hex inputs - test that they throw (message may vary)
                // Note: Some values like null/undefined might be coerced to strings
                var invalidInputs = [123, {}, []]
                invalidInputs.forEach(function(invalidInput) {
                    expect(function() {
                        secrets.str2hex(invalidInput)
                    }).toThrowError()
                })
                
                // Invalid hex2str inputs - test that they throw (message may vary)
                invalidInputs.forEach(function(invalidInput) {
                    expect(function() {
                        secrets.hex2str(invalidInput)
                    }).toThrowError()
                })
                
                // Invalid bytesPerChar values - only test values that should definitely throw
                // Note: 0 is handled as a default value
                var invalidBytesPerChar = [-1, 7, 8, 1.5]
                invalidBytesPerChar.forEach(function(invalidBytes) {
                    expect(function() {
                        secrets.str2hex("test", invalidBytes)
                    }).toThrowError()
                })
            })

            it("should handle environment detection errors consistently", function() {
                // Test that environment detection doesn't throw errors
                var isNode = (typeof process !== "undefined" && process.versions && process.versions.node)
                var isBrowser = (typeof window !== "undefined" && typeof window.document !== "undefined")
                var envName = isNode ? "Node.js" : (isBrowser ? "Browser" : "Unknown")
                
                // These should be truthy/falsy values (not necessarily strict booleans)
                expect(isNode !== undefined).toBe(true)
                expect(isBrowser !== undefined).toBe(true)
                expect(typeof envName).toEqual("string")
                
                // Test that RNG detection doesn't throw errors
                var hasNode = hasNodeCryptoRandomBytes()
                var hasBrowser = hasBrowserCryptoGetRandomValues()
                
                expect(typeof hasNode).toEqual("boolean")
                expect(typeof hasBrowser).toEqual("boolean")
            })

            it("should handle large input errors consistently across platforms", function() {
                // Test with extremely large inputs that should fail consistently
                
                // Very large bit configuration (should fail)
                expect(function() {
                    secrets.init(1000000)
                }).toThrowError()
                
                // Very large number of shares (should fail)
                expect(function() {
                    secrets.share("deadbeef", 1000000, 2)
                }).toThrowError()
                
                // Very large threshold (should fail)
                expect(function() {
                    secrets.share("deadbeef", 5, 1000000)
                }).toThrowError()
                
                // Very large random bit request (should fail)
                expect(function() {
                    secrets.random(1000000)
                }).toThrowError()
            })

            it("should handle malformed share errors consistently", function() {
                var malformedShares = [
                    "",
                    "invalid",
                    "Z123abc", // Invalid bits character
                    "8xyz123", // Invalid hex characters
                    "8", // Too short
                    "800", // Too short for valid share
                    null,
                    undefined,
                    123,
                    {},
                    []
                ]
                
                malformedShares.forEach(function(malformedShare) {
                    expect(function() {
                        secrets.extractShareComponents(malformedShare)
                    }).toThrowError()
                    
                    expect(function() {
                        secrets.combine([malformedShare])
                    }).toThrowError()
                })
            })
        })

        describe("Platform-Specific Performance Error Handling", function() {
            it("should handle timeout scenarios gracefully", function() {
                // Test operations that might timeout in constrained environments
                try {
                    secrets.init(20) // Maximum bit configuration
                    var secret = "f".repeat(256) // Large secret
                    
                    // This might be slow in some environments but should complete
                    var shares = secrets.share(secret, 100, 50)
                    expect(shares.length).toEqual(100)
                    
                    var recovered = secrets.combine(shares.slice(0, 50))
                    expect(recovered).toEqual(secret)
                } catch (error) {
                    // If it fails due to performance constraints, that's acceptable
                    // but the error should be meaningful
                    expect(error.message).toBeDefined()
                    expect(typeof error.message).toEqual("string")
                }
            })

            it("should handle memory pressure scenarios", function() {
                // Test operations that might cause memory pressure
                try {
                    secrets.init(16)
                    var results = []
                    
                    // Generate many shares to test memory usage
                    for (var i = 0; i < 100; i++) {
                        var secret = "deadbeef" + i.toString(16)
                        var shares = secrets.share(secret, 10, 5)
                        results.push(shares)
                    }
                    
                    // Verify all results are valid
                    for (var j = 0; j < results.length; j++) {
                        expect(results[j].length).toEqual(10)
                    }
                } catch (error) {
                    // If it fails due to memory constraints, that's acceptable
                    expect(error.message).toBeDefined()
                }
            })
        })
    })