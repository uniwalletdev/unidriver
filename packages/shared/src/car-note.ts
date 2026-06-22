import { assertMinorUnits, MoneyError } from './money';
import { Region } from './enums';

/**
 * Car Note Mode (spec §10.1). Pure calculation: given an owner's monthly car payment and the
 * regional average rideshare earnings per hour, compute how many driving hours it takes to
 * break even. Cheap to build, high marketing value — and it runs identically on the client
 * and the server because it lives here.
 */

/** Indicative average rideshare earnings per hour, in minor units (cents). Tuned per market. */
export const REGIONAL_AVG_EARNINGS_PER_HOUR_CENTS: Record<Region, number> = {
  [Region.US]: 2500,
  [Region.CA]: 2300,
  [Region.GB]: 2400,
};

export interface CarNoteInput {
  monthlyPaymentCents: number;
  /** Overrides the regional default when provided. */
  avgEarningsPerHourCents?: number;
  region?: Region;
}

export interface CarNoteResult {
  monthlyPaymentCents: number;
  avgEarningsPerHourCents: number;
  hoursToBreakeven: number;
  daysToBreakevenAtFourHoursPerDay: number;
}

export function computeCarNote(input: CarNoteInput): CarNoteResult {
  assertMinorUnits(input.monthlyPaymentCents);
  if (input.monthlyPaymentCents < 0) {
    throw new MoneyError(`Monthly payment cannot be negative: ${input.monthlyPaymentCents}`);
  }
  const rate =
    input.avgEarningsPerHourCents ??
    REGIONAL_AVG_EARNINGS_PER_HOUR_CENTS[input.region ?? Region.US];
  if (rate <= 0) {
    throw new MoneyError(`avgEarningsPerHourCents must be positive, got: ${rate}`);
  }

  const hoursToBreakeven = Math.ceil(input.monthlyPaymentCents / rate);
  return {
    monthlyPaymentCents: input.monthlyPaymentCents,
    avgEarningsPerHourCents: rate,
    hoursToBreakeven,
    daysToBreakevenAtFourHoursPerDay: Math.ceil(hoursToBreakeven / 4),
  };
}
