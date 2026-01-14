# TypeScript Version Compatibility

This document describes the TypeScript version compatibility testing and requirements for the @digitaldefiance/secrets library.

## Supported TypeScript Versions

The library is designed to work with TypeScript 4.0 and above. We actively test against the following versions:

### Minimum Version
- **TypeScript 4.0.0** - Minimum supported version

### Tested Versions
The library is continuously tested against:
- TypeScript 4.0.x
- TypeScript 4.1.x
- TypeScript 4.2.x
- TypeScript 4.3.x
- TypeScript 4.4.x
- TypeScript 4.5.x
- TypeScript 4.6.x
- TypeScript 4.7.x
- TypeScript 4.8.x
- TypeScript 4.9.x
- TypeScript 5.0.x
- TypeScript 5.1.x
- TypeScript 5.2.x
- TypeScript 5.3.x
- TypeScript 5.4.x
- TypeScript 5.5.x
- TypeScript 5.6.x
- TypeScript 5.7.x
- TypeScript 5.8.x
- TypeScript 5.9.x
- TypeScript latest
- TypeScript next (pre-release)

## Continuous Integration

### GitHub Actions Workflows

#### Main CI Pipeline (`.github/workflows/ci.yml`)
The main CI pipeline runs on every push and pull request to main branches. It includes:
- TypeScript type checking for source and test code
- Multi-format builds (CommonJS, ES Modules, UMD)
- Comprehensive test suite
- Linting and formatting checks
- Multi-Node.js version testing (16, 18, 20, 22)
- Multi-OS testing (Ubuntu, Windows, macOS)

#### TypeScript Compatibility Testing (`.github/workflows/typescript-compatibility.yml`)
A dedicated workflow tests compatibility across all supported TypeScript versions:
- Runs on push, pull request, and weekly schedule
- Tests against 20+ TypeScript versions
- Allows failures for pre-release versions (next)
- Provides detailed compatibility reports

## Local Testing

### Testing All TypeScript Versions

To test compatibility with multiple TypeScript versions locally:

```bash
yarn ci:typescript-versions
```

This script will:
1. Test against TypeScript 4.0, 4.5, 4.9, 5.0, 5.5, 5.9, latest, and next
2. Run type checking, builds, and tests for each version
3. Restore your original package.json and dependencies
4. Report compatibility status

### Testing a Specific TypeScript Version

To manually test with a specific TypeScript version:

```bash
# Install specific version
yarn add -D typescript@~4.5

# Run type checking
yarn typecheck
yarn typecheck:test

# Build all formats
yarn build

# Run tests
yarn test:fast

# Restore original version
yarn install --frozen-lockfile
```

## Type Checking Scripts

### Source Code Type Checking
```bash
yarn typecheck
```
Checks TypeScript types in the source code without emitting files.

### Test Code Type Checking
```bash
yarn typecheck:test
```
Checks TypeScript types in the test code.

### CI Type Checking
```bash
yarn ci:typecheck
```
Comprehensive type checking script for CI environments with detailed reporting.

## Build Validation

### CI Build Validation
```bash
yarn ci:build
```
Validates that all build outputs are generated correctly:
- CommonJS build and type definitions
- ES Modules build and type definitions
- UMD build and type definitions
- Minified UMD build
- Source maps for all formats

## Peer Dependencies

The library specifies TypeScript as an optional peer dependency:

```json
{
  "peerDependencies": {
    "typescript": ">=4.0.0"
  },
  "peerDependenciesMeta": {
    "typescript": {
      "optional": true
    }
  }
}
```

This means:
- TypeScript 4.0.0 or higher is required for TypeScript consumers
- The library can still be used in JavaScript projects without TypeScript
- Consumers can use any TypeScript version >= 4.0.0

## Compatibility Guarantees

### What We Guarantee
- The library compiles without errors on TypeScript 4.0+
- All type definitions are accurate and comprehensive
- Generated JavaScript is functionally equivalent across versions
- API signatures remain consistent

### What We Don't Guarantee
- Compatibility with pre-release TypeScript versions (next)
- Compatibility with TypeScript versions below 4.0
- Specific compiler output format (may vary between versions)

## Troubleshooting

### Type Errors with Older TypeScript Versions

If you encounter type errors with older TypeScript versions:

1. Ensure you're using TypeScript 4.0 or higher:
   ```bash
   yarn tsc --version
   ```

2. Update TypeScript to the latest version:
   ```bash
   yarn add -D typescript@latest
   ```

3. Check for conflicting type definitions:
   ```bash
   yarn list @types/node
   ```

### Build Failures

If builds fail with specific TypeScript versions:

1. Clean the build output:
   ```bash
   rm -rf dist dist-test
   ```

2. Reinstall dependencies:
   ```bash
   yarn install --frozen-lockfile
   ```

3. Try building again:
   ```bash
   yarn build
   ```

## Contributing

When contributing to the library:

1. Ensure your changes work with TypeScript 4.0+
2. Run the full compatibility test suite:
   ```bash
   yarn ci:typescript-versions
   ```
3. Fix any compatibility issues before submitting a PR
4. Update this document if you change compatibility requirements

## Reporting Issues

If you encounter TypeScript compatibility issues:

1. Check the [GitHub Actions](https://github.com/Digital-Defiance/secrets.js/actions) for recent test results
2. Verify your TypeScript version: `yarn tsc --version`
3. Try the latest TypeScript version
4. Report the issue with:
   - Your TypeScript version
   - Node.js version
   - Operating system
   - Complete error message
   - Minimal reproduction steps

## Future Compatibility

We aim to maintain compatibility with:
- All TypeScript 4.x versions (4.0+)
- All TypeScript 5.x versions
- Future TypeScript versions (best effort)

Breaking changes to TypeScript compatibility will be:
- Announced in release notes
- Documented in this file
- Reflected in peer dependency requirements
- Accompanied by migration guides
