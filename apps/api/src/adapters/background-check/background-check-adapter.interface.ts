import { BackgroundCheckStatus } from '@unidriver/shared';

/** Background-check adapter — Checkr in production (spec §3, Phase 2). */

export interface CreateCandidateParams {
  userId: string;
  email: string;
}

export interface RequestCheckParams {
  candidateId: string;
}

export interface BackgroundCheckResult {
  checkId: string;
  status: BackgroundCheckStatus;
}

export interface BackgroundCheckAdapter {
  createCandidate(params: CreateCandidateParams): Promise<{ candidateId: string }>;
  requestCheck(params: RequestCheckParams): Promise<BackgroundCheckResult>;
  getCheckStatus(checkId: string): Promise<BackgroundCheckResult>;
}
