import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';

@Module({
  controllers: [IdentityController, DriverController],
  providers: [IdentityService, DriverService],
  exports: [IdentityService, DriverService],
})
export class IdentityModule {}
