import { Test, TestingModule } from '@nestjs/testing';
import { BadgesService } from './badges.service';
import { PrismaService } from '../common/database/prisma.service';
import { BadgeEvent } from './dto/check-badge.dto';

const USER_ID = 'user-cuid-1';

const makeBadge = (type: string, overrides?: object) => ({
  id: `badge-${type}`,
  name: `Test Badge ${type}`,
  criteria: { type, threshold: 1, ...overrides },
});

const mockPrisma = {
  badge: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  userBadge: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  examSession: { count: jest.fn() },
  quarantineItem: { count: jest.fn() },
  duelMatch: {
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  video: { count: jest.fn() },
  videoProgress: { count: jest.fn() },
};

describe('BadgesService', () => {
  let service: BadgesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BadgesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BadgesService>(BadgesService);
  });

  // ─── findAll ───────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('tüm rozetleri döndürmeli', async () => {
      mockPrisma.badge.findMany.mockResolvedValue([makeBadge('exam_count')]);

      const result = await service.findAll();
      expect(result.badges).toHaveLength(1);
    });
  });

  // ─── findMyBadges ──────────────────────────────────────────────────────────────

  describe('findMyBadges', () => {
    it('kullanıcının rozetlerini döndürmeli', async () => {
      mockPrisma.badge.findMany = jest.fn();
      (mockPrisma as any).userBadge.findMany = jest.fn().mockResolvedValue([
        {
          userId: USER_ID,
          badgeId: 'b1',
          earnedAt: new Date(),
          badge: makeBadge('exam_count'),
        },
      ]);

      const result = await service.findMyBadges(USER_ID);
      expect(result.badges).toHaveLength(1);
    });
  });

  // ─── checkBadges — exam_count ──────────────────────────────────────────────────

  describe('checkBadges (exam_count)', () => {
    beforeEach(() => {
      mockPrisma.badge.findMany.mockResolvedValue([
        makeBadge('exam_count', { threshold: 1 }),
      ]);
      mockPrisma.userBadge.findUnique.mockResolvedValue(null);
    });

    it('eşik aşıldığında rozet kazandırmalı', async () => {
      mockPrisma.examSession.count.mockResolvedValue(1);
      mockPrisma.userBadge.create.mockResolvedValue({});

      const result = await service.checkBadges(
        USER_ID,
        BadgeEvent.EXAM_COMPLETED,
      );

      expect(result.awarded).toHaveLength(1);
      expect(mockPrisma.userBadge.create).toHaveBeenCalledTimes(1);
    });

    it('eşik aşılmadığında rozet kazandırılmamalı', async () => {
      mockPrisma.examSession.count.mockResolvedValue(0);

      const result = await service.checkBadges(
        USER_ID,
        BadgeEvent.EXAM_COMPLETED,
      );

      expect(result.awarded).toHaveLength(0);
      expect(mockPrisma.userBadge.create).not.toHaveBeenCalled();
    });

    it('rozet zaten kazanılmışsa tekrar verilmemeli', async () => {
      mockPrisma.examSession.count.mockResolvedValue(5);
      mockPrisma.userBadge.findUnique.mockResolvedValue({
        userId: USER_ID,
        badgeId: 'badge-exam_count',
      });

      const result = await service.checkBadges(
        USER_ID,
        BadgeEvent.EXAM_COMPLETED,
      );

      expect(result.awarded).toHaveLength(0);
      expect(mockPrisma.userBadge.create).not.toHaveBeenCalled();
    });
  });

  // ─── checkBadges — quarantine_rescued_count ────────────────────────────────────

  describe('checkBadges (quarantine_rescued_count)', () => {
    it('50 kurtarılan soru ile Karantina Ustası rozeti verilmeli', async () => {
      mockPrisma.badge.findMany.mockResolvedValue([
        {
          id: 'badge-karantina',
          name: 'Karantina Ustası',
          criteria: { type: 'quarantine_rescued_count', threshold: 50 },
        },
      ]);
      mockPrisma.userBadge.findUnique.mockResolvedValue(null);
      mockPrisma.quarantineItem.count.mockResolvedValue(50);
      mockPrisma.userBadge.create.mockResolvedValue({});

      const result = await service.checkBadges(
        USER_ID,
        BadgeEvent.QUARANTINE_RESCUED,
      );

      expect(result.awarded).toContain('Karantina Ustası');
    });
  });

  // ─── checkBadges — video_all_completed ────────────────────────────────────────

  describe('checkBadges (video_all_completed)', () => {
    it('tüm videolar tamamlandığında Video Maratoncusu rozeti verilmeli', async () => {
      mockPrisma.badge.findMany.mockResolvedValue([
        {
          id: 'badge-video',
          name: 'Video Maratoncusu',
          criteria: { type: 'video_all_completed' },
        },
      ]);
      mockPrisma.userBadge.findUnique.mockResolvedValue(null);
      mockPrisma.video.count.mockResolvedValue(10);
      mockPrisma.videoProgress.count.mockResolvedValue(10);
      mockPrisma.userBadge.create.mockResolvedValue({});

      const result = await service.checkBadges(
        USER_ID,
        BadgeEvent.VIDEO_WATCHED,
      );

      expect(result.awarded).toContain('Video Maratoncusu');
    });

    it('eksik video varsa rozet verilmemeli', async () => {
      mockPrisma.badge.findMany.mockResolvedValue([
        {
          id: 'badge-video',
          name: 'Video Maratoncusu',
          criteria: { type: 'video_all_completed' },
        },
      ]);
      mockPrisma.video.count.mockResolvedValue(10);
      mockPrisma.videoProgress.count.mockResolvedValue(7);

      const result = await service.checkBadges(
        USER_ID,
        BadgeEvent.VIDEO_WATCHED,
      );

      expect(result.awarded).toHaveLength(0);
    });
  });

  // ─── awardWeeklyDuelWinner ─────────────────────────────────────────────────────

  describe('awardWeeklyDuelWinner', () => {
    it('haftanın en çok düello kazananı rozet almalı', async () => {
      mockPrisma.duelMatch.groupBy.mockResolvedValue([
        { winnerId: 'user-winner', _count: { winnerId: 5 } },
      ]);
      mockPrisma.badge.findFirst.mockResolvedValue({
        id: 'badge-duel',
        name: 'En Çok Düello Kazananı',
      });
      mockPrisma.userBadge.findUnique.mockResolvedValue(null);
      mockPrisma.userBadge.create.mockResolvedValue({});

      const result = await service.awardWeeklyDuelWinner();

      expect(result.awarded).toBe(true);
      expect(result.userId).toBe('user-winner');
    });

    it('düello verisi yoksa false dönmeli', async () => {
      mockPrisma.duelMatch.groupBy.mockResolvedValue([]);

      const result = await service.awardWeeklyDuelWinner();
      expect(result.awarded).toBe(false);
    });
  });
});
