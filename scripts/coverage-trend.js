#!/usr/bin/env node

/**
 * Coverage Trend Monitoring Script
 * 
 * This script tracks coverage trends over time by storing historical
 * coverage data and comparing current coverage with previous runs.
 * 
 * Requirements: 7.1, 7.5
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
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

function getTrendSymbol(current, previous) {
  if (current > previous) return colorize('↑', 'green');
  if (current < previous) return colorize('↓', 'red');
  return colorize('→', 'yellow');
}

function monitorCoverageTrend() {
  const coverageSummaryPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
  const trendDataPath = path.join(__dirname, '..', '.nyc_output', 'coverage-trend.json');
  
  if (!fs.existsSync(coverageSummaryPath)) {
    console.error(colorize('❌ Error: Coverage summary file not found!', 'red'));
    console.error(colorize('   Run "npm run test:coverage" first to generate coverage data.', 'yellow'));
    process.exit(1);
  }

  const coverageData = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
  const currentCoverage = coverageData.total;

  // Load or initialize trend data
  let trendData = { history: [] };
  if (fs.existsSync(trendDataPath)) {
    trendData = JSON.parse(fs.readFileSync(trendDataPath, 'utf8'));
  }

  // Create current entry
  const currentEntry = {
    timestamp: new Date().toISOString(),
    lines: currentCoverage.lines.pct,
    functions: currentCoverage.functions.pct,
    branches: currentCoverage.branches.pct,
    statements: currentCoverage.statements.pct
  };

  // Get previous entry for comparison
  const previousEntry = trendData.history.length > 0 
    ? trendData.history[trendData.history.length - 1]
    : null;

  // Add current entry to history
  trendData.history.push(currentEntry);

  // Keep only last 50 entries
  if (trendData.history.length > 50) {
    trendData.history = trendData.history.slice(-50);
  }

  // Save updated trend data
  const nycOutputDir = path.join(__dirname, '..', '.nyc_output');
  if (!fs.existsSync(nycOutputDir)) {
    fs.mkdirSync(nycOutputDir, { recursive: true });
  }
  fs.writeFileSync(trendDataPath, JSON.stringify(trendData, null, 2));

  // Display trend report
  console.log(colorize('\n📈 Coverage Trend Report', 'bold'));
  console.log(colorize('========================\n', 'bold'));

  if (previousEntry) {
    console.log(colorize('Comparison with previous run:', 'blue'));
    console.log(`Previous: ${new Date(previousEntry.timestamp).toLocaleString()}`);
    console.log(`Current:  ${new Date(currentEntry.timestamp).toLocaleString()}\n`);

    const metrics = ['lines', 'functions', 'branches', 'statements'];
    metrics.forEach(metric => {
      const current = currentEntry[metric];
      const previous = previousEntry[metric];
      const diff = (current - previous).toFixed(2);
      const symbol = getTrendSymbol(current, previous);
      const diffStr = diff > 0 ? `+${diff}` : diff;
      
      console.log(
        `${symbol} ${metric.charAt(0).toUpperCase() + metric.slice(1).padEnd(11)} ` +
        `${current.toFixed(2)}% (${diffStr}%)`
      );
    });

    // Overall trend
    const avgCurrent = (currentEntry.lines + currentEntry.functions + currentEntry.branches + currentEntry.statements) / 4;
    const avgPrevious = (previousEntry.lines + previousEntry.functions + previousEntry.branches + previousEntry.statements) / 4;
    const overallDiff = (avgCurrent - avgPrevious).toFixed(2);
    
    console.log(colorize('\n========================', 'bold'));
    if (overallDiff > 0) {
      console.log(colorize(`✓ Coverage improved by ${overallDiff}%`, 'green'));
    } else if (overallDiff < 0) {
      console.log(colorize(`⚠️  Coverage decreased by ${Math.abs(overallDiff)}%`, 'red'));
    } else {
      console.log(colorize('→ Coverage unchanged', 'yellow'));
    }
  } else {
    console.log(colorize('First coverage run recorded!', 'blue'));
    console.log(`Timestamp: ${new Date(currentEntry.timestamp).toLocaleString()}\n`);
    
    console.log(`Lines:      ${currentEntry.lines.toFixed(2)}%`);
    console.log(`Functions:  ${currentEntry.functions.toFixed(2)}%`);
    console.log(`Branches:   ${currentEntry.branches.toFixed(2)}%`);
    console.log(`Statements: ${currentEntry.statements.toFixed(2)}%`);
  }

  // Show history summary
  if (trendData.history.length > 1) {
    console.log(colorize('\n📊 Historical Summary:', 'blue'));
    console.log(`Total runs: ${trendData.history.length}`);
    
    const firstEntry = trendData.history[0];
    const lastEntry = trendData.history[trendData.history.length - 1];
    
    console.log(`First run:  ${new Date(firstEntry.timestamp).toLocaleDateString()}`);
    console.log(`Latest run: ${new Date(lastEntry.timestamp).toLocaleDateString()}`);
    
    const overallChange = (
      ((lastEntry.lines + lastEntry.functions + lastEntry.branches + lastEntry.statements) / 4) -
      ((firstEntry.lines + firstEntry.functions + firstEntry.branches + firstEntry.statements) / 4)
    ).toFixed(2);
    
    if (overallChange > 0) {
      console.log(colorize(`Overall trend: +${overallChange}% improvement`, 'green'));
    } else if (overallChange < 0) {
      console.log(colorize(`Overall trend: ${overallChange}% decrease`, 'red'));
    } else {
      console.log(colorize('Overall trend: stable', 'yellow'));
    }
  }

  console.log('');
}

// Run trend monitoring
try {
  monitorCoverageTrend();
} catch (error) {
  console.error(colorize('❌ Error during coverage trend monitoring:', 'red'));
  console.error(error.message);
  process.exit(1);
}
