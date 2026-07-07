import type { Request } from 'express';
import { UserRole } from '@unidriver/shared';

export interface AuthClaims {
  userId: string;
  role: UserRole;
  email?: string;
}

/** A verified identity at the external IdP, before any UniDriver account exists for it. */
export interface ExternalIdentity {
  /** Stable subject at the IdP (e.g. Clerk user id) — persisted as `User.authProviderId`. */
  subject: string;
  email?: string;
}

/**
 * Pluggable authentication provider. Phase 0 ships a mock; Clerk/Auth0 implement the same
 * interface and are swapped in via {@link AUTH_PROVIDER} without touching call sites.
 */
export interface AuthProvider {
  verifyToken(token: string): Promise<AuthClaims>;
  /**
   * Present only when identities live in an external IdP. Verifies a token for a possibly
   * not-yet-registered user so registration can link the IdP subject to the new account.
   */
  verifyExternalIdentity?(token: string): Promise<ExternalIdentity>;
}

export interface RequestWithUser extends Request {
  user?: AuthClaims;
}
