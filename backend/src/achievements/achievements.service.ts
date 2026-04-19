import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';

// Wisdom tree tamamlanma eşiği (soru tipinin kaç videosu tamamlanmalı)
const WISDOM_TREE_VIDEO_THRESHOLD = 10;

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Sertifika Duvarı ─────────────────────────────────────────────────────

  async getCertificates(userId: string) {
    const certificates = await this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      include: {
        examSession: {
          select: {
            id: true,
            type: true,
            score: true,
            correctCount: true,
            totalQuestions: true,
            duration: true,
            finishedAt: true,
            examType: { select: { id: true, name: true } },
          },
        },
      },
    });
    return { certificates };
  }

  /**
   * Gölge rakip sınavı tamamlandığında çağrılır.
   * ExamsService.finishExam tarafından tetiklenir.
   */
  async createShadowCertificate(
    userId: string,
    examSessionId: string,
    examTypeName: string,
    score: number,
  ): Promise<{ certificateId: string }> {
    const title = `${examTypeName} Gölge Rakip Sınavı Sertifikası`;
    const description = `Net puan: ${score.toFixed(2)} — Gölge rakip sınavını başarıyla tamamladınız.`;

    const cert = await this.prisma.certificate.create({
      data: {
        userId,
        title,
        description,
        examSessionId,
      },
    });

    this.logger.log(
      `Certificate created: userId=${userId} sessionId=${examSessionId}`,
    );
    return { certificateId: cert.id };
  }

  // ─── Kupa Rafı ────────────────────────────────────────────────────────────

  async getTrophies(userId: string) {
    const trophies = await this.prisma.trophy.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });
    return { trophies };
  }

  /**
   * Haftalık ilk 10'a girildiğinde kupa oluştur.
   * RankingsService veya admin cron tarafından tetiklenir.
   */
  async createWeeklyTop10Trophy(
    userId: string,
    stats: { rank: number; examTypeName: string; period: string },
  ): Promise<{ trophyId: string }> {
    const trophy = await this.prisma.trophy.create({
      data: {
        userId,
        type: 'weekly_top10',
        stats: {
          rank: stats.rank,
          examTypeName: stats.examTypeName,
          period: stats.period,
        },
      },
    });
    this.logger.log(`Weekly top10 trophy: userId=${userId} rank=${stats.rank}`);
    return { trophyId: trophy.id };
  }

  /**
   * 50 düello galibiyetinde kupa oluştur.
   * DuelsService tarafından tetiklenir.
   */
  async checkAndCreateDuelTrophy(
    userId: string,
    totalWins: number,
  ): Promise<{ awarded: boolean; trophyId?: string }> {
    const MILESTONE = 50;
    if (totalWins < MILESTONE) return { awarded: false };

    // Daha önce verildi mi?
    const existing = await this.prisma.trophy.findFirst({
      where: { userId, type: 'duel_50_wins' },
    });
    if (existing) return { awarded: false };

    const trophy = await this.prisma.trophy.create({
      data: {
        userId,
        type: 'duel_50_wins',
        stats: { totalWins },
      },
    });
    this.logger.log(`Duel 50-wins trophy awarded: userId=${userId}`);
    return { awarded: true, trophyId: trophy.id };
  }

  // ─── Bilgelik Ağacı ───────────────────────────────────────────────────────

  async getWisdomTree(userId: string) {
    const entries = await this.prisma.wisdomTree.findMany({
      where: { userId },
      include: {
        subject: { select: { id: true, name: true, icon: true } },
        questionType: { select: { id: true, name: true, sortOrder: true } },
      },
      orderBy: [
        { subject: { name: 'asc' } },
        { questionType: { sortOrder: 'asc' } },
      ],
    });

    // Ders bazında grupla
    const tree = new Map<
      string,
      {
        subject: { id: string; name: string; icon: string | null };
        branches: typeof entries;
      }
    >();

    for (const entry of entries) {
      const key = entry.subjectId;
      if (!tree.has(key)) {
        tree.set(key, { subject: entry.subject, branches: [] });
      }
      tree.get(key)!.branches.push(entry);
    }

    return {
      wisdomTree: Array.from(tree.values()).map((node) => ({
        subject: node.subject,
        completedBranches: node.branches.length,
        branches: node.branches.map((b) => ({
          questionTypeId: b.questionTypeId,
          questionTypeName: b.questionType.name,
          completedAt: b.completedAt,
        })),
      })),
    };
  }

  /**
   * Video izleme ilerlemesi güncellendiğinde çağrılır.
   * Soru tipinin tüm videolarını tamamladıysa bilgelik ağacına dal ekler.
   */
  async checkAndUpdateWisdomTree(
    userId: string,
    questionTypeId: string,
  ): Promise<{ unlocked: boolean }> {
    // Soru tipini bul (subjectId için)
    const qt = await this.prisma.questionType.findUnique({
      where: { id: questionTypeId },
      select: { id: true, subjectId: true },
    });
    if (!qt) return { unlocked: false };

    // Zaten kayıtlı mı?
    const existing = await this.prisma.wisdomTree.findUnique({
      where: {
        userId_subjectId_questionTypeId: {
          userId,
          subjectId: qt.subjectId,
          questionTypeId,
        },
      },
    });
    if (existing) return { unlocked: false };

    // Soru tipine ait aktif video sayısı
    const totalVideos = await this.prisma.video.count({
      where: { questionTypeId, isActive: true },
    });

    if (totalVideos < WISDOM_TREE_VIDEO_THRESHOLD) {
      // Yeterli video tanımlanmamış — mevcut videoların tamamı tamamlandı mı?
      if (totalVideos === 0) return { unlocked: false };
    }

    // Kullanıcının bu soru tipi videolarından tamamladıkları
    const completedCount = await this.prisma.videoProgress.count({
      where: {
        userId,
        completed: true,
        video: { questionTypeId, isActive: true },
      },
    });

    const threshold =
      totalVideos >= WISDOM_TREE_VIDEO_THRESHOLD
        ? WISDOM_TREE_VIDEO_THRESHOLD
        : totalVideos;

    if (completedCount < threshold) return { unlocked: false };

    // Dal ekle
    await this.prisma.wisdomTree.create({
      data: {
        userId,
        subjectId: qt.subjectId,
        questionTypeId,
      },
    });

    this.logger.log(
      `WisdomTree unlocked: userId=${userId} questionTypeId=${questionTypeId}`,
    );
    return { unlocked: true };
  }

  // ─── Müze Görünürlüğü ─────────────────────────────────────────────────────

  async getMuseum(viewerUserId: string, targetUserId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId, isActive: true },
      select: {
        id: true,
        displayName: true,
        avatar: true,
        profile: { select: { bio: true } },
      },
    });

    if (!target) throw new NotFoundException('Kullanıcı bulunamadı');

    // Gizlilik: arkadaş mı? (ACCEPTED)
    const areFriends =
      viewerUserId === targetUserId
        ? true
        : !!(await this.prisma.friendship.findFirst({
            where: {
              OR: [
                {
                  requesterId: viewerUserId,
                  addresseeId: targetUserId,
                  status: 'ACCEPTED',
                },
                {
                  requesterId: targetUserId,
                  addresseeId: viewerUserId,
                  status: 'ACCEPTED',
                },
              ],
            },
          }));

    // Kendi müzeni herkese açık görüntüleyebilirsin
    // Başkasının müzesi: arkadaş olmalı
    if (viewerUserId !== targetUserId && !areFriends) {
      throw new ForbiddenException(
        'Bu müzeyi görüntülemek için arkadaş olmanız gerekiyor',
      );
    }

    const [certificates, trophies, wisdomTreeResult] = await Promise.all([
      this.getCertificates(targetUserId),
      this.getTrophies(targetUserId),
      this.getWisdomTree(targetUserId),
    ]);

    return {
      user: target,
      museum: {
        certificates: certificates.certificates,
        trophies: trophies.trophies,
        wisdomTree: wisdomTreeResult.wisdomTree,
      },
      areFriends,
    };
  }

  async congratulate(
    fromUserId: string,
    toUserId: string,
    message: string,
  ): Promise<{ sent: boolean }> {
    if (fromUserId === toUserId) {
      throw new ConflictException('Kendinizi tebrik edemezsiniz');
    }

    const toUser = await this.prisma.user.findUnique({
      where: { id: toUserId, isActive: true },
      select: { id: true },
    });
    if (!toUser) throw new NotFoundException('Kullanıcı bulunamadı');

    const fromUser = await this.prisma.user.findUnique({
      where: { id: fromUserId },
      select: { displayName: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: toUserId,
        type: 'CONGRATULATION',
        title: 'Yeni Tebrik!',
        body: `${fromUser?.displayName ?? 'Birisi'} müzenizi tebrik etti: "${message}"`,
        data: { fromUserId, message },
      },
    });

    return { sent: true };
  }
}
