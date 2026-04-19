import { Test, TestingModule } from '@nestjs/testing';
import { AchievementsService } from './achievements.service';
import { PrismaService } from '../common/database/prisma.service';

const mockPrisma = {
  certificate: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  trophy: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  wisdomTree: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  videoProgress: {
    count: jest.fn(),
  },
  video: {
    count: jest.fn(),
  },
  questionType: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  friendship: {
    findFirst: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
};

describe('AchievementsService', () => {
  let service: AchievementsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AchievementsService>(AchievementsService);
  });

  describe('getCertificates', () => {
    it('kullanıcının sertifikalarını döndürmeli', async () => {
      mockPrisma.certificate.findMany.mockResolvedValue([
        { id: 'cert-1', title: 'Test Sertifikası', userId: 'user-1' },
      ]);

      const result = await service.getCertificates('user-1');
      expect(result.certificates).toHaveLength(1);
    });
  });

  describe('getTrophies', () => {
    it('kullanıcının kupalarını döndürmeli', async () => {
      mockPrisma.trophy.findMany.mockResolvedValue([
        { id: 'trophy-1', type: 'weekly_top10', userId: 'user-1' },
      ]);

      const result = await service.getTrophies('user-1');
      expect(result.trophies).toHaveLength(1);
    });
  });

  describe('createShadowCertificate', () => {
    it('gölge sınav sertifikası oluşturmalı', async () => {
      mockPrisma.certificate.create.mockResolvedValue({
        id: 'cert-1',
        userId: 'user-1',
        title: 'KPSS Gölge Rakip Sınavı Sertifikası',
      });

      const result = await service.createShadowCertificate(
        'user-1',
        'session-1',
        'KPSS',
        75.5,
      );

      expect(result.certificateId).toBe('cert-1');
      expect(mockPrisma.certificate.create).toHaveBeenCalled();
    });
  });

  describe('checkAndCreateDuelTrophy', () => {
    it('50 galibiyette kupa vermeli', async () => {
      mockPrisma.trophy.findFirst.mockResolvedValue(null);
      mockPrisma.trophy.create.mockResolvedValue({
        id: 'trophy-1',
        userId: 'user-1',
        type: 'duel_50_wins',
      });

      const result = await service.checkAndCreateDuelTrophy('user-1', 50);

      expect(result.awarded).toBe(true);
      expect(mockPrisma.trophy.create).toHaveBeenCalled();
    });

    it('50 galibiyetten azsa kupa vermemeli', async () => {
      const result = await service.checkAndCreateDuelTrophy('user-1', 30);

      expect(result.awarded).toBe(false);
      expect(mockPrisma.trophy.create).not.toHaveBeenCalled();
    });
  });
});
