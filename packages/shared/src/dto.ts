import {
  AllowedTripType,
  FuelPolicy,
  Region,
  ValuationSource,
  VehicleTier,
} from './enums';

/**
 * Shared request shapes used by both the API (as the basis for its validated DTOs) and the
 * frontends (as the type of data they send). Keeping them here guarantees client and server
 * agree on the wire format.
 */

export interface RegisterOwnerInput {
  fullName: string;
  email: string;
  phone: string;
  region?: Region;
}

export interface CreateVehicleInput {
  make: string;
  model: string;
  year: number;
  vin: string;
  plate: string;
  tier: VehicleTier;
  agreedValueCents?: number | null;
  valuationSource?: ValuationSource | null;
  fuelPolicy?: FuelPolicy;
  mileageCapPerBooking?: number | null;
  allowedTripTypes?: AllowedTripType;
}
