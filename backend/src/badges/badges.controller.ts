import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { BadgesService } from './badges.service';
import { CheckBadgeDto } from './dto/check-badge.dto';

@ApiTags('Rozetler')
@ApiBearerAuth()
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  // GET /badges — tüm rozetler
  @Get()
  @ApiOperation({ summary: 'Tüm rozet tanımları' })
  @ApiOkResponse({ description: 'Rozet listesi' })
  findAll(@CurrentUser() _user: JwtPayload) {
    return this.badgesService.findAll();
  }

  // GET /badges/me — kullanıcının kazandıkları
  @Get('me')
  @ApiOperation({ summary: 'Kazandığım rozetler' })
  findMyBadges(@CurrentUser() user: JwtPayload) {
    return this.badgesService.findMyBadges(user.sub);
  }

  // POST /badges/check — internal rozet hak ediş kontrolü (sınav/düello sonrası tetiklenir)
  @Post('check')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary:
      'Rozet hak ediş kontrolü (internal — sınav/düello/karantina sonrası)',
  })
  checkBadge(@Body() dto: CheckBadgeDto) {
    return this.badgesService.checkBadges(dto.userId, dto.event, dto.metadata);
  }

  // POST /badges/weekly/duel-winner — haftalık düello ödülü (admin tetikler)
  @Post('weekly/duel-winner')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Haftanın düello galibi rozetini ver' })
  awardWeeklyDuelWinner() {
    return this.badgesService.awardWeeklyDuelWinner();
  }

  // POST /badges/weekly/most-improved — haftalık en gelişen (admin tetikler)
  @Post('weekly/most-improved')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Haftanın en gelişeni rozetini ver' })
  awardWeeklyMostImproved(@Body('userId') userId: string) {
    return this.badgesService.awardWeeklyMostImproved(userId);
  }
}
