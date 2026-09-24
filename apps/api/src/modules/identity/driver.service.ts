import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BackgroundCheckStatus, Prisma, UserRole, UserStatus } from '@prisma/client';
import {
  BackgroundCheckStatus as SharedCheckStatus,
  DriverAccount,
  driverOnboardingSteps,
  isDriverApproved,
  RegisterDriverInput,
  tenureMonths,
  trustProgress,
} from '@unidriver/shared';
import { BACKGROUND_CHECK_ADAPTER, PAYMENTS_ADAPTER } from '../../adapters/adapters.constants';
import { BackgroundCheckAdapter } from '../../adapters/background-check/background-check-adapter.interface';
import { PaymentsAdapter } from '../../adapters/payments/payments-adapter.interface';
import { PrismaService } from '../../common/prisma/prisma.service';

const withDriver = { driverProfile: true } as const;
type UserWithDriver = Prisma.UserGetPayload<{ include: typeof withDriver }>;

/**
 * Driver onboarding and vetting (Phase 2, spec §6). Owns DriverProfile persistence and drives
 * the background-check and payout-account adapters; the tier and readiness rules themselves
 * live in `@unidriver/shared`.
 */
@Injectable()
export class DriverService {
  private readonly logger = new Logger(DriverService.name);

  constructor(
    @Inject(BACKGROUND_CHECK_ADAPTER) private readonly backgroundCheck: BackgroundCheckAdapter,
    @Inject(PAYMENTS_ADAPTER) private readonly payments: PaymentsAdapter,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a driver account (or add driving to an existing owner's account, making it BOTH),
   * then start the background check. A failed check request leaves the status NOT_STARTED so
   * the driver can retry from the app.
   */
  async register(input: RegisterDriverInput, authProviderId?: string): Promise<DriverAccount> {
    const profile = {
      licenceNumber: input.licenceNumber.replace(/\s/g, '').toUpperCase(),
      licenceState: input.licenceState.trim().toUpperCase(),
    };

    let user: UserWithDriver | null = null;
    if (authProviderId) {
      const existing = await this.prisma.user.findUnique({
        where: { authProviderId },
        include: withDriver,
      });
      if (existing?.driverProfile) {
        return this.toAccount(existing);
      }
      if (existing) {
        user = await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            role: existing.role === UserRole.OWNER ? UserRole.BOTH : existing.role,
            driverProfile: { create: profile },
          },
          include: withDriver,
        });
      }
    }

    if (!user) {
      try {
        user = await this.prisma.user.create({
          data: {
            role: UserRole.DRIVER,
            // Drivers stay PENDING until vetting completes (spec §6).
            status: UserStatus.PENDING,
            fullName: input.fullName,
            email: input.email,
            phone: input.phone,
            authProviderId,
            driverProfile: { create: profile },
          },
          include: withDriver,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new ConflictException('An account with this email or phone already exists');
        }
        throw error;
      }
    }

    return this.toAccount(await this.startCheck(user));
  }

  async getAccount(userId: string): Promise<DriverAccount> {
    return this.toAccount(await this.findDriver(userId));
  }

  /** Start the check if it never started; otherwise pull the latest status from the provider. */
  async refreshBackgroundCheck(userId: string): Promise<DriverAccount> {
    const user = await this.findDriver(userId);
    const profile = user.driverProfile!;
    if (!profile.backgroundCheckId) {
      return this.toAccount(await this.startCheck(user));
    }
    const result = await this.backgroundCheck.getCheckStatus(profile.backgroundCheckId);
    return this.toAccount(await this.applyCheckStatus(user, result.status));
  }

  /** Create the Stripe Connect account that receives the driver's share of each trip. */
  async connectPayoutAccount(userId: string): Promise<DriverAccount> {
    const user = await this.findDriver(userId);
    const account = user.driverProfile!.payoutAccountId
      ? await this.payments.getAccountStatus(user.driverProfile!.payoutAccountId)
      : await this.payments.createConnectedAccount({
          userId: user.id,
          email: user.email,
          country: user.region,
        });
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        driverProfile: {
          update: {
            payoutAccountId: account.accountId,
            bankAccountConnected: account.payoutsEnabled,
          },
        },
      },
      include: withDriver,
    });
    return this.toAccount(await this.activateIfApproved(updated));
  }

  private async findDriver(userId: string): Promise<UserWithDriver> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: withDriver });
    if (!user?.driverProfile) {
      throw new NotFoundException('Driver not found');
    }
    return user;
  }

  private async startCheck(user: UserWithDriver): Promise<UserWithDriver> {
    try {
      const { candidateId } = await this.backgroundCheck.createCandidate({
        userId: user.id,
        email: user.email,
      });
      const check = await this.backgroundCheck.requestCheck({ candidateId });
      await this.prisma.driverProfile.update({
        where: { userId: user.id },
        data: { backgroundCheckId: check.checkId },
      });
      return this.applyCheckStatus(user, check.status);
    } catch (error) {
      this.logger.warn(`Background check request failed for ${user.id}: ${String(error)}`);
      return user;
    }
  }

  /**
   * Persist a check result. The motor-vehicle record is part of the check, so a CLEAR result
   * also verifies the licence (spec §6, US checks: MVR, criminal, SSN trace).
   */
  private async applyCheckStatus(
    user: UserWithDriver,
    status: SharedCheckStatus,
  ): Promise<UserWithDriver> {
    const clear = status === SharedCheckStatus.CLEAR;
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        driverProfile: {
          update: {
            // Shared and Prisma enums share string values 1:1.
            backgroundCheckStatus: status as unknown as BackgroundCheckStatus,
            licenceVerifiedAt: clear ? (user.driverProfile!.licenceVerifiedAt ?? new Date()) : null,
          },
        },
      },
      include: withDriver,
    });
    return this.activateIfApproved(updated);
  }

  /** A pending driver whose onboarding is complete becomes ACTIVE. */
  private async activateIfApproved(user: UserWithDriver): Promise<UserWithDriver> {
    if (user.status !== UserStatus.PENDING || !isDriverApproved(this.readiness(user))) {
      return user;
    }
    return this.prisma.user.update({
      where: { id: user.id },
      data: { status: UserStatus.ACTIVE },
      include: withDriver,
    });
  }

  private readiness(user: UserWithDriver) {
    const p = user.driverProfile!;
    return {
      licenceVerifiedAt: p.licenceVerifiedAt,
      backgroundCheckStatus: p.backgroundCheckStatus as unknown as SharedCheckStatus,
      bankAccountConnected: p.bankAccountConnected,
    };
  }

  private toAccount(user: UserWithDriver): DriverAccount {
    const p = user.driverProfile!;
    const months = tenureMonths(p.joinedAt);
    const readiness = this.readiness(user);
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      region: user.region,
      licenceState: p.licenceState,
      licenceLast4: p.licenceNumber.slice(-4),
      backgroundCheckStatus: readiness.backgroundCheckStatus,
      bankAccountConnected: p.bankAccountConnected,
      trustScore: p.trustScore,
      completedTrips: p.completedTrips,
      tenureMonths: months,
      onboarding: driverOnboardingSteps(readiness),
      approved: isDriverApproved(readiness),
      progress: trustProgress(p.trustScore, p.completedTrips, months),
    };
  }
}
