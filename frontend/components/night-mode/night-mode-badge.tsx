"use client";

import { Moon, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNightMode } from "@/providers/night-mode-provider";

interface NightModeBadgeProps {
  className?: string;
}

export function NightModeBadge({ className }: NightModeBadgeProps) {
  const { isNightModeActive, isNightShiftHours } = useNightMode();

  if (!isNightModeActive) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl",
        "bg-gradient-to-r from-[#8b9dc3]/20 to-[#6b8cae]/10",
        "border border-[#8b9dc3]/30",
        className
      )}
    >
      <div className="relative">
        <Moon className="h-5 w-5 text-[#8b9dc3]" />
        <Star className="h-2.5 w-2.5 text-[#6b8cae] absolute -top-0.5 -right-0.5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-medium text-[#8b9dc3]">Gece Mesaisi</span>
        <span className="text-[10px] text-[#6b8cae]">1.5x Bonus Aktif</span>
      </div>
    </div>
  );
}
