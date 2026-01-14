/*jslint passfail: false, bitwise: true, todo: false, maxerr: 1000 */
/*global secrets */

/**
 * Test Data Generators for Property-Based Testing
 * 
 * This module provides generators for creating random test data
 * for comprehensive testing of the @digitaldefiance/secrets library.
 */

// when running in a node.js env.
if (typeof require === "function") {
    crypto = require("crypto")
    secrets = require("../../secrets.js")
}

/**
 * Generates a random hex string of specified bit length
 * @param {number} minBits - Minimum number of bits (default: 8)
 * @param {number} maxBits - Maximum number of bits (default: 512)
 * @returns {string} Random hex string
 */
function generateRandomSecret(minBits, maxBits) {
    minBits = minBits || 8
    maxBits = maxBits || 512
    
    var bits = Math.floor(Math.random() * (maxBits - minBits + 1)) + minBits
    var hexLength = Math.ceil(bits / 4)
    var secret = ""
    
    for (var i = 0; i < hexLength; i++) {
        secret += Math.floor(Math.random() * 16).toString(16)
    }
    
    return secret
}

/**
 * Generates random share configuration parameters
 * @param {number} maxShares - Maximum number of shares (default: 255)
 * @returns {object} Object with numShares and threshold properties
 */
function generateShareConfig(maxShares) {
    maxShares = maxShares || 255
    
    // Ensure we have at least 3 shares and reasonable threshold
    var numShares = Math.floor(Math.random() * Math.min(maxShares - 2, 50)) + 3 // 3 to min(maxShares, 52)
    var threshold = Math.floor(Math.random() * (numShares - 1)) + 2 // 2 to numShares
    
    return {
        numShares: numShares,
        threshold: threshold
    }
}

/**
 * Generates a random ASCII string
 * @param {number} minLength - Minimum string length (default: 1)
 * @param {number} maxLength - Maximum string length (default: 100)
 * @returns {string} Random ASCII string
 */
function generateRandomString(minLength, maxLength) {
    minLength = minLength || 1
    maxLength = maxLength || 100
    
    var length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"
    var result = ""
    
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
}

/**
 * Generates a random UTF-8 string with international characters
 * @param {number} minLength - Minimum string length (default: 1)
 * @param {number} maxLength - Maximum string length (default: 50)
 * @returns {string} Random UTF-8 string
 */
function generateRandomUTF8String(minLength, maxLength) {
    minLength = minLength || 1
    maxLength = maxLength || 50
    
    var length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789¥£€$¢₡₢₣₤₥₦₧₨₩₪₫₭₮₯₹"
    var result = ""
    
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
}

/**
 * Generates random bit configuration for secrets.init()
 * @returns {number} Random bit configuration between 3 and 20
 */
function generateRandomBits() {
    return Math.floor(Math.random() * 18) + 3 // 3 to 20
}

/**
 * Generates a random byte array
 * @param {number} minLength - Minimum array length (default: 1)
 * @param {number} maxLength - Maximum array length (default: 256)
 * @returns {Uint8Array} Random byte array
 */
function generateRandomByteArray(minLength, maxLength) {
    minLength = minLength || 1
    maxLength = maxLength || 256
    
    var length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength
    var bytes = new Uint8Array(length)
    
    for (var i = 0; i < length; i++) {
        bytes[i] = Math.floor(Math.random() * 256)
    }
    
    return bytes
}

/**
 * Generates random padding length for zero-padding
 * @returns {number} Random padding length between 0 and 1024
 */
function generateRandomPadding() {
    return Math.floor(Math.random() * 1025) // 0 to 1024
}

/**
 * Generates a random share ID
 * @param {number} maxId - Maximum share ID (default: 255)
 * @returns {number} Random share ID between 1 and maxId
 */
function generateRandomShareId(maxId) {
    maxId = maxId || 255
    return Math.floor(Math.random() * maxId) + 1 // 1 to maxId
}

/**
 * Generates random test data for comprehensive testing
 * @returns {object} Object containing various random test data
 */
function generateComprehensiveTestData() {
    return {
        secret: generateRandomSecret(),
        shareConfig: generateShareConfig(),
        asciiString: generateRandomString(),
        utf8String: generateRandomUTF8String(),
        bits: generateRandomBits(),
        byteArray: generateRandomByteArray(),
        padding: generateRandomPadding(),
        shareId: generateRandomShareId()
    }
}

/**
 * Generates edge case test data (boundary values, empty inputs, etc.)
 * @returns {object} Object containing edge case test data
 */
function generateEdgeCaseTestData() {
    var edgeCases = [
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
    ]
    
    return edgeCases[Math.floor(Math.random() * edgeCases.length)]
}

/**
 * Generates invalid test data for error condition testing
 * @returns {object} Object containing invalid test data
 */
function generateInvalidTestData() {
    var invalidCases = [
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
    ]
    
    return invalidCases[Math.floor(Math.random() * invalidCases.length)]
}

// Export generators for use in tests
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        generateRandomSecret: generateRandomSecret,
        generateShareConfig: generateShareConfig,
        generateRandomString: generateRandomString,
        generateRandomUTF8String: generateRandomUTF8String,
        generateRandomBits: generateRandomBits,
        generateRandomByteArray: generateRandomByteArray,
        generateRandomPadding: generateRandomPadding,
        generateRandomShareId: generateRandomShareId,
        generateComprehensiveTestData: generateComprehensiveTestData,
        generateEdgeCaseTestData: generateEdgeCaseTestData,
        generateInvalidTestData: generateInvalidTestData
    }
} else if (typeof window !== "undefined") {
    window.TestDataGenerators = {
        generateRandomSecret: generateRandomSecret,
        generateShareConfig: generateShareConfig,
        generateRandomString: generateRandomString,
        generateRandomUTF8String: generateRandomUTF8String,
        generateRandomBits: generateRandomBits,
        generateRandomByteArray: generateRandomByteArray,
        generateRandomPadding: generateRandomPadding,
        generateRandomShareId: generateRandomShareId,
        generateComprehensiveTestData: generateComprehensiveTestData,
        generateEdgeCaseTestData: generateEdgeCaseTestData,
        generateInvalidTestData: generateInvalidTestData
    }
}