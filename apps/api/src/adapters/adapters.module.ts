import { Global, Module } from '@nestjs/common';
import {
  BACKGROUND_CHECK_ADAPTER,
  INSURANCE_PROVIDER_ADAPTER,
  PAYMENTS_ADAPTER,
  TELEMATICS_ADAPTER,
} from './adapters.constants';
import { MockPaymentsAdapter } from './payments/mock-payments.adapter';
import { MockBackgroundCheckAdapter } from './background-check/mock-background-check.adapter';
import { MockTelematicsAdapter } from './telematics/mock-telematics.adapter';
import { MockInsuranceProviderAdapter } from './insurance/mock-insurance-provider.adapter';

/**
 * Binds every external integration behind a token. In Phase 0 all four resolve to mocks
 * (spec §14); later phases switch on `config.adapterMode` to live Stripe/Checkr/Smartcar and
 * a real insurance provider — without changing any consumer.
 */
@Global()
@Module({
  providers: [
    { provide: PAYMENTS_ADAPTER, useClass: MockPaymentsAdapter },
    { provide: BACKGROUND_CHECK_ADAPTER, useClass: MockBackgroundCheckAdapter },
    { provide: TELEMATICS_ADAPTER, useClass: MockTelematicsAdapter },
    { provide: INSURANCE_PROVIDER_ADAPTER, useClass: MockInsuranceProviderAdapter },
  ],
  exports: [
    PAYMENTS_ADAPTER,
    BACKGROUND_CHECK_ADAPTER,
    TELEMATICS_ADAPTER,
    INSURANCE_PROVIDER_ADAPTER,
  ],
})
export class AdaptersModule {}
