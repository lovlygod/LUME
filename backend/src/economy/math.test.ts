import { describe, it, expect } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parseAmountCoinToMicro, calcTransferFeeMicro, calcTransferFeeSplit } = require('./math');

describe('economy math', () => {
  it('parses coin to micro with precision 3', () => {
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

  it('calculates 0.3/0.2 split from 0.5 total fee', () => {
    const fee = calcTransferFeeMicro(100000n);
    expect(fee.toString()).toBe('500');
    const split = calcTransferFeeSplit(fee);
    expect(split.reserveFeeMicro.toString()).toBe('300');
    expect(split.burnFeeMicro.toString()).toBe('200');
  });
});

