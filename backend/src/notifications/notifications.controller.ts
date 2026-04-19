import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  NotFoundException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { GetNotificationsDto } from './dto/get-notifications.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications (paginated)' })
  @ApiOkResponse({
    description: 'Returns paginated notifications with unread count',
  })
  async getNotifications(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetNotificationsDto,
  ) {
    return this.notificationsService.getUserNotifications(
      user.sub,
      query.page,
      query.limit,
      query.unreadOnly,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiOkResponse({ description: 'Returns unread count' })
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUnreadCount(user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiOkResponse({ description: 'Notification marked as read' })
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') notificationId: string,
  ) {
    const result = await this.notificationsService.markAsRead(
      notificationId,
      user.sub,
    );
    if (!result) {
      throw new NotFoundException('Bildirim bulunamadı');
    }
    return result;
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiOkResponse({ description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }
}
