import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { QueueModule } from './common/queue/queue.module';
import { HealthModule } from './common/health/health.module';
import { AllExceptionsFilter } from './common/sentry/all-exceptions.filter';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { AdaptersModule } from './adapters/adapters.module';
import { IdentityModule } from './modules/identity/identity.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { BookingModule } from './modules/booking/booking.module';
import { TrustModule } from './modules/trust/trust.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InsuranceModule } from './modules/insurance/insurance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, load: [configuration] }),
    // Infrastructure (all global).
    PrismaModule,
    RedisModule,
    QueueModule,
    AuthModule,
    AdaptersModule,
    // Operational.
    HealthModule,
    // Domain modules — clean boundaries within the modular monolith (spec §4).
    IdentityModule,
    VehicleModule,
    BookingModule,
    TrustModule,
    PaymentsModule,
    InsuranceModule,
  ],
  providers: [
    // Authn runs before authz; both are global so every route is protected unless @Public.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
