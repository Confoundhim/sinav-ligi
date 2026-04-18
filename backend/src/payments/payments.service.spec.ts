import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PaymentStatus, PaymentType } from '@prisma/client';
import * as crypto from 'crypto';
import { PrismaService } from '../common/database/prisma.service';
import { PaymentsService } from './payments.service';

const MERCHANT_KEY = 'test-merchant-key-32chars-exactly!';
const MERCHANT_SALT = 'test-merchant-salt-32chars-exactly';
const MERCHANT_ID = '123456';

function makeHash(str: string): string {
  return crypto.createHmac('sha256', MERCHANT_KEY).update(str).digest('base64');
}

function makeCallbackHash(merchantOid: string, status: string, totalAmount: string): string {
  return makeHash(merchantOid + MERCHANT_SALT + status + totalAmount);
}

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockConfig = {
    get: jest.fn((key: string) => {
      if (key === 'paytr') {
        return {
          merchantId: MERCHANT_ID,
          merchantKey: MERCHANT_KEY,
          merchantSalt: MERCHANT_SALT,
          testMode: 1,
          successUrl: 'http://localhost:3001/payment/success',
          failUrl: 'http://localhost:3001/payment/fail',
        };
      }
      return null;
    }),
  };

  const mockPrisma = {
    payment: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    wallet: {
      upsert: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
    },
    enrollment: {
      create: jest.fn(),
    },
    weeklyExamParticipant: {
      create: jest.fn(),
    },
    $transaction: jest.fn((ops: unknown[]) => Promise.resolve(ops)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('verifyCallbackHash', () => {
    it('doğru hash doğrulanmalı', () => {
      const merchantOid = 'order-123';
      const status = 'success';
      const totalAmount = '25000';
      const validHash = makeCallbackHash(merchantOid, status, totalAmount);

      expect(service.verifyCallbackHash(merchantOid, status, totalAmount, validHash)).toBe(true);
    });

    it('yanlış hash reddedilmeli', () => {
      expect(service.verifyCallbackHash('order-123', 'success', '25000', 'yanlis-hash')).toBe(false);
    });

    it('status değişince hash geçersiz olmalı', () => {
      const merchantOid = 'order-123';
      const totalAmount = '25000';
      const validHash = makeCallbackHash(merchantOid, 'success', totalAmount);

      expect(service.verifyCallbackHash(merchantOid, 'failed', totalAmount, validHash)).toBe(false);
    });

    it('tutar değişince hash geçersiz olmalı', () => {
      const merchantOid = 'order-123';
      const status = 'success';
      const validHash = makeCallbackHash(merchantOid, status, '25000');

      expect(service.verifyCallbackHash(merchantOid, status, '30000', validHash)).toBe(false);
    });
  });

  describe('handleCallback', () => {
    it('geçersiz hash ile UnauthorizedException fırlatmalı', async () => {
      await expect(
        service.handleCallback({
          merchant_oid: 'order-123',
          status: 'success',
          total_amount: '25000',
          hash: 'gecersiz-hash',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('ödeme bulunamazsa OK dönmeli (sonsuz döngü yok)', async () => {
      const merchantOid = 'order-notfound';
      const status = 'success';
      const totalAmount = '25000';
      const hash = makeCallbackHash(merchantOid, status, totalAmount);

      mockPrisma.payment.findUnique.mockResolvedValueOnce(null);

      const result = await service.handleCallback({ merchant_oid: merchantOid, status, total_amount: totalAmount, hash });
      expect(result).toBe('OK');
    });

    it('idempotency: zaten COMPLETED olan ödeme tekrar işlenmemeli', async () => {
      const merchantOid = 'order-completed';
      const status = 'success';
      const totalAmount = '25000';
      const hash = makeCallbackHash(merchantOid, status, totalAmount);

      mockPrisma.payment.findUnique.mockResolvedValueOnce({
        id: merchantOid,
        status: PaymentStatus.COMPLETED,
        type: PaymentType.DEPOSIT,
        userId: 'user-1',
        amount: 250,
        metadata: null,
      });

      const result = await service.handleCallback({ merchant_oid: merchantOid, status, total_amount: totalAmount, hash });
      expect(result).toBe('OK');
      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    });

    it('başarılı DEPOSIT callback bakiye eklemeli', async () => {
      const merchantOid = 'order-deposit';
      const status = 'success';
      const totalAmount = '25000';
      const hash = makeCallbackHash(merchantOid, status, totalAmount);

      mockPrisma.payment.findUnique.mockResolvedValueOnce({
        id: merchantOid,
        status: PaymentStatus.PENDING,
        type: PaymentType.DEPOSIT,
        userId: 'user-1',
        amount: 250,
        metadata: { description: 'test' },
      });

      mockPrisma.payment.update.mockResolvedValueOnce({});
      mockPrisma.wallet.upsert.mockResolvedValueOnce({ id: 'wallet-1', balance: 0 });
      mockPrisma.$transaction.mockResolvedValueOnce([{ id: 'wallet-1', balance: 250 }, {}]);

      const result = await service.handleCallback({ merchant_oid: merchantOid, status, total_amount: totalAmount, hash });

      expect(result).toBe('OK');
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: PaymentStatus.COMPLETED } }),
      );
      expect(mockPrisma.wallet.upsert).toHaveBeenCalled();
    });

    it('başarısız ödeme FAILED statüsüne geçmeli', async () => {
      const merchantOid = 'order-failed';
      const status = 'failed';
      const totalAmount = '0';
      const hash = makeCallbackHash(merchantOid, status, totalAmount);

      mockPrisma.payment.findUnique.mockResolvedValueOnce({
        id: merchantOid,
        status: PaymentStatus.PENDING,
        type: PaymentType.DEPOSIT,
        userId: 'user-1',
        amount: 250,
        metadata: null,
      });

      mockPrisma.payment.update.mockResolvedValueOnce({});

      const result = await service.handleCallback({ merchant_oid: merchantOid, status, total_amount: totalAmount, hash });

      expect(result).toBe('OK');
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: PaymentStatus.FAILED } }),
      );
    });
  });

  describe('generateTokenHash', () => {
    it('hash doğru formatta üretilmeli', () => {
      const hash = service.generateTokenHash(
        '192.168.1.1',
        'order-123',
        'test@example.com',
        '25000',
        Buffer.from(JSON.stringify([['Test', '25000', '1']])).toString('base64'),
        '0',
        '0',
        'TL',
        '1',
      );

      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      // base64 format kontrolü
      expect(() => Buffer.from(hash, 'base64')).not.toThrow();
    });
  });

  describe('getHistory', () => {
    it('kullanıcı ödemelerini dönmeli', async () => {
      const mockPayments = [{ id: 'pay-1', userId: 'user-1', amount: 250 }];
      mockPrisma.payment.findMany.mockResolvedValueOnce(mockPayments);

      const result = await service.getHistory('user-1');

      expect(result).toEqual(mockPayments);
      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });
});
