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
   * @param {boolean} [options.multibase=false] - Use multibase encoding to
   *   detect the id format.
   *
   * @returns {IdDecoder} - New IdDecoder.
   */
  constructor({
    encoding = 'base58',
    fixedBitLength,
    multibase = false
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
