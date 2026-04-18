import { Inject, Injectable, Logger } from '@nestjs/common';
import { RankingPeriod } from '@prisma/client';
import type Redis from 'ioredis';
import { PrismaService } from '../common/database/prisma.service';
import { REDIS_CLIENT } from '../common/redis/redis.constants';

// Puan sabit tanımları
export const SCORE_RULES = {
  EXAM_COMPLETION: 0,      // net puan kadar (dinamik)
  SHADOW_RIVAL_WIN: 50,
  DUEL_WIN: 0,             // bet_points kadar (dinamik)
  QUARANTINE_CLEAR: 20,
  VIDEO_WATCH: 5,
  QUARANTINE_FAIL: -10,
} as const;

@Injectable()
export class RankingsService {
  private readonly logger = new Logger(RankingsService.name);
  private readonly PAGE_SIZE = 10;
  private readonly MAX_RANK = 100;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ─── Key Helpers ────────────────────────────────────────────────────────────

  private getDateKey(period: RankingPeriod, from?: Date): string {
    const now = from ?? new Date();
    if (period === RankingPeriod.DAILY) {
      return now.toISOString().slice(0, 10);
    }
    if (period === RankingPeriod.WEEKLY) {
      const week = this.getISOWeek(now);
      return `${now.getFullYear()}-${String(week).padStart(2, '0')}`;
    }
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  buildKey(examTypeId: string, period: RankingPeriod, from?: Date): string {
    return `ranking:${examTypeId}:${period}:${this.getDateKey(period, from)}`;
  }

  // ─── Puan Ekleme ─────────────────────────────────────────────────────────────

  async addScore(
    userId: string,
    examTypeId: string,
    points: number,
    reason: string,
  ): Promise<void> {
    if (points === 0) return;

    const pipeline = this.redis.pipeline();
    const periods: RankingPeriod[] = [
      RankingPeriod.DAILY,
      RankingPeriod.WEEKLY,
      RankingPeriod.MONTHLY,
    ];

    for (const period of periods) {
      const key = this.buildKey(examTypeId, period);
      pipeline.zincrby(key, points, userId);
    }

    await pipeline.exec();
    this.logger.debug(
      `addScore userId=${userId} examTypeId=${examTypeId} points=${points} reason=${reason}`,
    );
  }

  // ─── Leaderboard ──────────────────────────────────────────────────────────────

  async getLeaderboard(
    period: RankingPeriod,
    examTypeId: string,
    page: number,
  ) {
    const key = this.buildKey(examTypeId, period);
    const start = (page - 1) * this.PAGE_SIZE;
    const end = Math.min(start + this.PAGE_SIZE - 1, this.MAX_RANK - 1);

    const raw = await this.redis.zrevrange(key, start, end, 'WITHSCORES');

    const entries: { userId: string; score: number; rank: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      entries.push({
        userId: raw[i] as string,
        score: parseFloat(raw[i + 1] as string),
        rank: start + i / 2 + 1,
      });
    }

    if (entries.length === 0) {
      return { data: [], total: 0, page, period, examTypeId };
    }

    const userIds = entries.map((e) => e.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true, avatar: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const totalInSet = await this.redis.zcard(key);
    const total = Math.min(totalInSet, this.MAX_RANK);

    const data = entries.map((e) => ({
      rank: e.rank,
      score: e.score,
      userId: e.userId,
      displayName: userMap.get(e.userId)?.displayName ?? '—',
      avatar: userMap.get(e.userId)?.avatar ?? null,
    }));

    return { data, total, page, period, examTypeId };
  }

  // ─── Kendi Sıram ─────────────────────────────────────────────────────────────

  async getMyRanking(
    userId: string,
    examTypeId: string,
    period: RankingPeriod = RankingPeriod.WEEKLY,
  ) {
    const key = this.buildKey(examTypeId, period);
    const [rank, score] = await Promise.all([
      this.redis.zrevrank(key, userId),
      this.redis.zscore(key, userId),
    ]);

    return {
      userId,
      examTypeId,
      period,
      rank: rank !== null ? rank + 1 : null,
      score: score !== null ? parseFloat(score) : 0,
    };
  }

  // ─── Aylık İlk 3 (Burs Adayları) ─────────────────────────────────────────────

  async getTop3(examTypeId: string) {
    const key = this.buildKey(examTypeId, RankingPeriod.MONTHLY);
    const raw = await this.redis.zrevrange(key, 0, 2, 'WITHSCORES');

    const entries: { userId: string; score: number; rank: number }[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      entries.push({
        userId: raw[i] as string,
        score: parseFloat(raw[i + 1] as string),
        rank: i / 2 + 1,
      });
    }

    if (entries.length === 0) return { candidates: [], scholarshipAmount: 10000 };

    const users = await this.prisma.user.findMany({
      where: { id: { in: entries.map((e) => e.userId) } },
      select: { id: true, displayName: true, avatar: true, city: true, school: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      scholarshipAmount: 10000,
      candidates: entries.map((e) => ({
        rank: e.rank,
        score: e.score,
        ...userMap.get(e.userId),
      })),
    };
  }

  // ─── Prestij Ödülleri ────────────────────────────────────────────────────────

  async getPrestige() {
    const awards = await this.prisma.prestigeAward.findMany({
      orderBy: { awardedAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, displayName: true, avatar: true } },
      },
    });
    return { awards };
  }

  async grantPrestige(
    userId: string,
    category: string,
    period: string,
  ) {
    return this.prisma.prestigeAward.create({
      data: { userId, category, period },
    });
  }

  async evaluateWeeklyPrestige(examTypeId: string): Promise<{ granted: number }> {
    const weekKey = this.buildKey(examTypeId, RankingPeriod.WEEKLY);
    const raw = await this.redis.zrevrange(weekKey, 0, 0, 'WITHSCORES');
    if (raw.length < 2) return { granted: 0 };

    const topUserId = raw[0] as string;
    const dateKey = this.getDateKey(RankingPeriod.WEEKLY);
    const period = `${examTypeId}:${dateKey}`;

    const existing = await this.prisma.prestigeAward.findFirst({
      where: { userId: topUserId, category: 'weekly_top', period },
    });
    if (existing) return { granted: 0 };

    await this.grantPrestige(topUserId, 'weekly_top', period);
    return { granted: 1 };
  }

  // ─── Geçmiş Sıralamalar ───────────────────────────────────────────────────────

  async getHistory(userId: string) {
    const snapshots = await this.prisma.rankingSnapshot.findMany({
      where: { userId },
      orderBy: { snapshotDate: 'desc' },
      take: 90,
      include: {
        examType: { select: { id: true, name: true } },
      },
    });
    return { snapshots };
  }

  // ─── Snapshot (Redis → DB) ────────────────────────────────────────────────────

  async takeSnapshot(
    examTypeId: string,
    period: RankingPeriod,
  ): Promise<{ written: number }> {
    const key = this.buildKey(examTypeId, period);
    const raw = await this.redis.zrevrange(key, 0, this.MAX_RANK - 1, 'WITHSCORES');

    const snapshotDate = new Date();
    snapshotDate.setHours(0, 0, 0, 0);

    let written = 0;
    for (let i = 0; i < raw.length; i += 2) {
      const userId = raw[i] as string;
      const score = parseFloat(raw[i + 1] as string);
      const rank = i / 2 + 1;

      await this.prisma.rankingSnapshot.upsert({
        where: {
          userId_examTypeId_period_snapshotDate: {
            userId,
            examTypeId,
            period,
            snapshotDate,
          },
        },
        update: { score, rank },
        create: { userId, examTypeId, period, score, rank, snapshotDate },
      });
      written++;
    }

    return { written };
  }
}
