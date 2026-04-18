import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DuelsController } from './duels.controller';
import { DuelsService } from './duels.service';
import { DuelGateway } from './duels.gateway';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { DatabaseModule } from '../common/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.accessSecret'),
      }),
    }),
  ],
  controllers: [DuelsController],
  providers: [DuelsService, DuelGateway, WsJwtGuard],
  exports: [DuelsService],
})
export class DuelsModule {}
