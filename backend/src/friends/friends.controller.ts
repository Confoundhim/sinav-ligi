import {
  Controller,
  Get,
  Post,
  Delete,
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
import { FriendsService } from './friends.service';

@ApiTags('Arkadaşlık')
@ApiBearerAuth()
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arkadaşlık isteği gönder' })
  @ApiParam({ name: 'userId', description: 'İstek gönderilecek kullanıcı ID' })
  @ApiOkResponse({ description: 'İstek gönderildi' })
  sendRequest(
    @CurrentUser() user: JwtPayload,
    @Param('userId') addresseeId: string,
  ) {
    return this.friendsService.sendRequest(user.sub, addresseeId);
  }

  @Post('accept/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arkadaşlık isteğini kabul et' })
  @ApiParam({ name: 'id', description: 'Friendship ID' })
  @ApiOkResponse({ description: 'İstek kabul edildi' })
  acceptRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') friendshipId: string,
  ) {
    return this.friendsService.acceptRequest(user.sub, friendshipId);
  }

  @Post('decline/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arkadaşlık isteğini reddet' })
  @ApiParam({ name: 'id', description: 'Friendship ID' })
  @ApiOkResponse({ description: 'İstek reddedildi' })
  declineRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') friendshipId: string,
  ) {
    return this.friendsService.declineRequest(user.sub, friendshipId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Arkadaşlıktan çıkar' })
  @ApiParam({ name: 'id', description: 'Friendship ID' })
  @ApiOkResponse({ description: 'Arkadaşlık silindi' })
  removeFriend(
    @CurrentUser() user: JwtPayload,
    @Param('id') friendshipId: string,
  ) {
    return this.friendsService.removeFriend(user.sub, friendshipId);
  }

  @Get()
  @ApiOperation({ summary: 'Arkadaş listesi' })
  @ApiOkResponse({ description: 'Arkadaş listesi' })
  getFriends(@CurrentUser() user: JwtPayload) {
    return this.friendsService.getFriends(user.sub);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Bekleyen arkadaşlık istekleri' })
  @ApiOkResponse({ description: 'Gelen ve giden istekler' })
  getPendingRequests(@CurrentUser() user: JwtPayload) {
    return this.friendsService.getPendingRequests(user.sub);
  }
}
