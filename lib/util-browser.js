// browser support
/* eslint-env browser */
const crypto = (self.crypto || self.msCrypto);

export async function getRandomBytes(buf) {
  return crypto.getRandomValues(buf);
}

export function bytesToHex(bytes) {
  return Array.from(bytes).map(d => d.toString(16).padStart(2, '0')).join('');
}

// adapted from:
/* eslint-disable-next-line max-len */
// https://stackoverflow.com/questions/43131242/how-to-convert-a-hexadecimal-string-of-data-to-an-arraybuffer-in-javascript
export function bytesFromHex(hex) {
  if(hex.length === 0) {
    return new Uint8Array();
  }
  return new Uint8Array(hex.match(/[\da-f]{2}/gi).map(h => parseInt(h, 16)));
}
