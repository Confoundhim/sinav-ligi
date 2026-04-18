import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionFilterDto } from './dto/question-filter.dto';

// ─── Admin: Soru Yönetimi ─────────────────────────────────────────────────

@ApiTags('Admin - Sorular')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/questions')
export class AdminQuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni soru ekle' })
  @ApiCreatedResponse({ description: 'Soru oluşturuldu' })
  create(@Body() dto: CreateQuestionDto) {
    return this.questionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Soru listesi (filtreleme destekli)' })
  @ApiOkResponse({ description: 'Sayfalanmış soru listesi' })
  findAll(@Query() filter: QuestionFilterDto) {
    return this.questionsService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Soru detayı' })
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Soru güncelle' })
  update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soru sil (soft delete)' })
  remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}

// ─── Müfredat (herkes erişebilir) ─────────────────────────────────────────

@ApiTags('Müfredat')
@Controller()
export class CurriculumController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Public()
  @Get('exam-types')
  @ApiOperation({ summary: 'Aktif sınav türleri' })
  getExamTypes() {
    return this.questionsService.getExamTypes();
  }

  @Public()
  @Get('exam-types/:id/subjects')
  @ApiOperation({ summary: 'Sınav türüne göre dersler' })
  getSubjectsByExamType(@Param('id') id: string) {
    return this.questionsService.getSubjectsByExamType(id);
  }

  @Public()
  @Get('subjects/:id/question-types')
  @ApiOperation({ summary: 'Derse göre soru tipleri (video ve soru sayısıyla)' })
  getQuestionTypesBySubject(@Param('id') id: string) {
    return this.questionsService.getQuestionTypesBySubject(id);
  }

  @Public()
  @Get('question-types/:id')
  @ApiOperation({ summary: 'Soru tipi detayı' })
  getQuestionType(@Param('id') id: string) {
    return this.questionsService.getQuestionType(id);
  }
}
