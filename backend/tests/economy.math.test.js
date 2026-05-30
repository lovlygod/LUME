const { describe, it, expect } = require('vitest');
const {
  parseAmountCoinToMicro,
  calcTransferFeeMicro,
  calcTransferFeeSplit,
} = require('../src/economy/math');

describe('economy math', () => {
  it('parses coin to micro with 3 precision', () => {
    expect(parseAmountCoinToMicro('1').toString()).toBe('1000');
    expect(parseAmountCoinToMicro('1.234').toString()).toBe('1234');
    expect(parseAmountCoinToMicro('0.001').toString()).toBe('1');
  });

  it('rejects invalid amount format', () => {
    expect(() => parseAmountCoinToMicro('0.0009')).toThrow();
    expect(() => parseAmountCoinToMicro('abc')).toThrow();
  });

  it('applies non-zero minimal fee', () => {
    expect(calcTransferFeeMicro(1n).toString()).toBe('1');
  });

  it('calculates fee split as 0.3/0.2 from 0.5 total', () => {
    const fee = calcTransferFeeMicro(100000n); // 100 coin -> fee 500 micro
    expect(fee.toString()).toBe('500');
    const split = calcTransferFeeSplit(fee);
    expect(split.reserveFeeMicro.toString()).toBe('300');
    expect(split.burnFeeMicro.toString()).toBe('200');
    expect((split.reserveFeeMicro + split.burnFeeMicro).toString()).toBe(fee.toString());
  });
});

