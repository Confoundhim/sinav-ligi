import { apiRequest } from "./client";
import type {
  BadgeDefinition,
  Certificate,
  CongratulateRequest,
  Museum,
  Trophy,
  UserBadge,
  WisdomTree,
} from "./types";

// ─── Sertifika Duvarı ─────────────────────────────────────────────────────────

export async function getCertificates(): Promise<Certificate[]> {
  return apiRequest<Certificate[]>("/achievements/certificates");
}

// ─── Kupa Rafı ────────────────────────────────────────────────────────────────

export async function getTrophies(): Promise<Trophy[]> {
  return apiRequest<Trophy[]>("/achievements/trophies");
}

// ─── Bilgelik Ağacı ───────────────────────────────────────────────────────────

export async function getWisdomTree(): Promise<WisdomTree> {
  return apiRequest<WisdomTree>("/achievements/wisdom-tree");
}

// ─── Müze: Başka Kullanıcı ────────────────────────────────────────────────────

export async function getMuseum(userId: string): Promise<Museum> {
  return apiRequest<Museum>(`/achievements/museum/${userId}`);
}

export async function congratulateUser(
  userId: string,
  data: CongratulateRequest,
): Promise<void> {
  await apiRequest<void>(`/achievements/museum/${userId}/congratulate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Rozetler ─────────────────────────────────────────────────────────────────

export async function getAllBadges(): Promise<BadgeDefinition[]> {
  return apiRequest<BadgeDefinition[]>("/badges");
}

export async function getMyBadges(): Promise<UserBadge[]> {
  return apiRequest<UserBadge[]>("/badges/me");
}
