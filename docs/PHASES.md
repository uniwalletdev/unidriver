# Build Phases

UniDriver is built in strict phase order (spec §14). Each phase builds on the last; we do not
skip ahead. This document tracks status and what each phase adds.

## ✅ Phase 0 — Foundation (monorepo, no features) — **DONE**

The scaffolding everything else stands on.

- **Monorepo:** pnpm workspaces + Turborepo (`apps/*`, `packages/*`).
- **`packages/shared`:** canonical enums, money utilities (integer-cent, conserving splits),
  region config, the Trust Engine (score composition, tier thresholds, vehicle-tier gating,
  penalty/recovery events, revenue rates), the owner-loyalty rates, the payout engine, and the
  booking state machine — all pure and unit-tested (25 tests).
- **`apps/api`:** NestJS modular monolith with six clean module boundaries (Identity, Vehicle,
  Booking, Trust, Payments, Insurance), Prisma schema for every Section 5 entity + the initial
  migration, Postgres/Redis wiring, BullMQ queue infrastructure, pluggable auth (mock provider
  + guards), Sentry, a health check, and the four external-integration adapters
  (Payments/Stripe, BackgroundCheck/Checkr, Telematics/Smartcar, Insurance) behind interfaces
  with **mock implementations**.
- **Tooling:** ESLint, Prettier, GitHub Actions CI (generate → validate → typecheck → lint →
  test → build), docker-compose for local Postgres + Redis.

Acceptance invariants already enforced + tested:

- Platform earns **only** a revenue share on trip gross — zero gross ⇒ zero platform revenue
  (earn-when-they-earn).
- Every payout split conserves cents exactly (no float money anywhere).
- Trust-tier vehicle gating is a pure, server-side function the Booking module calls.
- Every payout records `driverTakeRate`, `ownerTakeRate`, and `insuranceCostCents`.

## Phase 1 — Owner supply MVP (Houston)

Owner onboarding, vehicle listing + onboarding inspection, Standard/Comfort/EV/XL tiering,
Smart Calendar core (`AvailabilityRule` engine), Car Note Mode, owner dashboard. Seeds car
supply first to solve cold start.

## Phase 2 — Driver side & vetting

Driver onboarding, **real** Checkr integration, licence verification, Trust Engine v1 wired to
persistence (snapshots + events + nightly recompute), vehicle discovery filtered by trust tier.

## Phase 3 — Booking, handoff, insurance state machine

Full booking orchestration over the state machine, pre/post-trip photo inspections, insurance
binding + coverage states (mock provider, real accounting), owner reclaim + auto-rebook job.

## Phase 4 — Payments & payout engine

Live Stripe Connect, trip ingestion, revenue-share split with trust-tier + owner-loyalty rates,
payout reconciliation, zero-earning/dormancy handling.

## Phase 5 — Trust depth, claims, Shield

Full trust events/penalties/recovery, claims workflow with SLA timers, UniDriver Shield incl.
lost-earnings coverage, post-trip Car Health Report from telematics.

## Phase 6 — Premium/Luxury/Exotic enablement

Agreed-value valuation integration, bespoke insurance adapter, owner driver-preview rights,
mileage caps, concierge inspection workflow, Fleet Console.

## Phase 7 — Growth & B2B

Owner & driver referral engines, owner loyalty tiers, shareable trust credential, UniDriver
Business corporate accounts, surge-aware prestige pricing.

## Phase 8 — Region expansion scaffolding

Activate Canada then UK regulatory rulesets, regional insurance adapters, multi-currency payout
verification.
