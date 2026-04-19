import {
  Controller,
  Get,
  Patch,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { NightModeStatus, NightModePreferences } from './dto/night-mode.dto';

interface UserSettingsResponse {
  userId: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  nightModeEnabled: boolean;
  nightModeNotifications: boolean;
  achievementPrivacy: string;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
}

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Kullanıcı ayarlarını getir' })
  @ApiOkResponse({ description: 'Kullanıcı ayarları döndürüldü' })
  async getSettings(
    @CurrentUser() user: JwtPayload,
  ): Promise<UserSettingsResponse> {
    const settings = await this.settingsService.getOrCreateSettings(user.sub);
    return settings as unknown as UserSettingsResponse;
  }

  @Patch()
  @ApiOperation({ summary: 'Kullanıcı ayarlarını güncelle' })
  @ApiOkResponse({ description: 'Ayarlar güncellendi' })
  async updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSettingsDto,
  ): Promise<UserSettingsResponse> {
    const settings = await this.settingsService.updateSettings(user.sub, dto);
    return settings as unknown as UserSettingsResponse;
  }

  @Get('night-mode')
  @ApiOperation({ summary: 'Gece mesaisi modu durumunu getir' })
  @ApiOkResponse({ description: 'Gece mesaisi durumu döndürüldü' })
  async getNightModeStatus(
    @CurrentUser() user: JwtPayload,
  ): Promise<NightModeStatus> {
    const settings = await this.settingsService.getSettings(user.sub);
    return this.settingsService.getNightModeStatus(user.sub, settings);
  }

  @Get('night-mode/preferences')
  @ApiOperation({ summary: 'Gece mesaisi tercihlerini getir' })
  @ApiOkResponse({ description: 'Gece mesaisi tercihleri döndürüldü' })
  async getNightModePreferences(
    @CurrentUser() user: JwtPayload,
  ): Promise<NightModePreferences> {
    const settings = await this.settingsService.getSettings(user.sub);
    return this.settingsService.getNightModePreferences(settings);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hesabı sil (soft delete)' })
  @ApiOkResponse({ description: 'Hesap silindi' })
  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
  async deleteAccount(@CurrentUser() _user: JwtPayload): Promise<void> {
    // TODO: Implement account deletion logic
    // This should mark the user as inactive and schedule deletion
    throw new Error('Account deletion not implemented yet');
  }
}
