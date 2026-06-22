'use client';

import { useState } from 'react';
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
const button: React.CSSProperties = {
  padding: '10px 16px',
  background: '#6366f1',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer',
};

export default function OwnerDashboard() {
  const [token, setToken] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [error, setError] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Owner registration ------------------------------------------------------
  const [fullName, setFullName] = useState('Houston Owner');
  const [email, setEmail] = useState('owner@example.com');
  const [phone, setPhone] = useState('+13135551212');

  async function onRegister() {
    setError('');
    try {
      const owner = await registerOwner({ fullName, email, phone });
      setOwnerId(owner.id);
      setToken(devOwnerToken(owner.id));
    } catch (e) {
      setError(String(e));
    }
  }

  // Car Note Mode (runs the shared pure function client-side) ----------------
  const [monthlyPayment, setMonthlyPayment] = useState(500);
  const carNote: CarNoteResult = computeCarNote({
    monthlyPaymentCents: Math.round(monthlyPayment * 100),
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
      const created = await createVehicle(token, form);
      setVehicles((prev) => [created, ...prev]);
    } catch (e) {
      setError(String(e));
    }
  }

  async function onRefresh() {
    setError('');
    try {
      setVehicles(await listMyVehicles(token));
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 32 }}>Owner dashboard</h1>

      {error && (
        <p style={{ color: '#f87171', whiteSpace: 'pre-wrap' }}>{error}</p>
      )}

      <section style={card}>
        <h2 style={{ marginTop: 0 }}>1 · Register</h2>
        <label>Full name</label>
        <input style={input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <label>Email</label>
        <input style={input} value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Phone</label>
        <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button style={button} onClick={onRegister}>
          Register owner
        </button>
        {ownerId && (
          <p style={{ color: '#34d399', fontSize: 14 }}>
            Registered. Owner id <code>{ownerId}</code> · dev token set.
          </p>
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
        <input style={input} value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
        <label>Model</label>
        <input style={input} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <label>Year</label>
        <input
          style={input}
          type="number"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
        />
        <label>VIN</label>
        <input style={input} value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
        <label>Plate</label>
        <input style={input} value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} />
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
        <button style={button} onClick={onCreateVehicle} disabled={!token}>
          Create vehicle
        </button>{' '}
        <button style={{ ...button, background: '#334155' }} onClick={onRefresh} disabled={!token}>
          Refresh my vehicles
        </button>
        {!token && <p style={{ color: '#fbbf24', fontSize: 14 }}>Register first to get a token.</p>}
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
