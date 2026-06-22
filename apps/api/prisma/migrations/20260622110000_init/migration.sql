-- CreateEnum
CREATE TYPE "Region" AS ENUM ('US', 'CA', 'GB');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'DRIVER', 'BOTH', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "TrustTier" AS ENUM ('FOUNDATION', 'ESTABLISHED', 'TRUSTED', 'ELITE', 'CERTIFIED');

-- CreateEnum
CREATE TYPE "OwnerTier" AS ENUM ('LISTED', 'ACTIVE', 'PREMIER', 'ELITE_FLEET');

-- CreateEnum
CREATE TYPE "VehicleTier" AS ENUM ('STANDARD', 'COMFORT', 'PREMIUM', 'LUXURY', 'EXOTIC', 'XL_SUV', 'EV_STANDARD');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('DRAFT', 'PENDING_INSPECTION', 'ACTIVE', 'ON_TRIP', 'MAINTENANCE', 'DELISTED', 'LISTED_DORMANT');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('ONBOARDING', 'PRE_TRIP', 'POST_TRIP');

-- CreateEnum
CREATE TYPE "AvailabilityRuleType" AS ENUM ('RECURRING', 'ONE_OFF', 'HOLIDAY_MODE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AllowedTripType" AS ENUM ('RIDESHARE', 'CORPORATE', 'BOTH');

-- CreateEnum
CREATE TYPE "FuelPolicy" AS ENUM ('FULL_TO_FULL', 'LEVEL_TO_LEVEL', 'EV_CHARGE_RETURN');

-- CreateEnum
CREATE TYPE "ValuationSource" AS ENUM ('HAGERTY', 'NADA_JDPOWER', 'MANUAL');

-- CreateEnum
CREATE TYPE "BookingState" AS ENUM ('REQUESTED', 'OWNER_REVIEW', 'APPROVED', 'INSURANCE_BOUND', 'CONFIRMED', 'DECLINED', 'PICKUP_PENDING', 'PICKUP_CONFIRMED', 'IN_PROGRESS', 'RETURN_PENDING', 'RETURN_CONFIRMED', 'CLAIM_WINDOW', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HandoffType" AS ENUM ('PICKUP', 'RETURN');

-- CreateEnum
CREATE TYPE "ExternalPlatform" AS ENUM ('UBER', 'LYFT', 'UNIDRIVER_CORP', 'OTHER');

-- CreateEnum
CREATE TYPE "TrustEventType" AS ENUM ('AT_FAULT_ACCIDENT', 'VEHICLE_DAMAGE', 'MILEAGE_CAP_BREACH', 'LATE_RETURN', 'PASSENGER_COMPLAINT', 'FUEL_NONCOMPLIANCE', 'LATE_CANCELLATION', 'RESPONSE_TIME_FAILURE', 'CLEAN_BOOKING', 'TRIP_COMPLETED', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'FLAGGED_REVIEW');

-- CreateEnum
CREATE TYPE "CoverageState" AS ENUM ('IDLE_OWNER_PERSONAL', 'LISTED_GAP', 'EN_ROUTE_TO_PICKUP', 'COMMERCIAL_ACTIVE', 'POST_TRIP_CLAIM_WINDOW');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('DAMAGE', 'THEFT', 'LIABILITY', 'CLEANING', 'FUEL');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'APPROVED', 'DENIED', 'PAID');

-- CreateEnum
CREATE TYPE "BackgroundCheckStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'CLEAR', 'CONSIDER', 'SUSPENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "region" "Region" NOT NULL DEFAULT 'US',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverProfile" (
    "userId" TEXT NOT NULL,
    "licenceNumber" TEXT NOT NULL,
    "licenceState" TEXT NOT NULL,
    "licenceVerifiedAt" TIMESTAMP(3),
    "backgroundCheckId" TEXT,
    "backgroundCheckStatus" "BackgroundCheckStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "trustTier" "TrustTier" NOT NULL DEFAULT 'FOUNDATION',
    "completedTrips" INTEGER NOT NULL DEFAULT 0,
    "atFaultAccidents" INTEGER NOT NULL DEFAULT 0,
    "lifetimeMiles" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3),
    "bankAccountConnected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "OwnerProfile" (
    "userId" TEXT NOT NULL,
    "ownerTier" "OwnerTier" NOT NULL DEFAULT 'LISTED',
    "payoutAccountId" TEXT,
    "taxIdOnFile" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalEarnedToDateCents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OwnerProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "vin" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "region" "Region" NOT NULL DEFAULT 'US',
    "tier" "VehicleTier" NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'DRAFT',
    "agreedValueCents" INTEGER,
    "valuationSource" "ValuationSource",
    "valuationDate" TIMESTAMP(3),
    "smartcarConnected" BOOLEAN NOT NULL DEFAULT false,
    "gpsDeviceId" TEXT,
    "mileageCapPerBooking" INTEGER,
    "fuelPolicy" "FuelPolicy" NOT NULL DEFAULT 'FULL_TO_FULL',
    "cleaningTier" TEXT NOT NULL DEFAULT 'standard',
    "allowedTripTypes" "AllowedTripType" NOT NULL DEFAULT 'RIDESHARE',
    "geofenceZoneId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleInspection" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "InspectionType" NOT NULL,
    "bookingId" TEXT,
    "inspectorId" TEXT,
    "photos" TEXT[],
    "aiConditionScore" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "AvailabilityRuleType" NOT NULL,
    "dayOfWeek" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "calendarSyncSource" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeofenceZone" (
    "id" TEXT NOT NULL,
    "region" "Region" NOT NULL DEFAULT 'US',
    "name" TEXT NOT NULL,
    "polygon" JSONB NOT NULL,

    CONSTRAINT "GeofenceZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "region" "Region" NOT NULL DEFAULT 'US',
    "state" "BookingState" NOT NULL DEFAULT 'REQUESTED',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "handoffLat" DOUBLE PRECISION,
    "handoffLng" DOUBLE PRECISION,
    "returnLat" DOUBLE PRECISION,
    "returnLng" DOUBLE PRECISION,
    "mileageStart" INTEGER,
    "mileageEnd" INTEGER,
    "fuelStart" DOUBLE PRECISION,
    "fuelEnd" DOUBLE PRECISION,
    "insurancePolicyRef" TEXT,
    "ownerApprovedDriver" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Handoff" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "HandoffType" NOT NULL,
    "confirmedByOwner" BOOLEAN NOT NULL DEFAULT false,
    "confirmedByDriver" BOOLEAN NOT NULL DEFAULT false,
    "photos" TEXT[],
    "odometer" INTEGER,
    "fuelLevel" DOUBLE PRECISION,
    "geoLat" DOUBLE PRECISION,
    "geoLng" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Handoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "externalPlatform" "ExternalPlatform" NOT NULL,
    "grossEarningsCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "distanceMiles" DOUBLE PRECISION NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "riderRating" DOUBLE PRECISION,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustEvent" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "type" "TrustEventType" NOT NULL,
    "scoreDelta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "bookingId" TEXT,
    "isPermanentFlag" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustScoreSnapshot" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "tier" "TrustTier" NOT NULL,
    "dimensionBreakdown" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "grossEarningsCents" INTEGER NOT NULL,
    "ownerShareCents" INTEGER NOT NULL,
    "driverShareCents" INTEGER NOT NULL,
    "platformShareCents" INTEGER NOT NULL,
    "insuranceCostCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "ownerTakeRate" DOUBLE PRECISION NOT NULL,
    "driverTakeRate" DOUBLE PRECISION NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "stripeTransferIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceProduct" (
    "id" TEXT NOT NULL,
    "region" "Region" NOT NULL DEFAULT 'US',
    "tier" "VehicleTier" NOT NULL,
    "providerName" TEXT NOT NULL,
    "coverageLimitCents" INTEGER NOT NULL,
    "perVehicleWeeklyCostCents" INTEGER NOT NULL,
    "agreedValueRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InsuranceProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceBinding" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "coverageState" "CoverageState" NOT NULL DEFAULT 'LISTED_GAP',
    "effectiveStart" TIMESTAMP(3) NOT NULL,
    "effectiveEnd" TIMESTAMP(3) NOT NULL,
    "policyRef" TEXT NOT NULL,

    CONSTRAINT "InsuranceBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "type" "ClaimType" NOT NULL,
    "amountClaimedCents" INTEGER NOT NULL,
    "amountApprovedCents" INTEGER,
    "status" "ClaimStatus" NOT NULL DEFAULT 'OPEN',
    "slaDueAt" TIMESTAMP(3) NOT NULL,
    "evidence" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegulatoryRuleset" (
    "id" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegulatoryRuleset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_region_role_idx" ON "User"("region", "role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "DriverProfile_trustTier_idx" ON "DriverProfile"("trustTier");

-- CreateIndex
CREATE INDEX "OwnerProfile_ownerTier_idx" ON "OwnerProfile"("ownerTier");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_ownerId_idx" ON "Vehicle"("ownerId");

-- CreateIndex
CREATE INDEX "Vehicle_region_tier_status_idx" ON "Vehicle"("region", "tier", "status");

-- CreateIndex
CREATE INDEX "VehicleInspection_vehicleId_idx" ON "VehicleInspection"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleInspection_bookingId_idx" ON "VehicleInspection"("bookingId");

-- CreateIndex
CREATE INDEX "AvailabilityRule_vehicleId_idx" ON "AvailabilityRule"("vehicleId");

-- CreateIndex
CREATE INDEX "Booking_vehicleId_idx" ON "Booking"("vehicleId");

-- CreateIndex
CREATE INDEX "Booking_driverId_idx" ON "Booking"("driverId");

-- CreateIndex
CREATE INDEX "Booking_ownerId_idx" ON "Booking"("ownerId");

-- CreateIndex
CREATE INDEX "Booking_state_idx" ON "Booking"("state");

-- CreateIndex
CREATE INDEX "Handoff_bookingId_idx" ON "Handoff"("bookingId");

-- CreateIndex
CREATE INDEX "Trip_bookingId_idx" ON "Trip"("bookingId");

-- CreateIndex
CREATE INDEX "TrustEvent_driverId_idx" ON "TrustEvent"("driverId");

-- CreateIndex
CREATE INDEX "TrustEvent_driverId_isPermanentFlag_idx" ON "TrustEvent"("driverId", "isPermanentFlag");

-- CreateIndex
CREATE INDEX "TrustScoreSnapshot_driverId_computedAt_idx" ON "TrustScoreSnapshot"("driverId", "computedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_tripId_key" ON "Payout"("tripId");

-- CreateIndex
CREATE INDEX "Payout_bookingId_idx" ON "Payout"("bookingId");

-- CreateIndex
CREATE INDEX "Payout_ownerId_idx" ON "Payout"("ownerId");

-- CreateIndex
CREATE INDEX "Payout_driverId_idx" ON "Payout"("driverId");

-- CreateIndex
CREATE INDEX "Payout_status_idx" ON "Payout"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceProduct_region_tier_providerName_key" ON "InsuranceProduct"("region", "tier", "providerName");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceBinding_bookingId_key" ON "InsuranceBinding"("bookingId");

-- CreateIndex
CREATE INDEX "InsuranceBinding_productId_idx" ON "InsuranceBinding"("productId");

-- CreateIndex
CREATE INDEX "Claim_bookingId_idx" ON "Claim"("bookingId");

-- CreateIndex
CREATE INDEX "Claim_status_slaDueAt_idx" ON "Claim"("status", "slaDueAt");

-- CreateIndex
CREATE UNIQUE INDEX "RegulatoryRuleset_region_key" ON "RegulatoryRuleset"("region");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerProfile" ADD CONSTRAINT "OwnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_geofenceZoneId_fkey" FOREIGN KEY ("geofenceZoneId") REFERENCES "GeofenceZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInspection" ADD CONSTRAINT "VehicleInspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInspection" ADD CONSTRAINT "VehicleInspection_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handoff" ADD CONSTRAINT "Handoff_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustEvent" ADD CONSTRAINT "TrustEvent_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustEvent" ADD CONSTRAINT "TrustEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustScoreSnapshot" ADD CONSTRAINT "TrustScoreSnapshot_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceBinding" ADD CONSTRAINT "InsuranceBinding_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceBinding" ADD CONSTRAINT "InsuranceBinding_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

