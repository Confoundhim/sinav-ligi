import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Enrollment } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { PaymentsService, PaytrTokenResult } from '../payments/payments.service';
import { PaymentType } from '@prisma/client';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

const ENROLLMENT_FEE_TL = 250;

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Sınav kaydı oluşturma:
   * 1. ExamType doğrula
   * 2. Aynı yıl aynı sınava kayıt var mı kontrol et
   * 3. PayTR ödeme başlat (callback'te enrollment oluşturulur)
   */
  async initiateEnrollment(
    userId: string,
    userEmail: string,
    userIp: string,
    dto: CreateEnrollmentDto,
  ): Promise<PaytrTokenResult> {
    const year = dto.year ?? new Date().getFullYear();

    const examType = await this.prisma.examType.findUnique({
      where: { id: dto.examTypeId },
    });

    if (!examType) {
      throw new NotFoundException('Sınav türü bulunamadı.');
    }

    if (!examType.isActive) {
      throw new ConflictException('Bu sınav türü şu an aktif değil.');
    }

    // Mevcut kayıt kontrolü
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        userId_examTypeId_year: {
          userId,
          examTypeId: dto.examTypeId,
          year,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`${year} yılı için bu sınava zaten kayıtlısınız.`);
    }

    const fee = Number(examType.registrationFee) || ENROLLMENT_FEE_TL;

    this.logger.log(`Kayıt başlatılıyor: userId=${userId}, examTypeId=${dto.examTypeId}, yıl=${year}, ücret=${fee}`);

    return this.paymentsService.createPayment(userId, userEmail, userIp, {
      type: PaymentType.ENROLLMENT,
      amount: fee,
      description: `${examType.name} ${year} kayıt ücreti`,
      examTypeId: dto.examTypeId,
      year,
    });
  }

  /**
   * Kullanıcının kayıtlarını getirir
   */
  async getUserEnrollments(userId: string): Promise<Enrollment[]> {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        examType: true,
        payment: { select: { status: true, createdAt: true } },
      } as never,
      orderBy: { enrolledAt: 'desc' },
    });
  }
}
