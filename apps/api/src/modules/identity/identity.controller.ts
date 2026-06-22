import { Body, Controller, Get, NotFoundException, Post } from '@nestjs/common';
import { computeCarNote, UserRole } from '@unidriver/shared';
import type { AuthClaims } from '../../auth/auth-provider.interface';
import { CurrentUser } from '../../auth/current-user.decorator';
import { Public } from '../../auth/public.decorator';
import { Roles } from '../../auth/roles.decorator';
import { CarNoteDto } from './dto/car-note.dto';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { IdentityService } from './identity.service';

@Controller('owners')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  /** Owner onboarding (Phase 1). Public — no account exists yet. */
  @Public()
  @Post('register')
  register(@Body() dto: RegisterOwnerDto) {
    return this.identity.registerOwner(dto);
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
