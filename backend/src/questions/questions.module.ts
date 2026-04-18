import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AdminQuestionsController, CurriculumController } from './questions.controller';
import { DatabaseModule } from '../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminQuestionsController, CurriculumController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
