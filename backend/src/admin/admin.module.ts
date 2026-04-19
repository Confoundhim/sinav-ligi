import { Module } from '@nestjs/common';
import { AdminVideosController } from './admin-videos.controller';
import { AdminVideosService } from './admin-videos.service';
import { DatabaseModule } from '../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminVideosController],
  providers: [AdminVideosService],
  exports: [AdminVideosService],
})
export class AdminModule {}
