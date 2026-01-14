/**
 * TypeScript-Specific Test Utilities
 * 
 * This module provides compile-time type validation tests and utilities
 * specific to TypeScript testing of the @brightchain/secrets library.
 */

import secrets = require('../../src/secrets');
import type { SecretsConfig, Shares, ShareComponents, CSPRNGType, RNGFunction } from '../../src/types';

/**
 * Type assertion helper for compile-time type checking
 * This function does nothing at runtime but provides compile-time type validation
 */
export function assertType<T>(value: T): void {
    // This function intentionally does nothing at runtime
    // It's used purely for compile-time type checking
}

/**
 * Compile-time type validation tests
 * These tests ensure that the TypeScript types are correctly defined
 */
export namespace CompileTimeTypeTests {
    /**
     * Test that SecretsConfig has all required properties with correct types
     */
    export function testSecretsConfigType(): void {
        const config: SecretsConfig = secrets.getConfig();
        
        // These assignments should compile without errors
        const radix: number = config.radix;
        const bits: number = config.bits;
        const maxShares: number = config.maxShares;
        const hasCSPRNG: boolean = config.hasCSPRNG;
        const typeCSPRNG: CSPRNGType = config.typeCSPRNG;
        
        // Verify readonly properties (these should cause compile errors if uncommented)
        // config.radix = 10; // Error: Cannot assign to 'radix' because it is a read-only property
        // config.bits = 16; // Error: Cannot assign to 'bits' because it is a read-only property
    }
    
    /**
     * Test that share() returns correct type
     */
    export function testShareReturnType(): void {
        const secret: string = "deadbeef";
        const shares: string[] = secrets.share(secret, 5, 3);
        
        // Verify array operations work correctly
        const firstShare: string = shares[0];
        const shareCount: number = shares.length;
        
        assertType<string[]>(shares);
    }
    
    /**
     * Test that combine() accepts and returns correct types
     */
    export function testCombineTypes(): void {
        const shares: string[] = ["share1", "share2", "share3"];
        const result: string = secrets.combine(shares);
        
        assertType<string>(result);
        
        // Test with optional 'at' parameter
        const resultWithAt: string = secrets.combine(shares, 0);
        assertType<string>(resultWithAt);
    }
    
    /**
     * Test that extractShareComponents returns correct type
     */
    export function testExtractShareComponentsType(): void {
        const share: string = "8013ac6c71ce163b661fa6ac8ce0141885ebee425222f1f07d07cad2e4a63f995b7";
        const components: ShareComponents = secrets.extractShareComponents(share);
        
        // Verify all properties exist with correct types
        const bits: number = components.bits;
        const id: number = components.id;
        const data: string = components.data;
        
        assertType<ShareComponents>(components);
    }
    
    /**
     * Test that RNG functions have correct signatures
     */
    export function testRNGFunctionTypes(): void {
        // Test with string RNG type
        secrets.setRNG("testRandom");
        
        // Test with custom RNG function
        const customRNG: RNGFunction = (bits: number): string => {
            return "1".repeat(bits);
        };
        secrets.setRNG(customRNG);
        
        // Verify return type
        const result: boolean = secrets.setRNG("testRandom");
        assertType<boolean>(result);
    }
    
    /**
     * Test that str2hex and hex2str have correct types
     */
    export function testStringConversionTypes(): void {
        const str: string = "Hello, World!";
        const hex: string = secrets.str2hex(str);
        const roundTrip: string = secrets.hex2str(hex);
        
        assertType<string>(hex);
        assertType<string>(roundTrip);
        
        // Test with optional bytesPerChar parameter
        const hexWithBytes: string = secrets.str2hex(str, 2);
        const roundTripWithBytes: string = secrets.hex2str(hexWithBytes, 2);
        
        assertType<string>(hexWithBytes);
        assertType<string>(roundTripWithBytes);
    }
    
    /**
     * Test that random() has correct type
     */
    export function testRandomType(): void {
        const randomHex: string = secrets.random(128);
        assertType<string>(randomHex);
    }
    
    /**
     * Test that newShare() has correct types
     */
    export function testNewShareTypes(): void {
        const shares: string[] = ["share1", "share2", "share3"];
        
        // Test with number ID
        const newShare1: string = secrets.newShare(4, shares);
        assertType<string>(newShare1);
        
        // Test with string ID
        const newShare2: string = secrets.newShare("5", shares);
        assertType<string>(newShare2);
    }
    
    /**
     * Test that init() accepts correct parameter types
     */
    export function testInitTypes(): void {
        // Test with no parameters
        secrets.init();
        
        // Test with bits parameter
        secrets.init(8);
        
        // Test with bits and RNG type
        secrets.init(8, "testRandom");
        
        // Test with undefined (should be allowed)
        secrets.init(undefined);
        secrets.init(undefined, "testRandom");
    }
}

/**
 * Runtime type guard tests
 * These tests verify that type guards work correctly at runtime
 */
export namespace RuntimeTypeGuardTests {
    /**
     * Test that we can distinguish between valid and invalid secrets
     */
    export function testSecretValidation(): boolean {
        const validSecret: string = "deadbeef";
        const invalidSecret: string = "xyz123";
        
        // Valid secrets should be hex strings
        const isValidHex: boolean = /^[0-9a-fA-F]*$/.test(validSecret);
        const isInvalidHex: boolean = /^[0-9a-fA-F]*$/.test(invalidSecret);
        
        return isValidHex && !isInvalidHex;
    }
    
    /**
     * Test that we can validate share arrays
     */
    export function testShareArrayValidation(): boolean {
        const validShares: string[] = ["share1", "share2", "share3"];
        const invalidShares: any = "not an array";
        
        const isValidArray: boolean = Array.isArray(validShares) && 
                                      validShares.every(s => typeof s === 'string');
        const isInvalidArray: boolean = Array.isArray(invalidShares);
        
        return isValidArray && !isInvalidArray;
    }
}

/**
 * Type inference tests
 * These tests verify that TypeScript correctly infers types
 */
export namespace TypeInferenceTests {
    /**
     * Test that TypeScript infers correct types from function returns
     */
    export function testTypeInference(): void {
        // TypeScript should infer these types automatically
        const config = secrets.getConfig();
        const shares = secrets.share("deadbeef", 5, 3);
        const combined = secrets.combine(shares);
        const components = secrets.extractShareComponents(shares[0]);
        const hex = secrets.str2hex("test");
        const str = secrets.hex2str(hex);
        const random = secrets.random(128);
        
        // Verify inferred types match expected types
        assertType<SecretsConfig>(config);
        assertType<string[]>(shares);
        assertType<string>(combined);
        assertType<ShareComponents>(components);
        assertType<string>(hex);
        assertType<string>(str);
        assertType<string>(random);
    }
}

/**
 * Generic type parameter tests
 * These tests verify that generic types work correctly
 */
export namespace GenericTypeTests {
    /**
     * Test that we can create type-safe wrappers around secrets functions
     */
    export function testTypeSafeWrapper<T extends string>(
        secret: T,
        numShares: number,
        threshold: number
    ): string[] {
        return secrets.share(secret, numShares, threshold);
    }
    
    /**
     * Test that we can create type-safe result types
     */
    export interface TypedResult<T> {
        success: boolean;
        value?: T;
        error?: string;
    }
    
    export function safeShare(
        secret: string,
        numShares: number,
        threshold: number
    ): TypedResult<string[]> {
        try {
            const shares: string[] = secrets.share(secret, numShares, threshold);
            return { success: true, value: shares };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
    
    export function safeCombine(shares: string[]): TypedResult<string> {
        try {
            const result: string = secrets.combine(shares);
            return { success: true, value: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}

/**
 * Utility function to run all compile-time type tests
 * This ensures all type tests are executed during test runs
 */
export function runAllTypeTests(): void {
    // Compile-time type tests
    CompileTimeTypeTests.testSecretsConfigType();
    CompileTimeTypeTests.testShareReturnType();
    CompileTimeTypeTests.testCombineTypes();
    CompileTimeTypeTests.testExtractShareComponentsType();
    CompileTimeTypeTests.testRNGFunctionTypes();
    CompileTimeTypeTests.testStringConversionTypes();
    CompileTimeTypeTests.testRandomType();
    CompileTimeTypeTests.testNewShareTypes();
    CompileTimeTypeTests.testInitTypes();
    
    // Runtime type guard tests
    RuntimeTypeGuardTests.testSecretValidation();
    RuntimeTypeGuardTests.testShareArrayValidation();
    
    // Type inference tests
    TypeInferenceTests.testTypeInference();
}
