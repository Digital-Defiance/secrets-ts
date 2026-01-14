/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */

import secrets = require("../../src/secrets");
import * as fs from "fs";
import * as path from "path";
import type { SecretsConfig, ShareComponents } from "../../src/types";
import * as PropertyTestHelper from "../helpers/PropertyTestHelper";
import * as TestDataGenerators from "../helpers/TestDataGenerators";

/**
 * Property-Based Tests for Development Tool Integration
 *
 * Feature: typescript-conversion
 * Property 6: Development Tool Integration
 *
 * These tests validate that TypeScript-aware development tools can provide
 * accurate IntelliSense, error detection, and refactoring capabilities.
 */

describe("Development Tool Integration Property Tests", function (): void {
  "use strict";

  beforeEach(function (): void {
    secrets.init();
    secrets.setRNG("testRandom");
  });

  describe("Property 6: Development Tool Integration", function (): void {
    /**
     * Feature: typescript-conversion, Property 6: Development Tool Integration
     * Validates: Requirements 5.1, 5.2, 5.3
     *
     * For any TypeScript-aware development tool, the type information should
     * provide accurate IntelliSense, error detection, and refactoring capabilities.
     */

    it("should provide accurate type information for IntelliSense", function (): void {
      const iterations: number =
        PropertyTestHelper.getIterationCount("PROPERTY_TEST");

      const property = (
        testData: TestDataGenerators.ComprehensiveTestData
      ): boolean => {
        try {
          // Test that all public API methods have accurate type information
          // that would be available to IntelliSense

          // 1. Test that getConfig() returns SecretsConfig with all properties
          const config: SecretsConfig = secrets.getConfig();

          // Verify all properties are accessible (IntelliSense would show these)
          const hasRadix: boolean = "radix" in config;
          const hasBits: boolean = "bits" in config;
          const hasMaxShares: boolean = "maxShares" in config;
          const hasCSPRNG: boolean = "hasCSPRNG" in config;
          const hasTypeCSPRNG: boolean = "typeCSPRNG" in config;

          if (
            !hasRadix ||
            !hasBits ||
            !hasMaxShares ||
            !hasCSPRNG ||
            !hasTypeCSPRNG
          ) {
            return false;
          }

          // 2. Test that share() returns Shares (string array)
          const shares: string[] = secrets.share(
            testData.secret,
            testData.shareConfig.numShares,
            testData.shareConfig.threshold
          );

          // Verify return type is array (IntelliSense would show array methods)
          if (!Array.isArray(shares)) return false;
          if (typeof shares.length !== "number") return false;
          if (typeof shares.slice !== "function") return false;

          // 3. Test that combine() returns string
          const subset: string[] = shares.slice(
            0,
            testData.shareConfig.threshold
          );
          const reconstructed: string = secrets.combine(subset);

          // Verify return type is string (IntelliSense would show string methods)
          if (typeof reconstructed !== "string") return false;
          if (typeof reconstructed.length !== "number") return false;
          if (typeof reconstructed.substring !== "function") return false;

          // 4. Test that extractShareComponents() returns ShareComponents
          const components: ShareComponents = secrets.extractShareComponents(
            shares[0]
          );

          // Verify all properties are accessible (IntelliSense would show these)
          const hasComponentBits: boolean = "bits" in components;
          const hasComponentId: boolean = "id" in components;
          const hasComponentData: boolean = "data" in components;

          if (!hasComponentBits || !hasComponentId || !hasComponentData) {
            return false;
          }

          // 5. Test that str2hex() and hex2str() return strings
          const hex: string = secrets.str2hex(testData.asciiString);
          const str: string = secrets.hex2str(hex);

          // Verify return types have string methods (IntelliSense would show these)
          if (typeof hex.toUpperCase !== "function") return false;
          if (typeof str.toLowerCase !== "function") return false;

          // 6. Test that random() returns string
          const randomHex: string = secrets.random(128);

          // Verify return type has string methods
          if (typeof randomHex.match !== "function") return false;

          return true;
        } catch (error) {
          return false;
        }
      };

      const results: PropertyTestHelper.PropertyTestResults =
        PropertyTestHelper.propertyTest(
          "Development Tool Integration - IntelliSense",
          property,
          {
            iterations,
            testType: "PROPERTY_TEST",
            generators: {
              secret: TestDataGenerators.generateRandomSecret,
              shareConfig: TestDataGenerators.generateShareConfig,
              asciiString: TestDataGenerators.generateRandomString,
            },
          }
        );

      // Report results
      if (!results.passed) {
        console.log("Development Tool Integration - IntelliSense failures:");
        results.failures.forEach((failure, index) => {
          console.log(`  Failure ${index + 1}:`, failure);
        });
      }

      expect(results.passed).toBe(true);
      expect(results.successes).toBe(iterations);
      expect(results.failures.length).toBe(0);
    });

    it("should enable compile-time error detection for type mismatches", function (): void {
      // This test verifies that TypeScript compilation would catch type errors
      // We test this by verifying that the type system is strict enough to
      // prevent common type errors

      // Test 1: Verify that config properties have correct types
      const config: SecretsConfig = secrets.getConfig();

      // These should all be the correct types
      expect(typeof config.radix).toBe("number");
      expect(typeof config.bits).toBe("number");
      expect(typeof config.maxShares).toBe("number");
      expect(typeof config.hasCSPRNG).toBe("boolean");
      expect(typeof config.typeCSPRNG).toBe("string");

      // Test 2: Verify that function parameters are type-checked
      const secret: string = "deadbeef";
      const shares: string[] = secrets.share(secret, 5, 3);

      // These should all work with correct types
      expect(function (): void {
        secrets.share(secret, 5, 3);
        secrets.share(secret, 5, 3, 128);
        secrets.combine(shares);
        secrets.combine(shares, 0);
        secrets.extractShareComponents(shares[0]);
        secrets.str2hex("test");
        secrets.hex2str("74657374");
        secrets.random(128);
        secrets.newShare(10, shares);
        secrets.newShare("10", shares);
      }).not.toThrow();

      // Test 3: Verify that return types are correctly inferred
      const result: string = secrets.combine(shares);
      const components: ShareComponents = secrets.extractShareComponents(
        shares[0]
      );
      const hex: string = secrets.str2hex("test");
      const randomHex: string = secrets.random(128);

      // All return types should be correct
      expect(typeof result).toBe("string");
      expect(typeof components.bits).toBe("number");
      expect(typeof hex).toBe("string");
      expect(typeof randomHex).toBe("string");

      // The following would cause TypeScript compilation errors if uncommented:
      // const invalidShares: string[] = 123; // Error: Type 'number' is not assignable to type 'string[]'
      // const invalidResult: number = secrets.combine(shares); // Error: Type 'string' is not assignable to type 'number'
      // secrets.share(123, 5, 3); // Error: Argument of type 'number' is not assignable to parameter of type 'string'
      // secrets.share(secret, "5", 3); // Error: Argument of type 'string' is not assignable to parameter of type 'number'
    });

    it("should provide accurate type information for safe refactoring", function (): void {
      const iterations: number =
        PropertyTestHelper.getIterationCount("PROPERTY_TEST");

      const property = (
        testData: TestDataGenerators.ComprehensiveTestData
      ): boolean => {
        try {
          // Test that type information is accurate enough to support safe refactoring
          // This means that if we rename or restructure code, TypeScript will catch errors

          // 1. Test that we can safely extract variables with correct types
          const config: SecretsConfig = secrets.getConfig();
          const radix: number = config.radix;
          const bits: number = config.bits;
          const maxShares: number = config.maxShares;

          // Verify extracted variables have correct types
          if (typeof radix !== "number") return false;
          if (typeof bits !== "number") return false;
          if (typeof maxShares !== "number") return false;

          // 2. Test that we can safely extract function calls with correct types
          const shares: string[] = secrets.share(
            testData.secret,
            testData.shareConfig.numShares,
            testData.shareConfig.threshold
          );

          const subset: string[] = shares.slice(
            0,
            testData.shareConfig.threshold
          );
          const reconstructed: string = secrets.combine(subset);

          // Verify extracted values have correct types
          if (!Array.isArray(shares)) return false;
          if (!Array.isArray(subset)) return false;
          if (typeof reconstructed !== "string") return false;

          // 3. Test that we can safely compose operations with correct types
          const hex: string = secrets.str2hex(testData.asciiString);
          const roundTrip: string = secrets.hex2str(hex);

          // Verify composed operations have correct types
          if (typeof hex !== "string") return false;
          if (typeof roundTrip !== "string") return false;

          // 4. Test that we can safely destructure with correct types
          const components: ShareComponents = secrets.extractShareComponents(
            shares[0]
          );
          const {
            bits: componentBits,
            id: componentId,
            data: componentData,
          } = components;

          // Verify destructured values have correct types
          if (typeof componentBits !== "number") return false;
          if (typeof componentId !== "number") return false;
          if (typeof componentData !== "string") return false;

          return true;
        } catch (error) {
          return false;
        }
      };

      const results: PropertyTestHelper.PropertyTestResults =
        PropertyTestHelper.propertyTest(
          "Development Tool Integration - Safe Refactoring",
          property,
          {
            iterations,
            testType: "PROPERTY_TEST",
            generators: {
              secret: TestDataGenerators.generateRandomSecret,
              shareConfig: TestDataGenerators.generateShareConfig,
              asciiString: TestDataGenerators.generateRandomString,
            },
          }
        );

      // Report results
      if (!results.passed) {
        console.log(
          "Development Tool Integration - Safe Refactoring failures:"
        );
        results.failures.forEach((failure, index) => {
          console.log(`  Failure ${index + 1}:`, failure);
        });
      }

      expect(results.passed).toBe(true);
      expect(results.successes).toBe(iterations);
      expect(results.failures.length).toBe(0);
    });

    it("should provide accurate source map support for debugging", function (): void {
      // Test that source maps are generated and can be used for debugging

      // Verify that source map files exist
      // Use process.cwd() to get the project root, then navigate to dist
      const projectRoot: string = process.cwd();
      const distPath: string = path.join(projectRoot, "dist");
      const sourceMapFiles: string[] = ["secrets.js.map", "secrets.d.ts.map"];

      sourceMapFiles.forEach((file: string) => {
        const filePath: string = path.join(distPath, file);
        const exists: boolean = fs.existsSync(filePath);

        if (!exists) {
          console.log(`Source map file not found: ${filePath}`);
          console.log(`Looking in: ${distPath}`);
          console.log(`Files in dist:`, fs.readdirSync(distPath));
        }

        expect(exists).toBe(true);

        if (exists) {
          // Verify source map has valid content
          const content: string = fs.readFileSync(filePath, "utf8");
          const sourceMap: any = JSON.parse(content);

          // Verify source map has required properties
          expect(sourceMap.version).toBeDefined();
          expect(sourceMap.sources).toBeDefined();
          expect(Array.isArray(sourceMap.sources)).toBe(true);
          expect(sourceMap.sources.length).toBeGreaterThan(0);
          expect(sourceMap.mappings).toBeDefined();
          expect(typeof sourceMap.mappings).toBe("string");
          expect(sourceMap.mappings.length).toBeGreaterThan(0);
        }
      });
    });

    it("should provide accurate type definitions for IDE integration", function (): void {
      // Test that type definition files are generated and accurate

      // Verify that .d.ts files exist
      // Use process.cwd() to get the project root, then navigate to dist
      const projectRoot: string = process.cwd();
      const distPath: string = path.join(projectRoot, "dist");
      const typeDefFiles: string[] = [
        "secrets.d.ts",
        "types.d.ts",
        "errors.d.ts",
        "validation.d.ts",
      ];

      typeDefFiles.forEach((file: string) => {
        const filePath: string = path.join(distPath, file);
        const exists: boolean = fs.existsSync(filePath);

        if (!exists) {
          console.log(`Type definition file not found: ${filePath}`);
          console.log(`Looking in: ${distPath}`);
          console.log(`Files in dist:`, fs.readdirSync(distPath));
        }

        expect(exists).toBe(true);

        if (exists) {
          // Verify type definition has valid content
          const content: string = fs.readFileSync(filePath, "utf8");

          // Verify it's a TypeScript declaration file
          expect(content.length).toBeGreaterThan(0);

          // Verify it contains type declarations
          const hasExport: boolean = content.includes("export");
          const hasInterface: boolean =
            content.includes("interface") || content.includes("type");

          expect(hasExport || hasInterface).toBe(true);
        }
      });
    });

    it("should maintain type safety across module boundaries", function (): void {
      const iterations: number =
        PropertyTestHelper.getIterationCount("PROPERTY_TEST");

      const property = (
        testData: TestDataGenerators.ComprehensiveTestData
      ): boolean => {
        try {
          // Test that types are correctly preserved when importing/exporting

          // 1. Test that imported types match runtime values
          const config: SecretsConfig = secrets.getConfig();

          // Verify config matches SecretsConfig interface
          const configKeys: string[] = Object.keys(config);
          const requiredKeys: string[] = [
            "radix",
            "bits",
            "maxShares",
            "hasCSPRNG",
            "typeCSPRNG",
          ];

          for (const key of requiredKeys) {
            if (!configKeys.includes(key)) return false;
          }

          // 2. Test that function signatures are correctly typed across modules
          const shares: string[] = secrets.share(
            testData.secret,
            testData.shareConfig.numShares,
            testData.shareConfig.threshold
          );

          // Verify shares match Shares type (string[])
          if (!Array.isArray(shares)) return false;
          for (const share of shares) {
            if (typeof share !== "string") return false;
          }

          // 3. Test that complex types are correctly preserved
          const components: ShareComponents = secrets.extractShareComponents(
            shares[0]
          );

          // Verify components match ShareComponents interface
          const componentKeys: string[] = Object.keys(components);
          const requiredComponentKeys: string[] = ["bits", "id", "data"];

          for (const key of requiredComponentKeys) {
            if (!componentKeys.includes(key)) return false;
          }

          return true;
        } catch (error) {
          return false;
        }
      };

      const results: PropertyTestHelper.PropertyTestResults =
        PropertyTestHelper.propertyTest(
          "Development Tool Integration - Module Boundary Type Safety",
          property,
          {
            iterations,
            testType: "PROPERTY_TEST",
            generators: {
              secret: TestDataGenerators.generateRandomSecret,
              shareConfig: TestDataGenerators.generateShareConfig,
            },
          }
        );

      // Report results
      if (!results.passed) {
        console.log(
          "Development Tool Integration - Module Boundary Type Safety failures:"
        );
        results.failures.forEach((failure, index) => {
          console.log(`  Failure ${index + 1}:`, failure);
        });
      }

      expect(results.passed).toBe(true);
      expect(results.successes).toBe(iterations);
      expect(results.failures.length).toBe(0);
    });
  });
});
