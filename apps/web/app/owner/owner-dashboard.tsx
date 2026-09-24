'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  checkVehicleYear,
  isValidVin,
  Region,
  requiresAgreedValue,
  ValuationSource,
  type Vehicle,
  VehicleStatus,
  VehicleTier,
} from '@unidriver/shared';
import {
  activateVehicle,
  createVehicle,
  devOwnerToken,
  errorMessage,
  getMyOwner,
  listMyVehicles,
  registerOwner,
} from '../../lib/api';
import { CarNoteCalculator } from '../car-note-calculator';

export interface OwnerDashboardProps {
  /**
   * 'clerk': bearer tokens come from `getToken` (Clerk session JWTs) and registration links
   * the signed-in Clerk user. 'dev': Phase 0 flow — registering mints a `dev:<id>:OWNER` token.
   */
  mode: 'clerk' | 'dev';
  getToken?: () => Promise<string | null>;
  prefill?: { fullName?: string; email?: string };
}

/** Dev mode has no real session, so remember the owner id across reloads on this device. */
const DEV_OWNER_KEY = 'unidriver.devOwnerId';

const TIER_LABEL: Record<VehicleTier, string> = {
  [VehicleTier.STANDARD]: 'Standard',
  [VehicleTier.COMFORT]: 'Comfort',
  [VehicleTier.EV_STANDARD]: 'EV',
  [VehicleTier.XL_SUV]: 'XL / SUV',
  [VehicleTier.PREMIUM]: 'Premium',
  [VehicleTier.LUXURY]: 'Luxury',
  [VehicleTier.EXOTIC]: 'Exotic',
};

const STATUS_LABEL: Record<VehicleStatus, string> = {
  [VehicleStatus.DRAFT]: 'Draft',
  [VehicleStatus.PENDING_INSPECTION]: 'Awaiting inspection',
  [VehicleStatus.ACTIVE]: 'Live',
  [VehicleStatus.ON_TRIP]: 'On a trip',
  [VehicleStatus.MAINTENANCE]: 'Maintenance',
  [VehicleStatus.DELISTED]: 'Delisted',
  [VehicleStatus.LISTED_DORMANT]: 'Dormant',
};

function statusBadgeClass(status: VehicleStatus): string {
  if (status === VehicleStatus.ACTIVE || status === VehicleStatus.ON_TRIP) {
    return 'badge badge-active';
  }
  if (status === VehicleStatus.DRAFT || status === VehicleStatus.PENDING_INSPECTION) {
    return 'badge badge-pending';
  }
  return 'badge';
}

interface VehicleForm {
  make: string;
  model: string;
  year: string;
  vin: string;
  plate: string;
  tier: VehicleTier;
  agreedValue: string;
  valuationSource: ValuationSource | '';
}

const EMPTY_FORM: VehicleForm = {
  make: '',
  model: '',
  year: '',
  vin: '',
  plate: '',
  tier: VehicleTier.STANDARD,
  agreedValue: '',
  valuationSource: '',
};

type FormErrors = Partial<Record<keyof VehicleForm, string>>;

/** Mirrors the API's checks (same shared rules) so owners see problems before submitting. */
function validateVehicle(form: VehicleForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.make.trim()) errors.make = 'Required';
  if (!form.model.trim()) errors.model = 'Required';
  const year = checkVehicleYear(Number(form.year), Region.US);
  if (!year.ok) errors.year = year.reason;
  if (!isValidVin(form.vin)) errors.vin = '17 characters — letters I, O and Q are never used';
  if (!form.plate.trim()) errors.plate = 'Required';
  if (requiresAgreedValue(form.tier)) {
    if (!(Number(form.agreedValue) > 0)) errors.agreedValue = 'Required for Luxury and Exotic';
    if (!form.valuationSource) errors.valuationSource = 'Required for Luxury and Exotic';
  }
  return errors;
}

export function OwnerDashboard({ mode, getToken, prefill }: OwnerDashboardProps) {
  const [ownerId, setOwnerId] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const resolveToken = useCallback(
    async (id = ownerId): Promise<string | null> => {
      if (mode === 'clerk') {
        return (await getToken?.()) ?? null;
      }
      return id ? devOwnerToken(id) : null;
    },
    [mode, getToken, ownerId],
  );

  const loadVehicles = useCallback(
    async (id?: string) => {
      try {
        const token = await resolveToken(id);
        if (token) {
          setVehicles(await listMyVehicles(token));
        }
      } catch (e) {
        setError(errorMessage(e));
        setVehicles([]);
      }
    },
    [resolveToken],
  );

  // Restore an existing owner once on load (Clerk session, or the dev id saved on this device).
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) {
      return;
    }
    restored.current = true;
    void (async () => {
      try {
        let token: string | null | undefined;
        if (mode === 'clerk') {
          token = await getToken?.();
        } else {
          const saved = window.localStorage.getItem(DEV_OWNER_KEY);
          token = saved ? devOwnerToken(saved) : null;
        }
        if (!token) {
          return;
        }
        const owner = await getMyOwner(token);
        setOwnerId(owner.id);
        setOwnerName(owner.fullName);
        await loadVehicles(owner.id);
      } catch {
        // Not registered yet (or the saved dev id is stale) — show the registration card.
        if (mode === 'dev') {
          window.localStorage.removeItem(DEV_OWNER_KEY);
        }
      }
    })();
  }, [mode, getToken, loadVehicles]);

  // Owner registration ------------------------------------------------------
  const [fullName, setFullName] = useState(prefill?.fullName ?? '');
  const [email, setEmail] = useState(prefill?.email ?? '');
  const [phone, setPhone] = useState('');

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy('register');
    try {
      const token = mode === 'clerk' ? await getToken?.() : undefined;
      const owner = await registerOwner({ fullName, email, phone }, token ?? undefined);
      setOwnerId(owner.id);
      setOwnerName(owner.fullName);
      if (mode === 'dev') {
        window.localStorage.setItem(DEV_OWNER_KEY, owner.id);
      }
      await loadVehicles(owner.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  function onSignOutDev() {
    window.localStorage.removeItem(DEV_OWNER_KEY);
    setOwnerId('');
    setOwnerName('');
    setVehicles(null);
  }

  // Vehicle listing ---------------------------------------------------------
  const [form, setForm] = useState<VehicleForm>(EMPTY_FORM);
  const [showErrors, setShowErrors] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const formErrors = validateVehicle(form);
  const set = <K extends keyof VehicleForm>(key: K, value: VehicleForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const fieldError = (key: keyof VehicleForm) =>
    showErrors && formErrors[key] ? formErrors[key] : undefined;

  async function onCreateVehicle(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (Object.keys(formErrors).length > 0) {
      setShowErrors(true);
      return;
    }
    setBusy('create');
    try {
      const token = await resolveToken();
      if (!token) {
        setError('Register as an owner first.');
        return;
      }
      const highValue = requiresAgreedValue(form.tier);
      const created = await createVehicle(token, {
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        vin: form.vin,
        plate: form.plate,
        tier: form.tier,
        agreedValueCents: highValue ? Math.round(Number(form.agreedValue) * 100) : undefined,
        valuationSource: highValue && form.valuationSource ? form.valuationSource : undefined,
      });
      setVehicles((prev) => [created, ...(prev ?? [])]);
      setForm(EMPTY_FORM);
      setShowErrors(false);
      setShowForm(false);
      setNotice(`${created.year} ${created.make} ${created.model} added as a draft.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function onActivate(vehicle: Vehicle) {
    setError('');
    setBusy(vehicle.id);
    try {
      const token = await resolveToken();
      if (!token) {
        return;
      }
      const updated = await activateVehicle(token, vehicle.id);
      setVehicles((prev) => (prev ?? []).map((v) => (v.id === updated.id ? updated : v)));
      setNotice(`${updated.make} ${updated.model} is live.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const liveCount = vehicles?.filter((v) => v.status === VehicleStatus.ACTIVE).length ?? 0;

  return (
    <div>
      <h1 className="large-title">
        {ownerName ? `Hi, ${ownerName.split(' ')[0]}` : 'Your garage'}
      </h1>
      <p className="subtle">
        {ownerId
          ? `${vehicles?.length ?? 0} vehicle${vehicles?.length === 1 ? '' : 's'} · ${liveCount} live`
          : 'Create your owner account to start listing.'}
      </p>

      <div aria-live="polite" style={{ marginTop: 16 }}>
        {error && (
          <div className="banner banner-error" role="alert">
            <span>{error}</span>
            <button className="banner-dismiss" onClick={() => setError('')} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}
        {notice && !error && (
          <div className="banner banner-ok">
            <span>{notice}</span>
            <button className="banner-dismiss" onClick={() => setNotice('')} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}
      </div>

      {!ownerId && (
        <form className="card" onSubmit={onRegister}>
          <h2 className="title">Create your owner account</h2>
          <p className="subtle" style={{ marginBottom: 16 }}>
            Free forever. We only earn a share of trips your car completes.
          </p>
          <label className="field">
            <span className="field-label">Full name</span>
            <input
              className="input"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Mobile number</span>
            <input
              className="input"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+1 713 555 0100"
              required
              minLength={7}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <button className="btn btn-block" disabled={busy === 'register'}>
            {busy === 'register' ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}

      {ownerId && (
        <>
          <p className="eyebrow">My vehicles</p>
          <section className="card">
            {vehicles === null ? (
              <>
                <div className="skeleton" />
                <div className="skeleton" />
              </>
            ) : vehicles.length === 0 ? (
              <div className="empty">
                <div style={{ fontSize: 32 }} aria-hidden>
                  🚗
                </div>
                <p>No cars yet. List your first one — it takes about two minutes.</p>
              </div>
            ) : (
              <ul className="list">
                {vehicles.map((v) => (
                  <li key={v.id} className="list-item">
                    <span className="list-icon" aria-hidden>
                      🚗
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className="list-title">
                        {v.year} {v.make} {v.model}
                      </div>
                      <div className="list-meta">
                        <span className={statusBadgeClass(v.status)}>{STATUS_LABEL[v.status]}</span>
                        <span className="caption">
                          {TIER_LABEL[v.tier]} · {v.plate}
                        </span>
                      </div>
                    </div>
                    {v.status !== VehicleStatus.ACTIVE && v.status !== VehicleStatus.ON_TRIP && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onActivate(v)}
                        disabled={busy === v.id}
                      >
                        {busy === v.id ? '…' : 'Go live'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {!showForm && (
              <div className="btn-row" style={{ marginTop: 12 }}>
                <button className="btn btn-block" onClick={() => setShowForm(true)}>
                  + Add a vehicle
                </button>
                <button className="btn btn-secondary btn-block" onClick={() => loadVehicles()}>
                  Refresh
                </button>
              </div>
            )}
          </section>

          {showForm && (
            <form className="card" onSubmit={onCreateVehicle} noValidate>
              <h2 className="title">Add a vehicle</h2>
              <p className="subtle" style={{ marginBottom: 16 }}>
                Your VIN is on the driver-side dashboard or door jamb.
              </p>
              <div className="row">
                <Field label="Make" error={fieldError('make')}>
                  <input
                    className="input"
                    placeholder="Toyota"
                    value={form.make}
                    aria-invalid={Boolean(fieldError('make'))}
                    onChange={(e) => set('make', e.target.value)}
                  />
                </Field>
                <Field label="Model" error={fieldError('model')}>
                  <input
                    className="input"
                    placeholder="Camry"
                    value={form.model}
                    aria-invalid={Boolean(fieldError('model'))}
                    onChange={(e) => set('model', e.target.value)}
                  />
                </Field>
              </div>
              <div className="row">
                <Field label="Year" error={fieldError('year')}>
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="2022"
                    maxLength={4}
                    value={form.year}
                    aria-invalid={Boolean(fieldError('year'))}
                    onChange={(e) => set('year', e.target.value.replace(/\D/g, ''))}
                  />
                </Field>
                <Field label="Plate" error={fieldError('plate')}>
                  <input
                    className="input"
                    autoCapitalize="characters"
                    placeholder="ABC1234"
                    value={form.plate}
                    aria-invalid={Boolean(fieldError('plate'))}
                    onChange={(e) => set('plate', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="VIN" error={fieldError('vin')}>
                <input
                  className="input"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  maxLength={20}
                  placeholder="17 characters"
                  value={form.vin}
                  aria-invalid={Boolean(fieldError('vin'))}
                  onChange={(e) => set('vin', e.target.value.toUpperCase())}
                  style={{ fontFamily: 'ui-monospace, SF Mono, Menlo, monospace' }}
                />
              </Field>

              <div className="field">
                <span className="field-label" id="tier-label">
                  Tier
                </span>
                <div className="segmented" role="group" aria-labelledby="tier-label">
                  {Object.values(VehicleTier).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="chip"
                      aria-pressed={form.tier === t}
                      onClick={() => set('tier', t)}
                    >
                      {TIER_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              {requiresAgreedValue(form.tier) && (
                <div className="row">
                  <Field label="Agreed value (USD)" error={fieldError('agreedValue')}>
                    <input
                      className="input"
                      inputMode="numeric"
                      placeholder="150000"
                      value={form.agreedValue}
                      aria-invalid={Boolean(fieldError('agreedValue'))}
                      onChange={(e) => set('agreedValue', e.target.value.replace(/\D/g, ''))}
                    />
                  </Field>
                  <Field label="Valuation source" error={fieldError('valuationSource')}>
                    <select
                      className="input"
                      value={form.valuationSource}
                      aria-invalid={Boolean(fieldError('valuationSource'))}
                      onChange={(e) => set('valuationSource', e.target.value as ValuationSource)}
                    >
                      <option value="">Choose…</option>
                      <option value={ValuationSource.HAGERTY}>Hagerty</option>
                      <option value={ValuationSource.NADA_JDPOWER}>J.D. Power (NADA)</option>
                      <option value={ValuationSource.MANUAL}>Appraisal</option>
                    </select>
                  </Field>
                </div>
              )}

              <div className="btn-row">
                <button className="btn btn-block" disabled={busy === 'create'}>
                  {busy === 'create' ? 'Saving…' : 'Save vehicle'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    setShowForm(false);
                    setShowErrors(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}

      <p className="eyebrow">Plan your earnings</p>
      <CarNoteCalculator />

      {ownerId && mode === 'dev' && (
        <p className="caption" style={{ textAlign: 'center' }}>
          Dev session · owner <code>{ownerId}</code> ·{' '}
          <button className="banner-dismiss" style={{ display: 'inline' }} onClick={onSignOutDev}>
            Sign out
          </button>
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
