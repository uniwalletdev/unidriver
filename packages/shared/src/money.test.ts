import { describe, it, expect } from 'vitest';
import { applyRate, assertMinorUnits, money, MoneyError, splitMinorUnits } from './money';

describe('money minor-unit guards', () => {
  it('rejects non-integer amounts', () => {
    expect(() => money(1.5, 'USD')).toThrow(MoneyError);
    expect(() => assertMinorUnits(0.1)).toThrow(MoneyError);
  });

  it('accepts safe integers', () => {
    expect(money(12345, 'USD').amountMinor).toBe(12345);
  });

  it('applyRate rounds to nearest minor unit and rejects out-of-range rates', () => {
    expect(applyRate(1000, 0.12)).toBe(120);
    expect(applyRate(333, 0.5)).toBe(167); // 166.5 -> 167 (half away from zero)
    expect(() => applyRate(1000, 1.2)).toThrow(MoneyError);
  });
});

describe('splitMinorUnits conserves every cent', () => {
  it('distributes a remainder via largest-remainder so parts sum exactly to the total', () => {
    const parts = splitMinorUnits(100, [1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
    expect(parts).toEqual([34, 33, 33]);
  });

  it('handles uneven weights without losing money', () => {
    const parts = splitMinorUnits(101, [50, 50]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(101);
    expect(parts).toEqual([51, 50]);
  });

  it('puts everything in the first bucket when all weights are zero', () => {
    expect(splitMinorUnits(10, [0, 0])).toEqual([10, 0]);
  });

  it('never creates or destroys money across many random splits', () => {
    for (let total = 0; total <= 1000; total += 7) {
      const parts = splitMinorUnits(total, [3, 5, 11, 2]);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
      expect(parts.every((p) => Number.isInteger(p) && p >= 0)).toBe(true);
    }
  });

  it('rejects negative totals', () => {
    expect(() => splitMinorUnits(-1, [1])).toThrow(MoneyError);
  });
});
