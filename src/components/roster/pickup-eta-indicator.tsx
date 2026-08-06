"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import type { PickupEtaRosterSummary } from "@/lib/pickups/pickup-eta-roster";
import { cn } from "@/lib/utils";

type PickupEtaIndicatorProps = {
  eta?: PickupEtaRosterSummary | null;
  className?: string;
  showCountdown?: boolean;
};

function formatEtaCountdown(expectedAt: string): string | null {
  const diff = new Date(expectedAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const mins = Math.ceil(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatEtaTime(expectedAt: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(expectedAt));
}

export function PickupEtaIndicator({
  eta,
  className,
  showCountdown = false,
}: PickupEtaIndicatorProps) {
  const t = useTranslations("roster.pickup");
  const expectedAt = eta?.expectedAt ?? null;
  const [countdown, setCountdown] = useState<string | null>(
    expectedAt ? formatEtaCountdown(expectedAt) : null,
  );

  useEffect(() => {
    if (!expectedAt) return;
    const tick = () => setCountdown(formatEtaCountdown(expectedAt));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [expectedAt]);

  if (!eta?.active || !expectedAt) return null;

  const timeLabel = formatEtaTime(expectedAt);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:text-amber-100",
        className,
      )}
      title={
        eta.note
          ? t("etaNote", { note: eta.note })
          : t("etaArrival", { time: timeLabel })
      }
    >
      <Clock className="h-3 w-3 shrink-0" aria-hidden />
      <span className="max-w-[9rem] truncate">
        {t("etaShort", { time: timeLabel })}
      </span>
      {showCountdown && countdown ? (
        <span className="tabular-nums opacity-80">· {countdown}</span>
      ) : null}
    </span>
  );
}
