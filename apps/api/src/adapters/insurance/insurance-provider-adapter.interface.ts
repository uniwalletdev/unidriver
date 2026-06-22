import { CoverageState, Region, VehicleTier } from '@unidriver/shared';

/**
 * InsuranceProviderAdapter (spec §7.2 rule 3) — Markel / Mobilitas / future providers are
 * swappable per region behind this interface. The provider binding is mocked in MVP; the
 * coverage state machine and cost accounting are real from Phase 0.
 */

export interface InsuranceQuoteParams {
  region: Region;
  tier: VehicleTier;
  agreedValueCents?: number | null;
  effectiveStart: Date;
  effectiveEnd: Date;
}

export interface InsuranceQuote {
  productRef: string;
  providerName: string;
  coverageLimitCents: number;
  perVehicleWeeklyCostCents: number;
  agreedValueRequired: boolean;
}

export interface BindParams {
  bookingId: string;
  quote: InsuranceQuote;
  effectiveStart: Date;
  effectiveEnd: Date;
}

export interface BoundPolicy {
  policyRef: string;
  coverageState: CoverageState;
  effectiveStart: Date;
  effectiveEnd: Date;
}

export interface InsuranceProviderAdapter {
  quote(params: InsuranceQuoteParams): Promise<InsuranceQuote>;
  bind(params: BindParams): Promise<BoundPolicy>;
  cancel(policyRef: string): Promise<void>;
}
