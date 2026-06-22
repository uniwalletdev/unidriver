import type { Currency } from './money';
import { Region } from './enums';

/**
 * Per-region configuration. The runtime ships US-only at MVP, but currency, regulatory
 * ruleset, and insurance product mapping are all configurable per market so Canada and the
 * UK can be activated without code changes (spec §2 principle 5, §13).
 */
export interface RegionConfig {
  readonly region: Region;
  readonly currency: Currency;
  /** Whether this region is live in the runtime. Only US is active at MVP. */
  readonly active: boolean;
  readonly minVehicleYear: number;
  readonly maxVehicleAgeYears: number;
  /** Required driver screening checks for this market. */
  readonly requiredDriverChecks: string[];
  /** Tax reporting format identifier (e.g. US 1099). */
  readonly taxReportingFormat: string;
}

export const REGION_CONFIG: Record<Region, RegionConfig> = {
  [Region.US]: {
    region: Region.US,
    currency: 'USD',
    active: true,
    minVehicleYear: 2015,
    maxVehicleAgeYears: 10,
    requiredDriverChecks: ['MVR', 'CRIMINAL', 'SSN_TRACE'],
    taxReportingFormat: 'US_1099',
  },
  [Region.CA]: {
    region: Region.CA,
    currency: 'CAD',
    active: false,
    minVehicleYear: 2015,
    maxVehicleAgeYears: 10,
    requiredDriverChecks: ['MVR', 'CRIMINAL'],
    taxReportingFormat: 'CA_T4A',
  },
  [Region.GB]: {
    region: Region.GB,
    currency: 'GBP',
    active: false,
    minVehicleYear: 2015,
    maxVehicleAgeYears: 10,
    requiredDriverChecks: ['DBS', 'DVLA'],
    taxReportingFormat: 'UK_SA',
  },
};

export function regionConfig(region: Region): RegionConfig {
  return REGION_CONFIG[region];
}

export function currencyForRegion(region: Region): Currency {
  return REGION_CONFIG[region].currency;
}

export function isRegionActive(region: Region): boolean {
  return REGION_CONFIG[region].active;
}
