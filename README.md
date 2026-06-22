# UniDriver

A three-sided mobility marketplace connecting **Car Owners**, **Qualified Drivers**, and
**Riders / Corporate clients**.

> **Governing business rule — "earn-when-they-earn":** UniDriver charges no fees, no
> subscriptions, and no listing charges. The platform earns **only** a revenue share on
> completed, paid trips. Every architectural decision respects this constraint, and it is
> enforced by automated tests (`packages/shared`).

This repository is being built in the phase order defined in the master specification.

## Current status — Phase 0: Foundation ✅

Phase 0 ships the monorepo, shared domain model, and a NestJS skeleton with clean module
boundaries. **No user-facing features yet** — those arrive in Phase 1+. All third-party
integrations (Stripe Connect, Checkr, Smartcar, insurance providers) are stubbed behind
**adapter interfaces with mock implementations**, so the system boots and is testable with
zero external credentials.

What exists today:

| Area | Status |
|---|---|
| pnpm + Turborepo monorepo | ✅ |
| `packages/shared` domain types, enums, money utilities | ✅ |
| Trust-tier rates, thresholds & vehicle-tier gating (pure, tested) | ✅ |
| Payout engine (revenue-share split, integer-cent safe, tested) | ✅ |
| NestJS skeleton — Identity, Vehicle, Booking, Trust, Payments, Insurance modules | ✅ |
| Prisma schema for every Section 5 entity | ✅ |
| Postgres + Redis (docker-compose) + BullMQ queue wiring | ✅ |
| Auth scaffolding (pluggable provider, mock for dev) | ✅ |
| Sentry + health checks + CI | ✅ |
| Adapter interfaces + mocks: Payments / BackgroundCheck / Telematics / Insurance | ✅ |

## In progress — Phase 1: Owner supply MVP 🚧

A first vertical slice is live across all layers: owner registration, **Car Note Mode**, and
vehicle listing/activation — backend endpoints (`apps/api`), a typed Next.js dashboard
(`apps/web`), and the Postgres models, all sharing `@unidriver/shared` types end to end.

See [`docs/PHASES.md`](docs/PHASES.md) for the full roadmap, and
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) to deploy the API on Railway and the web on Vercel.

## Architecture

A **modular monolith** (NestJS). Each domain is a clean module boundary so it can be split
into a service later if scale requires it.

```
apps/
  api/                NestJS modular monolith (backend)
    prisma/           Prisma schema + migration + seed (all domain entities)
    src/
      common/         Prisma, Redis, queue, Sentry, health
      auth/           Pluggable auth provider + guards
      adapters/       Stripe / Checkr / Smartcar / Insurance (interface + mock)
      modules/        identity · vehicle · booking · trust · payments · insurance
  web/                Next.js (App Router) — Owner dashboard + landing
    app/              routes (/, /owner)
    lib/api.ts        typed API client (imports @unidriver/shared)
packages/
  shared/             TypeScript domain types + pure business logic shared everywhere
```

The React Native (`apps/mobile`) workspace slots into the existing `apps/*` glob without
restructuring when Phase 1 mobile work begins.

## Getting started

Prerequisites: Node 22+, pnpm 10+, Docker.

```bash
pnpm install                       # install workspace deps
cp .env.example apps/api/.env      # local config (mock adapters; no real keys needed)
pnpm db:up                         # start Postgres + Redis via docker compose
pnpm --filter @unidriver/api prisma:migrate   # create schema
pnpm --filter @unidriver/api dev   # boot the API on http://localhost:4000
```

Health check: `GET http://localhost:4000/api/health`.

### Run the web app

```bash
pnpm --filter @unidriver/web dev    # http://localhost:3000  (Owner dashboard at /owner)
```

The `/owner` page registers an owner, runs **Car Note Mode** client-side (the same shared
`computeCarNote` the API uses), and lists/creates vehicles through the API.

### Phase 1 endpoints (Owner vertical slice)

Auth uses a dev bearer token `dev:<userId>:<ROLE>` until Clerk/Auth0 is wired.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/owners/register` | public | Create owner User + OwnerProfile |
| `POST` | `/api/owners/car-note` | public | Car Note Mode breakeven calc (§10.1) |
| `GET`  | `/api/owners/me` | OWNER | Current owner + profile |
| `POST` | `/api/vehicles` | OWNER | List a vehicle |
| `GET`  | `/api/vehicles/mine` | OWNER | My vehicles |
| `GET`  | `/api/vehicles/:id` | any | Vehicle by id |
| `POST` | `/api/vehicles/:id/activate` | OWNER | Activate (enforces agreed-value guard) |

## Common commands

```bash
pnpm build         # build all workspaces (Turborepo)
pnpm typecheck     # type-check everything
pnpm test          # run unit tests
pnpm lint          # lint
pnpm format        # prettier write
```

## Money & correctness

All monetary values are **integer minor units (cents)** with an explicit `currency` — never
floats. The split helpers in `packages/shared` conserve every cent (no money created or lost
to rounding). The payout engine derives platform revenue strictly from trip gross, so a
listed-but-idle vehicle produces zero platform revenue — by design.
