import { describe, it, expect } from 'vitest';
import { TrustTier, VehicleTier } from './enums';
import {
  canBookVehicleTier,
  computeTrustScore,
  driverKeepRate,
  platformDriverTakeRate,
  resolveTrustTier,
  TrustMetrics,
} from './trust';

const perfectMetrics: TrustMetrics = {
  passengerRatingAvg: 1,
  tripCompletionRate: 1,
  cancellationRate: 0,
  onTimePickupRate: 1,
  postTripConditionAvg: 1,
  fuelComplianceRate: 1,
  mileageCapAdherenceRate: 1,
  zeroDamageStreakScore: 1,
  responseTimeScore: 1,
  ownerCommunicationScore: 1,
  disputeRate: 0,
  accountConsistencyScore: 1,
};

describe('resolveTrustTier gating (spec §6.2)', () => {
  it('starts every driver at FOUNDATION', () => {
    expect(resolveTrustTier(0, 0, 0)).toBe(TrustTier.FOUNDATION);
  });

  it('requires score, trips AND tenure for promotion', () => {
    expect(resolveTrustTier(500, 100, 4)).toBe(TrustTier.ESTABLISHED);
    expect(resolveTrustTier(700, 300, 7)).toBe(TrustTier.TRUSTED);
    expect(resolveTrustTier(900, 650, 13)).toBe(TrustTier.ELITE);
    expect(resolveTrustTier(990, 1200, 24)).toBe(TrustTier.CERTIFIED);
  });

  it('caps the tier at the weakest qualifying dimension', () => {
    // Score & tenure would allow CERTIFIED, but only 100 trips → caps at ESTABLISHED.
    expect(resolveTrustTier(990, 100, 24)).toBe(TrustTier.ESTABLISHED);
  });
});

describe('canBookVehicleTier gating (spec §6.2)', () => {
  it('blocks vehicles above the driver unlocked set', () => {
    expect(canBookVehicleTier(TrustTier.FOUNDATION, VehicleTier.STANDARD)).toBe(true);
    expect(canBookVehicleTier(TrustTier.FOUNDATION, VehicleTier.EV_STANDARD)).toBe(true);
    expect(canBookVehicleTier(TrustTier.FOUNDATION, VehicleTier.XL_SUV)).toBe(true);
    expect(canBookVehicleTier(TrustTier.FOUNDATION, VehicleTier.LUXURY)).toBe(false);
    expect(canBookVehicleTier(TrustTier.ESTABLISHED, VehicleTier.COMFORT)).toBe(true);
    expect(canBookVehicleTier(TrustTier.ESTABLISHED, VehicleTier.PREMIUM)).toBe(false);
    expect(canBookVehicleTier(TrustTier.TRUSTED, VehicleTier.PREMIUM)).toBe(true);
    expect(canBookVehicleTier(TrustTier.ELITE, VehicleTier.LUXURY)).toBe(true);
    expect(canBookVehicleTier(TrustTier.ELITE, VehicleTier.EXOTIC)).toBe(false);
    expect(canBookVehicleTier(TrustTier.CERTIFIED, VehicleTier.EXOTIC)).toBe(true);
  });
});

describe('trust-tier revenue rates (spec §6.4)', () => {
  it('rewards higher tiers with a larger keep rate', () => {
    expect(driverKeepRate(TrustTier.FOUNDATION)).toBe(0.88);
    expect(driverKeepRate(TrustTier.CERTIFIED)).toBe(0.93);
    expect(platformDriverTakeRate(TrustTier.FOUNDATION)).toBe(0.12);
    expect(platformDriverTakeRate(TrustTier.CERTIFIED)).toBe(0.07);
  });
});

describe('computeTrustScore (spec §6.1)', () => {
  it('awards a perfect 1000 and a breakdown that sums to the score', () => {
    const { score, dimensionBreakdown } = computeTrustScore(perfectMetrics);
    expect(score).toBe(1000);
    const sum =
      dimensionBreakdown.tripPerformance +
      dimensionBreakdown.vehicleCare +
      dimensionBreakdown.platformBehaviour;
    expect(sum).toBe(score);
  });

  it('floors at 0 for worst-case performance', () => {
    const worst: TrustMetrics = {
      passengerRatingAvg: 0,
      tripCompletionRate: 0,
      cancellationRate: 1,
      onTimePickupRate: 0,
      postTripConditionAvg: 0,
      fuelComplianceRate: 0,
      mileageCapAdherenceRate: 0,
      zeroDamageStreakScore: 0,
      responseTimeScore: 0,
      ownerCommunicationScore: 0,
      disputeRate: 1,
      accountConsistencyScore: 0,
    };
    expect(computeTrustScore(worst).score).toBe(0);
  });

  it('clamps out-of-range inputs', () => {
    const score = computeTrustScore({ ...perfectMetrics, passengerRatingAvg: 5 }).score;
    expect(score).toBe(1000);
  });
});
