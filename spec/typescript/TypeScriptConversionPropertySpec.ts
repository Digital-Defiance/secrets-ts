/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */

import secrets = require('../../src/secrets');
import type { SecretsConfig, Shares, ShareComponents } from '../../src/types';
import * as PropertyTestHelper from '../helpers/PropertyTestHelper';
import * as TestDataGenerators from '../helpers/TestDataGenerators';

/**
 * Property-Based Tests for TypeScript Conversion
 * 
 * Feature: typescript-conversion
 * 
 * These tests validate that the TypeScript conversion maintains correctness
 * and preserves all functionality from the original JavaScript implementation.
 */

describe("TypeScript Conversion Property Tests", function(): void {
    "use strict";

    beforeEach(function(): void {
        secrets.init();
        secrets.setRNG("testRandom");
    });

    describe("Property 1: Type Safety Preservation", function(): void {
        /**
         * Feature: typescript-conversion, Property 1: Type Safety Preservation
         * Validates: Requirements 1.2, 6.1
         * 
         * For any function call with valid TypeScript types, the compiled JavaScript
         * should behave identically to the original JavaScript implementation.
         */
        it("should preserve type safety across all operations", function(): void {
            const iterations: number = PropertyTestHelper.getIterationCount("PROPERTY_TEST");
            
            const property = (testData: TestDataGenerators.ComprehensiveTestData): boolean => {
                try {
                    // Test that all typed operations work correctly
                    const config: SecretsConfig = secrets.getConfig();
                    
                    // Verify config has all required properties with correct types
                    if (typeof config.radix !== 'number') return false;
                    if (typeof config.bits !== 'number') return false;
                    if (typeof config.maxShares !== 'number') return false;
                    if (typeof config.hasCSPRNG !== 'boolean') return false;
                    if (typeof config.typeCSPRNG !== 'string') return false;
                    
                    // Test share operation with type safety
                    const shares: string[] = secrets.share(
                        testData.secret,
                        testData.shareConfig.numShares,
                        testData.shareConfig.threshold
                    );
                    
                    // Verify shares is an array of strings
                    if (!Array.isArray(shares)) return false;
                    if (shares.length !== testData.shareConfig.numShares) return false;
                    if (!shares.every(share => typeof share === 'string')) return false;
                    
                    // Test combine operation with type safety
                    const subset: string[] = shares.slice(0, testData.shareConfig.threshold);
                    const reconstructed: string = secrets.combine(subset);
                    
                    // Verify reconstructed is a string
                    if (typeof reconstructed !== 'string') return false;
                    
                    // Test extractShareComponents with type safety
                    const components: ShareComponents = secrets.extractShareComponents(shares[0]);
                    
                    // Verify components has all required properties with correct types
                    if (typeof components.bits !== 'number') return false;
                    if (typeof components.id !== 'number') return false;
                    if (typeof components.data !== 'string') return false;
                    
                    // Test string conversion operations with type safety
                    const hex: string = secrets.str2hex(testData.asciiString);
                    const roundTrip: string = secrets.hex2str(hex);
                    
                    // Verify string conversions return strings
                    if (typeof hex !== 'string') return false;
                    if (typeof roundTrip !== 'string') return false;
                    
                    // Test random generation with type safety
                    const randomHex: string = secrets.random(128);
                    
                    // Verify random returns a string
                    if (typeof randomHex !== 'string') return false;
                    
                    // All type checks passed
                    return true;
                } catch (error) {
                    // Type safety should prevent errors, but catch them if they occur
                    return false;
                }
            };
            
            const results: PropertyTestHelper.PropertyTestResults = PropertyTestHelper.propertyTest(
                "Type Safety Preservation",
                property,
                {
                    iterations,
                    testType: "PROPERTY_TEST",
                    generators: {
                        secret: TestDataGenerators.generateRandomSecret,
                        shareConfig: TestDataGenerators.generateShareConfig,
                        asciiString: TestDataGenerators.generateRandomString
                    }
                }
            );
            
            // Report results
            if (!results.passed) {
                console.log("Type Safety Preservation failures:");
                results.failures.forEach((failure, index) => {
                    console.log(`  Failure ${index + 1}:`, failure);
                });
            }
            
            expect(results.passed).toBe(true);
            expect(results.successes).toBe(iterations);
            expect(results.failures.length).toBe(0);
        });

        it("should maintain type safety with readonly properties", function(): void {
            const config: SecretsConfig = secrets.getConfig();
            
            // Verify that config properties are readonly at runtime
            // (TypeScript enforces this at compile time)
            const originalRadix: number = config.radix;
            const originalBits: number = config.bits;
            
            // These assignments should not affect the config object
            // (TypeScript prevents this at compile time, but we verify runtime behavior)
            try {
                (config as any).radix = 999;
                (config as any).bits = 999;
            } catch (error) {
                // Expected if properties are truly readonly
            }
            
            // Get fresh config to verify immutability
            const freshConfig: SecretsConfig = secrets.getConfig();
            
            // Original values should be preserved
            expect(freshConfig.radix).toBe(originalRadix);
            expect(freshConfig.bits).toBe(originalBits);
        });

        it("should enforce type constraints at compile time", function(): void {
            // This test verifies that TypeScript compilation enforces type constraints
            // The following code should compile without errors:
            
            const secret: string = "deadbeef";
            const shares: string[] = secrets.share(secret, 5, 3);
            const result: string = secrets.combine(shares);
            const config: SecretsConfig = secrets.getConfig();
            const components: ShareComponents = secrets.extractShareComponents(shares[0]);
            
            // Verify all types are correct at runtime
            expect(typeof secret).toBe("string");
            expect(Array.isArray(shares)).toBe(true);
            expect(typeof result).toBe("string");
            expect(typeof config.bits).toBe("number");
            expect(typeof components.id).toBe("number");
            
            // The following should cause TypeScript compilation errors if uncommented:
            // const invalidShares: string[] = 123; // Error: Type 'number' is not assignable to type 'string[]'
            // const invalidResult: number = secrets.combine(shares); // Error: Type 'string' is not assignable to type 'number'
            // config.bits = 16; // Error: Cannot assign to 'bits' because it is a read-only property
        });
    });

    describe("Property 2: API Signature Consistency", function(): void {
        /**
         * Feature: typescript-conversion, Property 2: API Signature Consistency
         * Validates: Requirements 1.3, 6.2
         * 
         * For any public API method, the TypeScript signature should exactly match
         * the runtime behavior and parameter validation of the original JavaScript implementation.
         */
        it("should maintain consistent API signatures across all methods", function(): void {
            const iterations: number = PropertyTestHelper.getIterationCount("PROPERTY_TEST");
            
            const property = (testData: TestDataGenerators.ComprehensiveTestData): boolean => {
                try {
                    // Reset to default state for consistent testing
                    secrets.init();
                    secrets.setRNG("testRandom");
                    
                    // Test share() signature consistency
                    const shares1: string[] = secrets.share(
                        testData.secret,
                        testData.shareConfig.numShares,
                        testData.shareConfig.threshold
                    );
                    
                    // Test with optional padLength parameter
                    const shares2: string[] = secrets.share(
                        testData.secret,
                        testData.shareConfig.numShares,
                        testData.shareConfig.threshold,
                        testData.padding
                    );
                    
                    // Verify both return arrays of strings
                    if (!Array.isArray(shares1) || !Array.isArray(shares2)) return false;
                    if (!shares1.every(s => typeof s === 'string')) return false;
                    if (!shares2.every(s => typeof s === 'string')) return false;
                    
                    // Test combine() signature consistency
                    const subset: string[] = shares1.slice(0, testData.shareConfig.threshold);
                    const result1: string = secrets.combine(subset);
                    const result2: string = secrets.combine(subset, 0);
                    
                    // Verify both return strings
                    if (typeof result1 !== 'string' || typeof result2 !== 'string') return false;
                    
                    // Test extractShareComponents() signature consistency
                    const components: ShareComponents = secrets.extractShareComponents(shares1[0]);
                    if (typeof components.bits !== 'number') return false;
                    if (typeof components.id !== 'number') return false;
                    if (typeof components.data !== 'string') return false;
                    
                    // Test str2hex() signature consistency
                    const hex1: string = secrets.str2hex(testData.asciiString);
                    const hex2: string = secrets.str2hex(testData.asciiString, 2);
                    if (typeof hex1 !== 'string' || typeof hex2 !== 'string') return false;
                    
                    // Test hex2str() signature consistency
                    const str1: string = secrets.hex2str(hex1);
                    const str2: string = secrets.hex2str(hex1, 2);
                    if (typeof str1 !== 'string' || typeof str2 !== 'string') return false;
                    
                    // Test random() signature consistency
                    const random: string = secrets.random(128);
                    if (typeof random !== 'string') return false;
                    
                    // Test newShare() signature consistency with number ID
                    const newShare1: string = secrets.newShare(testData.shareId, shares1);
                    if (typeof newShare1 !== 'string') return false;
                    
                    // Test newShare() signature consistency with string ID
                    const newShare2: string = secrets.newShare(testData.shareId.toString(), shares1);
                    if (typeof newShare2 !== 'string') return false;
                    
                    // Test init() signature consistency (use valid bit values)
                    secrets.init();
                    secrets.init(8);
                    secrets.init(8, "testRandom");
                    
                    // Test setRNG() signature consistency
                    const rngResult1: boolean = secrets.setRNG();
                    const rngResult2: boolean = secrets.setRNG("testRandom");
                    const customRNG: (bits: number) => string = (bits: number): string => "1".repeat(bits);
                    const rngResult3: boolean = secrets.setRNG(customRNG);
                    
                    if (typeof rngResult1 !== 'boolean') return false;
                    if (typeof rngResult2 !== 'boolean') return false;
                    if (typeof rngResult3 !== 'boolean') return false;
                    
                    // Test getConfig() signature consistency
                    const config: SecretsConfig = secrets.getConfig();
                    if (typeof config.radix !== 'number') return false;
                    if (typeof config.bits !== 'number') return false;
                    if (typeof config.maxShares !== 'number') return false;
                    if (typeof config.hasCSPRNG !== 'boolean') return false;
                    if (typeof config.typeCSPRNG !== 'string') return false;
                    
                    return true;
                } catch (error) {
                    // API signature consistency should prevent errors
                    return false;
                }
            };
            
            const results: PropertyTestHelper.PropertyTestResults = PropertyTestHelper.propertyTest(
                "API Signature Consistency",
                property,
                {
                    iterations,
                    testType: "PROPERTY_TEST",
                    generators: {
                        secret: TestDataGenerators.generateRandomSecret,
                        shareConfig: TestDataGenerators.generateShareConfig,
                        asciiString: TestDataGenerators.generateRandomString,
                        bits: TestDataGenerators.generateRandomBits,
                        padding: TestDataGenerators.generateRandomPadding,
                        shareId: TestDataGenerators.generateRandomShareId
                    }
                }
            );
            
            // Report results
            if (!results.passed) {
                console.log("API Signature Consistency failures:");
                results.failures.forEach((failure, index) => {
                    console.log(`  Failure ${index + 1}:`, failure);
                });
            }
            
            expect(results.passed).toBe(true);
            expect(results.successes).toBe(iterations);
            expect(results.failures.length).toBe(0);
        });

        it("should validate parameters consistently with TypeScript types", function(): void {
            // Test that parameter validation matches TypeScript type constraints
            
            // Reset to known state
            secrets.init();
            secrets.setRNG("testRandom");
            
            // Valid calls should succeed
            expect(function(): void {
                secrets.share("deadbeef", 5, 3);
                secrets.combine(["8013ac6c71ce163b661fa6ac8ce0141885ebee425222f1f07d07cad2e4a63f995b7", "8023ac6c71ce163b661fa6ac8ce0141885ebee425222f1f07d07cad2e4a63f995b7", "8033ac6c71ce163b661fa6ac8ce0141885ebee425222f1f07d07cad2e4a63f995b7"]);
                secrets.str2hex("test");
                secrets.hex2str("74657374");
                secrets.random(128);
                secrets.init(8);
                secrets.setRNG("testRandom");
            }).not.toThrow();
            
            // TypeScript prevents invalid types at compile time,
            // but we verify runtime behavior for edge cases
            expect(function(): void {
                secrets.share("", 5, 3); // Empty secret should work
            }).not.toThrow();
            
            expect(function(): void {
                secrets.share("deadbeef", 2, 2); // Minimum valid values
            }).not.toThrow();
        });

        it("should maintain optional parameter behavior", function(): void {
            const secret: string = "deadbeef";
            
            // Test share() with and without optional padLength
            const shares1: string[] = secrets.share(secret, 5, 3);
            const shares2: string[] = secrets.share(secret, 5, 3, 128);
            
            expect(Array.isArray(shares1)).toBe(true);
            expect(Array.isArray(shares2)).toBe(true);
            expect(shares1.length).toBe(5);
            expect(shares2.length).toBe(5);
            
            // Test combine() with and without optional 'at' parameter
            const result1: string = secrets.combine(shares1.slice(0, 3));
            const result2: string = secrets.combine(shares1.slice(0, 3), 0);
            
            expect(typeof result1).toBe("string");
            expect(typeof result2).toBe("string");
            expect(result1).toBe(secret);
            expect(result2).toBe(secret);
            
            // Test str2hex() with and without optional bytesPerChar
            const hex1: string = secrets.str2hex("test");
            const hex2: string = secrets.str2hex("test", 2);
            
            expect(typeof hex1).toBe("string");
            expect(typeof hex2).toBe("string");
            
            // Test init() with various optional parameters
            secrets.init();
            expect(secrets.getConfig().bits).toBe(8);
            
            secrets.init(16);
            expect(secrets.getConfig().bits).toBe(16);
            
            secrets.init(8, "testRandom");
            expect(secrets.getConfig().bits).toBe(8);
            expect(secrets.getConfig().typeCSPRNG).toBe("testRandom");
        });
    });

    describe("Property 3: Build Output Equivalence", function(): void {
        /**
         * Feature: typescript-conversion, Property 3: Build Output Equivalence
         * Validates: Requirements 1.1, 1.2
         * 
         * For any valid input, the TypeScript-compiled JavaScript should produce
         * identical output to the original JavaScript implementation.
         */
        it("should produce identical outputs for all operations", function(): void {
            const iterations: number = PropertyTestHelper.getIterationCount("PROPERTY_TEST");
            
            const property = (testData: TestDataGenerators.ComprehensiveTestData): boolean => {
                try {
                    // Reset to known state
                    secrets.init();
                    secrets.setRNG("testRandom");
                    
                    // Test share/combine round trip
                    const shares: string[] = secrets.share(
                        testData.secret,
                        testData.shareConfig.numShares,
                        testData.shareConfig.threshold
                    );
                    
                    const subset: string[] = shares.slice(0, testData.shareConfig.threshold);
                    const reconstructed: string = secrets.combine(subset);
                    
                    // Verify round trip produces identical output
                    if (reconstructed !== testData.secret) return false;
                    
                    // Test str2hex/hex2str round trip
                    const hex: string = secrets.str2hex(testData.asciiString);
                    const roundTrip: string = secrets.hex2str(hex);
                    
                    // Verify round trip produces identical output
                    if (roundTrip !== testData.asciiString) return false;
                    
                    // Test extractShareComponents produces consistent output
                    const components: ShareComponents = secrets.extractShareComponents(shares[0]);
                    
                    // Verify components match expected values
                    if (components.bits !== secrets.getConfig().bits) return false;
                    if (components.id < 1 || components.id > secrets.getConfig().maxShares) return false;
                    if (typeof components.data !== 'string') return false;
                    
                    // Test random produces valid hex output
                    const randomHex: string = secrets.random(128);
                    if (!/^[0-9a-f]+$/.test(randomHex)) return false; // Should be hex string
                    
                    // Test newShare produces valid share (use a safe ID that won't conflict)
                    const safeShareId: number = testData.shareConfig.numShares + 1;
                    const newShare: string = secrets.newShare(safeShareId, shares);
                    const newComponents: ShareComponents = secrets.extractShareComponents(newShare);
                    
                    // Verify new share has correct structure
                    if (newComponents.bits !== components.bits) return false;
                    if (newComponents.id !== safeShareId) return false;
                    
                    // Test that new share can be used in reconstruction
                    const sharesWithNew: string[] = [newShare, ...shares.slice(1, testData.shareConfig.threshold)];
                    const reconstructedWithNew: string = secrets.combine(sharesWithNew);
                    
                    // Verify reconstruction with new share produces identical output
                    if (reconstructedWithNew !== testData.secret) return false;
                    
                    return true;
                } catch (error) {
                    // Build output equivalence should not produce errors for valid inputs
                    return false;
                }
            };
            
            const results: PropertyTestHelper.PropertyTestResults = PropertyTestHelper.propertyTest(
                "Build Output Equivalence",
                property,
                {
                    iterations,
                    testType: "PROPERTY_TEST",
                    generators: {
                        secret: TestDataGenerators.generateRandomSecret,
                        shareConfig: TestDataGenerators.generateShareConfig,
                        asciiString: TestDataGenerators.generateRandomString,
                        shareId: TestDataGenerators.generateRandomShareId
                    }
                }
            );
            
            // Report results
            if (!results.passed) {
                console.log("Build Output Equivalence failures:");
                results.failures.forEach((failure, index) => {
                    console.log(`  Failure ${index + 1}:`, failure);
                });
            }
            
            expect(results.passed).toBe(true);
            expect(results.successes).toBe(iterations);
            expect(results.failures.length).toBe(0);
        });

        it("should maintain deterministic behavior with test RNG", function(): void {
            // Test that using testRandom produces deterministic results
            secrets.init();
            secrets.setRNG("testRandom");
            
            const secret: string = "deadbeef";
            const shares1: string[] = secrets.share(secret, 5, 3);
            
            // Reset and generate again
            secrets.init();
            secrets.setRNG("testRandom");
            const shares2: string[] = secrets.share(secret, 5, 3);
            
            // Verify deterministic output
            expect(shares1.length).toBe(shares2.length);
            for (let i = 0; i < shares1.length; i++) {
                expect(shares1[i]).toBe(shares2[i]);
            }
        });

        it("should produce consistent share structure across operations", function(): void {
            secrets.init();
            secrets.setRNG("testRandom");
            
            const secret: string = "deadbeefcafebabe";
            const shares: string[] = secrets.share(secret, 10, 5);
            
            // Verify all shares have consistent structure
            const firstComponents: ShareComponents = secrets.extractShareComponents(shares[0]);
            
            for (let i = 1; i < shares.length; i++) {
                const components: ShareComponents = secrets.extractShareComponents(shares[i]);
                
                // All shares should have same bit configuration
                expect(components.bits).toBe(firstComponents.bits);
                
                // Each share should have unique ID
                expect(components.id).toBe(i + 1);
                
                // All shares should have data
                expect(components.data.length).toBeGreaterThan(0);
            }
        });

        it("should maintain functional equivalence across different configurations", function(): void {
            const secret: string = "deadbeefcafebabe";
            const bitConfigs: number[] = [3, 8, 16, 20];
            
            bitConfigs.forEach((bits: number) => {
                secrets.init(bits);
                secrets.setRNG("testRandom");
                
                const maxShares: number = Math.pow(2, bits) - 1;
                const numShares: number = Math.min(5, maxShares);
                const threshold: number = Math.min(3, numShares);
                
                const shares: string[] = secrets.share(secret, numShares, threshold);
                const reconstructed: string = secrets.combine(shares.slice(0, threshold));
                
                // Verify functional equivalence regardless of configuration
                expect(reconstructed).toBe(secret);
            });
        });
    });

    describe("Property 4: Type Definition Accuracy", function(): void {
        /**
         * Feature: typescript-conversion, Property 4: Type Definition Accuracy
         * Validates: Requirements 4.1, 4.2, 7.3
         * 
         * For any type annotation in the TypeScript source, the actual runtime
         * values should conform to the declared types.
         */
        it("should ensure runtime values match declared types", function(): void {
            const iterations: number = PropertyTestHelper.getIterationCount("PROPERTY_TEST");
            
            const property = (testData: TestDataGenerators.ComprehensiveTestData): boolean => {
                try {
                    // Reset to known state
                    secrets.init();
                    secrets.setRNG("testRandom");
                    
                    // Test SecretsConfig type accuracy
                    const config: SecretsConfig = secrets.getConfig();
                    
                    // Verify all config properties match their declared types
                    if (typeof config.radix !== 'number') return false;
                    if (typeof config.bits !== 'number') return false;
                    if (typeof config.maxShares !== 'number') return false;
                    if (typeof config.hasCSPRNG !== 'boolean') return false;
                    if (typeof config.typeCSPRNG !== 'string') return false;
                    
                    // Verify config values are within expected ranges
                    if (config.radix !== 16) return false; // Should always be 16
                    if (config.bits < 3 || config.bits > 20) return false;
                    if (config.maxShares !== Math.pow(2, config.bits) - 1) return false;
                    
                    // Test Shares type accuracy (array of strings)
                    const shares: string[] = secrets.share(
                        testData.secret,
                        testData.shareConfig.numShares,
                        testData.shareConfig.threshold
                    );
                    
                    // Verify shares is an array
                    if (!Array.isArray(shares)) return false;
                    
                    // Verify all elements are strings
                    for (const share of shares) {
                        if (typeof share !== 'string') return false;
                        if (share.length === 0) return false; // Shares should not be empty
                    }
                    
                    // Test ShareComponents type accuracy
                    const components: ShareComponents = secrets.extractShareComponents(shares[0]);
                    
                    // Verify all component properties match their declared types
                    if (typeof components.bits !== 'number') return false;
                    if (typeof components.id !== 'number') return false;
                    if (typeof components.data !== 'string') return false;
                    
                    // Verify component values are within expected ranges
                    if (components.bits < 3 || components.bits > 20) return false;
                    if (components.id < 1 || components.id > config.maxShares) return false;
                    if (components.data.length === 0) return false;
                    if (!/^[0-9a-f]+$/.test(components.data)) return false; // Should be hex
                    
                    // Test string conversion type accuracy
                    const hex: string = secrets.str2hex(testData.asciiString);
                    const str: string = secrets.hex2str(hex);
                    
                    // Verify return types
                    if (typeof hex !== 'string') return false;
                    if (typeof str !== 'string') return false;
                    if (!/^[0-9a-f]*$/.test(hex)) return false; // Should be hex
                    
                    // Test random type accuracy
                    const randomHex: string = secrets.random(128);
                    
                    // Verify return type
                    if (typeof randomHex !== 'string') return false;
                    if (!/^[0-9a-f]+$/.test(randomHex)) return false; // Should be hex
                    
                    // Test RNG function type accuracy
                    const customRNG: (bits: number) => string = (bits: number): string => {
                        return "1".repeat(bits);
                    };
                    
                    const rngResult: boolean = secrets.setRNG(customRNG);
                    
                    // Verify return type
                    if (typeof rngResult !== 'boolean') return false;
                    
                    return true;
                } catch (error) {
                    // Type definition accuracy should prevent errors
                    return false;
                }
            };
            
            const results: PropertyTestHelper.PropertyTestResults = PropertyTestHelper.propertyTest(
                "Type Definition Accuracy",
                property,
                {
                    iterations,
                    testType: "PROPERTY_TEST",
                    generators: {
                        secret: TestDataGenerators.generateRandomSecret,
                        shareConfig: TestDataGenerators.generateShareConfig,
                        asciiString: TestDataGenerators.generateRandomString
                    }
                }
            );
            
            // Report results
            if (!results.passed) {
                console.log("Type Definition Accuracy failures:");
                results.failures.forEach((failure, index) => {
                    console.log(`  Failure ${index + 1}:`, failure);
                });
            }
            
            expect(results.passed).toBe(true);
            expect(results.successes).toBe(iterations);
            expect(results.failures.length).toBe(0);
        });

        it("should validate CSPRNGType enum values", function(): void {
            // Test that all valid CSPRNG types are accepted
            const validTypes: string[] = [
                "nodeCryptoRandomBytes",
                "browserCryptoGetRandomValues",
                "testRandom"
            ];
            
            validTypes.forEach((type: string) => {
                expect(function(): void {
                    secrets.init(8, type as any);
                }).not.toThrow();
            });
            
            // Test that invalid types are rejected
            expect(function(): void {
                secrets.init(8, "invalidType" as any);
            }).toThrow();
        });

        it("should validate readonly properties cannot be modified", function(): void {
            const config: SecretsConfig = secrets.getConfig();
            
            // Store original values
            const originalRadix: number = config.radix;
            const originalBits: number = config.bits;
            const originalMaxShares: number = config.maxShares;
            
            // Attempt to modify (TypeScript prevents this at compile time)
            // At runtime, these assignments may or may not work depending on implementation
            try {
                (config as any).radix = 999;
                (config as any).bits = 999;
                (config as any).maxShares = 999;
            } catch (error) {
                // Expected if properties are truly readonly
            }
            
            // Get fresh config to verify immutability
            const freshConfig: SecretsConfig = secrets.getConfig();
            
            // Values should be unchanged
            expect(freshConfig.radix).toBe(originalRadix);
            expect(freshConfig.bits).toBe(originalBits);
            expect(freshConfig.maxShares).toBe(originalMaxShares);
        });

        it("should validate ShareComponents structure", function(): void {
            secrets.init();
            secrets.setRNG("testRandom");
            
            const secret: string = "deadbeef";
            const shares: string[] = secrets.share(secret, 5, 3);
            
            shares.forEach((share: string, index: number) => {
                const components: ShareComponents = secrets.extractShareComponents(share);
                
                // Verify all required properties exist and have correct types
                expect(components.bits).toBeDefined();
                expect(components.id).toBeDefined();
                expect(components.data).toBeDefined();
                
                // Verify types
                expect(typeof components.bits).toBe('number');
                expect(typeof components.id).toBe('number');
                expect(typeof components.data).toBe('string');
                
                // Verify values
                expect(components.bits).toBe(8);
                expect(components.id).toBe(index + 1);
                expect(components.data.length).toBeGreaterThan(0);
                expect(components.data).toMatch(/^[0-9a-f]+$/);
            });
        });

        it("should validate RNGFunction type signature", function(): void {
            // Test that valid RNG functions are accepted
            const validRNG: (bits: number) => string = (bits: number): string => {
                return "1".repeat(bits);
            };
            
            expect(function(): void {
                secrets.setRNG(validRNG);
            }).not.toThrow();
            
            // Test that the RNG function is called with correct parameters
            let calledWithBits: number | undefined;
            const testRNG: (bits: number) => string = (bits: number): string => {
                calledWithBits = bits;
                return "1".repeat(bits);
            };
            
            secrets.setRNG(testRNG);
            secrets.random(128);
            
            // Verify RNG was called with correct bit count
            expect(calledWithBits).toBe(128);
        });
    });
});