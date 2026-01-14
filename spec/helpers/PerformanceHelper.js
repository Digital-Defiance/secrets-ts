/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */
/*global performance */

/**
 * Performance Measurement Helper Utilities
 * 
 * This module provides utilities for measuring and analyzing
 * performance characteristics of the @brightchain/secrets library.
 */

// when running in a node.js env.
if (typeof require === "function") {
    crypto = require("crypto")
    secrets = require("../../secrets.js")
}

/**
 * Environment-based performance test configuration
 */
var PerformanceConfig = {
    FAST: {
        BENCHMARK_ITERATIONS: 5,
        WARMUP_ITERATIONS: 2,
        STRESS_ITERATIONS: 100,
        CONSISTENCY_RUNS: 2
    },
    STANDARD: {
        BENCHMARK_ITERATIONS: 20,
        WARMUP_ITERATIONS: 5,
        STRESS_ITERATIONS: 500,
        CONSISTENCY_RUNS: 3
    },
    CI: {
        BENCHMARK_ITERATIONS: 50,
        WARMUP_ITERATIONS: 10,
        STRESS_ITERATIONS: 1000,
        CONSISTENCY_RUNS: 5
    },
    COMPREHENSIVE: {
        BENCHMARK_ITERATIONS: 100,
        WARMUP_ITERATIONS: 20,
        STRESS_ITERATIONS: 2000,
        CONSISTENCY_RUNS: 10
    }
}

/**
 * Gets the current performance test mode
 * @returns {string} Performance test mode
 */
function getPerformanceMode() {
    if (typeof process !== "undefined" && process.env) {
        var mode = process.env.TEST_MODE || process.env.NODE_ENV
        if (mode === "fast" || mode === "development") return "FAST"
        if (mode === "ci" || mode === "test") return "CI"
        if (mode === "comprehensive") return "COMPREHENSIVE"
    }
    return "STANDARD"
}

/**
 * Gets the iteration count for performance tests
 * @param {string} testType - Type of performance test
 * @param {number} override - Optional override value
 * @returns {number} Number of iterations
 */
function getPerformanceIterations(testType, override) {
    if (override !== undefined && override !== null) {
        return override
    }
    
    var mode = getPerformanceMode()
    var config = PerformanceConfig[mode] || PerformanceConfig.STANDARD
    return config[testType] || config.BENCHMARK_ITERATIONS
}

/**
 * High-resolution time measurement (uses performance.now() when available)
 * @returns {number} Current time in milliseconds with high precision
 */
function getHighResTime() {
    if (typeof performance !== "undefined" && performance.now) {
        return performance.now()
    } else {
        return Date.now()
    }
}

/**
 * Measures execution time of a function with high precision
 * @param {function} fn - Function to measure
 * @param {*} context - Context to bind the function to (optional)
 * @returns {object} Object with result, duration, and memory info
 */
function measureExecution(fn, context) {
    var startTime = getHighResTime()
    var startMemory = getMemoryUsage()
    
    var result
    if (context) {
        result = fn.call(context)
    } else {
        result = fn()
    }
    
    var endTime = getHighResTime()
    var endMemory = getMemoryUsage()
    
    return {
        result: result,
        duration: endTime - startTime,
        memoryUsed: endMemory - startMemory,
        startMemory: startMemory,
        endMemory: endMemory
    }
}

/**
 * Gets current memory usage (Node.js only, returns 0 in browser)
 * @returns {number} Memory usage in bytes
 */
function getMemoryUsage() {
    if (typeof process !== "undefined" && process.memoryUsage) {
        return process.memoryUsage().heapUsed
    }
    return 0
}

/**
 * Runs a performance benchmark with multiple iterations
 * @param {string} name - Benchmark name
 * @param {function} fn - Function to benchmark
 * @param {object} options - Benchmark options
 * @param {number} options.iterations - Number of iterations (default: environment-based)
 * @param {number} options.warmupIterations - Warmup iterations (default: environment-based)
 * @param {*} options.context - Context to bind function to
 * @returns {object} Benchmark results with statistics
 */
function benchmark(name, fn, options) {
    options = options || {}
    var iterations = getPerformanceIterations("BENCHMARK_ITERATIONS", options.iterations)
    var warmupIterations = getPerformanceIterations("WARMUP_ITERATIONS", options.warmupIterations)
    var context = options.context
    
    // Warmup phase
    for (var w = 0; w < warmupIterations; w++) {
        if (context) {
            fn.call(context)
        } else {
            fn()
        }
    }
    
    // Actual benchmark
    var measurements = []
    var totalDuration = 0
    var totalMemory = 0
    var minDuration = Infinity
    var maxDuration = 0
    
    for (var i = 0; i < iterations; i++) {
        var measurement = measureExecution(fn, context)
        measurements.push(measurement)
        
        totalDuration += measurement.duration
        totalMemory += measurement.memoryUsed
        
        if (measurement.duration < minDuration) {
            minDuration = measurement.duration
        }
        if (measurement.duration > maxDuration) {
            maxDuration = measurement.duration
        }
    }
    
    // Calculate statistics
    var avgDuration = totalDuration / iterations
    var avgMemory = totalMemory / iterations
    
    // Calculate median
    var sortedDurations = measurements.map(function(m) { return m.duration }).sort(function(a, b) { return a - b })
    var median = iterations % 2 === 0 
        ? (sortedDurations[iterations / 2 - 1] + sortedDurations[iterations / 2]) / 2
        : sortedDurations[Math.floor(iterations / 2)]
    
    // Calculate standard deviation
    var variance = 0
    for (var j = 0; j < measurements.length; j++) {
        variance += Math.pow(measurements[j].duration - avgDuration, 2)
    }
    var stdDev = Math.sqrt(variance / iterations)
    
    return {
        name: name,
        iterations: iterations,
        totalDuration: totalDuration,
        avgDuration: avgDuration,
        minDuration: minDuration,
        maxDuration: maxDuration,
        median: median,
        stdDev: stdDev,
        avgMemory: avgMemory,
        measurements: measurements
    }
}

/**
 * Validates that execution time is within acceptable bounds
 * @param {number} duration - Execution duration in milliseconds
 * @param {number} maxDuration - Maximum acceptable duration
 * @returns {boolean} True if within bounds
 */
function validatePerformanceBounds(duration, maxDuration) {
    return duration <= maxDuration
}

/**
 * Compares two benchmark results
 * @param {object} baseline - Baseline benchmark result
 * @param {object} current - Current benchmark result
 * @returns {object} Comparison results
 */
function compareBenchmarks(baseline, current) {
    var durationRatio = current.avgDuration / baseline.avgDuration
    var memoryRatio = current.avgMemory / baseline.avgMemory
    
    return {
        durationChange: durationRatio,
        memoryChange: memoryRatio,
        durationImprovement: durationRatio < 1,
        memoryImprovement: memoryRatio < 1,
        significantChange: Math.abs(durationRatio - 1) > 0.1 // 10% threshold
    }
}

/**
 * Creates a performance test suite for a specific operation
 * @param {string} operationName - Name of the operation being tested
 * @param {function} operation - Operation function to test
 * @param {object} options - Test configuration
 */
function createPerformanceSuite(operationName, operation, options) {
    options = options || {}
    var maxDuration = options.maxDuration || 1000 // 1 second default
    var iterations = getPerformanceIterations("BENCHMARK_ITERATIONS", options.iterations)
    var inputSizes = options.inputSizes || [8, 64, 128, 256, 512]
    
    describe("Performance: " + operationName, function() {
        inputSizes.forEach(function(inputSize) {
            it("should complete within " + maxDuration + "ms for " + inputSize + "-bit inputs", function() {
                var testFn = function() {
                    return operation(inputSize)
                }
                
                var result = benchmark(operationName + " (" + inputSize + "-bit)", testFn, {
                    iterations: iterations
                })
                
                expect(result.avgDuration).toBeLessThan(maxDuration)
                expect(result.maxDuration).toBeLessThan(maxDuration * 2) // Allow some variance
                
                // Log performance info for analysis
                console.log("Performance result for " + operationName + " (" + inputSize + "-bit):")
                console.log("  Average: " + result.avgDuration.toFixed(2) + "ms")
                console.log("  Min: " + result.minDuration.toFixed(2) + "ms")
                console.log("  Max: " + result.maxDuration.toFixed(2) + "ms")
                console.log("  Std Dev: " + result.stdDev.toFixed(2) + "ms")
            })
        })
        
        it("should have consistent performance across multiple runs", function() {
            var results = []
            var runs = getPerformanceIterations("CONSISTENCY_RUNS", options.consistencyRuns)
            
            for (var i = 0; i < runs; i++) {
                var result = benchmark(operationName + " consistency test", operation, {
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
        })
    })
}

/**
 * Memory stress test utility
 * @param {function} operation - Operation to stress test
 * @param {number} iterations - Number of iterations (default: environment-based)
 * @returns {object} Memory usage statistics
 */
function memoryStressTest(operation, iterations) {
    iterations = getPerformanceIterations("STRESS_ITERATIONS", iterations)
    
    var initialMemory = getMemoryUsage()
    var maxMemory = initialMemory
    var measurements = []
    
    for (var i = 0; i < iterations; i++) {
        operation()
        
        if (i % 100 === 0) { // Check memory every 100 iterations
            var currentMemory = getMemoryUsage()
            measurements.push(currentMemory)
            
            if (currentMemory > maxMemory) {
                maxMemory = currentMemory
            }
        }
    }
    
    var finalMemory = getMemoryUsage()
    
    return {
        initialMemory: initialMemory,
        finalMemory: finalMemory,
        maxMemory: maxMemory,
        memoryGrowth: finalMemory - initialMemory,
        measurements: measurements,
        iterations: iterations
    }
}

// Export functions for use in tests
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        getHighResTime: getHighResTime,
        measureExecution: measureExecution,
        getMemoryUsage: getMemoryUsage,
        benchmark: benchmark,
        validatePerformanceBounds: validatePerformanceBounds,
        compareBenchmarks: compareBenchmarks,
        createPerformanceSuite: createPerformanceSuite,
        memoryStressTest: memoryStressTest,
        getPerformanceMode: getPerformanceMode,
        getPerformanceIterations: getPerformanceIterations,
        PerformanceConfig: PerformanceConfig
    }
} else if (typeof window !== "undefined") {
    window.PerformanceHelper = {
        getHighResTime: getHighResTime,
        measureExecution: measureExecution,
        getMemoryUsage: getMemoryUsage,
        benchmark: benchmark,
        validatePerformanceBounds: validatePerformanceBounds,
        compareBenchmarks: compareBenchmarks,
        createPerformanceSuite: createPerformanceSuite,
        memoryStressTest: memoryStressTest,
        getPerformanceMode: getPerformanceMode,
        getPerformanceIterations: getPerformanceIterations,
        PerformanceConfig: PerformanceConfig
    }
}