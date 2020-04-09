# JavaScript Base-N Id Generator _(bnid)_

[![Build Status](https://travis-ci.org/digitalbazaar/bnid.png?branch=master)](https://travis-ci.org/digitalbazaar/bnid)

> A JavaScript library for Web browsers and Node.js apps to generate random
> ids and encode and decode them using various base-N encodings.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
- [Contribute](#contribute)
- [Commercial Support](#commercial-support)
- [License](#license)

## Background

This library provides tools for Web and Node.js to generate random ids and
encode and decode them in various base-N encodings.

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

### Generate an ID

To generate a default [Base58][], 128 bit, non-fixed-length id:

```
import {generateId} from 'bnid';

const id = await generateId();
```

To generate a [Base58][], 128 bit, fixed-length id:

```
import {generateId} from 'bnid';

const id = await generateId({
  fixedLength: true
});
```

### Reusable Components

Some setup overhead can be avoided by using the component `IdGenerator` and
`IdEncoder` classes.

```
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

```
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

An IdGenerator generates an array of id bytes.

#### `constuctor(options)` / `constructor(bitLength)`

Options:
- `bitLength`: Number of id bits. Must be multiple of 8. (default: 128)

#### `generate()`

Generate random id bytes.

### `IdEncoder`

An IdEncoder encodes an array of id bytes into a specific encoding.

#### `constuctor(options)`

Options:
- `encoding`: Output encoding. (default: `base58`)
  - `base16`/`base16upper`/`hex`: base16 encoded string.
  - `base58`/`base58btc`: base58btc encoded string.
- `fixedLength`: `true` to ensure fixed output length. (default: false)
- `fixedBitLength`: fixed output bit length or 0 to base on input byte size.
  (default: 0)
- `multibase`: `true` to use multibase encoding. (default: `false`)

#### `encode(bytes)`

Encode id bytes into a string.

### `IdDecoder`

An IdEncoder encodes an array of id bytes into a specific encoding.

#### `constuctor(options)`

Options:
- `encoding`: Input encoding. Ignored if `multibase` is `true`. (default:
  `base58`)
  - Same options as for `IdEncoder`.
- `fixedBitLength`: fixed output bit length.  (default: none)
- `multibase`: `true` to use multibase encoding to detect id format. (default:
  `false`)

#### `decode(id)`

Decode id string into bytes.

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
