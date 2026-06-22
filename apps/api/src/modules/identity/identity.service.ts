import { Inject, Injectable } from '@nestjs/common';
import { BACKGROUND_CHECK_ADAPTER } from '../../adapters/adapters.constants';
import {
  BackgroundCheckAdapter,
  BackgroundCheckResult,
} from '../../adapters/background-check/background-check-adapter.interface';

/**
 * Identity & Vetting boundary. Wraps the background-check provider (Checkr in production).
 * Full onboarding flows arrive in Phase 2.
 */
@Injectable()
export class IdentityService {
  constructor(
    @Inject(BACKGROUND_CHECK_ADAPTER) private readonly backgroundCheck: BackgroundCheckAdapter,
  ) {}

  async startBackgroundCheck(userId: string, email: string): Promise<BackgroundCheckResult> {
    const { candidateId } = await this.backgroundCheck.createCandidate({ userId, email });
    return this.backgroundCheck.requestCheck({ candidateId });
  }

  async refreshBackgroundCheck(checkId: string): Promise<BackgroundCheckResult> {
    return this.backgroundCheck.getCheckStatus(checkId);
  }
}
