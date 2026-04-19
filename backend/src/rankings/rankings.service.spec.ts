import { Test, TestingModule } from '@nestjs/testing';
import { RankingPeriod } from '@prisma/client';
import { RankingsService } from './rankings.service';
import { PrismaService } from '../common/database/prisma.service';
import { REDIS_CLIENT } from '../common/redis/redis.constants';

const USER_ID = 'user-cuid-1';
const EXAM_TYPE_ID = 'et-kpss';

const mockPrisma = {
  user: { findMany: jest.fn() },
  rankingSnapshot: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  prestigeAward: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const makePipelineMock = () => ({
  zincrby: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
});

const mockRedis = {
  pipeline: jest.fn(),
  zrevrange: jest.fn(),
  zcard: jest.fn(),
  zrevrank: jest.fn(),
  zscore: jest.fn(),
  zincrby: jest.fn(),
};

describe('RankingsService', () => {
  let service: RankingsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRedis.pipeline.mockReturnValue(makePipelineMock());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RankingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<RankingsService>(RankingsService);
  });

  // ─── buildKey ──────────────────────────────────────────────────────────────────

  describe('buildKey', () => {
    it('günlük key YYYY-MM-DD formatında olmalı', () => {
      const key = service.buildKey(EXAM_TYPE_ID, RankingPeriod.DAILY);
      expect(key).toMatch(/^ranking:et-kpss:DAILY:\d{4}-\d{2}-\d{2}$/);
    });

    it('haftalık key YYYY-WW formatında olmalı', () => {
      const key = service.buildKey(EXAM_TYPE_ID, RankingPeriod.WEEKLY);
      expect(key).toMatch(/^ranking:et-kpss:WEEKLY:\d{4}-\d{2}$/);
    });

    it('aylık key YYYY-MM formatında olmalı', () => {
      const key = service.buildKey(EXAM_TYPE_ID, RankingPeriod.MONTHLY);
      expect(key).toMatch(/^ranking:et-kpss:MONTHLY:\d{4}-\d{2}$/);
    });
  });

  // ─── addScore ──────────────────────────────────────────────────────────────────

  describe('addScore', () => {
    it('3 period için Redis pipeline zincrby çağrılmalı', async () => {
      const pipeline = makePipelineMock();
      mockRedis.pipeline.mockReturnValue(pipeline);

      await service.addScore(USER_ID, EXAM_TYPE_ID, 25, 'exam_completion');

      expect(pipeline.zincrby).toHaveBeenCalledTimes(3);
      expect(pipeline.exec).toHaveBeenCalledTimes(1);
    });

    it('0 puan için Redis çağrısı yapılmamalı', async () => {
      await service.addScore(USER_ID, EXAM_TYPE_ID, 0, 'test');
      expect(mockRedis.pipeline).not.toHaveBeenCalled();
    });

    it("negatif puan (karantina cezası) da pipeline'a eklenmeli", async () => {
      const pipeline = makePipelineMock();
      mockRedis.pipeline.mockReturnValue(pipeline);

      await service.addScore(USER_ID, EXAM_TYPE_ID, -10, 'quarantine_fail');

      expect(pipeline.zincrby).toHaveBeenCalledTimes(3);
      expect(pipeline.zincrby).toHaveBeenCalledWith(
        expect.stringContaining('DAILY'),
        -10,
        USER_ID,
      );
    });
  });

  // ─── getLeaderboard ────────────────────────────────────────────────────────────

  describe('getLeaderboard', () => {
    it("Redis'ten veri gelmezse boş liste dönmeli", async () => {
      mockRedis.zrevrange.mockResolvedValue([]);

      const result = await service.getLeaderboard(
        RankingPeriod.WEEKLY,
        EXAM_TYPE_ID,
        1,
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('sıralama listesi rank, puan, displayName içermeli', async () => {
      mockRedis.zrevrange.mockResolvedValue(['user-1', '150', 'user-2', '120']);
      mockRedis.zcard.mockResolvedValue(2);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-1', displayName: 'Ali', avatar: null },
        { id: 'user-2', displayName: 'Veli', avatar: null },
      ]);

      const result = await service.getLeaderboard(
        RankingPeriod.WEEKLY,
        EXAM_TYPE_ID,
        1,
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        rank: 1,
        score: 150,
        displayName: 'Ali',
      });
      expect(result.data[1]).toMatchObject({
        rank: 2,
        score: 120,
        displayName: 'Veli',
      });
    });

    it('sayfa 2 için doğru rank offset hesaplanmalı', async () => {
      mockRedis.zrevrange.mockResolvedValue(['user-11', '50']);
      mockRedis.zcard.mockResolvedValue(15);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-11', displayName: 'Kişi 11', avatar: null },
      ]);

      const result = await service.getLeaderboard(
        RankingPeriod.WEEKLY,
        EXAM_TYPE_ID,
        2,
      );

      expect(result.data[0]?.rank).toBe(11);
    });
  });

  // ─── getMyRanking ──────────────────────────────────────────────────────────────

  describe('getMyRanking', () => {
    it("Redis'te kayıt varsa rank ve score dönmeli", async () => {
      mockRedis.zrevrank.mockResolvedValue(2); // 0-indexed → rank=3
      mockRedis.zscore.mockResolvedValue('175.5');

      const result = await service.getMyRanking(USER_ID, EXAM_TYPE_ID);

      expect(result.rank).toBe(3);
      expect(result.score).toBe(175.5);
    });

    it("Redis'te kayıt yoksa rank=null, score=0 dönmeli", async () => {
      mockRedis.zrevrank.mockResolvedValue(null);
      mockRedis.zscore.mockResolvedValue(null);

      const result = await service.getMyRanking(USER_ID, EXAM_TYPE_ID);

      expect(result.rank).toBeNull();
      expect(result.score).toBe(0);
    });
  });

  // ─── getTop3 ───────────────────────────────────────────────────────────────────

  describe('getTop3', () => {
    it('aylık ilk 3 burs adayını 10.000 TL ile dönmeli', async () => {
      mockRedis.zrevrange.mockResolvedValue([
        'user-1',
        '300',
        'user-2',
        '250',
        'user-3',
        '200',
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          displayName: 'Ali',
          avatar: null,
          city: 'Ankara',
          school: 'ODTÜ',
        },
        {
          id: 'user-2',
          displayName: 'Veli',
          avatar: null,
          city: null,
          school: null,
        },
        {
          id: 'user-3',
          displayName: 'Mehmet',
          avatar: null,
          city: null,
          school: null,
        },
      ]);

      const result = await service.getTop3(EXAM_TYPE_ID);

      expect(result.scholarshipAmount).toBe(10000);
      expect(result.candidates).toHaveLength(3);
      expect(result.candidates[0]?.rank).toBe(1);
      expect(result.candidates[0]?.displayName).toBe('Ali');
    });

    it('sıralama boşsa boş aday listesi dönmeli', async () => {
      mockRedis.zrevrange.mockResolvedValue([]);

      const result = await service.getTop3(EXAM_TYPE_ID);

      expect(result.candidates).toEqual([]);
    });
  });

  // ─── takeSnapshot ──────────────────────────────────────────────────────────────

  describe('takeSnapshot', () => {
    it("Redis verisini DB'ye upsert etmeli", async () => {
      mockRedis.zrevrange.mockResolvedValue(['user-1', '100', 'user-2', '80']);
      mockPrisma.rankingSnapshot.upsert.mockResolvedValue({});

      const result = await service.takeSnapshot(
        EXAM_TYPE_ID,
        RankingPeriod.DAILY,
      );

      expect(result.written).toBe(2);
      expect(mockPrisma.rankingSnapshot.upsert).toHaveBeenCalledTimes(2);
    });
  });
});
