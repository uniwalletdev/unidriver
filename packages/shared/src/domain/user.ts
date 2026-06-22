import {
  BackgroundCheckStatus,
  OwnerTier,
  Region,
  TrustTier,
  UserRole,
  UserStatus,
} from '../enums';

/** Identity & Vetting domain types (spec §5.1). */

export interface User {
  id: string;
  role: UserRole;
  email: string;
  phone: string;
  fullName: string;
  region: Region;
  status: UserStatus;
  createdAt: Date;
}

export interface DriverProfile {
  userId: string;
  licenceNumber: string;
  licenceState: string;
  licenceVerifiedAt: Date | null;
  backgroundCheckId: string | null;
  backgroundCheckStatus: BackgroundCheckStatus;
  /** 0–1000 (spec §6.1). */
  trustScore: number;
  trustTier: TrustTier;
  completedTrips: number;
  atFaultAccidents: number;
  lifetimeMiles: number;
  joinedAt: Date;
  lastActiveAt: Date | null;
  bankAccountConnected: boolean;
}

export interface OwnerProfile {
  userId: string;
  ownerTier: OwnerTier;
  /** Stripe Connect payout account id. */
  payoutAccountId: string | null;
  taxIdOnFile: boolean;
  joinedAt: Date;
  totalEarnedToDateCents: number;
}
