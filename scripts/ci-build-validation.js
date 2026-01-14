#!/usr/bin/env node

/**
 * CI Build Validation Script
 * 
 * This script validates that all build outputs are generated correctly
 * and contain the expected content for CI environments.
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

function checkFileExists(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    log(`✗ ${description} not found: ${filePath}`, colors.red);
    return false;
  }
  
  const stats = fs.statSync(fullPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  log(`✓ ${description} exists: ${filePath} (${sizeKB} KB)`, colors.green);
  return true;
}

function checkFileContent(filePath, expectedContent, description) {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
    if (content.includes(expectedContent)) {
      log(`✓ ${description} contains expected content`, colors.green);
      return true;
    } else {
      log(`✗ ${description} missing expected content: "${expectedContent}"`, colors.red);
      return false;
    }
  } catch (error) {
    log(`✗ Error reading ${description}: ${error.message}`, colors.red);
    return false;
  }
}

function execCommand(command, description) {
  log(`\n${description}...`, colors.cyan);
  try {
    execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    log(`✓ ${description} completed`, colors.green);
    return true;
  } catch (error) {
    log(`✗ ${description} failed`, colors.red);
    return false;
  }
}

function main() {
  log('='.repeat(60), colors.blue);
  log('CI Build Validation', colors.blue);
  log('='.repeat(60), colors.blue);

  let allPassed = true;

  // Build all formats
  log('\nBuilding all formats...', colors.cyan);
  if (!execCommand('yarn build', 'Building all formats')) {
    allPassed = false;
  }

  // Validate CommonJS build
  log('\nValidating CommonJS build...', colors.cyan);
  allPassed = checkFileExists('dist/secrets.js', 'CommonJS output') && allPassed;
  allPassed = checkFileExists('dist/secrets.d.ts', 'CommonJS type definitions') && allPassed;
  allPassed = checkFileExists('dist/secrets.js.map', 'CommonJS source map') && allPassed;
  allPassed = checkFileContent('dist/secrets.js', 'exports', 'CommonJS output') && allPassed;

  // Validate ES Modules build
  log('\nValidating ES Modules build...', colors.cyan);
  allPassed = checkFileExists('dist/esm/secrets.js', 'ESM output') && allPassed;
  allPassed = checkFileExists('dist/esm/secrets.d.ts', 'ESM type definitions') && allPassed;
  allPassed = checkFileExists('dist/esm/secrets.js.map', 'ESM source map') && allPassed;
  allPassed = checkFileContent('dist/esm/secrets.js', 'export', 'ESM output') && allPassed;

  // Validate UMD build
  log('\nValidating UMD build...', colors.cyan);
  allPassed = checkFileExists('dist/umd/secrets.js', 'UMD output') && allPassed;
  allPassed = checkFileExists('dist/umd/secrets.d.ts', 'UMD type definitions') && allPassed;
  allPassed = checkFileExists('dist/umd/secrets.js.map', 'UMD source map') && allPassed;

  // Validate minified UMD build
  log('\nValidating minified UMD build...', colors.cyan);
  allPassed = checkFileExists('secrets.min.js', 'Minified UMD output') && allPassed;

  // Validate type definitions
  log('\nValidating type definitions...', colors.cyan);
  allPassed = checkFileContent('dist/secrets.d.ts', 'export', 'Type definitions') && allPassed;

  // Summary
  log('\n' + '='.repeat(60), colors.blue);
  log('Build Validation Summary', colors.blue);
  log('='.repeat(60), colors.blue);

  if (allPassed) {
    log('\n✓ All build validations passed', colors.green);
    process.exit(0);
  } else {
    log('\n✗ Some build validations failed', colors.red);
    process.exit(1);
  }
}

main();
