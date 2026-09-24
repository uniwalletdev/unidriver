import { Body, Controller, Get, Inject, Post, Req, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@unidriver/shared';
import { AUTH_PROVIDER } from '../../auth/auth.constants';
import type { AuthClaims, AuthProvider, RequestWithUser } from '../../auth/auth-provider.interface';
import { extractBearerToken } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { Public } from '../../auth/public.decorator';
import { Roles } from '../../auth/roles.decorator';
import { DriverService } from './driver.service';
import { RegisterDriverDto } from './dto/register-driver.dto';

@Controller('drivers')
export class DriverController {
  constructor(
    private readonly drivers: DriverService,
    @Inject(AUTH_PROVIDER) private readonly authProvider: AuthProvider,
  ) {}

  /**
   * Driver onboarding (Phase 2). Public, like owner registration: with an external IdP the
   * caller must already be signed in, and the verified subject is linked to the account.
   */
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDriverDto, @Req() req: RequestWithUser) {
    let externalId: string | undefined;
    if (this.authProvider.verifyExternalIdentity) {
      const token = extractBearerToken(req);
      if (!token) {
        throw new UnauthorizedException(
          'Sign in first — registration links your login to the new driver account',
        );
      }
      externalId = (await this.authProvider.verifyExternalIdentity(token)).subject;
    }
    return this.drivers.register(dto, externalId);
  }

  @Roles(UserRole.DRIVER)
  @Get('me')
  me(@CurrentUser() user: AuthClaims) {
    return this.drivers.getAccount(user.userId);
  }

  @Roles(UserRole.DRIVER)
  @Post('me/background-check')
  refreshBackgroundCheck(@CurrentUser() user: AuthClaims) {
    return this.drivers.refreshBackgroundCheck(user.userId);
  }

  @Roles(UserRole.DRIVER)
  @Post('me/payout-account')
  connectPayoutAccount(@CurrentUser() user: AuthClaims) {
    return this.drivers.connectPayoutAccount(user.userId);
  }
}
