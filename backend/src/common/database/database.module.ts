import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { POSTGRES_POOL } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Pool => {
        return new Pool({
          host: configService.getOrThrow<string>('postgres.host'),
          port: configService.getOrThrow<number>('postgres.port'),
          database: configService.getOrThrow<string>('postgres.database'),
          user: configService.getOrThrow<string>('postgres.user'),
          password: configService.getOrThrow<string>('postgres.password'),
          ssl: configService.getOrThrow<boolean>('postgres.ssl')
            ? { rejectUnauthorized: false }
            : false,
        });
      },
    },
  ],
  exports: [POSTGRES_POOL],
})
export class DatabaseModule {}
