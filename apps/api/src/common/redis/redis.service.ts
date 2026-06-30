import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  getClient(): Redis {
    return this.client;
  }

  /**
   * Liveness probe used by the health check. Races the ping against a short timeout so a
   * misconfigured or unreachable Redis reports `down` promptly instead of hanging the
   * request forever (ioredis queues commands while offline, so a bare ping never resolves
   * when the server is unreachable).
   */
  async ping(timeoutMs = 1000): Promise<boolean> {
    try {
      const result = await Promise.race([
        this.client.ping(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('redis ping timeout')), timeoutMs),
        ),
      ]);
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }
}
