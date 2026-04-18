import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client: Socket & { userId?: string } = context
      .switchToWs()
      .getClient<Socket & { userId?: string }>();

    if (!client.userId) {
      throw new WsException('Yetkisiz bağlantı');
    }
    return true;
  }
}
