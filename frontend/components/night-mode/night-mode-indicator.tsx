"use client";

import { Moon, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNightMode } from "@/providers/night-mode-provider";

export function NightModeIndicator() {
  const { isNightModeActive, isNightShiftHours, bonusMultiplier } = useNightMode();

  if (!isNightShiftHours && !isNightModeActive) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {isNightModeActive ? (
        <Badge
          variant="outline"
          className={cn(
            "gap-1.5 px-2.5 py-1 text-xs font-medium",
            "border-[#6b8cae]/40 bg-[#6b8cae]/10 text-[#8b9dc3]"
          )}
        >
          <Moon className="h-3 w-3" />
          <span>F&#x131;s&#x131;lt&#x131; Modu</span>
          <Sparkles className="h-3 w-3 ml-1" />
          <span className="text-[#6b8cae]">+{bonusMultiplier}x</span>
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="gap-1.5 px-2.5 py-1 text-xs font-medium border-muted bg-muted/50 text-muted-foreground"
        >
          <Moon className="h-3 w-3" />
          <span>Gece Mesaisi (Kapal&#x131;)</span>
        </Badge>
      )}
    </div>
  );
}
