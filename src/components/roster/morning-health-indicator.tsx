"use client";

import { useTranslations } from "next-intl";
import { Thermometer } from "lucide-react";
import type { MorningHealthRosterSummary } from "@/lib/health/health-check-roster";
import { cn } from "@/lib/utils";

type MorningHealthIndicatorProps = {
  health?: MorningHealthRosterSummary | null;
  className?: string;
};

export function MorningHealthIndicator({
  health,
  className,
}: MorningHealthIndicatorProps) {
  const t = useTranslations("roster.health");

  if (!health) return null;

  const statusKey =
    health.status === "healthy"
      ? "healthy"
      : health.status === "mild_symptoms"
        ? "mild"
        : "stayingHome";

  const tone =
    health.status === "healthy"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-950 dark:text-emerald-100"
      : health.status === "mild_symptoms"
        ? "border-amber-500/40 bg-amber-500/15 text-amber-950 dark:text-amber-100"
        : "border-red-500/40 bg-red-500/15 text-red-950 dark:text-red-100";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        tone,
        className,
      )}
      title={
        health.note
          ? t("note", { note: health.note })
          : t(`status.${statusKey}`)
      }
    >
      <Thermometer className="h-3 w-3 shrink-0" aria-hidden />
      <span className="max-w-[9rem] truncate">{t(`short.${statusKey}`)}</span>
    </span>
  );
}
