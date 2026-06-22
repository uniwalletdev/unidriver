import { describe, it, expect } from 'vitest';
import { MoneyError } from './money';
import { OwnerTier, PayoutStatus, TrustTier, VehicleTier } from './enums';
import { computePayout, payoutStatusFor, PayoutInput } from './payout';

const base: Omit<PayoutInput, 'grossEarningsMinor'> = {
  currency: 'USD',
  driverTier: TrustTier.FOUNDATION,
  ownerTier: OwnerTier.LISTED,
  vehicleTier: VehicleTier.STANDARD,
  insuranceCostMinor: 0,
};

describe('earn-when-they-earn (spec §2.1, §15)', () => {
  it('takes zero platform revenue when a trip earns nothing', () => {
    const p = computePayout({ ...base, grossEarningsMinor: 0 });
    expect(p.driverShareMinor).toBe(0);
    expect(p.ownerShareMinor).toBe(0);
    expect(p.platformGrossMinor).toBe(0);
  });

  it('never derives platform revenue from anything but trip gross', () => {
    // Across every tier combination, with zero gross the platform gross is always zero —
    // there is no fixed fee path.
    for (const driverTier of Object.values(TrustTier)) {
      for (const ownerTier of Object.values(OwnerTier)) {
        for (const vehicleTier of Object.values(VehicleTier)) {
          const p = computePayout({
            grossEarningsMinor: 0,
            currency: 'USD',
            driverTier,
            ownerTier,
            vehicleTier,
            insuranceCostMinor: 0,
          });
          expect(p.platformGrossMinor).toBe(0);
          expect(p.driverShareMinor).toBe(0);
          expect(p.ownerShareMinor).toBe(0);
        }
      }
    }
  });
});

describe('cent conservation (spec §15)', () => {
  it('driverShare + ownerShare + platformGross === gross for all inputs', () => {
    const grosses = [1, 99, 100, 333, 1000, 4567, 10000, 999999];
    for (const grossEarningsMinor of grosses) {
      for (const driverTier of Object.values(TrustTier)) {
        for (const ownerTier of Object.values(OwnerTier)) {
          for (const vehicleTier of Object.values(VehicleTier)) {
            const p = computePayout({
              grossEarningsMinor,
              currency: 'USD',
              driverTier,
              ownerTier,
              vehicleTier,
              insuranceCostMinor: 0,
            });
            expect(p.driverShareMinor + p.ownerShareMinor + p.platformGrossMinor).toBe(
              grossEarningsMinor,
            );
            expect(Number.isInteger(p.driverShareMinor)).toBe(true);
            expect(Number.isInteger(p.ownerShareMinor)).toBe(true);
            expect(Number.isInteger(p.platformGrossMinor)).toBe(true);
          }
        }
      }
    }
  });
});

describe('trust-tier rate applied to driver share (spec §6.4, §9.1)', () => {
  it('a FOUNDATION driver keeps 88% of a $100 trip', () => {
    const p = computePayout({ ...base, grossEarningsMinor: 10000 });
    expect(p.driverShareMinor).toBe(8800);
    expect(p.driverTakeRate).toBe(0.12);
  });

  it('a CERTIFIED driver keeps 93%', () => {
    const p = computePayout({
      ...base,
      grossEarningsMinor: 10000,
      driverTier: TrustTier.CERTIFIED,
    });
    expect(p.driverShareMinor).toBe(9300);
    expect(p.driverTakeRate).toBe(0.07);
  });
});

describe('audit fields and pricing-review flag (spec §9.1, §15)', () => {
  it('records driverTakeRate, ownerTakeRate and insuranceCost on every payout', () => {
    const p = computePayout({ ...base, grossEarningsMinor: 10000, insuranceCostMinor: 250 });
    expect(typeof p.driverTakeRate).toBe('number');
    expect(typeof p.ownerTakeRate).toBe('number');
    expect(p.insuranceCostMinor).toBe(250);
    // Owner (LISTED + STANDARD) takes 4%; platform take is 12% → platform gross 8%.
    expect(p.ownerShareMinor).toBe(400);
    expect(p.platformGrossMinor).toBe(800);
  });

  it('flags the booking for review when insurance exceeds platform share, but still pays out', () => {
    const p = computePayout({ ...base, grossEarningsMinor: 10000, insuranceCostMinor: 5000 });
    expect(p.platformNetMinor).toBeLessThan(0);
    expect(p.flaggedForReview).toBe(true);
    expect(payoutStatusFor(p)).toBe(PayoutStatus.FLAGGED_REVIEW);
    // Users are still paid their full shares — the flag never blocks disbursement.
    expect(p.driverShareMinor).toBe(8800);
    expect(p.ownerShareMinor).toBe(400);
  });

  it('is not flagged when the platform stays whole', () => {
    const p = computePayout({ ...base, grossEarningsMinor: 10000, insuranceCostMinor: 100 });
    expect(p.flaggedForReview).toBe(false);
    expect(payoutStatusFor(p)).toBe(PayoutStatus.PENDING);
  });

  it('rejects negative gross', () => {
    expect(() => computePayout({ ...base, grossEarningsMinor: -1 })).toThrow(MoneyError);
  });
});
