import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WeeklyExamService } from './weekly-exam.service';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { CheatReportDto } from './dto/cheat-report.dto';
import { CreateWeeklyExamDto } from './dto/create-weekly-exam.dto';
import { UpdateWeeklyExamDto } from './dto/update-weekly-exam.dto';
import { WeeklyExamAnswerDto } from './dto/weekly-exam-answer.dto';

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

@ApiTags('Admin – Haftalık Sınav')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/weekly-exams')
export class AdminWeeklyExamController {
  constructor(private readonly weeklyExamService: WeeklyExamService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm haftalık sınavları listele' })
  @ApiOkResponse({ description: 'Sınav listesi' })
  listWeeklyExams() {
    return this.weeklyExamService.listWeeklyExams();
  }

  @Post()
  @ApiOperation({ summary: 'Haftalık sınav oluştur (DRAFT)' })
  @ApiCreatedResponse({ description: 'Sınav oluşturuldu' })
  createWeeklyExam(
    @Body() dto: CreateWeeklyExamDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.weeklyExamService.createWeeklyExam(dto, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Sınav bilgilerini güncelle (sadece DRAFT)' })
  @ApiOkResponse({ description: 'Güncellendi' })
  updateWeeklyExam(@Param('id') id: string, @Body() dto: UpdateWeeklyExamDto) {
    return this.weeklyExamService.updateWeeklyExam(id, dto);
  }

  @Post(':id/questions')
  @ApiOperation({
    summary: 'Sınava soru ekle (manuel ID veya havuzdan otomatik)',
  })
  @ApiOkResponse({ description: 'Sorular eklendi' })
  @HttpCode(HttpStatus.OK)
  addQuestions(@Param('id') id: string, @Body() dto: AddQuestionsDto) {
    return this.weeklyExamService.addQuestions(id, dto);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Sınavı yayınla: DRAFT → PUBLISHED' })
  @ApiOkResponse({ description: 'Sınav yayınlandı' })
  @HttpCode(HttpStatus.OK)
  publishWeeklyExam(@Param('id') id: string) {
    return this.weeklyExamService.publishWeeklyExam(id);
  }

  @Post(':id/announce-results')
  @ApiOperation({
    summary: 'Sonuçları açıkla + burs dağıt. Min katılımcı yoksa iptal + iade.',
  })
  @ApiOkResponse({ description: 'Sonuçlar açıklandı' })
  @HttpCode(HttpStatus.OK)
  announceResults(@Param('id') id: string) {
    return this.weeklyExamService.announceResults(id);
  }
}

// ─── Öğrenci Endpoints ───────────────────────────────────────────────────────

@ApiTags('Haftalık Sınav')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('weekly-exams')
export class WeeklyExamController {
  constructor(private readonly weeklyExamService: WeeklyExamService) {}

  @Get('upcoming')
  @ApiOperation({ summary: 'Yaklaşan (PUBLISHED) sınavlar' })
  @ApiOkResponse({ description: 'Yaklaşan sınavlar listesi' })
  getUpcoming() {
    return this.weeklyExamService.getUpcoming();
  }

  @Get('history')
  @ApiOperation({ summary: 'Öğrencinin katıldığı sınavlar geçmişi' })
  @ApiOkResponse({ description: 'Geçmiş sınavlar' })
  getHistory(@CurrentUser() user: JwtPayload) {
    return this.weeklyExamService.getHistory(user.sub);
  }

  @Post(':id/register')
  @ApiOperation({ summary: 'Sınava kayıt ol (100 TL cüzdandan düşer)' })
  @ApiCreatedResponse({ description: 'Kayıt başarılı' })
  register(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.weeklyExamService.register(id, user.sub);
  }

  @Get(':id/enter')
  @ApiOperation({
    summary: 'Sınavı başlat – soruları döner (yalnızca sınav penceresinde)',
  })
  @ApiOkResponse({ description: 'Sınav soruları ve bilgisi' })
  enter(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.weeklyExamService.enter(id, user.sub);
  }

  @Post(':id/answer')
  @ApiOperation({ summary: 'Soru cevabı gönder' })
  @ApiOkResponse({ description: 'Cevap kaydedildi' })
  @HttpCode(HttpStatus.OK)
  submitAnswer(
    @Param('id') id: string,
    @Body() dto: WeeklyExamAnswerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.weeklyExamService.submitAnswer(id, dto, user.sub);
  }

  @Post(':id/finish')
  @ApiOperation({ summary: 'Sınavı bitir – puanı hesapla' })
  @ApiOkResponse({ description: 'Sınav sonuçları' })
  @HttpCode(HttpStatus.OK)
  finishExam(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.weeklyExamService.finishExam(id, user.sub);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Sonuçları gör (resultAnnouncedAt sonrası)' })
  @ApiOkResponse({ description: 'Sınav sonuçları ve sıralama' })
  getResults(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.weeklyExamService.getResults(id, user.sub);
  }

  @Post(':id/cheat-report')
  @ApiOperation({
    summary:
      'Kopya sinyali gönder (TAB_SWITCH / FULLSCREEN_EXIT / COPY_PASTE / SUSPICIOUS_TIMING)',
  })
  @ApiOkResponse({ description: 'Kopya kaydı işlendi' })
  @HttpCode(HttpStatus.OK)
  reportCheat(
    @Param('id') id: string,
    @Body() dto: CheatReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.weeklyExamService.reportCheat(id, dto, user.sub);
  }
}
