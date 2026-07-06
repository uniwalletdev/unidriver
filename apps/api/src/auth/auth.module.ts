import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AUTH_PROVIDER } from './auth.constants';
import { AuthProvider } from './auth-provider.interface';
import { ClerkAuthProvider } from './clerk-auth.provider';
import { MockAuthProvider } from './mock-auth.provider';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Provides the active auth provider behind the {@link AUTH_PROVIDER} token, selected by
 * `AUTH_PROVIDER` env: `mock` (default, dev tokens) or `clerk` (Clerk session JWTs).
 *
 * Mock tokens (`dev:<userId>:<ROLE>`) grant any role to anyone who can reach the API, so a
 * production boot with the mock is refused unless ALLOW_MOCK_AUTH=true is set explicitly
 * (e.g. for a protected staging/pilot environment).
 */
@Global()
@Module({
  providers: [
    MockAuthProvider,
    ClerkAuthProvider,
    {
      provide: AUTH_PROVIDER,
      inject: [ConfigService, MockAuthProvider, ClerkAuthProvider],
      useFactory: (
        config: ConfigService,
        mock: MockAuthProvider,
        clerk: ClerkAuthProvider,
      ): AuthProvider => {
        const provider = config.get<string>('auth.provider') ?? 'mock';
        if (provider === 'clerk') {
          clerk.assertConfigured();
          return clerk;
        }
        if (provider !== 'mock') {
          throw new Error(`Unsupported AUTH_PROVIDER "${provider}" (expected "mock" or "clerk")`);
        }
        if (
          config.get<string>('env') === 'production' &&
          !config.get<boolean>('auth.allowMockInProduction')
        ) {
          throw new Error(
            'Refusing to start with mock auth in production: dev bearer tokens grant any role ' +
              '(including ADMIN) to anyone. Set AUTH_PROVIDER=clerk for real auth, or set ' +
              'ALLOW_MOCK_AUTH=true only for a protected staging/pilot environment.',
          );
        }
        return mock;
      },
    },
    AuthGuard,
    RolesGuard,
  ],
  exports: [AUTH_PROVIDER, AuthGuard, RolesGuard],
})
export class AuthModule {}
