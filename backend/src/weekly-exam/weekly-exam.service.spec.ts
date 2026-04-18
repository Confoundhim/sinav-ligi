import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WeeklyExamStatus, WalletTransactionType } from '@prisma/client';
import { WeeklyExamService } from './weekly-exam.service';
import { PrismaService } from '../common/database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { REDIS_CLIENT } from '../common/redis/redis.constants';
import { CheatReportType } from './dto/cheat-report.dto';

// ─── Sabitler ────────────────────────────────────────────────────────────────

const USER_ID = 'user-cuid-1';
const ADMIN_ID = 'admin-cuid-1';
const EXAM_ID = 'weekly-exam-cuid-1';
const EXAM_TYPE_ID = 'et-kpss';

const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 hafta sonra
const PAST_DATE = new Date(Date.now() - 60 * 60 * 1000); // 1 saat önce
const RECENT_DATE = new Date(Date.now() - 5 * 60 * 1000); // 5 dakika önce

// ─── Mock Fabrikaları ─────────────────────────────────────────────────────────

const makeExam = (overrides: Record<string, unknown> = {}) => ({
  id: EXAM_ID,
  examTypeId: EXAM_TYPE_ID,
  scheduledAt: FUTURE_DATE,
  resultAnnouncedAt: null,
  status: WeeklyExamStatus.PUBLISHED,
  minParticipants: 1000,
  entryFee: 100,
  createdBy: ADMIN_ID,
  participants: [],
  ...overrides,
});

const makeParticipant = (overrides: Record<string, unknown> = {}) => ({
  weeklyExamId: EXAM_ID,
  userId: USER_ID,
  paymentId: null,
  startedAt: null,
  finishedAt: null,
  score: 0,
  rank: null,
  ...overrides,
});

// ─── Mock Nesneler ────────────────────────────────────────────────────────────

const mockPrisma = {
  examType: { findUnique: jest.fn() },
  weeklyExam: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  weeklyExamQuestion: {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
  },
  weeklyExamParticipant: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  question: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockWalletService = {
  spendFromWallet: jest.fn(),
  addToWallet: jest.fn(),
};

const mockRedis = {
  hget: jest.fn(),
  hset: jest.fn(),
  hgetall: jest.fn(),
  hincrby: jest.fn(),
  expire: jest.fn(),
  exists: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  pipeline: jest.fn(),
};

// ─── Test Paketi ──────────────────────────────────────────────────────────────

describe('WeeklyExamService', () => {
  let service: WeeklyExamService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // pipeline().exec() için mock
    mockRedis.pipeline.mockReturnValue({
      hincrby: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeeklyExamService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WalletService, useValue: mockWalletService },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<WeeklyExamService>(WeeklyExamService);
  });

  // ─── createWeeklyExam ─────────────────────────────────────────────────────

  describe('createWeeklyExam', () => {
    const dto = {
      examTypeId: EXAM_TYPE_ID,
      scheduledAt: FUTURE_DATE.toISOString(),
    };

    it('geçerli sınav türüyle sınav oluşturmalı', async () => {
      mockPrisma.examType.findUnique.mockResolvedValue({
        id: EXAM_TYPE_ID,
        isActive: true,
      });
      mockPrisma.weeklyExam.create.mockResolvedValue(
        makeExam({ status: WeeklyExamStatus.DRAFT }),
      );

      const result = await service.createWeeklyExam(dto, ADMIN_ID);
      expect(result).toMatchObject({
        id: EXAM_ID,
        status: WeeklyExamStatus.DRAFT,
      });
      expect(mockPrisma.weeklyExam.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            examTypeId: EXAM_TYPE_ID,
            createdBy: ADMIN_ID,
            status: WeeklyExamStatus.DRAFT,
            minParticipants: 1000,
            entryFee: 100,
          }),
        }),
      );
    });

    it('geçersiz sınav türü için NotFoundException fırlatmalı', async () => {
      mockPrisma.examType.findUnique.mockResolvedValue(null);
      await expect(service.createWeeklyExam(dto, ADMIN_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── publishWeeklyExam ────────────────────────────────────────────────────

  describe('publishWeeklyExam', () => {
    it('sorusu olan DRAFT sınavı yayınlamalı', async () => {
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(
        makeExam({ status: WeeklyExamStatus.DRAFT, _count: { questions: 5 } }),
      );
      mockPrisma.weeklyExam.update.mockResolvedValue(
        makeExam({ status: WeeklyExamStatus.PUBLISHED }),
      );

      const result = await service.publishWeeklyExam(EXAM_ID);
      expect(result.status).toBe(WeeklyExamStatus.PUBLISHED);
    });

    it('sorusu olmayan sınavı yayınlamaya çalışınca BadRequestException fırlatmalı', async () => {
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(
        makeExam({ status: WeeklyExamStatus.DRAFT, _count: { questions: 0 } }),
      );
      await expect(service.publishWeeklyExam(EXAM_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    it('kayıt olmalı ve cüzdandan ücret düşmeli', async () => {
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(makeExam());
      mockPrisma.weeklyExamParticipant.findUnique.mockResolvedValue(null);
      mockWalletService.spendFromWallet.mockResolvedValue({});
      mockPrisma.weeklyExamParticipant.create.mockResolvedValue(
        makeParticipant(),
      );

      const result = await service.register(EXAM_ID, USER_ID);

      expect(result.examId).toBe(EXAM_ID);
      expect(mockWalletService.spendFromWallet).toHaveBeenCalledWith(
        USER_ID,
        100,
        WalletTransactionType.EXAM_FEE,
        expect.any(String),
        EXAM_ID,
      );
      expect(mockPrisma.weeklyExamParticipant.create).toHaveBeenCalled();
    });

    it('zaten kayıtlıysa ConflictException fırlatmalı', async () => {
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(makeExam());
      mockPrisma.weeklyExamParticipant.findUnique.mockResolvedValue(
        makeParticipant(),
      );

      await expect(service.register(EXAM_ID, USER_ID)).rejects.toThrow(
        ConflictException,
      );
    });

    it('sınav başladıktan sonra kayıt olunca BadRequestException fırlatmalı', async () => {
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(
        makeExam({ scheduledAt: PAST_DATE }),
      );
      mockPrisma.weeklyExamParticipant.findUnique.mockResolvedValue(null);

      await expect(service.register(EXAM_ID, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('PUBLISHED olmayan sınava kayıtta BadRequestException fırlatmalı', async () => {
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(
        makeExam({ status: WeeklyExamStatus.DRAFT }),
      );
      await expect(service.register(EXAM_ID, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── finishExam ───────────────────────────────────────────────────────────

  describe('finishExam', () => {
    const mockQuestions = [
      { order: 1, questionId: 'q-1' },
      { order: 2, questionId: 'q-2' },
      { order: 3, questionId: 'q-3' },
    ];

    const mockCorrectAnswers = [
      { id: 'q-1', correctAnswer: 'A' },
      { id: 'q-2', correctAnswer: 'B' },
      { id: 'q-3', correctAnswer: 'C' },
    ];

    it('2 doğru 1 yanlış için KPSS net puanını doğru hesaplamalı (1.75)', async () => {
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(
        makeExam({ scheduledAt: RECENT_DATE, questions: mockQuestions }),
      );
      mockPrisma.weeklyExamParticipant.findUnique.mockResolvedValue(
        makeParticipant({ startedAt: RECENT_DATE }),
      );
      // Redis: q1=A(doğru), q2=B(doğru), q3=X(yanlış)
      mockRedis.hgetall.mockResolvedValue({
        q1: JSON.stringify({
          answer: 'A',
          answeredAt: Date.now(),
          questionId: 'q-1',
        }),
        q2: JSON.stringify({
          answer: 'B',
          answeredAt: Date.now(),
          questionId: 'q-2',
        }),
        q3: JSON.stringify({
          answer: 'X',
          answeredAt: Date.now(),
          questionId: 'q-3',
        }),
      });
      mockPrisma.question.findMany.mockResolvedValue(mockCorrectAnswers);
      mockPrisma.weeklyExamParticipant.update.mockResolvedValue({});

      const result = await service.finishExam(EXAM_ID, USER_ID);

      expect(result.correct).toBe(2);
      expect(result.wrong).toBe(1);
      expect(result.empty).toBe(0);
      expect(result.score).toBeCloseTo(1.75);
    });

    it('tüm boş cevap için skor 0 olmalı', async () => {
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(
        makeExam({ scheduledAt: RECENT_DATE, questions: mockQuestions }),
      );
      mockPrisma.weeklyExamParticipant.findUnique.mockResolvedValue(
        makeParticipant({ startedAt: RECENT_DATE }),
      );
      mockRedis.hgetall.mockResolvedValue({});
      mockPrisma.question.findMany.mockResolvedValue(mockCorrectAnswers);
      mockPrisma.weeklyExamParticipant.update.mockResolvedValue({});

      const result = await service.finishExam(EXAM_ID, USER_ID);

      expect(result.correct).toBe(0);
      expect(result.wrong).toBe(0);
      expect(result.empty).toBe(3);
      expect(result.score).toBeCloseTo(0);
    });

    it('zaten tamamlanmış sınavda BadRequestException fırlatmalı', async () => {
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(
        makeExam({ questions: mockQuestions }),
      );
      mockPrisma.weeklyExamParticipant.findUnique.mockResolvedValue(
        makeParticipant({ finishedAt: new Date() }),
      );

      await expect(service.finishExam(EXAM_ID, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── reportCheat (anti-cheat) ─────────────────────────────────────────────

  describe('reportCheat', () => {
    beforeEach(() => {
      mockPrisma.weeklyExamParticipant.findUnique.mockResolvedValue(
        makeParticipant(),
      );
      mockRedis.hget.mockResolvedValue(null); // başlangıçta elinmemiş
    });

    it('ilk uyarıda total=1 dönmeli ve elenmemiş olmalı', async () => {
      mockRedis.hget
        .mockResolvedValueOnce(null) // 'eliminated' → yok
        .mockResolvedValueOnce('1') // 'total' içinde incrementCheatWarning
        .mockResolvedValueOnce('1'); // 'total' reportCheat içindeki son okuma

      const result = await service.reportCheat(
        EXAM_ID,
        { type: CheatReportType.TAB_SWITCH },
        USER_ID,
      );

      expect(result.eliminated).toBe(false);
      expect(result.warnings).toBe(1);
    });

    it('3. uyarıda eliminated=true dönmeli', async () => {
      mockRedis.hget
        .mockResolvedValueOnce(null) // 'eliminated' → yok (henüz)
        .mockResolvedValueOnce('3'); // 'total' → 3 (eşiğe ulaşıldı)
      // incrementCheatWarning içinde hget → '3' → eliminated=true sete girer
      mockRedis.hget.mockResolvedValue('3');

      const result = await service.reportCheat(
        EXAM_ID,
        { type: CheatReportType.FULLSCREEN_EXIT },
        USER_ID,
      );

      expect(result.eliminated).toBe(true);
    });

    it('kayıtlı olmayan öğrenci için ForbiddenException fırlatmalı', async () => {
      mockPrisma.weeklyExamParticipant.findUnique.mockResolvedValue(null);

      await expect(
        service.reportCheat(
          EXAM_ID,
          { type: CheatReportType.TAB_SWITCH },
          USER_ID,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── announceResults ──────────────────────────────────────────────────────

  describe('announceResults', () => {
    it('min katılımcı altında sınav iptal edilmeli ve iadeler yapılmalı', async () => {
      const participants = [
        makeParticipant({ userId: 'u1' }),
        makeParticipant({ userId: 'u2' }),
      ];
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(
        makeExam({
          status: WeeklyExamStatus.PUBLISHED,
          minParticipants: 1000,
          entryFee: 100,
          participants,
        }),
      );
      mockPrisma.weeklyExam.update.mockResolvedValue({});
      mockWalletService.addToWallet.mockResolvedValue({});

      const result = await service.announceResults(EXAM_ID);

      expect(result.cancelled).toBe(true);
      expect(result.refunded).toBe(2);
      expect(mockWalletService.addToWallet).toHaveBeenCalledTimes(2);
      expect(mockWalletService.addToWallet).toHaveBeenCalledWith(
        expect.any(String),
        100,
        WalletTransactionType.REFUND,
        expect.any(String),
        EXAM_ID,
      );
    });

    it('yeterli katılımcıda burs dağıtmalı ve sıralama atamalı', async () => {
      const participants = Array.from({ length: 15 }, (_, i) => ({
        ...makeParticipant({
          userId: `u${i}`,
          finishedAt: new Date(),
          score: 100 - i, // azalan skor
        }),
      }));
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(
        makeExam({
          status: WeeklyExamStatus.PUBLISHED,
          minParticipants: 10,
          entryFee: 100,
          participants,
        }),
      );
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
          fn(mockPrisma),
      );
      mockPrisma.weeklyExamParticipant.update.mockResolvedValue({});
      mockPrisma.weeklyExam.update.mockResolvedValue({});
      mockWalletService.addToWallet.mockResolvedValue({});

      const result = await service.announceResults(EXAM_ID);

      expect(result.cancelled).toBe(false);
      expect(result.scholarshipsAwarded).toBe(10); // top 10
      expect(mockWalletService.addToWallet).toHaveBeenCalledTimes(10);
      expect(mockWalletService.addToWallet).toHaveBeenCalledWith(
        expect.any(String),
        5000,
        WalletTransactionType.SCHOLARSHIP,
        expect.any(String),
        EXAM_ID,
      );
    });

    it('zaten tamamlanmış sınavda BadRequestException fırlatmalı', async () => {
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(
        makeExam({ status: WeeklyExamStatus.COMPLETED }),
      );
      await expect(service.announceResults(EXAM_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── getResults ───────────────────────────────────────────────────────────

  describe('getResults', () => {
    it('resultAnnouncedAt geçmeden BadRequestException fırlatmalı', async () => {
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(
        makeExam({
          status: WeeklyExamStatus.COMPLETED,
          resultAnnouncedAt: new Date(Date.now() + 60000), // gelecekte
          examType: { name: 'KPSS' },
        }),
      );
      await expect(service.getResults(EXAM_ID, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('resultAnnouncedAt geçtikten sonra sonuçları döndürmeli', async () => {
      mockPrisma.weeklyExam.findUnique.mockResolvedValue(
        makeExam({
          status: WeeklyExamStatus.COMPLETED,
          resultAnnouncedAt: new Date(Date.now() - 60000), // geçmişte
          examType: { name: 'KPSS' },
        }),
      );
      mockPrisma.weeklyExamParticipant.findUnique.mockResolvedValue(
        makeParticipant({ score: 42.5, rank: 3, finishedAt: new Date() }),
      );
      mockPrisma.weeklyExamParticipant.count.mockResolvedValue(1200);

      const result = await service.getResults(EXAM_ID, USER_ID);

      expect(Number(result.score)).toBeCloseTo(42.5);
      expect(result.rank).toBe(3);
      expect(result.totalParticipants).toBe(1200);
      expect(result.scholarshipEarned).toBe(5000); // rank=3 → top 10'da → 5000 TL burs
    });
  });
});
