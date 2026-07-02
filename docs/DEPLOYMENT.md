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

## Notes

- **Migrations** run automatically on every API start (`prisma migrate deploy`, idempotent).
  New schema changes ship by committing a new migration under `apps/api/prisma/migrations`.
- **Auth** is still the Phase 0 mock (`dev:<userId>:<ROLE>` bearer tokens), which is why the
  production boot requires the explicit `ALLOW_MOCK_AUTH=true` opt-in above. Swap in
  Clerk/Auth0 by implementing `AuthProvider` and binding it in `AuthModule` before a real
  launch, then remove `ALLOW_MOCK_AUTH`.
- **Mobile** (`apps/mobile`, Expo) deploys via EAS later; it will point at the same Railway API.
