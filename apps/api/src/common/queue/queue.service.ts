import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { QueueName } from './queue.constants';

/**
 * Lazily creates and caches BullMQ queues. Queues connect to Redis on first use, so this is
 * safe to instantiate at boot without Redis running. Workers/processors arrive in later
 * phases (payouts, trust recompute, auto-rebook, dormancy).
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<QueueName, Queue>();

  constructor(@Inject(REDIS_CLIENT) private readonly connection: Redis) {}

  getQueue(name: QueueName): Queue {
    let queue = this.queues.get(name);
    if (!queue) {
      queue = new Queue(name, { connection: this.connection });
      this.queues.set(name, queue);
      this.logger.log(`Queue registered: ${name}`);
    }
    return queue;
  }

  async enqueue<T = unknown>(name: QueueName, jobName: string, data: T): Promise<void> {
    await this.getQueue(name).add(jobName, data);
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close().catch(() => undefined)));
  }
}
