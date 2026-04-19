import { apiRequest } from "./client";
import type {
  UserSettings,
  UpdateSettingsRequest,
  NightModeStatus,
  NightModePreferences,
} from "./types";

export async function getSettings(): Promise<UserSettings> {
  return apiRequest<UserSettings>("/settings");
}

export async function updateSettings(
  data: UpdateSettingsRequest
): Promise<UserSettings> {
  return apiRequest<UserSettings>("/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getNightModeStatus(): Promise<NightModeStatus> {
  return apiRequest<NightModeStatus>("/settings/night-mode");
}

export async function getNightModePreferences(): Promise<NightModePreferences> {
  return apiRequest<NightModePreferences>("/settings/night-mode/preferences");
}

export async function deleteAccount(): Promise<void> {
  return apiRequest<void>("/settings", {
    method: "DELETE",
  });
}
