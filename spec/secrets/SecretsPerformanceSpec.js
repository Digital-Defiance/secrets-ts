/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */
/*global secrets, describe, it, expect, PerformanceHelper, TestDataGenerators */

/**
 * Performance Testing Suite for @digitaldefiance/secrets
 * 
 * This test suite validates performance characteristics and ensures
 * the library meets performance requirements across various input sizes.
 * 
 * Feature: comprehensive-testing
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

// when running in a node.js env.
if (typeof require === "function") {
    crypto = require("crypto")
    secrets = require("../../secrets.js")
    PerformanceHelper = require("../helpers/PerformanceHelper.js")
    TestDataGenerators = require("../helpers/TestDataGenerators.js")
}

describe("Secrets Performance Tests", function() {
    
    beforeEach(function() {
        // Initialize with default settings for each test
        secrets.init()
    })
    
    describe("Performance Test Infrastructure", function() {
        
        it("should have performance helper available", function() {
            expect(PerformanceHelper).toBeDefined()
            expect(typeof PerformanceHelper.benchmark).toBe("function")
            expect(typeof PerformanceHelper.measureExecution).toBe("function")
            expect(typeof PerformanceHelper.getHighResTime).toBe("function")
        })
        
        it("should measure execution time accurately", function() {
            var testFn = function() {
                var sum = 0
                for (var i = 0; i < 1000; i++) {
                    sum += i
                }
                return sum
            }
            
            var measurement = PerformanceHelper.measureExecution(testFn)
            
            expect(measurement).toBeDefined()
            expect(typeof measurement.result).toBe("number")
            expect(typeof measurement.duration).toBe("number")
            expect(measurement.duration).toBeGreaterThanOrEqual(0)
        })
        
        it("should run benchmarks with multiple iterations", function() {
            var testFn = function() {
                return Math.random()
            }
            
            var result = PerformanceHelper.benchmark("Test benchmark", testFn, {
                iterations: 10,
                warmupIterations: 2
            })
            
            expect(result).toBeDefined()
            expect(result.iterations).toBe(10)
            expect(result.avgDuration).toBeGreaterThanOrEqual(0)
            expect(result.minDuration).toBeGreaterThanOrEqual(0)
            expect(result.maxDuration).toBeGreaterThanOrEqual(result.minDuration)
            expect(result.measurements.length).toBe(10)
        })
    })
    
    describe("Share Generation Performance", function() {
        
        // Requirement 5.1: Performance benchmarks for major operations
        it("should benchmark share generation with small secrets (64-bit)", function() {
            var secret = TestDataGenerators.generateRandomSecret(64, 64)
            
            var testFn = function() {
                return secrets.share(secret, 5, 3)
            }
            
            var result = PerformanceHelper.benchmark("Share generation (64-bit)", testFn, {
                iterations: 100
            })
            
            expect(result.avgDuration).toBeLessThan(100) // Should complete in < 100ms on average
            
            console.log("Share generation (64-bit) performance:")
            console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
            console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
            console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
        })
        
        // Requirement 5.2: Performance with large secrets (up to 1024 bits)
        it("should benchmark share generation with medium secrets (256-bit)", function() {
            var secret = TestDataGenerators.generateRandomSecret(256, 256)
            
            var testFn = function() {
                return secrets.share(secret, 5, 3)
            }
            
            var result = PerformanceHelper.benchmark("Share generation (256-bit)", testFn, {
                iterations: 100
            })
            
            expect(result.avgDuration).toBeLessThan(200) // Should complete in < 200ms on average
            
            console.log("Share generation (256-bit) performance:")
            console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
            console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
            console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
        })
        
        // Requirement 5.2: Performance with large secrets (up to 1024 bits)
        it("should benchmark share generation with large secrets (512-bit)", function() {
            var secret = TestDataGenerators.generateRandomSecret(512, 512)
            
            var testFn = function() {
                return secrets.share(secret, 5, 3)
            }
            
            var result = PerformanceHelper.benchmark("Share generation (512-bit)", testFn, {
                iterations: 50
            })
            
            expect(result.avgDuration).toBeLessThan(500) // Should complete in < 500ms on average
            
            console.log("Share generation (512-bit) performance:")
            console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
            console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
            console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
        })
    })
    
    describe("Share Combination Performance", function() {
        
        // Requirement 5.1: Performance benchmarks for major operations
        it("should benchmark share combination with small secrets (64-bit)", function() {
            var secret = TestDataGenerators.generateRandomSecret(64, 64)
            var shares = secrets.share(secret, 5, 3)
            var thresholdShares = shares.slice(0, 3)
            
            var testFn = function() {
                return secrets.combine(thresholdShares)
            }
            
            var result = PerformanceHelper.benchmark("Share combination (64-bit)", testFn, {
                iterations: 100
            })
            
            expect(result.avgDuration).toBeLessThan(100) // Should complete in < 100ms on average
            
            console.log("Share combination (64-bit) performance:")
            console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
            console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
            console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
        })
        
        // Requirement 5.2: Performance with large secrets
        it("should benchmark share combination with medium secrets (256-bit)", function() {
            var secret = TestDataGenerators.generateRandomSecret(256, 256)
            var shares = secrets.share(secret, 5, 3)
            var thresholdShares = shares.slice(0, 3)
            
            var testFn = function() {
                return secrets.combine(thresholdShares)
            }
            
            var result = PerformanceHelper.benchmark("Share combination (256-bit)", testFn, {
                iterations: 100
            })
            
            expect(result.avgDuration).toBeLessThan(200) // Should complete in < 200ms on average
            
            console.log("Share combination (256-bit) performance:")
            console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
            console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
            console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
        })
        
        // Requirement 5.2: Performance with large secrets
        it("should benchmark share combination with large secrets (512-bit)", function() {
            var secret = TestDataGenerators.generateRandomSecret(512, 512)
            var shares = secrets.share(secret, 5, 3)
            var thresholdShares = shares.slice(0, 3)
            
            var testFn = function() {
                return secrets.combine(thresholdShares)
            }
            
            var result = PerformanceHelper.benchmark("Share combination (512-bit)", testFn, {
                iterations: 50
            })
            
            expect(result.avgDuration).toBeLessThan(500) // Should complete in < 500ms on average
            
            console.log("Share combination (512-bit) performance:")
            console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
            console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
            console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
        })
    })
    
    describe("Maximum Share Count Performance", function() {
        
        // Requirement 5.3: Performance with maximum shares (255)
        it("should handle maximum share count with 8-bit configuration", function() {
            secrets.init(8) // 8-bit allows up to 255 shares
            var secret = TestDataGenerators.generateRandomSecret(64, 64)
            
            var testFn = function() {
                return secrets.share(secret, 255, 128)
            }
            
            var result = PerformanceHelper.benchmark("Share generation (255 shares)", testFn, {
                iterations: 10
            })
            
            // With 255 shares, this will be slower but should still complete in reasonable time
            expect(result.avgDuration).toBeLessThan(5000) // Should complete in < 5 seconds
            
            console.log("Share generation (255 shares) performance:")
            console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
            console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
            console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
        })
        
        // Requirement 5.3: Performance with maximum shares
        it("should combine shares efficiently with many shares", function() {
            secrets.init(8)
            var secret = TestDataGenerators.generateRandomSecret(64, 64)
            var shares = secrets.share(secret, 50, 25)
            var thresholdShares = shares.slice(0, 25)
            
            var testFn = function() {
                return secrets.combine(thresholdShares)
            }
            
            var result = PerformanceHelper.benchmark("Share combination (25 of 50 shares)", testFn, {
                iterations: 20
            })
            
            expect(result.avgDuration).toBeLessThan(1000) // Should complete in < 1 second
            
            console.log("Share combination (25 of 50 shares) performance:")
            console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
            console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
            console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
        })
    })
    
    describe("String Conversion Performance", function() {
        
        // Requirement 5.1: Performance benchmarks for major operations
        it("should benchmark str2hex conversion", function() {
            var testString = TestDataGenerators.generateRandomString(50, 100)
            
            var testFn = function() {
                return secrets.str2hex(testString)
            }
            
            var result = PerformanceHelper.benchmark("str2hex conversion", testFn, {
                iterations: 100
            })
            
            expect(result.avgDuration).toBeLessThan(50) // Should be very fast
            
            console.log("str2hex conversion performance:")
            console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
            console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
            console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
        })
        
        // Requirement 5.1: Performance benchmarks for major operations
        it("should benchmark hex2str conversion", function() {
            var testString = TestDataGenerators.generateRandomString(50, 100)
            var hexString = secrets.str2hex(testString)
            
            var testFn = function() {
                return secrets.hex2str(hexString)
            }
            
            var result = PerformanceHelper.benchmark("hex2str conversion", testFn, {
                iterations: 100
            })
            
            expect(result.avgDuration).toBeLessThan(50) // Should be very fast
            
            console.log("hex2str conversion performance:")
            console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
            console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
            console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
        })
    })
    
    describe("NewShare Generation Performance", function() {
        
        // Requirement 5.1: Performance benchmarks for major operations
        it("should benchmark newShare generation", function() {
            var secret = TestDataGenerators.generateRandomSecret(128, 128)
            var shares = secrets.share(secret, 10, 5)
            var thresholdShares = shares.slice(0, 5)
            
            var testFn = function() {
                return secrets.newShare(11, thresholdShares)
            }
            
            var result = PerformanceHelper.benchmark("newShare generation", testFn, {
                iterations: 100
            })
            
            expect(result.avgDuration).toBeLessThan(200) // Should complete reasonably fast
            
            console.log("newShare generation performance:")
            console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
            console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
            console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
        })
    })
    
    describe("Random Number Generation Performance", function() {
        
        // Requirement 5.1: Performance benchmarks for major operations
        it("should benchmark random number generation", function() {
            var testFn = function() {
                return secrets.random(256)
            }
            
            var result = PerformanceHelper.benchmark("Random number generation (256-bit)", testFn, {
                iterations: 100
            })
            
            expect(result.avgDuration).toBeLessThan(50) // Should be very fast
            
            console.log("Random number generation (256-bit) performance:")
            console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
            console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
            console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
        })
    })
    
    describe("Performance Consistency", function() {
        
        // Requirement 5.5: Operations complete within reasonable time bounds
        it("should have consistent performance across multiple runs", function() {
            var secret = TestDataGenerators.generateRandomSecret(128, 128)
            var results = []
            var runs = 5
            
            for (var i = 0; i < runs; i++) {
                var testFn = function() {
                    return secrets.share(secret, 5, 3)
                }
                
                var result = PerformanceHelper.benchmark("Consistency test run " + (i + 1), testFn, {
                    iterations: 20
                })
                results.push(result.avgDuration)
            }
            
            // Calculate coefficient of variation (std dev / mean)
            var mean = results.reduce(function(sum, val) { return sum + val }, 0) / runs
            var variance = results.reduce(function(sum, val) { return sum + Math.pow(val - mean, 2) }, 0) / runs
            var stdDev = Math.sqrt(variance)
            var coefficientOfVariation = stdDev / mean
            
            // Performance should be reasonably consistent (CV < 0.5)
            expect(coefficientOfVariation).toBeLessThan(0.5)
            
            console.log("Performance consistency:")
            console.log("  Mean: " + mean.toFixed(2) + "ms")
            console.log("  Std Dev: " + stdDev.toFixed(2) + "ms")
            console.log("  Coefficient of Variation: " + coefficientOfVariation.toFixed(3))
        })
    })
    
    describe("Memory Usage Tests", function() {
        
        // Requirement 5.4: Memory usage validation for large operations
        it("should not leak memory during repeated share generation", function() {
            // Only run memory tests in Node.js environment
            if (typeof process === "undefined" || !process.memoryUsage) {
                pending("Memory tests only run in Node.js environment")
                return
            }
            
            var secret = TestDataGenerators.generateRandomSecret(128, 128)
            var iterations = 1000
            
            var result = PerformanceHelper.memoryStressTest(function() {
                return secrets.share(secret, 10, 5)
            }, iterations)
            
            // Memory growth should be reasonable (less than 10MB for 1000 iterations)
            var memoryGrowthMB = result.memoryGrowth / (1024 * 1024)
            expect(memoryGrowthMB).toBeLessThan(10)
            
            console.log("Memory usage for repeated share generation:")
            console.log("  Initial: " + (result.initialMemory / (1024 * 1024)).toFixed(2) + " MB")
            console.log("  Final: " + (result.finalMemory / (1024 * 1024)).toFixed(2) + " MB")
            console.log("  Growth: " + memoryGrowthMB.toFixed(2) + " MB")
        })
        
        // Requirement 5.4: Memory usage validation
        it("should not leak memory during repeated share combination", function() {
            if (typeof process === "undefined" || !process.memoryUsage) {
                pending("Memory tests only run in Node.js environment")
                return
            }
            
            var secret = TestDataGenerators.generateRandomSecret(128, 128)
            var shares = secrets.share(secret, 10, 5)
            var thresholdShares = shares.slice(0, 5)
            var iterations = 1000
            
            var result = PerformanceHelper.memoryStressTest(function() {
                return secrets.combine(thresholdShares)
            }, iterations)
            
            // Memory growth should be reasonable
            var memoryGrowthMB = result.memoryGrowth / (1024 * 1024)
            expect(memoryGrowthMB).toBeLessThan(10)
            
            console.log("Memory usage for repeated share combination:")
            console.log("  Initial: " + (result.initialMemory / (1024 * 1024)).toFixed(2) + " MB")
            console.log("  Final: " + (result.finalMemory / (1024 * 1024)).toFixed(2) + " MB")
            console.log("  Growth: " + memoryGrowthMB.toFixed(2) + " MB")
        })
        
        // Requirement 5.4: Memory usage with large inputs
        it("should handle large secrets without excessive memory usage", function() {
            if (typeof process === "undefined" || !process.memoryUsage) {
                pending("Memory tests only run in Node.js environment")
                return
            }
            
            var secret = TestDataGenerators.generateRandomSecret(512, 512)
            
            var measurement = PerformanceHelper.measureExecution(function() {
                var shares = secrets.share(secret, 10, 5)
                return secrets.combine(shares.slice(0, 5))
            })
            
            // Memory used should be reasonable (less than 50MB for a single large operation)
            var memoryUsedMB = Math.abs(measurement.memoryUsed) / (1024 * 1024)
            expect(memoryUsedMB).toBeLessThan(50)
            
            console.log("Memory usage for large secret (512-bit):")
            console.log("  Memory used: " + memoryUsedMB.toFixed(2) + " MB")
            console.log("  Duration: " + measurement.duration.toFixed(2) + " ms")
        })
    })
    
    describe("Stress Tests", function() {
        
        // Requirement 5.1, 5.5: Stress tests with maximum parameters
        it("should handle stress test with many operations", function() {
            var operations = 100
            var maxFailures = 5 // Allow up to 5% failure rate
            var failures = 0
            
            for (var i = 0; i < operations; i++) {
                try {
                    var secret = TestDataGenerators.generateRandomSecret(64, 256)
                    var config = TestDataGenerators.generateShareConfig(20)
                    
                    var shares = secrets.share(secret, config.numShares, config.threshold)
                    var thresholdShares = shares.slice(0, config.threshold)
                    var recovered = secrets.combine(thresholdShares)
                    
                    // Verify correctness
                    if (recovered !== secret) {
                        failures++
                    }
                } catch (error) {
                    failures++
                }
            }
            
            expect(failures).toBeLessThanOrEqual(maxFailures)
            
            console.log("Stress test results:")
            console.log("  Operations: " + operations)
            console.log("  Failures: " + failures)
            console.log("  Success rate: " + ((operations - failures) / operations * 100).toFixed(2) + "%")
        })
        
        // Requirement 5.3: Stress test with many shares
        it("should handle stress test with high share counts", function() {
            secrets.init(8) // 8-bit for higher share counts
            var operations = 20
            var failures = 0
            
            for (var i = 0; i < operations; i++) {
                try {
                    var secret = TestDataGenerators.generateRandomSecret(64, 128)
                    var numShares = Math.floor(Math.random() * 50) + 20 // 20-70 shares
                    var threshold = Math.floor(numShares / 2) + 1
                    
                    var shares = secrets.share(secret, numShares, threshold)
                    var thresholdShares = shares.slice(0, threshold)
                    var recovered = secrets.combine(thresholdShares)
                    
                    if (recovered !== secret) {
                        failures++
                    }
                } catch (error) {
                    failures++
                }
            }
            
            expect(failures).toBe(0)
            
            console.log("High share count stress test results:")
            console.log("  Operations: " + operations)
            console.log("  Failures: " + failures)
        })
        
        // Requirement 5.2: Stress test with large bit sizes
        it("should handle stress test with large bit sizes", function() {
            var operations = 20
            var failures = 0
            
            for (var i = 0; i < operations; i++) {
                try {
                    var bitSize = Math.floor(Math.random() * 512) + 256 // 256-768 bits
                    var secret = TestDataGenerators.generateRandomSecret(bitSize, bitSize)
                    
                    var shares = secrets.share(secret, 10, 5)
                    var thresholdShares = shares.slice(0, 5)
                    var recovered = secrets.combine(thresholdShares)
                    
                    if (recovered !== secret) {
                        failures++
                    }
                } catch (error) {
                    failures++
                }
            }
            
            expect(failures).toBe(0)
            
            console.log("Large bit size stress test results:")
            console.log("  Operations: " + operations)
            console.log("  Failures: " + failures)
        })
    })
    
    describe("Property 7: Performance Bounds", function() {
        
        /**
         * Property 7: Performance Bounds
         * 
         * For any valid operation with large inputs (up to 1024 bits or 255 shares),
         * execution should complete within reasonable time bounds.
         * 
         * Validates: Requirements 5.2, 5.3, 5.5
         * Feature: comprehensive-testing, Property 7: Performance Bounds
         */
        
        it("should complete share generation within time bounds for random inputs", function() {
            var iterations = 100
            var maxDuration = 1000 // 1 second max for any single operation
            var failures = []
            
            for (var i = 0; i < iterations; i++) {
                // Generate random test data with varying sizes
                var bitSize = Math.floor(Math.random() * 504) + 8 // 8 to 512 bits
                var secret = TestDataGenerators.generateRandomSecret(bitSize, bitSize)
                var config = TestDataGenerators.generateShareConfig(50) // Up to 50 shares
                
                var measurement = PerformanceHelper.measureExecution(function() {
                    return secrets.share(secret, config.numShares, config.threshold)
                })
                
                if (measurement.duration > maxDuration) {
                    failures.push({
                        iteration: i,
                        bitSize: bitSize,
                        numShares: config.numShares,
                        threshold: config.threshold,
                        duration: measurement.duration
                    })
                }
            }
            
            // All operations should complete within time bounds
            expect(failures.length).toBe(0)
            
            if (failures.length > 0) {
                console.log("Performance bound failures:")
                failures.forEach(function(failure) {
                    console.log("  Iteration " + failure.iteration + ": " + 
                               failure.bitSize + " bits, " + 
                               failure.numShares + " shares, " + 
                               failure.threshold + " threshold - " + 
                               failure.duration.toFixed(2) + "ms")
                })
            }
        })
        
        it("should complete share combination within time bounds for random inputs", function() {
            var iterations = 100
            var maxDuration = 1000 // 1 second max for any single operation
            var failures = []
            
            for (var i = 0; i < iterations; i++) {
                // Generate random test data with varying sizes
                var bitSize = Math.floor(Math.random() * 504) + 8 // 8 to 512 bits
                var secret = TestDataGenerators.generateRandomSecret(bitSize, bitSize)
                var config = TestDataGenerators.generateShareConfig(50)
                
                var shares = secrets.share(secret, config.numShares, config.threshold)
                var thresholdShares = shares.slice(0, config.threshold)
                
                var measurement = PerformanceHelper.measureExecution(function() {
                    return secrets.combine(thresholdShares)
                })
                
                if (measurement.duration > maxDuration) {
                    failures.push({
                        iteration: i,
                        bitSize: bitSize,
                        numShares: config.numShares,
                        threshold: config.threshold,
                        duration: measurement.duration
                    })
                }
            }
            
            // All operations should complete within time bounds
            expect(failures.length).toBe(0)
            
            if (failures.length > 0) {
                console.log("Performance bound failures:")
                failures.forEach(function(failure) {
                    console.log("  Iteration " + failure.iteration + ": " + 
                               failure.bitSize + " bits, " + 
                               failure.numShares + " shares, " + 
                               failure.threshold + " threshold - " + 
                               failure.duration.toFixed(2) + "ms")
                })
            }
        })
        
        it("should complete newShare generation within time bounds for random inputs", function() {
            var iterations = 100
            var maxDuration = 1000 // 1 second max for any single operation
            var failures = []
            
            for (var i = 0; i < iterations; i++) {
                // Generate random test data with varying sizes
                var bitSize = Math.floor(Math.random() * 504) + 8 // 8 to 512 bits
                var secret = TestDataGenerators.generateRandomSecret(bitSize, bitSize)
                var config = TestDataGenerators.generateShareConfig(50)
                
                var shares = secrets.share(secret, config.numShares, config.threshold)
                var thresholdShares = shares.slice(0, config.threshold)
                var newId = config.numShares + 1
                
                var measurement = PerformanceHelper.measureExecution(function() {
                    return secrets.newShare(newId, thresholdShares)
                })
                
                if (measurement.duration > maxDuration) {
                    failures.push({
                        iteration: i,
                        bitSize: bitSize,
                        numShares: config.numShares,
                        threshold: config.threshold,
                        duration: measurement.duration
                    })
                }
            }
            
            // All operations should complete within time bounds
            expect(failures.length).toBe(0)
            
            if (failures.length > 0) {
                console.log("Performance bound failures:")
                failures.forEach(function(failure) {
                    console.log("  Iteration " + failure.iteration + ": " + 
                               failure.bitSize + " bits, " + 
                               failure.numShares + " shares, " + 
                               failure.threshold + " threshold - " + 
                               failure.duration.toFixed(2) + "ms")
                })
            }
        })
        
        it("should complete string conversion within time bounds for random inputs", function() {
            var iterations = 100
            var maxDuration = 100 // 100ms max for string conversions
            var failures = []
            
            for (var i = 0; i < iterations; i++) {
                // Generate random strings of varying lengths
                var str = TestDataGenerators.generateRandomString(10, 200)
                
                var measurement = PerformanceHelper.measureExecution(function() {
                    var hex = secrets.str2hex(str)
                    return secrets.hex2str(hex)
                })
                
                if (measurement.duration > maxDuration) {
                    failures.push({
                        iteration: i,
                        stringLength: str.length,
                        duration: measurement.duration
                    })
                }
            }
            
            // All operations should complete within time bounds
            expect(failures.length).toBe(0)
            
            if (failures.length > 0) {
                console.log("Performance bound failures:")
                failures.forEach(function(failure) {
                    console.log("  Iteration " + failure.iteration + ": " + 
                               "string length " + failure.stringLength + " - " + 
                               failure.duration.toFixed(2) + "ms")
                })
            }
        })
        
        it("should handle large inputs (up to 1024 bits) within reasonable time", function() {
            var iterations = 20 // Fewer iterations for large inputs
            var maxDuration = 5000 // 5 seconds max for very large operations
            var failures = []
            
            for (var i = 0; i < iterations; i++) {
                // Test with large bit sizes (512-1024 bits)
                var bitSize = Math.floor(Math.random() * 512) + 512 // 512 to 1024 bits
                var secret = TestDataGenerators.generateRandomSecret(bitSize, bitSize)
                var config = { numShares: 10, threshold: 5 } // Reasonable share count
                
                var measurement = PerformanceHelper.measureExecution(function() {
                    var shares = secrets.share(secret, config.numShares, config.threshold)
                    var thresholdShares = shares.slice(0, config.threshold)
                    return secrets.combine(thresholdShares)
                })
                
                if (measurement.duration > maxDuration) {
                    failures.push({
                        iteration: i,
                        bitSize: bitSize,
                        duration: measurement.duration
                    })
                }
            }
            
            // All operations should complete within time bounds
            expect(failures.length).toBe(0)
            
            if (failures.length > 0) {
                console.log("Performance bound failures for large inputs:")
                failures.forEach(function(failure) {
                    console.log("  Iteration " + failure.iteration + ": " + 
                               failure.bitSize + " bits - " + 
                               failure.duration.toFixed(2) + "ms")
                })
            }
        })
        
        it("should handle maximum share counts within reasonable time", function() {
            secrets.init(8) // 8-bit allows up to 255 shares
            var iterations = 10 // Fewer iterations for max shares
            var maxDuration = 10000 // 10 seconds max for maximum share operations
            var failures = []
            
            for (var i = 0; i < iterations; i++) {
                var secret = TestDataGenerators.generateRandomSecret(64, 128)
                var numShares = Math.floor(Math.random() * 155) + 100 // 100 to 255 shares
                var threshold = Math.floor(numShares / 2) + 1
                
                var measurement = PerformanceHelper.measureExecution(function() {
                    return secrets.share(secret, numShares, threshold)
                })
                
                if (measurement.duration > maxDuration) {
                    failures.push({
                        iteration: i,
                        numShares: numShares,
                        threshold: threshold,
                        duration: measurement.duration
                    })
                }
            }
            
            // All operations should complete within time bounds
            expect(failures.length).toBe(0)
            
            if (failures.length > 0) {
                console.log("Performance bound failures for max shares:")
                failures.forEach(function(failure) {
                    console.log("  Iteration " + failure.iteration + ": " + 
                               failure.numShares + " shares, " + 
                               failure.threshold + " threshold - " + 
                               failure.duration.toFixed(2) + "ms")
                })
            }
        })
    })
})
