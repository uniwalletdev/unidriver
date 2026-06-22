/**
 * Canonical domain enumerations for UniDriver.
 *
 * This file is the single source of truth for the platform's vocabulary. The Prisma
 * schema mirrors these enums 1:1 (same names, same string values) so the database and the
 * application code never drift. When you add a value here, add it to `schema.prisma` too.
 */

/** Operating regions. Runtime is US-only at MVP; the data model is multi-region capable. */
export enum Region {
  US = 'US',
  CA = 'CA',
  GB = 'GB',
}

export enum UserRole {
  OWNER = 'OWNER',
  DRIVER = 'DRIVER',
  BOTH = 'BOTH',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

/** Driver progression tiers (Trust Engine, spec §6.2). */
export enum TrustTier {
  FOUNDATION = 'FOUNDATION',
  ESTABLISHED = 'ESTABLISHED',
  TRUSTED = 'TRUSTED',
  ELITE = 'ELITE',
  CERTIFIED = 'CERTIFIED',
}

/** Owner loyalty tiers (spec §5.1, §9.3). */
export enum OwnerTier {
  LISTED = 'LISTED',
  ACTIVE = 'ACTIVE',
  PREMIER = 'PREMIER',
  ELITE_FLEET = 'ELITE_FLEET',
}

/** Vehicle tiers gate which drivers may book (spec §5.2, §6.2). */
export enum VehicleTier {
  STANDARD = 'STANDARD',
  COMFORT = 'COMFORT',
  PREMIUM = 'PREMIUM',
  LUXURY = 'LUXURY',
  EXOTIC = 'EXOTIC',
  XL_SUV = 'XL_SUV',
  EV_STANDARD = 'EV_STANDARD',
}

export enum VehicleStatus {
  DRAFT = 'DRAFT',
  PENDING_INSPECTION = 'PENDING_INSPECTION',
  ACTIVE = 'ACTIVE',
  ON_TRIP = 'ON_TRIP',
  MAINTENANCE = 'MAINTENANCE',
  DELISTED = 'DELISTED',
  /** Low-cost dormant state for idle vehicles (spec §9.2). */
  LISTED_DORMANT = 'LISTED_DORMANT',
}

export enum InspectionType {
  ONBOARDING = 'ONBOARDING',
  PRE_TRIP = 'PRE_TRIP',
  POST_TRIP = 'POST_TRIP',
}

export enum AvailabilityRuleType {
  RECURRING = 'RECURRING',
  ONE_OFF = 'ONE_OFF',
  HOLIDAY_MODE = 'HOLIDAY_MODE',
  BLOCKED = 'BLOCKED',
}

export enum AllowedTripType {
  RIDESHARE = 'RIDESHARE',
  CORPORATE = 'CORPORATE',
  BOTH = 'BOTH',
}

export enum FuelPolicy {
  FULL_TO_FULL = 'FULL_TO_FULL',
  LEVEL_TO_LEVEL = 'LEVEL_TO_LEVEL',
  EV_CHARGE_RETURN = 'EV_CHARGE_RETURN',
}

export enum ValuationSource {
  HAGERTY = 'HAGERTY',
  NADA_JDPOWER = 'NADA_JDPOWER',
  MANUAL = 'MANUAL',
}

/** Booking state machine (spec §8.1). */
export enum BookingState {
  REQUESTED = 'REQUESTED',
  OWNER_REVIEW = 'OWNER_REVIEW',
  APPROVED = 'APPROVED',
  INSURANCE_BOUND = 'INSURANCE_BOUND',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
  PICKUP_PENDING = 'PICKUP_PENDING',
  PICKUP_CONFIRMED = 'PICKUP_CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  RETURN_PENDING = 'RETURN_PENDING',
  RETURN_CONFIRMED = 'RETURN_CONFIRMED',
  CLAIM_WINDOW = 'CLAIM_WINDOW',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
}

export enum HandoffType {
  PICKUP = 'PICKUP',
  RETURN = 'RETURN',
}

export enum ExternalPlatform {
  UBER = 'UBER',
  LYFT = 'LYFT',
  UNIDRIVER_CORP = 'UNIDRIVER_CORP',
  OTHER = 'OTHER',
}

/** Trust events drive score deltas (spec §6.3). */
export enum TrustEventType {
  AT_FAULT_ACCIDENT = 'AT_FAULT_ACCIDENT',
  VEHICLE_DAMAGE = 'VEHICLE_DAMAGE',
  MILEAGE_CAP_BREACH = 'MILEAGE_CAP_BREACH',
  LATE_RETURN = 'LATE_RETURN',
  PASSENGER_COMPLAINT = 'PASSENGER_COMPLAINT',
  FUEL_NONCOMPLIANCE = 'FUEL_NONCOMPLIANCE',
  LATE_CANCELLATION = 'LATE_CANCELLATION',
  RESPONSE_TIME_FAILURE = 'RESPONSE_TIME_FAILURE',
  /** Positive drift on clean completed bookings (spec §6.3 recovery). */
  CLEAN_BOOKING = 'CLEAN_BOOKING',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  /** platformNet < 0 — held for pricing review, payout to users still proceeds (spec §9.1). */
  FLAGGED_REVIEW = 'FLAGGED_REVIEW',
}

/** Insurance coverage states — every booking always resolves to exactly one (spec §7). */
export enum CoverageState {
  IDLE_OWNER_PERSONAL = 'IDLE_OWNER_PERSONAL',
  LISTED_GAP = 'LISTED_GAP',
  EN_ROUTE_TO_PICKUP = 'EN_ROUTE_TO_PICKUP',
  COMMERCIAL_ACTIVE = 'COMMERCIAL_ACTIVE',
  POST_TRIP_CLAIM_WINDOW = 'POST_TRIP_CLAIM_WINDOW',
}

export enum ClaimType {
  DAMAGE = 'DAMAGE',
  THEFT = 'THEFT',
  LIABILITY = 'LIABILITY',
  CLEANING = 'CLEANING',
  FUEL = 'FUEL',
}

export enum ClaimStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  APPROVED = 'APPROVED',
  DENIED = 'DENIED',
  PAID = 'PAID',
}

export enum BackgroundCheckStatus {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  CLEAR = 'CLEAR',
  CONSIDER = 'CONSIDER',
  SUSPENDED = 'SUSPENDED',
}
