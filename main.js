/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
import {
  encode as base58encoder,
  decode as base58decoder
} from 'base58-universal';
import {
  getRandomBytes,
  bytesToHex,
  bytesFromHex
} from './util.js';

// multibase base58-btc header
const MULTIBASE_BASE58BTC_HEADER = 'z';
// multihash identity function cdoe
const MULTIHASH_IDENTITY_FUNCTION_CODE = 0x00;
// seed byte size
const SEED_BYTE_SIZE = 32;
const SEED_BITS_SIZE = SEED_BYTE_SIZE * 8;

function _calcOptionsBitLength({
  defaultLength,
  // TODO: allow any bit length
  minLength = 8,
  // TODO: support maxLength
  //maxLength = Infinity,
  bitLength
}) {
  if(bitLength === undefined) {
    return defaultLength;
  }
  // TODO: allow any bit length
  if(bitLength % 8 !== 0) {
    throw new Error('Bit length must be a multiple of 8.');
  }
  if(bitLength < minLength) {
    throw new Error(`Minimum bit length is ${minLength}.`);
  }
  // TODO: support maxLength
  //if(bitLength > maxLength) {
  //  throw new Error(`Maximum bit length is ${maxLength}.`);
  //}
  return bitLength;
}

function _calcDataBitLength({
  bitLength,
  maxLength
}) {
  if(maxLength === 0) {
    return bitLength;
  }
  if(bitLength > maxLength) {
    throw new Error(`Input length greater than ${maxLength} bits.`);
  }
  return maxLength;
}

function _bytesWithBitLength({
  bytes,
  bitLength
}) {
  const length = bytes.length * 8;
  if(length === bitLength) {
    return bytes;
  }
  if(length < bitLength) {
    // pad start
    const data = new Uint8Array(bitLength / 8);
    data.set(bytes, data.length - bytes.length);
    return data;
  }
  // trim start, ensure trimmed data is zero
  const start = (length - bitLength) / 8;
  if(bytes.subarray(0, start).some(d => d !== 0)) {
    throw new Error(
      `Data length greater than ${bitLength} bits.`);
  }
  return bytes.subarray(start);
}

const _log2_16 = 4;
function _base16Encoder({bytes, idEncoder}) {
  let encoded = bytesToHex(bytes);
  if(idEncoder.encoding === 'base16upper') {
    encoded = encoded.toUpperCase();
  }
  if(idEncoder.fixedLength) {
    const fixedBitLength = _calcDataBitLength({
      bitLength: bytes.length * 8,
      maxLength: idEncoder.fixedBitLength
    });
    const wantLength = Math.ceil(fixedBitLength / _log2_16);
    // pad start with 0s
    return encoded.padStart(wantLength, '0');
  }
  return encoded;
}

const _log2_58 = Math.log2(58);
function _base58Encoder({bytes, idEncoder}) {
  const encoded = base58encoder(bytes);
  if(idEncoder.fixedLength) {
    const fixedBitLength = _calcDataBitLength({
      bitLength: bytes.length * 8,
      maxLength: idEncoder.fixedBitLength
    });
    const wantLength = Math.ceil(fixedBitLength / _log2_58);
    // pad start with 0s (encoded as '1's)
    return encoded.padStart(wantLength, '1');
  }
  return encoded;
}

export class IdGenerator {
  /**
   * Creates a new IdGenerator instance.
   *
   * An IdGenerator generates an array of id bytes.
   *
   * @param {object} [options] - The options to use.
   * @param {number} [options.bitLength=128] - Number of bits to generate.
   *
   * @returns {IdGenerator} - New IdGenerator.
   */
  constructor({
    bitLength
  } = {}) {
    this.bitLength = _calcOptionsBitLength({
      // default to 128 bits / 16 bytes
      defaultLength: 128,
      // TODO: allow any bit length
      minLength: 8,
      bitLength,
    });
  }

  /**
   * Generate random id bytes.
   *
   * @returns {Uint8Array} - Array of random id bytes.
   */
  async generate() {
    const buf = new Uint8Array(this.bitLength / 8);
    await getRandomBytes(buf);
    return buf;
  }
}

export class IdEncoder {
  /**
   * Creates a new IdEncoder instance.
   *
   * An IdEncoder encodes an array of id bytes into a specific encoding.
   *
   * @param {object} [options] - The options to use.
   * @param {string} [options.encoding='base58'] - Encoding format.
   * @param {boolean} [options.fixedLength=false] - `true` to ensure fixed
   *   output length.
   * @param {number} [options.fixedBitLength] - Fixed output bit length or 0 to
   *   base on input byte size.
   * @param {boolean} [options.multibase=true] - Use multibase encoding.
   *
   * @returns {IdEncoder} - New IdEncoder.
   */
  constructor({
    encoding = 'base58',
    fixedLength = false,
    fixedBitLength,
    multibase = true
  } = {}) {
    switch(encoding) {
      case 'hex':
      case 'base16':
        this.encoder = _base16Encoder;
        this.multibasePrefix = 'f';
        break;
      case 'base16upper':
        this.encoder = _base16Encoder;
        this.multibasePrefix = 'F';
        break;
      case 'base58':
      case 'base58btc':
        this.encoder = _base58Encoder;
        this.multibasePrefix = 'z';
        break;
      default:
        throw new Error(`Unknown encoding type: "${encoding}".`);
    }
    this.fixedLength = fixedLength || fixedBitLength !== undefined;
    if(this.fixedLength) {
      this.fixedBitLength = _calcOptionsBitLength({
        // default of 0 calculates from input size
        defaultLength: 0,
        bitLength: fixedBitLength
      });
    }
    this.encoding = encoding;
    this.multibase = multibase;
  }

  /**
   * Encode id bytes into a string.
   *
   * @param {Uint8Array} bytes - Bytes to encode.
   *
   * @returns {string} - Encoded string.
   */
  encode(bytes) {
    const encoded = this.encoder({bytes, idEncoder: this});
    if(this.multibase) {
      return this.multibasePrefix + encoded;
    }
    return encoded;
  }
}

export class IdDecoder {
  /**
   * Creates a new IdDecoder instance.
   *
   * An IdDecoder decodes an id string into a byte array. It is recommended to
   * use the fixedBitLength option to avoid padding ids resulting in a larger
   * than expected byte length.
   *
   * @param {object} [options] - The options to use.
   * @param {string} [options.encoding='base58'] - Encoding format. Ignored if
   *   multibase is true.
   * @param {number} [options.fixedBitLength] - Fixed output bit length. Values
   *   with leading non-zero data will error.
   * @param {boolean} [options.multibase=true] - Use multibase encoding to
   *   detect the id format.
   *
   * @returns {IdDecoder} - New IdDecoder.
   */
  constructor({
    encoding = 'base58',
    fixedBitLength,
    multibase = true
  } = {}) {
    this.encoding = encoding;
    this.fixedBitLength = fixedBitLength;
    this.multibase = multibase;
  }

  /**
   * Decode id string into bytes.
   *
   * @param {string} id - Id to decode.
   *
   * @returns {Uint8Array} - Array of decoded id bytes.
   */
  decode(id) {
    let encoding;
    let data;
    if(this.multibase) {
      if(id.length < 1) {
        throw new Error('Multibase encoding not found.');
      }
      const prefix = id[0];
      data = id.substring(1);
      switch(id[0]) {
        case 'f':
          encoding = 'base16';
          break;
        case 'F':
          encoding = 'base16upper';
          break;
        case 'z':
          encoding = 'base58';
          break;
        default:
          throw new Error(`Unknown multibase prefix "${prefix}".`);
      }
    } else {
      encoding = this.encoding;
      data = id;
    }
    let decoded;
    switch(encoding) {
      case 'hex':
      case 'base16':
      case 'base16upper':
        if(data.length % 2 !== 0) {
          throw new Error('Invalid base16 data length.');
        }
        decoded = bytesFromHex(data);
        break;
      case 'base58':
        decoded = base58decoder(data);
        break;
      default:
        throw new Error(`Unknown encoding "${encoding}".`);
    }
    if(!decoded) {
      throw new Error(`Invalid encoded data "${data}".`);
    }
    if(this.fixedBitLength) {
      return _bytesWithBitLength({
        bytes: decoded,
        bitLength: this.fixedBitLength
      });
    }
    return decoded;
  }
}

/**
 * Generates an encoded id string from random bits.
 *
 * @param {object} [options] - The options to use. See `IdEncoder` and
 *   `IdGenerator` for available options.
 *
 * @returns {string} - Encoded string id.
 */
export async function generateId(options) {
  return new IdEncoder(options)
    .encode(await new IdGenerator(options).generate());
}

/**
 * Decodes an encoded id string to an array of bytes.
 *
 * @param {object} options - The options to use. See `IdDecoder` for available
 *   options.
 * @param {string} options.id - Id to decode.
 *
 * @returns {Uint8Array} - Decoded array of id bytes.
 */
export function decodeId(options) {
  return new IdDecoder(options).decode(options.id);
}

/**
 * Minimum number of bytes needed to encode an id of a given bit length.
 *
 * @param {object} options - The options to use.
 * @param {string} [options.encoding='base58'] - Encoding format.
 * @param {number} [options.bitLength=128] - Number of id bits.
 * @param {boolean} [options.multibase=true] - Account for multibase encoding.
 *
 * @returns {number} - The minimum number of encoded bytes.
 */
export function minEncodedIdBytes({
  encoding = 'base58',
  bitLength = 128,
  multibase = true
} = {}) {
  let plainBytes;
  switch(encoding) {
    case 'hex':
    case 'base16':
    case 'base16upper':
      plainBytes = bitLength / 4;
      break;
    case 'base58':
    case 'base58btc':
      plainBytes = bitLength / 8;
      break;
    default:
      throw new Error(`Unknown encoding type: "${encoding}".`);
  }
  return plainBytes + (multibase ? 1 : 0);
}

/**
 * Maximum number of bytes needed to encode an id of a given bit length.
 *
 * @param {object} options - The options to use.
 * @param {string} [options.encoding='base58'] - Encoding format.
 * @param {number} [options.bitLength=128] - Number of id bits.
 * @param {boolean} [options.multibase=true] - Account for multibase encoding.
 *
 * @returns {number} - The maximum number of encoded bytes.
 */
export function maxEncodedIdBytes({
  encoding = 'base58',
  bitLength = 128,
  multibase = true
} = {}) {
  let plainBytes;
  switch(encoding) {
    case 'hex':
    case 'base16':
    case 'base16upper':
      plainBytes = bitLength / 4;
      break;
    case 'base58':
    case 'base58btc':
      plainBytes = Math.ceil(bitLength / Math.log2(58));
      break;
    default:
      throw new Error(`Unknown encoding type: "${encoding}".`);
  }
  return plainBytes + (multibase ? 1 : 0);
}

/**
 * Generates a multibase seed.
 *
 * @returns {string} - A multibase seed.
 */
export async function generateMultibaseSeed() {
  // 256 bit (32 byte) random id generator
  const generator = new IdGenerator({
    bitLength: SEED_BITS_SIZE
  });
    // generate a random seed
  const seedBytes = await generator.generate();
  if(seedBytes.length !== SEED_BYTE_SIZE) {
    throw new Error('Generated seed does not match expected byte size.', {
      generatedSize: seedBytes.byteLength,
      expectedSize: SEED_BYTE_SIZE
    });
  }

  // <varint hash fn code> <varint digest size in bytes> <hash fn output>
  //  <identity function>              <32>                <seed bytes>
  const seedMultihash = new Uint8Array(2 + SEED_BYTE_SIZE);
  // <varint hash fn code>: identity function
  seedMultihash.set([MULTIHASH_IDENTITY_FUNCTION_CODE]);
  // <varint digest size in bytes>: 32
  seedMultihash.set([SEED_BYTE_SIZE], 1);
  // <hash fn output>: seed bytes
  seedMultihash.set(seedBytes, 2);

  const seedMultibase = MULTIBASE_BASE58BTC_HEADER +
      base58encoder(seedMultihash);

  return seedMultibase;
}

/**
 * Decodes a multibase seed.
 *
 * @param {object} options - The options to use.
 * @param {string} [options.seedMultibase] - The multibase seed to use.
 *
 * @returns {Uint8Array} - A 32-bytes array seed.
 */
export function decodeMultibaseSeed({seedMultibase}) {
  const prefix = seedMultibase[0];
  if(prefix !== MULTIBASE_BASE58BTC_HEADER) {
    throw new Error('Unsupported multibase encoding.');
  }
  const data = seedMultibase.substring(1);
  // <varint hash fn code> <varint digest size in bytes> <hash fn output>
  //  <identity function>              <32>                <seed bytes>
  const seedMultihash = base58decoder(data);
  // <varint hash fn code>: identity function
  const [hashFnCode] = seedMultihash.slice(0, 1);
  if(hashFnCode !== MULTIHASH_IDENTITY_FUNCTION_CODE) {
    throw new Error('Invalid multihash function code.');
  }
  // <varint digest size in bytes>: 32
  const [digestSize] = seedMultihash.slice(1, 2);
  if(digestSize !== SEED_BYTE_SIZE) {
    throw new Error('Invalid digest size.');
  }
  // <hash fn output>: seed bytes
  const seedBytes = seedMultihash.slice(2, seedMultihash.length);
  if(seedBytes.byteLength !== SEED_BYTE_SIZE) {
    throw new Error(
      `Invalid seed length. Seed must be "${SEED_BYTE_SIZE}" bytes.`);
  }

  return seedBytes;
}
