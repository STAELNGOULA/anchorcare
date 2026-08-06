"use client";

import { useTranslations } from "next-intl";
import type { ClearanceStatus } from "@/lib/roster/types";
import { cn } from "@/lib/utils";

const BADGE_CLASS: Record<ClearanceStatus, string> = {
  cleared:
    "bg-emerald-600/12 text-emerald-800 dark:text-emerald-200 border-emerald-600/25",
  pending:
    "bg-amber-500/12 text-amber-900 dark:text-amber-100 border-amber-500/25",
  hold: "bg-red-600/12 text-red-800 dark:text-red-200 border-red-600/25",
};

type ClearanceBadgeProps = {
  status: ClearanceStatus;
  className?: string;
};

export function ClearanceBadge({ status, className }: ClearanceBadgeProps) {
  const t = useTranslations("roster.clearance");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        BADGE_CLASS[status],
        className,
      )}
    >
      {t(status)}
    </span>
  );
}
