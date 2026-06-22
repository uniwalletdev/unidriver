import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('redis.url') ?? 'redis://localhost:6379';
        // maxRetriesPerRequest must be null for BullMQ; lazyConnect avoids connecting at boot.
        return new IORedis(url, { maxRetriesPerRequest: null, lazyConnect: true });
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
