"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Car } from "lucide-react";
import type { PickupOverrideSummary } from "@/lib/pickups/types";
import { formatPickupCountdown } from "@/lib/pickups/countdown";
import { cn } from "@/lib/utils";

type PickupOverrideIndicatorProps = {
  override?: PickupOverrideSummary | null;
  active?: boolean;
  className?: string;
  showCountdown?: boolean;
};

export function PickupOverrideIndicator({
  override,
  active,
  className,
  showCountdown = false,
}: PickupOverrideIndicatorProps) {
  const t = useTranslations("roster.pickup");
  const isActive = override?.active ?? active ?? false;
  const [countdown, setCountdown] = useState<string | null>(
    formatPickupCountdown(override?.expiresAt),
  );

  useEffect(() => {
    if (!isActive || !override?.expiresAt) return;
    const tick = () => setCountdown(formatPickupCountdown(override.expiresAt));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [isActive, override?.expiresAt]);

  if (!isActive) return null;

  const label = override?.personName
    ? t("overridePerson", { name: override.personName })
    : t("overrideShort");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-900 dark:text-amber-100",
        className,
      )}
      title={
        countdown && showCountdown
          ? t("overrideExpires", { countdown })
          : t("overrideToday")
      }
    >
      <Car className="h-3 w-3 shrink-0" aria-hidden />
      <span className="max-w-[8rem] truncate">{label}</span>
      {showCountdown && countdown ? (
        <span className="tabular-nums opacity-80">· {countdown}</span>
      ) : null}
    </span>
  );
}
