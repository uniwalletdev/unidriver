import { Injectable } from '@nestjs/common';
import { CoverageState, VehicleTier } from '@unidriver/shared';
import {
  BindParams,
  BoundPolicy,
  InsuranceProviderAdapter,
  InsuranceQuote,
  InsuranceQuoteParams,
} from './insurance-provider-adapter.interface';

/** Indicative weekly coverage cost per tier, in cents. Tuned with a real broker later. */
const WEEKLY_COST_BY_TIER_CENTS: Record<VehicleTier, number> = {
  [VehicleTier.STANDARD]: 4500,
  [VehicleTier.EV_STANDARD]: 4800,
  [VehicleTier.XL_SUV]: 5200,
  [VehicleTier.COMFORT]: 6000,
  [VehicleTier.PREMIUM]: 9000,
  [VehicleTier.LUXURY]: 18000,
  [VehicleTier.EXOTIC]: 35000,
};

/** Phase 0 mock provider — real binding follows a broker partnership (spec §7.2 rule 4). */
@Injectable()
export class MockInsuranceProviderAdapter implements InsuranceProviderAdapter {
  async quote(params: InsuranceQuoteParams): Promise<InsuranceQuote> {
    const agreedValueRequired =
      params.tier === VehicleTier.LUXURY || params.tier === VehicleTier.EXOTIC;
    return {
      productRef: `prod_mock_${params.region}_${params.tier}`,
      providerName: 'MockMarkel',
      coverageLimitCents: 100_000_00,
      perVehicleWeeklyCostCents: WEEKLY_COST_BY_TIER_CENTS[params.tier],
      agreedValueRequired,
    };
  }

  async bind(params: BindParams): Promise<BoundPolicy> {
    return {
      policyRef: `pol_mock_${params.bookingId}`,
      coverageState: CoverageState.COMMERCIAL_ACTIVE,
      effectiveStart: params.effectiveStart,
      effectiveEnd: params.effectiveEnd,
    };
  }

  async cancel(_policyRef: string): Promise<void> {
    // No-op in the mock.
  }
}
