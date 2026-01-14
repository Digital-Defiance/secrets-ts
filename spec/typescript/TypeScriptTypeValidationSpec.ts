/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */

import secrets = require('../../src/secrets');
import type { SecretsConfig, Shares, ShareComponents } from '../../src/types';
import * as TypeScriptTestUtils from '../helpers/TypeScriptTestUtils';

/**
 * TypeScript Type Validation Tests
 * 
 * These tests verify that the TypeScript type definitions are correct
 * and that compile-time type checking works as expected.
 */

describe("TypeScript Type Validation", function(): void {
    "use strict";

    beforeEach(function(): void {
        secrets.init();
        secrets.setRNG("testRandom");
    });

    describe("Compile-Time Type Validation", function(): void {
        it("should have correct SecretsConfig type", function(): void {
            const config: SecretsConfig = secrets.getConfig();
            
            expect(typeof config.radix).toBe("number");
            expect(typeof config.bits).toBe("number");
            expect(typeof config.maxShares).toBe("number");
            expect(typeof config.hasCSPRNG).toBe("boolean");
            expect(typeof config.typeCSPRNG).toBe("string");
            
            // Run compile-time type test
            TypeScriptTestUtils.CompileTimeTypeTests.testSecretsConfigType();
        });

        it("should have correct share() return type", function(): void {
            const secret: string = "deadbeef";
            const shares: string[] = secrets.share(secret, 5, 3);
            
            expect(Array.isArray(shares)).toBe(true);
            expect(shares.length).toBe(5);
            expect(typeof shares[0]).toBe("string");
            
            // Run compile-time type test
            TypeScriptTestUtils.CompileTimeTypeTests.testShareReturnType();
        });

        it("should have correct combine() types", function(): void {
            const secret: string = "deadbeef";
            const shares: string[] = secrets.share(secret, 5, 3);
            const result: string = secrets.combine(shares);
            
            expect(typeof result).toBe("string");
            expect(result).toBe(secret);
            
            // Run compile-time type test
            TypeScriptTestUtils.CompileTimeTypeTests.testCombineTypes();
        });

        it("should have correct extractShareComponents() type", function(): void {
            const secret: string = "deadbeef";
            const shares: string[] = secrets.share(secret, 5, 3);
            const components: ShareComponents = secrets.extractShareComponents(shares[0]);
            
            expect(typeof components.bits).toBe("number");
            expect(typeof components.id).toBe("number");
            expect(typeof components.data).toBe("string");
            
            // Run compile-time type test
            TypeScriptTestUtils.CompileTimeTypeTests.testExtractShareComponentsType();
        });

        it("should have correct RNG function types", function(): void {
            // Test with string RNG type
            const result1: boolean = secrets.setRNG("testRandom");
            expect(result1).toBe(true);
            
            // Test with custom RNG function
            const customRNG = (bits: number): string => {
                return "1".repeat(bits);
            };
            const result2: boolean = secrets.setRNG(customRNG);
            expect(result2).toBe(true);
            
            // Run compile-time type test
            TypeScriptTestUtils.CompileTimeTypeTests.testRNGFunctionTypes();
        });

        it("should have correct string conversion types", function(): void {
            const str: string = "Hello, World!";
            const hex: string = secrets.str2hex(str);
            const roundTrip: string = secrets.hex2str(hex);
            
            expect(typeof hex).toBe("string");
            expect(typeof roundTrip).toBe("string");
            expect(roundTrip).toBe(str);
            
            // Run compile-time type test
            TypeScriptTestUtils.CompileTimeTypeTests.testStringConversionTypes();
        });

        it("should have correct random() type", function(): void {
            const randomHex: string = secrets.random(128);
            
            expect(typeof randomHex).toBe("string");
            expect(randomHex).toMatch(/^[0-9a-f]+$/);
            
            // Run compile-time type test
            TypeScriptTestUtils.CompileTimeTypeTests.testRandomType();
        });

        it("should have correct newShare() types", function(): void {
            const secret: string = "deadbeef";
            const shares: string[] = secrets.share(secret, 3, 2);
            
            // Test with number ID
            const newShare1: string = secrets.newShare(4, shares);
            expect(typeof newShare1).toBe("string");
            
            // Test with string ID
            const newShare2: string = secrets.newShare("5", shares);
            expect(typeof newShare2).toBe("string");
            
            // Run compile-time type test
            TypeScriptTestUtils.CompileTimeTypeTests.testNewShareTypes();
        });

        it("should have correct init() parameter types", function(): void {
            // Test with no parameters
            secrets.init();
            expect(secrets.getConfig().bits).toBe(8);
            
            // Test with bits parameter
            secrets.init(16);
            expect(secrets.getConfig().bits).toBe(16);
            
            // Test with bits and RNG type
            secrets.init(8, "testRandom");
            expect(secrets.getConfig().bits).toBe(8);
            expect(secrets.getConfig().typeCSPRNG).toBe("testRandom");
            
            // Run compile-time type test
            TypeScriptTestUtils.CompileTimeTypeTests.testInitTypes();
        });
    });

    describe("Runtime Type Guard Tests", function(): void {
        it("should validate secrets correctly", function(): void {
            const result: boolean = TypeScriptTestUtils.RuntimeTypeGuardTests.testSecretValidation();
            expect(result).toBe(true);
        });

        it("should validate share arrays correctly", function(): void {
            const result: boolean = TypeScriptTestUtils.RuntimeTypeGuardTests.testShareArrayValidation();
            expect(result).toBe(true);
        });
    });

    describe("Type Inference Tests", function(): void {
        it("should infer types correctly from function returns", function(): void {
            // TypeScript should infer these types automatically
            const config = secrets.getConfig();
            const shares = secrets.share("deadbeef", 5, 3);
            const combined = secrets.combine(shares);
            const components = secrets.extractShareComponents(shares[0]);
            const hex = secrets.str2hex("test");
            const str = secrets.hex2str(hex);
            const random = secrets.random(128);
            
            // Verify runtime types match inferred types
            expect(typeof config.bits).toBe("number");
            expect(Array.isArray(shares)).toBe(true);
            expect(typeof combined).toBe("string");
            expect(typeof components.id).toBe("number");
            expect(typeof hex).toBe("string");
            expect(typeof str).toBe("string");
            expect(typeof random).toBe("string");
            
            // Run compile-time type inference test
            TypeScriptTestUtils.TypeInferenceTests.testTypeInference();
        });
    });

    describe("Generic Type Tests", function(): void {
        it("should work with type-safe wrappers", function(): void {
            const secret: string = "deadbeef";
            const shares: string[] = TypeScriptTestUtils.GenericTypeTests.testTypeSafeWrapper(
                secret,
                5,
                3
            );
            
            expect(Array.isArray(shares)).toBe(true);
            expect(shares.length).toBe(5);
        });

        it("should work with type-safe result types", function(): void {
            const secret: string = "deadbeef";
            
            // Test successful share
            const shareResult = TypeScriptTestUtils.GenericTypeTests.safeShare(secret, 5, 3);
            expect(shareResult.success).toBe(true);
            expect(shareResult.value).toBeDefined();
            expect(Array.isArray(shareResult.value)).toBe(true);
            
            // Test successful combine
            if (shareResult.value) {
                const combineResult = TypeScriptTestUtils.GenericTypeTests.safeCombine(shareResult.value);
                expect(combineResult.success).toBe(true);
                expect(combineResult.value).toBe(secret);
            }
            
            // Test error handling
            const errorResult = TypeScriptTestUtils.GenericTypeTests.safeShare("invalid", 1, 2);
            expect(errorResult.success).toBe(false);
            expect(errorResult.error).toBeDefined();
        });
    });

    describe("Comprehensive Type Safety Tests", function(): void {
        it("should run all type tests successfully", function(): void {
            // This runs all compile-time and runtime type tests
            expect(function(): void {
                TypeScriptTestUtils.runAllTypeTests();
            }).not.toThrow();
        });

        it("should maintain type safety across operations", function(): void {
            const secret: string = "deadbeefcafebabe";
            
            // Type-safe operation chain
            const shares: string[] = secrets.share(secret, 10, 5);
            const subset: string[] = shares.slice(0, 5);
            const reconstructed: string = secrets.combine(subset);
            const components: ShareComponents = secrets.extractShareComponents(shares[0]);
            
            // Verify types at each step
            expect(typeof secret).toBe("string");
            expect(Array.isArray(shares)).toBe(true);
            expect(Array.isArray(subset)).toBe(true);
            expect(typeof reconstructed).toBe("string");
            expect(typeof components.bits).toBe("number");
            expect(typeof components.id).toBe("number");
            expect(typeof components.data).toBe("string");
            
            // Verify values
            expect(reconstructed).toBe(secret);
            expect(components.bits).toBe(8);
            expect(components.id).toBeGreaterThan(0);
        });

        it("should enforce type constraints at compile time", function(): void {
            // These should all compile without errors
            const config: SecretsConfig = secrets.getConfig();
            const shares: string[] = secrets.share("deadbeef", 5, 3);
            const result: string = secrets.combine(shares);
            
            // Verify readonly properties cannot be modified (compile-time check)
            // Uncommenting these should cause TypeScript compilation errors:
            // config.bits = 16; // Error: Cannot assign to 'bits' because it is a read-only property
            // config.radix = 10; // Error: Cannot assign to 'radix' because it is a read-only property
            
            expect(config).toBeDefined();
            expect(shares).toBeDefined();
            expect(result).toBeDefined();
        });
    });
});
