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
  decodeId
} from '..';

describe('bzid', () => {
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
      const d = new IdGenerator(8);
      should.exist(d);
      const id = await d.generate();
      should.exist(id);
      id.should.be.instanceof(Uint8Array);
      id.length.should.equal(1);
    });
    it('should not generate 0 bit id', async () => {
      expect(() => {
        new IdGenerator(0);
      }).throws();
    });
    it('should not generate odd bits id', async () => {
      expect(() => {
        new IdGenerator(10);
      }).throws();
    });
  });

  describe('IdEncoder', () => {
    describe('base16', () => {
      it('should create IdEncoder', async () => {
        const e = new IdEncoder({
          encoding: 'base16'
        });
        should.exist(e);
      });
      it('should b16 encode [0]', async () => {
        const e = new IdEncoder({
          encoding: 'base16'
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
          encoding: 'hex'
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
          encoding: 'base16'
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
          encoding: 'base16upper'
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
          fixedLength: true
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
          fixedBitLength: 32
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
        d.length.should.equal(1);
        d.should.equal('1');
      });
      it('should explicitly b58 encode [0]', async () => {
        const e = new IdEncoder({
          encoding: 'base58'
        });
        const data = new Uint8Array([0]);
        const d = e.encode(data);
        should.exist(d);
        d.should.be.a('string');
        d.length.should.equal(1);
        d.should.equal('1');
      });
      it('should b58btc encode [0]', async () => {
        const e = new IdEncoder({
          encoding: 'base58btc'
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
        const e = new IdEncoder();
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
          fixedLength: true
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
          fixedBitLength: 32
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
    it('should create IdDecoder', async () => {
      const d = new IdDecoder();
      should.exist(d);
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
          encoding: 'base16'
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
          encoding: 'base16'
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
          fixedBitLength: 16
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
          encoding: 'base16',
          multibase: true
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
          encoding: 'base16'
        });
        const data = [
          /* TODO: check hex data?  or assume valid input?
          '0@',
          '##',
          '0102030v',
          */
        ];
        for(const input of data) {
          expect(() => {
            console.log(d.decode(input));
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
      it('should default b58 decode "1"', async () => {
        const d = new IdDecoder();
        const e = '1';
        const b = d.decode(e);
        should.exist(b);
        b.should.be.instanceof(Uint8Array);
        b.length.should.equal(1);
        b.should.equalBytes([0]);
      });
      it('should b58 decode data', async () => {
        const d = new IdDecoder();
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
          fixedBitLength: 16
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
        const d = new IdDecoder({
          multibase: true
        });
        const data = [
          [[0x00, 0x00], 'z11'],
          [[0x00, 0x01], 'z12'],
          [[0x00, 0xff], 'z15Q'],
          [[0xff, 0x00], 'zLQX'],
          [[0xff, 0xff], 'zLUv'],
          [[0x00, 0x00, 0x00], 'z111'],
          [[0x00, 0x00, 0x01], 'z112'],
        ];
        for(const [expected, input] of data) {
          const decoded = d.decode(input);
          decoded.should.equalBytes(expected);
        }
      });
      it('should not b58 decode invalid data', async () => {
        const d = new IdDecoder();
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
          'fxr', // [0x01, 0xff, 0xff]
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
      // not fixed length, so could be 21 or 22 chars
      id.length.should.be.gte(21);
      id.length.should.be.lte(22);
    });
    it('should generate default multibase id', async () => {
      const id = await generateId({
        multibase: true
      });
      should.exist(id);
      id.should.be.a('string');
      // not fixed length, so could be 'z' + 21 or 22 chars
      id.length.should.be.gte(1 + 21);
      id.length.should.be.lte(1 + 22);
      id[0].should.equal('z');
    });
    it('should generate default multibase fixed length id', async () => {
      const id = await generateId({
        fixedLength: true,
        multibase: true
      });
      should.exist(id);
      id.should.be.a('string');
      id.length.should.equal(1 + 22);
      id[0].should.equal('z');
    });
    it('should generate 256 bit fixed length id', async () => {
      const id = await generateId({
        bitLength: 256,
        fixedLength: true
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
        const decoded = decodeId(input, {
          encoding: 'base16'
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
        const decoded = decodeId(input, {
          encoding: 'base58'
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
        const decoded = decodeId(input, {
          multibase: true,
        });
        decoded.should.equalBytes(expected);
      }
    });
    it('should decode multibase fixedLength ids', async () => {
      const data = [
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
        const decoded = decodeId(input, {
          multibase: true,
          fixedBitLength
        });
        decoded.should.equalBytes(expected);
      }
    });
  });
});
