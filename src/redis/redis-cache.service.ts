import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

const DEFAULT_TTL_SECONDS = 300;

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly ttlSeconds: number;
  private isAvailable = true;

  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis | null) {
    const ttlValue = Number.parseInt(
      process.env.REDIS_TTL_SECONDS ?? `${DEFAULT_TTL_SECONDS}`,
      10,
    );
    this.ttlSeconds = Number.isNaN(ttlValue) ? DEFAULT_TTL_SECONDS : ttlValue;
  }

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isAvailable) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      this.disableCache(error);
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isAvailable) {
      return;
    }

    try {
      const payload = JSON.stringify(value);
      const ttl = ttlSeconds ?? this.ttlSeconds;
      await this.client.set(key, payload, 'EX', ttl);
    } catch (error) {
      this.disableCache(error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isAvailable) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      this.disableCache(error);
    }
  }

  private disableCache(error: unknown): void {
    if (!this.isAvailable) {
      return;
    }
    this.isAvailable = false;
    this.logger.warn(
      `Redis cache disabled due to error: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}
