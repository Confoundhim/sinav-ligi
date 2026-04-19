import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Video Listesi ────────────────────────────────────────────────────────

  async findByQuestionType(questionTypeId: string) {
    const videos = await this.prisma.video.findMany({
      where: { questionTypeId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        title: true,
        videoUrl: true,
        thumbnailUrl: true,
        duration: true,
        sortOrder: true,
      },
    });
    return { videos };
  }

  // ─── Video İlerleme Kaydet ────────────────────────────────────────────────

  async saveProgress(
    userId: string,
    videoId: string,
    watchedSeconds: number,
    completed: boolean,
  ) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, duration: true, questionTypeId: true },
    });
    if (!video) return { error: 'Video bulunamadı' };

    const progress = await this.prisma.videoProgress.upsert({
      where: { userId_videoId: { userId, videoId } },
      update: {
        watchedSeconds,
        completed: completed || watchedSeconds >= video.duration * 0.9,
        lastWatchedAt: new Date(),
      },
      create: {
        userId,
        videoId,
        watchedSeconds,
        completed: completed || watchedSeconds >= video.duration * 0.9,
        lastWatchedAt: new Date(),
      },
    });

    return { progress };
  }

  // ─── Kullanıcının İlerleme Durumu ─────────────────────────────────────────

  async getProgress(userId: string, questionTypeId: string) {
    const videos = await this.prisma.video.findMany({
      where: { questionTypeId, isActive: true },
      select: { id: true },
    });

    const videoIds = videos.map((v) => v.id);

    const progress = await this.prisma.videoProgress.findMany({
      where: { userId, videoId: { in: videoIds } },
      select: {
        videoId: true,
        watchedSeconds: true,
        completed: true,
        lastWatchedAt: true,
      },
    });

    const completedCount = progress.filter((p) => p.completed).length;

    return {
      totalVideos: videos.length,
      completedVideos: completedCount,
      progress,
    };
  }
}
