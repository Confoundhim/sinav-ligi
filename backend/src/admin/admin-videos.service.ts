import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

interface CreateVideoDto {
  questionTypeId: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  sortOrder: number;
}

interface UpdateVideoDto {
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  sortOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class AdminVideosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVideoDto) {
    const video = await this.prisma.video.create({
      data: {
        questionTypeId: dto.questionTypeId,
        title: dto.title,
        videoUrl: dto.videoUrl,
        thumbnailUrl: dto.thumbnailUrl,
        duration: dto.duration,
        sortOrder: dto.sortOrder,
      },
    });
    return { video };
  }

  async update(id: string, dto: UpdateVideoDto) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video bulunamadı');

    const updated = await this.prisma.video.update({
      where: { id },
      data: dto,
    });
    return { video: updated };
  }

  async remove(id: string) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video bulunamadı');

    await this.prisma.video.delete({ where: { id } });
    return { deleted: true };
  }
}
