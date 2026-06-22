import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  BOOKING_TRANSITIONS,
  BookingState,
  canTransition,
  TrustTier,
  VehicleTier,
} from '@unidriver/shared';
import { TrustService } from '../trust/trust.service';

/**
 * Booking & Handoff boundary. Enforces the two invariants the spec calls out as
 * server-side-only: trust-tier gating at request time (spec §6.2, §15) and the rule that a
 * booking cannot enter INSURANCE_BOUND without a valid binding (spec §7, §8.1). Full booking
 * orchestration + owner reclaim/auto-rebook arrive in Phase 3.
 */
@Injectable()
export class BookingService {
  constructor(private readonly trust: TrustService) {}

  /** Block a driver from requesting a vehicle above their unlocked tier (spec §6.2). */
  assertCanRequest(driverTier: TrustTier, vehicleTier: VehicleTier): void {
    if (!this.trust.canBookVehicleTier(driverTier, vehicleTier)) {
      throw new ForbiddenException(
        `Driver tier ${driverTier} is not permitted to book ${vehicleTier} vehicles`,
      );
    }
  }

  canTransition(from: BookingState, to: BookingState): boolean {
    return canTransition(from, to);
  }

  assertTransition(from: BookingState, to: BookingState): void {
    if (!canTransition(from, to)) {
      throw new BadRequestException(`Illegal booking transition: ${from} -> ${to}`);
    }
  }

  nextStates(state: BookingState): readonly BookingState[] {
    return BOOKING_TRANSITIONS[state];
  }

  /** A booking may only move to INSURANCE_BOUND when a valid binding exists (spec §7, §8.1). */
  assertInsuranceBindingPresent(hasValidBinding: boolean): void {
    if (!hasValidBinding) {
      throw new BadRequestException('Cannot bind insurance: no valid InsuranceBinding present');
    }
  }
}
