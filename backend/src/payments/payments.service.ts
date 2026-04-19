import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatus, PaymentType, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../common/database/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaytrCallbackDto } from './dto/paytr-callback.dto';

const PAYTR_TOKEN_URL = 'https://www.paytr.com/odeme/api/get-token';

export interface PaytrTokenResult {
  iframeToken: string;
  paymentId: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly merchantId: string;
  private readonly merchantKey: string;
  private readonly merchantSalt: string;
  private readonly testMode: number;
  private readonly successUrl: string;
  private readonly failUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const paytr = this.config.get('paytr') as {
      merchantId: string;
      merchantKey: string;
      merchantSalt: string;
      testMode: number;
      successUrl: string;
      failUrl: string;
    };
    this.merchantId = paytr.merchantId;
    this.merchantKey = paytr.merchantKey;
    this.merchantSalt = paytr.merchantSalt;
    this.testMode = paytr.testMode;
    this.successUrl = paytr.successUrl;
    this.failUrl = paytr.failUrl;
  }

  /**
   * Ödeme başlatma: Payment kaydı oluşturur, PayTR'ye token isteği gönderir.
   */
  async createPayment(
    userId: string,
    userEmail: string,
    userIp: string,
    dto: CreatePaymentDto,
  ): Promise<PaytrTokenResult> {
    const metadata: Prisma.InputJsonValue = {
      description: dto.description,
      examTypeId: dto.examTypeId ?? null,
      weeklyExamId: dto.weeklyExamId ?? null,
      year: dto.year ?? null,
    };

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount: dto.amount,
        type: dto.type,
        status: PaymentStatus.PENDING,
        metadata,
      },
    });

    const iframeToken = await this.fetchPaytrToken(
      payment.id,
      userEmail,
      userIp,
      dto.amount,
      dto.description,
    );

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { paytrToken: iframeToken, paytrOrderId: payment.id },
    });

    return { iframeToken, paymentId: payment.id };
  }

  /**
   * PayTR'den iFrame token'ı alır.
   * https://dev.paytr.com/iframe-api/iframe-api-1-adim
   */
  private async fetchPaytrToken(
    merchantOid: string,
    email: string,
    userIp: string,
    amount: number,
    description: string,
  ): Promise<string> {
    // PayTR kuruş cinsinden tutar bekler (100x TL)
    const paymentAmount = Math.round(amount * 100).toString();

    // Sepet: [[ürün adı, birim fiyat string, adet]]
    const userBasket = Buffer.from(
      JSON.stringify([[description, paymentAmount, '1']]),
    ).toString('base64');

    const noInstallment = '0';
    const maxInstallment = '0';
    const currency = 'TL';
    const testMode = this.testMode.toString();

    const hashStr =
      this.merchantId +
      userIp +
      merchantOid +
      email +
      paymentAmount +
      userBasket +
      noInstallment +
      maxInstallment +
      currency +
      testMode;

    const paytrToken = crypto
      .createHmac('sha256', this.merchantKey)
      .update(hashStr + this.merchantSalt)
      .digest('base64');

    const params = new URLSearchParams({
      merchant_id: this.merchantId,
      user_ip: userIp,
      merchant_oid: merchantOid,
      email,
      payment_amount: paymentAmount,
      paytr_token: paytrToken,
      user_basket: userBasket,
      debug_on: '0',
      no_installment: noInstallment,
      max_installment: maxInstallment,
      user_name: email,
      user_phone: '05000000000',
      merchant_ok_url: this.successUrl,
      merchant_fail_url: this.failUrl,
      timeout_limit: '30',
      currency,
      test_mode: testMode,
      lang: 'tr',
    });

    const response = await fetch(PAYTR_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      this.logger.error(`PayTR HTTP error: ${response.status}`);
      throw new InternalServerErrorException('PayTR servisi yanıt vermedi.');
    }

    const data = (await response.json()) as {
      status: string;
      token?: string;
      reason?: string;
    };

    if (data.status !== 'success' || !data.token) {
      this.logger.error(
        `PayTR token hatası: ${data.reason ?? 'Bilinmeyen hata'}`,
      );
      throw new InternalServerErrorException('PayTR token alınamadı.');
    }

    return data.token;
  }

  /**
   * PayTR callback: hash doğrular, ödeme durumunu günceller,
   * ilgili iş mantığını tetikler (enrollment, bakiye vb.)
   */
  async handleCallback(dto: PaytrCallbackDto): Promise<string> {
    // 1. Hash doğrulama (güvenlik kritik)
    if (
      !this.verifyCallbackHash(
        dto.merchant_oid,
        dto.status,
        dto.total_amount,
        dto.hash,
      )
    ) {
      this.logger.warn(`PayTR hash doğrulama başarısız: ${dto.merchant_oid}`);
      throw new UnauthorizedException('PAYTR notification failed: bad hash');
    }

    // 2. Ödemeyi DB'den bul
    const payment = await this.prisma.payment.findUnique({
      where: { id: dto.merchant_oid },
    });

    if (!payment) {
      this.logger.warn(`Ödeme kaydı bulunamadı: ${dto.merchant_oid}`);
      return 'OK'; // PayTR'ye yine OK döndür, sonsuz döngü olmasın
    }

    // 3. İdempotency: zaten işlenmiş mi?
    if (
      payment.status === PaymentStatus.COMPLETED ||
      payment.status === PaymentStatus.REFUNDED
    ) {
      this.logger.log(`Ödeme zaten işlendi: ${payment.id} (${payment.status})`);
      return 'OK';
    }

    // 4. Durumu güncelle
    if (dto.status === 'success') {
      await this.processSuccessfulPayment(payment);
    } else {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      this.logger.log(
        `Ödeme başarısız: ${payment.id}, kod: ${dto.failed_reason_code ?? '-'}`,
      );
    }

    return 'OK';
  }

  /**
   * Başarılı ödeme sonrası iş mantığı
   */
  private async processSuccessfulPayment(payment: Payment): Promise<void> {
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.COMPLETED },
    });

    const meta = payment.metadata as Record<string, unknown> | null;

    switch (payment.type) {
      case PaymentType.DEPOSIT:
        await this.processDeposit(
          payment.userId,
          payment.id,
          Number(payment.amount),
        );
        break;

      case PaymentType.ENROLLMENT: {
        const examTypeId = meta?.examTypeId as string | undefined;
        const year =
          (meta?.year as number | undefined) ?? new Date().getFullYear();
        if (examTypeId) {
          await this.processEnrollment(
            payment.userId,
            payment.id,
            examTypeId,
            year,
            Number(payment.amount),
          );
        }
        break;
      }

      case PaymentType.WEEKLY_EXAM: {
        const weeklyExamId = meta?.weeklyExamId as string | undefined;
        if (weeklyExamId) {
          await this.processWeeklyExam(
            payment.userId,
            payment.id,
            weeklyExamId,
          );
        }
        break;
      }

      default:
        break;
    }

    this.logger.log(`Ödeme başarıyla işlendi: ${payment.id} (${payment.type})`);
  }

  private async processDeposit(
    userId: string,
    paymentId: string,
    amount: number,
  ): Promise<void> {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId },
      create: { userId, balance: 0, totalEarned: 0, totalSpent: 0 },
      update: {},
    });

    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: amount },
          totalEarned: { increment: amount },
        },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEPOSIT',
          amount,
          description: 'PayTR ile cüzdan yükleme',
          referenceId: paymentId,
        },
      }),
    ]);
  }

  private async processEnrollment(
    userId: string,
    paymentId: string,
    examTypeId: string,
    year: number,
    amount: number,
  ): Promise<void> {
    try {
      await this.prisma.enrollment.create({
        data: {
          userId,
          examTypeId,
          year,
          paidAmount: amount,
          paymentId,
        },
      });
    } catch (e) {
      // P2002 = unique constraint → kayıt zaten var
      if ((e as { code?: string }).code !== 'P2002') {
        throw e;
      }
      this.logger.warn(
        `Enrollment zaten mevcut: ${userId}/${examTypeId}/${year}`,
      );
    }
  }

  private async processWeeklyExam(
    userId: string,
    paymentId: string,
    weeklyExamId: string,
  ): Promise<void> {
    try {
      await this.prisma.weeklyExamParticipant.create({
        data: {
          weeklyExamId,
          userId,
          paymentId,
        },
      });
    } catch (e) {
      if ((e as { code?: string }).code !== 'P2002') {
        throw e;
      }
      this.logger.warn(
        `WeeklyExamParticipant zaten mevcut: ${userId}/${weeklyExamId}`,
      );
    }
  }

  /**
   * Kullanıcının ödeme geçmişi
   */
  async getHistory(userId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * PayTR callback hash doğrulama
   * hash = base64(hmac_sha256(merchant_oid + merchant_salt + status + total_amount, merchant_key))
   */
  verifyCallbackHash(
    merchantOid: string,
    status: string,
    totalAmount: string,
    receivedHash: string,
  ): boolean {
    const computed = crypto
      .createHmac('sha256', this.merchantKey)
      .update(merchantOid + this.merchantSalt + status + totalAmount)
      .digest('base64');
    return computed === receivedHash;
  }

  /**
   * Sadece token hash üretimi (test/kullanım için)
   */
  generateTokenHash(
    userIp: string,
    merchantOid: string,
    email: string,
    paymentAmount: string,
    userBasket: string,
    noInstallment: string,
    maxInstallment: string,
    currency: string,
    testMode: string,
  ): string {
    const hashStr =
      this.merchantId +
      userIp +
      merchantOid +
      email +
      paymentAmount +
      userBasket +
      noInstallment +
      maxInstallment +
      currency +
      testMode;

    return crypto
      .createHmac('sha256', this.merchantKey)
      .update(hashStr + this.merchantSalt)
      .digest('base64');
  }
}
