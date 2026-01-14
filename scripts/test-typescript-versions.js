#!/usr/bin/env node

/**
 * TypeScript Version Compatibility Testing Script
 * 
 * This script tests the library against multiple TypeScript versions
 * to ensure compatibility across the supported version range.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, description, allowFailure = false) {
  log(`\n${description}...`, colors.cyan);
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    log(`✓ ${description} passed`, colors.green);
    return { success: true, output };
  } catch (error) {
    if (allowFailure) {
      log(`⚠ ${description} failed (allowed)`, colors.yellow);
      return { success: false, error: error.message, allowed: true };
    }
    log(`✗ ${description} failed`, colors.red);
    if (error.stdout) {
      console.log(error.stdout);
    }
    if (error.stderr) {
      console.error(error.stderr);
    }
    return { success: false, error: error.message };
  }
}

function getInstalledTypeScriptVersion() {
  try {
    const output = execSync('yarn tsc --version', { encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    return 'unknown';
  }
}

function testTypeScriptVersion(version, allowFailure = false) {
  log('\n' + '='.repeat(60), colors.blue);
  log(`Testing TypeScript ${version}`, colors.blue);
  log('='.repeat(60), colors.blue);

  const results = [];

  // Install specific TypeScript version
  let installCommand;
  if (version === 'latest') {
    installCommand = 'yarn add -D typescript@latest';
  } else if (version === 'next') {
    installCommand = 'yarn add -D typescript@next';
  } else {
    installCommand = `yarn add -D typescript@~${version}`;
  }

  results.push(execCommand(
    installCommand,
    `Installing TypeScript ${version}`,
    false
  ));

  if (!results[results.length - 1].success) {
    return { version, results, success: false };
  }

  // Display installed version
  const installedVersion = getInstalledTypeScriptVersion();
  log(`\nInstalled version: ${installedVersion}`, colors.magenta);

  // Type check source code
  results.push(execCommand(
    'yarn typecheck',
    'Type checking source code',
    allowFailure
  ));

  // Type check test code
  results.push(execCommand(
    'yarn typecheck:test',
    'Type checking test code',
    allowFailure
  ));

  // Build all formats
  results.push(execCommand(
    'yarn build',
    'Building all formats',
    allowFailure
  ));

  // Run tests
  results.push(execCommand(
    'yarn test:fast',
    'Running tests',
    allowFailure
  ));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.allowed).length;
  const allowed = results.filter(r => !r.success && r.allowed).length;

  log('\n' + '-'.repeat(60), colors.cyan);
  log(`TypeScript ${version} Summary`, colors.cyan);
  log(`Passed: ${passed}`, colors.green);
  if (failed > 0) {
    log(`Failed: ${failed}`, colors.red);
  }
  if (allowed > 0) {
    log(`Failed (allowed): ${allowed}`, colors.yellow);
  }

  return {
    version,
    results,
    success: failed === 0,
    installedVersion
  };
}

function main() {
  log('='.repeat(60), colors.blue);
  log('TypeScript Version Compatibility Testing', colors.blue);
  log('='.repeat(60), colors.blue);

  // Save original package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const originalPackageJson = fs.readFileSync(packageJsonPath, 'utf8');

  // Define versions to test
  const versionsToTest = [
    { version: '4.0', allowFailure: false },
    { version: '4.5', allowFailure: false },
    { version: '4.9', allowFailure: false },
    { version: '5.0', allowFailure: false },
    { version: '5.5', allowFailure: false },
    { version: '5.9', allowFailure: false },
    { version: 'latest', allowFailure: false },
    { version: 'next', allowFailure: true }, // Allow failures for next version
  ];

  const testResults = [];

  try {
    for (const { version, allowFailure } of versionsToTest) {
      const result = testTypeScriptVersion(version, allowFailure);
      testResults.push(result);
    }
  } finally {
    // Restore original package.json
    log('\n' + '='.repeat(60), colors.blue);
    log('Restoring original package.json...', colors.cyan);
    fs.writeFileSync(packageJsonPath, originalPackageJson);
    
    // Reinstall original dependencies
    execCommand('yarn install --frozen-lockfile', 'Reinstalling original dependencies', false);
  }

  // Final summary
  log('\n' + '='.repeat(60), colors.blue);
  log('Final Compatibility Summary', colors.blue);
  log('='.repeat(60), colors.blue);

  for (const result of testResults) {
    const status = result.success ? '✓' : '✗';
    const color = result.success ? colors.green : colors.red;
    log(`${status} TypeScript ${result.version} (${result.installedVersion})`, color);
  }

  const totalPassed = testResults.filter(r => r.success).length;
  const totalFailed = testResults.filter(r => !r.success).length;

  log(`\nTotal: ${testResults.length}`, colors.cyan);
  log(`Passed: ${totalPassed}`, colors.green);
  log(`Failed: ${totalFailed}`, totalFailed > 0 ? colors.red : colors.green);

  if (totalFailed > 0) {
    log('\n✗ Some TypeScript versions are not compatible', colors.red);
    process.exit(1);
  }

  log('\n✓ All tested TypeScript versions are compatible', colors.green);
  process.exit(0);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === '--help') {
  console.log(`
TypeScript Version Compatibility Testing Script

Usage:
  node scripts/test-typescript-versions.js

This script will:
1. Test the library against multiple TypeScript versions
2. Run type checking, builds, and tests for each version
3. Restore the original package.json and dependencies
4. Report compatibility status

The script tests these versions by default:
- TypeScript 4.0, 4.5, 4.9
- TypeScript 5.0, 5.5, 5.9
- TypeScript latest
- TypeScript next (failures allowed)
  `);
  process.exit(0);
}

main();
