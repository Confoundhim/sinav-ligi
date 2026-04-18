import { Module } from '@nestjs/common';
import { DatabaseModule } from '../common/database/database.module';
import { PaymentsModule } from '../payments/payments.module';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';

@Module({
  imports: [DatabaseModule, PaymentsModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
