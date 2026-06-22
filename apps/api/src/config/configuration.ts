import { Region } from '@unidriver/shared';

export type AdapterMode = 'mock' | 'live';

export interface AppConfig {
  env: string;
  port: number;
  defaultRegion: Region;
  database: { url: string };
  redis: { url: string };
  auth: {
    provider: string;
    issuer?: string;
    audience?: string;
    jwksUrl?: string;
  };
  sentry: { dsn?: string; tracesSampleRate: number };
  /** In Phase 0 every external integration runs in "mock" mode (spec §14). */
  adapterMode: AdapterMode;
}

function parseRegion(value: string | undefined): Region {
  if (value && (Object.values(Region) as string[]).includes(value)) {
    return value as Region;
  }
  return Region.US;
}

/** Pure env reader — usable before the Nest container is built (e.g. Sentry init in main). */
export function loadConfig(): AppConfig {
  return {
    env: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 4000),
    defaultRegion: parseRegion(process.env.DEFAULT_REGION),
    database: {
      url: process.env.DATABASE_URL ?? '',
    },
    redis: {
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    },
    auth: {
      provider: process.env.AUTH_PROVIDER ?? 'mock',
      issuer: process.env.AUTH_JWT_ISSUER || undefined,
      audience: process.env.AUTH_JWT_AUDIENCE || undefined,
      jwksUrl: process.env.AUTH_JWKS_URL || undefined,
    },
    sentry: {
      dsn: process.env.SENTRY_DSN || undefined,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    },
    adapterMode: (process.env.ADAPTER_MODE as AdapterMode) ?? 'mock',
  };
}

/** ConfigModule factory. */
export default loadConfig;
