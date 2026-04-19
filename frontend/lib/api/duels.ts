import { apiRequest } from "./client";
import type {
  ChallengeRequest,
  Duel,
  DuelRights,
  DuelStats,
  MatchmakingRequest,
  MatchmakingResponse,
  PaginatedResponse,
} from "./types";

export async function getDuelRights(): Promise<DuelRights> {
  return apiRequest<DuelRights>("/duels/rights");
}

export async function getDuelHistory(
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<Duel>> {
  return apiRequest<PaginatedResponse<Duel>>(
    `/duels/history?page=${page}&limit=${limit}`,
  );
}

export async function getDuelStats(): Promise<DuelStats> {
  return apiRequest<DuelStats>("/duels/stats");
}

export async function getPendingDuels(): Promise<Duel[]> {
  return apiRequest<Duel[]>("/duels/pending");
}

export async function getDuelById(id: string): Promise<Duel> {
  return apiRequest<Duel>(`/duels/${id}`);
}

export async function challengeOpponent(
  data: ChallengeRequest,
): Promise<Duel> {
  return apiRequest<Duel>("/duels/challenge", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function joinMatchmaking(
  data: MatchmakingRequest,
): Promise<MatchmakingResponse> {
  return apiRequest<MatchmakingResponse>("/duels/matchmaking", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function cancelMatchmaking(examTypeId: string): Promise<void> {
  await apiRequest<void>("/duels/matchmaking/cancel", {
    method: "POST",
    body: JSON.stringify({ examTypeId }),
  });
}

export async function acceptDuel(id: string): Promise<Duel> {
  return apiRequest<Duel>(`/duels/${id}/accept`, {
    method: "POST",
  });
}

export async function declineDuel(id: string): Promise<Duel> {
  return apiRequest<Duel>(`/duels/${id}/decline`, {
    method: "POST",
  });
}

export async function submitDuelAnswer(
  duelId: string,
  questionId: string,
  answer: string,
  timeSpent: number,
): Promise<void> {
  await apiRequest<void>(`/duels/${duelId}/answer`, {
    method: "POST",
    body: JSON.stringify({ questionId, answer, timeSpent }),
  });
}
