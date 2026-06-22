import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@unidriver/shared';
import type { AuthClaims } from '../../auth/auth-provider.interface';
import { CurrentUser } from '../../auth/current-user.decorator';
import { Roles } from '../../auth/roles.decorator';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehicleService } from './vehicle.service';

@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicles: VehicleService) {}

  @Roles(UserRole.OWNER)
  @Post()
  create(@CurrentUser() user: AuthClaims, @Body() dto: CreateVehicleDto) {
    return this.vehicles.create(user.userId, dto);
  }

  @Roles(UserRole.OWNER)
  @Get('mine')
  mine(@CurrentUser() user: AuthClaims) {
    return this.vehicles.listForOwner(user.userId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.vehicles.get(id);
  }

  @Roles(UserRole.OWNER)
  @Post(':id/activate')
  activate(@CurrentUser() user: AuthClaims, @Param('id') id: string) {
    return this.vehicles.activate(id, user.userId);
  }
}
