import { describe, it, expect } from 'vitest';
import { BackgroundCheckStatus, TrustTier, VehicleTier } from './enums';
import {
  driverOnboardingSteps,
  isDriverApproved,
  minimumTrustTierFor,
  tenureMonths,
  trustProgress,
} from './driver';

const ready = {
  licenceVerifiedAt: new Date('2026-09-01'),
  backgroundCheckStatus: BackgroundCheckStatus.CLEAR,
  bankAccountConnected: true,
};

describe('driver onboarding', () => {
  it('is approved only when licence, background check and payout account are all done', () => {
    expect(isDriverApproved(ready)).toBe(true);
    expect(isDriverApproved({ ...ready, bankAccountConnected: false })).toBe(false);
    expect(isDriverApproved({ ...ready, licenceVerifiedAt: null })).toBe(false);
    expect(
      isDriverApproved({ ...ready, backgroundCheckStatus: BackgroundCheckStatus.PENDING }),
    ).toBe(false);
  });

  it('sends CONSIDER to review (in progress) and blocks SUSPENDED', () => {
    const state = (s: BackgroundCheckStatus) =>
      driverOnboardingSteps({ ...ready, backgroundCheckStatus: s })[1].state;
    expect(state(BackgroundCheckStatus.CONSIDER)).toBe('IN_PROGRESS');
    expect(state(BackgroundCheckStatus.SUSPENDED)).toBe('BLOCKED');
    expect(state(BackgroundCheckStatus.NOT_STARTED)).toBe('ACTION_NEEDED');
  });
});

describe('tenureMonths', () => {
  it('counts whole months only', () => {
    expect(tenureMonths('2026-05-24', new Date('2026-09-24'))).toBe(4);
    expect(tenureMonths('2026-05-25', new Date('2026-09-24'))).toBe(3);
    expect(tenureMonths('2026-10-01', new Date('2026-09-24'))).toBe(0);
  });
});

describe('trustProgress (spec §6.2)', () => {
  it('reports which requirement holds a driver back from the next tier', () => {
    // Score already qualifies for TRUSTED; trips and tenure do not.
    const p = trustProgress(739, 94, 4);
    expect(p.tier).toBe(TrustTier.ESTABLISHED);
    expect(p.keepRate).toBe(0.89);
    expect(p.next?.tier).toBe(TrustTier.TRUSTED);
    expect(p.next?.keepRate).toBe(0.9);
    expect(p.next?.requirements.map((r) => [r.key, r.met])).toEqual([
      ['SCORE', true],
      ['TRIPS', false],
      ['TENURE_MONTHS', false],
    ]);
    expect(p.next?.unlocks).toEqual([VehicleTier.PREMIUM]);
  });

  it('has no next tier at CERTIFIED', () => {
    expect(trustProgress(990, 2000, 30).next).toBeNull();
  });
});

describe('minimumTrustTierFor', () => {
  it('maps vehicle tiers to the tier that unlocks them', () => {
    expect(minimumTrustTierFor(VehicleTier.STANDARD)).toBe(TrustTier.FOUNDATION);
    expect(minimumTrustTierFor(VehicleTier.COMFORT)).toBe(TrustTier.ESTABLISHED);
    expect(minimumTrustTierFor(VehicleTier.PREMIUM)).toBe(TrustTier.TRUSTED);
    expect(minimumTrustTierFor(VehicleTier.EXOTIC)).toBe(TrustTier.CERTIFIED);
  });
});
