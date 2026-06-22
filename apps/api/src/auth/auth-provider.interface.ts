import type { Request } from 'express';
import { UserRole } from '@unidriver/shared';

export interface AuthClaims {
  userId: string;
  role: UserRole;
  email?: string;
}

/**
 * Pluggable authentication provider. Phase 0 ships a mock; Clerk/Auth0 implement the same
 * interface and are swapped in via {@link AUTH_PROVIDER} without touching call sites.
 */
export interface AuthProvider {
  verifyToken(token: string): Promise<AuthClaims>;
}

export interface RequestWithUser extends Request {
  user?: AuthClaims;
}
