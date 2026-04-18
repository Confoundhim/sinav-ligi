import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { DuelsService } from './duels.service';
import { DuelGateway } from './duels.gateway';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { ChallengeDto, MatchmakingDto } from './dto/challenge.dto';

@ApiTags('Duels')
@ApiBearerAuth()
@Controller('duels')
export class DuelsController {
  constructor(
    private readonly duelsService: DuelsService,
    private readonly duelGateway: DuelGateway,
  ) {}

  // GET /duels/rights
  @ApiOperation({ summary: 'Bugünkü düello hakkı durumu' })
  @Get('rights')
  getRights(@CurrentUser() user: JwtPayload) {
    return this.duelsService.getRights(user.sub);
  }

  // GET /duels/history
  @ApiOperation({ summary: 'Geçmiş düellolar' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @Get('history')
  getHistory(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.duelsService.getHistory(user.sub, page, limit);
  }

  // GET /duels/stats
  @ApiOperation({ summary: 'Düello istatistikleri' })
  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.duelsService.getStats(user.sub);
  }

  // GET /duels/pending
  @ApiOperation({ summary: 'Bekleyen meydan okumalar' })
  @Get('pending')
  getPending(@CurrentUser() user: JwtPayload) {
    return this.duelsService.getPendingDuels(user.sub);
  }

  // GET /duels/:id
  @ApiOperation({ summary: 'Düello detayı' })
  @Get(':id')
  getDuel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.duelsService.getDuelById(id, user.sub);
  }

  // POST /duels/challenge
  @ApiOperation({ summary: 'Arkadaşa meydan oku' })
  @Post('challenge')
  async challenge(@CurrentUser() user: JwtPayload, @Body() dto: ChallengeDto) {
    const match = await this.duelsService.challenge(user.sub, dto);
    // Karşı tarafa bildirim gönder
    this.duelGateway.sendToUser(dto.opponentId, 'duel:challenge_received', {
      duelId: match.id,
      challenger: match.challenger,
      examType: match.examType,
      betPoints: match.betPoints,
    });
    return match;
  }

  // POST /duels/matchmaking
  @ApiOperation({ summary: 'Rastgele eşleşme kuyruğuna gir' })
  @Post('matchmaking')
  async joinMatchmaking(
    @CurrentUser() user: JwtPayload,
    @Body() dto: MatchmakingDto,
  ) {
    const result = await this.duelsService.joinMatchmaking(user.sub, dto);

    if ('matched' in result && result.matched && 'duel' in result) {
      const duel = result.duel as {
        id: string;
        challenger: { id: string };
        opponent: { id: string };
      };
      // Her iki tarafa eşleşme bildirimi
      this.duelGateway.sendToUser(duel.challenger.id, 'duel:matched', {
        duelId: duel.id,
        duel,
      });
      this.duelGateway.sendToUser(duel.opponent.id, 'duel:matched', {
        duelId: duel.id,
        duel,
      });
    }

    return result;
  }

  // POST /duels/matchmaking/cancel
  @ApiOperation({ summary: 'Eşleşme kuyruğundan çık' })
  @HttpCode(HttpStatus.OK)
  @Post('matchmaking/cancel')
  cancelMatchmaking(
    @CurrentUser() user: JwtPayload,
    @Body('examTypeId') examTypeId: string,
  ) {
    return this.duelsService.cancelMatchmaking(user.sub, examTypeId);
  }

  // POST /duels/:id/accept
  @ApiOperation({ summary: 'Meydan okumayı kabul et' })
  @HttpCode(HttpStatus.OK)
  @Post(':id/accept')
  async acceptDuel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const duel = await this.duelsService.acceptDuel(id, user.sub);
    // Meydan okuyana bildirim
    this.duelGateway.sendToUser(duel.challengerId, 'duel:accepted', {
      duelId: duel.id,
      duel,
    });
    // Her iki tarafa sorular gönder
    this.duelGateway.sendToRoom(`duel:${duel.id}`, 'duel:started', { duel });
    return duel;
  }

  // POST /duels/:id/decline
  @ApiOperation({ summary: 'Meydan okumayı reddet' })
  @HttpCode(HttpStatus.OK)
  @Post(':id/decline')
  async declineDuel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const duel = await this.duelsService.declineDuel(id, user.sub);
    // Meydan okuyana bildirim
    this.duelGateway.sendToUser(duel.challengerId, 'duel:declined', {
      duelId: duel.id,
    });
    return duel;
  }
}
