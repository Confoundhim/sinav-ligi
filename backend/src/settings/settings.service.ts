import { Injectable } from '@nestjs/common';
import {
  UpdateSettingsDto,
  AchievementPrivacy,
  ThemePreference,
} from './dto/update-settings.dto';
import { NightModeStatus, NightModePreferences } from './dto/night-mode.dto';

interface UserSettings {
  userId: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  nightModeEnabled: boolean;
  nightModeNotifications: boolean;
  achievementPrivacy: AchievementPrivacy;
  theme: ThemePreference;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SettingsService {
  // Gece mesaisi saatleri: 23:00 - 02:00
  private readonly NIGHT_SHIFT_START = 23;
  private readonly NIGHT_SHIFT_END = 2;
  private readonly BONUS_MULTIPLIER = 1.5;

  // eslint-disable-next-line @typescript-eslint/require-await
  async getSettings(userId: string): Promise<UserSettings | null> {
    void userId;
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getOrCreateSettings(userId: string): Promise<UserSettings> {
    void userId;
    return {
      userId,
      pushNotifications: true,
      emailNotifications: true,
      nightModeEnabled: true,
      nightModeNotifications: true,
      achievementPrivacy: AchievementPrivacy.PUBLIC,
      theme: ThemePreference.DARK,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async updateSettings(
    userId: string,
    dto: UpdateSettingsDto,
  ): Promise<UserSettings> {
    void userId;
    return {
      userId,
      pushNotifications: dto.pushNotifications ?? true,
      emailNotifications: dto.emailNotifications ?? true,
      nightModeEnabled: dto.nightModeEnabled ?? true,
      nightModeNotifications: dto.nightModeNotifications ?? true,
      achievementPrivacy: dto.achievementPrivacy ?? AchievementPrivacy.PUBLIC,
      theme: dto.theme ?? ThemePreference.DARK,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  getNightModeStatus(
    userId: string,
    userSettings?: UserSettings | null,
  ): NightModeStatus {
    const now = new Date();
    const currentHour = now.getHours();

    // Gece mesaisi saatleri: 23:00 - 02:00
    const isNightShiftHours =
      currentHour >= this.NIGHT_SHIFT_START ||
      currentHour < this.NIGHT_SHIFT_END;

    // Kullanıcı tercihlerini kontrol et
    const nightModeEnabled = userSettings?.nightModeEnabled ?? true;

    // Gece mesaisi aktif mi? (Saat uygun ve kullanıcı açık bırakmışsa)
    const isActive = isNightShiftHours && nightModeEnabled;

    return {
      isActive,
      isNightShiftHours,
      startHour: this.NIGHT_SHIFT_START,
      endHour: this.NIGHT_SHIFT_END,
      currentHour,
      bonusMultiplier: isActive ? this.BONUS_MULTIPLIER : 1.0,
      message: isActive
        ? 'Gece mesaisi aktif! 1.5x bonus puan kazanıyorsunuz.'
        : isNightShiftHours
          ? 'Gece mesaisi saatleri ama mod kapalı.'
          : 'Gece mesaisi saatleri değil (23:00-02:00).',
    };
  }

  getNightModePreferences(
    userSettings?: UserSettings | null,
  ): NightModePreferences {
    return {
      nightModeEnabled: userSettings?.nightModeEnabled ?? true,
      nightModeNotifications: userSettings?.nightModeNotifications ?? true,
    };
  }

  isNightShiftActive(userSettings?: UserSettings | null): boolean {
    const status = this.getNightModeStatus('', userSettings);
    return status.isActive;
  }

  getBonusMultiplier(userSettings?: UserSettings | null): number {
    const status = this.getNightModeStatus('', userSettings);
    return status.bonusMultiplier;
  }
}
