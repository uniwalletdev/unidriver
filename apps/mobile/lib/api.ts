import type { DiscoverableVehicle, DriverAccount, RegisterDriverInput } from '@unidriver/shared';

/**
 * Typed API client. Types come from @unidriver/shared, the same ones the NestJS API returns.
 * On a physical device or Android emulator, set EXPO_PUBLIC_API_URL to a reachable host
 * (localhost there is the device itself).
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, "Can't reach UniDriver. Check your connection and try again.");
  }
  const body = await res.text();
  if (!res.ok) {
    let message = body || res.statusText;
    try {
      const parsed = JSON.parse(body) as { message?: string | string[] };
      if (parsed.message) {
        message = Array.isArray(parsed.message) ? parsed.message.join('\n') : parsed.message;
      }
    } catch {
      // Non-JSON error body — keep the raw text.
    }
    throw new ApiError(res.status, message);
  }
  return JSON.parse(body) as T;
}

export const api = {
  registerDriver: (input: RegisterDriverInput, token?: string) =>
    request<DriverAccount>(
      '/api/drivers/register',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      token,
    ),
  me: (token: string) => request<DriverAccount>('/api/drivers/me', {}, token),
  refreshBackgroundCheck: (token: string) =>
    request<DriverAccount>('/api/drivers/me/background-check', { method: 'POST' }, token),
  connectPayoutAccount: (token: string) =>
    request<DriverAccount>('/api/drivers/me/payout-account', { method: 'POST' }, token),
  discover: (token: string) => request<DiscoverableVehicle[]>('/api/vehicles/discover', {}, token),
};

/** Phase-0 dev bearer token (replaced by Clerk Expo session tokens). */
export function devDriverToken(userId: string): string {
  return `dev:${userId}:DRIVER`;
}
