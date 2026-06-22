import {
  AllowedTripType,
  AvailabilityRuleType,
  FuelPolicy,
  InspectionType,
  Region,
  ValuationSource,
  VehicleStatus,
  VehicleTier,
} from '../enums';

/** Vehicle & Listing domain types (spec §5.2). */

export interface Vehicle {
  id: string;
  ownerId: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  plate: string;
  region: Region;
  tier: VehicleTier;
  status: VehicleStatus;
  /** Required for LUXURY/EXOTIC before reaching ACTIVE (spec §7.2). */
  agreedValueCents: number | null;
  valuationSource: ValuationSource | null;
  valuationDate: Date | null;
  smartcarConnected: boolean;
  gpsDeviceId: string | null;
  mileageCapPerBooking: number | null;
  fuelPolicy: FuelPolicy;
  cleaningTier: string;
  allowedTripTypes: AllowedTripType;
  geofenceZoneId: string | null;
  createdAt: Date;
}

export interface VehicleInspection {
  id: string;
  vehicleId: string;
  type: InspectionType;
  bookingId: string | null;
  /** Null when scored by AI rather than a human inspector. */
  inspectorId: string | null;
  photos: string[];
  aiConditionScore: number | null;
  notes: string | null;
  createdAt: Date;
}

export interface AvailabilityRule {
  id: string;
  vehicleId: string;
  type: AvailabilityRuleType;
  dayOfWeek: number | null;
  startTime: string | null;
  endTime: string | null;
  bufferMinutes: number;
  calendarSyncSource: string | null;
  priority: number;
}

export interface GeofenceZone {
  id: string;
  region: Region;
  name: string;
  /** GeoJSON polygon. */
  polygon: unknown;
}
