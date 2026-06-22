import { Injectable } from '@nestjs/common';
import {
  ConnectedAccount,
  CreateConnectedAccountParams,
  PaymentsAdapter,
  TransferParams,
  TransferResult,
} from './payments-adapter.interface';

/** Phase 0 mock — returns deterministic ids, moves no real money. */
@Injectable()
export class MockPaymentsAdapter implements PaymentsAdapter {
  async createConnectedAccount(params: CreateConnectedAccountParams): Promise<ConnectedAccount> {
    return {
      accountId: `acct_mock_${params.userId}`,
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
    };
  }

  async getAccountStatus(accountId: string): Promise<ConnectedAccount> {
    return {
      accountId,
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
    };
  }

  async createTransfer(params: TransferParams): Promise<TransferResult> {
    return {
      transferId: `tr_mock_${Math.random().toString(36).slice(2, 12)}`,
      amountMinor: params.amountMinor,
      currency: params.currency,
    };
  }
}
