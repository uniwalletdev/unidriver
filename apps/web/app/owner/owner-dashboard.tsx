'use client';

import { useEffect, useRef, useState } from 'react';
import {
  computeCarNote,
  type CarNoteResult,
  type CreateVehicleInput,
  type Vehicle,
  VehicleTier,
} from '@unidriver/shared';
import {
  createVehicle,
  devOwnerToken,
  getMyOwner,
  listMyVehicles,
  registerOwner,
} from '../../lib/api';

const card: React.CSSProperties = {
  background: '#111827',
  border: '1px solid #1f2937',
  borderRadius: 12,
  padding: 20,
  marginBottom: 20,
};
const input: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  margin: '4px 0 12px',
  borderRadius: 6,
  border: '1px solid #334155',
  background: '#0b1120',
  color: '#e2e8f0',
  boxSizing: 'border-box',
};
export const button: React.CSSProperties = {
  padding: '10px 16px',
  background: '#6366f1',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer',
};

export interface OwnerDashboardProps {
  /**
   * 'clerk': bearer tokens come from `getToken` (Clerk session JWTs) and registration links
   * the signed-in Clerk user. 'dev': Phase 0 flow — registering mints a `dev:<id>:OWNER` token.
   */
  mode: 'clerk' | 'dev';
  getToken?: () => Promise<string | null>;
  prefill?: { fullName?: string; email?: string };
}

export function OwnerDashboard({ mode, getToken, prefill }: OwnerDashboardProps) {
  const [ownerId, setOwnerId] = useState('');
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  async function resolveToken(): Promise<string | null> {
    if (mode === 'clerk') {
      return (await getToken?.()) ?? null;
    }
    return ownerId ? devOwnerToken(ownerId) : null;
  }

  // Clerk users may already be registered — restore their account once on load.
  const restored = useRef(false);
  useEffect(() => {
    if (mode !== 'clerk' || restored.current) {
      return;
    }
    restored.current = true;
    void (async () => {
      try {
        const token = await getToken?.();
        if (token) {
          setOwnerId((await getMyOwner(token)).id);
        }
      } catch {
        // Not registered yet — the registration card handles it.
      }
    })();
  });

  // Owner registration ------------------------------------------------------
  const [fullName, setFullName] = useState(
    prefill?.fullName ?? (mode === 'dev' ? 'Houston Owner' : ''),
  );
  const [email, setEmail] = useState(prefill?.email ?? (mode === 'dev' ? 'owner@example.com' : ''));
  const [phone, setPhone] = useState(mode === 'dev' ? '+13135551212' : '');

  async function onRegister() {
    setError('');
    try {
      const token = mode === 'clerk' ? await getToken?.() : undefined;
      const owner = await registerOwner({ fullName, email, phone }, token ?? undefined);
      setOwnerId(owner.id);
    } catch (e) {
      setError(String(e));
    }
  }

  // Car Note Mode (runs the shared pure function client-side) ----------------
  const [monthlyPayment, setMonthlyPayment] = useState(500);
  // computeCarNote throws on negative/non-finite cents, so sanitise free-form input first.
  const carNote: CarNoteResult = computeCarNote({
    monthlyPaymentCents: Number.isFinite(monthlyPayment)
      ? Math.max(0, Math.round(monthlyPayment * 100))
      : 0,
  });

  // Vehicle listing ---------------------------------------------------------
  const [form, setForm] = useState<CreateVehicleInput>({
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    vin: '4T1BF1FK0CU000001',
    plate: 'TX-1234',
    tier: VehicleTier.STANDARD,
  });

  async function onCreateVehicle() {
    setError('');
    try {
      const token = await resolveToken();
      if (!token) {
        setError('Register first.');
        return;
      }
      const created = await createVehicle(token, form);
      setVehicles((prev) => [created, ...prev]);
    } catch (e) {
      setError(String(e));
    }
  }

  async function onRefresh() {
    setError('');
    try {
      const token = await resolveToken();
      if (!token) {
        setError('Register first.');
        return;
      }
      setVehicles(await listMyVehicles(token));
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 32 }}>Owner dashboard</h1>

      {error && <p style={{ color: '#f87171', whiteSpace: 'pre-wrap' }}>{error}</p>}

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>1 · Register</h2>
        {ownerId ? (
          <p style={{ color: '#34d399', fontSize: 14 }}>
            Registered. Owner id <code>{ownerId}</code>
            {mode === 'dev' && ' · dev token set'}.
          </p>
        ) : (
          <>
            <label>Full name</label>
            <input style={input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <label>Email</label>
            <input style={input} value={email} onChange={(e) => setEmail(e.target.value)} />
            <label>Phone</label>
            <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <button style={button} onClick={onRegister}>
              Register owner
            </button>
          </>
        )}
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>2 · Car Note Mode</h2>
        <p style={{ color: '#94a3b8', marginTop: 0 }}>
          How many driving hours cover your monthly car payment?
        </p>
        <label>Monthly payment (USD)</label>
        <input
          style={input}
          type="number"
          value={monthlyPayment}
          onChange={(e) => setMonthlyPayment(Number(e.target.value))}
        />
        <p style={{ fontSize: 18 }}>
          ≈ <strong>{carNote.hoursToBreakeven} hours</strong> /month (
          {carNote.daysToBreakevenAtFourHoursPerDay} days at 4h/day) at $
          {(carNote.avgEarningsPerHourCents / 100).toFixed(0)}/hr.
        </p>
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>3 · List a vehicle</h2>
        <label>Make</label>
        <input
          style={input}
          value={form.make}
          onChange={(e) => setForm({ ...form, make: e.target.value })}
        />
        <label>Model</label>
        <input
          style={input}
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
        />
        <label>Year</label>
        <input
          style={input}
          type="number"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
        />
        <label>VIN</label>
        <input
          style={input}
          value={form.vin}
          onChange={(e) => setForm({ ...form, vin: e.target.value })}
        />
        <label>Plate</label>
        <input
          style={input}
          value={form.plate}
          onChange={(e) => setForm({ ...form, plate: e.target.value })}
        />
        <label>Tier</label>
        <select
          style={input}
          value={form.tier}
          onChange={(e) => setForm({ ...form, tier: e.target.value as VehicleTier })}
        >
          {Object.values(VehicleTier).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button style={button} onClick={onCreateVehicle} disabled={!ownerId}>
          Create vehicle
        </button>{' '}
        <button
          style={{ ...button, background: '#334155' }}
          onClick={onRefresh}
          disabled={!ownerId}
        >
          Refresh my vehicles
        </button>
        {!ownerId && <p style={{ color: '#fbbf24', fontSize: 14 }}>Register first.</p>}
      </section>

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>My vehicles ({vehicles.length})</h2>
        {vehicles.length === 0 ? (
          <p style={{ color: '#64748b' }}>None yet.</p>
        ) : (
          <ul>
            {vehicles.map((v) => (
              <li key={v.id} style={{ marginBottom: 6 }}>
                {v.year} {v.make} {v.model} — <strong>{v.tier}</strong> · {v.status}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
