/**
 * Background job queues (spec §3 — Redis + BullMQ for payouts, trust recompute,
 * notifications, auto-rebook, dormancy). Processors are added in later phases; Phase 0 wires
 * the queue infrastructure only.
 */
export const QUEUE_NAMES = {
  TRUST_RECOMPUTE: 'trust-recompute',
  PAYOUT: 'payout',
  NOTIFICATIONS: 'notifications',
  AUTO_REBOOK: 'auto-rebook',
  DORMANCY: 'dormancy',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
