import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Wallet, WalletTransaction, WalletTransactionType } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

export interface WalletWithTransactions extends Wallet {
  transactions: WalletTransaction[];
}

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kullanıcının cüzdanını getirir. Yoksa oluşturur.
   */
  async getOrCreateWallet(userId: string): Promise<Wallet> {
    return this.prisma.wallet.upsert({
      where: { userId },
      create: { userId, balance: 0, totalEarned: 0, totalSpent: 0 },
      update: {},
    });
  }

  /**
   * Kullanıcının cüzdanını ve işlem geçmişini getirir.
   */
  async getWalletWithTransactions(userId: string): Promise<Wallet & { transactions: WalletTransaction[] }> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!wallet) {
      const newWallet = await this.getOrCreateWallet(userId);
      return { ...newWallet, transactions: [] };
    }

    return wallet as Wallet & { transactions: WalletTransaction[] };
  }

  /**
   * İşlem geçmişi (tek başına)
   */
  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return [];
    }

    return this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Bakiyeden harcama (internal – sınav ücreti kesme)
   */
  async spendFromWallet(
    userId: string,
    amount: number,
    type: WalletTransactionType,
    description: string,
    referenceId?: string,
  ): Promise<Wallet> {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });

    if (!wallet) {
      throw new NotFoundException('Cüzdan bulunamadı.');
    }

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Yetersiz bakiye.');
    }

    const [updatedWallet] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          totalSpent: { increment: amount },
        },
      }),
      this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type,
          amount: -amount,
          description,
          referenceId,
        },
      }),
    ]);

    this.logger.log(`Cüzdandan harcama: userId=${userId}, tutar=${amount}, tip=${type}`);
    return updatedWallet;
  }

  /**
   * Cüzdana yükleme (PayTR dışı, test/admin amaçlı)
   */
  async addToWallet(
    userId: string,
    amount: number,
    type: WalletTransactionType,
    description: string,
    referenceId?: string,
  ): Promise<Wallet> {
    if (amount <= 0) {
      throw new BadRequestException('Tutar 0\'dan büyük olmalı.');
    }

    const wallet = await this.getOrCreateWallet(userId);

    const [updatedWallet] = await this.prisma.$transaction([
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
          type,
          amount,
          description,
          referenceId,
        },
      }),
    ]);

    return updatedWallet;
  }
}
