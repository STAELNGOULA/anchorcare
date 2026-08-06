"use client";

import { useRef } from "react";
import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type AudioPlayerPanelProps = {
  audioUrl: string | null;
  durationMs: number | null;
  transcript: string | null;
  showTranscript: boolean;
  onToggleTranscript: () => void;
};

function formatDuration(ms: number | null): string {
  if (!ms) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function AudioPlayerPanel({
  audioUrl,
  durationMs,
  transcript,
  showTranscript,
  onToggleTranscript,
}: AudioPlayerPanelProps) {
  const t = useTranslations("coach.report.review");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      await el.play();
    } else {
      el.pause();
    }
  };

  return (
    <div className="sticky top-4 space-y-5 rounded-[1.25rem] bg-card p-5 ring-1 ring-border/50 lg:p-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {t("audioLabel")}
        </p>
        <p className="mt-1 font-display text-xl text-foreground">{t("audioTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("audioDuration", { duration: formatDuration(durationMs) })}
        </p>
      </div>

      {audioUrl ? (
        <>
          <audio ref={audioRef} src={audioUrl} preload="metadata" className="sr-only" />
          <button
            type="button"
            onClick={() => void togglePlay()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm text-background transition-transform duration-200 ease-out active:scale-[0.98]"
          >
            <Play className="size-4" />
            {t("playAudio")}
          </button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noAudio")}</p>
      )}

      {transcript ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onToggleTranscript}
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            {showTranscript ? t("hideTranscript") : t("showTranscript")}
          </button>
          {showTranscript ? (
            <p className="max-h-48 overflow-y-auto rounded-[0.875rem] bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
              {transcript}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
