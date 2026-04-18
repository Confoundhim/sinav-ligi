import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { REDIS_CLIENT } from '../common/redis/redis.constants';
import Redis from 'ioredis';
import { DuelMatchStatus } from '@prisma/client';
import { ChallengeDto, MatchmakingDto } from './dto/challenge.dto';

const DUEL_QUESTION_COUNT = 20;
const DAILY_RIGHT_LIMIT = 1;
const MATCHMAKING_SCORE_RANGE = 200;
const MATCHMAKING_TTL_SEC = 60;

interface MatchmakingEntry {
  userId: string;
  examTypeId: string;
  betPoints: number;
  score: number;
  socketTs: number;
}

interface DuelResult {
  duelId: string;
  challengerScore: number;
  opponentScore: number;
  winnerId: string | null;
  challengerCorrect: number;
  opponentCorrect: number;
  betPoints: number;
}

@Injectable()
export class DuelsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ─── Yardımcılar ─────────────────────────────────────────────────────────

  private todayTurkeyDate(): Date {
    // Türkiye saati (UTC+3) bazlı tarih — Prisma'ya Date olarak gönderilir
    const now = new Date();
    const tr = new Date(
      now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }),
    );
    return new Date(Date.UTC(tr.getFullYear(), tr.getMonth(), tr.getDate()));
  }

  private isWeekday(date: Date): boolean {
    // UTC gün: 0=Pazar, 6=Cumartesi
    const day = date.getUTCDay();
    return day >= 1 && day <= 5;
  }

  // ─── Hak Sistemi ──────────────────────────────────────────────────────────

  async getRights(userId: string) {
    const today = this.todayTurkeyDate();
    const isWeekday = this.isWeekday(today);

    if (!isWeekday) {
      return {
        available: false,
        used: 0,
        limit: 0,
        reason: 'Hafta sonu düello yapılamaz',
      };
    }

    const right = await this.prisma.duelRight.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const used = right?.used ?? 0;
    return {
      available: used < DAILY_RIGHT_LIMIT,
      used,
      limit: DAILY_RIGHT_LIMIT,
      date: today.toISOString().split('T')[0],
    };
  }

  private async consumeRight(userId: string): Promise<void> {
    const today = this.todayTurkeyDate();
    if (!this.isWeekday(today)) {
      throw new BadRequestException('Hafta sonu düello yapılamaz');
    }

    const right = await this.prisma.duelRight.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (right && right.used >= DAILY_RIGHT_LIMIT) {
      throw new BadRequestException('Bugünkü düello hakkınız doldu');
    }

    await this.prisma.duelRight.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, used: 1 },
      update: { used: { increment: 1 } },
    });
  }

  // ─── Soru Seçimi ──────────────────────────────────────────────────────────

  private async pickQuestions(examTypeId: string): Promise<string[]> {
    const questions = await this.prisma.question.findMany({
      where: {
        isActive: true,
        questionType: { subject: { examTypeId } },
      },
      select: { id: true },
      orderBy: { usageCount: 'asc' },
      take: DUEL_QUESTION_COUNT * 3,
    });

    if (questions.length < DUEL_QUESTION_COUNT) {
      throw new BadRequestException('Yeterli soru bulunamadı');
    }

    // Rastgele karıştır ve 20 seç
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, DUEL_QUESTION_COUNT).map((q) => q.id);
  }

  // ─── Meydan Okuma ────────────────────────────────────────────────────────

  async challenge(challengerId: string, dto: ChallengeDto) {
    if (challengerId === dto.opponentId) {
      throw new BadRequestException('Kendinize meydan okuyamazsınız');
    }

    // Hak kontrol
    await this.consumeRight(challengerId);

    // Karşı taraf varlık kontrolü
    const opponent = await this.prisma.user.findUnique({
      where: { id: dto.opponentId, isActive: true },
    });
    if (!opponent) throw new NotFoundException('Kullanıcı bulunamadı');

    // Aktif düello var mı?
    const activeCount = await this.prisma.duelMatch.count({
      where: {
        OR: [
          {
            challengerId,
            status: { in: [DuelMatchStatus.PENDING, DuelMatchStatus.ACTIVE] },
          },
          {
            opponentId: challengerId,
            status: { in: [DuelMatchStatus.PENDING, DuelMatchStatus.ACTIVE] },
          },
        ],
      },
    });
    if (activeCount > 0) {
      throw new BadRequestException('Zaten aktif bir düellonuz var');
    }

    const match = await this.prisma.duelMatch.create({
      data: {
        challengerId,
        opponentId: dto.opponentId,
        examTypeId: dto.examTypeId,
        betPoints: dto.betPoints,
        status: DuelMatchStatus.PENDING,
      },
      include: {
        challenger: { select: { id: true, displayName: true, avatar: true } },
        opponent: { select: { id: true, displayName: true, avatar: true } },
        examType: { select: { name: true } },
      },
    });

    return match;
  }

  // ─── Eşleşme Kuyruğu (Redis) ─────────────────────────────────────────────

  async joinMatchmaking(userId: string, dto: MatchmakingDto) {
    const today = this.todayTurkeyDate();
    if (!this.isWeekday(today)) {
      throw new BadRequestException('Hafta sonu düello yapılamaz');
    }

    // Kullanıcının mevcut puanını al (son ranking snapshot)
    const snapshot = await this.prisma.rankingSnapshot.findFirst({
      where: { userId, examTypeId: dto.examTypeId },
      orderBy: { snapshotDate: 'desc' },
    });
    const userScore = snapshot ? Number(snapshot.score) : 0;

    const key = `matchmaking:${dto.examTypeId}`;
    const entry: MatchmakingEntry = {
      userId,
      examTypeId: dto.examTypeId,
      betPoints: dto.betPoints,
      score: userScore,
      socketTs: Date.now(),
    };

    // Mevcut kuyruğu tara — eşdeğer rütbe bul
    const existing = await this.redis.lrange(key, 0, -1);
    for (const raw of existing) {
      const candidate: MatchmakingEntry = JSON.parse(raw) as MatchmakingEntry;
      if (candidate.userId === userId) continue;
      if (Math.abs(candidate.score - userScore) <= MATCHMAKING_SCORE_RANGE) {
        // Eşleştir: kuyruktan çıkar
        await this.redis.lrem(key, 1, raw);
        await this.consumeRight(userId);
        return this.createMatchFromMatchmaking(entry, candidate);
      }
    }

    // Kuyruğa ekle (TTL: 60 sn)
    await this.redis.lpush(key, JSON.stringify(entry));
    await this.redis.expire(key, MATCHMAKING_TTL_SEC);

    return { queued: true, message: 'Eşleşme bekleniyor...' };
  }

  async cancelMatchmaking(userId: string, examTypeId: string) {
    const key = `matchmaking:${examTypeId}`;
    const existing = await this.redis.lrange(key, 0, -1);
    for (const raw of existing) {
      const entry: MatchmakingEntry = JSON.parse(raw) as MatchmakingEntry;
      if (entry.userId === userId) {
        await this.redis.lrem(key, 1, raw);
        return { cancelled: true };
      }
    }
    return { cancelled: false };
  }

  private async createMatchFromMatchmaking(
    a: MatchmakingEntry,
    b: MatchmakingEntry,
  ) {
    const questionIds = await this.pickQuestions(a.examTypeId);

    const match = await this.prisma.duelMatch.create({
      data: {
        challengerId: a.userId,
        opponentId: b.userId,
        examTypeId: a.examTypeId,
        betPoints: Math.min(a.betPoints, b.betPoints),
        status: DuelMatchStatus.ACTIVE,
        rounds: {
          create: questionIds.map((qId) => ({ questionId: qId })),
        },
      },
      include: {
        challenger: { select: { id: true, displayName: true, avatar: true } },
        opponent: { select: { id: true, displayName: true, avatar: true } },
        examType: { select: { name: true } },
        rounds: {
          include: { question: { select: { id: true, content: true } } },
        },
      },
    });

    // usageCount güncelle
    await this.prisma.question.updateMany({
      where: { id: { in: questionIds } },
      data: { usageCount: { increment: 1 } },
    });

    return { matched: true, duel: match };
  }

  // ─── Kabul / Red ──────────────────────────────────────────────────────────

  async acceptDuel(duelId: string, userId: string) {
    const duel = await this.prisma.duelMatch.findUnique({
      where: { id: duelId },
    });
    if (!duel) throw new NotFoundException('Düello bulunamadı');
    if (duel.opponentId !== userId)
      throw new ForbiddenException('Bu düelloya katılamazsınız');
    if (duel.status !== DuelMatchStatus.PENDING) {
      throw new BadRequestException('Düello beklemede değil');
    }

    const questionIds = await this.pickQuestions(duel.examTypeId);

    const updated = await this.prisma.duelMatch.update({
      where: { id: duelId },
      data: {
        status: DuelMatchStatus.ACTIVE,
        rounds: {
          create: questionIds.map((qId) => ({ questionId: qId })),
        },
      },
      include: {
        challenger: { select: { id: true, displayName: true, avatar: true } },
        opponent: { select: { id: true, displayName: true, avatar: true } },
        examType: { select: { name: true } },
        rounds: {
          include: { question: { select: { id: true, content: true } } },
        },
      },
    });

    await this.prisma.question.updateMany({
      where: { id: { in: questionIds } },
      data: { usageCount: { increment: 1 } },
    });

    return updated;
  }

  async declineDuel(duelId: string, userId: string) {
    const duel = await this.prisma.duelMatch.findUnique({
      where: { id: duelId },
    });
    if (!duel) throw new NotFoundException('Düello bulunamadı');
    if (duel.opponentId !== userId && duel.challengerId !== userId) {
      throw new ForbiddenException('Bu düelloya erişiminiz yok');
    }
    if (duel.status !== DuelMatchStatus.PENDING) {
      throw new BadRequestException('Düello beklemede değil');
    }

    return this.prisma.duelMatch.update({
      where: { id: duelId },
      data: { status: DuelMatchStatus.CANCELLED },
    });
  }

  // ─── Cevap Gönderme ───────────────────────────────────────────────────────

  async submitAnswer(
    duelId: string,
    userId: string,
    questionId: string,
    answer: string,
    timeSpent: number,
  ) {
    const duel = await this.prisma.duelMatch.findUnique({
      where: { id: duelId },
      include: { rounds: { include: { question: true } } },
    });

    if (!duel) throw new NotFoundException('Düello bulunamadı');
    if (duel.status !== DuelMatchStatus.ACTIVE) {
      throw new BadRequestException('Düello aktif değil');
    }

    const isChallenger = duel.challengerId === userId;
    const isOpponent = duel.opponentId === userId;
    if (!isChallenger && !isOpponent)
      throw new ForbiddenException('Bu düelloya erişiminiz yok');

    const round = duel.rounds.find((r) => r.questionId === questionId);
    if (!round) throw new NotFoundException('Bu soru bu düelloda yok');

    // Daha önce cevaplandı mı?
    const alreadyAnswered = isChallenger
      ? round.challengerAnswer !== null
      : round.opponentAnswer !== null;
    if (alreadyAnswered)
      throw new BadRequestException('Bu soruyu zaten cevapladınız');

    // Cevabı kaydet
    await this.prisma.duelRound.update({
      where: { duelMatchId_questionId: { duelMatchId: duelId, questionId } },
      data: isChallenger
        ? { challengerAnswer: answer, challengerTime: timeSpent }
        : { opponentAnswer: answer, opponentTime: timeSpent },
    });

    const opponentId = isChallenger ? duel.opponentId : duel.challengerId;

    // Tüm roundlar tamamlandı mı kontrol et
    const updatedRounds = await this.prisma.duelRound.findMany({
      where: { duelMatchId: duelId },
      include: { question: true },
    });

    const allAnswered = updatedRounds.every(
      (r) => r.challengerAnswer !== null && r.opponentAnswer !== null,
    );

    if (allAnswered) {
      const finalResult = await this.finalizeDuel(
        duelId,
        duel.challengerId,
        duel.opponentId,
        duel.betPoints,
        updatedRounds,
      );
      return { completed: true, opponentId, finalResult };
    }

    return { completed: false, opponentId };
  }

  // ─── Düello Sonuçlandırma ─────────────────────────────────────────────────

  private async finalizeDuel(
    duelId: string,
    challengerId: string,
    opponentId: string,
    betPoints: number,
    rounds: Array<{
      questionId: string;
      challengerAnswer: string | null;
      opponentAnswer: string | null;
      challengerTime: number;
      opponentTime: number;
      question: { correctAnswer: string };
    }>,
  ): Promise<DuelResult> {
    let challengerCorrect = 0;
    let opponentCorrect = 0;
    let challengerTotalTime = 0;
    let opponentTotalTime = 0;

    for (const r of rounds) {
      const correct = r.question.correctAnswer;
      if (r.challengerAnswer === correct) challengerCorrect++;
      if (r.opponentAnswer === correct) opponentCorrect++;
      challengerTotalTime += r.challengerTime;
      opponentTotalTime += r.opponentTime;
    }

    // Skor: doğru * 100 - hız bonusu (ms cinsinden toplam süre / 1000)
    const challengerScore =
      challengerCorrect * 100 - Math.floor(challengerTotalTime / 1000);
    const opponentScore =
      opponentCorrect * 100 - Math.floor(opponentTotalTime / 1000);

    let winnerId: string | null = null;
    if (challengerScore > opponentScore) {
      winnerId = challengerId;
    } else if (opponentScore > challengerScore) {
      winnerId = opponentId;
    }
    // Eşitlik: beraberlik

    // DuelMatch güncelle
    await this.prisma.duelMatch.update({
      where: { id: duelId },
      data: { status: DuelMatchStatus.COMPLETED, winnerId },
    });

    // Bahis puanı transferi (winner alır, loser kaybeder)
    if (winnerId && betPoints > 0) {
      const loserId = winnerId === challengerId ? opponentId : challengerId;
      await this.transferBetPoints(winnerId, loserId, betPoints, duelId);
    }

    return {
      duelId,
      challengerScore,
      opponentScore,
      winnerId,
      challengerCorrect,
      opponentCorrect,
      betPoints,
    };
  }

  private async transferBetPoints(
    winnerId: string,
    loserId: string,
    points: number,
    duelId: string,
  ) {
    // Cüzdan işlemi (Wallet tablosuna eriş)
    const [winnerWallet, loserWallet] = await Promise.all([
      this.prisma.wallet.findUnique({ where: { userId: winnerId } }),
      this.prisma.wallet.findUnique({ where: { userId: loserId } }),
    ]);

    if (!winnerWallet || !loserWallet) return;

    if (Number(loserWallet.balance) < points) return; // Yetersiz bakiye

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { userId: winnerId },
        data: {
          balance: { increment: points },
          totalEarned: { increment: points },
        },
      }),
      this.prisma.wallet.update({
        where: { userId: loserId },
        data: {
          balance: { decrement: points },
          totalSpent: { increment: points },
        },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: winnerWallet.id,
          type: 'DEPOSIT',
          amount: points,
          description: `Düello kazanımı`,
          referenceId: duelId,
        },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: loserWallet.id,
          type: 'WITHDRAW',
          amount: points,
          description: `Düello kaybı`,
          referenceId: duelId,
        },
      }),
    ]);
  }

  // ─── Sorgu Metodları ──────────────────────────────────────────────────────

  async getDuelById(duelId: string, userId: string) {
    const duel = await this.prisma.duelMatch.findUnique({
      where: { id: duelId },
      include: {
        challenger: { select: { id: true, displayName: true, avatar: true } },
        opponent: { select: { id: true, displayName: true, avatar: true } },
        winner: { select: { id: true, displayName: true } },
        examType: { select: { name: true } },
        rounds: {
          include: {
            question: {
              select: { id: true, content: true, correctAnswer: true },
            },
          },
        },
      },
    });

    if (!duel) throw new NotFoundException('Düello bulunamadı');
    if (duel.challengerId !== userId && duel.opponentId !== userId) {
      throw new ForbiddenException('Bu düelloya erişiminiz yok');
    }

    return duel;
  }

  async getHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.duelMatch.findMany({
        where: {
          OR: [{ challengerId: userId }, { opponentId: userId }],
          status: DuelMatchStatus.COMPLETED,
        },
        include: {
          challenger: { select: { id: true, displayName: true, avatar: true } },
          opponent: { select: { id: true, displayName: true, avatar: true } },
          winner: { select: { id: true, displayName: true } },
          examType: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.duelMatch.count({
        where: {
          OR: [{ challengerId: userId }, { opponentId: userId }],
          status: DuelMatchStatus.COMPLETED,
        },
      }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStats(userId: string) {
    const [total, won, rounds] = await Promise.all([
      this.prisma.duelMatch.count({
        where: {
          OR: [{ challengerId: userId }, { opponentId: userId }],
          status: DuelMatchStatus.COMPLETED,
        },
      }),
      this.prisma.duelMatch.count({
        where: { winnerId: userId, status: DuelMatchStatus.COMPLETED },
      }),
      this.prisma.duelRound.findMany({
        where: {
          duelMatch: {
            OR: [{ challengerId: userId }, { opponentId: userId }],
            status: DuelMatchStatus.COMPLETED,
          },
        },
        include: {
          question: { select: { correctAnswer: true } },
          duelMatch: { select: { challengerId: true } },
        },
      }),
    ]);

    let correctAnswers = 0;
    let totalAnswers = 0;
    for (const r of rounds) {
      const isChallenger = r.duelMatch.challengerId === userId;
      const answer = isChallenger ? r.challengerAnswer : r.opponentAnswer;
      if (answer !== null) {
        totalAnswers++;
        if (answer === r.question.correctAnswer) correctAnswers++;
      }
    }

    return {
      totalDuels: total,
      won,
      lost: total - won,
      winRate: total > 0 ? Math.round((won / total) * 100) : 0,
      correctAnswers,
      totalAnswers,
      accuracy:
        totalAnswers > 0
          ? Math.round((correctAnswers / totalAnswers) * 100)
          : 0,
    };
  }

  async getPendingDuels(userId: string) {
    return this.prisma.duelMatch.findMany({
      where: {
        OR: [
          { challengerId: userId, status: DuelMatchStatus.PENDING },
          { opponentId: userId, status: DuelMatchStatus.PENDING },
        ],
      },
      include: {
        challenger: { select: { id: true, displayName: true, avatar: true } },
        opponent: { select: { id: true, displayName: true, avatar: true } },
        examType: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
