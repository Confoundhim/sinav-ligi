"use client";

import { useState, useRef, useEffect } from "react";
import { Moon, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useNightMode } from "@/providers/night-mode-provider";

// Alfa dalga ambient ses URL'i (placeholder - gerçek ses dosyası eklenebilir)
const AMBIENT_SOUND_URL = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3";

export function NightModePlayer() {
  const { isNightModeActive, isNightShiftHours } = useNightMode();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(AMBIENT_SOUND_URL);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Auto-play when night mode becomes active
  useEffect(() => {
    if (isNightModeActive && audioRef.current && !isPlaying) {
      // Don't auto-play to respect browser policies
      // Just show the player
    }
  }, [isNightModeActive, isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        // Browser might block autoplay
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Only show during night shift hours or when night mode is active
  if (!isNightShiftHours && !isNightModeActive) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300",
        isExpanded ? "w-72" : "w-auto"
      )}
    >
      <div
        className={cn(
          "rounded-2xl border backdrop-blur-xl shadow-lg overflow-hidden",
          isNightModeActive
            ? "bg-[#1f1e1d]/90 border-[rgb(232_228_220_/_0.08)]"
            : "bg-card/90 border-border/70"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 cursor-pointer",
            isNightModeActive ? "bg-[#8b9dc3]/10" : "bg-accent/10"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Moon
            className={cn(
              "h-4 w-4",
              isNightModeActive ? "text-[#8b9dc3]" : "text-accent"
            )}
          />
          <span className="text-xs font-medium">
            {isNightModeActive ? "Gece Mesaisi" : "Gece Modu"}
          </span>
          {isNightModeActive && (
            <span className="ml-auto text-[10px] text-[#6b8cae]">1.5x</span>
          )}
        </div>

        {/* Expanded Controls */}
        {isExpanded && (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <div className="flex-1">
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setVolume(value[0] / 100)}
                  className="w-full"
                />
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              Alfa dalga - Odaklanma m&#xfc;zi&#x11f;i
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
