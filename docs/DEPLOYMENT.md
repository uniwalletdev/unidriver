# Deployment — Railway (API + Postgres) + Vercel (web)

Topology:

```
Browser ──> Vercel (apps/web, Next.js)
                │  fetch  NEXT_PUBLIC_API_URL
                ▼
            Railway (apps/api, NestJS)  ──>  Railway Postgres
                                         ──>  Railway Redis (optional)
```

The repo already contains everything needed: a root `Dockerfile` + `railway.json` for the API,
and `apps/web/vercel.json` for the web. The API binds `0.0.0.0`, reads `PORT`, and runs
`prisma migrate deploy` on startup.

---

## 1. Railway — backend API + database

1. **New Project → Deploy from GitHub repo**, pick this repo and the
   `claude/affectionate-einstein-iuigqj` branch (or `main` after you merge).
2. Railway detects `railway.json` and builds with the root **Dockerfile** automatically.
3. **Add a Postgres** service: Project → *New* → *Database* → *Add PostgreSQL*.
4. *(Optional)* **Add a Redis** service the same way. The API boots fine without it
   (job queues are unused until later phases; `/api/health` will just show `redis: down`).
5. On the **API service → Variables**, set:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`  (reference the Postgres service)
   - `REDIS_URL` = `${{Redis.REDIS_URL}}`  *(only if you added Redis)*
   - `NODE_ENV` = `production`
   - `ALLOW_MOCK_AUTH` = `true`  *(required while auth is the Phase 0 mock — the API
     refuses to boot with mock auth in production without this explicit opt-in, because
     dev bearer tokens grant any role; remove it once Clerk/Auth0 is wired)*
   - `CORS_ORIGINS` = your Vercel URL, e.g. `https://unidriver.vercel.app`
   - `ADAPTER_MODE` = `mock`  *(until real Stripe/Checkr/Smartcar keys are added)*
   - *(optional)* `SENTRY_DSN`
   - Do **not** set `PORT` — Railway injects it.
6. Deploy. The container runs `prisma migrate deploy` then starts the API. Confirm the
   healthcheck passes at `/api/health`, and note the public URL Railway assigns
   (e.g. `https://unidriver-api-production.up.railway.app`).
7. *(Optional, once)* seed reference data — run in the service shell or as a one-off:
   `pnpm --filter @unidriver/api prisma:seed`.

## 2. Vercel — web app

1. **Add New → Project**, import this repo.
2. Set **Root Directory** to `apps/web`. Vercel reads `apps/web/vercel.json`, which uses
   `pnpm turbo run build --filter=@unidriver/web` (this builds `@unidriver/shared` first).
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = your Railway API URL from step 1.6
     (e.g. `https://unidriver-api-production.up.railway.app`).
4. Deploy. Open the site; `/owner` should register an owner and create vehicles against the
   Railway API.

## 3. Close the loop

After both are live, make sure `CORS_ORIGINS` on Railway includes the exact Vercel domain
(including `https://`, no trailing slash). Redeploy the API if you change it. For Vercel
preview deployments (which get unique URLs), either add them to `CORS_ORIGINS` or leave
`CORS_ORIGINS` unset to reflect any origin (safe here because auth is Bearer-token, not cookies).

## Troubleshooting

### Vercel 500s with `No exports found in module ".../apps/api/src/main.js"`

A Vercel project (e.g. one named `unidriver-api`) is pointed at this repo and is deploying the
**API** to Vercel's serverless runtime. That can never work: `apps/api` is a long-running NestJS
server — `main.ts` calls `app.listen()` and exports nothing, while Vercel's Node runtime requires
the entry module to export a handler or a server. The function boots Nest, Vercel finds no
export, and every request 500s.

**Fix: delete that Vercel project.** The API deploys to Railway (section 1); the only Vercel
project should be the web app with **Root Directory = `apps/web`** (section 2). Guard
`vercel.json` files at the repo root and in `apps/api` now fail such deploys at build time with
a pointer here — but only on branches that contain them, so stale branches can still exhibit
the runtime failure.

### Clerk keys are set but authentication doesn't work

Setting `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` (on Vercel, Railway, or
anywhere else) has **no effect today** — no code in the repo reads them. Auth is still the
Phase 0 mock provider (`AuthModule` binds `MockAuthProvider`; the `AUTH_PROVIDER` env var is
parsed into config but not yet consulted), and the web app does not include `@clerk/nextjs`.
Until Clerk is actually integrated, authenticate with dev bearer tokens: `dev:<userId>:<ROLE>`,
e.g. `dev:usr_123:OWNER`. Integrating Clerk means: add Clerk to `apps/web` (provider,
middleware, sign-in UI), implement a Clerk `AuthProvider` in `apps/api` that verifies session
JWTs via Clerk's JWKS, bind it in `AuthModule` when `AUTH_PROVIDER=clerk`, and link Clerk user
ids to the `User` records created at registration.

## Notes

- **Migrations** run automatically on every API start (`prisma migrate deploy`, idempotent).
  New schema changes ship by committing a new migration under `apps/api/prisma/migrations`.
- **Auth** is still the Phase 0 mock (`dev:<userId>:<ROLE>` bearer tokens), which is why the
  production boot requires the explicit `ALLOW_MOCK_AUTH=true` opt-in above. Swap in
  Clerk/Auth0 by implementing `AuthProvider` and binding it in `AuthModule` before a real
  launch, then remove `ALLOW_MOCK_AUTH`.
- **Mobile** (`apps/mobile`, Expo) deploys via EAS later; it will point at the same Railway API.
