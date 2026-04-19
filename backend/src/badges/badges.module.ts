import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
