import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/common/database/prisma.service';
import { REDIS_CLIENT } from '../src/common/redis/redis.constants';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        enableShutdownHooks: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(REDIS_CLIENT)
      .useValue({
        status: 'ready',
        ping: jest.fn().mockResolvedValue('PONG'),
        quit: jest.fn().mockResolvedValue('OK'),
        connect: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveProperty('status');
        expect(body).toHaveProperty('app.status', 'up');
        expect(body).toHaveProperty('database.status');
        expect(body).toHaveProperty('redis.status');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
