import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ExamsService } from './exams.service';
import { CreateCustomExamDto } from './dto/create-custom-exam.dto';
import { CreateShadowExamDto } from './dto/create-shadow-exam.dto';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { QuarantineAttemptDto } from './dto/quarantine-attempt.dto';

// ─── Sınavlar ────────────────────────────────────────────────────────────────

@ApiTags('Sınavlar')
@ApiBearerAuth()
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('custom')
  @ApiOperation({ summary: 'Özel sınav oluştur' })
  @ApiCreatedResponse({ description: 'Sınav oturumu oluşturuldu' })
  createCustomExam(
    @Body() dto: CreateCustomExamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.examsService.createCustomExam(dto, user.sub);
  }

  @Post('shadow')
  @ApiOperation({ summary: 'Gölge Rakip sınavı başlat (KPSS dağılımına göre)' })
  @ApiCreatedResponse({ description: 'Gölge rakip sınavı oluşturuldu' })
  createShadowExam(
    @Body() dto: CreateShadowExamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.examsService.createShadowExam(dto, user.sub);
  }

  @Get('shadow/history')
  @ApiOperation({ summary: 'Gölge Rakip geçmişi' })
  getShadowHistory(@CurrentUser() user: JwtPayload) {
    return this.examsService.getShadowHistory(user.sub);
  }

  @Get('shadow/comparison')
  @ApiOperation({ summary: 'Son iki gölge rakip sınavını karşılaştır' })
  getShadowComparison(@CurrentUser() user: JwtPayload) {
    return this.examsService.getShadowComparison(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Sınav sorularını getir (cevaplar gizli)' })
  getExamQuestions(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.examsService.getExamQuestions(id, user.sub);
  }

  @Post(':id/answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soru cevapla' })
  @ApiOkResponse({ description: 'Cevap kaydedildi' })
  answerQuestion(
    @Param('id') id: string,
    @Body() dto: AnswerQuestionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.examsService.answerQuestion(id, dto, user.sub);
  }

  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sınavı bitir ve sonuçları hesapla' })
  finishExam(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.examsService.finishExam(id, user.sub);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Sınav sonuçları (detaylı analiz)' })
  getExamResults(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.examsService.getExamResults(id, user.sub);
  }
}

// ─── Karantina ────────────────────────────────────────────────────────────────

@ApiTags('Karantina')
@ApiBearerAuth()
@Controller('quarantine')
export class QuarantineController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: 'Karantinadaki sorular (soru tipi bazlı gruplu)' })
  getQuarantine(@CurrentUser() user: JwtPayload) {
    return this.examsService.getQuarantine(user.sub);
  }

  @Get(':id/next')
  @ApiOperation({ summary: 'Karantina kurtarma için sonraki soru' })
  getNextQuestion(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.examsService.getNextQuarantineQuestion(id, user.sub);
  }

  @Post(':id/attempt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Karantina sorusunu çöz (3/3 doğru = kurtarma)' })
  submitAttempt(
    @Param('id') id: string,
    @Body() dto: QuarantineAttemptDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.examsService.submitQuarantineAttempt(id, dto, user.sub);
  }
}

// ─── Admin: Haftalık Penaltı ──────────────────────────────────────────────────

@ApiTags('Admin - Sınavlar')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/quarantine')
export class AdminQuarantineController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('apply-weekly-penalty')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Haftalık karantina penaltısını uygula (7+ gün aktif → EXPIRED)',
  })
  applyWeeklyPenalty() {
    return this.examsService.applyWeeklyPenalty();
  }
}
