/**
 * Payments adapter — Stripe Connect (Express accounts) in production (spec §3, §9). Models
 * marketplace transfers so the platform only ever moves money on a completed paid trip.
 */

export interface CreateConnectedAccountParams {
  userId: string;
  email: string;
  country: string;
}

export interface ConnectedAccount {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export interface TransferParams {
  destinationAccountId: string;
  amountMinor: number;
  currency: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface TransferResult {
  transferId: string;
  amountMinor: number;
  currency: string;
}

export interface PaymentsAdapter {
  createConnectedAccount(params: CreateConnectedAccountParams): Promise<ConnectedAccount>;
  getAccountStatus(accountId: string): Promise<ConnectedAccount>;
  createTransfer(params: TransferParams): Promise<TransferResult>;
}
