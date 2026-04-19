import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { VideosService } from './videos.service';

@ApiTags('Videolar')
@ApiBearerAuth()
@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  @ApiOperation({ summary: 'Soru tipine ait videolar (sıralı)' })
  @ApiQuery({
    name: 'questionTypeId',
    required: true,
    description: 'Soru tipi ID',
  })
  @ApiOkResponse({ description: 'Video listesi' })
  findByQuestionType(@Query('questionTypeId') questionTypeId: string) {
    return this.videosService.findByQuestionType(questionTypeId);
  }

  @Post(':id/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Video izleme ilerlemesi kaydet' })
  @ApiOkResponse({ description: 'İlerleme kaydedildi' })
  saveProgress(
    @CurrentUser() user: JwtPayload,
    @Param('id') videoId: string,
    @Body() body: { watchedSeconds: number; completed?: boolean },
  ) {
    return this.videosService.saveProgress(
      user.sub,
      videoId,
      body.watchedSeconds,
      body.completed ?? false,
    );
  }

  @Get('progress')
  @ApiOperation({ summary: 'Kullanıcının video ilerleme durumu' })
  @ApiQuery({
    name: 'questionTypeId',
    required: true,
    description: 'Soru tipi ID',
  })
  @ApiOkResponse({ description: 'İlerleme durumu' })
  getProgress(
    @CurrentUser() user: JwtPayload,
    @Query('questionTypeId') questionTypeId: string,
  ) {
    return this.videosService.getProgress(user.sub, questionTypeId);
  }
}
