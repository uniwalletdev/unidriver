import type { CreateVehicleInput, OwnerProfile, User, Vehicle } from '@unidriver/shared';

/**
 * Thin API client. Note the request/response types come straight from `@unidriver/shared` —
 * the exact same types the NestJS backend uses, so the client cannot drift from the server.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type RegisteredOwner = User & { ownerProfile: OwnerProfile | null };

function jsonHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Register an owner. `token` is required when the API runs real auth (Clerk): the backend
 * verifies it and links its subject to the new account. Omitted in mock/dev mode.
 */
export async function registerOwner(
  input: {
    fullName: string;
    email: string;
    phone: string;
  },
  token?: string,
): Promise<RegisteredOwner> {
  const res = await fetch(`${API_URL}/api/owners/register`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return asJson<RegisteredOwner>(res);
}

/** Fetch the owner account linked to the token, or throw (404/401) when not registered. */
export async function getMyOwner(token: string): Promise<RegisteredOwner> {
  const res = await fetch(`${API_URL}/api/owners/me`, { headers: jsonHeaders(token) });
  return asJson<RegisteredOwner>(res);
}

export async function listMyVehicles(token: string): Promise<Vehicle[]> {
  const res = await fetch(`${API_URL}/api/vehicles/mine`, { headers: jsonHeaders(token) });
  return asJson<Vehicle[]>(res);
}

export async function createVehicle(token: string, input: CreateVehicleInput): Promise<Vehicle> {
  const res = await fetch(`${API_URL}/api/vehicles`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(input),
  });
  return asJson<Vehicle>(res);
}

/** Build the Phase-0 dev bearer token for an owner id (replaced by Clerk/Auth0 later). */
export function devOwnerToken(userId: string): string {
  return `dev:${userId}:OWNER`;
}
