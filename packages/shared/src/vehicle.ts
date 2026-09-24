import { Region, ValuationSource, VehicleStatus, VehicleTier } from './enums';
import { REGION_CONFIG } from './region';

/**
 * Vehicle listing rules (spec §5.2, §7.2). Pure and shared so the API enforces exactly what
 * the web/mobile forms pre-validate — clients show the reason, the server stays authoritative.
 */

export interface EligibilityCheck {
  ok: boolean;
  reason?: string;
}

/** VINs are 17 chars from A–Z/0–9, excluding I, O and Q (ISO 3779). */
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

/** Canonical VIN form: trimmed, spaces/dashes removed, upper-cased. */
export function normalizeVin(vin: string): string {
  return vin.replace(/[\s-]/g, '').toUpperCase();
}

export function isValidVin(vin: string): boolean {
  return VIN_PATTERN.test(normalizeVin(vin));
}

/** Oldest and newest model year a region accepts (next year's models are allowed). */
export function eligibleModelYears(
  region: Region,
  now: Date = new Date(),
): {
  min: number;
  max: number;
} {
  const cfg = REGION_CONFIG[region];
  const currentYear = now.getUTCFullYear();
  return {
    min: Math.max(cfg.minVehicleYear, currentYear - cfg.maxVehicleAgeYears),
    max: currentYear + 1,
  };
}

export function checkVehicleYear(
  year: number,
  region: Region,
  now: Date = new Date(),
): EligibilityCheck {
  const { min, max } = eligibleModelYears(region, now);
  if (!Number.isInteger(year) || year < min || year > max) {
    return { ok: false, reason: `Model year must be between ${min} and ${max} in ${region}` };
  }
  return { ok: true };
}

/** LUXURY/EXOTIC require a documented agreed value before they may go ACTIVE (spec §7.2). */
export function requiresAgreedValue(tier: VehicleTier): boolean {
  return tier === VehicleTier.LUXURY || tier === VehicleTier.EXOTIC;
}

/** States an owner may move to ACTIVE from. ON_TRIP / ACTIVE are excluded deliberately. */
const ACTIVATABLE_STATUSES: readonly VehicleStatus[] = [
  VehicleStatus.DRAFT,
  VehicleStatus.PENDING_INSPECTION,
  VehicleStatus.MAINTENANCE,
  VehicleStatus.DELISTED,
  VehicleStatus.LISTED_DORMANT,
];

export function canActivateVehicle(input: {
  tier: VehicleTier;
  status: VehicleStatus;
  agreedValueCents: number | null;
  valuationSource: ValuationSource | string | null;
}): EligibilityCheck {
  if (!ACTIVATABLE_STATUSES.includes(input.status)) {
    return { ok: false, reason: `A vehicle that is ${input.status} cannot be activated` };
  }
  if (requiresAgreedValue(input.tier) && (!input.agreedValueCents || !input.valuationSource)) {
    return {
      ok: false,
      reason:
        'Luxury/Exotic vehicles require agreedValueCents and valuationSource before activation',
    };
  }
  return { ok: true };
}
