import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { computeCarNote, UserRole } from '@unidriver/shared';
import { AUTH_PROVIDER } from '../../auth/auth.constants';
import type { AuthClaims, AuthProvider, RequestWithUser } from '../../auth/auth-provider.interface';
import { extractBearerToken } from '../../auth/auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import { Public } from '../../auth/public.decorator';
import { Roles } from '../../auth/roles.decorator';
import { CarNoteDto } from './dto/car-note.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { IdentityService } from './identity.service';

@Controller('owners')
export class IdentityController {
  constructor(
    private readonly identity: IdentityService,
    @Inject(AUTH_PROVIDER) private readonly authProvider: AuthProvider,
  ) {}

  /**
   * Owner onboarding (Phase 1). Public — no account exists yet. When identities live in an
   * external IdP (Clerk), the caller must already be signed in there: the token is verified
   * and its subject linked to the new account, which is how later requests authenticate.
   * The mock provider has no external identity, so no token is expected in dev.
   */
  @Public()
  @Post('register')
  async register(@Body() dto: RegisterOwnerDto, @Req() req: RequestWithUser) {
    let externalId: string | undefined;
    if (this.authProvider.verifyExternalIdentity) {
      const token = extractBearerToken(req);
      if (!token) {
        throw new UnauthorizedException(
          'Sign in first — registration links your login to the new owner account',
        );
      }
      externalId = (await this.authProvider.verifyExternalIdentity(token)).subject;
    }
    return this.identity.registerOwner(dto, externalId);
  }

  /** Car Note Mode (spec §10.1) — pure calc, runs the same shared logic as the client. */
  @Public()
  @Post('car-note')
  carNote(@Body() dto: CarNoteDto) {
    return computeCarNote(dto);
  }

  @Roles(UserRole.OWNER)
  @Get('me')
  async me(@CurrentUser() user: AuthClaims) {
    const owner = await this.identity.getOwner(user.userId);
    if (!owner) {
      throw new NotFoundException('Owner not found');
    }
    return owner;
  }
}
