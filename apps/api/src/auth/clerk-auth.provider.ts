import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@unidriver/shared';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { PrismaService } from '../common/prisma/prisma.service';
import type { AppConfig } from '../config/configuration';
import { AuthClaims, AuthProvider, ExternalIdentity } from './auth-provider.interface';

/**
 * Clerk auth provider. Verifies Clerk session JWTs against the instance JWKS
 * (`AUTH_JWT_ISSUER`, e.g. https://your-instance.clerk.accounts.dev), then resolves the
 * UniDriver account linked to the Clerk user via `User.authProviderId` — set once at
 * registration (see IdentityController). Works unchanged for any JWKS-based IdP (Auth0 etc.).
 */
@Injectable()
export class ClerkAuthProvider implements AuthProvider {
  private readonly auth: AppConfig['auth'];
  private jwks?: ReturnType<typeof createRemoteJWKSet>;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.auth = config.get<AppConfig['auth']>('auth', { infer: true })!;
  }

  /** Invoked at bootstrap when AUTH_PROVIDER=clerk so misconfiguration fails fast. */
  assertConfigured(): void {
    if (!this.auth.issuer) {
      throw new Error(
        'AUTH_PROVIDER=clerk requires AUTH_JWT_ISSUER ' +
          '(your Clerk Frontend API URL, e.g. https://your-instance.clerk.accounts.dev)',
      );
    }
  }

  async verifyToken(token: string): Promise<AuthClaims> {
    const identity = await this.verifyExternalIdentity(token);
    const user = await this.prisma.user.findUnique({
      where: { authProviderId: identity.subject },
    });
    if (!user) {
      throw new UnauthorizedException(
        'This login is not linked to a UniDriver account yet — complete registration first.',
      );
    }
    // Prisma and shared enums share string values 1:1 (schema mirrors @unidriver/shared).
    return { userId: user.id, role: user.role as UserRole, email: identity.email };
  }

  async verifyExternalIdentity(token: string): Promise<ExternalIdentity> {
    this.assertConfigured();
    if (!this.jwks) {
      const jwksUrl =
        this.auth.jwksUrl ?? new URL('/.well-known/jwks.json', this.auth.issuer).toString();
      this.jwks = createRemoteJWKSet(new URL(jwksUrl));
    }

    let payload: JWTPayload;
    try {
      ({ payload } = await jwtVerify(token, this.jwks, {
        issuer: this.auth.issuer,
        // Clerk session tokens carry no audience by default; enforce only when configured.
        ...(this.auth.audience ? { audience: this.auth.audience } : {}),
      }));
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (!payload.sub) {
      throw new UnauthorizedException('Token has no subject claim');
    }
    return {
      subject: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  }
}
