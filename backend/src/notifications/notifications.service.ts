import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';
import { NotificationType } from './notifications.constants';
import { NotificationsGateway } from './notifications.gateway';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Yeni bildirim oluşturur ve WebSocket ile gönderir
   */
  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: (dto.data ?? {}) as Prisma.InputJsonValue,
      },
    });

    // Real-time bildirim gönder (kullanıcı online ise)
    this.gateway.sendNotification(dto.userId, notification);

    this.logger.log(
      `Bildirim oluşturuldu: userId=${dto.userId}, type=${dto.type}`,
    );
    return notification;
  }

  /**
   * Kullanıcının bildirimlerini getirir (sayfalı)
   */
  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ) {
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      items,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Okunmamış bildirim sayısını getirir
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  /**
   * Bildirimi okundu olarak işaretler
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return null;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Tüm bildirimleri okundu olarak işaretler
   */
  async markAllAsRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    this.logger.log(`Tüm bildirimler okundu: userId=${userId}, count=${count}`);
    return { markedCount: count };
  }

  /**
   * Bildirim sil (opsiyonel)
   */
  async delete(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      return null;
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { deleted: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Bildirim Tetikleyicileri (Internal API)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Düello daveti bildirimi
   */
  async notifyDuelInvite(
    userId: string,
    challengerName: string,
    duelId: string,
  ) {
    return this.create({
      userId,
      type: NotificationType.DUEL_INVITE,
      title: 'Yeni Düello Daveti',
      body: `${challengerName} size düello daveti gönderdi!`,
      data: { duelId, challengerName },
    });
  }

  /**
   * Düello sonucu bildirimi
   */
  async notifyDuelResult(
    userId: string,
    result: 'won' | 'lost' | 'draw',
    opponentName: string,
    duelId: string,
    points?: number,
  ) {
    const titles = {
      won: 'Düello Kazandınız!',
      lost: 'Düello Kaybettiniz',
      draw: 'Düello Berabere',
    };

    const bodies = {
      won: points
        ? `${opponentName} ile yaptığınız düelloyu kazandınız! ${points} puan kazandınız.`
        : `${opponentName} ile yaptığınız düelloyu kazandınız!`,
      lost: `${opponentName} ile yaptığınız düelloyu kaybettiniz.`,
      draw: `${opponentName} ile yaptığınız düello berabere bitti.`,
    };

    return this.create({
      userId,
      type: NotificationType.DUEL_RESULT,
      title: titles[result],
      body: bodies[result],
      data: { duelId, result, opponentName, points },
    });
  }

  /**
   * Haftalık sınav hatırlatması (1 saat önce)
   */
  async notifyWeeklyExamReminder(
    userId: string,
    examName: string,
    examId: string,
    scheduledAt: Date,
  ) {
    return this.create({
      userId,
      type: NotificationType.WEEKLY_EXAM_REMINDER,
      title: 'Sınav Yaklaşıyor!',
      body: `"${examName}" sınavı 1 saat içinde başlayacak. Hazır mısınız?`,
      data: { examId, examName, scheduledAt: scheduledAt.toISOString() },
    });
  }

  /**
   * Haftalık sınav sonuçları açıklandı
   */
  async notifyWeeklyExamResult(
    userId: string,
    examName: string,
    examId: string,
    rank: number,
    totalParticipants: number,
  ) {
    return this.create({
      userId,
      type: NotificationType.WEEKLY_EXAM_RESULT,
      title: 'Sınav Sonuçları Açıklandı',
      body: `"${examName}" sınav sonuçları açıklandı. ${rank}/${totalParticipants} sıraya girdiniz!`,
      data: { examId, examName, rank, totalParticipants },
    });
  }

  /**
   * Burs kazanıldı
   */
  async notifyScholarship(
    userId: string,
    amount: number,
    rank: number,
    examName: string,
    examId: string,
  ) {
    return this.create({
      userId,
      type: NotificationType.SCHOLARSHIP_EARNED,
      title: 'Burs Kazandınız!',
      body: `Tebrikler! ${examName} sınavında ${rank}. olarak ${amount.toLocaleString('tr-TR')} TL burs kazandınız!`,
      data: { examId, examName, amount, rank },
    });
  }

  /**
   * Rozet kazanıldı
   */
  async notifyBadge(userId: string, badgeName: string, badgeId: string) {
    return this.create({
      userId,
      type: NotificationType.BADGE_EARNED,
      title: 'Yeni Rozet!',
      body: `"${badgeName}" rozetini kazandınız!`,
      data: { badgeId, badgeName },
    });
  }

  /**
   * Karantina süresi dolmak üzere
   */
  async notifyQuarantineExpiry(
    userId: string,
    quarantineId: string,
    hoursRemaining: number,
  ) {
    return this.create({
      userId,
      type: NotificationType.QUARANTINE_EXPIRY,
      title: 'Karantina Süreniz Doluyor',
      body: `Karantina süreniz ${hoursRemaining} saat içinde dolacak. Kurtarma sınavına hazır olun!`,
      data: { quarantineId, hoursRemaining },
    });
  }

  /**
   * Gölge rakip yenildi
   */
  async notifyShadowOpponentDefeated(
    userId: string,
    opponentName: string,
    examId: string,
  ) {
    return this.create({
      userId,
      type: NotificationType.SHADOW_OPPONENT_DEFEATED,
      title: 'Gölge Rakip Yenildi!',
      body: `${opponentName} gölge rakibinizi yendiniz!`,
      data: { examId, opponentName },
    });
  }
}
