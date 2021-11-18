# JavaScript Base-N Id Generator _(bnid)_

[![Node.js CI](https://github.com/digitalbazaar/bnid/workflows/Node.js%20CI/badge.svg)](https://github.com/digitalbazaar/bnid/actions?query=workflow%3A%22Node.js+CI%22)

> A JavaScript library for Web browsers and Node.js apps to generate random
> ids and encode and decode them using various base-N encodings.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [CLI](#cli)
- [Contribute](#contribute)
- [Commercial Support](#commercial-support)
- [License](#license)

## Background

This library provides tools for Web and Node.js to generate random ids and
encode and decode them in various base-N encodings.

## Install

### NPM

```
npm install bnid
```

### Git

To install locally (for development):

```
git clone https://github.com/digitalbazaar/bnid.git
cd bnid
npm install
```

## Usage

The interface follows the [TextEncoder][]/[TextDecoder][] interfaces and
provides [IdEncoder](#idencoder) and [IdDecoder](#iddecoder) classes. Instances
can be configured with reusable encodings and other parameters. The encoder
operates on a `Uint8Array` of input bytes. A [IdGenerator](#idgenerator) class
is provided that can be used to generate random ids with selectable bit
lengths, but any id data can be used.

The encoder and decoder support various encodings and options:

- `base16`/`hex`, `base16upper`: The simple [Base16][].
- `base58`/`base58btc`: The [Base58][] Bitcoin alphabet as supported by
  [base58-universal][].
- Optional [multibase][] type prefix.
- Fixed bit length. This is useful to ensure the output id length is constant
  even when the id starts with an arbitrary number of zeros.

The fixed length options can be important when using encodings that have
variable length outputs depending on the input length. `base58btc` is and
example. When encoding, the `fixedLength` or `fixedBitLength` options can be
used to force the output to be a constant length. When decoding, the
`fixedBitLength` options can be used to ensure a constant length array of
bytes.

### Generate an ID

To generate a default [Base58][], 128 bit, non-fixed-length, multibase encoded
id:

```js
import {generateId} from 'bnid';

const id = await generateId();
```

To generate a [Base58][], 128 bit, fixed-length id:

```js
import {generateId} from 'bnid';

const id = await generateId({
  fixedLength: true
});
```

### Reusable Components

Some setup overhead can be avoided by using the component `IdGenerator` and
`IdEncoder` classes.

```js
import {IdGenerator, IdEncoder} from 'bnid';

// 64 bit random id generator
const generator = new IdGenerator({
  bitLength: 64
});
// base58, multibase, fixed-length encoder
const encoder = new IdEncoder({
  encoding: 'base58',
  fixedLength: true,
  multibase: true
});
const id1 = encoder.encode(await generator.generate());
const id2 = encoder.encode(await generator.generate());
```

### Reusable Components

Some setup overhead can be avoided by using the component `IdGenerator` and
`IdEncoder` classes.

```js
import {IdGenerator, IdEncoder, IdDecoder} from 'bnid';

// 64 bit random id generator
const generator = new IdGenerator({
  bitLength: 64
});
// base58, multibase, fixed-length encoder
const encoder = new IdEncoder({
  encoding: 'base58',
  fixedLength: true,
  multibase: true
});
const id1 = encoder.encode(await generator.generate());
// => "z..."
const id2 = encoder.encode(await generator.generate());
// => "z..."

const decoder = new IdDecoder({
  fixedBitLength: 64,
  multibase: true
});
const id1bytes = decoder.decode(id1);
// => Uint8Array([...])
const id2bytes = decoder.decode(id2);
// => Uint8Array([...])
```

## API

### `generateId(options)`

Generate a string id. See `IdGenerator` and `IdEncoder` for options.

### `decodeId(options)`

Decode the options.id string. See `IdDecoder` for other options.

### `IdGenerator`

An `IdGenerator` generates an array of id bytes.

#### `constuctor(options)` / `constructor(bitLength)`

Options:
- `bitLength`: Number of id bits. Must be multiple of 8. (default: 128)

#### `generate()`

Generate random id bytes.

### `IdEncoder`

An `IdEncoder` encodes an array of id bytes into a specific encoding.

#### `constuctor(options)`

Options:
- `encoding`: Output encoding. (default: `base58`)
  - `base16`/`base16upper`/`hex`: base16 encoded string.
  - `base58`/`base58btc`: base58btc encoded string.
- `fixedLength`: `true` to ensure fixed output length. (default: false)
- `fixedBitLength`: fixed output bit length or 0 to base on input byte size.
  (default: 0)
- `multibase`: `true` to use multibase encoding. (default: `true`)
- `multihash`: `true` to use multihash encoding. (default: `false`)

#### `encode(bytes)`

Encode id bytes into a string.

### `IdDecoder`

An `IdDecoder` decodes a specific encoding into an array of bytes representing
an ID.

#### `constuctor(options)`

Options:
- `encoding`: Input encoding. Ignored if `multibase` is `true`. (default:
  `base58`)
  - Same options as for `IdEncoder`.
- `fixedBitLength`: fixed output bit length.  (default: none)
- `multibase`: `true` to use multibase encoding to detect id format. (default:
  `true`)
- `multihash`: `true` to use multihash encoding. (default: `false`)
- `expectedSize`: Expected size for multihash-encoded ID bytes. Use `0` to
  disable size check. (default: 32)

#### `decode(id)`

Decode id string into bytes.

### `minEncodedIdBytes(options)`

Minimum number of bytes needed to encode an id of a given bit length.

Options:
- `encoding`: Encoding. (default: `base58`)
- `bitLength`: Number of id bits. (default: 128)
- `multibase`: Account for multibase encoding. (default: true)

### `maxEncodedIdBytes(options)`

Maximum number of bytes needed to encode an id of a given bit length.

Options:
- `encoding`: Encoding. (default: `base58`)
- `bitLength`: Number of id bits. (default: 128)
- `multibase`: Account for multibase encoding. (default: true)

### `generateSecretKeySeed(options)`

`generateSecretKeySeed()` and `decodeSecretKeySeed()` methods are for creating
and decoding secret key pair seeds which can be used to generate public key
based identifiers.

`generateSecretKeySeed()` generates a secret key seed encoded as a string that
can be stored and later used to generate a key pair. The public key from
the key pair can be used as an identifier. The encoded key seed MUST be kept
secret.

```js
import {generateSecretKeySeed} from 'bnid';
const secretKeySeed = await generateSecretKeySeed();
// Example secretKeySeed: z1Aaj5A4UCsdMpXwdYAReXa4bxWYiKJtdAvB1zMzCHtCbtD
```
Options:
- `encoding`: Encoding. (default: `base58`)
- `bitLength`: Number of id bits. (default: 32 * 8)
- `multibase`: Account for multibase encoding. (default: true)
- `multihash`: Account for multihash encoding. (default: true)

### `decodeSecretKeySeed(options)`

Decodes an encoded secret key seed into an array of secret key seed bytes
(default size: 32 bytes). Both the encoded key seed and the decoded bytes MUST
be kept secret.

```js
import {decodeSecretKeySeed} from 'bnid';
const secretKeySeed = 'z1Aaj5A4UCsdMpXwdYAReXa4bxWYiKJtdAvB1zMzCHtCbtD';
decoded = decodeSecretKeySeed({secretKeySeed});
// Example decoded:
// Uint8Array(32) [
//    80, 174,  15, 131, 124,  59,   9,  51,
//   145, 129,  92, 157, 157, 172, 161,  79,
//    74,  61, 152, 152,  48, 151,  20,  89,
//   225, 169,  71,  34,  49,  61,  21, 215
// ]
```
Options:
- `secretKeySeed`: The secret key seed to be decoded.
- `multibase`: Account for multibase encoding. (default: true)
- `multihash`: Account for multihash encoding. (default: true)
- `expectedSize`: Expected size for multihash-encoded ID bytes. Use `0` to
  disable size check. (default: 32)

## CLI

A command line interface tool called `bnid` is provided to generate and encode
ids.

`bnid` can be run installed, run directly, or run via `npx`:

```
npm install -g bnid
bnid [OPTIONS]
```
```
./bnid [OPTIONS]
```
```
npx bnid [OPTIONS]
```

The options follow the API. See help for more information:

```
npx bnid --help
```

Examples:

```
npx bnid
> zL8ajDGq3G44VpTnB7UVMq2
npx bnid -e base16 --no-multibase -n 64
> da3cc9f90f9f8427
npx bnid -e base16 --no-multibase -n 64 -b 128
> 000000000000000063bb5478d65f80ab
npx bnid -n 32
z6uGJaE
npx bnid -n 32
zipFBr
# Note: -f used to ensure fixed length
npx bnid -n 32 -f
z17vsf8
npx bnid -n 32 -b 64
z111113TqAT2
```

## Contribute

Please follow the existing code style.

PRs accepted.

If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[BSD-3-Clause](LICENSE.md) © Digital Bazaar

[Base16]: https://en.wikipedia.org/wiki/Base16
[Base58]: https://en.wikipedia.org/wiki/Base58
[TextDecoder]: https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder
[TextEncoder]: https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder
[base58-universal]: https://github.com/digitalbazaar/base58-universal
[multibase]: https://github.com/multiformats/multibase
