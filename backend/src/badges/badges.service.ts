import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadgeEvent } from './dto/check-badge.dto';

// ─── Rozet kriterleri tip tanımları ────────────────────────────────────────────

type ExamCountCriteria = { type: 'exam_count'; threshold: number };
type QuarantineRescuedCriteria = {
  type: 'quarantine_rescued_count';
  threshold: number;
};
type DuelWinStreakCriteria = { type: 'duel_win_streak_weekly'; weeks: number };
type VideoMarathonCriteria = { type: 'video_all_completed' };
type WeeklyMostImprovedCriteria = { type: 'weekly_most_improved' };
type WeeklyMostDuelWinsCriteria = { type: 'weekly_most_duel_wins' };

type BadgeCriteria =
  | ExamCountCriteria
  | QuarantineRescuedCriteria
  | DuelWinStreakCriteria
  | VideoMarathonCriteria
  | WeeklyMostImprovedCriteria
  | WeeklyMostDuelWinsCriteria;

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Tüm Rozetler ──────────────────────────────────────────────────────────────

  async findAll() {
    const badges = await this.prisma.badge.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { users: true } } },
    });
    return { badges };
  }

  // ─── Kullanıcının Rozetleri ────────────────────────────────────────────────────

  async findMyBadges(userId: string) {
    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      include: { badge: true },
    });
    return { badges: userBadges };
  }

  // ─── Rozet Kazandırma (internal) ──────────────────────────────────────────────

  private async awardBadge(
    userId: string,
    badgeId: string,
    badgeName: string,
  ): Promise<boolean> {
    const exists = await this.prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId } },
    });
    if (exists) return false;

    await this.prisma.userBadge.create({ data: { userId, badgeId } });
    this.logger.log(`Badge awarded: userId=${userId} badgeId=${badgeId}`);

    // Bildirim gönder
    void this.notificationsService.notifyBadge(userId, badgeName, badgeId);

    return true;
  }

  // ─── Rozet Hak Ediş Kontrolü ──────────────────────────────────────────────────

  async checkBadges(
    userId: string,
    event: BadgeEvent,
    metadata?: Record<string, unknown>,
  ): Promise<{ awarded: string[] }> {
    const awarded: string[] = [];

    // Kriterlere uygun rozet adaylarını al
    const badges = await this.prisma.badge.findMany({
      select: { id: true, name: true, criteria: true },
    });

    for (const badge of badges) {
      const criteria = badge.criteria as BadgeCriteria;
      let earned = false;

      switch (criteria.type) {
        case 'exam_count':
          if (event === BadgeEvent.EXAM_COMPLETED) {
            earned = await this.checkExamCount(userId, criteria.threshold);
          }
          break;

        case 'quarantine_rescued_count':
          if (event === BadgeEvent.QUARANTINE_RESCUED) {
            earned = await this.checkQuarantineRescued(
              userId,
              criteria.threshold,
            );
          }
          break;

        case 'duel_win_streak_weekly':
          if (event === BadgeEvent.DUEL_WON) {
            earned = await this.checkDuelWinStreak(userId, criteria.weeks);
          }
          break;

        case 'video_all_completed':
          if (event === BadgeEvent.VIDEO_WATCHED) {
            earned = await this.checkVideoMarathon(userId);
          }
          break;

        case 'weekly_most_improved':
        case 'weekly_most_duel_wins':
          // Haftalık sistem tarafından manuel olarak verilir
          break;
      }

      if (earned) {
        const wasAwarded = await this.awardBadge(userId, badge.id, badge.name);
        if (wasAwarded) awarded.push(badge.name);
      }
    }

    void metadata; // kullanılabilir ileride
    return { awarded };
  }

  // ─── Rozet Kriterleri Kontrolleri ──────────────────────────────────────────────

  private async checkExamCount(
    userId: string,
    threshold: number,
  ): Promise<boolean> {
    const count = await this.prisma.examSession.count({
      where: { userId, finishedAt: { not: null } },
    });
    return count >= threshold;
  }

  private async checkQuarantineRescued(
    userId: string,
    threshold: number,
  ): Promise<boolean> {
    const count = await this.prisma.quarantineItem.count({
      where: { userId, status: 'RESCUED' },
    });
    return count >= threshold;
  }

  private async checkDuelWinStreak(
    userId: string,
    weeks: number,
  ): Promise<boolean> {
    // Son N hafta içinde her hafta en az 1 düello galibiyet var mı?
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - weeks * 7);

    const wins = await this.prisma.duelMatch.findMany({
      where: {
        winnerId: userId,
        status: 'COMPLETED',
        createdAt: { gte: weekStart },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    if (wins.length === 0) return false;

    // Her haftanın galibiyetini kontrol et
    const weekSet = new Set<string>();
    for (const win of wins) {
      const d = win.createdAt;
      const weekNum = this.getISOWeek(d);
      weekSet.add(`${d.getFullYear()}-${weekNum}`);
    }
    return weekSet.size >= weeks;
  }

  private getISOWeek(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private async checkVideoMarathon(userId: string): Promise<boolean> {
    const [totalVideos, completedVideos] = await Promise.all([
      this.prisma.video.count({ where: { isActive: true } }),
      this.prisma.videoProgress.count({ where: { userId, completed: true } }),
    ]);
    return totalVideos > 0 && completedVideos >= totalVideos;
  }

  // ─── Haftalık Rozet: En Çok Düello Kazananı ───────────────────────────────────

  async awardWeeklyDuelWinner(): Promise<{
    awarded: boolean;
    userId?: string;
  }> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const results = await this.prisma.duelMatch.groupBy({
      by: ['winnerId'],
      where: {
        status: 'COMPLETED',
        createdAt: { gte: weekAgo },
        winnerId: { not: null },
      },
      _count: { winnerId: true },
      orderBy: { _count: { winnerId: 'desc' } },
      take: 1,
    });

    if (!results.length || !results[0]?.winnerId) return { awarded: false };

    const winnerId = results[0].winnerId;
    const badge = await this.prisma.badge.findFirst({
      where: { criteria: { path: ['type'], equals: 'weekly_most_duel_wins' } },
    });
    if (!badge) return { awarded: false };

    const wasAwarded = await this.awardBadge(winnerId, badge.id, badge.name);
    return { awarded: wasAwarded, userId: winnerId };
  }

  // ─── Haftalık Rozet: En Gelişen ───────────────────────────────────────────────

  async awardWeeklyMostImproved(userId: string): Promise<{ awarded: boolean }> {
    const badge = await this.prisma.badge.findFirst({
      where: { criteria: { path: ['type'], equals: 'weekly_most_improved' } },
    });
    if (!badge) return { awarded: false };

    const wasAwarded = await this.awardBadge(userId, badge.id, badge.name);
    return { awarded: wasAwarded };
  }
}
