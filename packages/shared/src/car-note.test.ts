import { describe, it, expect } from 'vitest';
import { Region } from './enums';
import { computeCarNote } from './car-note';
import { MoneyError } from './money';

describe('computeCarNote (spec §10.1)', () => {
  it('computes hours-to-breakeven from monthly payment and hourly earnings', () => {
    const result = computeCarNote({ monthlyPaymentCents: 50000, avgEarningsPerHourCents: 2500 });
    expect(result.hoursToBreakeven).toBe(20);
    expect(result.daysToBreakevenAtFourHoursPerDay).toBe(5);
  });

  it('falls back to the regional default earnings rate', () => {
    const result = computeCarNote({ monthlyPaymentCents: 50000, region: Region.US });
    expect(result.avgEarningsPerHourCents).toBe(2500);
    expect(result.hoursToBreakeven).toBe(20);
  });

  it('rounds partial hours up', () => {
    expect(computeCarNote({ monthlyPaymentCents: 51000, avgEarningsPerHourCents: 2500 }).hoursToBreakeven).toBe(
      21,
    );
  });

  it('rejects a non-integer payment and a non-positive rate', () => {
    expect(() => computeCarNote({ monthlyPaymentCents: 1.5 })).toThrow(MoneyError);
    expect(() => computeCarNote({ monthlyPaymentCents: 50000, avgEarningsPerHourCents: 0 })).toThrow(
      MoneyError,
    );
  });
});
