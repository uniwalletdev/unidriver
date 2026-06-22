import {
  ClaimStatus,
  ClaimType,
  CoverageState,
  Region,
  VehicleTier,
} from '../enums';

/** Insurance & Claims domain types (spec §5.6). */

export interface InsuranceProduct {
  id: string;
  region: Region;
  tier: VehicleTier;
  providerName: string;
  coverageLimitCents: number;
  perVehicleWeeklyCostCents: number;
  agreedValueRequired: boolean;
}

/** Ties a booking to active coverage — required before a booking may go ACTIVE (spec §7). */
export interface InsuranceBinding {
  id: string;
  bookingId: string;
  productId: string;
  coverageState: CoverageState;
  effectiveStart: Date;
  effectiveEnd: Date;
  policyRef: string;
}

export interface Claim {
  id: string;
  bookingId: string;
  vehicleId: string;
  reportedBy: string;
  type: ClaimType;
  amountClaimedCents: number;
  amountApprovedCents: number | null;
  status: ClaimStatus;
  slaDueAt: Date;
  evidence: string[];
  createdAt: Date;
}
