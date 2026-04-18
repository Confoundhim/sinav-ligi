import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AchievementsModule } from './achievements/achievements.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { appConfig } from './common/config/app.config';
import { envValidationSchema } from './common/config/env.validation';
import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { QuestionsModule } from './questions/questions.module';
import { RankingsModule } from './rankings/rankings.module';
import { RedisModule } from './common/redis/redis.module';
import { UsersModule } from './users/users.module';
import { WalletModule } from './wallet/wallet.module';
import { DuelsModule } from './duels/duels.module';
import { ExamsModule } from './exams/exams.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
      validationSchema: envValidationSchema,
      envFilePath: ['../.env', '.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                },
              },
        redact: {
          paths: ['req.headers.authorization'],
          censor: '[Redacted]',
        },
      },
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ExamsModule,
    QuestionsModule,
    PaymentsModule,
    RankingsModule,
    DuelsModule,
    NotificationsModule,
    AdminModule,
    WalletModule,
    AchievementsModule,
  ],
})
export class AppModule {}
