export interface NightModeStatus {
  isActive: boolean;
  isNightShiftHours: boolean;
  startHour: number;
  endHour: number;
  currentHour: number;
  bonusMultiplier: number;
  message: string;
}

export interface NightModePreferences {
  nightModeEnabled: boolean;
  nightModeNotifications: boolean;
}
