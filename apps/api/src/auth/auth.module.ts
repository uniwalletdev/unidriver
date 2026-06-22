import { Global, Module } from '@nestjs/common';
import { AUTH_PROVIDER } from './auth.constants';
import { MockAuthProvider } from './mock-auth.provider';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Provides the active auth provider behind the {@link AUTH_PROVIDER} token. Phase 0 binds the
 * mock; later phases switch on `config.auth.provider` to a Clerk/Auth0 verifier.
 */
@Global()
@Module({
  providers: [
    MockAuthProvider,
    { provide: AUTH_PROVIDER, useExisting: MockAuthProvider },
    AuthGuard,
    RolesGuard,
  ],
  exports: [AUTH_PROVIDER, AuthGuard, RolesGuard],
})
export class AuthModule {}
