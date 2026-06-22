import { Controller, Get } from '@nestjs/common';
import { Public } from '../../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  async check(): Promise<{
    status: 'ok' | 'degraded';
    services: { database: 'up' | 'down'; redis: 'up' | 'down' };
    timestamp: string;
  }> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.redis.ping()]);
    return {
      status: database && redis ? 'ok' : 'degraded',
      services: {
        database: database ? 'up' : 'down',
        redis: redis ? 'up' : 'down',
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
