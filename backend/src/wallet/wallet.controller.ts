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
import type { Wallet, WalletTransaction } from '@prisma/client';
import { PaymentType } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { PaymentsService } from '../payments/payments.service';
import type { PaytrTokenResult } from '../payments/payments.service';
import { DepositDto } from './dto/deposit.dto';
import { WalletService } from './wallet.service';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Cüzdan bakiyesi ve genel bilgi' })
  @ApiOkResponse({ description: 'Cüzdan bakiyesi ve son 50 işlem' })
  async getWallet(
    @CurrentUser() user: JwtPayload,
  ): Promise<Wallet & { transactions: WalletTransaction[] }> {
    return this.walletService.getWalletWithTransactions(user.sub);
  }

  @Post('deposit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bakiye yükleme – PayTR iFrame token al' })
  @ApiCreatedResponse({ description: 'PayTR iFrame token ve ödeme ID döner' })
  async deposit(
    @CurrentUser() user: JwtPayload,
    @Ip() ip: string,
    @Body() dto: DepositDto,
  ): Promise<PaytrTokenResult> {
    return this.paymentsService.createPayment(
      user.sub,
      user.email,
      ip || '127.0.0.1',
      {
        type: PaymentType.DEPOSIT,
        amount: dto.amount,
        description: `${dto.amount} TL cüzdan yükleme`,
      },
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Cüzdan işlem geçmişi' })
  @ApiOkResponse({ description: 'Son 100 cüzdan işlemi' })
  async getTransactions(
    @CurrentUser() user: JwtPayload,
  ): Promise<WalletTransaction[]> {
    return this.walletService.getTransactions(user.sub);
  }
}
