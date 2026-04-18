"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { logout as apiLogout } from "@/lib/api/auth";
import { clearTokens } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

// ─── State ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  loading: boolean;
}

type AuthAction =
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_LOADING"; payload: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
  });

  useEffect(() => {
    const stored = localStorage.getItem("sl_user");
    if (stored) {
      try {
        dispatch({ type: "SET_USER", payload: JSON.parse(stored) as User });
      } catch {
        localStorage.removeItem("sl_user");
      }
    }
    dispatch({ type: "SET_LOADING", payload: false });
  }, []);

  const setUser = useCallback((user: User | null) => {
    dispatch({ type: "SET_USER", payload: user });
    if (user) {
      localStorage.setItem("sl_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("sl_user");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      clearTokens();
    }
    setUser(null);
    router.push("/auth/login");
  }, [router, setUser]);

  return (
    <AuthContext.Provider
      value={{ user: state.user, loading: state.loading, setUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
