#!/usr/bin/env node

/**
 * CI Coverage Integration Script
 * 
 * This script is designed for CI/CD integration, providing coverage
 * validation, reporting, and exit codes suitable for automated pipelines.
 * 
 * Requirements: 7.1, 7.5
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const COVERAGE_THRESHOLDS = {
  lines: 95,
  functions: 95,
  branches: 90,
  statements: 95
};

const CI_MODE = process.env.CI === 'true' || process.argv.includes('--ci');

function log(message, level = 'info') {
  const prefix = {
    info: '::notice::',
    warn: '::warning::',
    error: '::error::'
  };
  
  if (CI_MODE) {
    console.log(`${prefix[level] || ''}${message}`);
  } else {
    console.log(message);
  }
}

function runCICoverage() {
  log('Starting CI coverage validation...', 'info');
  
  try {
    // Run tests with coverage
    log('Running test suite with coverage...', 'info');
    execSync('npm run test:coverage', { stdio: 'inherit' });
    
    // Validate coverage thresholds
    log('Validating coverage thresholds...', 'info');
    const coverageSummaryPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
    
    if (!fs.existsSync(coverageSummaryPath)) {
      log('Coverage summary file not found!', 'error');
      process.exit(1);
    }
    
    const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
    const totalCoverage = coverageData.total;
    
    let allPassed = true;
    const failures = [];
    
    for (const [metric, threshold] of Object.entries(COVERAGE_THRESHOLDS)) {
      const actual = totalCoverage[metric].pct;
      const passed = actual >= threshold;
      
      if (!passed) {
        allPassed = false;
        failures.push({
          metric,
          threshold,
          actual: actual.toFixed(2)
        });
      }
      
      log(
        `${metric.toUpperCase()}: ${actual.toFixed(2)}% (threshold: ${threshold}%)`,
        passed ? 'info' : 'warn'
      );
    }
    
    // Generate reports
    log('Generating coverage reports...', 'info');
    execSync('npm run coverage:report:lcov', { stdio: 'inherit' });
    
    if (CI_MODE) {
      // Generate JSON report for CI tools
      execSync('npm run coverage:report:json', { stdio: 'inherit' });
    }
    
    // Summary
    log('\n=== Coverage Summary ===', 'info');
    log(`Lines:      ${totalCoverage.lines.covered}/${totalCoverage.lines.total} (${totalCoverage.lines.pct.toFixed(2)}%)`, 'info');
    log(`Functions:  ${totalCoverage.functions.covered}/${totalCoverage.functions.total} (${totalCoverage.functions.pct.toFixed(2)}%)`, 'info');
    log(`Branches:   ${totalCoverage.branches.covered}/${totalCoverage.branches.total} (${totalCoverage.branches.pct.toFixed(2)}%)`, 'info');
    log(`Statements: ${totalCoverage.statements.covered}/${totalCoverage.statements.total} (${totalCoverage.statements.pct.toFixed(2)}%)`, 'info');
    
    if (allPassed) {
      log('\n✓ All coverage thresholds met!', 'info');
      
      // Track coverage trend
      try {
        execSync('node scripts/coverage-trend.js', { stdio: 'inherit' });
      } catch (err) {
        log('Warning: Could not update coverage trend', 'warn');
      }
      
      process.exit(0);
    } else {
      log('\n✗ Coverage validation failed!', 'error');
      failures.forEach(f => {
        log(`${f.metric}: ${f.actual}% (required: ${f.threshold}%)`, 'error');
      });
      process.exit(1);
    }
    
  } catch (error) {
    log(`CI coverage validation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run CI coverage
runCICoverage();
