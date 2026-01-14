#!/usr/bin/env node

/**
 * Coverage Validation Script
 * 
 * This script validates that code coverage meets the required thresholds
 * and provides detailed reporting for CI/CD integration.
 * 
 * Requirements: 7.1, 7.5
 */

const fs = require('fs');
const path = require('path');

// Coverage thresholds from .nycrc.json
const THRESHOLDS = {
  lines: 95,
  functions: 95,
  branches: 90,
  statements: 95
};

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function validateCoverage() {
  const coverageSummaryPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
  
  if (!fs.existsSync(coverageSummaryPath)) {
    console.error(colorize('❌ Error: Coverage summary file not found!', 'red'));
    console.error(colorize('   Run "npm run test:coverage" first to generate coverage data.', 'yellow'));
    process.exit(1);
  }

  const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
  const totalCoverage = coverageData.total;

  console.log(colorize('\n📊 Coverage Validation Report', 'bold'));
  console.log(colorize('================================\n', 'bold'));

  let allPassed = true;
  const results = [];

  // Check each metric
  for (const [metric, threshold] of Object.entries(THRESHOLDS)) {
    const actual = totalCoverage[metric].pct;
    const passed = actual >= threshold;
    allPassed = allPassed && passed;

    const status = passed 
      ? colorize('✓ PASS', 'green')
      : colorize('✗ FAIL', 'red');
    
    const actualStr = passed
      ? colorize(`${actual.toFixed(2)}%`, 'green')
      : colorize(`${actual.toFixed(2)}%`, 'red');

    results.push({
      metric: metric.charAt(0).toUpperCase() + metric.slice(1),
      threshold: `${threshold}%`,
      actual: actual,
      actualStr: actualStr,
      status: status,
      passed: passed
    });

    console.log(`${status} ${results[results.length - 1].metric.padEnd(12)} ${actualStr.padEnd(20)} (threshold: ${threshold}%)`);
  }

  console.log(colorize('\n================================', 'bold'));

  if (allPassed) {
    console.log(colorize('✓ All coverage thresholds met!', 'green'));
    console.log(colorize('\n📈 Coverage Summary:', 'blue'));
    console.log(`   Lines:      ${totalCoverage.lines.covered}/${totalCoverage.lines.total}`);
    console.log(`   Functions:  ${totalCoverage.functions.covered}/${totalCoverage.functions.total}`);
    console.log(`   Branches:   ${totalCoverage.branches.covered}/${totalCoverage.branches.total}`);
    console.log(`   Statements: ${totalCoverage.statements.covered}/${totalCoverage.statements.total}`);
    process.exit(0);
  } else {
    console.log(colorize('✗ Coverage validation failed!', 'red'));
    console.log(colorize('\n⚠️  The following metrics are below threshold:', 'yellow'));
    
    results.filter(r => !r.passed).forEach(r => {
      const gap = (THRESHOLDS[r.metric.toLowerCase()] - r.actual).toFixed(2);
      console.log(`   ${r.metric}: ${r.actual.toFixed(2)}% (need ${gap}% more)`);
    });
    
    console.log(colorize('\n💡 Tip: Run "npm run coverage:report:html" to see detailed coverage report.', 'blue'));
    process.exit(1);
  }
}

// Run validation
try {
  validateCoverage();
} catch (error) {
  console.error(colorize('❌ Error during coverage validation:', 'red'));
  console.error(error.message);
  process.exit(1);
}
