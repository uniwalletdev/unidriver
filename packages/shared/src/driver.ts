import { BackgroundCheckStatus, FuelPolicy, TrustTier, VehicleTier } from './enums';
import {
  canBookVehicleTier,
  driverKeepRate,
  resolveTrustTier,
  TRUST_TIER_ORDER,
  TRUST_TIER_THRESHOLDS,
} from './trust';

/**
 * Driver-side rules (spec §6, Phase 2): onboarding readiness, tier progress, and the redacted
 * vehicle projection drivers browse. Pure and shared so the mobile app renders exactly what the
 * API enforces.
 */

export interface RegisterDriverInput {
  fullName: string;
  email: string;
  phone: string;
  licenceNumber: string;
  /** Two-letter issuing state, e.g. "TX". */
  licenceState: string;
}

/** The subset of DriverProfile that decides whether a driver may book. */
export interface DriverReadinessInput {
  licenceVerifiedAt: Date | string | null;
  backgroundCheckStatus: BackgroundCheckStatus;
  bankAccountConnected: boolean;
}

export type OnboardingStepKey = 'LICENCE' | 'BACKGROUND_CHECK' | 'PAYOUT_ACCOUNT';
export type OnboardingStepState = 'DONE' | 'IN_PROGRESS' | 'ACTION_NEEDED' | 'BLOCKED';

export interface OnboardingStep {
  key: OnboardingStepKey;
  state: OnboardingStepState;
}

/** Checklist shown on "Get approved" (D1). Order is the order drivers complete it in. */
export function driverOnboardingSteps(p: DriverReadinessInput): OnboardingStep[] {
  const check = p.backgroundCheckStatus;
  const checkState: OnboardingStepState =
    check === BackgroundCheckStatus.CLEAR
      ? 'DONE'
      : check === BackgroundCheckStatus.SUSPENDED
        ? 'BLOCKED'
        : check === BackgroundCheckStatus.NOT_STARTED
          ? 'ACTION_NEEDED'
          : // PENDING, and CONSIDER (which goes to a human reviewer, never auto-rejected).
            'IN_PROGRESS';
  return [
    { key: 'LICENCE', state: p.licenceVerifiedAt ? 'DONE' : 'IN_PROGRESS' },
    { key: 'BACKGROUND_CHECK', state: checkState },
    { key: 'PAYOUT_ACCOUNT', state: p.bankAccountConnected ? 'DONE' : 'ACTION_NEEDED' },
  ];
}

/** A driver may book once every onboarding step is done. The server re-checks at booking. */
export function isDriverApproved(p: DriverReadinessInput): boolean {
  return driverOnboardingSteps(p).every((s) => s.state === 'DONE');
}

/** Whole months between joining and `now` (tenure counts toward tiers, spec §6.2). */
export function tenureMonths(joinedAt: Date | string, now: Date = new Date()): number {
  const start = new Date(joinedAt);
  let months =
    (now.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - start.getUTCMonth());
  if (now.getUTCDate() < start.getUTCDate()) {
    months -= 1;
  }
  return Math.max(0, months);
}

export interface TierRequirement {
  key: 'SCORE' | 'TRIPS' | 'TENURE_MONTHS';
  have: number;
  need: number;
  met: boolean;
}

export interface TrustProgress {
  tier: TrustTier;
  keepRate: number;
  unlockedVehicleTiers: readonly VehicleTier[];
  /** Null at the top tier. */
  next: {
    tier: TrustTier;
    keepRate: number;
    requirements: TierRequirement[];
    /** Vehicle tiers the next tier adds. */
    unlocks: VehicleTier[];
  } | null;
}

/**
 * Where a driver stands and what stands between them and the next tier (D2). Because a tier
 * needs score, trips and tenure together, each requirement is reported separately so the app
 * can name the one actually holding the driver back.
 */
export function trustProgress(
  score: number,
  completedTrips: number,
  months: number,
): TrustProgress {
  const tier = resolveTrustTier(score, completedTrips, months);
  const unlocked = VEHICLE_TIERS.filter((v) => canBookVehicleTier(tier, v));
  const idx = TRUST_TIER_ORDER.indexOf(tier);
  const nextTier = TRUST_TIER_ORDER[idx + 1];
  if (!nextTier) {
    return { tier, keepRate: driverKeepRate(tier), unlockedVehicleTiers: unlocked, next: null };
  }
  const t = TRUST_TIER_THRESHOLDS[nextTier];
  const req = (key: TierRequirement['key'], have: number, need: number): TierRequirement => ({
    key,
    have,
    need,
    met: have >= need,
  });
  return {
    tier,
    keepRate: driverKeepRate(tier),
    unlockedVehicleTiers: unlocked,
    next: {
      tier: nextTier,
      keepRate: driverKeepRate(nextTier),
      requirements: [
        req('SCORE', score, t.minScore),
        req('TRIPS', completedTrips, t.minTrips),
        req('TENURE_MONTHS', months, t.minTenureMonths),
      ],
      unlocks: VEHICLE_TIERS.filter(
        (v) => canBookVehicleTier(nextTier, v) && !canBookVehicleTier(tier, v),
      ),
    },
  };
}

const VEHICLE_TIERS = Object.values(VehicleTier);

/** Lowest trust tier allowed to book a vehicle tier (shown on locked cars in D3). */
export function minimumTrustTierFor(vehicleTier: VehicleTier): TrustTier {
  const tier = TRUST_TIER_ORDER.find((t) => canBookVehicleTier(t, vehicleTier));
  if (!tier) {
    throw new Error(`No trust tier can book ${vehicleTier}`);
  }
  return tier;
}

/**
 * What a driver sees of a listed car before booking. No VIN, plate or owner identity; the
 * handoff address is revealed only on a confirmed booking (Phase 3).
 */
export interface DiscoverableVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  tier: VehicleTier;
  fuelPolicy: FuelPolicy;
  mileageCapPerBooking: number | null;
  /** True when the driver's tier cannot book this car. */
  locked: boolean;
  /** The trust tier that unlocks it. */
  requiredTrustTier: TrustTier;
}

/** `GET /api/drivers/me` — everything the driver app's Get approved and Trust screens need. */
export interface DriverAccount {
  id: string;
  fullName: string;
  email: string;
  region: string;
  licenceState: string;
  /** Last 4 characters only; the full licence number never leaves the server. */
  licenceLast4: string;
  backgroundCheckStatus: BackgroundCheckStatus;
  bankAccountConnected: boolean;
  trustScore: number;
  completedTrips: number;
  tenureMonths: number;
  onboarding: OnboardingStep[];
  approved: boolean;
  progress: TrustProgress;
}
