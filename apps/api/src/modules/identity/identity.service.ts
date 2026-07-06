import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { RegisterOwnerInput } from '@unidriver/shared';
import { BACKGROUND_CHECK_ADAPTER } from '../../adapters/adapters.constants';
import {
  BackgroundCheckAdapter,
  BackgroundCheckResult,
} from '../../adapters/background-check/background-check-adapter.interface';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Identity & Vetting boundary. Owns user/owner persistence and wraps the background-check
 * provider (Checkr in production). Driver onboarding flows arrive in Phase 2.
 */
@Injectable()
export class IdentityService {
  constructor(
    @Inject(BACKGROUND_CHECK_ADAPTER) private readonly backgroundCheck: BackgroundCheckAdapter,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Register a car owner (Phase 1 onboarding). Creates the User + empty OwnerProfile.
   * `authProviderId` is the verified external IdP subject (Clerk user id) when auth is not
   * the mock; re-registering from the same login returns the already-linked account.
   */
  async registerOwner(input: RegisterOwnerInput, authProviderId?: string) {
    if (authProviderId) {
      const existing = await this.prisma.user.findUnique({
        where: { authProviderId },
        include: { ownerProfile: true },
      });
      if (existing) {
        return existing;
      }
    }
    try {
      return await this.prisma.user.create({
        data: {
          role: UserRole.OWNER,
          status: UserStatus.ACTIVE,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          // Shared and Prisma enums share string values 1:1 (schema mirrors @unidriver/shared).
          region: (input.region ?? 'US') as Prisma.UserCreateInput['region'],
          authProviderId,
          ownerProfile: { create: {} },
        },
        include: { ownerProfile: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with this email or phone already exists');
      }
      throw error;
    }
  }

  async getOwner(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { ownerProfile: true },
    });
  }

  async startBackgroundCheck(userId: string, email: string): Promise<BackgroundCheckResult> {
    const { candidateId } = await this.backgroundCheck.createCandidate({ userId, email });
    return this.backgroundCheck.requestCheck({ candidateId });
  }

  async refreshBackgroundCheck(checkId: string): Promise<BackgroundCheckResult> {
    return this.backgroundCheck.getCheckStatus(checkId);
  }
}
