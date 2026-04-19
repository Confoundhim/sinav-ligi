import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { FriendshipStatus } from '@prisma/client';
import { PrismaService } from '../common/database/prisma.service';

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Arkadaşlık İsteği Gönder ─────────────────────────────────────────────

  async sendRequest(requesterId: string, addresseeId: string) {
    if (requesterId === addresseeId) {
      throw new ConflictException(
        'Kendinize arkadaşlık isteği gönderemezsiniz',
      );
    }

    const addressee = await this.prisma.user.findUnique({
      where: { id: addresseeId, isActive: true },
      select: { id: true },
    });
    if (!addressee) throw new NotFoundException('Kullanıcı bulunamadı');

    // Var olan istek kontrolü
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('Bu kullanıcı zaten arkadaşınız');
      }
      if (existing.status === FriendshipStatus.PENDING) {
        throw new ConflictException('Zaten bekleyen bir arkadaşlık isteği var');
      }
      if (existing.status === FriendshipStatus.BLOCKED) {
        throw new ForbiddenException('Bu kullanıcı tarafından engellendiniz');
      }
    }

    const friendship = await this.prisma.friendship.create({
      data: { requesterId, addresseeId, status: FriendshipStatus.PENDING },
      include: {
        requester: { select: { id: true, displayName: true, avatar: true } },
        addressee: { select: { id: true, displayName: true, avatar: true } },
      },
    });

    // Bildirim gönder
    await this.prisma.notification.create({
      data: {
        userId: addresseeId,
        type: 'FRIEND_REQUEST',
        title: 'Yeni Arkadaşlık İsteği',
        body: `${friendship.requester.displayName} size arkadaşlık isteği gönderdi`,
        data: { friendshipId: friendship.id, requesterId },
      },
    });

    return { friendship };
  }

  // ─── İsteği Kabul Et ──────────────────────────────────────────────────────

  async acceptRequest(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) throw new NotFoundException('İstek bulunamadı');
    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException('Bu isteği kabul etme yetkiniz yok');
    }
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new ConflictException('Bu istek zaten işlenmiş');
    }

    const updated = await this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: FriendshipStatus.ACCEPTED },
      include: {
        requester: { select: { id: true, displayName: true, avatar: true } },
        addressee: { select: { id: true, displayName: true, avatar: true } },
      },
    });

    // Bildirim gönder
    await this.prisma.notification.create({
      data: {
        userId: friendship.requesterId,
        type: 'FRIEND_ACCEPTED',
        title: 'Arkadaşlık Kabul Edildi',
        body: `${updated.addressee.displayName} arkadaşlık isteğinizi kabul etti`,
        data: { friendshipId: updated.id },
      },
    });

    return { friendship: updated };
  }

  // ─── İsteği Reddet ────────────────────────────────────────────────────────

  async declineRequest(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) throw new NotFoundException('İstek bulunamadı');
    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException('Bu isteği reddetme yetkiniz yok');
    }
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new ConflictException('Bu istek zaten işlenmiş');
    }

    await this.prisma.friendship.delete({ where: { id: friendshipId } });
    return { declined: true };
  }

  // ─── Arkadaşlıktan Çıkar ──────────────────────────────────────────────────

  async removeFriend(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) throw new NotFoundException('Arkadaşlık bulunamadı');
    if (
      friendship.requesterId !== userId &&
      friendship.addresseeId !== userId
    ) {
      throw new ForbiddenException('Bu arkadaşlığı silme yetkiniz yok');
    }

    await this.prisma.friendship.delete({ where: { id: friendshipId } });
    return { removed: true };
  }

  // ─── Arkadaş Listesi ──────────────────────────────────────────────────────

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: { id: true, displayName: true, avatar: true } },
        addressee: { select: { id: true, displayName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const friends = friendships.map((f) => {
      const isRequester = f.requesterId === userId;
      return {
        friendshipId: f.id,
        friend: isRequester ? f.addressee : f.requester,
        createdAt: f.createdAt,
      };
    });

    return { friends };
  }

  // ─── Bekleyen İstekler ────────────────────────────────────────────────────

  async getPendingRequests(userId: string) {
    const [incoming, outgoing] = await Promise.all([
      // Gelen istekler
      this.prisma.friendship.findMany({
        where: { addresseeId: userId, status: FriendshipStatus.PENDING },
        include: {
          requester: { select: { id: true, displayName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Giden istekler
      this.prisma.friendship.findMany({
        where: { requesterId: userId, status: FriendshipStatus.PENDING },
        include: {
          addressee: { select: { id: true, displayName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      incoming: incoming.map((f) => ({
        friendshipId: f.id,
        user: f.requester,
        createdAt: f.createdAt,
      })),
      outgoing: outgoing.map((f) => ({
        friendshipId: f.id,
        user: f.addressee,
        createdAt: f.createdAt,
      })),
    };
  }
}
