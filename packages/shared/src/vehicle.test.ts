import { describe, it, expect } from 'vitest';
import { Region, ValuationSource, VehicleStatus, VehicleTier } from './enums';
import {
  canActivateVehicle,
  checkVehicleYear,
  eligibleModelYears,
  isValidVin,
  normalizeVin,
} from './vehicle';

const NOW = new Date('2026-09-24T00:00:00Z');

describe('VIN validation', () => {
  it('accepts a well-formed 17-char VIN, case/space-insensitively', () => {
    expect(isValidVin('4T1BF1FK0CU000001')).toBe(true);
    expect(isValidVin(' 4t1bf1fk0cu-000001 ')).toBe(true);
    expect(normalizeVin(' 4t1bf1fk0cu-000001 ')).toBe('4T1BF1FK0CU000001');
  });

  it('rejects wrong lengths and the forbidden letters I, O, Q', () => {
    expect(isValidVin('4T1BF1FK0CU00000')).toBe(false);
    expect(isValidVin('4T1BF1FK0CU0000011')).toBe(false);
    expect(isValidVin('4T1BF1FK0CU00000I')).toBe(false);
    expect(isValidVin('4T1BF1FK0CU00000O')).toBe(false);
    expect(isValidVin('4T1BF1FK0CU00000Q')).toBe(false);
  });
});

describe('model-year eligibility (region config)', () => {
  it('uses the stricter of min year and max age, and allows next model year', () => {
    expect(eligibleModelYears(Region.US, NOW)).toEqual({ min: 2016, max: 2027 });
  });

  it('rejects vehicles outside the window', () => {
    expect(checkVehicleYear(2015, Region.US, NOW).ok).toBe(false);
    expect(checkVehicleYear(2028, Region.US, NOW).ok).toBe(false);
    expect(checkVehicleYear(2022.5, Region.US, NOW).ok).toBe(false);
    expect(checkVehicleYear(2016, Region.US, NOW).ok).toBe(true);
    expect(checkVehicleYear(2027, Region.US, NOW).ok).toBe(true);
  });
});

describe('canActivateVehicle (spec §7.2)', () => {
  const base = {
    tier: VehicleTier.STANDARD,
    status: VehicleStatus.DRAFT,
    agreedValueCents: null,
    valuationSource: null,
  };

  it('activates a standard draft vehicle', () => {
    expect(canActivateVehicle(base).ok).toBe(true);
  });

  it('blocks Luxury/Exotic without an agreed value and valuation source', () => {
    expect(canActivateVehicle({ ...base, tier: VehicleTier.LUXURY }).ok).toBe(false);
    expect(
      canActivateVehicle({
        ...base,
        tier: VehicleTier.EXOTIC,
        agreedValueCents: 25_000_000,
        valuationSource: ValuationSource.HAGERTY,
      }).ok,
    ).toBe(true);
  });

  it('never re-activates a vehicle that is on a trip or already active', () => {
    expect(canActivateVehicle({ ...base, status: VehicleStatus.ON_TRIP }).ok).toBe(false);
    expect(canActivateVehicle({ ...base, status: VehicleStatus.ACTIVE }).ok).toBe(false);
  });
});
