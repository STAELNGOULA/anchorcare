"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type HealthCompletenessBadgeProps = {
  score: number;
  className?: string;
  showLabel?: boolean;
};

export function HealthCompletenessBadge({
  score,
  className,
  showLabel = true,
}: HealthCompletenessBadgeProps) {
  const t = useTranslations("parent.family.children.healthScore");
  const tone =
    score >= 80 ? "high" : score >= 50 ? "medium" : "low";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="relative h-9 w-9"
        role="img"
        aria-label={t("aria", { score })}
      >
        <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36" aria-hidden>
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            className="stroke-secondary"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            className={cn(
              "transition-[stroke-dashoffset] duration-500 ease-out",
              tone === "high" && "stroke-primary",
              tone === "medium" && "stroke-amber-500",
              tone === "low" && "stroke-accent",
            )}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${score * 0.94} 100`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-foreground">
          {score}
        </span>
      </div>
      {showLabel ? (
        <span className="text-xs text-muted-foreground">{t(tone)}</span>
      ) : null}
    </div>
  );
}
