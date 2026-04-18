import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ExamSessionType, QuarantineStatus } from '@prisma/client';
import { ExamsService } from './exams.service';
import { PrismaService } from '../common/database/prisma.service';

const USER_ID = 'user-cuid-1';
const EXAM_ID = 'exam-cuid-1';
const EXAM_TYPE_ID = 'et-kpss';

const mockExamType = {
  id: EXAM_TYPE_ID,
  name: 'KPSS',
  isActive: true,
  subjects: [
    {
      id: 'sub-1',
      name: 'Türkçe',
      questionTypes: [{ id: 'qt-1', name: 'Dil Bilgisi', questionCount: 5, sortOrder: 1 }],
    },
  ],
};

const makeQuestion = (id: string, typeId = 'qt-1') => ({
  id,
  questionTypeId: typeId,
  content: { text: `Soru ${id}`, choices: { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' } },
  correctAnswer: 'A',
  usageCount: 0,
});

const makeSession = (overrides = {}) => ({
  id: EXAM_ID,
  userId: USER_ID,
  type: ExamSessionType.CUSTOM,
  examTypeId: EXAM_TYPE_ID,
  startedAt: new Date(Date.now() - 60000),
  finishedAt: null,
  totalQuestions: 3,
  correctCount: 0,
  wrongCount: 0,
  emptyCount: 0,
  score: 0,
  questions: [
    { order: 1, questionId: 'q-1', userAnswer: null, isCorrect: null, answeredAt: null },
    { order: 2, questionId: 'q-2', userAnswer: null, isCorrect: null, answeredAt: null },
    { order: 3, questionId: 'q-3', userAnswer: null, isCorrect: null, answeredAt: null },
  ],
  ...overrides,
});

const mockPrisma = {
  examType: { findUnique: jest.fn() },
  questionType: { findMany: jest.fn() },
  question: { findMany: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
  examSessionQuestion: {
    findMany: jest.fn(),
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    update: jest.fn(),
  },
  examSession: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  quarantineItem: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
  },
  quarantineAttempt: { create: jest.fn() },
  $transaction: jest.fn(),
};

describe('ExamsService', () => {
  let service: ExamsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
  });

  // ─── Özel Sınav ──────────────────────────────────────────────────────────

  describe('createCustomExam', () => {
    const dto = { examTypeId: EXAM_TYPE_ID, questionTypeIds: ['qt-1'], questionCount: 3 };

    it('yeterli soru varsa sınav oluşturmalı', async () => {
      mockPrisma.examType.findUnique.mockResolvedValue(mockExamType);
      mockPrisma.questionType.findMany.mockResolvedValue([{ id: 'qt-1' }]);
      mockPrisma.examSessionQuestion.findMany.mockResolvedValue([]);
      mockPrisma.question.findMany
        .mockResolvedValueOnce([makeQuestion('q-1'), makeQuestion('q-2'), makeQuestion('q-3')])
        .mockResolvedValueOnce([]);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.examSession.create.mockResolvedValue({ id: EXAM_ID });
      mockPrisma.examSessionQuestion.update = jest.fn();

      const result = await service.createCustomExam(dto, USER_ID);
      expect(result).toMatchObject({ examSessionId: EXAM_ID });
    });

    it('geçersiz sınav türü için NotFoundException fırlatmalı', async () => {
      mockPrisma.examType.findUnique.mockResolvedValue(null);
      await expect(service.createCustomExam(dto, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('yeterli soru yoksa BadRequestException fırlatmalı', async () => {
      mockPrisma.examType.findUnique.mockResolvedValue(mockExamType);
      mockPrisma.questionType.findMany.mockResolvedValue([{ id: 'qt-1' }]);
      mockPrisma.examSessionQuestion.findMany.mockResolvedValue([]);
      mockPrisma.question.findMany
        .mockResolvedValueOnce([makeQuestion('q-1')]) // yalnızca 1 soru var
        .mockResolvedValueOnce([]);

      await expect(service.createCustomExam(dto, USER_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Cevaplama ────────────────────────────────────────────────────────────

  describe('answerQuestion', () => {
    it('doğru cevap için isCorrect=true döndürmeli', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue(makeSession());
      mockPrisma.question.findUnique.mockResolvedValue({ correctAnswer: 'A' });
      mockPrisma.examSessionQuestion.update.mockResolvedValue({});

      const result = await service.answerQuestion(
        EXAM_ID,
        { order: 1, answer: 'A', timeSpent: 30 },
        USER_ID,
      );
      expect(result.isCorrect).toBe(true);
    });

    it('yanlış cevap için isCorrect=false döndürmeli', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue(makeSession());
      mockPrisma.question.findUnique.mockResolvedValue({ correctAnswer: 'A' });
      mockPrisma.examSessionQuestion.update.mockResolvedValue({});

      const result = await service.answerQuestion(
        EXAM_ID,
        { order: 1, answer: 'B' },
        USER_ID,
      );
      expect(result.isCorrect).toBe(false);
    });

    it('başkasının sınavına erişimde ForbiddenException fırlatmalı', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue(makeSession({ userId: 'other-user' }));

      await expect(
        service.answerQuestion(EXAM_ID, { order: 1, answer: 'A' }, USER_ID),
      ).rejects.toThrow(ForbiddenException);
    });

    it('tamamlanmış sınava cevap gönderilince BadRequestException fırlatmalı', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue(
        makeSession({ finishedAt: new Date() }),
      );

      await expect(
        service.answerQuestion(EXAM_ID, { order: 1, answer: 'A' }, USER_ID),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── Sınav Bitirme & Puanlama ─────────────────────────────────────────────

  describe('finishExam', () => {
    it('KPSS net puanını doğru hesaplamalı (2 doğru, 1 yanlış = 2 - 0.25 = 1.75)', async () => {
      const sessionWithAnswers = makeSession({
        questions: [
          { order: 1, questionId: 'q-1', userAnswer: 'A', isCorrect: true, answeredAt: new Date() },
          { order: 2, questionId: 'q-2', userAnswer: 'B', isCorrect: true, answeredAt: new Date() },
          { order: 3, questionId: 'q-3', userAnswer: 'C', isCorrect: false, answeredAt: new Date() },
        ],
      });
      mockPrisma.examSession.findUnique.mockResolvedValue(sessionWithAnswers);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.examSession.update.mockResolvedValue({});
      mockPrisma.quarantineItem.findFirst.mockResolvedValue(null);
      mockPrisma.quarantineItem.create.mockResolvedValue({});

      const result = await service.finishExam(EXAM_ID, USER_ID);

      expect(result.correctCount).toBe(2);
      expect(result.wrongCount).toBe(1);
      expect(result.emptyCount).toBe(0);
      expect(result.score).toBeCloseTo(1.75);
    });

    it('yanlış soruları otomatik karantinaya almalı', async () => {
      const sessionWithWrong = makeSession({
        questions: [
          { order: 1, questionId: 'q-1', userAnswer: 'B', isCorrect: false, answeredAt: new Date() },
          { order: 2, questionId: 'q-2', userAnswer: null, isCorrect: null, answeredAt: null },
          { order: 3, questionId: 'q-3', userAnswer: null, isCorrect: null, answeredAt: null },
        ],
      });
      mockPrisma.examSession.findUnique.mockResolvedValue(sessionWithWrong);
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.examSession.update.mockResolvedValue({});
      mockPrisma.quarantineItem.findFirst.mockResolvedValue(null);
      mockPrisma.quarantineItem.create.mockResolvedValue({});

      const result = await service.finishExam(EXAM_ID, USER_ID);

      expect(result.quarantinedCount).toBe(1);
      expect(mockPrisma.quarantineItem.create).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Karantina Kurtarma ───────────────────────────────────────────────────

  describe('submitQuarantineAttempt', () => {
    const quarantineItem = {
      id: 'qi-1',
      userId: USER_ID,
      questionId: 'q-orig',
      status: QuarantineStatus.ACTIVE,
      question: { questionTypeId: 'qt-1' },
      attempts: [],
    };

    it('3 doğru cevapla karantinayı kurtarmalı', async () => {
      const itemWith2Correct = {
        ...quarantineItem,
        attempts: [
          { attemptQuestionId: 'q-a1', isCorrect: true },
          { attemptQuestionId: 'q-a2', isCorrect: true },
        ],
      };
      mockPrisma.quarantineItem.findUnique.mockResolvedValue(itemWith2Correct);
      mockPrisma.question.findUnique.mockResolvedValue({ correctAnswer: 'A' });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.quarantineAttempt.create.mockResolvedValue({});
      mockPrisma.quarantineItem.update.mockResolvedValue({});

      const result = await service.submitQuarantineAttempt(
        'qi-1',
        { questionId: 'q-a3', answer: 'A' },
        USER_ID,
      );

      expect(result.isCorrect).toBe(true);
      expect(result.rescued).toBe(true);
    });

    it('2 doğru 1 yanlış cevapla henüz kurtarılmamalı', async () => {
      const itemWith1Correct = {
        ...quarantineItem,
        attempts: [{ attemptQuestionId: 'q-a1', isCorrect: true }],
      };
      mockPrisma.quarantineItem.findUnique.mockResolvedValue(itemWith1Correct);
      mockPrisma.question.findUnique.mockResolvedValue({ correctAnswer: 'A' });
      mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
        fn(mockPrisma),
      );
      mockPrisma.quarantineAttempt.create.mockResolvedValue({});
      mockPrisma.quarantineItem.update.mockResolvedValue({});

      const result = await service.submitQuarantineAttempt(
        'qi-1',
        { questionId: 'q-a2', answer: 'B' }, // yanlış (doğru=A)
        USER_ID,
      );

      expect(result.isCorrect).toBe(false);
      expect(result.rescued).toBe(false);
    });
  });

  // ─── Haftalık Penaltı ─────────────────────────────────────────────────────

  describe('applyWeeklyPenalty', () => {
    it('7 günden eski aktif karantinalı soruları EXPIRED yapmalı', async () => {
      mockPrisma.quarantineItem.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.applyWeeklyPenalty();

      expect(result.expiredCount).toBe(5);
      expect(mockPrisma.quarantineItem.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: QuarantineStatus.EXPIRED },
        }),
      );
    });
  });
});
