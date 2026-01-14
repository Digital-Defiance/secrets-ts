#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function convertTestFileToTypeScript(inputPath, outputPath) {
    let content = fs.readFileSync(inputPath, 'utf8');
    
    // Add TypeScript imports at the top
    const imports = `import secrets = require('../../src/secrets');\nimport type { SecretsConfig, Shares, ShareComponents } from '../../src/types';\n\n`;
    
    // Remove the global secrets declaration from jslint comment
    content = content.replace(/\/\*global secrets,/, '/*global');
    
    // Replace function() with function(): void for describe/it/beforeEach/afterEach blocks
    content = content.replace(/function\(\)\s*{/g, 'function(): void {');
    
    // Replace var declarations with let and add type annotations
    content = content.replace(/\bvar\s+(\w+)(\s*:\s*\w+)?\s*$/gm, (match, varName) => {
        // Variables declared without initialization
        return `let ${varName}: string`;
    });
    
    // Replace var with let for initialized variables
    content = content.replace(/\bvar\s+(\w+)\s*=/g, 'let $1 =');
    
    // Add type annotations for common string variables
    content = content.replace(/let\s+(key|secret|combinedKey|newShare|str|hex|hexStr|binStr|rnd|result|share|data|out|bin|randomHex|randomValue|knownKey|cheaterKey|rngType|errPrefix|errSuffix|regexStr|bitsBase36|idHex|newShareString|secretBin|hexStr2)\s*=/g, 
        'let $1: string =');
    
    // Add type annotations for share arrays
    content = content.replace(/let\s+(shares|knownShares|cheaterShares|zeroPadShares|validShares|duplicatedShares|shuffledShares|shares16|largeShares|minShares|equalShares|largeThreshold|noPadShares|maxPadShares|paddedShares|subShares|testShares|rngTypes|customRNGs|testCases|testSecrets|testBitLengths|testConfigs|bitConfigs|padLengths)\s*=/g,
        'let $1: string[] =');
    
    // Add type annotations for numeric variables
    content = content.replace(/let\s+(numShares|threshold|bits|bytes|elems|i|j|len|len2|num|missing|hexChars|max|neededBytes|id|idLen|idMax|idPaddingLen|x|logx|fx|sum|product|setBits|at|padLength|bytesPerChar|maxId|numericId|length|iteration|bitsNum)\s*=/g,
        'let $1: number =');
    
    // Add type annotations for config objects
    content = content.replace(/let\s+(config|expectedConfig)\s*=/g, 'let $1: SecretsConfig =');
    
    // Add type annotations for arrays
    content = content.replace(/let\s+(arr|array|randomBytes|uint8Array|testData|mockArray)\s*=/g, 'let $1: Uint32Array =');
    
    // Add type annotations for boolean variables
    content = content.replace(/let\s+(hasNonZero|hasBrowserCrypto|hasNodeCrypto|mathRandomCalled)\s*=/g, 'let $1: boolean =');
    
    // Fix type annotations for function parameters in custom RNG tests
    content = content.replace(/function\(bits\)\s*{/g, 'function(bits: number): string {');
    
    // Add imports at the beginning (after jslint comments)
    const lines = content.split('\n');
    const jslintEndIndex = lines.findIndex(line => line.includes('/*global'));
    if (jslintEndIndex !== -1) {
        lines.splice(jslintEndIndex + 1, 0, '', imports);
        content = lines.join('\n');
    } else {
        content = imports + content;
    }
    
    // Write the converted content
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`Converted ${inputPath} -> ${outputPath}`);
}

// Convert the test files
const testFiles = [
    { input: 'spec/secrets/SecretsSpec.js', output: 'spec/secrets/SecretsSpec.ts' },
    { input: 'spec/secrets/SecretsPrivateSpec.js', output: 'spec/secrets/SecretsPrivateSpec.ts' },
    { input: 'spec/secrets/SecretsPropertySpec.js', output: 'spec/secrets/SecretsPropertySpec.ts' },
    { input: 'spec/secrets/SecretsIntegrationSpec.js', output: 'spec/secrets/SecretsIntegrationSpec.ts' },
    { input: 'spec/secrets/SecretsPerformanceSpec.js', output: 'spec/secrets/SecretsPerformanceSpec.ts' },
    { input: 'spec/secrets/SecretsSecuritySpec.js', output: 'spec/secrets/SecretsSecuritySpec.ts' }
];

testFiles.forEach(({ input, output }) => {
    if (fs.existsSync(input)) {
        convertTestFileToTypeScript(input, output);
    } else {
        console.error(`File not found: ${input}`);
    }
});

console.log('Conversion complete!');
