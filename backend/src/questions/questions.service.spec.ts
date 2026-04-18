import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../common/database/prisma.service';

const mockQuestionType = {
  id: 'qt-1',
  subjectId: 'sub-1',
  name: 'Türkçe Dil Bilgisi',
  questionCount: 10,
  sortOrder: 1,
};

const mockQuestion = {
  id: 'q-1',
  questionTypeId: 'qt-1',
  content: {
    text: 'Aşağıdakilerden hangisi doğrudur?',
    choices: { A: 'Seçenek A', B: 'Seçenek B', C: 'Seçenek C', D: 'Seçenek D', E: 'Seçenek E' },
    images: [],
  },
  correctAnswer: 'A',
  explanation: 'Çözüm açıklaması',
  difficulty: 2,
  isActive: true,
  usageCount: 0,
  createdAt: new Date(),
  questionType: { name: 'Türkçe Dil Bilgisi' },
};

const mockPrisma = {
  questionType: { findUnique: jest.fn() },
  question: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  examType: { findUnique: jest.fn(), findMany: jest.fn() },
  subject: { findUnique: jest.fn(), findMany: jest.fn() },
};

describe('QuestionsService', () => {
  let service: QuestionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  describe('create', () => {
    const dto = {
      content: {
        text: 'Test sorusu metni burada yer almaktadır ve benzersizdir',
        choices: { A: 'A seçeneği', B: 'B seçeneği', C: 'C seçeneği', D: 'D seçeneği', E: 'E seçeneği' },
      },
      correctAnswer: 'A',
      explanation: 'Açıklama',
      questionTypeId: 'qt-1',
      difficulty: 2,
    };

    it('geçerli DTO ile soru oluşturmalı', async () => {
      mockPrisma.questionType.findUnique.mockResolvedValue(mockQuestionType);
      mockPrisma.question.findMany.mockResolvedValue([]);
      mockPrisma.question.create.mockResolvedValue(mockQuestion);

      const result = await service.create(dto);

      expect(mockPrisma.question.create).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ id: 'q-1' });
    });

    it('geçersiz soru tipi ID için NotFoundException fırlatmalı', async () => {
      mockPrisma.questionType.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('çok benzer soru varsa ConflictException fırlatmalı', async () => {
      mockPrisma.questionType.findUnique.mockResolvedValue(mockQuestionType);
      // Tamamen aynı metin olan soru
      mockPrisma.question.findMany.mockResolvedValue([
        {
          id: 'q-existing',
          content: {
            text: 'Test sorusu metni burada yer almaktadır ve benzersizdir',
            choices: { A: 'A seçeneği', B: 'B seçeneği', C: 'C seçeneği', D: 'D seçeneği', E: 'E seçeneği' },
          },
        },
      ]);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('sayfalanmış soru listesi döndürmeli', async () => {
      mockPrisma.question.findMany.mockResolvedValue([mockQuestion]);
      mockPrisma.question.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('ID ile soru getirmeli', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(mockQuestion);
      const result = await service.findOne('q-1');
      expect(result.id).toBe('q-1');
    });

    it('bulunamayan soru için NotFoundException fırlatmalı', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soruyu soft delete yapmalı (isActive=false)', async () => {
      mockPrisma.question.findUnique.mockResolvedValue(mockQuestion);
      mockPrisma.question.update.mockResolvedValue({ ...mockQuestion, isActive: false });

      await service.remove('q-1');

      expect(mockPrisma.question.update).toHaveBeenCalledWith({
        where: { id: 'q-1' },
        data: { isActive: false },
      });
    });
  });

  describe('Levenshtein benzerlik', () => {
    it('tamamen farklı metinler için benzerlik düşük olmalı', () => {
      const sim = (service as unknown as { similarity: (a: string, b: string) => number }).similarity(
        'matematik cebir denklemi',
        'türkçe dil bilgisi fiil',
      );
      expect(sim).toBeLessThan(0.5);
    });

    it('aynı metinler için benzerlik 1 olmalı', () => {
      const sim = (service as unknown as { similarity: (a: string, b: string) => number }).similarity(
        'aynı metin',
        'aynı metin',
      );
      expect(sim).toBe(1);
    });
  });

  describe('getExamTypes', () => {
    it('aktif sınav türlerini döndürmeli', async () => {
      const mockTypes = [{ id: 'et-1', name: 'KPSS', isActive: true }];
      mockPrisma.examType.findMany.mockResolvedValue(mockTypes);

      const result = await service.getExamTypes();
      expect(result).toEqual(mockTypes);
    });
  });
});
