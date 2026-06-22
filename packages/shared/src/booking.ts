import { BookingState } from './enums';

/**
 * Booking state machine (spec §8.1) expressed as an allowed-transition map. This is the pure
 * definition shared by the API and clients; the Booking module layers the runtime guards on
 * top — most importantly, the transition into INSURANCE_BOUND is additionally blocked until
 * the Insurance module returns a valid binding (spec §7, §8.1), and tier gating is enforced
 * at request time (spec §6.2).
 */
export const BOOKING_TRANSITIONS: Record<BookingState, readonly BookingState[]> = {
  // OWNER_REVIEW is skippable when the owner enables auto-approve for Standard/Comfort
  // (spec §8.1) — hence REQUESTED may go straight to APPROVED.
  [BookingState.REQUESTED]: [BookingState.OWNER_REVIEW, BookingState.APPROVED, BookingState.CANCELLED],
  [BookingState.OWNER_REVIEW]: [BookingState.APPROVED, BookingState.DECLINED, BookingState.CANCELLED],
  [BookingState.APPROVED]: [BookingState.INSURANCE_BOUND, BookingState.CANCELLED],
  [BookingState.INSURANCE_BOUND]: [BookingState.CONFIRMED, BookingState.CANCELLED],
  [BookingState.CONFIRMED]: [BookingState.PICKUP_PENDING, BookingState.CANCELLED],
  // Owner reclaim before pickup confirmation cancels and triggers driver auto-rebook (spec §8.2).
  [BookingState.PICKUP_PENDING]: [BookingState.PICKUP_CONFIRMED, BookingState.CANCELLED],
  [BookingState.PICKUP_CONFIRMED]: [BookingState.IN_PROGRESS],
  [BookingState.IN_PROGRESS]: [BookingState.RETURN_PENDING],
  [BookingState.RETURN_PENDING]: [BookingState.RETURN_CONFIRMED],
  [BookingState.RETURN_CONFIRMED]: [BookingState.SETTLED, BookingState.CLAIM_WINDOW],
  [BookingState.CLAIM_WINDOW]: [BookingState.SETTLED],
  // Terminal states.
  [BookingState.DECLINED]: [],
  [BookingState.CANCELLED]: [],
  [BookingState.SETTLED]: [],
};

export const TERMINAL_BOOKING_STATES: readonly BookingState[] = [
  BookingState.DECLINED,
  BookingState.CANCELLED,
  BookingState.SETTLED,
];

export function isTerminalBookingState(state: BookingState): boolean {
  return TERMINAL_BOOKING_STATES.includes(state);
}

export function canTransition(from: BookingState, to: BookingState): boolean {
  return BOOKING_TRANSITIONS[from].includes(to);
}

/**
 * Owner reclaim is honoured as a one-tap cancel only before pickup is confirmed (spec §8.2);
 * afterwards reclaim requires mutual agreement and driver compensation, handled separately.
 */
export function isReclaimableByCancel(state: BookingState): boolean {
  return BOOKING_TRANSITIONS[state].includes(BookingState.CANCELLED);
}
