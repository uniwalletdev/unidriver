import { Injectable } from '@nestjs/common';
import {
  canBookVehicleTier,
  computeTrustScore,
  resolveTrustTier,
  trustEventEffect,
  TrustEventEffect,
  TrustEventType,
  TrustMetrics,
  TrustScoreResult,
  TrustTier,
  VehicleTier,
} from '@unidriver/shared';

/**
 * Trust Engine boundary. Delegates to the pure, unit-tested logic in `@unidriver/shared` so
 * scoring/gating rules live in exactly one place. Persistence (snapshots, events) and nightly
 * recompute jobs are wired in Phase 2/5.
 */
@Injectable()
export class TrustService {
  computeScore(metrics: TrustMetrics): TrustScoreResult {
    return computeTrustScore(metrics);
  }

  resolveTier(score: number, completedTrips: number, tenureMonths: number): TrustTier {
    return resolveTrustTier(score, completedTrips, tenureMonths);
  }

  /** Authoritative server-side tier gating (spec §6.2, §15). */
  canBookVehicleTier(trustTier: TrustTier, vehicleTier: VehicleTier): boolean {
    return canBookVehicleTier(trustTier, vehicleTier);
  }

  effectOf(type: TrustEventType): TrustEventEffect {
    return trustEventEffect(type);
  }
}
