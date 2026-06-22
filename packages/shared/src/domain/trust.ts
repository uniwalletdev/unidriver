import { TrustEventType, TrustTier } from '../enums';
import type { TrustDimensionBreakdown } from '../trust';

/** Trust Engine domain types (spec §5.4). */

export interface TrustEvent {
  id: string;
  driverId: string;
  type: TrustEventType;
  scoreDelta: number;
  reason: string;
  bookingId: string | null;
  isPermanentFlag: boolean;
  createdAt: Date;
}

export interface TrustScoreSnapshot {
  id: string;
  driverId: string;
  score: number;
  tier: TrustTier;
  dimensionBreakdown: TrustDimensionBreakdown;
  computedAt: Date;
}
