import { OwnerTier, VehicleTier } from './enums';

/**
 * Owner loyalty + vehicle-access share configuration (spec §5.1, §9.3).
 *
 * The owner's "share" is the vehicle-access value paid to the owner per trip. Per spec §9
 * this split is "still being tuned", so it is intentionally expressed as configurable tables
 * rather than hard-coded into the payout math. The applied rate is recorded on every Payout
 * row for auditability (spec §15).
 */

export const OWNER_TIER_ORDER: readonly OwnerTier[] = [
  OwnerTier.LISTED,
  OwnerTier.ACTIVE,
  OwnerTier.PREMIER,
  OwnerTier.ELITE_FLEET,
];

/**
 * Base owner access share as a fraction of trip gross, by vehicle tier. Kept modest because
 * the owner share is carved from the platform's driver-side take (spec §9.1); richer tiers
 * intentionally trend toward the pricing-review flag until bespoke pricing is set (spec §7).
 */
export const OWNER_BASE_ACCESS_RATE: Record<VehicleTier, number> = {
  [VehicleTier.STANDARD]: 0.04,
  [VehicleTier.EV_STANDARD]: 0.04,
  [VehicleTier.XL_SUV]: 0.045,
  [VehicleTier.COMFORT]: 0.05,
  [VehicleTier.PREMIUM]: 0.055,
  [VehicleTier.LUXURY]: 0.06,
  [VehicleTier.EXOTIC]: 0.065,
};

/** Owner loyalty improves effective share by up to +3% across LISTED → ELITE_FLEET (spec §9.3). */
export const OWNER_LOYALTY_BONUS: Record<OwnerTier, number> = {
  [OwnerTier.LISTED]: 0.0,
  [OwnerTier.ACTIVE]: 0.01,
  [OwnerTier.PREMIER]: 0.02,
  [OwnerTier.ELITE_FLEET]: 0.03,
};

/**
 * Effective owner access share for a (ownerTier, vehicleTier) pair. This is the configurable
 * `computeOwnerShare` rate the spec asks for — swap this function to retune the split per
 * market without touching the payout engine.
 */
export function ownerAccessShareRate(ownerTier: OwnerTier, vehicleTier: VehicleTier): number {
  const rate = OWNER_BASE_ACCESS_RATE[vehicleTier] + OWNER_LOYALTY_BONUS[ownerTier];
  return Number(rate.toFixed(4));
}
