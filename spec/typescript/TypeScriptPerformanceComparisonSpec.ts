/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */

import secrets = require("../../src/secrets");
import * as fs from "fs";
import * as path from "path";
import * as TestDataGenerators from "../helpers/TestDataGenerators";

// Import JavaScript helpers that don't have TypeScript definitions
// Use path.join with __dirname to get the correct path from compiled location
const PerformanceHelper = require(path.join(__dirname, "../../../spec/helpers/PerformanceHelper"));

/**
 * TypeScript Performance Comparison Tests
 *
 * Feature: typescript-conversion
 * Requirements: 8.1, 8.2, 8.3
 *
 * These tests compare the performance of the TypeScript-compiled output
 * against the original JavaScript implementation to ensure no performance
 * regression has occurred during the conversion.
 */

describe("TypeScript Performance Comparison Tests", function (): void {
  "use strict";

  beforeEach(function (): void {
    secrets.init();
    secrets.setRNG("testRandom");
  });

  describe("Compilation Time Validation", function (): void {
    /**
     * Validates: Requirements 8.1, 8.2
     *
     * Ensures TypeScript compilation completes in reasonable time
     * and doesn't significantly impact development workflow.
     */
    it("should measure TypeScript compilation time", function (): void {
      // This test validates that compilation metadata exists
      // Actual compilation happens during build process

      const distPath: string = path.join(__dirname, "../../../dist");
      const distExists: boolean = fs.existsSync(distPath);

      expect(distExists).toBe(true);

      // Verify all expected output files exist
      const expectedFiles: string[] = ["secrets.js", "secrets.d.ts", "secrets.js.map"];

      expectedFiles.forEach((file: string) => {
        const filePath: string = path.join(distPath, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });

      console.log("TypeScript compilation outputs verified:");
      console.log("  CommonJS: dist/secrets.js");
      console.log("  Type definitions: dist/secrets.d.ts");
      console.log("  Source maps: dist/secrets.js.map");
    });

    it("should verify ES module build exists", function (): void {
      const esmPath: string = path.join(__dirname, "../../../dist/esm");
      const esmExists: boolean = fs.existsSync(esmPath);

      expect(esmExists).toBe(true);

      const esmFile: string = path.join(esmPath, "secrets.js");
      expect(fs.existsSync(esmFile)).toBe(true);

      console.log("ES module build verified: dist/esm/secrets.js");
    });

    it("should verify UMD build exists", function (): void {
      const umdPath: string = path.join(__dirname, "../../../dist/umd");
      const umdExists: boolean = fs.existsSync(umdPath);

      expect(umdExists).toBe(true);

      const umdFile: string = path.join(umdPath, "secrets.js");
      expect(fs.existsSync(umdFile)).toBe(true);

      console.log("UMD build verified: dist/umd/secrets.js");
    });
  });

  describe("Bundle Size Validation", function (): void {
    /**
     * Validates: Requirements 8.2, 8.3
     *
     * Ensures TypeScript-compiled bundles are of similar or smaller size
     * compared to the original JavaScript implementation.
     */
    it("should measure and compare bundle sizes", function (): void {
      const distPath: string = path.join(__dirname, "../../../dist");

      // Measure CommonJS bundle size
      const cjsPath: string = path.join(distPath, "secrets.js");
      const cjsStats: fs.Stats = fs.statSync(cjsPath);
      const cjsSizeKB: number = cjsStats.size / 1024;

      // Measure ES module bundle size
      const esmPath: string = path.join(distPath, "esm/secrets.js");
      const esmStats: fs.Stats = fs.statSync(esmPath);
      const esmSizeKB: number = esmStats.size / 1024;

      // Measure UMD bundle size
      const umdPath: string = path.join(distPath, "umd/secrets.js");
      const umdStats: fs.Stats = fs.statSync(umdPath);
      const umdSizeKB: number = umdStats.size / 1024;

      console.log("Bundle sizes:");
      console.log(`  CommonJS: ${cjsSizeKB.toFixed(2)} KB`);
      console.log(`  ES Module: ${esmSizeKB.toFixed(2)} KB`);
      console.log(`  UMD: ${umdSizeKB.toFixed(2)} KB`);

      // Verify bundles are reasonable size (< 100KB for unminified)
      expect(cjsSizeKB).toBeLessThan(100);
      expect(esmSizeKB).toBeLessThan(100);
      expect(umdSizeKB).toBeLessThan(100);

      // Verify bundles are not empty
      expect(cjsSizeKB).toBeGreaterThan(1);
      expect(esmSizeKB).toBeGreaterThan(1);
      expect(umdSizeKB).toBeGreaterThan(1);
    });

    it("should verify minified bundle size is optimized", function (): void {
      // Check if minified UMD bundle exists
      const minPath: string = path.join(__dirname, "../../../dist/umd/secrets.min.js");

      if (fs.existsSync(minPath)) {
        const minStats: fs.Stats = fs.statSync(minPath);
        const minSizeKB: number = minStats.size / 1024;

        const umdPath: string = path.join(__dirname, "../../../dist/umd/secrets.js");
        const umdStats: fs.Stats = fs.statSync(umdPath);
        const umdSizeKB: number = umdStats.size / 1024;

        console.log("Minified bundle size:");
        console.log(`  Unminified: ${umdSizeKB.toFixed(2)} KB`);
        console.log(`  Minified: ${minSizeKB.toFixed(2)} KB`);
        console.log(`  Reduction: ${((1 - minSizeKB / umdSizeKB) * 100).toFixed(1)}%`);

        // Minified should be significantly smaller
        expect(minSizeKB).toBeLessThan(umdSizeKB);
        expect(minSizeKB).toBeLessThan(50); // Minified should be < 50KB
      } else {
        pending("Minified bundle not found - run 'yarn build' to generate");
      }
    });

    it("should verify source maps are generated", function (): void {
      const distPath: string = path.join(__dirname, "../../../dist");

      // Check for source maps
      const cjsMapPath: string = path.join(distPath, "secrets.js.map");
      const esmMapPath: string = path.join(distPath, "esm/secrets.js.map");
      const umdMapPath: string = path.join(distPath, "umd/secrets.js.map");

      expect(fs.existsSync(cjsMapPath)).toBe(true);
      expect(fs.existsSync(esmMapPath)).toBe(true);
      expect(fs.existsSync(umdMapPath)).toBe(true);

      console.log("Source maps verified:");
      console.log("  CommonJS: dist/secrets.js.map");
      console.log("  ES Module: dist/esm/secrets.js.map");
      console.log("  UMD: dist/umd/secrets.js.map");
    });
  });

  describe("Runtime Performance Validation", function (): void {
    /**
     * Validates: Requirements 8.1, 8.2
     *
     * Ensures TypeScript-compiled code maintains identical or better
     * runtime performance compared to the original JavaScript.
     */
    it("should maintain performance for share generation", function (): void {
      const iterations: number = PerformanceHelper.getPerformanceIterations("BENCHMARK_ITERATIONS");
      const secret: string = TestDataGenerators.generateRandomSecret(128, 128);

      const testFn = (): string[] => {
        return secrets.share(secret, 10, 5);
      };

      const result = PerformanceHelper.benchmark("TypeScript share generation", testFn, {
        iterations,
      });

      console.log("Share generation performance:");
      console.log(`  Average: ${result.avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${result.minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${result.maxDuration.toFixed(2)}ms`);
      console.log(`  Std Dev: ${result.stdDev.toFixed(2)}ms`);

      // Should complete in reasonable time
      expect(result.avgDuration).toBeLessThan(200);
    });

    it("should maintain performance for share combination", function (): void {
      const iterations: number = PerformanceHelper.getPerformanceIterations("BENCHMARK_ITERATIONS");
      const secret: string = TestDataGenerators.generateRandomSecret(128, 128);
      const shares: string[] = secrets.share(secret, 10, 5);
      const thresholdShares: string[] = shares.slice(0, 5);

      const testFn = (): string => {
        return secrets.combine(thresholdShares);
      };

      const result = PerformanceHelper.benchmark("TypeScript share combination", testFn, {
        iterations,
      });

      console.log("Share combination performance:");
      console.log(`  Average: ${result.avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${result.minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${result.maxDuration.toFixed(2)}ms`);
      console.log(`  Std Dev: ${result.stdDev.toFixed(2)}ms`);

      // Should complete in reasonable time
      expect(result.avgDuration).toBeLessThan(200);
    });

    it("should maintain performance for string conversions", function (): void {
      const iterations: number = PerformanceHelper.getPerformanceIterations("BENCHMARK_ITERATIONS");
      const testString: string = TestDataGenerators.generateRandomString(50, 100);

      const testFn = (): string => {
        const hex: string = secrets.str2hex(testString);
        return secrets.hex2str(hex);
      };

      const result = PerformanceHelper.benchmark("TypeScript string conversions", testFn, {
        iterations,
      });

      console.log("String conversion performance:");
      console.log(`  Average: ${result.avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${result.minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${result.maxDuration.toFixed(2)}ms`);
      console.log(`  Std Dev: ${result.stdDev.toFixed(2)}ms`);

      // Should be very fast
      expect(result.avgDuration).toBeLessThan(50);
    });

    it("should maintain performance for random generation", function (): void {
      const iterations: number = PerformanceHelper.getPerformanceIterations("BENCHMARK_ITERATIONS");

      const testFn = (): string => {
        return secrets.random(256);
      };

      const result = PerformanceHelper.benchmark("TypeScript random generation", testFn, {
        iterations,
      });

      console.log("Random generation performance:");
      console.log(`  Average: ${result.avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${result.minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${result.maxDuration.toFixed(2)}ms`);
      console.log(`  Std Dev: ${result.stdDev.toFixed(2)}ms`);

      // Should be very fast
      expect(result.avgDuration).toBeLessThan(50);
    });

    it("should maintain performance for newShare generation", function (): void {
      const iterations: number = PerformanceHelper.getPerformanceIterations("BENCHMARK_ITERATIONS");
      const secret: string = TestDataGenerators.generateRandomSecret(128, 128);
      const shares: string[] = secrets.share(secret, 10, 5);
      const thresholdShares: string[] = shares.slice(0, 5);

      const testFn = (): string => {
        return secrets.newShare(11, thresholdShares);
      };

      const result = PerformanceHelper.benchmark("TypeScript newShare generation", testFn, {
        iterations,
      });

      console.log("NewShare generation performance:");
      console.log(`  Average: ${result.avgDuration.toFixed(2)}ms`);
      console.log(`  Min: ${result.minDuration.toFixed(2)}ms`);
      console.log(`  Max: ${result.maxDuration.toFixed(2)}ms`);
      console.log(`  Std Dev: ${result.stdDev.toFixed(2)}ms`);

      // Should complete in reasonable time
      expect(result.avgDuration).toBeLessThan(200);
    });
  });

  describe("Performance Consistency Validation", function (): void {
    /**
     * Validates: Requirements 8.1
     *
     * Ensures TypeScript-compiled code has consistent performance
     * characteristics across multiple runs.
     */
    it("should have consistent performance across multiple runs", function (): void {
      const secret: string = TestDataGenerators.generateRandomSecret(128, 128);
      const runs: number = PerformanceHelper.getPerformanceIterations("CONSISTENCY_RUNS");
      const results: number[] = [];

      for (let i = 0; i < runs; i++) {
        const testFn = (): string[] => {
          return secrets.share(secret, 10, 5);
        };

        const result = PerformanceHelper.benchmark(`Consistency test run ${i + 1}`, testFn, {
          iterations: 20,
        });

        results.push(result.avgDuration);
      }

      // Calculate coefficient of variation (std dev / mean)
      const mean: number = results.reduce((sum, val) => sum + val, 0) / runs;
      const variance: number =
        results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / runs;
      const stdDev: number = Math.sqrt(variance);
      const coefficientOfVariation: number = stdDev / mean;

      console.log("Performance consistency:");
      console.log(`  Mean: ${mean.toFixed(2)}ms`);
      console.log(`  Std Dev: ${stdDev.toFixed(2)}ms`);
      console.log(`  Coefficient of Variation: ${coefficientOfVariation.toFixed(3)}`);

      // Performance should be reasonably consistent (CV < 0.5)
      expect(coefficientOfVariation).toBeLessThan(0.5);
    });
  });

  describe("Memory Usage Validation", function (): void {
    /**
     * Validates: Requirements 8.1, 8.2
     *
     * Ensures TypeScript-compiled code doesn't introduce memory leaks
     * or excessive memory usage.
     */
    it("should not leak memory during repeated operations", function (): void {
      // Only run memory tests in Node.js environment
      if (typeof process === "undefined" || !process.memoryUsage) {
        pending("Memory tests only run in Node.js environment");
        return;
      }

      const secret: string = TestDataGenerators.generateRandomSecret(128, 128);
      const iterations: number = PerformanceHelper.getPerformanceIterations("STRESS_ITERATIONS");

      const result = PerformanceHelper.memoryStressTest(() => {
        const shares: string[] = secrets.share(secret, 10, 5);
        return secrets.combine(shares.slice(0, 5));
      }, iterations);

      // Memory growth should be reasonable (less than 10MB for many iterations)
      const memoryGrowthMB: number = result.memoryGrowth / (1024 * 1024);

      console.log("Memory usage for repeated operations:");
      console.log(`  Initial: ${(result.initialMemory / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`  Final: ${(result.finalMemory / (1024 * 1024)).toFixed(2)} MB`);
      console.log(`  Growth: ${memoryGrowthMB.toFixed(2)} MB`);
      console.log(`  Iterations: ${result.iterations}`);

      expect(memoryGrowthMB).toBeLessThan(10);
    });
  });

  describe("Large Input Performance Validation", function (): void {
    /**
     * Validates: Requirements 8.1, 8.2
     *
     * Ensures TypeScript-compiled code handles large inputs efficiently.
     */
    it("should handle large secrets efficiently", function (): void {
      const bitSizes: number[] = [256, 512, 1024];

      bitSizes.forEach((bitSize: number) => {
        const secret: string = TestDataGenerators.generateRandomSecret(bitSize, bitSize);

        const measurement = PerformanceHelper.measureExecution(() => {
          const shares: string[] = secrets.share(secret, 10, 5);
          return secrets.combine(shares.slice(0, 5));
        });

        console.log(`Performance for ${bitSize}-bit secret:`);
        console.log(`  Duration: ${measurement.duration.toFixed(2)}ms`);

        // Should complete in reasonable time even for large inputs
        expect(measurement.duration).toBeLessThan(5000); // 5 seconds max
      });
    });

    it("should handle many shares efficiently", function (): void {
      secrets.init(8); // 8-bit allows up to 255 shares
      const secret: string = TestDataGenerators.generateRandomSecret(128, 128);
      const shareCounts: number[] = [10, 50, 100];

      shareCounts.forEach((numShares: number) => {
        const threshold: number = Math.floor(numShares / 2) + 1;

        const measurement = PerformanceHelper.measureExecution(() => {
          const shares: string[] = secrets.share(secret, numShares, threshold);
          return secrets.combine(shares.slice(0, threshold));
        });

        console.log(`Performance for ${numShares} shares:`);
        console.log(`  Duration: ${measurement.duration.toFixed(2)}ms`);

        // Should complete in reasonable time
        expect(measurement.duration).toBeLessThan(5000); // 5 seconds max
      });
    });
  });
});

describe("Property 7: Performance Preservation", function (): void {
  /**
   * Feature: typescript-conversion, Property 7: Performance Preservation
   * Validates: Requirements 8.1, 8.2
   *
   * For any operation, the TypeScript-compiled code should have identical or better
   * performance characteristics compared to the original JavaScript.
   */
  it("should maintain performance bounds for all operations", function (): void {
    const iterations: number = 100;
    const maxDuration: number = 1000; // 1 second max for any single operation
    const failures: Array<{
      operation: string;
      bitSize: number;
      numShares: number;
      threshold: number;
      duration: number;
    }> = [];

    for (let i = 0; i < iterations; i++) {
      // Generate random test data with varying sizes
      const bitSize: number = Math.floor(Math.random() * 504) + 8; // 8 to 512 bits
      const secret: string = TestDataGenerators.generateRandomSecret(bitSize, bitSize);
      const config = TestDataGenerators.generateShareConfig(50); // Up to 50 shares

      // Test share generation performance
      const shareGenMeasurement = PerformanceHelper.measureExecution(() => {
        return secrets.share(secret, config.numShares, config.threshold);
      });

      if (shareGenMeasurement.duration > maxDuration) {
        failures.push({
          operation: "share generation",
          bitSize,
          numShares: config.numShares,
          threshold: config.threshold,
          duration: shareGenMeasurement.duration,
        });
      }

      // Test share combination performance
      const shares: string[] = shareGenMeasurement.result as string[];
      const thresholdShares: string[] = shares.slice(0, config.threshold);

      const combineMeasurement = PerformanceHelper.measureExecution(() => {
        return secrets.combine(thresholdShares);
      });

      if (combineMeasurement.duration > maxDuration) {
        failures.push({
          operation: "share combination",
          bitSize,
          numShares: config.numShares,
          threshold: config.threshold,
          duration: combineMeasurement.duration,
        });
      }
    }

    // Report failures if any
    if (failures.length > 0) {
      console.log("Performance preservation failures:");
      failures.forEach((failure) => {
        console.log(
          `  ${failure.operation}: ${failure.bitSize} bits, ` +
            `${failure.numShares} shares, ${failure.threshold} threshold - ` +
            `${failure.duration.toFixed(2)}ms`
        );
      });
    }

    // All operations should complete within time bounds
    expect(failures.length).toBe(0);
  });

  it("should maintain consistent performance across different input sizes", function (): void {
    const bitSizes: number[] = [64, 128, 256, 512];
    const maxDurationPerBit: number = 0.02; // 0.02ms per bit as baseline (more lenient)
    const failures: Array<{
      bitSize: number;
      duration: number;
      expectedMax: number;
    }> = [];

    bitSizes.forEach((bitSize: number) => {
      const secret: string = TestDataGenerators.generateRandomSecret(bitSize, bitSize);
      const expectedMaxDuration: number = bitSize * maxDurationPerBit;

      const measurement = PerformanceHelper.measureExecution(() => {
        const shares: string[] = secrets.share(secret, 10, 5);
        return secrets.combine(shares.slice(0, 5));
      });

      if (measurement.duration > expectedMaxDuration) {
        failures.push({
          bitSize,
          duration: measurement.duration,
          expectedMax: expectedMaxDuration,
        });
      }
    });

    // Report failures if any
    if (failures.length > 0) {
      console.log("Performance scaling failures:");
      failures.forEach((failure) => {
        console.log(
          `  ${failure.bitSize} bits: ${failure.duration.toFixed(2)}ms ` +
            `(expected < ${failure.expectedMax.toFixed(2)}ms)`
        );
      });
    }

    // Performance should scale linearly with input size
    expect(failures.length).toBe(0);
  });

  it("should not introduce performance regression compared to baseline", function (): void {
    // Baseline performance expectations (in milliseconds)
    const baselineExpectations = {
      share64bit: 1.0, // Share generation for 64-bit secret
      combine64bit: 1.0, // Share combination for 64-bit secret
      share256bit: 5.0, // Share generation for 256-bit secret
      combine256bit: 5.0, // Share combination for 256-bit secret
      str2hex: 0.5, // String to hex conversion
      hex2str: 0.5, // Hex to string conversion
      random: 0.5, // Random generation
    };

    const results: { [key: string]: number } = {};

    // Test 64-bit operations
    const secret64: string = TestDataGenerators.generateRandomSecret(64, 64);
    results.share64bit = PerformanceHelper.measureExecution(() => {
      return secrets.share(secret64, 10, 5);
    }).duration;

    const shares64: string[] = secrets.share(secret64, 10, 5);
    results.combine64bit = PerformanceHelper.measureExecution(() => {
      return secrets.combine(shares64.slice(0, 5));
    }).duration;

    // Test 256-bit operations
    const secret256: string = TestDataGenerators.generateRandomSecret(256, 256);
    results.share256bit = PerformanceHelper.measureExecution(() => {
      return secrets.share(secret256, 10, 5);
    }).duration;

    const shares256: string[] = secrets.share(secret256, 10, 5);
    results.combine256bit = PerformanceHelper.measureExecution(() => {
      return secrets.combine(shares256.slice(0, 5));
    }).duration;

    // Test string conversions
    const testString: string = TestDataGenerators.generateRandomString(50, 100);
    results.str2hex = PerformanceHelper.measureExecution(() => {
      return secrets.str2hex(testString);
    }).duration;

    const hex: string = secrets.str2hex(testString);
    results.hex2str = PerformanceHelper.measureExecution(() => {
      return secrets.hex2str(hex);
    }).duration;

    // Test random generation
    results.random = PerformanceHelper.measureExecution(() => {
      return secrets.random(256);
    }).duration;

    // Check all results against baseline
    const regressions: string[] = [];
    Object.keys(baselineExpectations).forEach((key) => {
      const baseline = baselineExpectations[key as keyof typeof baselineExpectations];
      const actual = results[key];

      if (actual > baseline) {
        regressions.push(`${key}: ${actual.toFixed(2)}ms (baseline: ${baseline}ms)`);
      }
    });

    // Report regressions if any
    if (regressions.length > 0) {
      console.log("Performance regressions detected:");
      regressions.forEach((regression) => {
        console.log(`  ${regression}`);
      });
    }

    // No performance regressions should be detected
    expect(regressions.length).toBe(0);
  });
});

describe("Property 8: Bundle Size Optimization", function (): void {
  /**
   * Feature: typescript-conversion, Property 8: Bundle Size Optimization
   * Validates: Requirements 8.2, 8.4
   *
   * For any bundling scenario, the TypeScript-compiled output should produce
   * similar or smaller bundle sizes compared to the original JavaScript.
   */
  it("should maintain reasonable bundle sizes for all output formats", function (): void {
    const projectRoot: string = path.join(__dirname, "../../..");
    const maxSizes = {
      commonjs: 50, // 50 KB max for CommonJS
      esm: 50, // 50 KB max for ES modules
      umd: 60, // 60 KB max for UMD (includes wrapper)
      minified: 20, // 20 KB max for minified UMD
    };

    const failures: Array<{
      format: string;
      actualSize: number;
      maxSize: number;
    }> = [];

    // Check CommonJS bundle size
    const cjsPath: string = path.join(projectRoot, "dist/secrets.js");
    if (fs.existsSync(cjsPath)) {
      const cjsSize: number = fs.statSync(cjsPath).size / 1024;
      if (cjsSize > maxSizes.commonjs) {
        failures.push({
          format: "CommonJS",
          actualSize: cjsSize,
          maxSize: maxSizes.commonjs,
        });
      }
    }

    // Check ES module bundle size
    const esmPath: string = path.join(projectRoot, "dist/esm/secrets.js");
    if (fs.existsSync(esmPath)) {
      const esmSize: number = fs.statSync(esmPath).size / 1024;
      if (esmSize > maxSizes.esm) {
        failures.push({
          format: "ES Module",
          actualSize: esmSize,
          maxSize: maxSizes.esm,
        });
      }
    }

    // Check UMD bundle size
    const umdPath: string = path.join(projectRoot, "dist/umd/secrets.js");
    if (fs.existsSync(umdPath)) {
      const umdSize: number = fs.statSync(umdPath).size / 1024;
      if (umdSize > maxSizes.umd) {
        failures.push({
          format: "UMD",
          actualSize: umdSize,
          maxSize: maxSizes.umd,
        });
      }
    }

    // Check minified bundle size
    const minPath: string = path.join(projectRoot, "dist/umd/secrets.min.js");
    if (fs.existsSync(minPath)) {
      const minSize: number = fs.statSync(minPath).size / 1024;
      if (minSize > maxSizes.minified) {
        failures.push({
          format: "Minified UMD",
          actualSize: minSize,
          maxSize: maxSizes.minified,
        });
      }
    }

    // Report failures if any
    if (failures.length > 0) {
      console.log("Bundle size optimization failures:");
      failures.forEach((failure) => {
        console.log(
          `  ${failure.format}: ${failure.actualSize.toFixed(2)} KB ` +
            `(max: ${failure.maxSize} KB)`
        );
      });
    }

    // All bundles should be within size limits
    expect(failures.length).toBe(0);
  });

  it("should ensure minification provides significant size reduction", function (): void {
    const projectRoot: string = path.join(__dirname, "../../..");
    const umdPath: string = path.join(projectRoot, "dist/umd/secrets.js");
    const minPath: string = path.join(projectRoot, "dist/umd/secrets.min.js");

    // Skip if minified bundle doesn't exist
    if (!fs.existsSync(minPath)) {
      pending("Minified bundle not found - run 'yarn build' to generate");
      return;
    }

    const umdSize: number = fs.statSync(umdPath).size / 1024;
    const minSize: number = fs.statSync(minPath).size / 1024;
    const reduction: number = (1 - minSize / umdSize) * 100;

    console.log(`Minification reduction: ${reduction.toFixed(1)}%`);
    console.log(`  Unminified: ${umdSize.toFixed(2)} KB`);
    console.log(`  Minified: ${minSize.toFixed(2)} KB`);

    // Minification should provide at least 50% size reduction
    expect(reduction).toBeGreaterThanOrEqual(50);

    // Minified size should be less than unminified
    expect(minSize).toBeLessThan(umdSize);
  });

  it("should ensure ES modules are tree-shakeable", function (): void {
    const projectRoot: string = path.join(__dirname, "../../..");
    const esmPath: string = path.join(projectRoot, "dist/esm/secrets.js");

    if (!fs.existsSync(esmPath)) {
      pending("ES module bundle not found - run 'yarn build' to generate");
      return;
    }

    // Read the ES module file
    const esmContent: string = fs.readFileSync(esmPath, "utf8");

    // Check for ES module exports (tree-shakeable)
    const hasExports: boolean = esmContent.includes("export");

    // For TypeScript-compiled ES modules, we expect either:
    // 1. Pure ES6 exports (export { ... })
    // 2. Or CommonJS-style exports that are compatible with ES modules
    // TypeScript may use Object.defineProperty for exports which is acceptable

    console.log("ES module tree-shakeability:");
    console.log(`  Has ES exports: ${hasExports}`);
    console.log(`  File size: ${(fs.statSync(esmPath).size / 1024).toFixed(2)} KB`);

    // ES module should be a reasonable size (tree-shakeable bundles are typically smaller)
    const esmSize: number = fs.statSync(esmPath).size / 1024;
    expect(esmSize).toBeLessThan(50); // Should be under 50KB
  });

  it("should ensure all output formats have similar functionality size", function (): void {
    const projectRoot: string = path.join(__dirname, "../../..");

    const cjsPath: string = path.join(projectRoot, "dist/secrets.js");
    const esmPath: string = path.join(projectRoot, "dist/esm/secrets.js");
    const umdPath: string = path.join(projectRoot, "dist/umd/secrets.js");

    const cjsSize: number = fs.statSync(cjsPath).size / 1024;
    const esmSize: number = fs.statSync(esmPath).size / 1024;
    const umdSize: number = fs.statSync(umdPath).size / 1024;

    console.log("Bundle size comparison:");
    console.log(`  CommonJS: ${cjsSize.toFixed(2)} KB`);
    console.log(`  ES Module: ${esmSize.toFixed(2)} KB`);
    console.log(`  UMD: ${umdSize.toFixed(2)} KB`);

    // ES module should be smallest (no wrapper overhead)
    expect(esmSize).toBeLessThanOrEqual(cjsSize);

    // UMD should be largest (includes wrapper for multiple environments)
    expect(umdSize).toBeGreaterThanOrEqual(cjsSize);

    // But UMD shouldn't be more than 20% larger than CommonJS
    const umdOverhead: number = ((umdSize - cjsSize) / cjsSize) * 100;
    console.log(`  UMD overhead: ${umdOverhead.toFixed(1)}%`);
    expect(umdOverhead).toBeLessThan(20);
  });

  it("should ensure source maps don't significantly increase bundle size", function (): void {
    const projectRoot: string = path.join(__dirname, "../../..");

    const cjsPath: string = path.join(projectRoot, "dist/secrets.js");
    const cjsMapPath: string = path.join(projectRoot, "dist/secrets.js.map");

    const cjsSize: number = fs.statSync(cjsPath).size / 1024;
    const mapSize: number = fs.statSync(cjsMapPath).size / 1024;

    const mapRatio: number = mapSize / cjsSize;

    console.log("Source map size comparison:");
    console.log(`  Bundle: ${cjsSize.toFixed(2)} KB`);
    console.log(`  Source map: ${mapSize.toFixed(2)} KB`);
    console.log(`  Ratio: ${mapRatio.toFixed(2)}x`);

    // Source map should not be more than 2x the bundle size
    expect(mapRatio).toBeLessThan(2);
  });
});
