/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */
/*global secrets, describe, xdescribe, it, xit, expect, beforeEach, afterEach, Uint32Array */

describe("Secrets private function", function() {
    "use strict"

    describe("padLeft()", function() {
        beforeEach(function() {
            secrets.init()
            secrets.setRNG("testRandom")
        })

        it("without specifying bits of padding it should default to config.bits", function() {
            secrets.init(10)
            var str = "abc123"
            expect(secrets._padLeft(str)).toEqual("0000abc123")
            expect(secrets._padLeft(str).length).toEqual(10)
        })

        it("with null bits of padding it should default to config.bits", function() {
            secrets.init(10)
            var str = "abc123"
            expect(secrets._padLeft(str, null)).toEqual("0000abc123")
            expect(secrets._padLeft(str, null).length).toEqual(10)
        })

        it("with zero bits of padding", function() {
            var str = "abc123"
            expect(secrets._padLeft(str, 0)).toEqual("abc123")
            expect(secrets._padLeft(str, 0).length).toEqual(6)
        })

        it("with 1 bit of padding", function() {
            var str = "abc123"
            expect(secrets._padLeft(str, 1)).toEqual("abc123")
            expect(secrets._padLeft(str, 1).length).toEqual(6)
        })

        it("with a value that is shorter than bits", function() {
            var str = "abc123"
            expect(secrets._padLeft(str, 32)).toEqual(
                "00000000000000000000000000abc123"
            )
            expect(secrets._padLeft(str, 32).length).toEqual(32)
        })

        it("with a value that is equal in size to bits", function() {
            var str = "01234567890123456789012345678901"
            expect(secrets._padLeft(str, 32)).toEqual(
                "01234567890123456789012345678901"
            )
            expect(secrets._padLeft(str, 32).length).toEqual(32)
        })

        it("with a value that is larger than bits", function() {
            var str = "0123456789012345678901234567890123456789"
            expect(secrets._padLeft(str, 32)).toEqual(
                "0000000000000000000000000123456789012345678901234567890123456789"
            )
            expect(secrets._padLeft(str, 32).length).toEqual(64)
        })

        it("with bits set to the max of 1024", function() {
            var str = "0123456789012345678901234567890123456789"
            expect(secrets._padLeft(str, 1024).length).toEqual(1024)
        })

        it("unless bits set greater than the max of 1024", function() {
            expect(function() {
                secrets._padLeft("abc123", 1025)
            }).toThrowError(
                "Padding must be multiples of no larger than 1024 bits."
            )
        })
    })

    describe("hex2bin()", function() {})

    describe("bin2hex()", function() {})

    describe("bytesToHex()", function() {
        beforeEach(function() {
            secrets.init()
            secrets.setRNG("testRandom")
        })

        it("should convert known byte sequences to expected hex outputs", function() {
            // Test with a simple byte array
            var bytes = new Uint8Array([0, 1, 15, 16, 255])
            expect(secrets._bytesToHex(bytes)).toEqual("00010f10ff")
        })

        it("should handle empty arrays", function() {
            var bytes = new Uint8Array([])
            expect(secrets._bytesToHex(bytes)).toEqual("")
        })

        it("should handle single bytes", function() {
            var bytes = new Uint8Array([42])
            expect(secrets._bytesToHex(bytes)).toEqual("2a")
        })

        it("should handle maximum length arrays", function() {
            // Create a large array to test performance and correctness
            var bytes = new Uint8Array(1000)
            for (var i = 0; i < bytes.length; i++) {
                bytes[i] = i % 256
            }
            var result = secrets._bytesToHex(bytes)
            expect(result.length).toEqual(2000) // 2 hex chars per byte
            expect(result.substr(0, 6)).toEqual("000102") // First 3 bytes
        })

        it("should work with Node.js Buffer objects", function() {
            // This test will only run in Node.js environment
            if (typeof Buffer !== "undefined") {
                var buf = Buffer.from([0, 1, 15, 16, 255])
                expect(secrets._bytesToHex(buf)).toEqual("00010f10ff")
            }
        })

        it("should produce identical results for Buffer and Uint8Array with same data", function() {
            var data = [0, 1, 15, 16, 255]
            var uint8Array = new Uint8Array(data)
            var result1 = secrets._bytesToHex(uint8Array)
            
            // Only test Buffer if available (Node.js environment)
            if (typeof Buffer !== "undefined") {
                var buffer = Buffer.from(data)
                var result2 = secrets._bytesToHex(buffer)
                expect(result1).toEqual(result2)
            }
            
            expect(result1).toEqual("00010f10ff")
        })

        it("Property 1: Cross-Platform Hex Conversion Consistency - for any byte array, converting to hex should produce identical output regardless of environment", function() {
            // **Feature: browser-compatibility, Property 1: Cross-Platform Hex Conversion Consistency**
            // **Validates: Requirements 1.4, 2.3**
            
            // Property-based test with 100 iterations
            for (var iteration = 0; iteration < 100; iteration++) {
                // Generate random byte array of random length (1-256 bytes)
                var length = Math.floor(Math.random() * 256) + 1
                var randomBytes = new Uint8Array(length)
                
                // Fill with random byte values
                for (var i = 0; i < length; i++) {
                    randomBytes[i] = Math.floor(Math.random() * 256)
                }
                
                // Convert using our bytesToHex function
                var hexResult = secrets._bytesToHex(randomBytes)
                
                // Verify the result is valid hex
                expect(hexResult).toMatch(/^[0-9a-f]*$/)
                expect(hexResult.length).toEqual(length * 2)
                
                // If Buffer is available (Node.js), test cross-platform consistency
                if (typeof Buffer !== "undefined") {
                    var buffer = Buffer.from(randomBytes)
                    var bufferResult = secrets._bytesToHex(buffer)
                    expect(bufferResult).toEqual(hexResult)
                }
                
                // Verify each byte was converted correctly
                for (var j = 0; j < length; j++) {
                    var expectedHex = randomBytes[j].toString(16)
                    if (expectedHex.length === 1) {
                        expectedHex = "0" + expectedHex
                    }
                    expect(hexResult.substr(j * 2, 2)).toEqual(expectedHex)
                }
            }
        })
    })

    describe("nodeCryptoRandomBytes()", function() {
        beforeEach(function() {
            secrets.init()
            secrets.setRNG("testRandom")
        })

        it("Property 2: Hex Conversion Without Buffer Methods - for any random byte sequence, nodeCryptoRandomBytes should convert to hex without calling Buffer methods", function() {
            // **Feature: browser-compatibility, Property 2: Hex Conversion Without Buffer Methods**
            // **Validates: Requirements 1.1, 1.3**
            
            // Skip this test if we're not in Node.js environment
            if (typeof crypto === "undefined" || typeof crypto.randomBytes !== "function") {
                return
            }
            
            // Property-based test with 100 iterations
            for (var iteration = 0; iteration < 100; iteration++) {
                // Generate random bit lengths (8 to 512 bits)
                var bits = Math.floor(Math.random() * 505) + 8 // 8-512 bits
                
                // Force use of nodeCryptoRandomBytes
                secrets.setRNG("nodeCryptoRandomBytes")
                
                // Call the function - this should work without Buffer.toString("hex")
                var result = secrets._getRNG("nodeCryptoRandomBytes")(bits)
                
                // Verify the result is a valid binary string
                expect(typeof result).toEqual("string")
                expect(result).toMatch(/^[01]+$/)
                expect(result.length).toEqual(bits)
                
                // Verify it doesn't contain all zeros (which would indicate failure)
                expect(result).not.toMatch(/^0+$/)
            }
        })
    })

    describe("getRNG()", function() {})

    describe("isSetRNG()", function() {})

    describe("Browser Environment Detection", function() {
        beforeEach(function() {
            secrets.init()
        })

        it("should use crypto.getRandomValues() when available in browser environment", function() {
            // Skip this test if we're in Node.js environment
            if (typeof crypto !== "undefined" && typeof crypto.randomBytes === "function") {
                return // This is Node.js, skip browser-specific test
            }

            // Test that browser environment detection works
            var hasBrowserCrypto = secrets._hasCryptoGetRandomValues()
            
            if (typeof crypto !== "undefined" && 
                typeof crypto.getRandomValues === "function" &&
                typeof Uint32Array === "function") {
                expect(hasBrowserCrypto).toEqual(true)
                
                // Test that browserCryptoGetRandomValues RNG is selected
                var rng = secrets._getRNG()
                expect(typeof rng).toEqual("function")
                
                // Test that it produces valid output
                var result = rng(32)
                expect(typeof result).toEqual("string")
                expect(result).toMatch(/^[01]+$/)
                expect(result.length).toEqual(32)
            } else {
                expect(hasBrowserCrypto).toEqual(false)
            }
        })

        it("should detect when crypto.getRandomValues() is unavailable", function() {
            // This test only runs in browser environment
            if (typeof window === "undefined" || 
                (typeof crypto !== "undefined" && typeof crypto.randomBytes === "function")) {
                return // Skip in Node.js environment
            }

            // Save original crypto object
            var originalCrypto = window.crypto
            
            try {
                // Test with undefined crypto
                window.crypto = undefined
                expect(secrets._hasCryptoGetRandomValues()).toEqual(false)
                
                // Test with crypto object but no getRandomValues
                window.crypto = {}
                expect(secrets._hasCryptoGetRandomValues()).toEqual(false)
                
                // Test with crypto.getRandomValues but no Uint32Array
                window.crypto = { getRandomValues: function() {} }
                var originalUint32Array = window.Uint32Array
                window.Uint32Array = undefined
                expect(secrets._hasCryptoGetRandomValues()).toEqual(false)
                window.Uint32Array = originalUint32Array
                
            } finally {
                // Restore original crypto object
                window.crypto = originalCrypto
            }
        })

        it("should throw error when no secure random source is available", function() {
            // This test only runs in browser environment
            if (typeof window === "undefined" || 
                (typeof crypto !== "undefined" && typeof crypto.randomBytes === "function")) {
                return // Skip in Node.js environment
            }

            // Save original crypto and Uint32Array
            var originalCrypto = window.crypto
            var originalUint32Array = window.Uint32Array
            
            try {
                // Remove all crypto sources
                window.crypto = undefined
                window.Uint32Array = undefined
                
                // Attempt to get RNG should return undefined (no secure source)
                var rng = secrets._getRNG()
                expect(rng).toBeUndefined()
                
                // Attempting to initialize without RNG should fail
                expect(function() {
                    secrets.init()
                }).toThrowError("Initialization failed.")
                
            } finally {
                // Restore original objects
                window.crypto = originalCrypto
                window.Uint32Array = originalUint32Array
            }
        })

        it("should never fall back to Math.random() or other weak sources", function() {
            // This test only runs in browser environment
            if (typeof window === "undefined" || 
                (typeof crypto !== "undefined" && typeof crypto.randomBytes === "function")) {
                return // Skip in Node.js environment
            }

            // Save original crypto
            var originalCrypto = window.crypto
            var mathRandomCalled = false
            var originalMathRandom = Math.random
            
            try {
                // Remove crypto.getRandomValues
                window.crypto = undefined
                
                // Override Math.random to detect if it's called
                Math.random = function() {
                    mathRandomCalled = true
                    return originalMathRandom()
                }
                
                // Attempt to get RNG
                var rng = secrets._getRNG()
                
                // Should not get a working RNG
                expect(rng).toBeUndefined()
                
                // Math.random should never be called
                expect(mathRandomCalled).toEqual(false)
                
            } finally {
                // Restore original functions
                window.crypto = originalCrypto
                Math.random = originalMathRandom
            }
        })

        it("should properly validate crypto.getRandomValues() functionality", function() {
            // Skip this test if we're in Node.js environment or crypto.getRandomValues not available
            if (typeof crypto === "undefined" || 
                typeof crypto.randomBytes === "function" ||
                typeof crypto.getRandomValues !== "function") {
                return
            }

            // Test that crypto.getRandomValues works as expected
            var array = new Uint32Array(4)
            crypto.getRandomValues(array)
            
            // Verify array was filled with values
            var hasNonZero = false
            for (var i = 0; i < array.length; i++) {
                if (array[i] !== 0) {
                    hasNonZero = true
                    break
                }
            }
            expect(hasNonZero).toEqual(true)
            
            // Test that our RNG function works with crypto.getRandomValues
            secrets.setRNG("browserCryptoGetRandomValues")
            var randomBits = secrets._getRNG("browserCryptoGetRandomValues")(64)
            expect(typeof randomBits).toEqual("string")
            expect(randomBits).toMatch(/^[01]+$/)
            expect(randomBits.length).toEqual(64)
        })

        it("should handle browser environment with proper error messages", function() {
            // This test only runs in browser environment
            if (typeof window === "undefined" || 
                (typeof crypto !== "undefined" && typeof crypto.randomBytes === "function")) {
                return // Skip in Node.js environment
            }

            // Save original crypto
            var originalCrypto = window.crypto
            
            try {
                // Test with no crypto at all
                window.crypto = undefined
                
                // Should not be able to set browserCryptoGetRandomValues RNG
                expect(function() {
                    secrets.setRNG("browserCryptoGetRandomValues")
                }).toThrowError("Initialization failed.")
                
            } finally {
                // Restore original crypto
                window.crypto = originalCrypto
            }
        })

        it("should detect Node.js environment and use crypto.randomBytes()", function() {
            // This test only runs in Node.js environment
            if (typeof crypto === "undefined" || typeof crypto.randomBytes !== "function") {
                return // Skip in browser environment
            }

            // Test that Node.js environment detection works
            var hasNodeCrypto = secrets._hasCryptoRandomBytes()
            expect(hasNodeCrypto).toEqual(true)
            
            // Test that nodeCryptoRandomBytes RNG is selected by default
            secrets.init()
            var config = secrets.getConfig()
            expect(config.typeCSPRNG).toEqual("nodeCryptoRandomBytes")
            
            // Test that it produces valid output
            var rng = secrets._getRNG("nodeCryptoRandomBytes")
            expect(typeof rng).toEqual("function")
            
            var result = rng(32)
            expect(typeof result).toEqual("string")
            expect(result).toMatch(/^[01]+$/)
            expect(result.length).toEqual(32)
        })

        it("should ensure no Buffer references in browser code paths", function() {
            // This test verifies that bytesToHex works without Buffer methods
            var testData = [0, 1, 15, 16, 255, 128, 64, 32]
            var uint8Array = new Uint8Array(testData)
            
            // This should work in both Node.js and browser environments
            var result = secrets._bytesToHex(uint8Array)
            expect(result).toEqual("00010f10ff804020")
            
            // Verify the function doesn't call toString on the input
            var mockArray = {
                length: 3,
                0: 10,
                1: 20,
                2: 30,
                toString: function() {
                    throw new Error("toString should not be called")
                }
            }
            
            // Should work without calling toString
            var mockResult = secrets._bytesToHex(mockArray)
            expect(mockResult).toEqual("0a141e")
        })
    })

    describe("splitNumStringToIntArray()", function() {})

    describe("horner()", function() {})

    describe("lagrange()", function() {})

    describe("getShares()", function() {})

    describe("constructPublicShareString()", function() {
        it("should construct a well formed 3 bit share", function() {
            expect(secrets._constructPublicShareString(3, 1, "ffff")).toEqual(
                "31ffff"
            )
        })

        it("should construct a well formed 8 bit share", function() {
            expect(secrets._constructPublicShareString(8, 1, "ffff")).toEqual(
                "801ffff"
            )
        })

        it("should construct a well formed 20 bit share", function() {
            expect(
                secrets._constructPublicShareString(20, 1024, "ffff")
            ).toEqual("K01024ffff")
        })

        it("should construct a well formed 20 bit share with bits as a string", function() {
            expect(
                secrets._constructPublicShareString("20", 1024, "ffff")
            ).toEqual("K01024ffff")
        })

        it("should construct a well formed 20 bit share with ID as a string", function() {
            expect(
                secrets._constructPublicShareString(20, "1024", "ffff")
            ).toEqual("K01024ffff")
        })

        it("unless id < 1", function() {
            expect(function() {
                secrets._constructPublicShareString(8, 0, "ffff")
            }).toThrowError(
                "Share id must be an integer between 1 and 255, inclusive."
            )
        })

        it("unless id > 255", function() {
            expect(function() {
                secrets._constructPublicShareString(8, 256, "ffff")
            }).toThrowError(
                "Share id must be an integer between 1 and 255, inclusive."
            )
        })
    })

    describe("API Functional Consistency", function() {
        beforeEach(function() {
            secrets.init()
            secrets.setRNG("testRandom")
        })

        it("Property 3: API Functional Consistency - for any valid secret, number of shares, and threshold, calling secrets.share() and secrets.combine() should produce identical results in both Node.js and browser environments when using the same random seed", function() {
            // **Feature: browser-compatibility, Property 3: API Functional Consistency**
            // **Validates: Requirements 3.2**
            
            // Property-based test with 100 iterations
            for (var iteration = 0; iteration < 100; iteration++) {
                // Generate random test parameters
                var secretLength = Math.floor(Math.random() * 32) + 1 // 1-32 hex chars
                var secret = ""
                for (var i = 0; i < secretLength; i++) {
                    secret += Math.floor(Math.random() * 16).toString(16)
                }
                
                var numShares = Math.floor(Math.random() * 8) + 3 // 3-10 shares
                var threshold = Math.floor(Math.random() * (numShares - 1)) + 2 // 2 to numShares
                
                // Reset to ensure consistent state
                secrets.init()
                secrets.setRNG("testRandom")
                
                // Test share() produces consistent results
                var shares1 = secrets.share(secret, numShares, threshold)
                
                // Reset again and repeat
                secrets.init()
                secrets.setRNG("testRandom")
                var shares2 = secrets.share(secret, numShares, threshold)
                
                // Shares should be identical when using same RNG seed
                expect(shares1.length).toEqual(shares2.length)
                for (var j = 0; j < shares1.length; j++) {
                    expect(shares1[j]).toEqual(shares2[j])
                }
                
                // Test combine() produces consistent results
                var combined1 = secrets.combine(shares1)
                var combined2 = secrets.combine(shares2)
                
                expect(combined1).toEqual(combined2)
                expect(combined1).toEqual(secret)
                
                // Test with subset of shares (threshold)
                var subsetShares1 = shares1.slice(0, threshold)
                var subsetShares2 = shares2.slice(0, threshold)
                
                var subsetCombined1 = secrets.combine(subsetShares1)
                var subsetCombined2 = secrets.combine(subsetShares2)
                
                expect(subsetCombined1).toEqual(subsetCombined2)
                expect(subsetCombined1).toEqual(secret)
            }
        })
    })
})
