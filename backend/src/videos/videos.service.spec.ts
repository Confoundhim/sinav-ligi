import { Test, TestingModule } from '@nestjs/testing';
import { VideosService } from './videos.service';
import { PrismaService } from '../common/database/prisma.service';

const mockPrisma = {
  video: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  videoProgress: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('VideosService', () => {
  let service: VideosService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
  });

  describe('findByQuestionType', () => {
    it('soru tipine ait videoları döndürmeli', async () => {
      mockPrisma.video.findMany.mockResolvedValue([
        { id: 'vid-1', title: 'Video 1', sortOrder: 1 },
        { id: 'vid-2', title: 'Video 2', sortOrder: 2 },
      ]);

      const result = await service.findByQuestionType('qt-1');
      expect(result.videos).toHaveLength(2);
    });
  });

  describe('saveProgress', () => {
    it('video ilerlemesini kaydetmeli', async () => {
      mockPrisma.video.findUnique.mockResolvedValue({
        id: 'vid-1',
        duration: 600,
      });
      mockPrisma.videoProgress.upsert.mockResolvedValue({
        userId: 'user-1',
        videoId: 'vid-1',
        watchedSeconds: 300,
        completed: false,
      });

      const result = await service.saveProgress('user-1', 'vid-1', 300, false);
      expect(result.progress).toBeDefined();
    });

    it('%90 izlendiğinde completed true olmalı', async () => {
      mockPrisma.video.findUnique.mockResolvedValue({
        id: 'vid-1',
        duration: 100,
      });
      mockPrisma.videoProgress.upsert.mockResolvedValue({
        userId: 'user-1',
        videoId: 'vid-1',
        watchedSeconds: 95,
        completed: true,
      });

      const result = await service.saveProgress('user-1', 'vid-1', 95, false);
      expect(result.progress?.completed).toBe(true);
    });
  });

  describe('getProgress', () => {
    it('kullanıcının ilerleme durumunu döndürmeli', async () => {
      mockPrisma.video.findMany.mockResolvedValue([
        { id: 'vid-1' },
        { id: 'vid-2' },
      ]);
      mockPrisma.videoProgress.findMany.mockResolvedValue([
        { videoId: 'vid-1', completed: true },
      ]);

      const result = await service.getProgress('user-1', 'qt-1');
      expect(result.totalVideos).toBe(2);
      expect(result.completedVideos).toBe(1);
    });
  });
});
