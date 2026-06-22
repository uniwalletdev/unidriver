import { Inject, Injectable } from '@nestjs/common';
import {
  computePayout,
  payoutStatusFor,
  PayoutBreakdown,
  PayoutInput,
  PayoutStatus,
} from '@unidriver/shared';
import { PAYMENTS_ADAPTER } from '../../adapters/adapters.constants';
import { PaymentsAdapter } from '../../adapters/payments/payments-adapter.interface';

/**
 * Payments & Payout boundary. The split itself is the pure, tested `computePayout` from
 * `@unidriver/shared` (earn-when-they-earn, integer-cent safe). Disbursement goes through the
 * Stripe Connect adapter. Trip ingestion + reconciliation arrive in Phase 4.
 */
@Injectable()
export class PayoutService {
  constructor(@Inject(PAYMENTS_ADAPTER) private readonly payments: PaymentsAdapter) {}

  preview(input: PayoutInput): PayoutBreakdown {
    return computePayout(input);
  }

  statusFor(breakdown: PayoutBreakdown): PayoutStatus {
    return payoutStatusFor(breakdown);
  }

  /** Transfer the driver and owner shares to their connected accounts; returns transfer ids. */
  async disburse(
    breakdown: PayoutBreakdown,
    accounts: { driverAccountId: string; ownerAccountId: string },
  ): Promise<string[]> {
    const transfers = await Promise.all([
      this.payments.createTransfer({
        destinationAccountId: accounts.driverAccountId,
        amountMinor: breakdown.driverShareMinor,
        currency: breakdown.currency,
      }),
      this.payments.createTransfer({
        destinationAccountId: accounts.ownerAccountId,
        amountMinor: breakdown.ownerShareMinor,
        currency: breakdown.currency,
      }),
    ]);
    return transfers.map((t) => t.transferId);
  }
}
