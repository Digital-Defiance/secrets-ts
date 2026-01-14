#!/usr/bin/env node

/**
 * CI TypeScript Type Checking Script
 * 
 * This script performs comprehensive TypeScript type checking for CI environments.
 * It validates both source and test code, and provides detailed error reporting.
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
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n${description}...`, colors.cyan);
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    log(`✓ ${description} passed`, colors.green);
    return { success: true, output };
  } catch (error) {
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

function checkTsConfigExists(configPath) {
  const fullPath = path.join(process.cwd(), configPath);
  if (!fs.existsSync(fullPath)) {
    log(`✗ TypeScript config not found: ${configPath}`, colors.red);
    return false;
  }
  log(`✓ Found TypeScript config: ${configPath}`, colors.green);
  return true;
}

function main() {
  log('='.repeat(60), colors.blue);
  log('CI TypeScript Type Checking', colors.blue);
  log('='.repeat(60), colors.blue);

  const results = [];

  // Check that TypeScript configs exist
  log('\nVerifying TypeScript configurations...', colors.cyan);
  const configs = [
    'tsconfig.json',
    'tsconfig.test.json',
    'tsconfig.esm.json',
    'tsconfig.umd.json'
  ];
  
  for (const config of configs) {
    if (!checkTsConfigExists(config)) {
      process.exit(1);
    }
  }

  // Type check source code
  results.push(execCommand(
    'yarn typecheck',
    'Type checking source code'
  ));

  // Type check test code
  results.push(execCommand(
    'yarn typecheck:test',
    'Type checking test code'
  ));

  // Check for TypeScript version
  results.push(execCommand(
    'yarn tsc --version',
    'Checking TypeScript version'
  ));

  // Summary
  log('\n' + '='.repeat(60), colors.blue);
  log('Type Checking Summary', colors.blue);
  log('='.repeat(60), colors.blue);

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  log(`\nTotal checks: ${results.length}`, colors.cyan);
  log(`Passed: ${passed}`, colors.green);
  log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green);

  if (failed > 0) {
    log('\n✗ Type checking failed', colors.red);
    process.exit(1);
  }

  log('\n✓ All type checks passed', colors.green);
  process.exit(0);
}

main();
