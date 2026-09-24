import { TrustTier, VehicleTier, type OnboardingStepKey } from '@unidriver/shared';

export const TRUST_TIER_LABEL: Record<TrustTier, string> = {
  [TrustTier.FOUNDATION]: 'Foundation',
  [TrustTier.ESTABLISHED]: 'Established',
  [TrustTier.TRUSTED]: 'Trusted',
  [TrustTier.ELITE]: 'Elite',
  [TrustTier.CERTIFIED]: 'Certified',
};

export const VEHICLE_TIER_LABEL: Record<VehicleTier, string> = {
  [VehicleTier.STANDARD]: 'Standard',
  [VehicleTier.COMFORT]: 'Comfort',
  [VehicleTier.EV_STANDARD]: 'EV',
  [VehicleTier.XL_SUV]: 'XL / SUV',
  [VehicleTier.PREMIUM]: 'Premium',
  [VehicleTier.LUXURY]: 'Luxury',
  [VehicleTier.EXOTIC]: 'Exotic',
};

export const STEP_TITLE: Record<OnboardingStepKey, string> = {
  LICENCE: "Driver's licence",
  BACKGROUND_CHECK: 'Background check',
  PAYOUT_ACCOUNT: 'Payout account',
};

export const percent = (rate: number) => `${Math.round(rate * 100)}%`;

export function tierList(tiers: readonly VehicleTier[]): string {
  return tiers.map((t) => VEHICLE_TIER_LABEL[t]).join(', ');
}
