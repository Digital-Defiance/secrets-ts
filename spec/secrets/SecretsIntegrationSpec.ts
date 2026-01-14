/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */
/*global describe, it, expect, beforeEach */

import secrets = require('../../src/secrets');



/**
 * Integration Tests for Secrets Library
 * 
 * Feature: comprehensive-testing
 * 
 * This test suite validates complete end-to-end workflows, configuration changes,
 * and error recovery scenarios for the @digitaldefiance/secrets library.
 * 
 * Requirements: 6.1, 6.2, 6.4, 6.5
 */

// when running in a node.js env.
if (typeof require === "function") {
    crypto = require("crypto")
    secrets = require("../../secrets.js")
}

describe("Secrets Integration Tests", function(): void {
    "use strict"

    beforeEach(function(): void {
        secrets.init()
        secrets.setRNG("testRandom")
    })

    describe("Complete share-and-combine workflows", function(): void {
        // Requirements: 6.1 - Complete share-and-combine workflows with various parameters

        it("should handle complete workflow with ASCII text", function(): void {
            let originalText = "This is a secret message that needs to be protected!"
            let hexSecret = secrets.str2hex(originalText)
            
            // Share the secret
            let shares: string[] = secrets.share(hexSecret, 5, 3)
            expect(shares.length).toEqual(5)
            
            // Combine with threshold shares
            let combinedHex = secrets.combine(shares.slice(0, 3))
            let recoveredText = secrets.hex2str(combinedHex)
            
            expect(recoveredText).toEqual(originalText)
        })

        it("should handle complete workflow with UTF-8 text", function(): void {
            let originalText = "¥ · £ · € · $ · ¢ · ₡ · ₢ · ₣ · ₤ · ₥ · ₦ · ₧ · ₨ · ₩ · ₪ · ₫ · ₭ · ₮ · ₯ · ₹"
            let hexSecret = secrets.str2hex(originalText)
            
            // Share the secret
            let shares: string[] = secrets.share(hexSecret, 7, 4)
            expect(shares.length).toEqual(7)
            
            // Combine with more than threshold shares
            let combinedHex = secrets.combine(shares.slice(0, 5))
            let recoveredText = secrets.hex2str(combinedHex)
            
            expect(recoveredText).toEqual(originalText)
        })

        it("should handle complete workflow with UTF-16 text", function(): void {
            let originalText = "𐑡𐑹𐑡 ·𐑚𐑻𐑯𐑸𐑛 ·𐑖𐑷"
            let hexSecret = secrets.str2hex(originalText)
            
            // Share the secret
            let shares: string[] = secrets.share(hexSecret, 10, 6)
            expect(shares.length).toEqual(10)
            
            // Combine with all shares
            let combinedHex = secrets.combine(shares)
            let recoveredText = secrets.hex2str(combinedHex)
            
            expect(recoveredText).toEqual(originalText)
        })

        it("should handle workflow with random hex secrets", function(): void {
            let originalSecret = secrets.random(256)
            
            // Share the secret
            let shares: string[] = secrets.share(originalSecret, 8, 5)
            expect(shares.length).toEqual(8)
            
            // Combine with threshold shares
            let recoveredSecret = secrets.combine(shares.slice(0, 5))
            
            expect(recoveredSecret).toEqual(originalSecret)
        })

        it("should handle workflow with zero-padded secrets", function(): void {
            let originalSecret = secrets.random(128)
            
            // Share with zero-padding
            let shares: string[] = secrets.share(originalSecret, 5, 3, 512)
            expect(shares.length).toEqual(5)
            
            // Combine and verify
            let recoveredSecret = secrets.combine(shares)
            
            expect(recoveredSecret).toEqual(originalSecret)
        })

        it("should handle workflow with leading zeros in secret", function(): void {
            let originalSecret = "000000000000000123456789abcdef"
            
            // Share the secret
            let shares: string[] = secrets.share(originalSecret, 6, 4)
            expect(shares.length).toEqual(6)
            
            // Combine and verify leading zeros are preserved
            let recoveredSecret = secrets.combine(shares)
            
            expect(recoveredSecret).toEqual(originalSecret)
        })

        it("should handle workflow with maximum shares for 8-bit configuration", function(): void {
            let originalSecret = secrets.random(128)
            
            // Share with maximum shares (255 for 8-bit)
            let shares: string[] = secrets.share(originalSecret, 255, 2)
            expect(shares.length).toEqual(255)
            
            // Combine with minimum threshold
            let recoveredSecret = secrets.combine(shares.slice(0, 2))
            
            expect(recoveredSecret).toEqual(originalSecret)
        })

        it("should handle workflow with large threshold", function(): void {
            let originalSecret = secrets.random(128)
            
            // Share with large threshold
            let shares: string[] = secrets.share(originalSecret, 100, 75)
            expect(shares.length).toEqual(100)
            
            // Combine with exact threshold
            let recoveredSecret = secrets.combine(shares.slice(0, 75))
            
            expect(recoveredSecret).toEqual(originalSecret)
        })

        it("should handle workflow with shuffled shares", function(): void {
            let originalSecret = secrets.random(128)
            
            // Share the secret
            let shares: string[] = secrets.share(originalSecret, 10, 5)
            
            // Shuffle shares (use a subset in different order)
            let shuffledShares: string[] = [shares[8], shares[2], shares[5], shares[0], shares[6]]
            
            // Combine shuffled shares
            let recoveredSecret = secrets.combine(shuffledShares)
            
            expect(recoveredSecret).toEqual(originalSecret)
        })

        it("should handle workflow with duplicate shares", function(): void {
            let originalSecret = secrets.random(128)
            
            // Share the secret
            let shares: string[] = secrets.share(originalSecret, 7, 4)
            
            // Create array with duplicates
            let sharesWithDuplicates = shares.slice(0, 4).concat(shares.slice(0, 2))
            
            // Combine should handle duplicates gracefully
            let recoveredSecret = secrets.combine(sharesWithDuplicates)
            
            expect(recoveredSecret).toEqual(originalSecret)
        })
    })

    describe("Configuration change workflows", function(): void {
        // Requirements: 6.4 - Configuration changes and their effects on operations

        it("should handle bit configuration changes between operations", function(): void {
            // Start with 8-bit configuration
            secrets.init(8)
            let secret8 = secrets.random(128)
            let shares8 = secrets.share(secret8, 5, 3)
            
            // Change to 16-bit configuration
            secrets.init(16)
            let secret16 = secrets.random(128)
            let shares16: string[] = secrets.share(secret16, 10, 5)
            
            // Combine 8-bit shares (should auto-adjust)
            let recovered8 = secrets.combine(shares8)
            expect(recovered8).toEqual(secret8)
            
            // Combine 16-bit shares
            let recovered16 = secrets.combine(shares16)
            expect(recovered16).toEqual(secret16)
        })

        it("should handle RNG changes between operations", function(): void {
            let originalSecret = "deadbeefcafebabe"
            
            // Create shares with testRandom
            secrets.setRNG("testRandom")
            let shares1 = secrets.share(originalSecret, 5, 3)
            
            // Change RNG (if available)
            if (typeof crypto !== "undefined" && typeof crypto.randomBytes === "function") {
                secrets.setRNG("nodeCryptoRandomBytes")
            } else if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
                secrets.setRNG("browserCryptoGetRandomValues")
            }
            
            // Create more shares with different RNG
            let shares2 = secrets.share(originalSecret, 5, 3)
            
            // Both sets should combine correctly
            expect(secrets.combine(shares1)).toEqual(originalSecret)
            expect(secrets.combine(shares2)).toEqual(originalSecret)
            
            // Reset to testRandom for other tests
            secrets.setRNG("testRandom")
        })

        it("should handle multiple init() calls with different configurations", function(): void {
            let testConfigs: string[] = [
                { bits: 3, secret: secrets.random(32) },
                { bits: 8, secret: secrets.random(128) },
                { bits: 16, secret: secrets.random(256) },
                { bits: 20, secret: secrets.random(512) }
            ]
            
            let allShares = []
            
            // Create shares with different configurations
            testConfigs.forEach(function(config) {
                secrets.init(config.bits)
                let shares: string[] = secrets.share(config.secret, 5, 3)
                allShares.push({ config: config, shares: shares })
            })
            
            // Verify all shares can be combined correctly
            allShares.forEach(function(item) {
                let recovered = secrets.combine(item.shares)
                expect(recovered).toEqual(item.config.secret)
            })
        })

        it("should handle configuration changes during share combination", function(): void {
            // Create shares with 8-bit config
            secrets.init(8)
            let secret: string = secrets.random(128)
            let shares: string[] = secrets.share(secret, 5, 3)
            
            // Change configuration
            secrets.init(16)
            
            // Combine should still work (auto-adjusts based on share format)
            let recovered = secrets.combine(shares)
            expect(recovered).toEqual(secret)
            
            // Verify configuration was adjusted
            expect(secrets.getConfig().bits).toEqual(8)
        })

        it("should handle padding configuration changes", function(): void {
            let secret: string = secrets.random(128)
            
            // Create shares with different padding
            let shares0 = secrets.share(secret, 5, 3, 0)
            let shares128 = secrets.share(secret, 5, 3, 128)
            let shares512 = secrets.share(secret, 5, 3, 512)
            let shares1024 = secrets.share(secret, 5, 3, 1024)
            
            // All should combine to same secret
            expect(secrets.combine(shares0)).toEqual(secret)
            expect(secrets.combine(shares128)).toEqual(secret)
            expect(secrets.combine(shares512)).toEqual(secret)
            expect(secrets.combine(shares1024)).toEqual(secret)
            
            // Verify different padding produces different share lengths
            expect(shares1024[0].length).toBeGreaterThan(shares512[0].length)
            expect(shares512[0].length).toBeGreaterThan(shares128[0].length)
        })
    })

    describe("NewShare integration workflows", function(): void {
        // Requirements: 6.2 - NewShare generation and integration with existing shares

        it("should integrate newShare with existing shares for recovery", function(): void {
            let originalSecret = secrets.random(256)
            
            // Create initial shares
            let shares: string[] = secrets.share(originalSecret, 5, 3)
            
            // Generate a new share
            let newShare: string = secrets.newShare(6, shares.slice(0, 3))
            
            // Combine using new share with some original shares
            let recovered = secrets.combine([shares[0], shares[1], newShare])
            
            expect(recovered).toEqual(originalSecret)
        })

        it("should integrate multiple newShares with original shares", function(): void {
            let originalSecret = secrets.random(256)
            
            // Create initial shares
            let shares: string[] = secrets.share(originalSecret, 5, 3)
            
            // Generate multiple new shares
            let newShare6 = secrets.newShare(6, shares.slice(0, 3))
            let newShare7 = secrets.newShare(7, shares.slice(0, 3))
            let newShare8 = secrets.newShare(8, shares.slice(0, 3))
            
            // Combine using only new shares
            let recovered = secrets.combine([newShare6, newShare7, newShare8])
            
            expect(recovered).toEqual(originalSecret)
        })

        it("should integrate newShare created from minimum threshold shares", function(): void {
            let originalSecret = secrets.random(256)
            
            // Create shares with threshold of 2
            let shares: string[] = secrets.share(originalSecret, 5, 2)
            
            // Generate new share using only threshold shares
            let newShare: string = secrets.newShare(6, shares.slice(0, 2))
            
            // Combine using new share and one original
            let recovered = secrets.combine([shares[0], newShare])
            
            expect(recovered).toEqual(originalSecret)
        })

        it("should integrate newShare with different ID formats", function(): void {
            let originalSecret = secrets.random(256)
            
            // Create initial shares
            let shares: string[] = secrets.share(originalSecret, 5, 3)
            
            // Generate new shares with different ID formats
            let newShareNum = secrets.newShare(6, shares.slice(0, 3))
            let newShareStr = secrets.newShare("7", shares.slice(0, 3))
            let newShareFloat = secrets.newShare(8.9, shares.slice(0, 3))
            
            // All should work for recovery
            expect(secrets.combine([shares[0], shares[1], newShareNum])).toEqual(originalSecret)
            expect(secrets.combine([shares[0], shares[1], newShareStr])).toEqual(originalSecret)
            expect(secrets.combine([shares[0], shares[1], newShareFloat])).toEqual(originalSecret)
        })

        it("should integrate newShare across configuration changes", function(): void {
            // Create shares with 8-bit config
            secrets.init(8)
            let secret: string = secrets.random(128)
            let shares: string[] = secrets.share(secret, 5, 3)
            
            // Change configuration
            secrets.init(16)
            
            // Generate new share (should auto-adjust to share format)
            let newShare: string = secrets.newShare(6, shares.slice(0, 3))
            
            // Combine should work
            let recovered = secrets.combine([shares[0], shares[1], newShare])
            expect(recovered).toEqual(secret)
        })

        it("should integrate newShare with maximum ID values", function(): void {
            let originalSecret = secrets.random(128)
            
            // Create initial shares
            let shares: string[] = secrets.share(originalSecret, 5, 3)
            
            // Generate new share with maximum ID for 8-bit config
            let maxId: number = secrets.getConfig().maxShares
            let newShare: string = secrets.newShare(maxId, shares.slice(0, 3))
            
            // Combine using new share
            let recovered = secrets.combine([shares[0], shares[1], newShare])
            
            expect(recovered).toEqual(originalSecret)
        })

        it("should integrate newShare in complete workflow with text conversion", function(): void {
            let originalText = "Secret message for newShare integration test"
            let hexSecret = secrets.str2hex(originalText)
            
            // Create initial shares
            let shares: string[] = secrets.share(hexSecret, 5, 3)
            
            // Generate new share
            let newShare: string = secrets.newShare(6, shares.slice(0, 3))
            
            // Combine using new share and convert back to text
            let combinedHex = secrets.combine([shares[0], shares[1], newShare])
            let recoveredText = secrets.hex2str(combinedHex)
            
            expect(recoveredText).toEqual(originalText)
        })
    })

    describe("Error recovery and graceful degradation", function(): void {
        // Requirements: 6.5 - Error recovery and graceful degradation

        it("should recover from insufficient shares by adding more shares", function(): void {
            let originalSecret = secrets.random(256)
            
            // Create shares with threshold of 5
            let shares: string[] = secrets.share(originalSecret, 10, 5)
            
            // Try with insufficient shares (should not recover correctly)
            let insufficientResult = secrets.combine(shares.slice(0, 4))
            expect(insufficientResult).not.toEqual(originalSecret)
            
            // Add one more share to meet threshold
            let sufficientResult = secrets.combine(shares.slice(0, 5))
            expect(sufficientResult).toEqual(originalSecret)
        })

        it("should handle corrupted share gracefully by using other shares", function(): void {
            let originalSecret = secrets.random(256)
            
            // Create shares
            let shares: string[] = secrets.share(originalSecret, 10, 5)
            
            // Simulate corruption by using invalid share
            let sharesWithCorrupted = shares.slice(0, 4).concat(["invalid_share"])
            
            // Should throw error with corrupted share
            expect(function(): void {
                secrets.combine(sharesWithCorrupted)
            }).toThrowError()
            
            // But should work with valid shares only
            let recovered = secrets.combine(shares.slice(0, 5))
            expect(recovered).toEqual(originalSecret)
        })

        it("should handle missing shares by generating new ones", function(): void {
            let originalSecret = secrets.random(256)
            
            // Create initial shares
            let shares: string[] = secrets.share(originalSecret, 5, 3)
            
            // Simulate losing some shares (only have 2 left, need 3)
            let remainingShares = shares.slice(0, 2)
            
            // Cannot recover with insufficient shares
            let insufficientResult = secrets.combine(remainingShares)
            expect(insufficientResult).not.toEqual(originalSecret)
            
            // But if we had saved enough shares initially, we can use them
            let sufficientShares = shares.slice(0, 3)
            let recovered = secrets.combine(sufficientShares)
            expect(recovered).toEqual(originalSecret)
            
            // Or generate a new share from sufficient shares
            let newShare: string = secrets.newShare(6, sufficientShares)
            let recoveredWithNew = secrets.combine([shares[0], shares[1], newShare])
            expect(recoveredWithNew).toEqual(originalSecret)
        })

        it("should handle configuration errors gracefully", function(): void {
            // Create shares with valid configuration
            secrets.init(8)
            secrets.setRNG("testRandom")
            let originalSecret = secrets.random(128)
            let shares: string[] = secrets.share(originalSecret, 5, 3)
            
            // Try to initialize with invalid configuration
            expect(function(): void {
                secrets.init(2) // Too few bits
            }).toThrowError()
            
            // After failed init, configuration should be reset to defaults (8 bits)
            // Re-initialize to ensure we're in a known state
            secrets.init(8)
            secrets.setRNG("testRandom")
            
            // Should still be able to combine shares
            let recovered = secrets.combine(shares)
            expect(recovered).toEqual(originalSecret)
        })

        it("should handle RNG errors gracefully", function(): void {
            let originalSecret = "deadbeefcafebabe"
            
            // Create shares with valid RNG
            secrets.setRNG("testRandom")
            let shares: string[] = secrets.share(originalSecret, 5, 3)
            
            // Try to set invalid RNG
            expect(function(): void {
                secrets.setRNG("invalidRNG")
            }).toThrowError()
            
            // RNG should remain valid
            expect(secrets.getConfig().hasCSPRNG).toEqual(true)
            
            // Should still be able to combine shares
            let recovered = secrets.combine(shares)
            expect(recovered).toEqual(originalSecret)
        })

        it("should handle share format errors gracefully", function(): void {
            let originalSecret = secrets.random(128)
            
            // Create valid shares
            let shares: string[] = secrets.share(originalSecret, 5, 3)
            
            // Try to extract components from invalid share
            expect(function(): void {
                secrets.extractShareComponents("invalid")
            }).toThrowError()
            
            // Valid shares should still work
            shares.forEach(function(share) {
                let components = secrets.extractShareComponents(share)
                expect(components.bits).toEqual(8)
                expect(typeof components.id).toEqual("number")
                expect(typeof components.data).toEqual("string")
            })
            
            // Combining valid shares should still work
            let recovered = secrets.combine(shares)
            expect(recovered).toEqual(originalSecret)
        })

        it("should handle mixed valid and invalid operations", function(): void {
            let originalSecret = secrets.random(128)
            
            // Create shares
            let shares: string[] = secrets.share(originalSecret, 5, 3)
            
            // Perform some invalid operations
            expect(function(): void {
                secrets.share("invalid_hex", 5, 3)
            }).toThrowError()
            
            expect(function(): void {
                secrets.combine(["invalid_share"])
            }).toThrowError()
            
            // Valid operations should still work
            let recovered = secrets.combine(shares)
            expect(recovered).toEqual(originalSecret)
            
            // Can still create new shares
            let newShares = secrets.share(originalSecret, 7, 4)
            expect(newShares.length).toEqual(7)
            expect(secrets.combine(newShares.slice(0, 4))).toEqual(originalSecret)
        })
    })

    describe("Complex integration scenarios", function(): void {
        it("should handle complete workflow with multiple secret types", function(): void {
            let testData: Uint32Array = [
                { type: "ASCII", value: "Hello World!" },
                { type: "UTF-8", value: "¥£€$¢" },
                { type: "UTF-16", value: "𐑡𐑹𐑡" },
                { type: "Hex", value: secrets.random(256) }
            ]
            
            testData.forEach(function(data) {
                let hexSecret = data.type === "Hex" ? data.value : secrets.str2hex(data.value)
                let shares: string[] = secrets.share(hexSecret, 7, 4)
                let recovered = secrets.combine(shares.slice(0, 4))
                
                if (data.type === "Hex") {
                    expect(recovered).toEqual(data.value)
                } else {
                    expect(secrets.hex2str(recovered)).toEqual(data.value)
                }
            })
        })

        it("should handle workflow with share redistribution", function(): void {
            let originalSecret = secrets.random(256)
            
            // Create initial shares (5 shares, threshold 3)
            let initialShares = secrets.share(originalSecret, 5, 3)
            
            // Redistribute to more shares (10 shares, threshold 6)
            // First recover the secret
            let recovered = secrets.combine(initialShares.slice(0, 3))
            expect(recovered).toEqual(originalSecret)
            
            // Create new distribution
            let redistributedShares = secrets.share(recovered, 10, 6)
            
            // Verify new distribution works
            let finalRecovered = secrets.combine(redistributedShares.slice(0, 6))
            expect(finalRecovered).toEqual(originalSecret)
        })

        it("should handle workflow with incremental share generation", function(): void {
            let originalSecret = secrets.random(256)
            
            // Create initial shares
            let shares: string[] = secrets.share(originalSecret, 5, 3)
            
            // Incrementally generate new shares
            let allShares = shares.slice()
            for (let i: number = 6; i <= 10; i++) {
                let newShare: string = secrets.newShare(i, shares.slice(0, 3))
                allShares.push(newShare)
            }
            
            // Verify we now have 10 shares total
            expect(allShares.length).toEqual(10)
            
            // Verify any combination of 3 shares works
            expect(secrets.combine([allShares[0], allShares[5], allShares[9]])).toEqual(originalSecret)
            expect(secrets.combine([allShares[2], allShares[6], allShares[8]])).toEqual(originalSecret)
        })

        it("should handle workflow with configuration migration", function(): void {
            // Start with 8-bit configuration
            secrets.init(8)
            let secret: string = secrets.random(128)
            let shares8bit = secrets.share(secret, 5, 3)
            
            // Recover secret
            let recovered = secrets.combine(shares8bit)
            expect(recovered).toEqual(secret)
            
            // Migrate to 16-bit configuration
            secrets.init(16)
            let shares16bit = secrets.share(recovered, 10, 5)
            
            // Verify migration worked
            let finalRecovered = secrets.combine(shares16bit)
            expect(finalRecovered).toEqual(secret)
            
            // Verify old shares still work (auto-adjusts)
            let oldRecovered = secrets.combine(shares8bit)
            expect(oldRecovered).toEqual(secret)
        })

        it("should handle complete end-to-end workflow with all features", function(): void {
            // 1. Start with text
            let originalText = "Complete integration test with all features!"
            
            // 2. Convert to hex
            let hexSecret = secrets.str2hex(originalText)
            
            // 3. Share with padding
            let shares: string[] = secrets.share(hexSecret, 10, 6, 256)
            expect(shares.length).toEqual(10)
            
            // 4. Generate additional shares
            let newShare11 = secrets.newShare(11, shares.slice(0, 6))
            let newShare12 = secrets.newShare(12, shares.slice(0, 6))
            
            // 5. Combine using mix of original and new shares
            let combinedHex = secrets.combine([
                shares[0],
                shares[3],
                shares[7],
                newShare11,
                shares[5],
                newShare12
            ])
            
            // 6. Convert back to text
            let recoveredText = secrets.hex2str(combinedHex)
            
            // 7. Verify complete round trip
            expect(recoveredText).toEqual(originalText)
        })
    })

    describe("Property-Based Tests for Integration", function(): void {
        /**
         * Property 8: NewShare Integration
         * Feature: comprehensive-testing, Property 8: For any valid set of threshold shares,
         * generating a new share and using it in combination with existing shares should
         * successfully reconstruct the original secret.
         * Validates: Requirements 6.2
         */
        it("Property 8: NewShare Integration - for any valid set of threshold shares, new shares integrate correctly", function(): void {
            let iterations = 100
            let successes = 0
            let failures = []
            
            for (let i: number = 0; i < iterations; i++) {
                try {
                    // Generate random test data
                    let bits: number = Math.floor(Math.random() * 18) + 3 // 3 to 20
                    secrets.init(bits)
                    
                    let secretBits = Math.floor(Math.random() * 505) + 8 // 8 to 512
                    let originalSecret = secrets.random(secretBits)
                    
                    let maxShares = Math.min(secrets.getConfig().maxShares, 100)
                    let numShares: number = Math.floor(Math.random() * (maxShares - 2)) + 3 // 3 to maxShares
                    let threshold: number = Math.floor(Math.random() * (numShares - 1)) + 2 // 2 to numShares
                    
                    // Create shares
                    let shares: string[] = secrets.share(originalSecret, numShares, threshold)
                    
                    // Generate new share ID (not in existing shares, but within maxShares)
                    let maxId: number = secrets.getConfig().maxShares
                    let newShareId = Math.min(numShares + 1, maxId)
                    
                    // Generate new share using threshold shares
                    let newShare: string = secrets.newShare(newShareId, shares.slice(0, threshold))
                    
                    // Test 1: New share with threshold-1 original shares should work
                    let sharesForRecovery = shares.slice(0, threshold - 1).concat([newShare])
                    let recovered = secrets.combine(sharesForRecovery)
                    
                    if (recovered !== originalSecret) {
                        failures.push({
                            iteration: i,
                            bits: bits,
                            secretBits: secretBits,
                            numShares: numShares,
                            threshold: threshold,
                            newShareId: newShareId,
                            reason: "New share did not integrate correctly with original shares"
                        })
                    } else {
                        successes++
                    }
                } catch (error) {
                    failures.push({
                        iteration: i,
                        error: error.message
                    })
                }
            }
            
            // Report results
            if (failures.length > 0) {
                console.log("Property 8 failures:", failures)
            }
            
            expect(successes).toEqual(iterations)
            expect(failures.length).toEqual(0)
        })

        /**
         * Additional property test: NewShare with multiple new shares
         * Validates that multiple new shares can be generated and used together
         */
        it("Property 8b: Multiple NewShares Integration - multiple new shares work together", function(): void {
            let iterations = 100
            let successes = 0
            let failures = []
            
            for (let i: number = 0; i < iterations; i++) {
                try {
                    // Generate random test data
                    let bits: number = Math.floor(Math.random() * 18) + 3 // 3 to 20
                    secrets.init(bits)
                    
                    let secretBits = Math.floor(Math.random() * 505) + 8 // 8 to 512
                    let originalSecret = secrets.random(secretBits)
                    
                    let maxShares = Math.min(secrets.getConfig().maxShares, 50)
                    let numShares: number = Math.floor(Math.random() * (maxShares - 2)) + 3 // 3 to maxShares
                    let threshold: number = Math.floor(Math.random() * (numShares - 1)) + 2 // 2 to numShares
                    
                    // Create shares
                    let shares: string[] = secrets.share(originalSecret, numShares, threshold)
                    
                    // Generate multiple new shares (ensure we don't exceed maxShares)
                    let newShares = []
                    let maxId: number = secrets.getConfig().maxShares
                    let numNewShares = Math.min(threshold, 5, maxId - numShares) // Don't exceed maxShares
                    
                    // Skip if we can't create any new shares
                    if (numNewShares <= 0) {
                        successes++
                        continue
                    }
                    
                    for (let j: number = 0; j < numNewShares; j++) {
                        let newShareId = numShares + 1 + j
                        if (newShareId > maxId) break // Stop if we exceed maxId
                        let newShare: string = secrets.newShare(newShareId, shares.slice(0, threshold))
                        newShares.push(newShare)
                    }
                    
                    // Test: Use only new shares (if we have enough)
                    if (newShares.length >= threshold) {
                        let recovered = secrets.combine(newShares.slice(0, threshold))
                        
                        if (recovered !== originalSecret) {
                            failures.push({
                                iteration: i,
                                bits: bits,
                                secretBits: secretBits,
                                numShares: numShares,
                                threshold: threshold,
                                numNewShares: numNewShares,
                                reason: "Multiple new shares did not work together"
                            })
                        } else {
                            successes++
                        }
                    } else {
                        // Test: Mix of new shares and original shares
                        let mixedShares = newShares.concat(shares.slice(0, threshold - newShares.length))
                        let recovered = secrets.combine(mixedShares)
                        
                        if (recovered !== originalSecret) {
                            failures.push({
                                iteration: i,
                                bits: bits,
                                secretBits: secretBits,
                                numShares: numShares,
                                threshold: threshold,
                                numNewShares: numNewShares,
                                reason: "Mixed new and original shares did not work"
                            })
                        } else {
                            successes++
                        }
                    }
                } catch (error) {
                    failures.push({
                        iteration: i,
                        error: error.message
                    })
                }
            }
            
            // Report results
            if (failures.length > 0) {
                console.log("Property 8b failures:", failures)
            }
            
            expect(successes).toEqual(iterations)
            expect(failures.length).toEqual(0)
        })

        /**
         * Additional property test: NewShare with minimum threshold shares
         * Validates that new shares can be generated from exactly threshold shares
         */
        it("Property 8c: NewShare from Minimum Threshold - new shares work from minimum shares", function(): void {
            let iterations = 100
            let successes = 0
            let failures = []
            
            for (let i: number = 0; i < iterations; i++) {
                try {
                    // Generate random test data
                    let bits: number = Math.floor(Math.random() * 18) + 3 // 3 to 20
                    secrets.init(bits)
                    
                    let secretBits = Math.floor(Math.random() * 505) + 8 // 8 to 512
                    let originalSecret = secrets.random(secretBits)
                    
                    let maxShares = Math.min(secrets.getConfig().maxShares, 50)
                    let numShares: number = Math.floor(Math.random() * (maxShares - 2)) + 3 // 3 to maxShares
                    let threshold: number = Math.floor(Math.random() * (numShares - 1)) + 2 // 2 to numShares
                    
                    // Create shares
                    let shares: string[] = secrets.share(originalSecret, numShares, threshold)
                    
                    // Generate new share using EXACTLY threshold shares (minimum required)
                    let maxId: number = secrets.getConfig().maxShares
                    let newShareId = Math.min(numShares + 1, maxId)
                    let newShare: string = secrets.newShare(newShareId, shares.slice(0, threshold))
                    
                    // Test: Use new share with threshold-1 original shares
                    let sharesForRecovery = shares.slice(0, threshold - 1).concat([newShare])
                    let recovered = secrets.combine(sharesForRecovery)
                    
                    if (recovered !== originalSecret) {
                        failures.push({
                            iteration: i,
                            bits: bits,
                            secretBits: secretBits,
                            numShares: numShares,
                            threshold: threshold,
                            reason: "New share from minimum threshold did not work"
                        })
                    } else {
                        successes++
                    }
                } catch (error) {
                    failures.push({
                        iteration: i,
                        error: error.message
                    })
                }
            }
            
            // Report results
            if (failures.length > 0) {
                console.log("Property 8c failures:", failures)
            }
            
            expect(successes).toEqual(iterations)
            expect(failures.length).toEqual(0)
        })
    })
})
