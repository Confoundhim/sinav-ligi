import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UseGuards } from '@nestjs/common';
import { DuelsService } from './duels.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';

interface AuthSocket extends Socket {
  userId: string;
}

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  namespace: '/duels',
})
export class DuelGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly duelsService: DuelsService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth as Record<string, string>)['token'] ||
        client.handshake.headers['authorization']?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      });

      (client as AuthSocket).userId = payload.sub;
      this.userSockets.set(payload.sub, client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    if (client.userId) {
      this.userSockets.delete(client.userId);
    }
  }

  // Belirli bir kullanıcıya event gönder
  sendToUser(userId: string, event: string, data: unknown) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // Bir odadaki herkese event gönder
  sendToRoom(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('duel:join')
  async handleJoinDuel(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { duelId: string },
  ) {
    const userId = client.userId;
    if (!userId || !data?.duelId) throw new WsException('Geçersiz istek');

    const duel = await this.duelsService.getDuelById(data.duelId, userId);
    await client.join(`duel:${data.duelId}`);
    return { event: 'duel:joined', data: duel };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('duel:answer')
  async handleAnswer(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody()
    data: {
      duelId: string;
      questionId: string;
      answer: string;
      timeSpent: number;
    },
  ) {
    const userId = client.userId;
    if (!userId) throw new WsException('Yetkisiz');

    const result = await this.duelsService.submitAnswer(
      data.duelId,
      userId,
      data.questionId,
      data.answer,
      data.timeSpent,
    );

    // Karşı tarafa "cevapladı" bilgisi (cevap gizli)
    const opponentId = result.opponentId;
    this.sendToUser(opponentId, 'duel:opponent_answered', {
      duelId: data.duelId,
      questionId: data.questionId,
    });

    // Düello tamamlandıysa her iki tarafa sonuç gönder
    if (result.completed && result.finalResult) {
      this.sendToRoom(
        `duel:${data.duelId}`,
        'duel:completed',
        result.finalResult,
      );
    }

    return {
      event: 'duel:answer_accepted',
      data: { questionId: data.questionId },
    };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('duel:leave')
  async handleLeave(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { duelId: string },
  ) {
    await client.leave(`duel:${data.duelId}`);
    return { event: 'duel:left' };
  }
}
