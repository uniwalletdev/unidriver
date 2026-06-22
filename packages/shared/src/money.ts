/**
 * Money utilities.
 *
 * Hard rule (spec §15): all monetary values are integer **minor units** (e.g. US cents)
 * with an explicit currency. No floats are ever used in financial code. The split helper
 * below conserves every minor unit — rounding never creates or destroys money.
 */

export type Currency = 'USD' | 'CAD' | 'GBP';

export interface Money {
  /** Amount in integer minor units (cents). Always an integer. */
  readonly amountMinor: number;
  readonly currency: Currency;
}

export class MoneyError extends Error {}

/** Construct a Money value, asserting the amount is a safe integer. */
export function money(amountMinor: number, currency: Currency): Money {
  assertMinorUnits(amountMinor);
  return { amountMinor, currency };
}

export function isMinorUnits(amountMinor: number): boolean {
  return Number.isSafeInteger(amountMinor);
}

export function assertMinorUnits(amountMinor: number): void {
  if (!isMinorUnits(amountMinor)) {
    throw new MoneyError(`Monetary amount must be a safe integer minor unit, got: ${amountMinor}`);
  }
}

export function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new MoneyError(`Currency mismatch: ${a.currency} vs ${b.currency}`);
  }
}

export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor + b.amountMinor, a.currency);
}

export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountMinor - b.amountMinor, a.currency);
}

/**
 * Multiply an integer minor-unit amount by a rate in [0, 1], rounding to the nearest minor
 * unit (half away from zero). Use only when a standalone rounded value is needed; for
 * conservative splits prefer {@link splitMinorUnits}.
 */
export function applyRate(amountMinor: number, rate: number): number {
  assertMinorUnits(amountMinor);
  if (rate < 0 || rate > 1 || Number.isNaN(rate)) {
    throw new MoneyError(`Rate must be within [0, 1], got: ${rate}`);
  }
  return Math.round(amountMinor * rate);
}

/**
 * Split a total of integer minor units across weighted buckets such that the parts sum
 * **exactly** to the total. Floors each bucket, then distributes the leftover minor units
 * one-by-one to the buckets with the largest fractional remainders (largest-remainder
 * method). Deterministic and conserving — no money is lost or invented.
 *
 * @param totalMinor non-negative integer minor units to distribute
 * @param weights    non-negative weights (need not sum to 1)
 * @returns integer parts, same length and order as `weights`, summing to `totalMinor`
 */
export function splitMinorUnits(totalMinor: number, weights: number[]): number[] {
  assertMinorUnits(totalMinor);
  if (totalMinor < 0) {
    throw new MoneyError(`Cannot split a negative total: ${totalMinor}`);
  }
  if (weights.length === 0) {
    throw new MoneyError('splitMinorUnits requires at least one weight');
  }
  if (weights.some((w) => w < 0 || Number.isNaN(w))) {
    throw new MoneyError('Split weights must be non-negative numbers');
  }

  const weightSum = weights.reduce((acc, w) => acc + w, 0);
  if (weightSum === 0) {
    // No weight anywhere: put everything in the first bucket to stay conserving.
    return weights.map((_, i) => (i === 0 ? totalMinor : 0));
  }

  const exact = weights.map((w) => (totalMinor * w) / weightSum);
  const floors = exact.map((x) => Math.floor(x));
  let remainder = totalMinor - floors.reduce((acc, x) => acc + x, 0);

  // Distribute the remaining units to the largest fractional remainders first.
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let k = 0; k < order.length && remainder > 0; k++) {
    result[order[k].i] += 1;
    remainder -= 1;
  }
  return result;
}

export const ZERO_DECIMAL_CURRENCIES = new Set<string>(['JPY', 'KRW']);

/** Human-readable formatting helper (display only — never use the result in calculations). */
export function formatMoney(value: Money): string {
  const minorPerMajor = ZERO_DECIMAL_CURRENCIES.has(value.currency) ? 1 : 100;
  const major = value.amountMinor / minorPerMajor;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: value.currency,
  }).format(major);
}
