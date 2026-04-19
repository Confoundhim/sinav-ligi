import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

interface AuthSocket extends Socket {
  userId: string;
}

@Injectable()
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth as Record<string, string>)['token'] ||
        client.handshake.headers['authorization']?.split(' ')[1];

      if (!token) {
        this.logger.warn('Notification socket: Token yok');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      });

      (client as AuthSocket).userId = payload.sub;
      this.userSockets.set(payload.sub, client.id);
      this.logger.log(`Notification socket bağlandı: userId=${payload.sub}`);
    } catch (err) {
      this.logger.warn('Notification socket: Geçersiz token', err);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    if (client.userId) {
      this.userSockets.delete(client.userId);
      this.logger.log(`Notification socket ayrıldı: userId=${client.userId}`);
    }
  }

  /**
   * Kullanıcıya real-time bildirim gönder
   */
  sendToUser(userId: string, event: string, data: unknown) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      this.logger.log(
        `Real-time bildirim gönderildi: userId=${userId}, event=${event}`,
      );
      return true;
    }
    return false;
  }

  /**
   * Yeni bildirim event'i
   */
  sendNotification(userId: string, notification: unknown) {
    return this.sendToUser(userId, 'notification:new', notification);
  }

  /**
   * Kullanıcının online olup olmadığını kontrol et
   */
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
