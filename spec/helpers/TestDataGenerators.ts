/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */

import secrets = require('../../src/secrets');

/**
 * Test Data Generators for Property-Based Testing
 * 
 * This module provides type-safe generators for creating random test data
 * for comprehensive testing of the @digitaldefiance/secrets library.
 */

/**
 * Share configuration interface
 */
export interface ShareConfig {
    numShares: number;
    threshold: number;
}

/**
 * Comprehensive test data interface
 */
export interface ComprehensiveTestData {
    secret: string;
    shareConfig: ShareConfig;
    asciiString: string;
    utf8String: string;
    bits: number;
    byteArray: Uint8Array;
    padding: number;
    shareId: number;
}

/**
 * Invalid test data interface (for error testing)
 */
export interface InvalidTestData {
    secret: string | object | null;
    shareConfig: ShareConfig;
    bits: number;
    shareId: number;
}

/**
 * Generates a random hex string of specified bit length
 */
export function generateRandomSecret(minBits: number = 8, maxBits: number = 512): string {
    const bits: number = Math.floor(Math.random() * (maxBits - minBits + 1)) + minBits;
    const hexLength: number = Math.ceil(bits / 4);
    let secret: string = "";
    
    for (let i: number = 0; i < hexLength; i++) {
        secret += Math.floor(Math.random() * 16).toString(16);
    }
    
    return secret;
}

/**
 * Generates random share configuration parameters
 */
export function generateShareConfig(maxShares: number = 255): ShareConfig {
    // Ensure we have at least 3 shares and reasonable threshold
    const numShares: number = Math.floor(Math.random() * Math.min(maxShares - 2, 50)) + 3; // 3 to min(maxShares, 52)
    const threshold: number = Math.floor(Math.random() * (numShares - 1)) + 2; // 2 to numShares
    
    return {
        numShares,
        threshold
    };
}

/**
 * Generates a random ASCII string
 */
export function generateRandomString(minLength: number = 1, maxLength: number = 100): string {
    const length: number = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    const chars: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let result: string = "";
    
    for (let i: number = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
}

/**
 * Generates a random UTF-8 string with international characters
 */
export function generateRandomUTF8String(minLength: number = 1, maxLength: number = 50): string {
    const length: number = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    const chars: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789¥£€$¢₡₢₣₤₥₦₧₨₩₪₫₭₮₯₹";
    let result: string = "";
    
    for (let i: number = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
}

/**
 * Generates random bit configuration for secrets.init()
 */
export function generateRandomBits(): number {
    return Math.floor(Math.random() * 18) + 3; // 3 to 20
}

/**
 * Generates a random byte array
 */
export function generateRandomByteArray(minLength: number = 1, maxLength: number = 256): Uint8Array {
    const length: number = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    const bytes: Uint8Array = new Uint8Array(length);
    
    for (let i: number = 0; i < length; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
    }
    
    return bytes;
}

/**
 * Generates random padding length for zero-padding
 */
export function generateRandomPadding(): number {
    return Math.floor(Math.random() * 1025); // 0 to 1024
}

/**
 * Generates a random share ID
 */
export function generateRandomShareId(maxId: number = 255): number {
    return Math.floor(Math.random() * maxId) + 1; // 1 to maxId
}

/**
 * Generates random test data for comprehensive testing
 */
export function generateComprehensiveTestData(): ComprehensiveTestData {
    return {
        secret: generateRandomSecret(),
        shareConfig: generateShareConfig(),
        asciiString: generateRandomString(),
        utf8String: generateRandomUTF8String(),
        bits: generateRandomBits(),
        byteArray: generateRandomByteArray(),
        padding: generateRandomPadding(),
        shareId: generateRandomShareId()
    };
}

/**
 * Generates edge case test data (boundary values, empty inputs, etc.)
 */
export function generateEdgeCaseTestData(): ComprehensiveTestData {
    const edgeCases: ComprehensiveTestData[] = [
        {
            secret: "0", // Minimal hex
            shareConfig: { numShares: 3, threshold: 2 }, // Minimal config
            asciiString: "",
            utf8String: "",
            bits: 3, // Minimum bits
            byteArray: new Uint8Array([0]),
            padding: 0,
            shareId: 1
        },
        {
            secret: generateRandomSecret(512, 512), // Maximum bits
            shareConfig: { numShares: 255, threshold: 255 }, // Maximum shares
            asciiString: generateRandomString(100, 100),
            utf8String: generateRandomUTF8String(50, 50),
            bits: 20, // Maximum bits
            byteArray: generateRandomByteArray(256, 256),
            padding: 1024,
            shareId: 255
        },
        {
            secret: "00000000", // Leading zeros
            shareConfig: { numShares: 10, threshold: 5 },
            asciiString: "0000000 is the password",
            utf8String: "¥ · £ · € · $ · ¢ · ₡ · ₢ · ₣ · ₤ · ₥ · ₦ · ₧ · ₨ · ₩ · ₪ · ₫ · ₭ · ₮ · ₯ · ₹",
            bits: 8,
            byteArray: new Uint8Array([0, 1, 15, 16, 255]),
            padding: 256,
            shareId: 128
        }
    ];
    
    return edgeCases[Math.floor(Math.random() * edgeCases.length)];
}

/**
 * Generates invalid test data for error condition testing
 */
export function generateInvalidTestData(): InvalidTestData {
    const invalidCases: InvalidTestData[] = [
        {
            secret: "xyz123", // Invalid hex
            shareConfig: { numShares: 1, threshold: 2 }, // Invalid: numShares < threshold
            bits: 2, // Invalid: bits < 3
            shareId: 0 // Invalid: shareId < 1
        },
        {
            secret: { foo: "bar" }, // Invalid: not a string
            shareConfig: { numShares: 256, threshold: 2 }, // Invalid: numShares > 255 for 8-bit
            bits: 21, // Invalid: bits > 20
            shareId: 256 // Invalid: shareId > 255 for 8-bit
        },
        {
            secret: null, // Invalid: null
            shareConfig: { numShares: 2, threshold: 1 }, // Invalid: threshold < 2
            bits: 1.5, // Invalid: non-integer
            shareId: -1 // Invalid: negative
        }
    ];
    
    return invalidCases[Math.floor(Math.random() * invalidCases.length)];
}
