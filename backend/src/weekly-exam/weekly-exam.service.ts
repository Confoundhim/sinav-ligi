import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WeeklyExamStatus, WalletTransactionType } from '@prisma/client';
import type Redis from 'ioredis';
import { PrismaService } from '../common/database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { REDIS_CLIENT } from '../common/redis/redis.constants';
import { CreateWeeklyExamDto } from './dto/create-weekly-exam.dto';
import { UpdateWeeklyExamDto } from './dto/update-weekly-exam.dto';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { WeeklyExamAnswerDto } from './dto/weekly-exam-answer.dto';
import { CheatReportDto, CheatReportType } from './dto/cheat-report.dto';

// ─── Sabitler ────────────────────────────────────────────────────────────────

const EXAM_DURATION_MS = 2 * 60 * 60 * 1000; // 2 saat
const DEFAULT_ENTRY_FEE = 100;
const DEFAULT_MIN_PARTICIPANTS = 1000;
const SCHOLARSHIP_AMOUNT = 5000;
const SCHOLARSHIP_TOP_N = 10;
const MAX_WARNINGS = 3;
const MIN_ANSWER_TIME_MS = 3000; // 3 saniye
const REDIS_TTL_SECONDS = 3 * 24 * 60 * 60; // 3 gün

// ─── Yardımcı ─────────────────────────────────────────────────────────────────

function calcKpssNet(correct: number, wrong: number): number {
  return correct - wrong / 4;
}

// ─── Servis ───────────────────────────────────────────────────────────────────

@Injectable()
export class WeeklyExamService {
  private readonly logger = new Logger(WeeklyExamService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // Admin Metodları
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Yeni haftalık sınav oluşturur (DRAFT).
   */
  async createWeeklyExam(dto: CreateWeeklyExamDto, adminId: string) {
    const examType = await this.prisma.examType.findUnique({
      where: { id: dto.examTypeId, isActive: true },
    });
    if (!examType) throw new NotFoundException('Sınav türü bulunamadı');

    return this.prisma.weeklyExam.create({
      data: {
        examTypeId: dto.examTypeId,
        scheduledAt: new Date(dto.scheduledAt),
        minParticipants: dto.minParticipants ?? DEFAULT_MIN_PARTICIPANTS,
        entryFee: dto.entryFee ?? DEFAULT_ENTRY_FEE,
        createdBy: adminId,
        status: WeeklyExamStatus.DRAFT,
      },
      include: { examType: { select: { name: true } } },
    });
  }

  /**
   * Sınav temel bilgilerini günceller (yalnızca DRAFT).
   */
  async updateWeeklyExam(id: string, dto: UpdateWeeklyExamDto) {
    const exam = await this.getExamOrThrow(id);
    if (exam.status !== WeeklyExamStatus.DRAFT) {
      throw new BadRequestException(
        'Sadece taslak durumdaki sınavlar güncellenebilir',
      );
    }

    return this.prisma.weeklyExam.update({
      where: { id },
      data: {
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        minParticipants: dto.minParticipants,
        entryFee: dto.entryFee,
      },
    });
  }

  /**
   * Sınava soru ekler/değiştirir.
   * İki mod: manual (questionIds) veya havuzdan otomatik (questionTypeIds + count).
   */
  async addQuestions(id: string, dto: AddQuestionsDto) {
    const exam = await this.getExamOrThrow(id);
    if (exam.status !== WeeklyExamStatus.DRAFT) {
      throw new BadRequestException('Sadece taslak sınava soru eklenebilir');
    }

    let selectedIds: string[];

    if (dto.questionIds && dto.questionIds.length > 0) {
      // Manuel mod
      const found = await this.prisma.question.findMany({
        where: { id: { in: dto.questionIds }, isActive: true },
        select: { id: true },
      });
      if (found.length !== dto.questionIds.length) {
        throw new BadRequestException(
          'Bir veya daha fazla soru ID geçersiz ya da aktif değil',
        );
      }
      selectedIds = dto.questionIds;
    } else if (dto.questionTypeIds && dto.count) {
      // Havuzdan otomatik seçim
      selectedIds = await this.selectFromPool(dto.questionTypeIds, dto.count);
    } else {
      throw new BadRequestException(
        'questionIds veya (questionTypeIds + count) sağlanmalıdır',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.weeklyExamQuestion.deleteMany({ where: { weeklyExamId: id } });
      await tx.weeklyExamQuestion.createMany({
        data: selectedIds.map((questionId, index) => ({
          weeklyExamId: id,
          questionId,
          order: index + 1,
        })),
      });
    });

    return { weeklyExamId: id, questionCount: selectedIds.length };
  }

  /**
   * Sınavı yayınlar: DRAFT → PUBLISHED.
   */
  async publishWeeklyExam(id: string) {
    const exam = await this.prisma.weeklyExam.findUnique({
      where: { id },
      include: { _count: { select: { questions: true } } },
    });
    if (!exam) throw new NotFoundException('Sınav bulunamadı');
    if (exam.status !== WeeklyExamStatus.DRAFT) {
      throw new BadRequestException('Sadece taslak sınavlar yayınlanabilir');
    }
    if (exam._count.questions === 0) {
      throw new BadRequestException(
        'Sınav yayınlanabilmesi için en az bir soru gereklidir',
      );
    }

    return this.prisma.weeklyExam.update({
      where: { id },
      data: { status: WeeklyExamStatus.PUBLISHED },
    });
  }

  /**
   * Tüm haftalık sınavları listeler (admin).
   */
  async listWeeklyExams() {
    return this.prisma.weeklyExam.findMany({
      orderBy: { scheduledAt: 'desc' },
      include: {
        examType: { select: { name: true } },
        _count: { select: { participants: true, questions: true } },
      },
    });
  }

  /**
   * Sonuçları açıklar, burs dağıtır.
   * Min katılımcı < eşik → sınav iptal, ücretler iade.
   */
  async announceResults(id: string) {
    const exam = await this.prisma.weeklyExam.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!exam) throw new NotFoundException('Sınav bulunamadı');
    if (exam.status === WeeklyExamStatus.COMPLETED) {
      throw new BadRequestException('Sonuçlar zaten açıklandı');
    }
    if (exam.status === WeeklyExamStatus.DRAFT) {
      throw new BadRequestException('Sınav henüz yayınlanmadı');
    }

    const participants = exam.participants;
    const participantCount = participants.length;
    const minRequired = Number(exam.minParticipants);

    // ── Katılımcı yetersiz → iptal & iade ────────────────────────────────
    if (participantCount < minRequired) {
      this.logger.warn(
        `Haftalık sınav iptal edildi: ${id} | Katılımcı: ${participantCount}/${minRequired}`,
      );

      // Önce durumu güncelle
      await this.prisma.weeklyExam.update({
        where: { id },
        data: {
          status: WeeklyExamStatus.COMPLETED,
          resultAnnouncedAt: new Date(),
        },
      });

      // Ardından iade yap (her başarısız iade loglanır)
      let refundCount = 0;
      for (const p of participants) {
        try {
          await this.walletService.addToWallet(
            p.userId,
            Number(exam.entryFee),
            WalletTransactionType.REFUND,
            `Haftalık Sınav iptali – ücret iadesi`,
            id,
          );
          refundCount++;
        } catch (err) {
          this.logger.error(
            `İade başarısız: userId=${p.userId}, examId=${id}`,
            err,
          );
        }
      }

      return {
        cancelled: true,
        reason: `Minimum katılımcı sayısına ulaşılamadı (${participantCount}/${minRequired})`,
        refunded: refundCount,
      };
    }

    // ── Normal tamamlama ──────────────────────────────────────────────────
    const finished = participants
      .filter((p) => p.finishedAt !== null)
      .sort((a, b) => Number(b.score) - Number(a.score));

    // Rank ata ve durumu güncelle (tek transaction)
    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < finished.length; i++) {
        await tx.weeklyExamParticipant.update({
          where: {
            weeklyExamId_userId: {
              weeklyExamId: id,
              userId: finished[i]!.userId,
            },
          },
          data: { rank: i + 1 },
        });
      }
      await tx.weeklyExam.update({
        where: { id },
        data: {
          status: WeeklyExamStatus.COMPLETED,
          resultAnnouncedAt: new Date(),
        },
      });
    });

    // Burs dağıt (transaction dışı – her biri kendi wallet transaction'ı)
    const winners = finished.slice(0, SCHOLARSHIP_TOP_N);
    let scholarshipsAwarded = 0;
    for (const winner of winners) {
      try {
        await this.walletService.addToWallet(
          winner.userId,
          SCHOLARSHIP_AMOUNT,
          WalletTransactionType.SCHOLARSHIP,
          `Haftalık Sınav burs ödülü – İlk ${SCHOLARSHIP_TOP_N}`,
          id,
        );
        scholarshipsAwarded++;
        this.logger.log(
          `Burs verildi: userId=${winner.userId}, rank=${winners.indexOf(winner) + 1}`,
        );
      } catch (err) {
        this.logger.error(
          `Burs dağıtımı başarısız: userId=${winner.userId}`,
          err,
        );
      }
    }

    return {
      cancelled: false,
      participantCount,
      finishedCount: finished.length,
      scholarshipAmount: SCHOLARSHIP_AMOUNT,
      scholarshipsAwarded,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Öğrenci Metodları
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Yaklaşan (PUBLISHED) sınavları listeler.
   */
  async getUpcoming() {
    const now = new Date();
    return this.prisma.weeklyExam.findMany({
      where: {
        scheduledAt: { gte: now },
        status: WeeklyExamStatus.PUBLISHED,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      include: {
        examType: { select: { name: true } },
        _count: { select: { participants: true, questions: true } },
      },
    });
  }

  /**
   * Öğrencinin sınava kayıt olması (100 TL cüzdandan düşer).
   */
  async register(examId: string, userId: string) {
    const exam = await this.prisma.weeklyExam.findUnique({
      where: { id: examId },
    });
    if (!exam) throw new NotFoundException('Sınav bulunamadı');
    if (exam.status !== WeeklyExamStatus.PUBLISHED) {
      throw new BadRequestException('Sınav kayıt için uygun değil');
    }
    if (exam.scheduledAt <= new Date()) {
      throw new BadRequestException('Sınav başladı, kayıt yapılamaz');
    }

    const existing = await this.prisma.weeklyExamParticipant.findUnique({
      where: { weeklyExamId_userId: { weeklyExamId: examId, userId } },
    });
    if (existing) throw new ConflictException('Bu sınava zaten kayıtlısınız');

    // Önce ücret düş, ardından kayıt oluştur
    await this.walletService.spendFromWallet(
      userId,
      Number(exam.entryFee),
      WalletTransactionType.EXAM_FEE,
      `Haftalık Sınav katılım ücreti`,
      examId,
    );

    await this.prisma.weeklyExamParticipant.create({
      data: { weeklyExamId: examId, userId },
    });

    this.logger.log(
      `Kayıt: userId=${userId}, examId=${examId}, fee=${String(exam.entryFee)}`,
    );
    return {
      message: 'Sınava başarıyla kayıt oldunuz',
      examId,
      scheduledAt: exam.scheduledAt,
      fee: Number(exam.entryFee),
    };
  }

  /**
   * Sınavı başlatır ve soruları döner (yalnızca sınav penceresinde).
   */
  async enter(examId: string, userId: string) {
    const exam = await this.prisma.weeklyExam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            question: {
              select: {
                id: true,
                content: true,
                difficulty: true,
                questionType: { select: { name: true } },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!exam) throw new NotFoundException('Sınav bulunamadı');

    if (
      exam.status !== WeeklyExamStatus.PUBLISHED &&
      exam.status !== WeeklyExamStatus.ACTIVE
    ) {
      throw new BadRequestException('Sınav aktif değil');
    }

    const now = new Date();
    const examEnd = new Date(exam.scheduledAt.getTime() + EXAM_DURATION_MS);

    if (now < exam.scheduledAt) {
      throw new BadRequestException('Sınav henüz başlamadı');
    }
    if (now > examEnd) {
      throw new BadRequestException('Sınav süresi doldu');
    }

    const participant = await this.prisma.weeklyExamParticipant.findUnique({
      where: { weeklyExamId_userId: { weeklyExamId: examId, userId } },
    });
    if (!participant)
      throw new ForbiddenException('Bu sınava kayıtlı değilsiniz');
    if (participant.finishedAt)
      throw new BadRequestException('Sınavı zaten tamamladınız');

    // Elendi mi?
    const eliminated = await this.redis.hget(
      `weekly:cheat:${examId}:${userId}`,
      'eliminated',
    );
    if (eliminated === 'true') {
      throw new ForbiddenException('Kopya nedeniyle sınavdan elendiniz');
    }

    // Başlangıç zamanını kaydet (ilk girişte)
    if (!participant.startedAt) {
      await this.prisma.weeklyExamParticipant.update({
        where: { weeklyExamId_userId: { weeklyExamId: examId, userId } },
        data: { startedAt: now },
      });
    }

    // Redis'e giriş zamanını yaz (zamanlama tespiti için)
    const enterKey = `weekly:enter:${examId}:${userId}`;
    const alreadySet = await this.redis.exists(enterKey);
    if (!alreadySet) {
      await this.redis.setex(
        enterKey,
        REDIS_TTL_SECONDS,
        now.getTime().toString(),
      );
    }

    return {
      examId,
      scheduledAt: exam.scheduledAt,
      examEnd,
      remainingMs: examEnd.getTime() - now.getTime(),
      totalQuestions: exam.questions.length,
      questions: exam.questions.map((q) => ({
        order: q.order,
        question: q.question,
      })),
      startedAt: participant.startedAt ?? now,
    };
  }

  /**
   * Soru cevabını kaydeder (Redis). Şüpheli zamanlama otomatik algılanır.
   */
  async submitAnswer(examId: string, dto: WeeklyExamAnswerDto, userId: string) {
    const exam = await this.prisma.weeklyExam.findUnique({
      where: { id: examId },
    });
    if (!exam) throw new NotFoundException('Sınav bulunamadı');

    const now = new Date();
    const examEnd = new Date(exam.scheduledAt.getTime() + EXAM_DURATION_MS);
    if (now > examEnd) throw new BadRequestException('Sınav süresi doldu');

    const participant = await this.prisma.weeklyExamParticipant.findUnique({
      where: { weeklyExamId_userId: { weeklyExamId: examId, userId } },
    });
    if (!participant)
      throw new ForbiddenException('Bu sınava kayıtlı değilsiniz');
    if (participant.finishedAt)
      throw new BadRequestException('Sınav zaten tamamlandı');

    // Elendi mi?
    const cheatKey = `weekly:cheat:${examId}:${userId}`;
    const eliminated = await this.redis.hget(cheatKey, 'eliminated');
    if (eliminated === 'true') {
      throw new ForbiddenException('Kopya nedeniyle sınavdan elendiniz');
    }

    // Soru sayısı doğrulama
    const totalQuestions = await this.prisma.weeklyExamQuestion.count({
      where: { weeklyExamId: examId },
    });
    if (dto.order < 1 || dto.order > totalQuestions) {
      throw new BadRequestException('Geçersiz soru numarası');
    }

    // Şüpheli zamanlama tespiti
    const lastAnswerKey = `weekly:lastanswer:${examId}:${userId}`;
    const lastAnswerTime = await this.redis.get(lastAnswerKey);
    if (lastAnswerTime) {
      const elapsed = now.getTime() - parseInt(lastAnswerTime, 10);
      if (elapsed < MIN_ANSWER_TIME_MS) {
        await this.incrementCheatWarning(
          examId,
          userId,
          'suspiciousTiming',
          cheatKey,
        );
        this.logger.warn(
          `Şüpheli zamanlama: userId=${userId}, examId=${examId}, elapsed=${elapsed}ms`,
        );
      }
    }
    await this.redis.setex(
      lastAnswerKey,
      REDIS_TTL_SECONDS,
      now.getTime().toString(),
    );

    // Soru ID'sini al
    const wq = await this.prisma.weeklyExamQuestion.findUnique({
      where: { weeklyExamId_order: { weeklyExamId: examId, order: dto.order } },
      select: { questionId: true },
    });
    if (!wq) throw new NotFoundException('Soru bulunamadı');

    // Cevabı Redis'e kaydet
    const answersKey = `weekly:answers:${examId}:${userId}`;
    await this.redis.hset(
      answersKey,
      `q${dto.order}`,
      JSON.stringify({
        answer: dto.answer,
        answeredAt: now.getTime(),
        questionId: wq.questionId,
      }),
    );
    await this.redis.expire(answersKey, REDIS_TTL_SECONDS);

    return { order: dto.order, answer: dto.answer, savedAt: now };
  }

  /**
   * Sınavı bitirir, puanı hesaplar ve WeeklyExamParticipant'a yazar.
   */
  async finishExam(examId: string, userId: string) {
    const exam = await this.prisma.weeklyExam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          select: { order: true, questionId: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!exam) throw new NotFoundException('Sınav bulunamadı');

    const participant = await this.prisma.weeklyExamParticipant.findUnique({
      where: { weeklyExamId_userId: { weeklyExamId: examId, userId } },
    });
    if (!participant)
      throw new ForbiddenException('Bu sınava kayıtlı değilsiniz');
    if (participant.finishedAt)
      throw new BadRequestException('Sınav zaten tamamlandı');

    // Redis'ten cevapları oku
    const answersKey = `weekly:answers:${examId}:${userId}`;
    const rawAnswers = await this.redis.hgetall(answersKey);
    const parsedAnswers: Record<
      number,
      { answer: string; questionId: string }
    > = {};
    for (const [key, value] of Object.entries(rawAnswers ?? {})) {
      const order = parseInt(key.replace('q', ''), 10);
      parsedAnswers[order] = JSON.parse(value) as {
        answer: string;
        questionId: string;
      };
    }

    // DB'den doğru cevapları toplu çek
    const questionIds = exam.questions.map((q) => q.questionId);
    const correctAnswers = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, correctAnswer: true },
    });
    const correctMap = new Map(
      correctAnswers.map((q) => [q.id, q.correctAnswer]),
    );

    let correct = 0;
    let wrong = 0;
    let empty = 0;

    for (const wq of exam.questions) {
      const userEntry = parsedAnswers[wq.order];
      if (!userEntry?.answer) {
        empty++;
      } else {
        const rightAnswer = correctMap.get(wq.questionId);
        if (userEntry.answer === rightAnswer) correct++;
        else wrong++;
      }
    }

    const score = calcKpssNet(correct, wrong);
    const now = new Date();

    await this.prisma.weeklyExamParticipant.update({
      where: { weeklyExamId_userId: { weeklyExamId: examId, userId } },
      data: { finishedAt: now, score },
    });

    this.logger.log(
      `Sınav bitti: userId=${userId}, examId=${examId}, correct=${correct}, wrong=${wrong}, score=${score}`,
    );

    return {
      examId,
      correct,
      wrong,
      empty,
      score,
      totalQuestions: exam.questions.length,
      finishedAt: now,
    };
  }

  /**
   * Sınav sonuçlarını döner (yalnızca resultAnnouncedAt geçtikten sonra).
   */
  async getResults(examId: string, userId: string) {
    const exam = await this.prisma.weeklyExam.findUnique({
      where: { id: examId },
      include: { examType: { select: { name: true } } },
    });
    if (!exam) throw new NotFoundException('Sınav bulunamadı');

    if (!exam.resultAnnouncedAt || new Date() < exam.resultAnnouncedAt) {
      throw new BadRequestException('Sonuçlar henüz açıklanmadı');
    }

    const participant = await this.prisma.weeklyExamParticipant.findUnique({
      where: { weeklyExamId_userId: { weeklyExamId: examId, userId } },
    });
    if (!participant) throw new NotFoundException('Bu sınava katılmadınız');

    // Genel istatistik
    const totalParticipants = await this.prisma.weeklyExamParticipant.count({
      where: { weeklyExamId: examId },
    });

    return {
      examId,
      examType: exam.examType.name,
      scheduledAt: exam.scheduledAt,
      resultAnnouncedAt: exam.resultAnnouncedAt,
      score: participant.score,
      rank: participant.rank,
      totalParticipants,
      finishedAt: participant.finishedAt,
      scholarshipEarned:
        participant.rank !== null && participant.rank <= SCHOLARSHIP_TOP_N
          ? SCHOLARSHIP_AMOUNT
          : 0,
    };
  }

  /**
   * Öğrencinin katıldığı sınavlar geçmişi.
   */
  async getHistory(userId: string) {
    return this.prisma.weeklyExamParticipant.findMany({
      where: { userId },
      include: {
        weeklyExam: {
          select: {
            id: true,
            scheduledAt: true,
            resultAnnouncedAt: true,
            status: true,
            examType: { select: { name: true } },
            _count: { select: { participants: true } },
          },
        },
      },
      orderBy: { weeklyExam: { scheduledAt: 'desc' } },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Anti-Cheat
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Frontend'den gelen kopya sinyalini işler.
   * 3. uyarıda kullanıcı elenişir.
   */
  async reportCheat(examId: string, dto: CheatReportDto, userId: string) {
    const participant = await this.prisma.weeklyExamParticipant.findUnique({
      where: { weeklyExamId_userId: { weeklyExamId: examId, userId } },
    });
    if (!participant)
      throw new ForbiddenException('Bu sınava kayıtlı değilsiniz');
    if (participant.finishedAt) {
      return {
        eliminated: false,
        warnings: 0,
        message: 'Sınav zaten tamamlandı',
      };
    }

    const cheatKey = `weekly:cheat:${examId}:${userId}`;

    // Zaten elindi mi?
    const alreadyEliminated = await this.redis.hget(cheatKey, 'eliminated');
    if (alreadyEliminated === 'true') {
      const total = parseInt(
        (await this.redis.hget(cheatKey, 'total')) ?? String(MAX_WARNINGS),
        10,
      );
      return {
        eliminated: true,
        warnings: total,
        message: 'Kopya nedeniyle sınavdan elendiniz',
      };
    }

    const field = this.mapCheatTypeToField(dto.type);
    await this.incrementCheatWarning(examId, userId, field, cheatKey);

    const total = parseInt(
      (await this.redis.hget(cheatKey, 'total')) ?? '0',
      10,
    );
    const eliminated = total >= MAX_WARNINGS;

    this.logger.warn(
      `Kopya raporu: userId=${userId}, examId=${examId}, type=${dto.type}, total=${total}, eliminated=${eliminated}`,
    );

    return {
      eliminated,
      warnings: total,
      maxWarnings: MAX_WARNINGS,
      message: eliminated
        ? 'Kopya tespit edildi. Sınavdan elendiniz.'
        : `Uyarı ${total}/${MAX_WARNINGS}. ${MAX_WARNINGS - total} hak kaldı.`,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Özel Yardımcı Metodlar
  // ═══════════════════════════════════════════════════════════════════════════

  private async getExamOrThrow(id: string) {
    const exam = await this.prisma.weeklyExam.findUnique({ where: { id } });
    if (!exam) throw new NotFoundException('Sınav bulunamadı');
    return exam;
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i] as T;
      a[i] = a[j] as T;
      a[j] = tmp;
    }
    return a;
  }

  private async selectFromPool(
    questionTypeIds: string[],
    count: number,
  ): Promise<string[]> {
    const questions = await this.prisma.question.findMany({
      where: { questionTypeId: { in: questionTypeIds }, isActive: true },
      select: { id: true },
      orderBy: { usageCount: 'asc' },
    });
    if (questions.length < count) {
      throw new BadRequestException(
        `Yeterli soru bulunamadı. Mevcut: ${questions.length}, İstenen: ${count}`,
      );
    }
    return this.shuffle(questions.map((q) => q.id)).slice(0, count);
  }

  private mapCheatTypeToField(type: CheatReportType): string {
    const map: Record<CheatReportType, string> = {
      [CheatReportType.TAB_SWITCH]: 'tabSwitch',
      [CheatReportType.FULLSCREEN_EXIT]: 'fullscreenExit',
      [CheatReportType.COPY_PASTE]: 'copyPaste',
      [CheatReportType.SUSPICIOUS_TIMING]: 'suspiciousTiming',
    };
    return map[type];
  }

  private async incrementCheatWarning(
    examId: string,
    userId: string,
    field: string,
    cheatKey: string,
  ): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.hincrby(cheatKey, field, 1);
    pipeline.hincrby(cheatKey, 'total', 1);
    pipeline.expire(cheatKey, REDIS_TTL_SECONDS);
    await pipeline.exec();

    const total = parseInt(
      (await this.redis.hget(cheatKey, 'total')) ?? '0',
      10,
    );
    if (total >= MAX_WARNINGS) {
      await this.redis.hset(cheatKey, 'eliminated', 'true');
      this.logger.warn(
        `Kullanıcı elenişti: userId=${userId}, examId=${examId}, total=${total}`,
      );
    }
  }
}
