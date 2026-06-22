import { Inject, Injectable } from '@nestjs/common';
import { INSURANCE_PROVIDER_ADAPTER } from '../../adapters/adapters.constants';
import {
  BindParams,
  BoundPolicy,
  InsuranceProviderAdapter,
  InsuranceQuote,
  InsuranceQuoteParams,
} from '../../adapters/insurance/insurance-provider-adapter.interface';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Insurance & Claims boundary. Owns coverage binding via the swappable provider adapter and
 * the cost accounting the payout engine consumes. The provider is mocked in MVP; the state
 * machine and cost accounting are real (spec §7.2 rule 4).
 */
@Injectable()
export class InsuranceService {
  constructor(
    @Inject(INSURANCE_PROVIDER_ADAPTER) private readonly provider: InsuranceProviderAdapter,
  ) {}

  async quote(params: InsuranceQuoteParams): Promise<InsuranceQuote> {
    return this.provider.quote(params);
  }

  async bind(params: BindParams): Promise<BoundPolicy> {
    return this.provider.bind(params);
  }

  /** Prorate a weekly coverage cost to a single trip's duration, in integer cents (spec §9.1). */
  prorateWeeklyCostToTrip(weeklyCostCents: number, tripDurationMs: number): number {
    if (tripDurationMs <= 0) {
      return 0;
    }
    return Math.round((weeklyCostCents * tripDurationMs) / WEEK_MS);
  }
}
