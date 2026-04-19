import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  AdminWeeklyExamController,
  WeeklyExamController,
} from './weekly-exam.controller';
import { WeeklyExamService } from './weekly-exam.service';

@Module({
  imports: [DatabaseModule, WalletModule, NotificationsModule],
  controllers: [AdminWeeklyExamController, WeeklyExamController],
  providers: [WeeklyExamService],
  exports: [WeeklyExamService],
})
export class WeeklyExamModule {}
