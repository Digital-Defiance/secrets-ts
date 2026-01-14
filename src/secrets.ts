// @preserve author Alexander Stetsyuk
// @preserve author Glenn Rempe <glenn@rempe.us>
// @license MIT

// TypeScript conversion of the @digitaldefiance/secrets library
// Provides Shamir's Secret Sharing with comprehensive type safety

import type {
  Base36String,
  BinaryString,
  CSPRNGType,
  Defaults,
  HexString,
  InternalConfig,
  RNGFunction,
  SecretsConfig,
  Share,
  ShareComponents,
  Shares,
} from "./types";

// UMD Pattern: Support for Node.js, AMD, and browser globals
declare global {
  interface Window {
    secrets: typeof SecretsLibrary;
  }
}

// ============================================================================
// Module State
// ============================================================================

let defaults: Defaults;
let config: Partial<InternalConfig>;
let preGenPadding: string;
let runCSPRNGTest: boolean;
let CSPRNGTypes: readonly CSPRNGType[];
let byteToHex: string[];

// ============================================================================
// Initialization and Reset
// ============================================================================

function reset(): void {
  defaults = {
    bits: 8,
    radix: 16,
    minBits: 3,
    maxBits: 20,
    bytesPerChar: 2,
    maxBytesPerChar: 6,

    primitivePolynomials: [
      null,
      null,
      1,
      3,
      3,
      5,
      3,
      3,
      29,
      17,
      9,
      5,
      83,
      27,
      43,
      3,
      45,
      9,
      39,
      39,
      9,
      5,
      3,
      33,
      27,
      9,
      71,
      39,
      9,
      5,
      83,
    ],
  };

  config = {};
  preGenPadding = new Array(1024).join("0");
  runCSPRNGTest = true;

  byteToHex = [];
  for (let i = 0; i <= 0xff; i++) {
    let hexOctet = i.toString(16);
    if (hexOctet.length === 1) {
      hexOctet = "0" + hexOctet;
    }
    byteToHex.push(hexOctet);
  }

  CSPRNGTypes = ["nodeCryptoRandomBytes", "browserCryptoGetRandomValues", "testRandom"];
}

function isSetRNG(): boolean {
  if (config && config.rng && typeof config.rng === "function") {
    return true;
  }
  return false;
}

// ============================================================================
// Utility Functions
// ============================================================================

function padLeft(str: string, multipleOfBits?: number): string {
  let missing: number;

  if (multipleOfBits === 0 || multipleOfBits === 1) {
    return str;
  }

  if (multipleOfBits && multipleOfBits > 1024) {
    throw new Error("Padding must be multiples of no larger than 1024 bits.");
  }

  const bits = multipleOfBits || config.bits!;

  if (str) {
    missing = str.length % bits;
  }

  if (missing!) {
    return (preGenPadding + str).slice(-(bits - missing + str.length));
  }

  return str;
}

function hex2bin(str: string): BinaryString {
  let bin = "";
  let num: number;

  for (let i = str.length - 1; i >= 0; i--) {
    num = parseInt(str[i], 16);

    if (isNaN(num)) {
      throw new Error("Invalid hex character.");
    }

    bin = padLeft(num.toString(2), 4) + bin;
  }
  return bin;
}

function bin2hex(str: BinaryString): HexString {
  let hex = "";
  let num: number;

  str = padLeft(str, 4);

  for (let i = str.length; i >= 4; i -= 4) {
    num = parseInt(str.slice(i - 4, i), 2);
    if (isNaN(num)) {
      throw new Error("Invalid binary character.");
    }
    hex = num.toString(16) + hex;
  }

  return hex;
}

function bytesToHex(bytes: Uint8Array | Buffer): HexString {
  let hex = "";

  for (let i = 0; i < bytes.length; i++) {
    hex += byteToHex[bytes[i]];
  }

  return hex;
}

// ============================================================================
// Crypto Environment Detection
// ============================================================================

function hasCryptoGetRandomValues(): boolean {
  const crypto = (typeof window !== "undefined" && window.crypto) || (global as any).crypto;

  if (
    crypto &&
    typeof crypto === "object" &&
    (typeof crypto.getRandomValues === "function" || typeof crypto.getRandomValues === "object") &&
    (typeof Uint32Array === "function" || typeof Uint32Array === "object")
  ) {
    return true;
  }

  return false;
}

function hasCryptoRandomBytes(): boolean {
  let crypto: any;

  try {
    crypto = require("crypto");
  } catch (e) {
    return false;
  }

  if (typeof crypto === "object" && typeof crypto.randomBytes === "function") {
    return true;
  }

  return false;
}

function getRNG(type?: CSPRNGType): RNGFunction | undefined {
  function construct(
    bits: number,
    arr: string | Uint32Array,
    radix: number,
    size: number
  ): string | null {
    let i = 0;
    let len: number;
    let str = "";
    let parsedInt: number;

    if (arr) {
      len = arr.length - 1;
    }

    while (i < len! || str.length < bits) {
      parsedInt = Math.abs(parseInt((arr as any)[i], radix));
      str = str + padLeft(parsedInt.toString(2), size);
      i++;
    }

    str = str.substr(-bits);

    if ((str.match(/0/g) || []).length === str.length) {
      return null;
    }

    return str;
  }

  function nodeCryptoRandomBytes(bits: number): string {
    let buf: Buffer;
    let bytes: number;
    const radix = 16;
    const size = 4;
    let str: string | null = null;

    bytes = Math.ceil(bits / 8);

    const crypto = require("crypto");
    while (str === null) {
      buf = crypto.randomBytes(bytes);
      str = construct(bits, bytesToHex(buf), radix, size);
    }

    return str;
  }

  function browserCryptoGetRandomValues(bits: number): string {
    let elems: number;
    const radix = 10;
    const size = 32;
    let str: string | null = null;

    elems = Math.ceil(bits / 32);
    const crypto = (typeof window !== "undefined" && window.crypto) || (global as any).crypto;

    while (str === null) {
      str = construct(bits, crypto.getRandomValues(new Uint32Array(elems)), radix, size);
    }

    return str;
  }

  function testRandom(bits: number): string {
    let arr: Uint32Array;
    let elems: number;
    const int = 123456789;
    const radix = 10;
    const size = 32;
    let str: string | null = null;

    elems = Math.ceil(bits / 32);
    arr = new Uint32Array(elems);

    for (let i = 0; i < arr.length; i++) {
      arr[i] = int;
    }

    while (str === null) {
      str = construct(bits, arr, radix, size);
    }

    return str;
  }

  if (type && type === "testRandom") {
    config.typeCSPRNG = type;
    return testRandom;
  } else if (type && type === "nodeCryptoRandomBytes") {
    config.typeCSPRNG = type;
    return nodeCryptoRandomBytes;
  } else if (type && type === "browserCryptoGetRandomValues") {
    config.typeCSPRNG = type;
    return browserCryptoGetRandomValues;
  } else if (hasCryptoRandomBytes()) {
    config.typeCSPRNG = "nodeCryptoRandomBytes";
    return nodeCryptoRandomBytes;
  } else if (hasCryptoGetRandomValues()) {
    config.typeCSPRNG = "browserCryptoGetRandomValues";
    return browserCryptoGetRandomValues;
  }

  return undefined;
}

// ============================================================================
// Core Algorithm Functions
// ============================================================================

function splitNumStringToIntArray(str: string, padLength?: number): number[] {
  const parts: number[] = [];

  if (padLength) {
    str = padLeft(str, padLength);
  }

  let i: number;
  for (i = str.length; i > config.bits!; i -= config.bits!) {
    parts.push(parseInt(str.slice(i - config.bits!, i), 2));
  }

  parts.push(parseInt(str.slice(0, i), 2));

  return parts;
}

function horner(x: number, coeffs: number[]): number {
  const logx = config.logs![x];
  let fx = 0;

  for (let i = coeffs.length - 1; i >= 0; i--) {
    if (fx !== 0) {
      fx = config.exps![(logx + config.logs![fx]) % config.maxShares!] ^ coeffs[i];
    } else {
      fx = coeffs[i];
    }
  }

  return fx;
}

function lagrange(at: number, x: number[], y: number[]): number {
  let sum = 0;
  const len = x.length;
  let product: number;

  for (let i = 0; i < len; i++) {
    if (y[i]) {
      product = config.logs![y[i]];

      for (let j = 0; j < len; j++) {
        if (i !== j) {
          if (at === x[j]) {
            product = -1;
            break;
          }
          product =
            (product + config.logs![at ^ x[j]] - config.logs![x[i] ^ x[j]] + config.maxShares!) %
            config.maxShares!;
        }
      }

      sum = product === -1 ? sum : sum ^ config.exps![product];
    }
  }

  return sum;
}

function getShares(secret: number, numShares: number, threshold: number): Share[] {
  const shares: Share[] = [];
  const coeffs: number[] = [secret];

  for (let i = 1; i < threshold; i++) {
    coeffs[i] = parseInt(config.rng!(config.bits!), 2);
  }

  for (let i = 1, len = numShares + 1; i < len; i++) {
    shares[i - 1] = {
      x: i,
      y: horner(i, coeffs),
    };
  }

  return shares;
}

function constructPublicShareString(
  bits: number | string,
  id: number | string,
  data: string
): string {
  const bitsNum = typeof bits === "string" ? parseInt(bits, 10) : bits;
  const bitsBase36: Base36String = bitsNum.toString(36).toUpperCase();
  const idMax = Math.pow(2, bitsNum) - 1;

  let numericId: number;
  if (typeof id === "number") {
    numericId = id;
  } else if (typeof id === "string") {
    numericId = parseInt(id, 10);
  } else {
    numericId = NaN;
  }

  if (
    typeof numericId !== "number" ||
    numericId % 1 !== 0 ||
    numericId < 1 ||
    numericId > idMax ||
    isNaN(numericId)
  ) {
    throw new Error("Share id must be an integer between 1 and " + idMax + ", inclusive.");
  }

  const idPaddingLen = idMax.toString(config.radix!).length;
  const idHex = padLeft(numericId.toString(config.radix!), idPaddingLen);
  const newShareString = bitsBase36 + idHex + data;

  return newShareString;
}

// ============================================================================
// Public API
// ============================================================================

const SecretsLibrary = {
  /**
   * Initialize the secrets library with specified bit length and RNG type.
   *
   * This function sets up the Galois Field arithmetic tables (logs and exps)
   * required for Shamir's Secret Sharing. It must be called before using
   * share() or combine() operations.
   *
   * @param bits - Number of bits for the Galois Field (between 3 and 20, default 8).
   *               Determines the maximum number of shares (2^bits - 1).
   * @param rngType - Type of cryptographically secure random number generator to use.
   *                  If not specified, automatically detects the best available CSPRNG.
   * @throws {Error} If bits is not an integer between 3 and 20, inclusive.
   * @throws {Error} If rngType is invalid or RNG initialization fails.
   * @throws {Error} If initialization fails for any reason.
   *
   * @example
   * ```typescript
   * // Initialize with default 8 bits (max 255 shares)
   * secrets.init();
   *
   * // Initialize with 10 bits (max 1023 shares)
   * secrets.init(10);
   *
   * // Initialize with specific RNG type
   * secrets.init(8, 'nodeCryptoRandomBytes');
   * ```
   */
  init(bits?: number, rngType?: CSPRNGType): void {
    const logs: number[] = [];
    const exps: number[] = [];
    let x = 1;
    let primitive: number;

    reset();

    if (
      bits &&
      (typeof bits !== "number" ||
        bits % 1 !== 0 ||
        bits < defaults.minBits ||
        bits > defaults.maxBits)
    ) {
      throw new Error(
        "Number of bits must be an integer between " +
          defaults.minBits +
          " and " +
          defaults.maxBits +
          ", inclusive."
      );
    }

    if (rngType && CSPRNGTypes.indexOf(rngType) === -1) {
      throw new Error("Invalid RNG type argument : '" + rngType + "'");
    }

    config.radix = defaults.radix;
    config.bits = bits || defaults.bits;
    config.size = Math.pow(2, config.bits);
    config.maxShares = config.size - 1;

    primitive = defaults.primitivePolynomials[config.bits]!;

    for (let i = 0; i < config.size; i++) {
      exps[i] = x;
      logs[x] = i;
      x = x << 1;
      if (x >= config.size) {
        x = x ^ primitive;
        x = x & config.maxShares;
      }
    }

    config.logs = logs;
    config.exps = exps;

    if (rngType) {
      this.setRNG(rngType);
    }

    if (!isSetRNG()) {
      this.setRNG();
    }

    if (
      !isSetRNG() ||
      !config.bits ||
      !config.size ||
      !config.maxShares ||
      !config.logs ||
      !config.exps ||
      config.logs.length !== config.size ||
      config.exps.length !== config.size
    ) {
      throw new Error("Initialization failed.");
    }
  },

  /**
   * Combine shares to reconstruct the original secret.
   *
   * Uses Lagrange interpolation to reconstruct the secret from a threshold
   * number of shares. The shares must have been created with the same bit
   * configuration.
   *
   * @param shares - Array of share strings to combine. Must contain at least
   *                 the threshold number of shares used during secret creation.
   * @param at - Point at which to evaluate the polynomial (default 0 for secret recovery).
   *             Use non-zero values to generate new shares.
   * @returns The reconstructed secret as a hexadecimal string.
   * @throws {Error} If shares have mismatched bit settings.
   * @throws {Error} If share format is invalid.
   *
   * @example
   * ```typescript
   * const shares = secrets.share('deadbeef', 5, 3);
   * const secret = secrets.combine(shares.slice(0, 3));
   * console.log(secret); // 'deadbeef'
   * ```
   */
  combine(shares: Shares | string[], at?: number): string {
    let setBits: number | undefined;
    let share: ShareComponents;
    let splitShare: number[];
    const x: number[] = [];
    const y: number[][] = [];
    let result = "";

    at = at || 0;

    for (let i = 0, len = shares.length; i < len; i++) {
      share = this.extractShareComponents(shares[i]);

      if (setBits === undefined) {
        setBits = share.bits;
      } else if (share.bits !== setBits) {
        throw new Error("Mismatched shares: Different bit settings.");
      }

      if (config.bits !== setBits) {
        this.init(setBits);
      }

      if (x.indexOf(share.id) === -1) {
        x.push(share.id);
        splitShare = splitNumStringToIntArray(hex2bin(share.data));
        for (let j = 0, len2 = splitShare.length; j < len2; j++) {
          y[j] = y[j] || [];
          y[j][x.length - 1] = splitShare[j];
        }
      }
    }

    for (let i = 0, len = y.length; i < len; i++) {
      result = padLeft(lagrange(at, x, y[i]).toString(2)) + result;
    }

    return bin2hex(at >= 1 ? result : result.slice(result.indexOf("1") + 1));
  },

  /**
   * Get the current configuration of the secrets library.
   *
   * Returns information about the current Galois Field configuration,
   * including bit length, radix, maximum shares, and RNG status.
   *
   * @returns Configuration object with current settings.
   *
   * @example
   * ```typescript
   * const config = secrets.getConfig();
   * console.log(`Max shares: ${config.maxShares}`);
   * console.log(`Has CSPRNG: ${config.hasCSPRNG}`);
   * console.log(`RNG Type: ${config.typeCSPRNG}`);
   * ```
   */
  getConfig(): SecretsConfig {
    const obj: SecretsConfig = {
      radix: config.radix!,
      bits: config.bits!,
      maxShares: config.maxShares!,
      hasCSPRNG: isSetRNG(),
      typeCSPRNG: config.typeCSPRNG!,
    };
    return obj;
  },

  /**
   * Extract the components from a public share string.
   *
   * Parses a share string to extract the bit configuration, share ID,
   * and share data. Useful for inspecting shares or validating share format.
   *
   * @param share - The share string to parse.
   * @returns Object containing bits, id, and data components.
   * @throws {Error} If share format is invalid.
   * @throws {Error} If share ID is out of valid range.
   *
   * @example
   * ```typescript
   * const shares = secrets.share('abc123', 5, 3);
   * const components = secrets.extractShareComponents(shares[0]);
   * console.log(`Bits: ${components.bits}`);
   * console.log(`ID: ${components.id}`);
   * console.log(`Data: ${components.data}`);
   * ```
   */
  extractShareComponents(share: string): ShareComponents {
    let bits: number;
    let id: number;
    let idLen: number;
    let max: number;
    let regexStr: string;
    let shareComponents: RegExpExecArray | null;

    bits = parseInt(share.substr(0, 1), 36);

    if (
      bits &&
      (typeof bits !== "number" ||
        bits % 1 !== 0 ||
        bits < defaults.minBits ||
        bits > defaults.maxBits)
    ) {
      throw new Error(
        "Invalid share : Number of bits must be an integer between " +
          defaults.minBits +
          " and " +
          defaults.maxBits +
          ", inclusive."
      );
    }

    max = Math.pow(2, bits) - 1;
    idLen = (Math.pow(2, bits) - 1).toString(config.radix!).length;
    regexStr = "^([a-kA-K3-9]{1})([a-fA-F0-9]{" + idLen + "})([a-fA-F0-9]+)$";
    shareComponents = new RegExp(regexStr).exec(share);

    if (shareComponents) {
      id = parseInt(shareComponents[2], config.radix!);
    }

    if (typeof id! !== "number" || id! % 1 !== 0 || id! < 1 || id! > max) {
      throw new Error(
        "Invalid share : Share id must be an integer between 1 and " +
          config.maxShares +
          ", inclusive."
      );
    }

    if (shareComponents && shareComponents[3]) {
      return {
        bits: bits,
        id: id!,
        data: shareComponents[3],
      };
    }

    throw new Error("The share data provided is invalid : " + share);
  },

  /**
   * Set the random number generator to use for share generation.
   *
   * Allows specifying a custom RNG or selecting a specific CSPRNG type.
   * If no argument is provided, automatically detects and uses the best
   * available CSPRNG for the current environment.
   *
   * @param rng - Either a CSPRNG type string or a custom RNG function.
   *              Custom functions must return a binary string of specified length.
   * @returns True if RNG was successfully set.
   * @throws {Error} If RNG type is invalid.
   * @throws {Error} If custom RNG function fails validation tests.
   *
   * @example
   * ```typescript
   * // Use specific CSPRNG type
   * secrets.setRNG('nodeCryptoRandomBytes');
   *
   * // Use custom RNG function
   * secrets.setRNG((bits) => {
   *   // Return binary string of specified length
   *   return customRandomBits(bits);
   * });
   * ```
   */
  setRNG(rng?: CSPRNGType | RNGFunction): boolean {
    const errPrefix = "Random number generator is invalid ";
    const errSuffix =
      " Supply an CSPRNG of the form function(bits){} that returns a string containing 'bits' number of random 1's and 0's.";

    if (rng && typeof rng === "string" && CSPRNGTypes.indexOf(rng as CSPRNGType) === -1) {
      throw new Error("Invalid RNG type argument : '" + rng + "'");
    }

    let rngFunc: RNGFunction | undefined;

    if (!rng) {
      rngFunc = getRNG();
    } else if (typeof rng === "string") {
      rngFunc = getRNG(rng as CSPRNGType);
    } else {
      rngFunc = rng as RNGFunction;
    }

    if (runCSPRNGTest && rngFunc) {
      if (typeof rngFunc !== "function") {
        throw new Error(errPrefix + "(Not a function)." + errSuffix);
      }

      if (typeof rngFunc(config.bits!) !== "string") {
        throw new Error(errPrefix + "(Output is not a string)." + errSuffix);
      }

      if (!parseInt(rngFunc(config.bits!), 2)) {
        throw new Error(
          errPrefix + "(Binary string output not parseable to an Integer)." + errSuffix
        );
      }

      if (rngFunc(config.bits!).length > config.bits!) {
        throw new Error(errPrefix + "(Output length is greater than config.bits)." + errSuffix);
      }

      if (rngFunc(config.bits!).length < config.bits!) {
        throw new Error(errPrefix + "(Output length is less than config.bits)." + errSuffix);
      }
    }

    config.rng = rngFunc;
    return true;
  },

  /**
   * Convert a UTF-16 string to hexadecimal representation.
   *
   * Each character is represented by bytesPerChar bytes in the output.
   * Useful for converting text secrets to hex format before sharing.
   *
   * @param str - The string to convert to hexadecimal.
   * @param bytesPerChar - Number of bytes per character (1-6, default 2).
   *                       Higher values support larger character codes.
   * @returns Hexadecimal string representation.
   * @throws {Error} If input is not a string.
   * @throws {Error} If bytesPerChar is not an integer between 1 and 6.
   * @throws {Error} If character code exceeds maximum for bytesPerChar.
   *
   * @example
   * ```typescript
   * const hex = secrets.str2hex('Hello');
   * const shares = secrets.share(hex, 5, 3);
   * ```
   */
  str2hex(str: string, bytesPerChar?: number): HexString {
    let hexChars: number;
    let max: number;
    let out = "";
    let neededBytes: number;
    let num: number;

    if (typeof str !== "string") {
      throw new Error("Input must be a character string.");
    }

    if (!bytesPerChar) {
      bytesPerChar = defaults.bytesPerChar;
    }

    if (
      typeof bytesPerChar !== "number" ||
      bytesPerChar < 1 ||
      bytesPerChar > defaults.maxBytesPerChar ||
      bytesPerChar % 1 !== 0
    ) {
      throw new Error(
        "Bytes per character must be an integer between 1 and " +
          defaults.maxBytesPerChar +
          ", inclusive."
      );
    }

    hexChars = 2 * bytesPerChar;
    max = Math.pow(16, hexChars) - 1;

    for (let i = 0, len = str.length; i < len; i++) {
      num = str[i].charCodeAt(0);

      if (isNaN(num)) {
        throw new Error("Invalid character: " + str[i]);
      }

      if (num > max) {
        neededBytes = Math.ceil(Math.log(num + 1) / Math.log(256));
        throw new Error(
          "Invalid character code (" +
            num +
            "). Maximum allowable is 256^bytes-1 (" +
            max +
            "). To convert this character, use at least " +
            neededBytes +
            " bytes."
        );
      }

      out = padLeft(num.toString(16), hexChars) + out;
    }
    return out;
  },

  /**
   * Convert a hexadecimal string to UTF-16 string representation.
   *
   * Reverses the str2hex operation. Each bytesPerChar bytes in the input
   * represents one character in the output.
   *
   * @param str - The hexadecimal string to convert.
   * @param bytesPerChar - Number of bytes per character (1-6, default 2).
   *                       Must match the value used in str2hex.
   * @returns UTF-16 string representation.
   * @throws {Error} If input is not a hexadecimal string.
   * @throws {Error} If bytesPerChar is not an integer between 1 and 6.
   *
   * @example
   * ```typescript
   * const shares = secrets.share(secrets.str2hex('Hello'), 5, 3);
   * const recovered = secrets.hex2str(secrets.combine(shares));
   * console.log(recovered); // 'Hello'
   * ```
   */
  hex2str(str: string, bytesPerChar?: number): string {
    let hexChars: number;
    let out = "";

    if (typeof str !== "string") {
      throw new Error("Input must be a hexadecimal string.");
    }

    bytesPerChar = bytesPerChar || defaults.bytesPerChar;

    if (
      typeof bytesPerChar !== "number" ||
      bytesPerChar % 1 !== 0 ||
      bytesPerChar < 1 ||
      bytesPerChar > defaults.maxBytesPerChar
    ) {
      throw new Error(
        "Bytes per character must be an integer between 1 and " +
          defaults.maxBytesPerChar +
          ", inclusive."
      );
    }

    hexChars = 2 * bytesPerChar;
    str = padLeft(str, hexChars);

    for (let i = 0, len = str.length; i < len; i += hexChars) {
      out = String.fromCharCode(parseInt(str.slice(i, i + hexChars), 16)) + out;
    }

    return out;
  },

  /**
   * Generate a random hexadecimal string of specified bit length.
   *
   * Uses the configured CSPRNG to generate cryptographically secure
   * random numbers. Useful for generating random secrets.
   *
   * @param bits - Number of random bits to generate (2-65536).
   * @returns Random hexadecimal string.
   * @throws {Error} If bits is not an integer between 2 and 65536.
   *
   * @example
   * ```typescript
   * const randomSecret = secrets.random(128);
   * const shares = secrets.share(randomSecret, 5, 3);
   * ```
   */
  random(bits: number): HexString {
    if (typeof bits !== "number" || bits % 1 !== 0 || bits < 2 || bits > 65536) {
      throw new Error("Number of bits must be an Integer between 1 and 65536.");
    }

    return bin2hex(config.rng!(bits));
  },

  /**
   * Split a secret into shares using Shamir's Secret Sharing.
   *
   * Creates numShares shares such that any threshold number of shares
   * can reconstruct the original secret, but fewer shares reveal no
   * information about the secret.
   *
   * @param secret - The secret to split, as a hexadecimal string.
   * @param numShares - Total number of shares to generate (2 to 2^bits-1).
   * @param threshold - Minimum number of shares needed to reconstruct (2 to numShares).
   * @param padLength - Zero-pad the secret to a multiple of this length (0-1024, default 128).
   * @returns Array of share strings.
   * @throws {Error} If secret is not a string.
   * @throws {Error} If numShares or threshold are invalid.
   * @throws {Error} If threshold exceeds numShares.
   * @throws {Error} If padLength is invalid.
   *
   * @example
   * ```typescript
   * // Split a hex secret into 5 shares, requiring 3 to reconstruct
   * const shares = secrets.share('deadbeef', 5, 3);
   *
   * // Any 3 shares can reconstruct the secret
   * const recovered = secrets.combine([shares[0], shares[2], shares[4]]);
   * console.log(recovered); // 'deadbeef'
   * ```
   */
  share(secret: string, numShares: number, threshold: number, padLength?: number): string[] {
    let neededBits: number;
    let subShares: Share[];
    const x: (number | string)[] = new Array(numShares);
    const y: string[] = new Array(numShares);

    padLength = padLength || 128;

    if (typeof secret !== "string") {
      throw new Error("Secret must be a string.");
    }

    if (typeof numShares !== "number" || numShares % 1 !== 0 || numShares < 2) {
      throw new Error(
        "Number of shares must be an integer between 2 and 2^bits-1 (" +
          config.maxShares +
          "), inclusive."
      );
    }

    if (numShares > config.maxShares!) {
      neededBits = Math.ceil(Math.log(numShares + 1) / Math.LN2);
      throw new Error(
        "Number of shares must be an integer between 2 and 2^bits-1 (" +
          config.maxShares +
          "), inclusive. To create " +
          numShares +
          " shares, use at least " +
          neededBits +
          " bits."
      );
    }

    if (typeof threshold !== "number" || threshold % 1 !== 0 || threshold < 2) {
      throw new Error(
        "Threshold number of shares must be an integer between 2 and 2^bits-1 (" +
          config.maxShares +
          "), inclusive."
      );
    }

    if (threshold > config.maxShares!) {
      neededBits = Math.ceil(Math.log(threshold + 1) / Math.LN2);
      throw new Error(
        "Threshold number of shares must be an integer between 2 and 2^bits-1 (" +
          config.maxShares +
          "), inclusive.  To use a threshold of " +
          threshold +
          ", use at least " +
          neededBits +
          " bits."
      );
    }

    if (threshold > numShares) {
      throw new Error(
        "Threshold number of shares was " +
          threshold +
          " but must be less than or equal to the " +
          numShares +
          " shares specified as the total to generate."
      );
    }

    if (typeof padLength !== "number" || padLength % 1 !== 0 || padLength < 0 || padLength > 1024) {
      throw new Error("Zero-pad length must be an integer between 0 and 1024 inclusive.");
    }

    let secretBin = "1" + hex2bin(secret);
    const secretParts = splitNumStringToIntArray(secretBin, padLength);

    for (let i = 0, len = secretParts.length; i < len; i++) {
      subShares = getShares(secretParts[i], numShares, threshold);
      for (let j = 0; j < numShares; j++) {
        x[j] = x[j] || subShares[j].x;
        y[j] = padLeft(subShares[j].y.toString(2)) + (y[j] || "");
      }
    }

    for (let i = 0; i < numShares; i++) {
      x[i] = constructPublicShareString(config.bits!, x[i] as number, bin2hex(y[i]));
    }

    return x as string[];
  },

  /**
   * Generate a new share with a specific ID from existing shares.
   *
   * Uses Lagrange interpolation to create a new share at the specified
   * ID point. Useful for generating additional shares without access to
   * the original secret.
   *
   * @param id - The ID for the new share (1 to 2^bits-1).
   * @param shares - Array of existing shares (at least threshold number).
   * @returns New share string with the specified ID.
   * @throws {Error} If id is invalid.
   * @throws {Error} If shares array is invalid or empty.
   *
   * @example
   * ```typescript
   * const shares = secrets.share('abc123', 5, 3);
   * // Generate a new share with ID 10
   * const newShare = secrets.newShare(10, shares.slice(0, 3));
   * ```
   */
  newShare(id: number | string, shares: Shares | string[]): string {
    let share: ShareComponents;
    let numericId: number;

    if (typeof id === "string") {
      numericId = parseInt(id, 10);
    } else if (typeof id === "number") {
      numericId = Math.floor(id);
    } else {
      numericId = NaN;
    }

    if (numericId && shares && shares[0]) {
      share = this.extractShareComponents(shares[0]);
      return constructPublicShareString(share.bits, numericId, this.combine(shares, numericId));
    }

    throw new Error("Invalid 'id' or 'shares' Array argument to newShare().");
  },

  // Private functions exported for testing
  _reset: reset,
  _padLeft: padLeft,
  _hex2bin: hex2bin,
  _bin2hex: bin2hex,
  _bytesToHex: bytesToHex,
  _hasCryptoGetRandomValues: hasCryptoGetRandomValues,
  _hasCryptoRandomBytes: hasCryptoRandomBytes,
  _getRNG: getRNG,
  _isSetRNG: isSetRNG,
  _splitNumStringToIntArray: splitNumStringToIntArray,
  _horner: horner,
  _lagrange: lagrange,
  _getShares: getShares,
  _constructPublicShareString: constructPublicShareString,
};

// Initialize with default settings
SecretsLibrary.init();

// Export for different module systems
// For CommonJS/Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = SecretsLibrary;
}

// For browser globals (UMD)
if (typeof window !== "undefined") {
  (window as any).secrets = SecretsLibrary;
}

// For ES Modules
export default SecretsLibrary;

// Named exports for ES Modules
export const {
  init,
  combine,
  getConfig,
  extractShareComponents,
  setRNG,
  str2hex,
  hex2str,
  random,
  share,
  newShare,
} = SecretsLibrary;

// Re-export types for external consumers
export type {
  Base36String,
  BinaryString,
  CSPRNGType,
  HexString,
  RNGFunction,
  SecretsConfig,
  Share,
  ShareComponents,
  Shares,
} from "./types";
