import { TrustTier, VehicleTier, TrustEventType } from './enums';

/**
 * Trust Engine domain logic (spec §6). Pure, deterministic, and unit-tested — the Trust
 * module in the API delegates to these functions so scoring/gating rules live in exactly
 * one place and are shared with the mobile/web clients.
 */

/** Tiers ordered from lowest to highest progression. */
export const TRUST_TIER_ORDER: readonly TrustTier[] = [
  TrustTier.FOUNDATION,
  TrustTier.ESTABLISHED,
  TrustTier.TRUSTED,
  TrustTier.ELITE,
  TrustTier.CERTIFIED,
];

export interface TrustTierThreshold {
  readonly tier: TrustTier;
  readonly minScore: number;
  readonly minTrips: number;
  readonly minTenureMonths: number;
}

/** Tier gating thresholds (spec §6.2). A driver must satisfy all three to reach a tier. */
export const TRUST_TIER_THRESHOLDS: Record<TrustTier, TrustTierThreshold> = {
  [TrustTier.FOUNDATION]: { tier: TrustTier.FOUNDATION, minScore: 0, minTrips: 0, minTenureMonths: 0 },
  [TrustTier.ESTABLISHED]: { tier: TrustTier.ESTABLISHED, minScore: 400, minTrips: 75, minTenureMonths: 3 },
  [TrustTier.TRUSTED]: { tier: TrustTier.TRUSTED, minScore: 650, minTrips: 250, minTenureMonths: 6 },
  [TrustTier.ELITE]: { tier: TrustTier.ELITE, minScore: 850, minTrips: 600, minTenureMonths: 12 },
  [TrustTier.CERTIFIED]: { tier: TrustTier.CERTIFIED, minScore: 950, minTrips: 1000, minTenureMonths: 18 },
};

/**
 * Cumulative vehicle-tier access per trust tier (spec §6.2).
 *
 * Note: the spec's gating table names Standard/Comfort/Premium/Luxury/Exotic. EV_STANDARD
 * and XL_SUV are treated as standard-equivalent access (available from FOUNDATION), since
 * Phase 1 launches "Standard/Comfort/EV/XL".
 */
const BASE_VEHICLE_ACCESS: readonly VehicleTier[] = [
  VehicleTier.STANDARD,
  VehicleTier.EV_STANDARD,
  VehicleTier.XL_SUV,
];

export const VEHICLE_TIER_ACCESS: Record<TrustTier, readonly VehicleTier[]> = {
  [TrustTier.FOUNDATION]: BASE_VEHICLE_ACCESS,
  [TrustTier.ESTABLISHED]: [...BASE_VEHICLE_ACCESS, VehicleTier.COMFORT],
  [TrustTier.TRUSTED]: [...BASE_VEHICLE_ACCESS, VehicleTier.COMFORT, VehicleTier.PREMIUM],
  [TrustTier.ELITE]: [
    ...BASE_VEHICLE_ACCESS,
    VehicleTier.COMFORT,
    VehicleTier.PREMIUM,
    VehicleTier.LUXURY,
  ],
  [TrustTier.CERTIFIED]: [
    ...BASE_VEHICLE_ACCESS,
    VehicleTier.COMFORT,
    VehicleTier.PREMIUM,
    VehicleTier.LUXURY,
    VehicleTier.EXOTIC,
  ],
};

/** Fraction of trip gross the driver keeps, by tier (spec §6.4). */
export const DRIVER_KEEP_RATE: Record<TrustTier, number> = {
  [TrustTier.FOUNDATION]: 0.88,
  [TrustTier.ESTABLISHED]: 0.89,
  [TrustTier.TRUSTED]: 0.9,
  [TrustTier.ELITE]: 0.91,
  [TrustTier.CERTIFIED]: 0.93,
};

export interface TrustEventEffect {
  readonly scoreDelta: number;
  readonly permanentFlag: boolean;
}

/** Score deltas and permanent-flag rules per event (spec §6.3). */
export const TRUST_EVENT_EFFECTS: Record<TrustEventType, TrustEventEffect> = {
  [TrustEventType.AT_FAULT_ACCIDENT]: { scoreDelta: -200, permanentFlag: true },
  [TrustEventType.VEHICLE_DAMAGE]: { scoreDelta: -150, permanentFlag: false },
  [TrustEventType.MILEAGE_CAP_BREACH]: { scoreDelta: -75, permanentFlag: false },
  [TrustEventType.LATE_RETURN]: { scoreDelta: -50, permanentFlag: false },
  [TrustEventType.PASSENGER_COMPLAINT]: { scoreDelta: -40, permanentFlag: false },
  [TrustEventType.FUEL_NONCOMPLIANCE]: { scoreDelta: -30, permanentFlag: false },
  [TrustEventType.LATE_CANCELLATION]: { scoreDelta: -25, permanentFlag: false },
  [TrustEventType.RESPONSE_TIME_FAILURE]: { scoreDelta: -15, permanentFlag: false },
  // Slow positive drift rewards sustained clean performance (recovery, spec §6.3).
  [TrustEventType.CLEAN_BOOKING]: { scoreDelta: 5, permanentFlag: false },
  [TrustEventType.TRIP_COMPLETED]: { scoreDelta: 2, permanentFlag: false },
  // Delta supplied externally by an admin; default no-op.
  [TrustEventType.MANUAL_ADJUSTMENT]: { scoreDelta: 0, permanentFlag: false },
};

export const TRUST_SCORE_MIN = 0;
export const TRUST_SCORE_MAX = 1000;

/**
 * Normalised performance metrics (each in [0, 1]) feeding the score. "Inverted" metrics
 * (cancellation, disputes) are passed as raw rates where lower is better and inverted here.
 */
export interface TrustMetrics {
  passengerRatingAvg: number;
  tripCompletionRate: number;
  cancellationRate: number;
  onTimePickupRate: number;
  postTripConditionAvg: number;
  fuelComplianceRate: number;
  mileageCapAdherenceRate: number;
  zeroDamageStreakScore: number;
  responseTimeScore: number;
  ownerCommunicationScore: number;
  disputeRate: number;
  accountConsistencyScore: number;
}

export interface TrustDimensionBreakdown {
  /** Points contributed to the 0–1000 score by each dimension. The three sum to the score. */
  tripPerformance: number;
  vehicleCare: number;
  platformBehaviour: number;
}

type Dimension = keyof TrustDimensionBreakdown;

interface SubMetric {
  key: keyof TrustMetrics;
  dimension: Dimension;
  weight: number;
  inverted: boolean;
}

/**
 * Sub-metric weights from spec §6.1. The listed percentages sum to 120, so we use them as
 * relative weights and normalise by their total — exactly the "weighted, normalised
 * function ... scaled to 1,000" the spec calls for.
 */
const SUB_METRICS: readonly SubMetric[] = [
  { key: 'passengerRatingAvg', dimension: 'tripPerformance', weight: 20, inverted: false },
  { key: 'tripCompletionRate', dimension: 'tripPerformance', weight: 15, inverted: false },
  { key: 'cancellationRate', dimension: 'tripPerformance', weight: 10, inverted: true },
  { key: 'onTimePickupRate', dimension: 'tripPerformance', weight: 10, inverted: false },
  { key: 'postTripConditionAvg', dimension: 'vehicleCare', weight: 20, inverted: false },
  { key: 'fuelComplianceRate', dimension: 'vehicleCare', weight: 10, inverted: false },
  { key: 'mileageCapAdherenceRate', dimension: 'vehicleCare', weight: 5, inverted: false },
  { key: 'zeroDamageStreakScore', dimension: 'vehicleCare', weight: 10, inverted: false },
  { key: 'responseTimeScore', dimension: 'platformBehaviour', weight: 5, inverted: false },
  { key: 'ownerCommunicationScore', dimension: 'platformBehaviour', weight: 5, inverted: false },
  { key: 'disputeRate', dimension: 'platformBehaviour', weight: 5, inverted: true },
  { key: 'accountConsistencyScore', dimension: 'platformBehaviour', weight: 5, inverted: false },
];

const TOTAL_WEIGHT = SUB_METRICS.reduce((acc, m) => acc + m.weight, 0);

const clamp01 = (x: number): number => (Number.isNaN(x) ? 0 : Math.min(1, Math.max(0, x)));

export interface TrustScoreResult {
  score: number;
  dimensionBreakdown: TrustDimensionBreakdown;
}

/**
 * Compute a 0–1000 trust score and its per-dimension breakdown from normalised metrics.
 * The breakdown is stored on `TrustScoreSnapshot.dimensionBreakdown` for UI transparency.
 */
export function computeTrustScore(metrics: TrustMetrics): TrustScoreResult {
  const breakdown: TrustDimensionBreakdown = {
    tripPerformance: 0,
    vehicleCare: 0,
    platformBehaviour: 0,
  };

  for (const m of SUB_METRICS) {
    const raw = clamp01(metrics[m.key]);
    const value = m.inverted ? 1 - raw : raw;
    breakdown[m.dimension] += (value * m.weight) / TOTAL_WEIGHT;
  }

  breakdown.tripPerformance = Math.round(breakdown.tripPerformance * TRUST_SCORE_MAX);
  breakdown.vehicleCare = Math.round(breakdown.vehicleCare * TRUST_SCORE_MAX);
  breakdown.platformBehaviour = Math.round(breakdown.platformBehaviour * TRUST_SCORE_MAX);

  const score = clampScore(
    breakdown.tripPerformance + breakdown.vehicleCare + breakdown.platformBehaviour,
  );
  return { score, dimensionBreakdown: breakdown };
}

export function clampScore(score: number): number {
  return Math.min(TRUST_SCORE_MAX, Math.max(TRUST_SCORE_MIN, Math.round(score)));
}

/**
 * Resolve the highest tier a driver qualifies for given score, completed trips, and tenure.
 * Gating requires all three thresholds to be met (spec §6.2). Always at least FOUNDATION.
 */
export function resolveTrustTier(
  score: number,
  completedTrips: number,
  tenureMonths: number,
): TrustTier {
  for (let i = TRUST_TIER_ORDER.length - 1; i >= 0; i--) {
    const tier = TRUST_TIER_ORDER[i];
    const t = TRUST_TIER_THRESHOLDS[tier];
    if (score >= t.minScore && completedTrips >= t.minTrips && tenureMonths >= t.minTenureMonths) {
      return tier;
    }
  }
  return TrustTier.FOUNDATION;
}

export function vehicleTiersUnlocked(tier: TrustTier): readonly VehicleTier[] {
  return VEHICLE_TIER_ACCESS[tier];
}

/**
 * Authoritative gating check (spec §6.2): may a driver at `trustTier` book `vehicleTier`?
 * The Booking module MUST enforce this server-side — never client-side only (spec §15).
 */
export function canBookVehicleTier(trustTier: TrustTier, vehicleTier: VehicleTier): boolean {
  return VEHICLE_TIER_ACCESS[trustTier].includes(vehicleTier);
}

/** Fraction of trip gross the driver keeps (spec §6.4). */
export function driverKeepRate(tier: TrustTier): number {
  return DRIVER_KEEP_RATE[tier];
}

/** Platform's take fraction on the driver side = 1 − keep rate (spec §6.4, §9.1). */
export function platformDriverTakeRate(tier: TrustTier): number {
  return Number((1 - DRIVER_KEEP_RATE[tier]).toFixed(4));
}

export function trustEventEffect(type: TrustEventType): TrustEventEffect {
  return TRUST_EVENT_EFFECTS[type];
}
