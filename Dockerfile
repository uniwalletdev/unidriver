# UniDriver API container (NestJS) — used by Railway and any Docker host.
# Build context is the monorepo root so packages/shared is available.

# --- build stage: install everything, build shared + api, generate Prisma client ---
FROM node:22-slim AS build
RUN corepack enable \
  && apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @unidriver/shared build \
  && pnpm --filter @unidriver/api prisma:generate \
  && pnpm --filter @unidriver/api build

# --- runtime stage ---
FROM node:22-slim AS runtime
RUN corepack enable \
  && apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app /app
WORKDIR /app/apps/api

# Railway injects PORT; the app reads it. Apply migrations, then start.
EXPOSE 4000
CMD ["sh", "-c", "pnpm prisma:deploy && pnpm start"]
