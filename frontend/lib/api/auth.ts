import { apiRequest, clearTokens, setTokens } from "./client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "./types";

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setTokens(res.accessToken, res.refreshToken);
  return res;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setTokens(res.accessToken, res.refreshToken);
  return res;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<void>("/auth/logout", { method: "POST" });
  } finally {
    clearTokens();
  }
}
