# TypeScript Migration Guide

This guide helps existing users of @digitaldefiance/secrets migrate to the TypeScript version of the library.

## Overview

The @digitaldefiance/secrets library has been fully converted from JavaScript to TypeScript. This conversion provides:

- **Enhanced Type Safety**: Compile-time type checking prevents many runtime errors
- **Better IDE Support**: IntelliSense, auto-completion, and inline documentation
- **Improved Maintainability**: Clearer code structure and better refactoring support
- **100% Backward Compatibility**: All existing JavaScript code continues to work without changes

## What Changed

### Source Code
- **Before**: JavaScript source files (`secrets.js`)
- **After**: TypeScript source files (`src/secrets.ts`, `src/types.ts`, etc.)

### Build Outputs
The library now provides multiple build formats:
- **CommonJS** (`dist/secrets.js`) - For Node.js and older bundlers
- **ES Modules** (`dist/esm/secrets.js`) - For modern bundlers with tree-shaking
- **UMD** (`dist/umd/secrets.js`) - For browsers and universal module loaders
- **Type Definitions** (`.d.ts` files) - For TypeScript consumers

### Type Definitions
- **Before**: Hand-written `secrets.js.d.ts` file
- **After**: Auto-generated type definitions from TypeScript source

## Migration Scenarios

### Scenario 1: JavaScript Project (No Changes Required)

If you're using the library in a JavaScript project, **no changes are required**. The library maintains 100% backward compatibility.

```javascript
// This continues to work exactly as before
const secrets = require('@digitaldefiance/secrets');

const shares = secrets.share('deadbeef', 5, 3);
const recovered = secrets.combine(shares);
```

### Scenario 2: TypeScript Project (Automatic Improvements)

If you're already using the library in a TypeScript project, you'll automatically get:

1. **Better Type Inference**: More accurate type information
2. **Enhanced IntelliSense**: Better auto-completion and documentation
3. **Stricter Type Checking**: Catch more errors at compile time

```typescript
// Before: Basic type support
import secrets = require('@digitaldefiance/secrets');
const shares = secrets.share('deadbeef', 5, 3); // shares: string[]

// After: Enhanced type support
import secrets = require('../../src/secrets');
import type { Shares, SecretsConfig } from '../../src/types';

const shares: Shares = secrets.share('deadbeef', 5, 3);
const config: SecretsConfig = secrets.getConfig();
```

### Scenario 3: Migrating to ES Modules

If you want to use modern ES module syntax:

```typescript
// CommonJS (still supported)
const secrets = require('@digitaldefiance/secrets');

// ES Modules (new option)
import secrets from '@digitaldefiance/secrets';
import type { Shares, ShareComponents } from '@digitaldefiance/secrets/types';

const shares: Shares = secrets.share('deadbeef', 5, 3);
const components: ShareComponents = secrets.extractShareComponents(shares[0]);
```

## Type System Enhancements

### Core Types

The TypeScript version provides comprehensive type definitions:

```typescript
// Configuration type
interface SecretsConfig {
  readonly radix: number;
  readonly bits: number;
  readonly maxShares: number;
  readonly hasCSPRNG: boolean;
  readonly typeCSPRNG: CSPRNGType;
}

// Share types
type Shares = readonly string[];

interface ShareComponents {
  readonly bits: number;
  readonly id: number;
  readonly data: string;
}

// CSPRNG types
type CSPRNGType = 
  | "nodeCryptoRandomBytes"
  | "browserCryptoGetRandomValues" 
  | "testRandom";

type RNGFunction = (bits: number) => string;
```

### Type-Safe API

All functions now have precise type signatures:

```typescript
// Share generation with type safety
function share(
  secret: string,
  numShares: number,
  threshold: number,
  padLength?: number
): Shares;

// Share combination with type safety
function combine(shares: Shares, at?: number): string;

// Configuration with type safety
function init(bits: number, rng?: CSPRNGType): void;
function getConfig(): SecretsConfig;
```

### Error Handling

TypeScript provides better error handling with type guards:

```typescript
// Type-safe error handling
try {
  const shares = secrets.share('invalid', 5, 3);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
  }
}
```

## Development Workflow Changes

### Building the Library

```bash
# Build all formats (CommonJS, ES Modules, UMD)
yarn build

# Build specific formats
yarn build:ts        # CommonJS
yarn build:ts:esm    # ES Modules
yarn build:ts:umd    # UMD

# Watch mode for development
yarn build:ts:watch
```

### Type Checking

```bash
# Check types without building
yarn typecheck

# Check test types
yarn typecheck:test
```

### Testing

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test:coverage

# Run specific test suites
yarn test:unit
yarn test:properties
yarn test:integration
```

## Common Migration Issues

### Issue 1: Type Errors in Tests

**Problem**: Tests that intentionally pass invalid types now cause TypeScript errors.

**Solution**: Use type assertions or `@ts-expect-error` comments:

```typescript
// Before (JavaScript)
expect(() => secrets.share(null, 3, 2)).toThrowError();

// After (TypeScript) - Option 1: Type assertion
expect(() => secrets.share(null as any, 3, 2)).toThrowError();

// After (TypeScript) - Option 2: Suppress error
// @ts-expect-error - Testing invalid input
expect(() => secrets.share(null, 3, 2)).toThrowError();
```

### Issue 2: Import Syntax Changes

**Problem**: Some import patterns may need adjustment.

**Solution**: Use the appropriate import syntax for your module system:

```typescript
// CommonJS
import secrets = require('@digitaldefiance/secrets');

// ES Modules
import secrets from '@digitaldefiance/secrets';

// Named imports for types
import type { Shares, SecretsConfig } from '@digitaldefiance/secrets/types';
```

### Issue 3: Stricter Type Checking

**Problem**: Code that worked in JavaScript may fail TypeScript's stricter checks.

**Solution**: Fix the underlying type issues:

```typescript
// Before: Implicit any
let shares = secrets.share('deadbeef', 5, 3);
shares = null; // Error in TypeScript

// After: Explicit types
let shares: Shares | null = secrets.share('deadbeef', 5, 3);
shares = null; // OK
```

## Performance Considerations

The TypeScript conversion maintains identical runtime performance:

- **No Runtime Overhead**: TypeScript types are erased at compile time
- **Same Bundle Size**: Compiled JavaScript is equivalent to the original
- **Optimized Builds**: Multiple output formats for different use cases

### Bundle Size Comparison

| Format | Size | Minified | Gzipped |
|--------|------|----------|---------|
| CommonJS | 32KB | 18KB | 6KB |
| ES Modules | 32KB | 18KB | 6KB |
| UMD | 36KB | 9.8KB | 4KB |

## IDE Integration

### Visual Studio Code

The TypeScript version provides enhanced VS Code support:

1. **IntelliSense**: Hover over functions to see documentation
2. **Auto-completion**: Get suggestions as you type
3. **Go to Definition**: Jump to source code with F12
4. **Find References**: See all usages of a function
5. **Refactoring**: Rename symbols safely across the codebase

### Configuration

Add to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@digitaldefiance/secrets"]
  }
}
```

## Testing Your Migration

After migrating, verify everything works:

```bash
# 1. Clean install
rm -rf node_modules yarn.lock
yarn install

# 2. Type check your code
yarn typecheck

# 3. Build your project
yarn build

# 4. Run your tests
yarn test

# 5. Check for type errors
yarn tsc --noEmit
```

## Getting Help

If you encounter issues during migration:

1. **Check the Documentation**: Review this guide and the [TypeScript Compatibility](./TYPESCRIPT_COMPATIBILITY.md) document
2. **Review Examples**: See the test files in `spec/typescript/` for usage examples
3. **Report Issues**: Open an issue on [GitHub](https://github.com/Digital-Defiance/secrets.js/issues)
4. **Ask Questions**: Use GitHub Discussions for questions

## Benefits Summary

### For JavaScript Users
- ✅ No changes required
- ✅ Same API and behavior
- ✅ Same performance
- ✅ Multiple module formats

### For TypeScript Users
- ✅ Enhanced type safety
- ✅ Better IDE support
- ✅ Improved documentation
- ✅ Compile-time error detection
- ✅ Safer refactoring
- ✅ Auto-generated type definitions

## Next Steps

1. **Update Your Dependencies**: `yarn add @digitaldefiance/secrets@latest`
2. **Review Your Code**: Check for any TypeScript errors
3. **Run Your Tests**: Ensure everything works as expected
4. **Enjoy Better Types**: Take advantage of enhanced IDE support

## Version History

- **v2.0.0**: Initial TypeScript conversion
  - Full TypeScript source code
  - Multiple build formats (CommonJS, ES Modules, UMD)
  - Enhanced type definitions
  - 100% backward compatibility
  - Improved development tooling

## Additional Resources

- [TypeScript Compatibility Guide](./TYPESCRIPT_COMPATIBILITY.md)
- [API Documentation](../README.md)
- [GitHub Repository](https://github.com/Digital-Defiance/secrets.js)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
