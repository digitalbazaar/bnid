/*!
* Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
*/

import {
  default as chai,
  expect
} from 'chai';
import {default as chaiBytes} from 'chai-bytes';
chai.use(chaiBytes);
global.should = chai.should();

import {
  IdEncoder,
  IdDecoder,
  IdGenerator,
  generateId,
  decodeId,
  minEncodedIdBytes,
  maxEncodedIdBytes,
  generateSecretKeySeed,
  decodeSecretKeySeed,
} from '..';

describe('bnid', () => {
  describe('utilities', () => {
    it('should calculate min/max of encoded bytes', async () => {
      // [
      //   [
      //     [encoding, ...],
      //     [minBytes, ...],
      //     [maxBytes, ...]
      //   ],
      //   ...
      // ]
      // multiple encoding aliases can be listed
      // all checked for same bit lengths
      // all checked for multibase extra byte
      const bitLengths = [8, 16, 32, 64, 128, 256];
      const data = [
        [
          ['hex', 'base16', 'base16upper'],
          [2, 4, 8, 16, 32, 64],
          [2, 4, 8, 16, 32, 64]
        ],
        [
          ['base58', 'base58btc'],
          [1, 2, 4, 8, 16, 32],
          [2, 3, 6, 11, 22, 44]
        ]
      ];
      function t({name, f, encoding, bitLength, multibase, expected}) {
        const result = f({encoding, bitLength, multibase});
        result.should.equal(
          expected,
          JSON.stringify({name, encoding, bitLength, multibase, expected})
        );
      }
      for(const [encodings, minBytes, maxBytes] of data) {
        for(const encoding of encodings) {
          for(const [i, bitLength] of bitLengths.entries()) {
            t({
              name: 'min', f: minEncodedIdBytes, encoding, bitLength,
              multibase: false, expected: minBytes[i]
            });
            t({
              name: 'min', f: minEncodedIdBytes, encoding, bitLength,
              multibase: true, expected: minBytes[i] + 1
            });
            t({
              name: 'max', f: maxEncodedIdBytes, encoding, bitLength,
              multibase: false, expected: maxBytes[i]
            });
            t({
              name: 'max', f: maxEncodedIdBytes, encoding, bitLength,
              multibase: true, expected: maxBytes[i] + 1
            });
          }
        }
      }
    });
    it('should reject unknown min encoding', async () => {
      expect(() => {
        minEncodedIdBytes({
          encoding: 'baseBogus'
        });
      }).throws();
    });
    it('should reject unknown max encoding', async () => {
      expect(() => {
        maxEncodedIdBytes({
          encoding: 'baseBogus'
        });
      }).throws();
    });
  });

  describe('IdGenerator', () => {
    it('should create IdGenerator', async () => {
      const d = new IdGenerator();
      should.exist(d);
    });
    it('should generate default id', async () => {
      const d = new IdGenerator();
      should.exist(d);
      const id = await d.generate();
      should.exist(id);
      id.should.be.instanceof(Uint8Array);
      id.length.should.equal(16);
    });
    it('should generate 8 bit id', async () => {
      const d = new IdGenerator({
        bitLength: 8
      });
      should.exist(d);
      const id = await d.generate();
      should.exist(id);
      id.should.be.instanceof(Uint8Array);
      id.length.should.equal(1);
    });
    it('should not generate 0 bit id', async () => {
      expect(() => {
        new IdGenerator({
          bitLength: 0
        });
      }).throws();
    });
    it('should not generate odd bits id', async () => {
      expect(() => {
        new IdGenerator({
          bitLength: 10
        });
      }).throws();
    });
  });

  describe('IdEncoder', () => {
    describe('general', () => {
      it('should create IdEncoder', async () => {
        const e = new IdEncoder();
        should.exist(e);
      });
      it('should reject unknown encoding', async () => {
        expect(() => {
          new IdEncoder({
            encoding: 'baseBogus'
          });
        }).throws();
      });
    });
    describe('base16', () => {
      it('should create IdEncoder', async () => {
        const e = new IdEncoder({
          encoding: 'base16'
        });
        should.exist(e);
      });
      it('should b16 encode [0]', async () => {
        const e = new IdEncoder({
          encoding: 'base16',
          multibase: false
        });
        const data = new Uint8Array([0]);
        const d = e.encode(data);
        should.exist(d);
        d.should.be.a('string');
        d.length.should.equal(2);
        d.should.equal('00');
      });
      it('should multibase b16 encode [0]', async () => {
        const e = new IdEncoder({
          encoding: 'base16',
          multibase: true
        });
        const data = new Uint8Array([0]);
        const d = e.encode(data);
        should.exist(d);
        d.should.be.a('string');
        d.length.should.equal(3);
        d.should.equal('f00');
      });
      it('should multibase b16u encode [0]', async () => {
        const e = new IdEncoder({
          encoding: 'base16upper',
          multibase: true
        });
        const data = new Uint8Array([0]);
        const d = e.encode(data);
        should.exist(d);
        d.should.be.a('string');
        d.length.should.equal(3);
        d.should.equal('F00');
      });
      it('should hex encode [0]', async () => {
        const e = new IdEncoder({
          encoding: 'hex',
          multibase: false
        });
        const data = new Uint8Array([0]);
        const d = e.encode(data);
        should.exist(d);
        d.should.be.a('string');
        d.length.should.equal(2);
        d.should.equal('00');
      });
      it('should b16 encode data', async () => {
        const e = new IdEncoder({
          encoding: 'base16',
          multibase: false
        });
        const data = [
          [new Uint8Array([0x00, 0x00]), '0000'],
          [new Uint8Array([0x00, 0x01]), '0001'],
          [new Uint8Array([0x00, 0xff]), '00ff'],
          [new Uint8Array([0xff, 0x00]), 'ff00'],
          [new Uint8Array([0xff, 0xff]), 'ffff'],
        ];
        for(const [input, expected] of data) {
          const encoded = e.encode(input);
          encoded.should.equal(expected);
        }
      });
      it('should b16u encode data', async () => {
        const e = new IdEncoder({
          encoding: 'base16upper',
          multibase: false
        });
        const data = [
          [new Uint8Array([0x00, 0x00]), '0000'],
          [new Uint8Array([0x00, 0x01]), '0001'],
          [new Uint8Array([0x00, 0xff]), '00FF'],
          [new Uint8Array([0xff, 0x00]), 'FF00'],
          [new Uint8Array([0xff, 0xff]), 'FFFF'],
        ];
        for(const [input, expected] of data) {
          const encoded = e.encode(input);
          encoded.should.equal(expected);
        }
      });
      it('should b16 encode fixed input data', async () => {
        const e = new IdEncoder({
          encoding: 'base16',
          fixedLength: true,
          multibase: false
        });
        const data = [
          [new Uint8Array([0x00, 0x00]), '0000'],
          [new Uint8Array([0x00, 0x01]), '0001'],
          [new Uint8Array([0x00, 0xff]), '00ff'],
          [new Uint8Array([0xff, 0x00]), 'ff00'],
          [new Uint8Array([0xff, 0xff]), 'ffff'],
        ];
        for(const [input, expected] of data) {
          const encoded = e.encode(input);
          encoded.should.equal(expected);
        }
      });
      it('should b16 encode fixed size data', async () => {
        const e = new IdEncoder({
          encoding: 'base16',
          fixedBitLength: 32,
          multibase: false
        });
        const data = [
          [new Uint8Array([0x00, 0x00]), '00000000'],
          [new Uint8Array([0x00, 0x01]), '00000001'],
          [new Uint8Array([0x00, 0xff]), '000000ff'],
          [new Uint8Array([0xff, 0x00]), '0000ff00'],
          [new Uint8Array([0xff, 0xff]), '0000ffff'],
        ];
        for(const [input, expected] of data) {
          const encoded = e.encode(input);
          encoded.should.equal(expected);
        }
      });
      it('should not b16 encode too large fixed size data', async () => {
        const e = new IdEncoder({
          encoding: 'base16',
          fixedBitLength: 16
        });
        const data = [
          new Uint8Array([0x00, 0x00, 0x00]),
          new Uint8Array([0x00, 0x00, 0x00, 0x00]),
        ];
        for(const input of data) {
          expect(() => {
            e.encode(input);
          }).throws();
        }
      });
    });
    describe('base58', () => {
      it('should create IdEncoder', async () => {
        const e = new IdEncoder();
        should.exist(e);
      });
      it('should default b58 encode [0]', async () => {
        const e = new IdEncoder();
        const data = new Uint8Array([0]);
        const d = e.encode(data);
        should.exist(d);
        d.should.be.a('string');
        d.length.should.equal(2);
        d.should.equal('z1');
      });
      it('should explicitly b58 encode [0]', async () => {
        const e = new IdEncoder({
          encoding: 'base58',
          multibase: false
        });
        const data = new Uint8Array([0]);
        const d = e.encode(data);
        should.exist(d);
        d.should.be.a('string');
        d.length.should.equal(1);
        d.should.equal('1');
      });
      it('should non-multibase b58btc encode [0]', async () => {
        const e = new IdEncoder({
          encoding: 'base58btc',
          multibase: false
        });
        const data = new Uint8Array([0]);
        const d = e.encode(data);
        should.exist(d);
        d.should.be.a('string');
        d.length.should.equal(1);
        d.should.equal('1');
      });
      it('should multibase b58 encode [0]', async () => {
        const e = new IdEncoder({
          multibase: true
        });
        const data = new Uint8Array([0]);
        const d = e.encode(data);
        should.exist(d);
        d.should.be.a('string');
        d.length.should.equal(2);
        d.should.equal('z1');
      });
      it('should b58 encode data', async () => {
        const e = new IdEncoder({
          multibase: false
        });
        const data = [
          [[0x00, 0x00], '11'],
          [[0x00, 0x01], '12'],
          [[0x00, 0xff], '15Q'],
          [[0xff, 0x00], 'LQX'],
          [[0xff, 0xff], 'LUv'],
        ];
        for(const [input, expected] of data) {
          const encoded = e.encode(new Uint8Array(input));
          encoded.should.equal(expected);
        }
      });
      it('should b58 encode fixed input data', async () => {
        const e = new IdEncoder({
          fixedLength: true,
          multibase: false
        });
        const data = [
          [[0x00, 0x00], '111'],
          [[0x00, 0x01], '112'],
          [[0x00, 0xff], '15Q'],
          [[0xff, 0x00], 'LQX'],
          [[0xff, 0xff], 'LUv'],
        ];
        for(const [input, expected] of data) {
          const encoded = e.encode(new Uint8Array(input));
          encoded.should.equal(expected);
        }
      });
      it('should b58 encode fixed size data', async () => {
        const e = new IdEncoder({
          fixedBitLength: 32,
          multibase: false
        });
        const data = [
          [[0x00, 0x00], '111111'],
          [[0x00, 0x01], '111112'],
          [[0x00, 0xff], '11115Q'],
          [[0xff, 0x00], '111LQX'],
          [[0xff, 0xff], '111LUv'],
        ];
        for(const [input, expected] of data) {
          const encoded = e.encode(new Uint8Array(input));
          encoded.should.equal(expected);
        }
      });
      it('should not b58 encode too large fixed size data', async () => {
        const e = new IdEncoder({
          fixedBitLength: 16
        });
        const data = [
          [0x00, 0x00, 0x00],
          [0x00, 0x00, 0x00, 0x00],
        ];
        for(const input of data) {
          expect(() => {
            e.encode(new Uint8Array(input));
          }).throws();
        }
      });
    });
  });

  describe('IdDecoder', () => {
    describe('general', () => {
      it('should create IdDecoder', async () => {
        const d = new IdDecoder();
        should.exist(d);
      });
      it('should not decode empty multibase data', async () => {
        const d = new IdDecoder();
        const data = [
          ''
        ];
        for(const input of data) {
          expect(() => {
            d.decode(input);
          }).throws();
        }
      });
      it('should not decode invalid multibase data', async () => {
        const d = new IdDecoder();
        const data = [
          // invalid/unknown multibase prefix
          '@0000'
        ];
        for(const input of data) {
          expect(() => {
            d.decode(input);
          }).throws();
        }
      });
      it('should reject invalid encoding', async () => {
        const d = new IdDecoder({
          encoding: 'baseBogus',
          multibase: false
        });
        const data = [
          '00'
        ];
        for(const input of data) {
          expect(() => {
            d.decode(input);
          }).throws();
        }
      });
    });
    describe('base16', () => {
      it('should create IdDecoder', async () => {
        const d = new IdDecoder({
          encoding: 'base16'
        });
        should.exist(d);
      });
      it('should default b16 decode "00"', async () => {
        const d = new IdDecoder({
          encoding: 'base16',
          multibase: false
        });
        const e = '00';
        const b = d.decode(e);
        should.exist(b);
        b.should.be.instanceof(Uint8Array);
        b.length.should.equal(1);
        b.should.equalBytes([0]);
      });
      it('should default "hex" decode "00"', async () => {
        const d = new IdDecoder({
          encoding: 'hex',
          multibase: false
        });
        const e = '00';
        const b = d.decode(e);
        should.exist(b);
        b.should.be.instanceof(Uint8Array);
        b.length.should.equal(1);
        b.should.equalBytes([0]);
      });
      it('should b16 decode data', async () => {
        const d = new IdDecoder({
          encoding: 'base16',
          multibase: false
        });
        const data = [
          [[0x00], '00'],
          [[0xff], 'ff'],
          [[0xff], 'FF'],
          [[0x00, 0x00], '0000'],
          [[0x00, 0xff], '00ff'],
          [[0xff, 0x00], 'ff00'],
          [[0xff, 0xff], 'ffff'],
          [[0xab, 0xcd], 'abcd'],
          [[0x98, 0x76], '9876'],
          [[0x12, 0x34, 0x56], '123456'],
          [[0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef],
            '0123456789abcdef'],
          // TODO: more strict upper/lower for base16 encodings?
          [[0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef],
            '0123456789ABCDEF'],
        ];
        for(const [expected, input] of data) {
          const decoded = d.decode(input);
          decoded.should.equalBytes(expected);
        }
      });
      it('should b16 decode fixed size data', async () => {
        const d = new IdDecoder({
          encoding: 'base16',
          fixedBitLength: 16,
          multibase: false
        });
        const data = [
          [[0x00, 0x00], '00'],
          [[0x00, 0x01], '01'],
          [[0x01, 0x02], '0102'],
          [[0x01, 0x02], '000102'],
          [[0x01, 0x02], '00000102'],
        ];
        for(const [expected, input] of data) {
          const decoded = d.decode(input);
          decoded.should.equalBytes(expected);
        }
      });
      it('should b16 decode multibase data', async () => {
        const d = new IdDecoder({
          encoding: 'base16'
        });
        const data = [
          [[0x00], 'f00'],
          [[0x00, 0x00], 'f0000'],
          [[0x01, 0x02], 'f0102'],
          [[0x00, 0xff], 'f00ff'],
          [[0xff, 0x00], 'fff00'],
          [[0xff, 0xff], 'fffff'],
          [[0x00, 0x00, 0x00], 'f000000'],
          [[0x00, 0x00, 0x01], 'f000001'],
        ];
        for(const [expected, input] of data) {
          const decoded = d.decode(input);
          decoded.should.equalBytes(expected);
        }
      });
      it('should not b16 decode invalid data', async () => {
        const d = new IdDecoder({
          encoding: 'base16',
          multibase: false
        });
        const data = [
          // invalid length
          '0',
          '000'
          /* TODO: check hex data?  or assume valid input?
          '0@',
          '##',
          '0102030v',
          */
        ];
        for(const input of data) {
          expect(() => {
            d.decode(input);
          }).throws();
        }
      });
      it('should not b16 decode too large fixed size data', async () => {
        const d = new IdDecoder({
          encoding: 'base16',
          fixedBitLength: 16
        });
        const data = [
          '010203', // [0x01, 0x02, 0x03]
        ];
        for(const input of data) {
          expect(() => {
            d.decode(input);
          }).throws();
        }
      });
    });
    describe('base58', () => {
      it('should create IdDecoder', async () => {
        const d = new IdDecoder();
        should.exist(d);
      });
      it('should default b58 decode "z1"', async () => {
        const d = new IdDecoder();
        const e = 'z1';
        const b = d.decode(e);
        should.exist(b);
        b.should.be.instanceof(Uint8Array);
        b.length.should.equal(1);
        b.should.equalBytes([0]);
      });
      it('should b58 decode non-multibase data', async () => {
        const d = new IdDecoder({
          multibase: false
        });
        const data = [
          [[0x00, 0x00], '11'],
          [[0x00, 0x01], '12'],
          [[0x00, 0xff], '15Q'],
          [[0xff, 0x00], 'LQX'],
          [[0xff, 0xff], 'LUv'],
        ];
        for(const [expected, input] of data) {
          const decoded = d.decode(input);
          decoded.should.equalBytes(expected);
        }
      });
      it('should b58 decode fixed size data', async () => {
        const d = new IdDecoder({
          fixedBitLength: 16,
          multibase: false
        });
        const data = [
          [[0x00, 0x00], '111'],
          [[0x00, 0x01], '112'],
          [[0x00, 0xff], '15Q'],
          [[0xff, 0x00], 'LQX'],
          [[0xff, 0xff], 'LUv'],
          [[0x00, 0x00], '111111'],
          [[0x00, 0x01], '111112'],
          [[0x00, 0xff], '11115Q'],
          [[0xff, 0x00], '111LQX'],
          [[0xff, 0xff], '111LUv'],
        ];
        for(const [expected, input] of data) {
          const decoded = d.decode(input);
          decoded.should.equalBytes(expected);
        }
      });
      it('should b58 decode multibase data', async () => {
        const d = new IdDecoder();
        const data = [
          [[0x00, 0x00], 'z11'],
          [[0x00, 0x01], 'z12'],
          [[0x00, 0xff], 'z15Q'],
          [[0xff, 0x00], 'zLQX'],
          [[0xff, 0xff], 'zLUv'],
          [[0x00, 0x00, 0x00], 'z111'],
          [[0x00, 0x00, 0x01], 'z112'],
          [[0xff, 0xff, 0xff], 'z2UzHL'],
          [[0x00, 0x00, 0x00, 0x00], 'z1111'],
          [[0xff, 0xff, 0xff, 0xff], 'z7YXq9G'],
        ];
        for(const [expected, input] of data) {
          const decoded = d.decode(input);
          decoded.should.equalBytes(expected);
        }
      });
      it('should not b58 decode invalid data', async () => {
        const d = new IdDecoder({
          multibase: false
        });
        const data = [
          '0',
          'O',
          'I',
          'l'
        ];
        for(const input of data) {
          expect(() => {
            d.decode(input);
          }).throws();
        }
      });
      it('should not b58 decode too large fixed size data', async () => {
        const d = new IdDecoder({
          fixedBitLength: 16
        });
        const data = [
          'zfxr', // [0x01, 0xff, 0xff]
        ];
        for(const input of data) {
          expect(() => {
            d.decode(input);
          }).throws();
        }
      });
    });
  });

  describe('generateId', () => {
    it('should generate default id', async () => {
      const id = await generateId();
      should.exist(id);
      id.should.be.a('string');
      // not fixed length, so could be 'z' + 21 or 22 chars
      id.length.should.be.gte(minEncodedIdBytes(), id);
      id.length.should.be.lte(maxEncodedIdBytes(), id);
      id[0].should.equal('z');
    });
    it('should generate default non-multibase id', async () => {
      const id = await generateId({
        multibase: false
      });
      should.exist(id);
      id.should.be.a('string');
      // not fixed length, so could be 21 or 22 chars
      id.length.should.be.gte(21);
      id.length.should.be.lte(22);
    });
    it('should generate default multibase fixed length id', async () => {
      const id = await generateId({
        fixedLength: true,
        multibase: true
      });
      should.exist(id);
      id.should.be.a('string');
      id.length.should.equal(maxEncodedIdBytes());
      id[0].should.equal('z');
    });
    it('should generate 256 bit fixed length id', async () => {
      const id = await generateId({
        bitLength: 256,
        fixedLength: true,
        multibase: false
      });
      should.exist(id);
      id.should.be.a('string');
      id.length.should.equal(44);
    });
  });

  describe('decodeId', () => {
    it('should decode b16 ids', async () => {
      const data = [
        [[0x00], '00'],
        [[0x01, 0x02], '0102'],
        [[0xff, 0x00, 0xff, 0x00], 'ff00ff00']
      ];
      for(const [expected, input] of data) {
        const decoded = decodeId({
          id: input,
          encoding: 'base16',
          multibase: false
        });
        decoded.should.equalBytes(expected);
      }
    });
    it('should decode b58 ids', async () => {
      const data = [
        [[0x00, 0x00], '11'],
        [[0x00, 0x01], '12'],
        [[0x00, 0xff], '15Q'],
        [[0xff, 0x00], 'LQX'],
        [[0xff, 0xff], 'LUv'],
        [[0x00, 0x00, 0x00], '111'],
        [[0x00, 0x00, 0x01], '112'],
      ];
      for(const [expected, input] of data) {
        const decoded = decodeId({
          id: input,
          encoding: 'base58',
          multibase: false
        });
        decoded.should.equalBytes(expected);
      }
    });
    it('should decode multibase ids', async () => {
      const data = [
        [[0x00, 0x00], 'z11'],
        [[0x00, 0x01], 'z12'],
        [[0x00, 0xff], 'z15Q'],
        [[0xff, 0x00], 'zLQX'],
        [[0xff, 0xff], 'zLUv'],
        [[0x00, 0x00, 0x00], 'z111'],
        [[0x00, 0x00, 0x01], 'z112'],
        [[0x01, 0x02, 0x03], 'f010203'],
        [[0x0a, 0x0b, 0x0c], 'F0A0B0C'],
      ];
      for(const [expected, input] of data) {
        const decoded = decodeId({
          id: input
        });
        decoded.should.equalBytes(expected);
      }
    });
    it('should decode multibase fixedLength ids', async () => {
      const data = [
        [0, [], 'f'],
        [8, [0x00], 'z1'],
        [8, [0x00], 'f00'],
        [16, [0x00, 0x00], 'z1'],
        [16, [0x00, 0x00], 'z11'],
        [24, [0x00, 0x00, 0x00], 'z11'],
        [32, [0x00, 0x00, 0x00, 0x00], 'z1'],
        [32, [0x00, 0x00, 0x00, 0x00], 'z1111'],
        [24, [0x00, 0x00, 0x12], 'F12'],
        [32, [0x00, 0x00, 0x00, 0x01], 'z12'],
        [32, [0x00, 0x00, 0x00, 0xff], 'z15Q'],
        [32, [0x00, 0x00, 0xff, 0x00], 'zLQX'],
        [32, [0x00, 0x00, 0xff, 0xff], 'zLUv'],
        [32, [0x00, 0x00, 0x00, 0x00], 'z111'],
        [32, [0x00, 0x00, 0x00, 0x01], 'z112'],
        [32, [0x0a, 0x0b, 0x0c, 0x0d], 'f0a0b0c0d'],
      ];
      for(const [fixedBitLength, expected, input] of data) {
        const decoded = decodeId({
          id: input,
          fixedBitLength
        });
        decoded.should.equalBytes(expected);
      }
    });
  });
  describe('secret key seed', () => {
    it('should generate a secret key seed', async () => {
      let secretKeySeed;
      let err;
      try {
        secretKeySeed = await generateSecretKeySeed();
      } catch(e) {
        err = e;
      }
      should.exist(secretKeySeed);
      should.not.exist(err);
      secretKeySeed.should.be.a('string');
      secretKeySeed.length.should.equal(47);
    });
    it('should generate a secret key seed with bitLength of 42 * 8',
      async () => {
        let secretKeySeed;
        let err;
        const bitLength = 42 * 8;
        try {
          secretKeySeed = await generateSecretKeySeed({bitLength});
        } catch(e) {
          err = e;
        }
        should.exist(secretKeySeed);
        should.not.exist(err);
        secretKeySeed.should.be.a('string');
        secretKeySeed.length.should.equal(61);
      });
    it('should decode secret key seed', async () => {
      const secretKeySeed = 'z1Abn5R8HRLXKJvLQP1AzxFBGX2D1YdCo5d5BvvNw73nMzv';
      const expected = new Uint8Array([
        80, 174, 15, 131, 124, 59, 9, 51,
        145, 129, 92, 157, 157, 172, 161, 79,
        74, 61, 152, 152, 48, 151, 20, 89,
        225, 169, 71, 34, 49, 61, 21, 215
      ]);
      let decoded;
      let err;
      try {
        decoded = decodeSecretKeySeed({secretKeySeed});
      } catch(e) {
        err = e;
      }
      should.exist(decoded);
      should.not.exist(err);
      decoded.should.be.a('Uint8Array');
      decoded.should.eql(expected);
      decoded.byteLength.should.equal(32);
    });
    it('should decode secret key seed with expectedSize of 42',
      async () => {
        const secretKeySeed =
          'z146fHWeH32ZP1cCG3dz2ZemzvZjPcj5ycsFFanAB6X1frDDxmoAocPx5RC3A';
        const expectedSize = 42;
        const expected = new Uint8Array([
          12, 221, 206, 72, 148, 144, 98, 171, 251,
          157, 183, 76, 211, 255, 124, 101, 204, 77,
          32, 220, 135, 90, 102, 87, 222, 55, 82,
          154, 164, 35, 115, 242, 173, 73, 109, 91,
          252, 206, 191, 108, 215, 105
        ]);
        let decoded;
        let err;
        try {
          decoded = decodeSecretKeySeed({secretKeySeed, expectedSize});
        } catch(e) {
          err = e;
        }
        should.exist(decoded);
        should.not.exist(err);
        decoded.should.be.a('Uint8Array');
        decoded.should.eql(expected);
        decoded.byteLength.should.equal(42);
      });
    it('should throw error if identifier size does not match "expectedSize"',
      async () => {
        const secretKeySeed =
          'z1ehDNc1UiwtuiZ3gFRCxm63JWF8RzcY1TkAtXm8rpC3MAhUPQVaMffvKX9';
        let decoded;
        let err;
        try {
          decoded = decodeSecretKeySeed({secretKeySeed});
        } catch(e) {
          err = e;
        }
        should.not.exist(decoded);
        should.exist(err);
        err.message.should.equal('Unexpected identifier size.');
      });
    it('should throw error if multihash function code is invalid.',
      async () => {
        const secretKeySeed =
          'zNy1YDSXV7dD3XzGaj1zVP7ypX3vf66auadQ5FouvcaKjqDXWpB1zNK5KBW1';
        let decoded;
        let err;
        try {
          decoded = decodeSecretKeySeed({secretKeySeed});
        } catch(e) {
          err = e;
        }
        should.not.exist(decoded);
        should.exist(err);
        err.message.should.equal('Invalid multihash function code.');
      });
    it('should throw error if identifier size is greater than 127',
      async () => {
        let secretKeySeed;
        let err;
        const bitLength = 128 * 8;
        try {
          secretKeySeed = await generateSecretKeySeed({bitLength});
        } catch(e) {
          err = e;
        }
        should.not.exist(secretKeySeed);
        should.exist(err);
        err.message.should.equal('Identifier size too large.');
      });
    it('should throw error if decoded identifier size is greater than 127',
      async () => {
        const secretKeySeed =
          'z1219W7SyWvDy6ueLyvNirtibEkZdHpfP5BNTQG5Pv8tFKaqqnAkS7d7Pi5XeNEL' +
          '6MyCyjqURq33GYgFJPb8pjM6QmmZGY2hK53wos9XBCtcPswJPd583teDaZX9b2gn' +
          'aAfCqyY1gJ2fymS1uXUkmoBRYA5TM9LHxk5fsRiiy3Zqtp9UfHH';
        let decoded;
        let err;
        try {
          decoded = decodeSecretKeySeed({secretKeySeed});
        } catch(e) {
          err = e;
        }
        should.not.exist(decoded);
        should.exist(err);
        err.message.should.equal('Decoded identifier size too large.');
      });
  });
});
