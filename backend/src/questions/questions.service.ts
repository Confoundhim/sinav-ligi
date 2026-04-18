import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CreateQuestionDto, QuestionContentDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionFilterDto } from './dto/question-filter.dto';

@Injectable()
export class QuestionsService {
  private readonly SIMILARITY_THRESHOLD = 0.85;

  constructor(private readonly prisma: PrismaService) {}

  // ─── Levenshtein Similarity ───────────────────────────────────────────────

  private extractText(content: QuestionContentDto | Record<string, unknown>): string {
    const c = content as Record<string, unknown>;
    const text = typeof c?.text === 'string' ? c.text : '';
    const choices = c?.choices as Record<string, unknown> | undefined;
    const choiceText = choices
      ? Object.values(choices)
          .filter((v) => typeof v === 'string')
          .join(' ')
      : '';
    return `${text} ${choiceText}`.toLowerCase().trim();
  }

  private levenshteinDistance(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const prev: number[] = Array.from({ length: a.length + 1 }, (_, i) => i);

    for (let j = 1; j <= b.length; j++) {
      const curr: number[] = [j];
      for (let i = 1; i <= a.length; i++) {
        curr[i] =
          b[j - 1] === a[i - 1]
            ? (prev[i - 1] as number)
            : Math.min((prev[i - 1] as number) + 1, (curr[i - 1] as number) + 1, (prev[i] as number) + 1);
      }
      prev.splice(0, prev.length, ...curr);
    }
    return prev[a.length] as number;
  }

  private similarity(a: string, b: string): number {
    if (!a && !b) return 1;
    if (!a || !b) return 0;
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - this.levenshteinDistance(a, b) / maxLen;
  }

  async checkSimilarity(
    text: string,
    questionTypeId: string,
    excludeId?: string,
  ): Promise<void> {
    if (!text) return;

    const existing = await this.prisma.question.findMany({
      where: {
        questionTypeId,
        isActive: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true, content: true },
    });

    for (const q of existing) {
      const existingText = this.extractText(q.content as Record<string, unknown>);
      const score = this.similarity(text, existingText);
      if (score >= this.SIMILARITY_THRESHOLD) {
        throw new ConflictException(
          `Benzer soru mevcut (benzerlik: ${Math.round(score * 100)}%). Soru ID: ${q.id}`,
        );
      }
    }
  }

  // ─── Admin CRUD ───────────────────────────────────────────────────────────

  async create(dto: CreateQuestionDto) {
    const questionType = await this.prisma.questionType.findUnique({
      where: { id: dto.questionTypeId },
    });
    if (!questionType) throw new NotFoundException('Soru tipi bulunamadı');

    const text = this.extractText(dto.content as unknown as Record<string, unknown>);
    await this.checkSimilarity(text, dto.questionTypeId);

    return this.prisma.question.create({
      data: {
        content: dto.content as object,
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation,
        questionTypeId: dto.questionTypeId,
        difficulty: dto.difficulty ?? 1,
      },
      include: {
        questionType: {
          select: { name: true, subject: { select: { name: true } } },
        },
      },
    });
  }

  async findAll(filter: QuestionFilterDto) {
    const { page = 1, limit = 20, ...where } = filter;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip,
        take: limit,
        include: {
          questionType: {
            select: {
              name: true,
              subject: { select: { name: true, examType: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.question.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        questionType: {
          include: {
            subject: { include: { examType: true } },
          },
        },
      },
    });
    if (!question) throw new NotFoundException('Soru bulunamadı');
    return question;
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const question = await this.findOne(id);

    if (dto.content && (dto.questionTypeId ?? question.questionTypeId)) {
      const targetTypeId = dto.questionTypeId ?? question.questionTypeId;
      const text = this.extractText(dto.content as unknown as Record<string, unknown>);
      await this.checkSimilarity(text, targetTypeId, id);
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        ...(dto.content ? { content: dto.content as object } : {}),
        ...(dto.correctAnswer ? { correctAnswer: dto.correctAnswer } : {}),
        ...(dto.explanation ? { explanation: dto.explanation } : {}),
        ...(dto.questionTypeId ? { questionTypeId: dto.questionTypeId } : {}),
        ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
      },
      include: {
        questionType: { select: { name: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.question.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── Curriculum (öğrenci) ────────────────────────────────────────────────

  async getExamTypes() {
    return this.prisma.examType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getSubjectsByExamType(examTypeId: string) {
    const examType = await this.prisma.examType.findUnique({ where: { id: examTypeId } });
    if (!examType) throw new NotFoundException('Sınav türü bulunamadı');

    return this.prisma.subject.findMany({
      where: { examTypeId },
      orderBy: { name: 'asc' },
    });
  }

  async getQuestionTypesBySubject(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new NotFoundException('Ders bulunamadı');

    return this.prisma.questionType.findMany({
      where: { subjectId },
      include: {
        _count: {
          select: {
            questions: { where: { isActive: true } },
            videos: { where: { isActive: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getQuestionType(id: string) {
    const qt = await this.prisma.questionType.findUnique({
      where: { id },
      include: {
        subject: { include: { examType: true } },
        _count: {
          select: {
            questions: { where: { isActive: true } },
            videos: { where: { isActive: true } },
          },
        },
      },
    });
    if (!qt) throw new NotFoundException('Soru tipi bulunamadı');
    return qt;
  }
}
