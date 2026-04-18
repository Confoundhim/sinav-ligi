import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { POSTGRES_POOL } from '../common/database/database.constants';
import { REDIS_CLIENT } from '../common/redis/redis.constants';

type DependencyStatus = {
  status: 'up' | 'down';
  latencyMs: number;
  details?: string;
};

@Injectable()
export class HealthService {
  constructor(
    @Inject(POSTGRES_POOL) private readonly postgresPool: Pool,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  async getHealth(): Promise<{
    status: 'ok' | 'degraded';
    timestamp: string;
    app: {
      status: 'up';
      uptimeSec: number;
      environment: string;
    };
    database: DependencyStatus;
    redis: DependencyStatus;
  }> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return {
      status:
        database.status === 'up' && redis.status === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      app: {
        status: 'up',
        uptimeSec: Math.round(process.uptime()),
        environment: process.env.NODE_ENV ?? 'development',
      },
      database,
      redis,
    };
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    const startedAt = Date.now();

    try {
      await this.postgresPool.query('SELECT 1');
      return {
        status: 'up',
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - startedAt,
        details:
          error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  private async checkRedis(): Promise<DependencyStatus> {
    const startedAt = Date.now();

    try {
      if (this.redisClient.status !== 'ready') {
        await this.redisClient.connect();
      }

      await this.redisClient.ping();
      return {
        status: 'up',
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - startedAt,
        details: error instanceof Error ? error.message : 'Unknown redis error',
      };
    } finally {
      if (this.redisClient.status === 'ready') {
        await this.redisClient.quit();
      }
    }
  }
}
