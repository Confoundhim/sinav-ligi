import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Enrollment } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import type { PaytrTokenResult } from '../payments/payments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentsService } from './enrollments.service';

@ApiTags('Enrollments')
@ApiBearerAuth()
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sınava kayıt ol – ödeme başlatır, iFrame token döner',
  })
  @ApiCreatedResponse({ description: 'PayTR iFrame token ve ödeme ID' })
  async createEnrollment(
    @CurrentUser() user: JwtPayload,
    @Ip() ip: string,
    @Body() dto: CreateEnrollmentDto,
  ): Promise<PaytrTokenResult> {
    return this.enrollmentsService.initiateEnrollment(
      user.sub,
      user.email,
      ip || '127.0.0.1',
      dto,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Kullanıcının sınav kayıtları' })
  @ApiOkResponse({ description: 'Tüm enrollment kayıtları' })
  async getMyEnrollments(
    @CurrentUser() user: JwtPayload,
  ): Promise<Enrollment[]> {
    return this.enrollmentsService.getUserEnrollments(user.sub);
  }
}
