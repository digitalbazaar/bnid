/*!
* Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
*/
const Benchmark = require('benchmark');

const suite = new Benchmark.Suite();

const {
  IdGenerator, IdEncoder, IdDecoder, generateId, decodeId
} = require('..');
const crypto = require('crypto');

// shared state
const generator = new IdGenerator();
const encoder = new IdEncoder();
const decoder = new IdDecoder();

const idBytes1 = new Uint8Array(128 / 8);
crypto.randomFillSync(idBytes1);
const id1 = encoder.encode(idBytes1);

suite
  .add('generateId base16 128b not-fixed', {
    defer: true,
    fn: async deferred => {
      await generateId({
        encoding: 'base16',
        bitLength: 128,
        fixedLength: false
      });
      deferred.resolve();
    }
  })
  .add('generateId base58 128b not-fixed', {
    defer: true,
    fn: async deferred => {
      await generateId({
        encoding: 'base16',
        bitLength: 128,
        fixedLength: false
      });
      deferred.resolve();
    }
  })
  .add('generateId base58 128b fixed', {
    defer: true,
    fn: async deferred => {
      await generateId({
        encoding: 'base16',
        bitLength: 128,
        fixedLength: true
      });
      deferred.resolve();
    }
  })
  .add('IdGenerator 128b', {
    defer: true,
    fn: async deferred => {
      await new IdGenerator(128).generate();
      deferred.resolve();
    }
  })
  .add('IdGenerator shared 128b', {
    defer: true,
    fn: async deferred => {
      await generator.generate();
      deferred.resolve();
    }
  })
  .add('IdEncoder shared, static data', {
    fn: () => {
      encoder.encode(idBytes1);
    }
  })
  .add('IdDecoder shared, static data', {
    fn: () => {
      decoder.decode(id1);
    }
  })
  .add('decodeId', {
    fn: () => {
      decodeId(id1);
    }
  })
  .add('encode shared', {
    defer: true,
    fn: async deferred => {
      encoder.encode(await generator.generate());
      deferred.resolve();
    }
  })
  .on('cycle', event => {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run();
