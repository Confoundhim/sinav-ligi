import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ExamSessionType, QuarantineStatus } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { CreateCustomExamDto } from './dto/create-custom-exam.dto';
import { CreateShadowExamDto } from './dto/create-shadow-exam.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { QuarantineAttemptDto } from './dto/quarantine-attempt.dto';

/** KPSS net puanı: doğru - yanlış/4 */
function calcScore(correctCount: number, wrongCount: number): number {
  return correctCount - wrongCount / 4;
}

@Injectable()
export class ExamsService {
  private readonly QUARANTINE_RESCUE_THRESHOLD = 3;

  constructor(private readonly prisma: PrismaService) {}

  // ─── Soru seçimi (tekrarsız, kullanım dengeli) ───────────────────────────

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

  private async selectQuestions(
    questionTypeIds: string[],
    count: number,
    userId: string,
  ): Promise<string[]> {
    if (questionTypeIds.length === 0) {
      throw new BadRequestException('En az bir soru tipi seçilmelidir');
    }

    // Kullanıcının daha önce gördüğü sorular
    const seen = await this.prisma.examSessionQuestion.findMany({
      where: { examSession: { userId } },
      select: { questionId: true },
      distinct: ['questionId'],
    });
    const seenIds = seen.map((s) => s.questionId);

    // Görülmemiş sorular (usageCount'a göre sıralı)
    const unseen = await this.prisma.question.findMany({
      where: {
        questionTypeId: { in: questionTypeIds },
        isActive: true,
        id: { notIn: seenIds.length > 0 ? seenIds : ['__none__'] },
      },
      select: { id: true, usageCount: true },
      orderBy: { usageCount: 'asc' },
    });

    let pool: string[] = this.shuffle(unseen.map((q) => q.id));

    // Yetersizse daha önce görülmüşleri de ekle
    if (pool.length < count && seenIds.length > 0) {
      const seenPool = await this.prisma.question.findMany({
        where: {
          questionTypeId: { in: questionTypeIds },
          isActive: true,
          id: { in: seenIds },
        },
        select: { id: true, usageCount: true },
        orderBy: { usageCount: 'asc' },
      });
      pool = [...pool, ...this.shuffle(seenPool.map((q) => q.id))];
    }

    if (pool.length < count) {
      throw new BadRequestException(
        `Seçilen konu tiplerinde yeterli soru yok. Mevcut: ${pool.length}, İstenen: ${count}`,
      );
    }

    return pool.slice(0, count);
  }

  // ─── Özel Sınav ──────────────────────────────────────────────────────────

  async createCustomExam(dto: CreateCustomExamDto, userId: string) {
    // Sınav tipi kontrolü
    const examType = await this.prisma.examType.findUnique({
      where: { id: dto.examTypeId, isActive: true },
    });
    if (!examType) throw new NotFoundException('Sınav türü bulunamadı');

    // Soru tipi geçerlilik kontrolü
    const qTypes = await this.prisma.questionType.findMany({
      where: { id: { in: dto.questionTypeIds } },
      select: { id: true },
    });
    if (qTypes.length !== dto.questionTypeIds.length) {
      throw new BadRequestException('Geçersiz soru tipi ID içeriyor');
    }

    const questionIds = await this.selectQuestions(
      dto.questionTypeIds,
      dto.questionCount,
      userId,
    );

    const session = await this.prisma.$transaction(async (tx) => {
      const examSession = await tx.examSession.create({
        data: {
          userId,
          type: ExamSessionType.CUSTOM,
          examTypeId: dto.examTypeId,
          totalQuestions: questionIds.length,
        },
      });

      await tx.examSessionQuestion.createMany({
        data: questionIds.map((questionId, index) => ({
          examSessionId: examSession.id,
          questionId,
          order: index + 1,
        })),
      });

      // usageCount artır
      await tx.question.updateMany({
        where: { id: { in: questionIds } },
        data: { usageCount: { increment: 1 } },
      });

      return examSession;
    });

    return { examSessionId: session.id, totalQuestions: questionIds.length };
  }

  // ─── Gölge Rakip Sınavı ───────────────────────────────────────────────────

  async createShadowExam(dto: CreateShadowExamDto, userId: string) {
    const examType = await this.prisma.examType.findUnique({
      where: { id: dto.examTypeId, isActive: true },
      include: {
        subjects: {
          include: {
            questionTypes: {
              where: { questionCount: { gt: 0 } },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
    if (!examType) throw new NotFoundException('Sınav türü bulunamadı');

    // QuestionType.questionCount'a göre dağılım oluştur
    const distribution: { typeId: string; count: number }[] = [];
    for (const subject of examType.subjects) {
      for (const qt of subject.questionTypes) {
        distribution.push({ typeId: qt.id, count: qt.questionCount });
      }
    }

    if (distribution.length === 0) {
      throw new BadRequestException(
        'Bu sınav türü için soru dağılımı tanımlanmamış',
      );
    }

    // Her konu tipinden soru seç
    const allQuestionIds: string[] = [];
    for (const dist of distribution) {
      try {
        const ids = await this.selectQuestions(
          [dist.typeId],
          dist.count,
          userId,
        );
        allQuestionIds.push(...ids);
      } catch {
        // Yeterli soru yoksa atla, eksik kalsın (uyarı loglanabilir)
      }
    }

    if (allQuestionIds.length === 0) {
      throw new BadRequestException('Yeterli soru bulunamadı');
    }

    const shuffled = this.shuffle(allQuestionIds);

    const session = await this.prisma.$transaction(async (tx) => {
      const examSession = await tx.examSession.create({
        data: {
          userId,
          type: ExamSessionType.SHADOW,
          examTypeId: dto.examTypeId,
          totalQuestions: shuffled.length,
        },
      });

      await tx.examSessionQuestion.createMany({
        data: shuffled.map((questionId, index) => ({
          examSessionId: examSession.id,
          questionId,
          order: index + 1,
        })),
      });

      await tx.question.updateMany({
        where: { id: { in: shuffled } },
        data: { usageCount: { increment: 1 } },
      });

      return examSession;
    });

    return { examSessionId: session.id, totalQuestions: shuffled.length };
  }

  // ─── Sınav Soruları (cevaplar gizli) ─────────────────────────────────────

  async getExamQuestions(examId: string, userId: string) {
    const session = await this.prisma.examSession.findUnique({
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
                // correctAnswer ve explanation GIZLI
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!session) throw new NotFoundException('Sınav bulunamadı');
    if (session.userId !== userId)
      throw new ForbiddenException('Bu sınava erişim yetkiniz yok');
    if (session.finishedAt)
      throw new BadRequestException('Sınav zaten tamamlandı');

    return {
      examSessionId: session.id,
      type: session.type,
      startedAt: session.startedAt,
      totalQuestions: session.totalQuestions,
      questions: session.questions.map((q) => ({
        order: q.order,
        userAnswer: q.userAnswer,
        answeredAt: q.answeredAt,
        question: q.question,
      })),
    };
  }

  // ─── Soru Cevapla ─────────────────────────────────────────────────────────

  async answerQuestion(examId: string, dto: AnswerQuestionDto, userId: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: examId },
      include: {
        questions: { where: { order: dto.order } },
      },
    });

    if (!session) throw new NotFoundException('Sınav bulunamadı');
    if (session.userId !== userId)
      throw new ForbiddenException('Bu sınava erişim yetkiniz yok');
    if (session.finishedAt)
      throw new BadRequestException('Sınav tamamlanmış, cevap gönderilemez');

    const sq = session.questions[0];
    if (!sq) throw new NotFoundException(`${dto.order}. soru bulunamadı`);

    // Doğru cevabı kontrol et
    const question = await this.prisma.question.findUnique({
      where: { id: sq.questionId },
      select: { correctAnswer: true },
    });
    if (!question) throw new NotFoundException('Soru bulunamadı');

    const isCorrect = question.correctAnswer === dto.answer;

    await this.prisma.examSessionQuestion.update({
      where: {
        examSessionId_order: { examSessionId: examId, order: dto.order },
      },
      data: {
        userAnswer: dto.answer,
        isCorrect,
        answeredAt: new Date(),
        timeSpent: dto.timeSpent ?? 0,
      },
    });

    return { order: dto.order, isCorrect };
  }

  // ─── Sınavı Bitir ─────────────────────────────────────────────────────────

  async finishExam(examId: string, userId: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: examId },
      include: { questions: true },
    });

    if (!session) throw new NotFoundException('Sınav bulunamadı');
    if (session.userId !== userId)
      throw new ForbiddenException('Bu sınava erişim yetkiniz yok');
    if (session.finishedAt)
      throw new BadRequestException('Sınav zaten tamamlandı');

    const correctCount = session.questions.filter(
      (q) => q.isCorrect === true,
    ).length;
    const wrongCount = session.questions.filter(
      (q) => q.isCorrect === false && q.userAnswer !== null,
    ).length;
    const emptyCount = session.questions.filter(
      (q) => q.userAnswer === null,
    ).length;
    const score = calcScore(correctCount, wrongCount);

    const startMs = session.startedAt.getTime();
    const durationSeconds = Math.round((Date.now() - startMs) / 1000);

    await this.prisma.$transaction(async (tx) => {
      await tx.examSession.update({
        where: { id: examId },
        data: {
          finishedAt: new Date(),
          correctCount,
          wrongCount,
          emptyCount,
          score,
          duration: durationSeconds,
        },
      });

      // Yanlış cevaplanan soruları karantinaya al
      const wrongQuestions = session.questions.filter(
        (q) => q.isCorrect === false && q.userAnswer !== null,
      );

      for (const wq of wrongQuestions) {
        // Aynı soru zaten karantinada mı?
        const existing = await tx.quarantineItem.findFirst({
          where: {
            userId,
            questionId: wq.questionId,
            status: QuarantineStatus.ACTIVE,
          },
        });
        if (!existing) {
          await tx.quarantineItem.create({
            data: {
              userId,
              questionId: wq.questionId,
              examSessionId: examId,
            },
          });
        }
      }
    });

    return {
      examSessionId: examId,
      correctCount,
      wrongCount,
      emptyCount,
      score,
      duration: durationSeconds,
      quarantinedCount: session.questions.filter(
        (q) => q.isCorrect === false && q.userAnswer !== null,
      ).length,
    };
  }

  // ─── Sınav Sonuçları ──────────────────────────────────────────────────────

  async getExamResults(examId: string, userId: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            question: {
              select: {
                id: true,
                content: true,
                correctAnswer: true,
                explanation: true,
                difficulty: true,
                questionType: { select: { name: true } },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        examType: { select: { name: true } },
      },
    });

    if (!session) throw new NotFoundException('Sınav bulunamadı');
    if (session.userId !== userId)
      throw new ForbiddenException('Bu sonuçlara erişim yetkiniz yok');
    if (!session.finishedAt)
      throw new BadRequestException('Sınav henüz tamamlanmadı');

    return session;
  }

  // ─── Gölge Rakip Geçmişi ─────────────────────────────────────────────────

  async getShadowHistory(userId: string) {
    return this.prisma.examSession.findMany({
      where: {
        userId,
        type: ExamSessionType.SHADOW,
        finishedAt: { not: null },
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        startedAt: true,
        finishedAt: true,
        totalQuestions: true,
        correctCount: true,
        wrongCount: true,
        emptyCount: true,
        score: true,
        duration: true,
        examType: { select: { name: true } },
      },
    });
  }

  async getShadowComparison(userId: string) {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const sessions = await this.prisma.examSession.findMany({
      where: {
        userId,
        type: ExamSessionType.SHADOW,
        finishedAt: { not: null },
        startedAt: { gte: twoWeeksAgo },
      },
      orderBy: { startedAt: 'asc' },
      select: {
        id: true,
        startedAt: true,
        score: true,
        correctCount: true,
        wrongCount: true,
        emptyCount: true,
      },
    });

    if (sessions.length < 2) {
      return {
        message: 'Karşılaştırma için en az 2 gölge rakip sınavı gereklidir',
        sessions,
      };
    }

    const [prev, curr] = [
      sessions[sessions.length - 2]!,
      sessions[sessions.length - 1]!,
    ];
    const scoreDiff = Number(curr.score) - Number(prev.score);

    return {
      previous: prev,
      current: curr,
      improvement: {
        scoreDiff,
        correctDiff: curr.correctCount - prev.correctCount,
        trend: scoreDiff > 0 ? 'up' : scoreDiff < 0 ? 'down' : 'stable',
      },
    };
  }

  // ─── Karantina ────────────────────────────────────────────────────────────

  async getQuarantine(userId: string) {
    return this.prisma.quarantineItem.findMany({
      where: { userId, status: QuarantineStatus.ACTIVE },
      include: {
        question: {
          select: {
            id: true,
            content: true,
            difficulty: true,
            questionType: { select: { name: true, subjectId: true } },
          },
        },
        attempts: {
          select: { isCorrect: true, attemptedAt: true },
          orderBy: { attemptedAt: 'desc' },
        },
      },
      orderBy: { quarantinedAt: 'desc' },
    });
  }

  async getNextQuarantineQuestion(quarantineId: string, userId: string) {
    const item = await this.prisma.quarantineItem.findUnique({
      where: { id: quarantineId },
      include: {
        question: { select: { questionTypeId: true } },
        attempts: { select: { attemptQuestionId: true, isCorrect: true } },
      },
    });

    if (!item) throw new NotFoundException('Karantina öğesi bulunamadı');
    if (item.userId !== userId)
      throw new ForbiddenException('Erişim yetkiniz yok');
    if (item.status !== QuarantineStatus.ACTIVE)
      throw new BadRequestException('Bu karantina öğesi artık aktif değil');

    const attemptedIds = item.attempts.map((a) => a.attemptQuestionId);
    const excludeIds = [item.questionId, ...attemptedIds];

    // Aynı konu tipinden henüz denenmemiş soru
    const nextQuestion = await this.prisma.question.findFirst({
      where: {
        questionTypeId: item.question.questionTypeId,
        isActive: true,
        id: { notIn: excludeIds },
      },
      select: {
        id: true,
        content: true,
        difficulty: true,
        questionType: { select: { name: true } },
      },
      orderBy: { usageCount: 'asc' },
    });

    if (!nextQuestion) {
      throw new BadRequestException(
        'Bu konu tipinde yeterli deneme sorusu kalmadı. Karantina ilerleyen sınavlarda tekrar değerlendirilecek',
      );
    }

    const correctAttempts = item.attempts.filter((a) => a.isCorrect).length;

    return {
      quarantineId,
      question: nextQuestion,
      progress: {
        correct: correctAttempts,
        required: this.QUARANTINE_RESCUE_THRESHOLD,
      },
    };
  }

  async submitQuarantineAttempt(
    quarantineId: string,
    dto: QuarantineAttemptDto,
    userId: string,
  ) {
    const item = await this.prisma.quarantineItem.findUnique({
      where: { id: quarantineId },
      include: {
        attempts: { select: { attemptQuestionId: true, isCorrect: true } },
      },
    });

    if (!item) throw new NotFoundException('Karantina öğesi bulunamadı');
    if (item.userId !== userId)
      throw new ForbiddenException('Erişim yetkiniz yok');
    if (item.status !== QuarantineStatus.ACTIVE)
      throw new BadRequestException('Bu karantina öğesi aktif değil');

    // Aynı soru daha önce denendi mi?
    const alreadyAttempted = item.attempts.some(
      (a) => a.attemptQuestionId === dto.questionId,
    );
    if (alreadyAttempted)
      throw new ConflictException('Bu soru zaten bu karantina için denendi');

    // Doğru cevabı kontrol et
    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
      select: { correctAnswer: true },
    });
    if (!question) throw new NotFoundException('Soru bulunamadı');

    const isCorrect = question.correctAnswer === dto.answer;

    const correctCountAfter =
      item.attempts.filter((a) => a.isCorrect).length + (isCorrect ? 1 : 0);
    const isRescued = correctCountAfter >= this.QUARANTINE_RESCUE_THRESHOLD;

    await this.prisma.$transaction(async (tx) => {
      await tx.quarantineAttempt.create({
        data: {
          quarantineItemId: quarantineId,
          attemptQuestionId: dto.questionId,
          isCorrect,
        },
      });

      if (isRescued) {
        await tx.quarantineItem.update({
          where: { id: quarantineId },
          data: { status: QuarantineStatus.RESCUED, rescuedAt: new Date() },
        });
      }
    });

    return {
      isCorrect,
      rescued: isRescued,
      progress: {
        correct: correctCountAfter,
        required: this.QUARANTINE_RESCUE_THRESHOLD,
      },
    };
  }

  /**
   * Haftalık karantina penaltısı uygula.
   * Admin tarafından tetiklenir (veya ileride cron job ile).
   * 7 gün ve üzeri aktif kalan karantina öğelerini EXPIRED yapar.
   */
  async applyWeeklyPenalty(): Promise<{ expiredCount: number }> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const result = await this.prisma.quarantineItem.updateMany({
      where: {
        status: QuarantineStatus.ACTIVE,
        quarantinedAt: { lte: cutoff },
      },
      data: { status: QuarantineStatus.EXPIRED },
    });

    return { expiredCount: result.count };
  }
}
