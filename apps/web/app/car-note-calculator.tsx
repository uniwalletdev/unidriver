'use client';

import { useState } from 'react';
import { computeCarNote } from '@unidriver/shared';

/**
 * Car Note Mode (spec §10.1) — "how many driving hours cover my car payment?". Runs the same
 * shared pure function the API exposes, so the answer is instant and identical to the server.
 */
export function CarNoteCalculator() {
  const [raw, setRaw] = useState('500');
  const dollars = Number(raw);
  // computeCarNote throws on negative/non-finite cents, so sanitise free-form input first.
  const valid = raw.trim() !== '' && Number.isFinite(dollars) && dollars >= 0;
  const result = computeCarNote({
    monthlyPaymentCents: valid ? Math.round(dollars * 100) : 0,
  });

  return (
    <section className="card" aria-labelledby="car-note-title">
      <h2 id="car-note-title" className="title">
        Car Note Mode
      </h2>
      <p className="subtle">How many driving hours cover your monthly car payment?</p>

      <label className="field" style={{ marginTop: 16 }}>
        <span className="field-label">Monthly car payment (USD)</span>
        <input
          className="input"
          inputMode="decimal"
          value={raw}
          aria-invalid={!valid}
          onChange={(e) => setRaw(e.target.value.replace(/[^\d.]/g, ''))}
        />
        {!valid && <span className="field-error">Enter an amount like 450 or 520.50</span>}
      </label>

      <div className="hero-stat" aria-live="polite">
        <div className="hero-stat-value">{result.hoursToBreakeven} hrs</div>
        <p className="subtle" style={{ marginTop: 8 }}>
          a month covers it — about <strong>{result.daysToBreakevenAtFourHoursPerDay} days</strong>{' '}
          at 4h/day, based on ${(result.avgEarningsPerHourCents / 100).toFixed(0)}/hr average
          earnings.
        </p>
      </div>
    </section>
  );
}
