import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum AchievementPrivacy {
  PUBLIC = 'PUBLIC',
  FRIENDS = 'FRIENDS',
  PRIVATE = 'PRIVATE',
}

export enum ThemePreference {
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  SYSTEM = 'SYSTEM',
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Push bildirimleri açık/kapalı',
  })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Email bildirimleri açık/kapalı',
  })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Gece mesaisi modu açık/kapalı',
  })
  @IsOptional()
  @IsBoolean()
  nightModeEnabled?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Gece mesaisi bildirimleri açık/kapalı',
  })
  @IsOptional()
  @IsBoolean()
  nightModeNotifications?: boolean;

  @ApiPropertyOptional({
    enum: AchievementPrivacy,
    example: AchievementPrivacy.PUBLIC,
    description: 'Başarı müzesi gizlilik ayarı: PUBLIC, FRIENDS, PRIVATE',
  })
  @IsOptional()
  @IsEnum(AchievementPrivacy)
  achievementPrivacy?: AchievementPrivacy;

  @ApiPropertyOptional({
    enum: ThemePreference,
    example: ThemePreference.DARK,
    description: 'Tema tercihi: DARK, LIGHT, SYSTEM',
  })
  @IsOptional()
  @IsEnum(ThemePreference)
  theme?: ThemePreference;
}
