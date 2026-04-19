"use client";

import { useEffect } from "react";
import { useNightMode } from "@/providers/night-mode-provider";

export function NightModeStyles() {
  const { isNightModeActive } = useNightMode();

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isNightModeActive) {
        document.body.classList.add("night-mode-active");
      } else {
        document.body.classList.remove("night-mode-active");
      }
    }
  }, [isNightModeActive]);

  return null;
}
