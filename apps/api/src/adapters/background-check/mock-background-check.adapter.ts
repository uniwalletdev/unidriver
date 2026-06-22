import { Injectable } from '@nestjs/common';
import { BackgroundCheckStatus } from '@unidriver/shared';
import {
  BackgroundCheckAdapter,
  BackgroundCheckResult,
  CreateCandidateParams,
  RequestCheckParams,
} from './background-check-adapter.interface';

/** Phase 0 mock — issues fake ids and reports a clear check. */
@Injectable()
export class MockBackgroundCheckAdapter implements BackgroundCheckAdapter {
  async createCandidate(params: CreateCandidateParams): Promise<{ candidateId: string }> {
    return { candidateId: `cand_mock_${params.userId}` };
  }

  async requestCheck(params: RequestCheckParams): Promise<BackgroundCheckResult> {
    return { checkId: `chk_mock_${params.candidateId}`, status: BackgroundCheckStatus.PENDING };
  }

  async getCheckStatus(checkId: string): Promise<BackgroundCheckResult> {
    return { checkId, status: BackgroundCheckStatus.CLEAR };
  }
}
