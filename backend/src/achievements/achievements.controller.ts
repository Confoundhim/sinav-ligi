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
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AchievementsService } from './achievements.service';
import { CongratulateDto } from './dto/congratulate.dto';

@ApiTags('Başarı Müzesi')
@ApiBearerAuth()
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  // ─── Sertifika Duvarı ─────────────────────────────────────────────────────

  @Get('certificates')
  @ApiOperation({ summary: 'Sertifika duvarım' })
  @ApiOkResponse({ description: 'Kullanıcının sertifikaları' })
  getCertificates(@CurrentUser() user: JwtPayload) {
    return this.achievementsService.getCertificates(user.sub);
  }

  // ─── Kupa Rafı ────────────────────────────────────────────────────────────

  @Get('trophies')
  @ApiOperation({ summary: 'Kupa rafım' })
  @ApiOkResponse({ description: 'Kullanıcının kupaları' })
  getTrophies(@CurrentUser() user: JwtPayload) {
    return this.achievementsService.getTrophies(user.sub);
  }

  // ─── Bilgelik Ağacı ───────────────────────────────────────────────────────

  @Get('wisdom-tree')
  @ApiOperation({ summary: 'Bilgelik ağacım (ders bazlı dal+yaprak durumu)' })
  @ApiOkResponse({ description: 'Bilgelik ağacı verisi' })
  getWisdomTree(@CurrentUser() user: JwtPayload) {
    return this.achievementsService.getWisdomTree(user.sub);
  }

  // ─── Müze: Başka Kullanıcı ────────────────────────────────────────────────

  @Get('museum/:userId')
  @ApiOperation({
    summary: 'Kullanıcı müzesini görüntüle (gizlilik ayarına bağlı)',
  })
  @ApiParam({
    name: 'userId',
    description: 'Müzesi görüntülenecek kullanıcı ID',
  })
  @ApiOkResponse({
    description: 'Kullanıcı müzesi (sertifika, kupa, bilgelik ağacı)',
  })
  getMuseum(
    @CurrentUser() viewer: JwtPayload,
    @Param('userId') targetUserId: string,
  ) {
    return this.achievementsService.getMuseum(viewer.sub, targetUserId);
  }

  // ─── Müze: Tebrik Et ──────────────────────────────────────────────────────

  @Post('museum/:userId/congratulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kullanıcıyı müzesi için tebrik et' })
  @ApiParam({ name: 'userId', description: 'Tebrik edilecek kullanıcı ID' })
  @ApiOkResponse({ description: 'Tebrik gönderildi' })
  congratulate(
    @CurrentUser() user: JwtPayload,
    @Param('userId') toUserId: string,
    @Body() dto: CongratulateDto,
  ) {
    return this.achievementsService.congratulate(
      user.sub,
      toUserId,
      dto.message,
    );
  }
}
