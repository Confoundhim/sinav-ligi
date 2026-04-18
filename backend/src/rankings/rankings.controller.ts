import {
  Controller,
  Get,
  Post,
  Query,
  Body,
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
import { RankingPeriod, UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RankingsService } from './rankings.service';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

@ApiTags('Sıralama')
@ApiBearerAuth()
@Controller('rankings')
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  // GET /rankings/leaderboard?period=WEEKLY&examTypeId=X&page=1
  @Get('leaderboard')
  @ApiOperation({ summary: 'Sıralama tablosu (günlük/haftalık/aylık) — top 100, sayfalı' })
  @ApiOkResponse({ description: 'Sıralama listesi' })
  getLeaderboard(
    @Query() query: LeaderboardQueryDto,
    @CurrentUser() _user: JwtPayload,
  ) {
    const {
      period = RankingPeriod.WEEKLY,
      examTypeId = '',
      page = 1,
    } = query;
    return this.rankingsService.getLeaderboard(period, examTypeId, page);
  }

  // GET /rankings/me
  @Get('me')
  @ApiOperation({ summary: 'Kendi sıram ve puanım' })
  @ApiQuery({ name: 'examTypeId', required: false })
  @ApiQuery({ name: 'period', enum: RankingPeriod, required: false })
  getMyRanking(
    @Query('examTypeId') examTypeId: string,
    @Query('period') period: RankingPeriod = RankingPeriod.WEEKLY,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rankingsService.getMyRanking(user.sub, examTypeId ?? '', period);
  }

  // GET /rankings/top3
  @Get('top3')
  @ApiOperation({ summary: 'Aylık ilk 3 — burs adayları (10.000 TL)' })
  @ApiQuery({ name: 'examTypeId', required: false })
  getTop3(
    @Query('examTypeId') examTypeId: string,
    @CurrentUser() _user: JwtPayload,
  ) {
    return this.rankingsService.getTop3(examTypeId ?? '');
  }

  // GET /rankings/prestige
  @Get('prestige')
  @ApiOperation({ summary: 'Prestij ödüllü kullanıcılar' })
  getPrestige(@CurrentUser() _user: JwtPayload) {
    return this.rankingsService.getPrestige();
  }

  // GET /rankings/history
  @Get('history')
  @ApiOperation({ summary: 'Geçmiş sıralamalarım (DB snapshot)' })
  getHistory(@CurrentUser() user: JwtPayload) {
    return this.rankingsService.getHistory(user.sub);
  }

  // POST /rankings/snapshot (admin)
  @Post('snapshot')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Anlık sıralamayı DB\'ye yaz (snapshot)' })
  takeSnapshot(
    @Body('examTypeId') examTypeId: string,
    @Body('period') period: RankingPeriod,
  ) {
    return this.rankingsService.takeSnapshot(examTypeId, period);
  }

  // POST /rankings/prestige/evaluate (admin — haftalık tetikle)
  @Post('prestige/evaluate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Haftalık prestij ödülünü değerlendir' })
  evaluatePrestige(
    @Body('examTypeId') examTypeId: string,
  ) {
    return this.rankingsService.evaluateWeeklyPrestige(examTypeId);
  }
}
