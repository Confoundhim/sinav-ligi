const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sl_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sl_refresh_token");
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem("sl_access_token", accessToken);
  localStorage.setItem("sl_refresh_token", refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem("sl_access_token");
  localStorage.removeItem("sl_refresh_token");
  localStorage.removeItem("sl_user");
}

// ─── Token refresh logic ──────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function doRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    throw new Error("Session expired");
  }

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

// ─── Core request function ────────────────────────────────────────────────────

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const accessToken = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const makeRequest = (token?: string) => {
    const h = { ...headers };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return fetch(`${API_BASE}${path}`, { ...options, headers: h });
  };

  let res = await makeRequest();

  // 401 → try token refresh
  if (res.status === 401 && accessToken) {
    if (!isRefreshing) {
      isRefreshing = true;
      let newToken: string | null = null;
      try {
        newToken = await doRefresh();
        refreshQueue.forEach((cb) => cb(newToken));
      } catch {
        refreshQueue.forEach((cb) => cb(null));
      } finally {
        refreshQueue = [];
        isRefreshing = false;
      }
      if (newToken) {
        res = await makeRequest(newToken);
      } else {
        throw new Error("Session expired");
      }
    } else {
      // Queue the retry
      const newToken = await new Promise<string | null>((resolve) => {
        refreshQueue.push(resolve);
      });
      if (newToken) {
        res = await makeRequest(newToken);
      } else {
        throw new Error("Session expired");
      }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}
