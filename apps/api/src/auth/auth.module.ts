import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AUTH_PROVIDER } from './auth.constants';
import { AuthProvider } from './auth-provider.interface';
import { MockAuthProvider } from './mock-auth.provider';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Provides the active auth provider behind the {@link AUTH_PROVIDER} token, selected by
 * `AUTH_PROVIDER` (config `auth.provider`). Only the mock exists until Clerk/Auth0 lands.
 *
 * Mock tokens (`dev:<userId>:<ROLE>`) grant any role to anyone who can reach the API, so a
 * production boot with the mock is refused unless ALLOW_MOCK_AUTH=true is set explicitly
 * (e.g. for a protected staging/pilot environment).
 */
@Global()
@Module({
  providers: [
    MockAuthProvider,
    {
      provide: AUTH_PROVIDER,
      inject: [ConfigService, MockAuthProvider],
      useFactory: (config: ConfigService, mock: MockAuthProvider): AuthProvider => {
        const provider = config.get<string>('auth.provider') ?? 'mock';
        if (provider !== 'mock') {
          throw new Error(
            `AUTH_PROVIDER="${provider}" is not implemented yet — only "mock" is available in this phase`,
          );
        }
        if (
          config.get<string>('env') === 'production' &&
          !config.get<boolean>('auth.allowMockInProduction')
        ) {
          throw new Error(
            'Refusing to start with mock auth in production: dev bearer tokens grant any role ' +
              '(including ADMIN) to anyone. Set ALLOW_MOCK_AUTH=true only for a protected ' +
              'staging/pilot environment, or wire a real AuthProvider.',
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
