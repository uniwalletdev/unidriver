import type { Currency } from '../money';
import { BookingState, ExternalPlatform, HandoffType, Region } from '../enums';

/** Booking & Handoff domain types (spec §5.3). */

export interface Booking {
  id: string;
  vehicleId: string;
  driverId: string;
  ownerId: string;
  region: Region;
  state: BookingState;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  handoffLat: number | null;
  handoffLng: number | null;
  returnLat: number | null;
  returnLng: number | null;
  mileageStart: number | null;
  mileageEnd: number | null;
  fuelStart: number | null;
  fuelEnd: number | null;
  insurancePolicyRef: string | null;
  ownerApprovedDriver: boolean;
  createdAt: Date;
}

export interface Handoff {
  id: string;
  bookingId: string;
  type: HandoffType;
  confirmedByOwner: boolean;
  confirmedByDriver: boolean;
  photos: string[];
  odometer: number | null;
  fuelLevel: number | null;
  geoLat: number | null;
  geoLng: number | null;
  timestamp: Date;
}

/** A single paid job performed during a booking (spec §5.3). */
export interface Trip {
  id: string;
  bookingId: string;
  externalPlatform: ExternalPlatform;
  grossEarningsCents: number;
  currency: Currency;
  distanceMiles: number;
  startedAt: Date;
  endedAt: Date;
  riderRating: number | null;
}
