import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import {
  ExamsController,
  QuarantineController,
  AdminQuarantineController,
} from './exams.controller';
import { DatabaseModule } from '../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ExamsController, QuarantineController, AdminQuarantineController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
