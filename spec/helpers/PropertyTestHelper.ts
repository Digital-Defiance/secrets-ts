/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */

import secrets = require('../../src/secrets');

/**
 * Property-Based Testing Helper Utilities
 * 
 * This module provides type-safe property-based testing functionality
 * for the @digitaldefiance/secrets library without external dependencies.
 */

/**
 * Test mode types
 */
export type TestMode = 'FAST' | 'STANDARD' | 'CI' | 'COMPREHENSIVE';

/**
 * Test type categories
 */
export type TestType = 'PROPERTY_TEST' | 'CRYPTOGRAPHIC_TEST' | 'PERFORMANCE_TEST' | 'STRESS_TEST';

/**
 * Iteration configuration interface
 */
export interface IterationCounts {
    PROPERTY_TEST: number;
    CRYPTOGRAPHIC_TEST: number;
    PERFORMANCE_TEST: number;
    STRESS_TEST: number;
}

/**
 * Test failure information
 */
export interface TestFailure {
    iteration: number;
    testData: any;
    result?: any;
    error?: string;
}

/**
 * Property test results
 */
export interface PropertyTestResults {
    description: string;
    iterations: number;
    successes: number;
    failures: TestFailure[];
    passed: boolean;
}

/**
 * Performance measurement result
 */
export interface PerformanceResult<T> {
    result: T;
    duration: number;
}

/**
 * Property test options
 */
export interface PropertyTestOptions {
    iterations?: number;
    testType?: TestType;
    generators?: Record<string, () => any>;
}

/**
 * Property suite options
 */
export interface PropertySuiteOptions {
    iterations?: number;
    testType?: TestType;
    generators?: Record<string, () => any>;
    requirements?: string[];
}

/**
 * Property suite configuration
 */
export interface PropertySuite {
    propertyName: string;
    property: (testData: any) => boolean;
    iterations: number;
    generators: Record<string, () => any>;
    requirements: string[];
    execute: () => PropertyTestResults;
}

/**
 * Environment-based iteration count configuration
 * Allows different iteration counts for development, CI, and comprehensive testing
 */
export const IterationConfig: Record<TestMode, IterationCounts> = {
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
};

/**
 * Gets the current test mode from environment variables
 */
export function getTestMode(): TestMode {
    if (typeof process !== "undefined" && process.env) {
        const mode: string | undefined = process.env.TEST_MODE || process.env.NODE_ENV;
        if (mode === "fast" || mode === "development") return "FAST";
        if (mode === "ci" || mode === "test") return "CI";
        if (mode === "comprehensive") return "COMPREHENSIVE";
    }
    return "STANDARD";
}

/**
 * Gets the iteration count for a specific test type based on current mode
 */
export function getIterationCount(testType: TestType, override?: number): number {
    if (override !== undefined && override !== null) {
        return override;
    }
    
    const mode: TestMode = getTestMode();
    const config: IterationCounts = IterationConfig[mode] || IterationConfig.STANDARD;
    return config[testType] || config.PROPERTY_TEST;
}

/**
 * Executes a property test with the specified number of iterations
 */
export function propertyTest(
    description: string,
    property: (testData: any) => boolean,
    options: PropertyTestOptions = {}
): PropertyTestResults {
    const testType: TestType = options.testType || "PROPERTY_TEST";
    const iterations: number = getIterationCount(testType, options.iterations);
    const generators: Record<string, () => any> = options.generators || {};
    
    const results: PropertyTestResults = {
        description,
        iterations,
        successes: 0,
        failures: [],
        passed: true
    };
    
    for (let i: number = 0; i < iterations; i++) {
        const testData: any = generateTestData(generators);
        try {
            const result: boolean = property(testData);
            if (result === true) {
                results.successes++;
            } else {
                results.failures.push({
                    iteration: i,
                    testData,
                    result
                });
                results.passed = false;
            }
        } catch (error: any) {
            results.failures.push({
                iteration: i,
                testData,
                error: error.message
            });
            results.passed = false;
        }
    }
    
    return results;
}

/**
 * Generates test data using the provided generators
 */
export function generateTestData(generators: Record<string, () => any>): any {
    const testData: any = {};
    
    for (const key in generators) {
        if (generators.hasOwnProperty(key)) {
            testData[key] = generators[key]();
        }
    }
    
    return testData;
}

/**
 * Measures execution time of a function
 */
export function measurePerformance<T>(fn: () => T): PerformanceResult<T> {
    const startTime: number = Date.now();
    const result: T = fn();
    const endTime: number = Date.now();
    
    return {
        result,
        duration: endTime - startTime
    };
}

/**
 * Validates that a property holds for a single test case
 */
export function validateProperty(property: (testData: any) => boolean, testData: any): boolean {
    try {
        return property(testData) === true;
    } catch (error) {
        return false;
    }
}

/**
 * Creates a test suite for a specific property with detailed reporting
 */
export function createPropertySuite(
    propertyName: string,
    property: (testData: any) => boolean,
    options: PropertySuiteOptions = {}
): PropertySuite {
    const testType: TestType = options.testType || "PROPERTY_TEST";
    const iterations: number = getIterationCount(testType, options.iterations);
    const generators: Record<string, () => any> = options.generators || {};
    const requirements: string[] = options.requirements || [];
    
    return {
        propertyName,
        property,
        iterations,
        generators,
        requirements,
        
        // Method to execute the property test
        execute(): PropertyTestResults {
            return propertyTest(propertyName, property, {
                iterations,
                generators,
                testType
            });
        }
    };
}
