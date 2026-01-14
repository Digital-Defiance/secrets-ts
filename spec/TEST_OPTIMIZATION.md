# Test Execution Performance Optimization

This document describes the test execution performance optimizations implemented for the @digitaldefiance/secrets library.

## Overview

The test suite has been optimized to support different execution modes based on the development context:
- **Fast Mode**: Quick feedback during development (minimal iterations)
- **Standard Mode**: Regular testing with balanced coverage (default)
- **CI Mode**: Continuous integration with thorough testing
- **Comprehensive Mode**: Maximum thoroughness for release validation

## Environment-Based Configuration

### Setting Test Mode

Test mode is controlled via the `TEST_MODE` environment variable:

```bash
# Fast mode (development)
TEST_MODE=fast npm test

# CI mode (continuous integration)
TEST_MODE=ci npm test

# Comprehensive mode (release validation)
TEST_MODE=comprehensive npm test

# Standard mode (default, no env var needed)
npm test
```

### Iteration Count Configuration

Different test types use different iteration counts based on the mode:

| Test Type | Fast | Standard | CI | Comprehensive |
|-----------|------|----------|-----|---------------|
| Property Tests | 10 | 100 | 500 | 1000 |
| Cryptographic Tests | 50 | 500 | 1000 | 2000 |
| Performance Benchmarks | 5 | 20 | 50 | 100 |
| Stress Tests | 2 | 5 | 10 | 20 |

## NPM Scripts

### Fast Mode Scripts

Quick execution for development feedback:

```bash
# Run all tests in fast mode
npm run test:fast

# Run specific test suites in fast mode
npm run test:fast:properties
npm run test:fast:performance
npm run test:fast:all

# Run with coverage in fast mode
npm run test:fast:coverage
```

### CI Mode Scripts

Optimized for continuous integration:

```bash
# Full CI test suite with coverage
npm run test:ci

# Fast CI test suite (no performance tests)
npm run test:ci:fast

# Parallel test execution (faster CI)
npm run test:ci:parallel
```

### Mode-Specific Scripts

Run specific test suites in different modes:

```bash
# Property tests
npm run test:properties              # Standard mode
npm run test:properties:fast         # Fast mode
npm run test:properties:ci           # CI mode
npm run test:properties:comprehensive # Comprehensive mode

# Performance tests
npm run test:performance:fast        # Fast mode
npm run test:performance:ci          # CI mode

# Security tests
npm run test:security:fast           # Fast mode

# Integration tests
npm run test:integration:fast        # Fast mode

# Cross-platform tests
npm run test:cross-platform:fast     # Fast mode

# Unit tests
npm run test:unit:fast               # Fast mode
```

## Parallel Test Execution

For faster CI execution, tests can be run in parallel:

```bash
npm run test:ci:parallel
```

This runs unit, property, and integration tests concurrently, significantly reducing total execution time.

## Timeout Configuration

Tests are configured with appropriate timeouts based on their type:

- **Unit tests**: 5 seconds (default Jasmine timeout)
- **Property tests**: 30 seconds (allows for high iteration counts)
- **Performance tests**: 60 seconds (allows for benchmarking)
- **Stress tests**: 120 seconds (allows for memory stress testing)

Timeouts are automatically adjusted based on the test mode.

## Usage Recommendations

### During Development

Use fast mode for quick feedback:

```bash
# Quick test run during development
npm run test:fast

# Quick property test validation
npm run test:fast:properties
```

### Before Committing

Run standard mode tests:

```bash
# Standard test suite
npm test

# With coverage
npm run test:coverage
```

### In CI/CD Pipeline

Use CI mode for thorough validation:

```bash
# Full CI test suite
npm run test:ci

# Or use parallel execution for speed
npm run test:ci:parallel
```

### Before Release

Run comprehensive mode for maximum confidence:

```bash
# Set comprehensive mode
TEST_MODE=comprehensive npm run test:comprehensive:coverage
```

## Performance Comparison

Approximate execution times (on typical development machine):

| Mode | Property Tests | Performance Tests | Total Suite |
|------|---------------|-------------------|-------------|
| Fast | ~5 seconds | ~10 seconds | ~30 seconds |
| Standard | ~30 seconds | ~45 seconds | ~2 minutes |
| CI | ~2 minutes | ~3 minutes | ~8 minutes |
| Comprehensive | ~5 minutes | ~6 minutes | ~15 minutes |

## Implementation Details

### PropertyTestHelper

The `PropertyTestHelper` module automatically adjusts iteration counts based on the test mode:

```javascript
// Automatically uses environment-based iteration count
propertyTest("My property", property, {
    testType: "CRYPTOGRAPHIC_TEST",
    generators: generators
})

// Or override with explicit count
propertyTest("My property", property, {
    iterations: 100,  // Explicit override
    generators: generators
})
```

### PerformanceHelper

The `PerformanceHelper` module adjusts benchmark iterations:

```javascript
// Automatically uses environment-based iteration count
benchmark("My operation", testFn)

// Or override with explicit count
benchmark("My operation", testFn, {
    iterations: 50  // Explicit override
})
```

## Troubleshooting

### Tests Timing Out

If tests timeout in CI mode:

1. Check if the timeout is appropriate for the test type
2. Consider using fast mode for development
3. Verify the test isn't hanging on an infinite loop

### Inconsistent Results

If property tests show inconsistent results:

1. Increase iteration count for more confidence
2. Use CI or comprehensive mode for validation
3. Check for non-deterministic behavior in the code

### Slow CI Builds

If CI builds are too slow:

1. Use `npm run test:ci:parallel` for parallel execution
2. Consider splitting test suites across multiple CI jobs
3. Use `npm run test:ci:fast` to skip performance tests

## Future Enhancements

Potential future optimizations:

- [ ] Test result caching based on code changes
- [ ] Smarter parallel test execution
- [ ] Adaptive iteration counts based on test stability
- [ ] Test prioritization based on failure history
- [ ] Distributed test execution for large suites
