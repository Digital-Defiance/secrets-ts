/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */
/*global secrets, describe, it, expect */

/**
 * Property-Based Testing Helper Utilities
 * 
 * This module provides lightweight property-based testing functionality
 * for the @digitaldefiance/secrets library without external dependencies.
 */

// when running in a node.js env.
if (typeof require === "function") {
    crypto = require("crypto")
    secrets = require("../../secrets.js")
}

/**
 * Environment-based iteration count configuration
 * Allows different iteration counts for development, CI, and comprehensive testing
 */
var IterationConfig = {
    // Fast mode for development (quick feedback)
    FAST: {
        PROPERTY_TEST: 10,
        CRYPTOGRAPHIC_TEST: 50,
        PERFORMANCE_TEST: 5,
        STRESS_TEST: 2
    },
    // Standard mode for regular testing
    STANDARD: {
        PROPERTY_TEST: 100,
        CRYPTOGRAPHIC_TEST: 500,
        PERFORMANCE_TEST: 20,
        STRESS_TEST: 5
    },
    // CI mode for continuous integration
    CI: {
        PROPERTY_TEST: 500,
        CRYPTOGRAPHIC_TEST: 1000,
        PERFORMANCE_TEST: 50,
        STRESS_TEST: 10
    },
    // Comprehensive mode for thorough testing
    COMPREHENSIVE: {
        PROPERTY_TEST: 1000,
        CRYPTOGRAPHIC_TEST: 2000,
        PERFORMANCE_TEST: 100,
        STRESS_TEST: 20
    }
}

/**
 * Gets the current test mode from environment variables
 * @returns {string} Test mode: 'FAST', 'STANDARD', 'CI', or 'COMPREHENSIVE'
 */
function getTestMode() {
    if (typeof process !== "undefined" && process.env) {
        var mode = process.env.TEST_MODE || process.env.NODE_ENV
        if (mode === "fast" || mode === "development") return "FAST"
        if (mode === "ci" || mode === "test") return "CI"
        if (mode === "comprehensive") return "COMPREHENSIVE"
    }
    return "STANDARD"
}

/**
 * Gets the iteration count for a specific test type based on current mode
 * @param {string} testType - Type of test: 'PROPERTY_TEST', 'CRYPTOGRAPHIC_TEST', 'PERFORMANCE_TEST', 'STRESS_TEST'
 * @param {number} override - Optional override value
 * @returns {number} Number of iterations to use
 */
function getIterationCount(testType, override) {
    if (override !== undefined && override !== null) {
        return override
    }
    
    var mode = getTestMode()
    var config = IterationConfig[mode] || IterationConfig.STANDARD
    return config[testType] || config.PROPERTY_TEST
}

/**
 * Executes a property test with the specified number of iterations
 * @param {string} description - Test description
 * @param {function} property - Property function that returns true/false
 * @param {object} options - Test options
 * @param {number} options.iterations - Number of test iterations (default: environment-based)
 * @param {string} options.testType - Type of test for iteration count ('PROPERTY_TEST', 'CRYPTOGRAPHIC_TEST', etc.)
 * @param {object} options.generators - Data generators for test inputs
 * @returns {object} Test results with success/failure information
 */
function propertyTest(description, property, options) {
    options = options || {}
    var testType = options.testType || "PROPERTY_TEST"
    var iterations = getIterationCount(testType, options.iterations)
    var generators = options.generators || {}
    
    var results = {
        description: description,
        iterations: iterations,
        successes: 0,
        failures: [],
        passed: true
    }
    
    for (var i = 0; i < iterations; i++) {
        var testData = generateTestData(generators)
        try {
            var result = property(testData)
            if (result === true) {
                results.successes++
            } else {
                results.failures.push({
                    iteration: i,
                    testData: testData,
                    result: result
                })
                results.passed = false
            }
        } catch (error) {
            results.failures.push({
                iteration: i,
                testData: testData,
                error: error.message
            })
            results.passed = false
        }
    }
    
    return results
}

/**
 * Generates test data using the provided generators
 * @param {object} generators - Object containing generator functions
 * @returns {object} Generated test data
 */
function generateTestData(generators) {
    var testData = {}
    
    for (var key in generators) {
        if (generators.hasOwnProperty(key)) {
            testData[key] = generators[key]()
        }
    }
    
    return testData
}

/**
 * Measures execution time of a function
 * @param {function} fn - Function to measure
 * @returns {object} Object with result and duration in milliseconds
 */
function measurePerformance(fn) {
    var startTime = Date.now()
    var result = fn()
    var endTime = Date.now()
    
    return {
        result: result,
        duration: endTime - startTime
    }
}

/**
 * Validates that a property holds for a single test case
 * @param {function} property - Property function to test
 * @param {*} testData - Test data to validate
 * @returns {boolean} True if property holds, false otherwise
 */
function validateProperty(property, testData) {
    try {
        return property(testData) === true
    } catch (error) {
        return false
    }
}

/**
 * Creates a test suite for a specific property with detailed reporting
 * @param {string} propertyName - Name of the property being tested
 * @param {function} property - Property function to test
 * @param {object} options - Test configuration options
 * @param {number} options.iterations - Number of iterations (optional, uses environment-based default)
 * @param {string} options.testType - Type of test for iteration count
 * @param {object} options.generators - Data generators
 * @param {array} options.requirements - Requirements being validated
 * @returns {object} Test suite configuration object
 */
function createPropertySuite(propertyName, property, options) {
    options = options || {}
    var testType = options.testType || "PROPERTY_TEST"
    var iterations = getIterationCount(testType, options.iterations)
    var generators = options.generators || {}
    var requirements = options.requirements || []
    
    return {
        propertyName: propertyName,
        property: property,
        iterations: iterations,
        generators: generators,
        requirements: requirements,
        
        // Method to execute the property test
        execute: function() {
            return propertyTest(propertyName, property, {
                iterations: iterations,
                generators: generators,
                testType: testType
            })
        }
    }
}

// Export functions for use in tests
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        propertyTest: propertyTest,
        generateTestData: generateTestData,
        measurePerformance: measurePerformance,
        validateProperty: validateProperty,
        createPropertySuite: createPropertySuite,
        getIterationCount: getIterationCount,
        getTestMode: getTestMode,
        IterationConfig: IterationConfig
    }
} else if (typeof window !== "undefined") {
    window.PropertyTestHelper = {
        propertyTest: propertyTest,
        generateTestData: generateTestData,
        measurePerformance: measurePerformance,
        validateProperty: validateProperty,
        createPropertySuite: createPropertySuite,
        getIterationCount: getIterationCount,
        getTestMode: getTestMode,
        IterationConfig: IterationConfig
    }
}