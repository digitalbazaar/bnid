// Node.js support
import * as crypto from 'crypto';
import {promisify} from 'util';

const randomFill = promisify(crypto.randomFill);

export async function getRandomBytes(buf) {
  return randomFill(buf);
}

export function bytesToHex(bytes) {
  return Buffer.from(bytes).toString('hex');
}

export function bytesFromHex(hex) {
  return Buffer.from(hex, 'hex');
}
