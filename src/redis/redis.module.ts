import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisCacheService } from './redis-cache.service';

const parseRedisPort = (): number => {
  const value = Number.parseInt(process.env.REDIS_PORT ?? '6379', 10);
  return Number.isNaN(value) ? 6379 : value;
};

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const enabled = process.env.REDIS_ENABLED !== 'false';
        if (!enabled) {
          return null;
        }

        const client = new Redis({
          host: process.env.REDIS_HOST ?? 'localhost',
          port: parseRedisPort(),
          password: process.env.REDIS_PASSWORD,
          db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0,
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
        });

        client.on('error', () => {
          // RedisCacheService handles disabling on first command error.
        });

        return client;
      },
    },
    RedisCacheService,
  ],
  exports: [RedisCacheService],
})
export class RedisModule {}
