import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@unidriver/shared';
import { AuthClaims, AuthProvider } from './auth-provider.interface';

/**
 * Development auth provider. Dev tokens look like `dev:<userId>:<ROLE>`,
 * e.g. `dev:usr_123:OWNER`. Replaced by a real Clerk/Auth0 verifier in a later phase.
 */
@Injectable()
export class MockAuthProvider implements AuthProvider {
  async verifyToken(token: string): Promise<AuthClaims> {
    const parts = token.split(':');
    if (parts.length === 3 && parts[0] === 'dev') {
      const [, userId, role] = parts;
      if ((Object.values(UserRole) as string[]).includes(role)) {
        return { userId, role: role as UserRole };
      }
    }
    throw new UnauthorizedException('Invalid mock token (expected dev:<userId>:<ROLE>)');
  }
}
