import type { Currency } from '../money';
import { PayoutStatus } from '../enums';

/** Payments & Payout domain types (spec §5.5). Every rate is recorded for audit (spec §15). */

export interface Payout {
  id: string;
  bookingId: string;
  tripId: string;
  ownerId: string;
  driverId: string;
  grossEarningsCents: number;
  ownerShareCents: number;
  driverShareCents: number;
  platformShareCents: number;
  insuranceCostCents: number;
  currency: Currency;
  ownerTakeRate: number;
  driverTakeRate: number;
  status: PayoutStatus;
  stripeTransferIds: string[];
  createdAt: Date;
}
