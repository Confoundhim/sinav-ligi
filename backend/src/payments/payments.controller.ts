import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Payment } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaytrCallbackDto } from './dto/paytr-callback.dto';
import { PaymentsService } from './payments.service';
import type { PaytrTokenResult } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ödeme başlat – PayTR iFrame token al' })
  @ApiOkResponse({ description: 'iFrame token ve ödeme ID döner' })
  async createPayment(
    @CurrentUser() user: JwtPayload,
    @Ip() ip: string,
    @Body() dto: CreatePaymentDto,
  ): Promise<PaytrTokenResult> {
    return this.paymentsService.createPayment(
      user.sub,
      user.email,
      ip || '127.0.0.1',
      dto,
    );
  }

  @Public()
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/plain')
  @ApiOperation({
    summary: 'PayTR bildirim URL (webhook) – @Public, hash doğrulamalı',
  })
  async handleCallback(@Body() dto: PaytrCallbackDto): Promise<string> {
    return this.paymentsService.handleCallback(dto);
  }

  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanıcının ödeme geçmişi' })
  @ApiOkResponse({ description: 'Son 50 ödeme kaydı' })
  async getHistory(@CurrentUser() user: JwtPayload): Promise<Payment[]> {
    return this.paymentsService.getHistory(user.sub);
  }
}
