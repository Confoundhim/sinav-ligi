import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DuelMatchStatus } from '@prisma/client';
import { DuelsService } from './duels.service';
import { PrismaService } from '../common/database/prisma.service';
import { REDIS_CLIENT } from '../common/redis/redis.constants';

const USER_ID = 'user-1';
const OPPONENT_ID = 'user-2';
const DUEL_ID = 'duel-1';
const EXAM_TYPE_ID = 'et-kpss';

const makeQuestion = (id: string) => ({
  id,
  content: { text: `Soru ${id}` },
  correctAnswer: 'A',
  usageCount: 0,
  isActive: true,
  questionTypeId: 'qt-1',
  questionType: { subject: { examTypeId: EXAM_TYPE_ID } },
});

const makeDuel = (overrides = {}) => ({
  id: DUEL_ID,
  challengerId: USER_ID,
  opponentId: OPPONENT_ID,
  examTypeId: EXAM_TYPE_ID,
  betPoints: 100,
  status: DuelMatchStatus.PENDING,
  winnerId: null,
  createdAt: new Date(),
  ...overrides,
});

const makeRound = (
  qId: string,
  challengerAnswer: string | null = null,
  opponentAnswer: string | null = null,
) => ({
  duelMatchId: DUEL_ID,
  questionId: qId,
  challengerAnswer,
  opponentAnswer,
  challengerTime: 5000,
  opponentTime: 6000,
  question: { correctAnswer: 'A' },
  duelMatch: { challengerId: USER_ID },
});

const mockRedis = {
  lrange: jest.fn().mockResolvedValue([]),
  lpush: jest.fn().mockResolvedValue(1),
  expire: jest.fn().mockResolvedValue(1),
  lrem: jest.fn().mockResolvedValue(1),
};

const mockPrisma = {
  duelMatch: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  duelRight: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  duelRound: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  question: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  rankingSnapshot: {
    findFirst: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  wallet: {
    findUnique: jest.fn(),
  },
  walletTransaction: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('DuelsService', () => {
  let service: DuelsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DuelsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<DuelsService>(DuelsService);
  });

  // ─── Hak Sistemi ──────────────────────────────────────────────────────────

  describe('getRights', () => {
    it('hafta içi hak varsa available:true dönmeli', async () => {
      // Mock: today is a weekday — override todayTurkeyDate to return a Monday
      jest
        .spyOn(
          service as unknown as { todayTurkeyDate: () => Date },
          'todayTurkeyDate',
        )
        .mockReturnValue(
          new Date('2026-04-20T00:00:00.000Z'), // Monday
        );
      mockPrisma.duelRight.findUnique.mockResolvedValue(null);

      const result = await service.getRights(USER_ID);
      expect(result.available).toBe(true);
      expect(result.used).toBe(0);
    });

    it('hak dolduysa available:false dönmeli', async () => {
      jest
        .spyOn(
          service as unknown as { todayTurkeyDate: () => Date },
          'todayTurkeyDate',
        )
        .mockReturnValue(new Date('2026-04-20T00:00:00.000Z'));
      mockPrisma.duelRight.findUnique.mockResolvedValue({
        used: 1,
        userId: USER_ID,
        date: new Date(),
      });

      const result = await service.getRights(USER_ID);
      expect(result.available).toBe(false);
      expect(result.used).toBe(1);
    });

    it('hafta sonu available:false ve reason dönmeli', async () => {
      jest
        .spyOn(
          service as unknown as { todayTurkeyDate: () => Date },
          'todayTurkeyDate',
        )
        .mockReturnValue(
          new Date('2026-04-19T00:00:00.000Z'), // Sunday
        );

      const result = await service.getRights(USER_ID);
      expect(result.available).toBe(false);
      expect(result.reason).toMatch(/hafta sonu/i);
    });
  });

  // ─── Meydan Okuma ────────────────────────────────────────────────────────

  describe('challenge', () => {
    beforeEach(() => {
      jest
        .spyOn(
          service as unknown as { todayTurkeyDate: () => Date },
          'todayTurkeyDate',
        )
        .mockReturnValue(new Date('2026-04-20T00:00:00.000Z'));
      mockPrisma.duelRight.findUnique.mockResolvedValue(null);
      mockPrisma.duelRight.upsert.mockResolvedValue({ used: 1 });
    });

    it('kendine meydan okuyunca BadRequestException fırlatmalı', async () => {
      await expect(
        service.challenge(USER_ID, {
          opponentId: USER_ID,
          examTypeId: EXAM_TYPE_ID,
          betPoints: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rakip yoksa NotFoundException fırlatmalı', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.duelMatch.count.mockResolvedValue(0);

      await expect(
        service.challenge(USER_ID, {
          opponentId: OPPONENT_ID,
          examTypeId: EXAM_TYPE_ID,
          betPoints: 0,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('aktif düello varsa BadRequestException fırlatmalı', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: OPPONENT_ID,
        isActive: true,
      });
      mockPrisma.duelMatch.count.mockResolvedValue(1);

      await expect(
        service.challenge(USER_ID, {
          opponentId: OPPONENT_ID,
          examTypeId: EXAM_TYPE_ID,
          betPoints: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('geçerli istekte düello oluşturmalı', async () => {
      mockPrisma.duelMatch.count.mockResolvedValue(0);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: OPPONENT_ID,
        isActive: true,
      });
      mockPrisma.duelMatch.create.mockResolvedValue({
        ...makeDuel(),
        challenger: { id: USER_ID, displayName: 'Ali', avatar: null },
        opponent: { id: OPPONENT_ID, displayName: 'Veli', avatar: null },
        examType: { name: 'KPSS' },
      });

      const result = await service.challenge(USER_ID, {
        opponentId: OPPONENT_ID,
        examTypeId: EXAM_TYPE_ID,
        betPoints: 100,
      });

      expect(result.status).toBe(DuelMatchStatus.PENDING);
      expect(mockPrisma.duelMatch.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Kabul / Red ──────────────────────────────────────────────────────────

  describe('acceptDuel', () => {
    beforeEach(() => {
      const qs = Array.from({ length: 60 }, (_, i) => makeQuestion(`q-${i}`));
      mockPrisma.question.findMany.mockResolvedValue(qs);
      mockPrisma.question.updateMany.mockResolvedValue({ count: 20 });
    });

    it('sadece opponentId kabul edebilmeli', async () => {
      mockPrisma.duelMatch.findUnique.mockResolvedValue(makeDuel());

      await expect(service.acceptDuel(DUEL_ID, USER_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('PENDING olmayan düello kabul edilemez', async () => {
      mockPrisma.duelMatch.findUnique.mockResolvedValue(
        makeDuel({ status: DuelMatchStatus.ACTIVE }),
      );

      await expect(service.acceptDuel(DUEL_ID, OPPONENT_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('geçerli kabul işleminde ACTIVE yapmalı', async () => {
      mockPrisma.duelMatch.findUnique.mockResolvedValue(makeDuel());
      mockPrisma.duelMatch.update.mockResolvedValue({
        ...makeDuel({ status: DuelMatchStatus.ACTIVE }),
        challenger: { id: USER_ID, displayName: 'Ali', avatar: null },
        opponent: { id: OPPONENT_ID, displayName: 'Veli', avatar: null },
        examType: { name: 'KPSS' },
        rounds: [],
      });

      const result = await service.acceptDuel(DUEL_ID, OPPONENT_ID);
      expect(result.status).toBe(DuelMatchStatus.ACTIVE);
    });
  });

  // ─── Cevap Gönderme ───────────────────────────────────────────────────────

  describe('submitAnswer', () => {
    const activeDuel = {
      ...makeDuel({ status: DuelMatchStatus.ACTIVE }),
      rounds: [makeRound('q-1'), makeRound('q-2'), makeRound('q-3')],
    };

    it('yetkisiz kullanıcıda ForbiddenException fırlatmalı', async () => {
      mockPrisma.duelMatch.findUnique.mockResolvedValue(activeDuel);

      await expect(
        service.submitAnswer(DUEL_ID, 'stranger', 'q-1', 'A', 3000),
      ).rejects.toThrow(ForbiddenException);
    });

    it('var olmayan soru için NotFoundException fırlatmalı', async () => {
      mockPrisma.duelMatch.findUnique.mockResolvedValue(activeDuel);

      await expect(
        service.submitAnswer(DUEL_ID, USER_ID, 'q-999', 'A', 3000),
      ).rejects.toThrow(NotFoundException);
    });

    it('başarılı cevap sonrası opponentId döndürmeli', async () => {
      mockPrisma.duelMatch.findUnique.mockResolvedValue(activeDuel);
      mockPrisma.duelRound.update.mockResolvedValue({});
      // Not all rounds answered yet
      mockPrisma.duelRound.findMany.mockResolvedValue([
        makeRound('q-1', 'A', null),
        makeRound('q-2', null, null),
        makeRound('q-3', null, null),
      ]);

      const result = await service.submitAnswer(
        DUEL_ID,
        USER_ID,
        'q-1',
        'A',
        3000,
      );
      expect(result.opponentId).toBe(OPPONENT_ID);
      expect(result.completed).toBe(false);
    });
  });

  // ─── Puan Hesaplama ───────────────────────────────────────────────────────

  describe('puan hesaplama (finalizeDuel entegrasyon)', () => {
    it('challenger daha fazla doğru cevap verirse kazanmalı', async () => {
      // Initial duel: challenger answered q-1, q-2. Opponent answering q-3 (last)
      const initialRounds = [
        makeRound('q-1', 'A', 'B'), // both answered
        makeRound('q-2', 'A', 'B'), // both answered
        makeRound('q-3', 'B', null), // opponent hasn't answered yet
      ];

      const activeDuel = {
        ...makeDuel({ status: DuelMatchStatus.ACTIVE }),
        rounds: initialRounds,
      };

      // After opponent answers q-3, all rounds complete
      const completedRounds = [
        {
          ...makeRound('q-1', 'A', 'B'),
          challengerAnswer: 'A',
          opponentAnswer: 'B',
        },
        {
          ...makeRound('q-2', 'A', 'B'),
          challengerAnswer: 'A',
          opponentAnswer: 'B',
        },
        {
          ...makeRound('q-3', 'B', 'A'),
          challengerAnswer: 'B',
          opponentAnswer: 'A',
          duelMatch: { challengerId: USER_ID },
        },
      ];

      mockPrisma.duelMatch.findUnique.mockResolvedValue(activeDuel);
      mockPrisma.duelRound.update.mockResolvedValue({});
      mockPrisma.duelRound.findMany.mockResolvedValue(completedRounds);
      mockPrisma.duelMatch.update.mockResolvedValue({});
      mockPrisma.wallet.findUnique.mockResolvedValue(null); // bahis transferini atla

      const result = await service.submitAnswer(
        DUEL_ID,
        OPPONENT_ID,
        'q-3',
        'A',
        6000,
      );
      expect(result.completed).toBe(true);
      if (result.completed && result.finalResult) {
        expect(result.finalResult.winnerId).toBe(USER_ID);
        expect(result.finalResult.challengerCorrect).toBe(2);
        expect(result.finalResult.opponentCorrect).toBe(1);
      }
    });

    it('eşitlikte winnerId null olmalı', async () => {
      // Initial: challenger answered q-1. Opponent answering q-2 (last)
      const initialRounds = [
        makeRound('q-1', 'A', 'A'), // both answered, both correct
        makeRound('q-2', 'B', null), // opponent hasn't answered yet
      ];

      const activeDuel = {
        ...makeDuel({ status: DuelMatchStatus.ACTIVE }),
        rounds: initialRounds,
      };

      const completedRounds = [
        {
          ...makeRound('q-1', 'A', 'A'),
          challengerAnswer: 'A',
          opponentAnswer: 'A',
          challengerTime: 5000,
          opponentTime: 5000,
        }, // both correct, same time
        {
          ...makeRound('q-2', 'B', 'B'),
          challengerAnswer: 'B',
          opponentAnswer: 'B',
          challengerTime: 5000,
          opponentTime: 5000,
          duelMatch: { challengerId: USER_ID },
        }, // both wrong, same time
      ];

      mockPrisma.duelMatch.findUnique.mockResolvedValue(activeDuel);
      mockPrisma.duelRound.update.mockResolvedValue({});
      mockPrisma.duelRound.findMany.mockResolvedValue(completedRounds);
      mockPrisma.duelMatch.update.mockResolvedValue({});
      mockPrisma.wallet.findUnique.mockResolvedValue(null);

      const result = await service.submitAnswer(
        DUEL_ID,
        OPPONENT_ID,
        'q-2',
        'B',
        6000,
      );
      expect(result.completed).toBe(true);
      if (result.completed && result.finalResult) {
        expect(result.finalResult.winnerId).toBeNull();
      }
    });
  });

  // ─── İstatistik ──────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('kazanma oranını doğru hesaplamalı', async () => {
      mockPrisma.duelMatch.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(6); // won
      mockPrisma.duelRound.findMany.mockResolvedValue([]);

      const stats = await service.getStats(USER_ID);
      expect(stats.totalDuels).toBe(10);
      expect(stats.won).toBe(6);
      expect(stats.lost).toBe(4);
      expect(stats.winRate).toBe(60);
    });
  });

  // ─── Eşleşme Kuyruğu ─────────────────────────────────────────────────────

  describe('joinMatchmaking', () => {
    beforeEach(() => {
      jest
        .spyOn(
          service as unknown as { todayTurkeyDate: () => Date },
          'todayTurkeyDate',
        )
        .mockReturnValue(new Date('2026-04-20T00:00:00.000Z'));
      mockPrisma.rankingSnapshot.findFirst.mockResolvedValue(null);
    });

    it('hafta sonu kuyruğa giremez', async () => {
      jest
        .spyOn(
          service as unknown as { todayTurkeyDate: () => Date },
          'todayTurkeyDate',
        )
        .mockReturnValue(
          new Date('2026-04-19T00:00:00.000Z'), // Sunday
        );

      await expect(
        service.joinMatchmaking(USER_ID, {
          examTypeId: EXAM_TYPE_ID,
          betPoints: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('eşleşme yoksa kuyruğa eklenmeli', async () => {
      mockRedis.lrange.mockResolvedValue([]);

      const result = await service.joinMatchmaking(USER_ID, {
        examTypeId: EXAM_TYPE_ID,
        betPoints: 0,
      });
      expect(result).toMatchObject({ queued: true });
      expect(mockRedis.lpush).toHaveBeenCalled();
    });

    it('eşdeğer puana sahip kullanıcıyla eşleşmeli', async () => {
      const candidate = JSON.stringify({
        userId: OPPONENT_ID,
        examTypeId: EXAM_TYPE_ID,
        betPoints: 0,
        score: 50,
        socketTs: Date.now(),
      });
      mockRedis.lrange.mockResolvedValue([candidate]);

      // consumeRight mock
      mockPrisma.duelRight.findUnique.mockResolvedValue(null);
      mockPrisma.duelRight.upsert.mockResolvedValue({ used: 1 });

      const qs = Array.from({ length: 60 }, (_, i) => makeQuestion(`q-${i}`));
      mockPrisma.question.findMany.mockResolvedValue(qs);
      mockPrisma.question.updateMany.mockResolvedValue({ count: 20 });
      mockPrisma.duelMatch.create.mockResolvedValue({
        ...makeDuel({ status: DuelMatchStatus.ACTIVE }),
        challenger: { id: USER_ID, displayName: 'Ali', avatar: null },
        opponent: { id: OPPONENT_ID, displayName: 'Veli', avatar: null },
        examType: { name: 'KPSS' },
        rounds: [],
      });

      const result = await service.joinMatchmaking(USER_ID, {
        examTypeId: EXAM_TYPE_ID,
        betPoints: 0,
      });
      expect(result).toMatchObject({ matched: true });
      expect(mockRedis.lrem).toHaveBeenCalled();
    });
  });
});
