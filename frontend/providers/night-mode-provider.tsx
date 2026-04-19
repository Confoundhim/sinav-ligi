"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getNightModeStatus, getNightModePreferences } from "@/lib/api/settings";
import type { NightModeStatus, NightModePreferences } from "@/lib/api/types";

interface NightModeContextType {
  isNightModeActive: boolean;
  isNightShiftHours: boolean;
  bonusMultiplier: number;
  nightModeEnabled: boolean;
  nightModeNotifications: boolean;
  isLoading: boolean;
  refreshNightMode: () => Promise<void>;
  toggleNightMode: () => void;
}

const NightModeContext = createContext<NightModeContextType | undefined>(
  undefined
);

const LOCAL_STORAGE_KEY = "sinavligi_night_mode_override";

export function NightModeProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<NightModeStatus | null>(null);
  const [preferences, setPreferences] = useState<NightModePreferences | null>(
    null
  );
  const [manualOverride, setManualOverride] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load manual override from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved !== null) {
        setManualOverride(saved === "true");
      }
    }
  }, []);

  const fetchNightModeData = useCallback(async () => {
    try {
      const [statusData, prefsData] = await Promise.all([
        getNightModeStatus(),
        getNightModePreferences(),
      ]);
      setStatus(statusData);
      setPreferences(prefsData);
    } catch (error) {
      console.error("Failed to fetch night mode data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNightModeData();

    // Refresh every minute to check hour changes
    const interval = setInterval(fetchNightModeData, 60000);
    return () => clearInterval(interval);
  }, [fetchNightModeData]);

  const toggleNightMode = useCallback(() => {
    const newValue = manualOverride === null ? false : !manualOverride;
    setManualOverride(newValue);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, String(newValue));
    }
  }, [manualOverride]);

  const refreshNightMode = useCallback(async () => {
    setIsLoading(true);
    await fetchNightModeData();
  }, [fetchNightModeData]);

  // Determine effective night mode state
  const isNightShiftHours = status?.isNightShiftHours ?? false;
  const nightModeEnabled = preferences?.nightModeEnabled ?? true;
  
  // Manual override takes precedence, otherwise use automatic detection
  const isNightModeActive =
    manualOverride !== null
      ? manualOverride
      : status?.isActive ?? false;

  const value: NightModeContextType = {
    isNightModeActive,
    isNightShiftHours,
    bonusMultiplier: status?.bonusMultiplier ?? 1.0,
    nightModeEnabled,
    nightModeNotifications: preferences?.nightModeNotifications ?? true,
    isLoading,
    refreshNightMode,
    toggleNightMode,
  };

  return (
    <NightModeContext.Provider value={value}>
      {children}
    </NightModeContext.Provider>
  );
}

export function useNightMode() {
  const context = useContext(NightModeContext);
  if (context === undefined) {
    throw new Error("useNightMode must be used within a NightModeProvider");
  }
  return context;
}
