import type { Currency } from './money';
import { assertMinorUnits, MoneyError } from './money';
import { OwnerTier, PayoutStatus, TrustTier, VehicleTier } from './enums';
import { platformDriverTakeRate, driverKeepRate } from './trust';
import { ownerAccessShareRate } from './owner';

/**
 * Payout engine (spec §9). Pure, integer-cent, and conserving.
 *
 * The platform earns ONLY a revenue share on a completed paid trip's gross — never a fee
 * (spec §2 principle 1). The split is derived entirely from `grossEarningsMinor`:
 *
 *   platformTake   = round(gross * trustTierRate)        // platform's driver-side cut
 *   driverShare    = gross - platformTake                // driver keeps the remainder
 *   ownerShare     = round(gross * ownerAccessShareRate) // carved from the platform take
 *   platformGross  = platformTake - ownerShare
 *   platformNet    = platformGross - insuranceCost       // insurance always hits platform
 *
 * driverShare + ownerShare + platformGross === gross, exactly, for all inputs.
 */

export interface PayoutInput {
  grossEarningsMinor: number;
  currency: Currency;
  driverTier: TrustTier;
  ownerTier: OwnerTier;
  vehicleTier: VehicleTier;
  /** Insurance cost prorated to this trip, in minor units. Deducted from platform share. */
  insuranceCostMinor: number;
}

export interface PayoutBreakdown {
  grossEarningsMinor: number;
  currency: Currency;
  /** Platform's take fraction on the driver side (recorded for audit, spec §15). */
  driverTakeRate: number;
  /** Fraction the driver keeps (= 1 − driverTakeRate). */
  driverKeepRate: number;
  /** Owner access share fraction applied (recorded for audit, spec §15). */
  ownerTakeRate: number;
  driverShareMinor: number;
  ownerShareMinor: number;
  platformGrossMinor: number;
  insuranceCostMinor: number;
  platformNetMinor: number;
  /** True when platformNet < 0 — held for pricing review; payout still proceeds (spec §9.1). */
  flaggedForReview: boolean;
}

export function computePayout(input: PayoutInput): PayoutBreakdown {
  const { grossEarningsMinor, currency, driverTier, ownerTier, vehicleTier } = input;
  const insuranceCostMinor = input.insuranceCostMinor;

  assertMinorUnits(grossEarningsMinor);
  assertMinorUnits(insuranceCostMinor);
  if (grossEarningsMinor < 0) {
    throw new MoneyError(`Trip gross cannot be negative: ${grossEarningsMinor}`);
  }
  if (insuranceCostMinor < 0) {
    throw new MoneyError(`Insurance cost cannot be negative: ${insuranceCostMinor}`);
  }

  const driverTakeRate = platformDriverTakeRate(driverTier);
  const ownerTakeRate = ownerAccessShareRate(ownerTier, vehicleTier);

  // Platform's driver-side take, then the driver keeps the exact remainder (conserving).
  const platformTakeMinor = Math.round(grossEarningsMinor * driverTakeRate);
  const driverShareMinor = grossEarningsMinor - platformTakeMinor;

  // Owner access value is carved from the platform take.
  const ownerShareMinor = Math.round(grossEarningsMinor * ownerTakeRate);
  const platformGrossMinor = platformTakeMinor - ownerShareMinor;

  const platformNetMinor = platformGrossMinor - insuranceCostMinor;

  return {
    grossEarningsMinor,
    currency,
    driverTakeRate,
    driverKeepRate: driverKeepRate(driverTier),
    ownerTakeRate,
    driverShareMinor,
    ownerShareMinor,
    platformGrossMinor,
    insuranceCostMinor,
    platformNetMinor,
    flaggedForReview: platformNetMinor < 0,
  };
}

/** Map a computed payout to its initial status (flagged payouts still disburse). */
export function payoutStatusFor(breakdown: PayoutBreakdown): PayoutStatus {
  return breakdown.flaggedForReview ? PayoutStatus.FLAGGED_REVIEW : PayoutStatus.PENDING;
}
