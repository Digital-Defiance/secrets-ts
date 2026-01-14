# Coverage Validation Scripts

This directory contains scripts for comprehensive coverage analysis, validation, and trend monitoring.

## Scripts

### validate-coverage.js

Validates that code coverage meets the required thresholds defined in `.nycrc.json`.

**Usage:**
```bash
npm run coverage:validate
```

**Features:**
- Checks coverage against thresholds (95% lines, 95% functions, 90% branches, 95% statements)
- Provides color-coded output for easy reading
- Shows detailed metrics and gaps when thresholds are not met
- Exit code 0 on success, 1 on failure

**Requirements:** 7.1, 7.5

---

### coverage-trend.js

Tracks coverage trends over time by storing historical coverage data.

**Usage:**
```bash
npm run coverage:trend
```

**Features:**
- Stores up to 50 historical coverage measurements
- Compares current coverage with previous run
- Shows improvement/decline trends with visual indicators
- Provides historical summary across all runs
- Data stored in `.nyc_output/coverage-trend.json`

**Requirements:** 7.1, 7.5

---

### ci-coverage.js

Comprehensive CI/CD integration script for automated coverage validation.

**Usage:**
```bash
npm run ci:coverage

# Or in CI environment:
CI=true npm run ci:coverage
```

**Features:**
- Runs full test suite with coverage
- Validates coverage thresholds
- Generates multiple report formats (LCOV, JSON, HTML)
- Provides CI-friendly output with GitHub Actions annotations
- Updates coverage trends automatically
- Exit code 0 on success, 1 on failure

**Requirements:** 7.1, 7.5

---

## Workflow

### Development Workflow

1. **Run tests with coverage:**
   ```bash
   npm run test:coverage
   ```

2. **Validate coverage:**
   ```bash
   npm run coverage:validate
   ```

3. **Check coverage trends:**
   ```bash
   npm run coverage:trend
   ```

4. **View detailed HTML report:**
   ```bash
   npm run coverage:report:html
   ```

### CI/CD Workflow

1. **Run comprehensive CI coverage:**
   ```bash
   npm run ci:coverage
   ```

This single command will:
- Run all tests with coverage
- Validate thresholds
- Generate reports
- Update trends
- Provide appropriate exit codes

---

## Coverage Thresholds

Current thresholds (defined in `.nycrc.json`):
- **Lines:** 95%
- **Functions:** 95%
- **Branches:** 90%
- **Statements:** 95%

---

## Output Files

- `coverage/` - HTML and LCOV coverage reports
- `coverage/coverage-summary.json` - Summary data used by validation scripts
- `.nyc_output/` - NYC temporary files and cache
- `.nyc_output/coverage-trend.json` - Historical coverage trend data

---

## Integration with CI Systems

### GitHub Actions Example

```yaml
- name: Run tests with coverage
  run: npm run ci:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### GitLab CI Example

```yaml
test:
  script:
    - npm run ci:coverage
  coverage: '/Lines\s+:\s+(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

---

## Troubleshooting

**Coverage summary not found:**
- Run `npm run test:coverage` first to generate coverage data

**Thresholds not met:**
- Run `npm run coverage:report:html` to see detailed line-by-line coverage
- Focus on uncovered lines, branches, and functions
- Add tests for uncovered code paths

**Trend data issues:**
- Delete `.nyc_output/coverage-trend.json` to reset trend history
- Ensure `.nyc_output/` directory exists and is writable

---

## Related npm Scripts

- `npm run test:coverage` - Run tests with coverage
- `npm run test:all` - Run tests with coverage and validation
- `npm run coverage:clean` - Clean coverage artifacts
- `npm run coverage:report:text` - Text coverage report
- `npm run coverage:report:html` - HTML coverage report
- `npm run coverage:report:lcov` - LCOV coverage report
- `npm run coverage:report:json` - JSON coverage report
